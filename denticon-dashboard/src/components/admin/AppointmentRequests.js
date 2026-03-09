import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AppointmentRequests.css';

function AppointmentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    location_id: '',
    provider_id: ''
  });
  const [locations, setLocations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let url = `/AppointmentRequest?`;
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.location_id) url += `location_id=${filters.location_id}&`;
      if (filters.provider_id) url += `provider_id=${filters.provider_id}&`;

      const response = await api.get(url);
      if (response.data && response.data.data) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showNotification('Failed to fetch appointment requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchProviders();
  }, []);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchLocations = async () => {
    try {
      const response = await api.get(`/Location`);
      if (response.data && response.data.data) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get(`/Provider`);
      if (response.data && response.data.data) {
        setProviders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this appointment request?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await api.put(
        `/AppointmentRequest/${requestId}/approve`,
        {}
      );
      
      if (response.data && response.data.statusCode === 200) {
        showNotification('Appointment request approved successfully!', 'success');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showNotification(
        error.response?.data?.message || 'Failed to approve request',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const response = await api.put(
        `/AppointmentRequest/${requestId}/reject`,
        { reason }
      );
      
      if (response.data && response.data.statusCode === 200) {
        showNotification('Appointment request rejected', 'success');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showNotification(
        error.response?.data?.message || 'Failed to reject request',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      cancelled: 'status-cancelled'
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status.toUpperCase()}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not specified';
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="appointment-requests">
      <div className="requests-header">
        <h1>Appointment Requests</h1>
        <button onClick={fetchRequests} className="refresh-btn" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="location_id">Location:</label>
          <select
            id="location_id"
            name="location_id"
            value={filters.location_id}
            onChange={handleFilterChange}
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="provider_id">Provider:</label>
          <select
            id="provider_id"
            name="provider_id"
            value={filters.provider_id}
            onChange={handleFilterChange}
          >
            <option value="">All Providers</option>
            {providers.map(prov => (
              <option key={prov.id} value={prov.id}>
                Dr. {prov.first_name} {prov.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading appointment requests...</div>
      ) : requests.length === 0 ? (
        <div className="no-data">No appointment requests found</div>
      ) : (
        <div className="requests-grid">
          {requests.map(request => (
            <div key={request.id} className="request-card">
              <div className="card-header">
                <div className="patient-info">
                  <h3>{request.patient_name}</h3>
                  <span className="patient-details">
                    {request.age} years, {request.gender}
                  </span>
                  {getStatusBadge(request.status)}
                </div>
                <div className="contact-info">
                  <span>📧 {request.email || 'Not provided'}</span>
                  <span>📞 {request.phone}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <strong>Location:</strong>
                  <span>{request.location_name || 'Not specified'}</span>
                </div>

                <div className="info-row">
                  <strong>Provider:</strong>
                  <span>
                    {request.provider_name ? `Dr. ${request.provider_name}` : 'Auto-assigned'}
                  </span>
                </div>

                <div className="info-row">
                  <strong>Requested Date:</strong>
                  <span>{formatDate(request.preferred_date)}</span>
                </div>

                <div className="info-row">
                  <strong>Requested Time:</strong>
                  <span>{formatTime(request.preferred_time)}</span>
                </div>

                {request.reason_for_visit && (
                  <div className="info-row">
                    <strong>Reason for Visit:</strong>
                    <span>{request.reason_for_visit}</span>
                  </div>
                )}

                {request.diagnosis_history && (
                  <div className="info-row">
                    <strong>Medical History:</strong>
                    <span>{request.diagnosis_history}</span>
                  </div>
                )}

                <div className="info-row">
                  <strong>Submitted:</strong>
                  <span>{formatDateTime(request.submitted_at)}</span>
                </div>

                {request.rejection_reason && (
                  <div className="rejection-reason">
                    <strong>Rejection Reason:</strong>
                    <p>{request.rejection_reason}</p>
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <div className="card-actions">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="approve-btn"
                    disabled={actionLoading}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="reject-btn"
                    disabled={actionLoading}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentRequests;
