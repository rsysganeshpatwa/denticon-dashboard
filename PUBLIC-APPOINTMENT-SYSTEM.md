# Public Appointment Booking System - Implementation Plan

## 🎯 System Overview

**Public-facing appointment form** where new patients can book appointments online without login.

---

## 📋 User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      PUBLIC USER                            │
│              (No login required)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Open Appointment Form   │
              │  (Public URL)            │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   Fill Patient Details   │
              │  - Name                  │
              │  - Gender                │
              │  - Age                   │
              │  - Diagnosis/History     │
              │  - Phone/Email           │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   Select Location        │
              │  (Clinic/Branch)         │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   Select Provider        │
              │  (Optional)              │
              │  - If selected:          │
              │    Show available slots  │
              │  - If not selected:      │
              │    Auto-assign provider  │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Select Date & Time      │
              │  (Available slots only)  │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │    Submit Request        │
              │  Status: "Pending"       │
              └────────────┬─────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
    ┌────────────────────┐  ┌────────────────────┐
    │  ADMIN Dashboard   │  │ PROVIDER Dashboard │
    │  - See all         │  │ - See only their   │
    │    requests        │  │   requests         │
    │  - Can approve/    │  │ - Can approve/     │
    │    reject          │  │   reject           │
    └──────────┬─────────┘  └────────┬───────────┘
               │                     │
               └──────────┬──────────┘
                          ▼
              ┌──────────────────────────┐
              │  Review Request          │
              │  - View patient details  │
              │  - Check availability    │
              │  - Approve or Reject     │
              └────────────┬─────────────┘
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
    ┌────────────────────┐  ┌────────────────────┐
    │   APPROVE          │  │    REJECT          │
    │ Status: "Confirmed"│  │ Status: "Rejected" │
    │ Send confirmation  │  │ Send notification  │
    │ Email/SMS          │  │ Email/SMS          │
    └────────────────────┘  └────────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Patient receives        │
              │  confirmation with       │
              │  appointment details     │
              └──────────────────────────┘
```

---

## 🗄️ Database Schema

### 1. Locations Table (New)
```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO locations (name, address, city, state) VALUES
('Main Clinic', '123 Medical Center Drive', 'San Francisco', 'CA'),
('Downtown Branch', '456 Market Street', 'San Francisco', 'CA'),
('North Branch', '789 Bay Area Blvd', 'Oakland', 'CA');
```

### 2. Providers Table (Update)
```sql
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    location_id INTEGER REFERENCES locations(id), -- NEW
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Appointment Requests Table (New)
```sql
CREATE TABLE appointment_requests (
    id SERIAL PRIMARY KEY,
    
    -- Patient Information
    patient_name VARCHAR(200) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    age INTEGER NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    -- Medical Information
    diagnosis_history TEXT,
    reason_for_visit TEXT,
    
    -- Appointment Details
    location_id INTEGER REFERENCES locations(id),
    provider_id INTEGER REFERENCES providers(id), -- NULL if auto-assign
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    
    -- Request Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    
    -- Assignment
    assigned_provider_id INTEGER REFERENCES providers(id), -- Auto-assigned or selected
    assigned_by INTEGER REFERENCES providers(id), -- Admin/Provider who approved
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    -- Notes
    admin_notes TEXT,
    rejection_reason TEXT
);

-- Indexes
CREATE INDEX idx_requests_status ON appointment_requests(status);
CREATE INDEX idx_requests_location ON appointment_requests(location_id);
CREATE INDEX idx_requests_provider ON appointment_requests(assigned_provider_id);
CREATE INDEX idx_requests_date ON appointment_requests(preferred_date);
```

### 4. Provider Availability Table (New)
```sql
CREATE TABLE provider_availability (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id),
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 30, -- minutes
    is_active BOOLEAN DEFAULT true
);

-- Sample data (Dr. Smith works Mon-Fri 9am-5pm)
INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time) VALUES
(1, 1, '09:00', '17:00'), -- Monday
(1, 2, '09:00', '17:00'), -- Tuesday
(1, 3, '09:00', '17:00'), -- Wednesday
(1, 4, '09:00', '17:00'), -- Thursday
(1, 5, '09:00', '17:00'); -- Friday
```

---

## 🎨 Frontend Components

### 1. Public Appointment Form
**File: `denticon-dashboard/src/components/PublicAppointmentForm.js`**

