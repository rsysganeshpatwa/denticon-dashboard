import React, { useState, useEffect } from 'react';
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
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [cancelReason, setCancelReason] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: ''
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
        setAppointments(response.data.data);
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

  const handleSchedule = () => {
    alert('Schedule new appointment - Feature coming soon!');
  };

  const handleEdit = (apt) => {
    setSelectedAppointment(apt);
    setEditFormData({
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time,
      notes: apt.notes || '',
      room_number: apt.room_number || '',
      diagnosis: apt.diagnosis || '',
      treatment: apt.treatment || ''
    });
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setSelectedAppointment(null);
    setEditFormData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
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
      </div>

      <div className="appointments-grid">
        {appointments.map(apt => (
          <div key={apt.id} className="appointment-card">
            <div className="card-header">
              <span className={`status-dot ${apt.status?.toLowerCase() || 'scheduled'}`}></span>
              <span className="apt-type">{apt.appointment_type || 'General'}</span>
            </div>
            <div className="card-body">
              <h3>{apt.patient_name}</h3>
              <p className="provider"><FaUserMd /> {apt.provider_name}</p>
              <p className="location">📍 {apt.location_name}</p>
              <div className="apt-details">
                <span className="detail">📅 {formatDate(apt.appointment_date)}</span>
                <span className="detail">🕒 {formatTime(apt.appointment_time)}</span>
              </div>
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
                  <input
                    type="date"
                    name="appointment_date"
                    value={editFormData.appointment_date || ''}
                    onChange={handleEditChange}
                    className="edit-input"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  <strong>Appointment Time:</strong>
                  <input
                    type="time"
                    name="appointment_time"
                    value={editFormData.appointment_time || ''}
                    onChange={handleEditChange}
                    className="edit-input"
                  />
                </label>
              </div>
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
