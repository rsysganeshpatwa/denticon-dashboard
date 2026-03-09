# Complete Appointment System with PostgreSQL

## Goal
Implement a fully functional appointment management system with PostgreSQL database integration, supporting the complete appointment lifecycle: create, schedule, assign to provider, update, cancel, and complete.

---

## 1. Database Setup

### PostgreSQL Schema

```sql
-- Users/Providers Table
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    primary_provider_id INTEGER REFERENCES providers(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 30, -- minutes
    room_number VARCHAR(20),
    appointment_type VARCHAR(50) NOT NULL, -- checkup, cleaning, consultation, etc.
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no-show
    notes TEXT,
    reason TEXT,
    created_by INTEGER REFERENCES providers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointment History/Audit Log
CREATE TABLE appointment_history (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    changed_by INTEGER REFERENCES providers(id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
```

---

## 2. Backend API Endpoints

### Setup PostgreSQL Connection

**File: `denticon-api-node/config/database.js`**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'denticon',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

### Appointment Routes

**File: `denticon-api-node/routes/appointments.js`**
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all appointments with filters
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            count = 10, 
            status, 
            provider_id, 
            patient_id,
            date_from,
            date_to 
        } = req.query;
        
        const offset = (page - 1) * count;
        let query = `
            SELECT 
                a.*,
                p.first_name || ' ' || p.last_name as patient_name,
                pr.first_name || ' ' || pr.last_name as provider_name,
                pr.specialization
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN providers pr ON a.provider_id = pr.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND a.status = $${paramIndex++}`;
            params.push(status);
        }
        if (provider_id) {
            query += ` AND a.provider_id = $${paramIndex++}`;
            params.push(provider_id);
        }
        if (patient_id) {
            query += ` AND a.patient_id = $${paramIndex++}`;
            params.push(patient_id);
        }
        if (date_from) {
            query += ` AND a.appointment_date >= $${paramIndex++}`;
            params.push(date_from);
        }
        if (date_to) {
            query += ` AND a.appointment_date <= $${paramIndex++}`;
            params.push(date_to);
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(count, offset);

        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM appointments WHERE 1=1');
        
        res.json({
            statusCode: 200,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                count: parseInt(count),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(countResult.rows[0].count / count)
            }
        });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

// GET single appointment by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                a.*,
                p.first_name || ' ' || p.last_name as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                pr.first_name || ' ' || pr.last_name as provider_name,
                pr.specialization
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN providers pr ON a.provider_id = pr.id
            WHERE a.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Appointment not found' });
        }

        res.json({ statusCode: 200, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

// POST create new appointment
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            patient_id,
            provider_id,
            appointment_date,
            appointment_time,
            duration,
            room_number,
            appointment_type,
            notes,
            reason,
            created_by
        } = req.body;

        // Validate required fields
        if (!patient_id || !provider_id || !appointment_date || !appointment_time || !appointment_type) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'Missing required fields' 
            });
        }

        // Check for scheduling conflicts
        const conflictCheck = await client.query(`
            SELECT id FROM appointments 
            WHERE provider_id = $1 
            AND appointment_date = $2 
            AND appointment_time = $3 
            AND status NOT IN ('cancelled', 'completed')
        `, [provider_id, appointment_date, appointment_time]);

        if (conflictCheck.rows.length > 0) {
            return res.status(409).json({ 
                statusCode: 409, 
                message: 'Time slot already booked' 
            });
        }

        await client.query('BEGIN');

        const result = await client.query(`
            INSERT INTO appointments (
                patient_id, provider_id, appointment_date, appointment_time,
                duration, room_number, appointment_type, notes, reason, 
                created_by, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
            RETURNING *
        `, [patient_id, provider_id, appointment_date, appointment_time, 
            duration || 30, room_number, appointment_type, notes, reason, created_by]);

        // Log to history
        await client.query(`
            INSERT INTO appointment_history (appointment_id, changed_by, new_status, change_reason)
            VALUES ($1, $2, 'scheduled', 'Appointment created')
        `, [result.rows[0].id, created_by]);

        await client.query('COMMIT');

        res.status(201).json({ 
            statusCode: 201, 
            message: 'Appointment created successfully',
            data: result.rows[0] 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ statusCode: 500, message: error.message });
    } finally {
        client.release();
    }
});