```javascript
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './PublicAppointmentForm.css';

const PublicAppointmentForm = () => {
  const [locations, setLocations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  const [formData, setFormData] = useState({
    patient_name: '',
    gender: '',
    age: '',
    phone: '',
    email: '',
    diagnosis_history: '',
    reason_for_visit: '',
    location_id: '',
    provider_id: '', // Optional
    preferred_date: '',
    preferred_time: ''
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (formData.location_id) {
      loadProvidersByLocation(formData.location_id);
    }
  }, [formData.location_id]);

  useEffect(() => {
    if (formData.provider_id && formData.preferred_date) {
      loadAvailableSlots(formData.provider_id, formData.preferred_date);
    }
  }, [formData.provider_id, formData.preferred_date]);

  const loadLocations = async () => {
    const response = await api.get('/Location');
    setLocations(response.data.data);
  };

  const loadProvidersByLocation = async (locationId) => {
    const response = await api.get(`/Provider?location_id=${locationId}`);
    setProviders(response.data.data);
  };

  const loadAvailableSlots = async (providerId, date) => {
    const response = await api.get(`/Provider/${providerId}/availability?date=${date}`);
    setAvailableSlots(response.data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/AppointmentRequest', formData);
      setSubmitted(true);
    } catch (error) {
      alert('Error submitting request: ' + error.message);
    }
  };

  if (submitted) {
    return (
      <div className="success-message">
        <h2>✅ Appointment Request Submitted!</h2>
        <p>Thank you, {formData.patient_name}!</p>
        <p>Your appointment request has been received.</p>
        <p>We will contact you shortly at <strong>{formData.phone}</strong></p>
        <p>Reference: Your request is pending review.</p>
        <button onClick={() => window.location.reload()}>Book Another</button>
      </div>
    );
  }

  return (
    <div className="public-appointment-form">
      <h1>Book an Appointment</h1>
      <p>Fill out the form below and we'll get back to you soon!</p>

      <form onSubmit={handleSubmit}>
        {/* Patient Information */}
        <section className="form-section">
          <h2>Personal Information</h2>
          
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.patient_name}
              onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Age *</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                min="1"
                max="150"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="555-123-4567"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
              />
            </div>
          </div>
        </section>

        {/* Medical Information */}
        <section className="form-section">
          <h2>Medical Information</h2>
          
          <div className="form-group">
            <label>Reason for Visit *</label>
            <textarea
              value={formData.reason_for_visit}
              onChange={(e) => setFormData({...formData, reason_for_visit: e.target.value})}
              placeholder="E.g., Toothache, Regular checkup, Cleaning..."
              rows="2"
              required
            />
          </div>

          <div className="form-group">
            <label>Medical History / Diagnosis</label>
            <textarea
              value={formData.diagnosis_history}
              onChange={(e) => setFormData({...formData, diagnosis_history: e.target.value})}
              placeholder="Any relevant medical conditions, allergies, medications..."
              rows="3"
            />
          </div>
        </section>

        {/* Appointment Details */}
        <section className="form-section">
          <h2>Appointment Details</h2>
          
          <div className="form-group">
            <label>Location *</label>
            <select
              value={formData.location_id}
              onChange={(e) => setFormData({...formData, location_id: e.target.value, provider_id: ''})}
              required
            >
              <option value="">Select Location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} - {loc.city}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Provider (Optional)</label>
            <select
              value={formData.provider_id}
              onChange={(e) => setFormData({...formData, provider_id: e.target.value})}
              disabled={!formData.location_id}
            >
              <option value="">Any Available Provider</option>
              {providers.map(prov => (
                <option key={prov.id} value={prov.id}>
                  Dr. {prov.first_name} {prov.last_name} - {prov.specialization}
                </option>
              ))}
            </select>
            <small>Leave empty for automatic assignment</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preferred Date *</label>
              <input
                type="date"
                value={formData.preferred_date}
                onChange={(e) => setFormData({...formData, preferred_date: e.target.value, preferred_time: ''})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Preferred Time *</label>
              {formData.provider_id && availableSlots.length > 0 ? (
                <select
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                  required
                >
                  <option value="">Select Time</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="time"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                  required
                />
              )}
            </div>
          </div>
        </section>

        <button type="submit" className="btn-submit">
          Submit Appointment Request
        </button>
      </form>
    </div>
  );
};

export default PublicAppointmentForm;
```

### 2. Admin/Provider Request Dashboard
**File: `denticon-dashboard/src/components/AppointmentRequests.js`**

