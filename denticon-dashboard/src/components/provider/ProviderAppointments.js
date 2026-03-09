import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../services/api';
import '../admin/Appointments.css';

function ProviderAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [completeFormData, setCompleteFormData] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    follow_up_required: false,
    next_visit_date: '',
    follow_up_notes: ''
  });
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    patient_search: ''
  });
  const [highlightedPatientId, setHighlightedPatientId] = useState(null);

  useEffect(() => {
    // Check if there's a highlighted patient from dashboard
    const storedPatient = localStorage.getItem('highlightedPatient');
    if (storedPatient) {
      try {
        const patientInfo = JSON.parse(storedPatient);
        setHighlightedPatientId(patientInfo.id);
        setFilters(prev => ({ ...prev, patient_search: patientInfo.name }));
        // Clear the stored patient after setting the filter
        localStorage.removeItem('highlightedPatient');
      } catch (error) {
        console.error('Error parsing patient info:', error);
        localStorage.removeItem('highlightedPatient');
      }
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let url = `/provider-portal/appointments?`;
      if (filters.date) url += `date=${filters.date}&`;
      if (filters.status) url += `status=${filters.status}&`;
      
      const response = await api.get(url);
      
      if (response.data && response.data.data) {
        let filteredData = response.data.data;
        
        // Client-side filtering for patient search
        if (filters.patient_search) {
          const searchLower = filters.patient_search.toLowerCase();
          filteredData = filteredData.filter(apt => 
            apt.patient_name?.toLowerCase().includes(searchLower) ||
            apt.patient_id?.toString().includes(searchLower)
          );
        }
        
        setAppointments(filteredData);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCompleteClick = (apt) => {
    setSelectedAppointment(apt);
    setCompleteFormData({
      diagnosis: apt.diagnosis || '',
      treatment: apt.treatment || '',
      notes: apt.notes || ''
    });
    setShowCompleteModal(true);
  };

  const handleCompleteModalClose = () => {
    setShowCompleteModal(false);
    setSelectedAppointment(null);
    setCompleteFormData({
      diagnosis: '',
      treatment: '',
      notes: '',
      follow_up_required: false,
      next_visit_date: '',
      follow_up_notes: ''
    });
  };

  const handleCompleteFormChange = (e) => {
    const { name, value } = e.target;
    setCompleteFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompleteSubmit = async () => {
    // Validate required fields
    if (!completeFormData.diagnosis.trim()) {
      alert('Diagnosis is required to complete the appointment');
      return;
    }
    if (!completeFormData.treatment.trim()) {
      alert('Treatment is required to complete the appointment');
      return;
    }

    try {
      setLoading(true);
      // Update appointment with diagnosis, treatment, notes, and follow-up data
      await api.put(`/provider-portal/appointments/${selectedAppointment.id}`, {
        diagnosis: completeFormData.diagnosis,
        treatment: completeFormData.treatment,
        notes: completeFormData.notes,
        status: 'completed',
        follow_up_required: completeFormData.follow_up_required,
        next_visit_date: completeFormData.follow_up_required ? completeFormData.next_visit_date : null,
        follow_up_notes: completeFormData.follow_up_required ? completeFormData.follow_up_notes : null
      });
      alert('Appointment completed successfully!');
      handleCompleteModalClose();
      fetchAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
      alert('Failed to complete appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/provider-portal/appointments/${appointmentId}/status`, {
        status: newStatus,
        notes: '',
        changed_by: 'provider'
      });
      alert(`Appointment ${newStatus} successfully!`);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment status');
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no-show': 'status-no-show'
    };
    return statusMap[status] || 'status-default';
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>My Appointments</h2>
        <p>View and manage your patient appointments</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No Show</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Search Patient:</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              name="patient_search"
              value={filters.patient_search}
              onChange={handleFilterChange}
              placeholder="Patient name or ID"
              style={{ paddingRight: filters.patient_search ? '35px' : '10px' }}
            />
            {filters.patient_search && (
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, patient_search: '' }));
                  setHighlightedPatientId(null);
                }}
                className="clear-search-btn"
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#999',
                  padding: '0 5px'
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <button className="btn-refresh" onClick={fetchAppointments}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter Active Banner */}
      {filters.patient_search && (
        <div className="filter-active-banner">
          <span>Showing appointments for: <strong>{filters.patient_search}</strong></span>
          <button 
            className="clear-filter-btn"
            onClick={() => {
              setFilters(prev => ({ ...prev, patient_search: '' }));
              setHighlightedPatientId(null);
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Appointments List */}
      <div className="appointments-list">
        {appointments.length === 0 ? (
          <div className="no-data">
            {filters.patient_search ? (
              <>
                <p>No appointments found for "{filters.patient_search}"</p>
                <button 
                  className="clear-filter-btn"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, patient_search: '' }));
                    setHighlightedPatientId(null);
                  }}
                  style={{ marginTop: '10px' }}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <p>No appointments found</p>
            )}
          </div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr 
                  key={apt.id}
                  className={highlightedPatientId === apt.patient_id ? 'highlighted-row' : ''}
                  style={highlightedPatientId === apt.patient_id ? {
                    backgroundColor: '#fff9e6',
                    boxShadow: '0 0 0 2px #f39c12',
                    animation: 'highlight-fade 2s ease-in-out'
                  } : {}}
                >
                  <td>{formatDate(apt.appointment_date)}</td>
                  <td className="time-cell">{formatTime(apt.appointment_time)}</td>
                  <td>
                    <strong>{apt.patient_name}</strong>
                    <br />
                    <small>{apt.patient_phone}</small>
                  </td>
                  <td>{apt.appointment_type || 'General'}</td>
                  <td>{apt.location_name || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {apt.status === 'scheduled' && (
                        <>
                          <button
                            className="btn-complete"
                            onClick={() => handleCompleteClick(apt)}
                          >
                            ✓ Complete
                          </button>
                          <button
                            className="btn-no-show"
                            onClick={() => {
                              if (window.confirm('Mark this appointment as No-Show?')) {
                                updateStatus(apt.id, 'no-show');
                              }
                            }}
                          >
                            ✕ No-Show
                          </button>
                        </>
                      )}
                      {apt.notes && (
                        <button
                          className="btn-info"
                          onClick={() => alert(`Notes: ${apt.notes}`)}
                        >
                          ℹ️ Notes
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Complete Appointment Modal */}
      {showCompleteModal && selectedAppointment && (
        <div className="modal-overlay" onClick={handleCompleteModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complete Appointment</h3>
              <button className="modal-close" onClick={handleCompleteModalClose}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-patient-info">
                <strong>Patient:</strong> {selectedAppointment.patient_name}<br />
                <strong>Date:</strong> {formatDate(selectedAppointment.appointment_date)}<br />
                <strong>Time:</strong> {formatTime(selectedAppointment.appointment_time)}
              </p>
              
              <div className="form-group">
                <label>
                  <strong>Diagnosis: *</strong>
                  <textarea
                    name="diagnosis"
                    value={completeFormData.diagnosis}
                    onChange={handleCompleteFormChange}
                    placeholder="Enter medical diagnosis..."
                    rows="3"
                    className="edit-input"
                    required
                  />
                </label>
              </div>
              
              <div className="form-group">
                <label>
                  <strong>Treatment: *</strong>
                  <textarea
                    name="treatment"
                    value={completeFormData.treatment}
                    onChange={handleCompleteFormChange}
                    placeholder="Enter treatment provided..."
                    rows="3"
                    className="edit-input"
                    required
                  />
                </label>
              </div>
              
              <div className="form-group">
                <label>
                  <strong>Clinical Notes (optional):</strong>
                  <textarea
                    name="notes"
                    value={completeFormData.notes}
                    onChange={handleCompleteFormChange}
                    placeholder="Additional clinical observations or follow-up instructions..."
                    rows="3"
                    className="edit-input"
                  />
                </label>
              </div>
              
              {/* Follow-up Section */}
              <div className="form-group" style={{ 
                borderTop: '2px solid #e0e0e0', 
                paddingTop: '1.5rem', 
                marginTop: '1.5rem' 
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    name="follow_up_required"
                    checked={completeFormData.follow_up_required}
                    onChange={(e) => setCompleteFormData({
                      ...completeFormData,
                      follow_up_required: e.target.checked,
                      next_visit_date: e.target.checked ? completeFormData.next_visit_date : '',
                      follow_up_notes: e.target.checked ? completeFormData.follow_up_notes : ''
                    })}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <strong style={{ color: '#f39c12' }}>📋 Follow-up Required</strong>
                </label>
                
                {completeFormData.follow_up_required && (
                  <>
                    <div className="form-group">
                      <label>
                        <strong>Next Visit Date:</strong>
                        <DatePicker
                          selected={completeFormData.next_visit_date ? new Date(completeFormData.next_visit_date) : null}
                          onChange={(date) => setCompleteFormData({
                            ...completeFormData,
                            next_visit_date: date ? date.toLocaleDateString('en-CA') : ''
                          })}
                          minDate={new Date()}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select next visit date"
                          className="edit-input"
                        />
                      </label>
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <strong>Follow-up Notes:</strong>
                        <textarea
                          name="follow_up_notes"
                          value={completeFormData.follow_up_notes}
                          onChange={handleCompleteFormChange}
                          placeholder="Enter reason for follow-up or special instructions..."
                          rows="3"
                          className="edit-input"
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
              
              <p style={{ color: '#666', fontSize: '14px', marginTop: '1rem' }}>
                * Required fields must be filled before completing the appointment
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={handleCompleteModalClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCompleteSubmit}
                disabled={loading || !completeFormData.diagnosis.trim() || !completeFormData.treatment.trim()}
              >
                {loading ? 'Completing...' : '✓ Complete Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderAppointments;