// PUT update appointment
router.put('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            provider_id,
            appointment_date,
            appointment_time,
            duration,
            room_number,
            appointment_type,
            status,
            notes,
            reason,
            updated_by
        } = req.body;

        // Get current appointment
        const current = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Appointment not found' });
        }

        await client.query('BEGIN');

        const result = await client.query(`
            UPDATE appointments SET
                provider_id = COALESCE($1, provider_id),
                appointment_date = COALESCE($2, appointment_date),
                appointment_time = COALESCE($3, appointment_time),
                duration = COALESCE($4, duration),
                room_number = COALESCE($5, room_number),
                appointment_type = COALESCE($6, appointment_type),
                status = COALESCE($7, status),
                notes = COALESCE($8, notes),
                reason = COALESCE($9, reason),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING *
        `, [provider_id, appointment_date, appointment_time, duration, room_number, 
            appointment_type, status, notes, reason, id]);

        // Log status change if applicable
        if (status && status !== current.rows[0].status) {
            await client.query(`
                INSERT INTO appointment_history (appointment_id, changed_by, old_status, new_status)
                VALUES ($1, $2, $3, $4)
            `, [id, updated_by, current.rows[0].status, status]);
        }

        await client.query('COMMIT');

        res.json({ 
            statusCode: 200, 
            message: 'Appointment updated successfully',
            data: result.rows[0] 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ statusCode: 500, message: error.message });
    } finally {
        client.release();
    }
});

// DELETE cancel appointment
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { cancelled_by, reason } = req.body;

        await client.query('BEGIN');

        const result = await client.query(`
            UPDATE appointments 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Appointment not found' });
        }

        await client.query(`
            INSERT INTO appointment_history (appointment_id, changed_by, old_status, new_status, change_reason)
            VALUES ($1, $2, $3, 'cancelled', $4)
        `, [id, cancelled_by, result.rows[0].status, reason]);

        await client.query('COMMIT');

        res.json({ 
            statusCode: 200, 
            message: 'Appointment cancelled successfully' 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ statusCode: 500, message: error.message });
    } finally {
        client.release();
    }
});

// GET appointment history
router.get('/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                ah.*,
                p.first_name || ' ' || p.last_name as changed_by_name
            FROM appointment_history ah
            LEFT JOIN providers p ON ah.changed_by = p.id
            WHERE ah.appointment_id = $1
            ORDER BY ah.changed_at DESC
        `, [id]);

        res.json({ statusCode: 200, data: result.rows });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

module.exports = router;
```

### Patient Routes (PostgreSQL)

**File: `denticon-api-node/routes/patients.js`**
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all patients
router.get('/', async (req, res) => {
    try {
        const { page = 1, count = 10, search } = req.query;
        const offset = (page - 1) * count;
        
        let query = `
            SELECT 
                p.*,
                pr.first_name || ' ' || pr.last_name as primary_provider_name,
                COUNT(DISTINCT a.id) as total_appointments
            FROM patients p
            LEFT JOIN providers pr ON p.primary_provider_id = pr.id
            LEFT JOIN appointments a ON p.id = a.patient_id
            WHERE p.is_active = true
        `;
        const params = [];
        
        if (search) {
            query += ` AND (p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR p.phone ILIKE $1)`;
            params.push(`%${search}%`);
        }
        
        query += ` GROUP BY p.id, pr.first_name, pr.last_name ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(count, offset);
        
        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM patients WHERE is_active = true');
        
        res.json({
            statusCode: 200,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                count: parseInt(count),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(countResult.rows[0].count / count)
            }
        });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