```javascript
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AppointmentRequests.css';

const AppointmentRequests = ({ userRole, userId }) => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filter, userRole]);

  const loadRequests = async () => {
    try {
      let url = '/AppointmentRequest';
      if (userRole === 'provider') {
        url += `?provider_id=${userId}`;
      }
      if (filter !== 'all') {
        url += url.includes('?') ? '&' : '?';
        url += `status=${filter}`;
      }
      
      const response = await api.get(url);
      setRequests(response.data.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this appointment request?')) return;

    try {
      await api.put(`/AppointmentRequest/${requestId}/approve`, {
        assigned_by: userId,
        admin_notes: ''
      });
      loadRequests();
      alert('Appointment approved and confirmed!');
    } catch (error) {
      alert('Error: ' + error.response?.data?.message);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    try {
      await api.put(`/AppointmentRequest/${requestId}/reject`, {
        rejection_reason: reason,
        assigned_by: userId
      });
      loadRequests();
      alert('Appointment request rejected');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      cancelled: 'badge-gray'
    };
    return <span className={`badge ${colors[status]}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="appointment-requests">
      <div className="page-header">
        <h1>Appointment Requests</h1>
        <div className="filters">
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            Pending
          </button>
          <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
            Approved
          </button>
          <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>
            Rejected
          </button>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All
          </button>
        </div>
      </div>

      <div className="requests-table">
        <table>
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Patient</th>
              <th>Age/Gender</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Provider</th>
              <th>Date/Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>{new Date(req.submitted_at).toLocaleString()}</td>
                <td><strong>{req.patient_name}</strong></td>
                <td>{req.age} / {req.gender}</td>
                <td>
                  {req.phone}<br/>
                  {req.email}
                </td>
                <td>{req.location_name}</td>
                <td>
                  {req.provider_id 
                    ? `Dr. ${req.provider_name}` 
                    : <em>Auto-assign</em>
                  }
                </td>
                <td>
                  {new Date(req.preferred_date).toLocaleDateString()}<br/>
                  {req.preferred_time}
                </td>
                <td>
                  <small>{req.reason_for_visit}</small>
                </td>
                <td>{getStatusBadge(req.status)}</td>
                <td className="actions">
                  {req.status === 'pending' && (
                    <>
                      <button 
                        className="btn-success" 
                        onClick={() => handleApprove(req.id)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="btn-danger" 
                        onClick={() => handleReject(req.id)}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedRequest(req)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Request Details</h2>
            <div className="details-grid">
              <div>
                <label>Patient Name:</label>
                <p>{selectedRequest.patient_name}</p>
              </div>
              <div>
                <label>Age / Gender:</label>
                <p>{selectedRequest.age} / {selectedRequest.gender}</p>
              </div>
              <div>
                <label>Phone:</label>
                <p>{selectedRequest.phone}</p>
              </div>
              <div>
                <label>Email:</label>
                <p>{selectedRequest.email || 'N/A'}</p>
              </div>
              <div className="full-width">
                <label>Reason for Visit:</label>
                <p>{selectedRequest.reason_for_visit}</p>
              </div>
              <div className="full-width">
                <label>Medical History:</label>
                <p>{selectedRequest.diagnosis_history || 'None provided'}</p>
              </div>
              <div>
                <label>Location:</label>
                <p>{selectedRequest.location_name}</p>
              </div>
              <div>
                <label>Preferred Provider:</label>
                <p>{selectedRequest.provider_name || 'Any available'}</p>
              </div>
              <div>
                <label>Date:</label>
                <p>{new Date(selectedRequest.preferred_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label>Time:</label>
                <p>{selectedRequest.preferred_time}</p>
              </div>
              {selectedRequest.admin_notes && (
                <div className="full-width">
                  <label>Admin Notes:</label>
                  <p>{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>
            <button onClick={() => setSelectedRequest(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequests;
```

---

## 🔌 Backend API Routes

### File: `denticon-api-node/routes/appointmentRequests.js`

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all requests (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, provider_id, location_id } = req.query;
    
    let query = `
      SELECT 
        ar.*,
        l.name as location_name,
        p.first_name || ' ' || p.last_name as provider_name
      FROM appointment_requests ar
      LEFT JOIN locations l ON ar.location_id = l.id
      LEFT JOIN providers p ON ar.provider_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND ar.status = $${paramIndex++}`;
      params.push(status);
    }
    if (provider_id) {
      query += ` AND (ar.provider_id = $${paramIndex} OR ar.assigned_provider_id = $${paramIndex})`;
      params.push(provider_id);
      paramIndex++;
    }
    if (location_id) {
      query += ` AND ar.location_id = $${paramIndex++}`;
      params.push(location_id);
    }

    query += ` ORDER BY ar.submitted_at DESC`;

    const result = await pool.query(query, params);
    res.json({ statusCode: 200, data: result.rows });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
});

// POST create new request (public endpoint - no auth needed)
router.post('/', async (req, res) => {
  try {
    const {
      patient_name, gender, age, phone, email,
      diagnosis_history, reason_for_visit,
      location_id, provider_id,
      preferred_date, preferred_time
    } = req.body;

    // If no provider selected, auto-assign
    let assigned_provider_id = provider_id;
    if (!provider_id) {
      // Find available provider at this location
      const providerResult = await pool.query(`
        SELECT id FROM providers 
        WHERE location_id = $1 AND is_active = true 
        ORDER BY RANDOM() 
        LIMIT 1
      `, [location_id]);
      
      if (providerResult.rows.length > 0) {
        assigned_provider_id = providerResult.rows[0].id;
      }
    }

    const result = await pool.query(`
      INSERT INTO appointment_requests (
        patient_name, gender, age, phone, email,
        diagnosis_history, reason_for_visit,
        location_id, provider_id, assigned_provider_id,
        preferred_date, preferred_time, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
      RETURNING *
    `, [
      patient_name, gender, age, phone, email,
      diagnosis_history, reason_for_visit,
      location_id, provider_id, assigned_provider_id,
      preferred_date, preferred_time
    ]);

    res.status(201).json({ 
      statusCode: 201, 
      message: 'Request submitted successfully',
      data: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
});

// PUT approve request
router.put('/:id/approve', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { assigned_by, admin_notes } = req.body;

    await client.query('BEGIN');

    // Get request details
    const request = await client.query(
      'SELECT * FROM appointment_requests WHERE id = $1',
      [id]
    );

    if (request.rows.length === 0) {
      return res.status(404).json({ statusCode: 404, message: 'Request not found' });
    }

    const req_data = request.rows[0];

    // Create actual appointment
    const appointment = await client.query(`
      INSERT INTO appointments (
        patient_id, provider_id, appointment_date, appointment_time,
        appointment_type, status, notes, created_by
      ) VALUES (
        (SELECT id FROM patients WHERE phone = $1 LIMIT 1),
        $2, $3, $4, 'consultation', 'confirmed', $5, $6
      ) RETURNING *
    `, [
      req_data.phone,
      req_data.assigned_provider_id,
      req_data.preferred_date,
      req_data.preferred_time,
      req_data.reason_for_visit,
      assigned_by
    ]);

    // Update request status
    await client.query(`
      UPDATE appointment_requests 
      SET status = 'approved', 
          reviewed_at = CURRENT_TIMESTAMP,
          assigned_by = $1,
          admin_notes = $2
      WHERE id = $3
    `, [assigned_by, admin_notes, id]);

    await client.query('COMMIT');

    res.json({ 
      statusCode: 200, 
      message: 'Appointment approved and created',
      data: appointment.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ statusCode: 500, message: error.message });
  } finally {
    client.release();
  }
});

// PUT reject request
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason, assigned_by } = req.body;

    await pool.query(`
      UPDATE appointment_requests 
      SET status = 'rejected',
          reviewed_at = CURRENT_TIMESTAMP,
          assigned_by = $1,
          rejection_reason = $2
      WHERE id = $3
    `, [assigned_by, rejection_reason, id]);

    res.json({ statusCode: 200, message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
});

module.exports = router;
```

### File: `denticon-api-node/routes/locations.js` (New)

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all locations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM locations WHERE is_active = true ORDER BY name
    `);
    res.json({ statusCode: 200, data: result.rows });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
});

module.exports = router;
```

---

## 📝 Implementation Steps

### Step 1: Database Setup
```bash
# Add tables to init.sql
# Run migration
psql -U postgres -d denticon -f database/init.sql
```

### Step 2: Backend Routes
```bash
# Create new files:
- routes/appointmentRequests.js
- routes/locations.js

# Update server.js to register routes:
app.use('/api/AppointmentRequest', appointmentRequestRoutes);
app.use('/api/Location', locationRoutes);
```

### Step 3: Frontend Components
```bash
# Create new files:
- components/PublicAppointmentForm.js
- components/PublicAppointmentForm.css
- components/AppointmentRequests.js
- components/AppointmentRequests.css

# Update App.js to add routes:
<Route path="/book-appointment" component={PublicAppointmentForm} />
<Route path="/admin/requests" component={AppointmentRequests} />
```

### Step 4: Update Sidebar
```javascript
// Add to Sidebar for Admin/Provider
<Link to="/admin/requests">
  <FaBell /> Appointment Requests
</Link>
```

### Step 5: Public Access
```javascript
// Make public form accessible without login
// Update App.js:
<Route exact path="/book" component={PublicAppointmentForm} />
```

---

## ✅ Success Checklist

- [ ] Database tables created
- [ ] Location management working
- [ ] Public form accessible (e.g., /book)
- [ ] Patient can fill form and submit
- [ ] Auto-assign provider works if not selected
- [ ] Admin can see all requests
- [ ] Provider can see their requests
- [ ] Approve creates actual appointment
- [ ] Reject marks request as rejected
- [ ] Email/SMS notification (future)

---

## 🚀 Public URL

**Production URL**: `http://your-domain.com/book`

Share this link with patients for online booking!

---

**This is your complete public appointment booking system!**
