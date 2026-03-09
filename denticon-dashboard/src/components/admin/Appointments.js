import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Appointments.css';
import api from '../../services/api';
import { FaCheck, FaTimes, FaEdit, FaTrash, FaClock, FaUserMd } from 'react-icons/fa';

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled', icon: <FaClock color="#888" /> },
  { value: 'completed', label: 'Completed', icon: <FaCheck color="#0074D9" /> },
  { value: 'no-show', label: 'No-Show', icon: <FaTimes color="#ff851b" /> },
  { value: 'cancelled', label: 'Cancelled', icon: <FaTrash color="#ff4136" /> }
];

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [cancelReason, setCancelReason] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: '',
    follow_up_only: false,
    patient_search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    count: 12,
    total: 0,
    totalPages: 0
  });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalApt, setStatusModalApt] = useState(null);
  const [statusModalValue, setStatusModalValue] = useState('');
  
  // Schedule modal states
  const [patients, setPatients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [scheduleFormData, setScheduleFormData] = useState({
    patient_id: '',
    location_id: '',
    provider_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    // Check if coming from dashboard with highlighted patient
    const highlightedPatientData = localStorage.getItem('highlightPatient');
    if (highlightedPatientData) {
      try {
        const patientInfo = JSON.parse(highlightedPatientData);
        // Filter by patient name (more user-friendly than ID)
        setFilters(prev => ({ ...prev, patient_search: patientInfo.name || patientInfo.id }));
      } catch (e) {
        // Fallback for old format (just ID)
        setFilters(prev => ({ ...prev, patient_search: highlightedPatientData }));
      }
      // Clear the localStorage after using it
      localStorage.removeItem('highlightPatient');
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let url = `/Appointment?page=${pagination.page}&count=${pagination.count}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.date_from) url += `&date_from=${filters.date_from}`;
      if (filters.date_to) url += `&date_to=${filters.date_to}`;
      
      const response = await api.get(url);
      
      if (response.data && response.data.data) {
        let appointmentsData = response.data.data;
        
        // Client-side filter for follow-up required
        if (filters.follow_up_only) {
          appointmentsData = appointmentsData.filter(apt => apt.follow_up_required === true);
        }
        
        // Client-side filter for patient search
        if (filters.patient_search) {
          const searchTerm = filters.patient_search.toLowerCase();
          appointmentsData = appointmentsData.filter(apt => {
            const patientName = (apt.patient_name || '').toLowerCase();
            const patientId = (apt.patient_id || '').toString();
            return patientName.includes(searchTerm) || patientId === filters.patient_search;
          });
        }
        
        setAppointments(appointmentsData);
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages
          }));
        }
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
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSchedule = async () => {
    try {
      // Fetch patients, locations, and providers when opening modal
      const [patientsRes, locationsRes, providersRes] = await Promise.all([
        api.get('/Patient'),
        api.get('/Location'),
        api.get('/Provider?is_active=true')
      ]);
      
      setPatients(patientsRes.data?.data || []);
      setLocations(locationsRes.data?.data || []);
      setProviders(providersRes.data?.data || []);
      
      setScheduleFormData({
        patient_id: '',
        location_id: '',
        provider_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: ''
      });
      
      setShowScheduleModal(true);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      alert('Error loading data. Please try again.');
    }
  };

  const handleScheduleModalClose = () => {
    setShowScheduleModal(false);
    setScheduleFormData({
      patient_id: '',
      location_id: '',
      provider_id: '',
      appointment_date: '',
      appointment_time: '',
      notes: ''
    });
    setAvailableSlots([]);
  };

  const handleScheduleChange = async (e) => {
    const { name, value } = e.target;
    setScheduleFormData(prev => ({ ...prev, [name]: value }));
    
    // Fetch slots when provider and date are selected
    if (name === 'appointment_date' && scheduleFormData.provider_id && value) {
      await fetchAvailableSlots(scheduleFormData.provider_id, value);
    } else if (name === 'provider_id' && scheduleFormData.appointment_date && value) {
      await fetchAvailableSlots(value, scheduleFormData.appointment_date);
    }
    
    // Reset time when provider or date changes
    if (name === 'provider_id' || name === 'appointment_date') {
      setScheduleFormData(prev => ({ ...prev, appointment_time: '' }));
    }
  };

  const fetchAvailableSlots = async (providerId, date) => {
    try {
      setLoadingSlots(true);
      const now = new Date();
      const clientTime = now.toTimeString().split(' ')[0];
      const response = await api.get(`/public/providers/${providerId}/availability?date=${date}&currentTime=${clientTime}`);
      if (response.data && response.data.data) {
        setAvailableSlots(response.data.data);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scheduleFormData.patient_id || !scheduleFormData.provider_id || 
        !scheduleFormData.appointment_date || !scheduleFormData.appointment_time) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const appointmentData = {
        patient_id: parseInt(scheduleFormData.patient_id),
        provider_id: parseInt(scheduleFormData.provider_id),
        appointment_date: scheduleFormData.appointment_date,
        appointment_time: scheduleFormData.appointment_time,
        status: 'scheduled',
        notes: scheduleFormData.notes || ''
      };
      
      console.log('Submitting appointment data:', appointmentData);
      
      await api.post('/Appointment', appointmentData);
      alert('Appointment scheduled successfully!');
      handleScheduleModalClose();
      fetchAppointments();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert(error.response?.data?.message || 'Error scheduling appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (apt) => {
    setSelectedAppointment(apt);
    
    // Ensure date is in YYYY-MM-DD format
    let formattedDate = apt.appointment_date;
    if (formattedDate && formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }
    
    // Format next_visit_date the same way
    let formattedNextVisitDate = apt.next_visit_date || '';
    if (formattedNextVisitDate && formattedNextVisitDate.includes('T')) {
      formattedNextVisitDate = formattedNextVisitDate.split('T')[0];
    }
    
    setEditFormData({
      appointment_date: formattedDate,
      appointment_time: apt.appointment_time,
      notes: apt.notes || '',
      room_number: apt.room_number || '',
      diagnosis: apt.diagnosis || '',
      treatment: apt.treatment || '',
      follow_up_required: apt.follow_up_required || false,
      next_visit_date: formattedNextVisitDate,
      follow_up_notes: apt.follow_up_notes || ''
    });
    
    console.log('Edit appointment - Date from DB:', apt.appointment_date, 'Formatted:', formattedDate);
    console.log('Edit appointment - Next Visit Date:', apt.next_visit_date, 'Formatted:', formattedNextVisitDate);
    
    // Fetch slots for the current date and provider
    if (apt.provider_id && formattedDate) {
      fetchAvailableSlots(apt.provider_id, formattedDate);
    }
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSelectedAppointment(null);
    setEditFormData({});
    setAvailableSlots([]);
  };

  const handleEditChange = async (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    
    // Fetch slots when date changes
    if (name === 'appointment_date' && selectedAppointment?.provider_id && value) {
      await fetchAvailableSlots(selectedAppointment.provider_id, value);
      setEditFormData(prev => ({ ...prev, appointment_time: '' }));
    }
  };

  const handleMarkFollowUpCompleted = async (appointmentId) => {
    if (!window.confirm('Mark this follow-up as completed? This will remove it from the follow-up list.')) {
      return;
    }

    try {
      setLoading(true);
      await api.put(`/Appointment/${appointmentId}`, {
        follow_up_required: false,
        follow_up_notes: null,
        next_visit_date: null
      });
      
      alert('Follow-up marked as completed successfully!');
      fetchAppointments();
    } catch (error) {
      console.error('Error marking follow-up as completed:', error);
      alert('Failed to mark follow-up as completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      setLoading(true);
      await api.put(`/Appointment/${selectedAppointment.id}`, editFormData);
      alert('Appointment updated successfully!');
      handleEditModalClose();
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appointmentId, status, notes = '') => {
    try {
      setLoading(true);
      await api.patch(
        `/Appointment/${appointmentId}/status`,
        { status, notes, changed_by: 'admin' }
      );
      alert(`Appointment ${status} successfully!`);
      fetchAppointments();
    } catch (error) {
      console.error(`Error updating appointment to ${status}:`, error);
      alert(`Failed to update appointment. ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/Appointment/${selectedAppointment.id}`, {
        data: { reason: cancelReason }
      });
      alert('Appointment cancelled successfully!');
      setShowCancelModal(false);
      setSelectedAppointment(null);
      setCancelReason('');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  const handleStatusDropdown = (aptId) => {
    setStatusDropdownOpen(statusDropdownOpen === aptId ? null : aptId);
  };

  const handleStatusModalOpen = (apt, value) => {
    // If cancelling, use the cancel modal instead
    if (value === 'cancelled') {
      setSelectedAppointment(apt);
      setCancelReason('');
      setShowCancelModal(true);
      setStatusDropdownOpen(null);
      return;
    }
    
    setStatusModalApt(apt);
    setStatusModalValue(value);
    setStatusNotes('');
    setShowStatusModal(true);
    setStatusDropdownOpen(null);
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setStatusModalApt(null);
    setStatusModalValue('');
    setStatusNotes('');
  };

  const handleStatusChangeConfirm = async () => {
    if (!statusModalApt || !statusModalValue) return;
    setStatusChangeLoading(true);
    try {
      await updateStatus(statusModalApt.id, statusModalValue, statusNotes);
      setShowStatusModal(false);
      setStatusModalApt(null);
      setStatusModalValue('');
      setStatusNotes('');
    } catch (e) {
      alert('Failed to update status.');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments">
      <div className="page-header">
        <h2>Appointments</h2>
        <button className="add-btn" onClick={handleSchedule}>📅 Schedule Appointment</button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Search Patient:</label>
          <input
            type="text"
            name="patient_search"
            value={filters.patient_search}
            onChange={handleFilterChange}
            placeholder="Search by patient name..."
            className="search-input"
          />
          {filters.patient_search && (
            <button 
              className="clear-search-btn"
              onClick={() => setFilters(prev => ({ ...prev, patient_search: '' }))}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-Show</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From Date:</label>
          <input
            type="date"
            name="date_from"
            value={filters.date_from}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label>To Date:</label>
          <input
            type="date"
            name="date_to"
            value={filters.date_to}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="follow_up_only"
              checked={filters.follow_up_only}
              onChange={(e) => setFilters(prev => ({ ...prev, follow_up_only: e.target.checked }))}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <span>Follow-up Required Only</span>
          </label>
        </div>
      </div>

      {filters.patient_search && (
        <div className="filter-active-banner">
          <span>🔍 Showing appointments for: <strong>{filters.patient_search}</strong></span>
          <button 
            className="clear-filter-btn"
            onClick={() => setFilters(prev => ({ ...prev, patient_search: '' }))}
          >
            Clear Filter
          </button>
        </div>
      )}

      {appointments.length === 0 && filters.patient_search && (
        <div className="no-results">
          <p>No appointments found for patient: <strong>{filters.patient_search}</strong></p>
          <button 
            className="clear-filter-btn"
            onClick={() => setFilters(prev => ({ ...prev, patient_search: '' }))}
          >
            Clear Search
          </button>
        </div>
      )}

      <div className="appointments-grid">
        {appointments.map(apt => (
          <div key={apt.id} className={`appointment-card ${apt.follow_up_required ? 'follow-up-required' : ''}`}>
            <div className="card-header">
              <span className={`status-dot ${apt.status?.toLowerCase() || 'scheduled'}`}></span>
              <span className="apt-type">{apt.appointment_type || 'General'}</span>
              {apt.follow_up_required && (
                <span className="follow-up-badge" title="Follow-up Required">🔔</span>
              )}
            </div>
            <div className="card-body">
              <h3>{apt.patient_name}</h3>
              <p className="provider"><FaUserMd /> {apt.provider_name}</p>
              <p className="location">📍 {apt.location_name}</p>
              <div className="apt-details">
                <span className="detail">📅 {formatDate(apt.appointment_date)}</span>
                <span className="detail">🕒 {formatTime(apt.appointment_time)}</span>
              </div>
              {apt.follow_up_required && (
                <div className="follow-up-info">
                  <strong>🔔 Follow-up Required</strong>
                  {apt.next_visit_date && <p>Next Visit: {formatDate(apt.next_visit_date)}</p>}
                  {apt.follow_up_notes && <p className="follow-notes">{apt.follow_up_notes}</p>}
                </div>
              )}
              {apt.notes && <p className="notes">📝 {apt.notes}</p>}
              {/* Status History (last 3 changes) */}
              {apt.history && apt.history.length > 0 && (
                <div className="status-history">
                  <strong>Status History:</strong>
                  <ul>
                    {apt.history.slice(-3).map((h, idx) => (
                      <li key={idx}>
                        <span className={`badge badge-${h.new_status}`}>{h.new_status}</span>
                        <span className="history-date">{formatDate(h.changed_at)}</span>
                        {h.change_reason && <span className="history-reason">({h.change_reason})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="card-footer">
              <span className={`status-label ${apt.status?.toLowerCase() || 'scheduled'}`}>{apt.status}</span>
            </div>
            <div className="card-actions-bottom">
              <div className="status-button-wrapper">
                <button
                  className="btn-action btn-status"
                  onClick={() => handleStatusDropdown(apt.id)}
                  disabled={loading}
                  title="Change status"
                >
                  <FaEdit /> Status
                </button>
                {statusDropdownOpen === apt.id && (
                  <div className="status-dropdown">
                    {statusOptions.filter(opt => opt.value !== apt.status).map(opt => (
                      <div
                        key={opt.value}
                        className="status-option"
                        onClick={() => handleStatusModalOpen(apt, opt.value)}
                      >
                        {opt.icon} {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                className="btn-action btn-edit" 
                onClick={() => handleEdit(apt)} 
                disabled={loading}
                title="Edit appointment"
              >
                <FaEdit /> Edit
              </button>
              {apt.follow_up_required && apt.status === 'completed' && (
                <button 
                  className="btn-action btn-complete-followup" 
                  onClick={() => handleMarkFollowUpCompleted(apt.id)} 
                  disabled={loading}
                  title="Mark follow-up as completed"
                >
                  <FaCheck /> Complete Follow-up
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={handleCancelModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Appointment</h3>
              <button className="modal-close" onClick={handleCancelModalClose}>×</button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Patient:</strong> {selectedAppointment?.patient_name}<br />
                <strong>Date:</strong> {formatDate(selectedAppointment?.appointment_date)}<br />
                <strong>Time:</strong> {formatTime(selectedAppointment?.appointment_time)}
              </p>
              <label>
                <strong>Cancellation Reason:</strong>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  rows="4"
                  className="cancel-reason-input"
                />
              </label>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={handleCancelModalClose}
                disabled={loading}
              >
                Close
              </button>
              <button 
                className="btn-danger" 
                onClick={handleCancelConfirm}
                disabled={loading || !cancelReason.trim()}
              >
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={handleStatusModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Status</h3>
              <button className="modal-close" onClick={handleStatusModalClose}>×</button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Patient:</strong> {statusModalApt?.patient_name}<br />
                <strong>Date:</strong> {formatDate(statusModalApt?.appointment_date)}<br />
                <strong>Time:</strong> {formatTime(statusModalApt?.appointment_time)}
              </p>
              <label>
                <strong>Notes (optional):</strong>
                <textarea
                  value={statusNotes}
                  onChange={e => setStatusNotes(e.target.value)}
                  placeholder="Add notes for this status change..."
                  rows="3"
                  className="status-notes-input"
                />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleStatusModalClose} disabled={statusChangeLoading}>Close</button>
              <button className="btn-primary" onClick={handleStatusChangeConfirm} disabled={statusChangeLoading}>
                {statusChangeLoading ? 'Updating...' : `Confirm ${statusOptions.find(opt => opt.value === statusModalValue)?.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={handleScheduleModalClose}>
          <div className="modal-content schedule-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Schedule New Appointment</h3>
              <button className="modal-close" onClick={handleScheduleModalClose}>×</button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    <strong>Select Patient: *</strong>
                    <select
                      name="patient_id"
                      value={scheduleFormData.patient_id}
                      onChange={handleScheduleChange}
                      required
                      className="edit-input"
                    >
                      <option value="">-- Select Patient --</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name} - {patient.email}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <strong>Select Location: *</strong>
                    <select
                      name="location_id"
                      value={scheduleFormData.location_id}
                      onChange={handleScheduleChange}
                      required
                      className="edit-input"
                    >
                      <option value="">-- Select Location --</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name} - {location.city}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <strong>Select Provider: *</strong>
                    <select
                      name="provider_id"
                      value={scheduleFormData.provider_id}
                      onChange={handleScheduleChange}
                      required
                      className="edit-input"
                    >
                      <option value="">-- Select Provider --</option>
                      {providers
                        .filter(p => !scheduleFormData.location_id || p.location_id === parseInt(scheduleFormData.location_id))
                        .map(provider => (
                          <option key={provider.id} value={provider.id}>
                            Dr. {provider.first_name} {provider.last_name} - {provider.specialization}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <strong>Select Date: *</strong>
                    <DatePicker
                      selected={(() => {
                        if (!scheduleFormData.appointment_date) return null;
                        try {
                          const [year, month, day] = scheduleFormData.appointment_date.split('-');
                          const date = new Date(year, month - 1, day);
                          return isNaN(date.getTime()) ? null : date;
                        } catch {
                          return null;
                        }
                      })()}
                      onChange={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const formattedDate = `${year}-${month}-${day}`;
                          handleScheduleChange({ target: { name: 'appointment_date', value: formattedDate } });
                        } else {
                          handleScheduleChange({ target: { name: 'appointment_date', value: '' } });
                        }
                      }}
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy"
                      placeholderText="Click to select a date"
                      className="edit-input date-picker-input"
                      required
                      inline={false}
                    />
                  </label>
                </div>

                {scheduleFormData.provider_id && scheduleFormData.appointment_date && (
                  <div className="form-group">
                    <label>
                      <strong>Select Time Slot: *</strong>
                    </label>
                    {loadingSlots ? (
                      <p style={{ textAlign: 'center', color: '#666' }}>Loading available slots...</p>
                    ) : availableSlots.length > 0 ? (
                      <div className="time-slots-grid">
                        {availableSlots.map(slot => {
                          const slotTime = typeof slot === 'string' ? slot : slot.time;
                          const isAvailable = typeof slot === 'string' ? true : (slot.available !== false);
                          const displayTime = slotTime ? slotTime.substring(0, 5) : '';
                          
                          return (
                            <button
                              key={slotTime}
                              type="button"
                              className={`time-slot ${scheduleFormData.appointment_time === slotTime ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                              onClick={() => isAvailable && setScheduleFormData(prev => ({ ...prev, appointment_time: slotTime }))}
                              disabled={!isAvailable}
                            >
                              {displayTime}
                              {!isAvailable && <span> ✕</span>}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#999' }}>No available slots for this date</p>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>
                    <strong>Notes (optional):</strong>
                    <textarea
                      name="notes"
                      value={scheduleFormData.notes}
                      onChange={handleScheduleChange}
                      placeholder="Add any notes..."
                      className="edit-input"
                      rows="3"
                    />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleScheduleModalClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading || !scheduleFormData.appointment_time}
                >
                  {loading ? 'Scheduling...' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="modal-overlay" onClick={handleEditModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Appointment</h3>
              <button className="modal-close" onClick={handleEditModalClose}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-patient-info">
                <strong>Patient:</strong> {selectedAppointment.patient_name}<br />
                <strong>Provider:</strong> {selectedAppointment.provider_name}
              </p>
              
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#667eea' }}>Scheduling Information (Admin Only)</h4>
              
              <div className="form-group">
                <label>
                  <strong>Appointment Date:</strong>
                  <DatePicker
                    selected={(() => {
                      if (!editFormData.appointment_date) return null;
                      try {
                        // Handle various date formats
                        let dateStr = editFormData.appointment_date;
                        if (dateStr.includes('T')) {
                          dateStr = dateStr.split('T')[0]; // Remove time part if present
                        }
                        const [year, month, day] = dateStr.split('-');
                        const date = new Date(year, month - 1, day);
                        return isNaN(date.getTime()) ? null : date;
                      } catch {
                        return null;
                      }
                    })()}
                    onChange={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const formattedDate = `${year}-${month}-${day}`;
                        handleEditChange({ target: { name: 'appointment_date', value: formattedDate } });
                      } else {
                        handleEditChange({ target: { name: 'appointment_date', value: '' } });
                      }
                    }}
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    placeholderText="Click to select a date"
                    className="edit-input date-picker-input"
                    inline={false}
                  />
                </label>
              </div>
              
              {editFormData.appointment_date && (
                <div className="form-group">
                  <label>
                    <strong>Select Time Slot:</strong>
                  </label>
                  {loadingSlots ? (
                    <p style={{ textAlign: 'center', color: '#666' }}>Loading available slots...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="time-slots-grid">
                      {availableSlots.map(slot => {
                        const slotTime = typeof slot === 'string' ? slot : slot.time;
                        const isAvailable = typeof slot === 'string' ? true : (slot.available !== false);
                        const displayTime = slotTime ? slotTime.substring(0, 5) : '';
                        
                        return (
                          <button
                            key={slotTime}
                            type="button"
                            className={`time-slot ${editFormData.appointment_time === slotTime ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                            onClick={() => isAvailable && setEditFormData(prev => ({ ...prev, appointment_time: slotTime }))}
                            disabled={!isAvailable}
                          >
                            {displayTime}
                            {!isAvailable && <span> ✕</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#999' }}>No available slots for this date</p>
                  )}
                </div>
              )}
              
              <div className="form-group">
                <label>
                  <strong>Room Number (optional):</strong>
                  <input
                    type="text"
                    name="room_number"
                    value={editFormData.room_number || ''}
                    onChange={handleEditChange}
                    placeholder="e.g., Room 101"
                    className="edit-input"
                  />
                </label>
              </div>
              
              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#888' }}>Clinical Information (Provider Only - Read Only)</h4>
              
              <div className="form-group">
                <label>
                  <strong>Diagnosis:</strong>
                  <textarea
                    name="diagnosis"
                    value={editFormData.diagnosis || ''}
                    readOnly
                    placeholder="To be filled by provider after appointment..."
                    rows="2"
                    className="edit-input readonly-field"
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </label>
                <small style={{ color: '#666', fontSize: '12px' }}>✏️ Only providers can edit this field</small>
              </div>
              
              <div className="form-group">
                <label>
                  <strong>Treatment:</strong>
                  <textarea
                    name="treatment"
                    value={editFormData.treatment || ''}
                    readOnly
                    placeholder="To be filled by provider after appointment..."
                    rows="2"
                    className="edit-input readonly-field"
                    style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </label>
                <small style={{ color: '#666', fontSize: '12px' }}>✏️ Only providers can edit this field</small>
              </div>
              
              <div className="form-group">
                <label>
                  <strong>General Notes:</strong>
                  <textarea
                    name="notes"
                    value={editFormData.notes || ''}
                    onChange={handleEditChange}
                    placeholder="Administrative notes..."
                    rows="3"
                    className="edit-input"
                  />
                </label>
              </div>

              <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: '#888' }}>Follow-up Information</h4>
              
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="follow_up_required"
                    checked={editFormData.follow_up_required || false}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, follow_up_required: e.target.checked }))}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <strong>Follow-up Required</strong>
                </label>
              </div>

              {editFormData.follow_up_required && (
                <>
                  <div className="form-group">
                    <label>
                      <strong>Next Visit Date:</strong>
                      <input
                        type="date"
                        name="next_visit_date"
                        value={editFormData.next_visit_date || ''}
                        onChange={handleEditChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="edit-input"
                      />
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <strong>Follow-up Notes:</strong>
                      <textarea
                        name="follow_up_notes"
                        value={editFormData.follow_up_notes || ''}
                        onChange={handleEditChange}
                        placeholder="Reason for follow-up, specific instructions..."
                        rows="2"
                        className="edit-input"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={handleEditModalClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleEditSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