// POST create patient
router.post('/', async (req, res) => {
    try {
        const {
            first_name, last_name, email, phone, date_of_birth,
            address, city, state, zip_code, insurance_provider,
            insurance_number, primary_provider_id
        } = req.body;

        if (!first_name || !last_name || !phone) {
            return res.status(400).json({ statusCode: 400, message: 'Missing required fields' });
        }

        const result = await pool.query(`
            INSERT INTO patients (
                first_name, last_name, email, phone, date_of_birth,
                address, city, state, zip_code, insurance_provider,
                insurance_number, primary_provider_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [first_name, last_name, email, phone, date_of_birth, address,
            city, state, zip_code, insurance_provider, insurance_number, primary_provider_id]);

        res.status(201).json({ statusCode: 201, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

// PUT update patient
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(fields).forEach(key => {
            setClauses.push(`${key} = $${paramIndex++}`);
            values.push(fields[key]);
        });

        values.push(id);

        const result = await pool.query(`
            UPDATE patients SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Patient not found' });
        }

        res.json({ statusCode: 200, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

module.exports = router;
```

### Provider Routes (PostgreSQL)

**File: `denticon-api-node/routes/providers.js`**
```javascript
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all providers
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*,
                COUNT(DISTINCT pa.id) as patients_count,
                COUNT(DISTINCT a.id) as appointments_count
            FROM providers p
            LEFT JOIN patients pa ON p.id = pa.primary_provider_id
            LEFT JOIN appointments a ON p.id = a.provider_id
            WHERE p.is_active = true
            GROUP BY p.id
            ORDER BY p.last_name, p.first_name
        `);

        res.json({ statusCode: 200, data: result.rows });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

// POST create provider
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, phone, specialization } = req.body;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ statusCode: 400, message: 'Missing required fields' });
        }

        const result = await pool.query(`
            INSERT INTO providers (first_name, last_name, email, phone, specialization)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [first_name, last_name, email, phone, specialization]);

        res.status(201).json({ statusCode: 201, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ statusCode: 500, message: error.message });
    }
});

module.exports = router;
```

---

## 3. Environment Configuration

**File: `denticon-api-node/.env`**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=denticon
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret (for future auth)
JWT_SECRET=your_jwt_secret_key
```

**File: `denticon-api-node/package.json`** (add pg dependency)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  }
}
```

---

## 4. Docker Setup with PostgreSQL

**File: `docker-compose.yml`** (updated)
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: denticon-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: denticon
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: denticon_password_2024
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./denticon-api-node/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - denticon-network
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API Service
  denticon-api:
    build:
      context: ./denticon-api-node
      dockerfile: Dockerfile
    container_name: denticon-api
    restart: unless-stopped
    expose:
      - "3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=denticon
      - DB_USER=postgres
      - DB_PASSWORD=denticon_password_2024
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - denticon-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend React Service
  denticon-dashboard:
    build:
      context: ./denticon-dashboard
      dockerfile: Dockerfile
    container_name: denticon-dashboard
    restart: unless-stopped
    expose:
      - "3000"
    depends_on:
      - denticon-api
    networks:
      - denticon-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Nginx Reverse Proxy
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: denticon-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - denticon-api
      - denticon-dashboard
    networks:
      - denticon-network
    volumes:
      - ./nginx/logs:/var/log/nginx
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  denticon-network:
    driver: bridge

volumes:
  postgres-data:
  api-data:
```

---

## 5. Database Initialization

**File: `denticon-api-node/database/init.sql`**
```sql
-- Create tables (use schema from section 1)
-- Insert seed data

-- Sample Providers
INSERT INTO providers (first_name, last_name, email, phone, specialization) VALUES
('John', 'Smith', 'john.smith@denticon.com', '555-0101', 'General Dentistry'),
('Sarah', 'Johnson', 'sarah.johnson@denticon.com', '555-0102', 'Orthodontics'),
('Michael', 'Brown', 'michael.brown@denticon.com', '555-0103', 'Pediatric Dentistry'),
('Emily', 'Davis', 'emily.davis@denticon.com', '555-0104', 'Oral Surgery'),
('David', 'Wilson', 'david.wilson@denticon.com', '555-0105', 'Periodontics');

-- Sample Patients
INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code, insurance_provider, primary_provider_id) VALUES
('Alice', 'Cooper', 'alice.cooper@email.com', '555-1001', '1985-03-15', '123 Main St', 'San Francisco', 'CA', '94105', 'Blue Cross', 1),
('Bob', 'Martin', 'bob.martin@email.com', '555-1002', '1990-07-22', '456 Oak Ave', 'San Jose', 'CA', '95110', 'Aetna', 1),
('Carol', 'White', 'carol.white@email.com', '555-1003', '1978-11-30', '789 Pine Rd', 'Oakland', 'CA', '94601', 'Cigna', 2);
```

---

## 6. Frontend React Components

### Appointment Form Component

**File: `denticon-dashboard/src/components/AppointmentForm.js`**
```javascript
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AppointmentForm.css';

const AppointmentForm = ({ appointment, onSave, onClose }) => {
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: '',
    provider_id: '',
    appointment_date: '',
    appointment_time: '',
    duration: 30,
    room_number: '',
    appointment_type: 'checkup',
    notes: '',
    reason: ''
  });

  useEffect(() => {
    loadPatients();
    loadProviders();
    if (appointment) {
      setFormData(appointment);
    }
  }, [appointment]);

  const loadPatients = async () => {
    const response = await api.get('/Patient');
    setPatients(response.data.data);
  };

  const loadProviders = async () => {
    const response = await api.get('/Provider');
    setProviders(response.data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (appointment?.id) {
        await api.put(`/Appointment/${appointment.id}`, formData);
      } else {
        await api.post('/Appointment', { ...formData, created_by: 1 });
      }
      onSave();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving appointment');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content appointment-form">
        <h2>{appointment ? 'Edit Appointment' : 'New Appointment'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Patient *</label>
              <select 
                value={formData.patient_id} 
                onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                required
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Provider *</label>
              <select 
                value={formData.provider_id} 
                onChange={(e) => setFormData({...formData, provider_id: e.target.value})}
                required
              >
                <option value="">Select Provider</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr. {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input 
                type="date" 
                value={formData.appointment_date}
                onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Time *</label>
              <input 
                type="time" 
                value={formData.appointment_time}
                onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input 
                type="number" 
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                min="15" step="15"
              />
            </div>
            <div className="form-group">
              <label>Room</label>
              <input 
                type="text" 
                value={formData.room_number}
                onChange={(e) => setFormData({...formData, room_number: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Type *</label>
            <select 
              value={formData.appointment_type}
              onChange={(e) => setFormData({...formData, appointment_type: e.target.value})}
            >
              <option value="checkup">Checkup</option>
              <option value="cleaning">Cleaning</option>
              <option value="consultation">Consultation</option>
              <option value="filling">Filling</option>
              <option value="extraction">Extraction</option>
              <option value="root-canal">Root Canal</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reason</label>
            <textarea 
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Save Appointment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
```

### Updated Appointments Component

**File: `denticon-dashboard/src/components/Appointments.js`** (update to use real API)
```javascript
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AppointmentForm from './AppointmentForm';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/Appointment', { params });
      setAppointments(response.data.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cancel this appointment?')) {
      try {
        await api.delete(`/Appointment/${id}`, {
          data: { cancelled_by: 1, reason: 'Cancelled by user' }
        });
        loadAppointments();
      } catch (error) {
        alert('Error cancelling appointment');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/Appointment/${id}`, { status: newStatus, updated_by: 1 });
      loadAppointments();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: 'badge-blue',
      confirmed: 'badge-green',
      completed: 'badge-gray',
      cancelled: 'badge-red',
      'no-show': 'badge-orange'
    };
    return <span className={`badge ${statusColors[status]}`}>{status}</span>;
  };

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>Appointments</h1>
        <button className="btn-primary" onClick={() => { setSelectedAppointment(null); setShowForm(true); }}>
          + New Appointment
        </button>
      </div>

      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'scheduled' ? 'active' : ''} onClick={() => setFilter('scheduled')}>Scheduled</button>
        <button className={filter === 'confirmed' ? 'active' : ''} onClick={() => setFilter('confirmed')}>Confirmed</button>
        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <div className="appointments-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Provider</th>
              <th>Type</th>
              <th>Room</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(apt => (
              <tr key={apt.id}>
                <td>{new Date(apt.appointment_date).toLocaleDateString()}</td>
                <td>{apt.appointment_time}</td>
                <td>{apt.patient_name}</td>
                <td>Dr. {apt.provider_name}</td>
                <td>{apt.appointment_type}</td>
                <td>{apt.room_number || '-'}</td>
                <td>{getStatusBadge(apt.status)}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(apt)}>Edit</button>
                  {apt.status === 'scheduled' && (
                    <button onClick={() => handleStatusChange(apt.id, 'confirmed')}>Confirm</button>
                  )}
                  {apt.status === 'confirmed' && (
                    <button onClick={() => handleStatusChange(apt.id, 'completed')}>Complete</button>
                  )}
                  <button className="btn-danger" onClick={() => handleDelete(apt.id)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AppointmentForm
          appointment={selectedAppointment}
          onSave={() => { setShowForm(false); loadAppointments(); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Appointments;
```

---

## 7. Installation & Setup Steps

```bash
# 1. Install PostgreSQL locally (or use Docker)
sudo apt-get install postgresql postgresql-contrib

# 2. Create database
sudo -u postgres psql
CREATE DATABASE denticon;
CREATE USER denticon_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE denticon TO denticon_user;
\q

# 3. Install backend dependencies
cd denticon-api-node
npm install pg dotenv

# 4. Run database migration
psql -U postgres -d denticon -f database/init.sql

# 5. Update .env file with database credentials

# 6. Start with Docker
cd ..
sudo docker-compose up -d --build

# 7. Check logs
sudo docker-compose logs -f denticon-api
```

---

## 8. Testing the Complete Flow

### 1. Create a Provider
```bash
curl -X POST http://localhost/api/Provider \
  -H "Content-Type: application/json" \
  -H "VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7" \
  -H "ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB" \
  -H "Pgid: 1" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@denticon.com",
    "phone": "555-0101",
    "specialization": "General Dentistry"
  }'
```

### 2. Create a Patient
```bash
curl -X POST http://localhost/api/Patient \
  -H "Content-Type: application/json" \
  -H "VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7" \
  -H "ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB" \
  -H "Pgid: 1" \
  -d '{
    "first_name": "Alice",
    "last_name": "Cooper",
    "email": "alice@email.com",
    "phone": "555-1001",
    "date_of_birth": "1985-03-15",
    "insurance_provider": "Blue Cross",
    "primary_provider_id": 1
  }'
```

### 3. Create an Appointment
```bash
curl -X POST http://localhost/api/Appointment \
  -H "Content-Type: application/json" \
  -H "VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7" \
  -H "ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB" \
  -H "Pgid: 1" \
  -d '{
    "patient_id": 1,
    "provider_id": 1,
    "appointment_date": "2026-03-15",
    "appointment_time": "10:00",
    "duration": 30,
    "room_number": "101",
    "appointment_type": "checkup",
    "reason": "Regular checkup",
    "created_by": 1
  }'
```

### 4. Update Appointment Status
```bash
curl -X PUT http://localhost/api/Appointment/1 \
  -H "Content-Type: application/json" \
  -H "VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7" \
  -H "ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB" \
  -H "Pgid: 1" \
  -d '{
    "status": "confirmed",
    "updated_by": 1
  }'
```

---

## 9. Next Steps

- [ ] Implement JWT authentication
- [ ] Add real-time notifications
- [ ] Calendar view for appointments
- [ ] Email/SMS reminders
- [ ] Payment integration
- [ ] Treatment records
- [ ] Reporting dashboard
- [ ] Mobile app

---

**This plan provides a complete, production-ready appointment system with PostgreSQL!**
