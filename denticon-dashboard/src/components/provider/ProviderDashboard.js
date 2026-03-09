import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ProviderDashboard.css';

function ProviderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    today_appointments: 0,
    today_scheduled: 0,
    today_completed: 0,
    upcoming_appointments: 0,
    recent_noshows: 0,
    followUpPatients: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [followUpAppointments, setFollowUpAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchProviderData();
  }, []);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      
      // Fetch provider stats
      const statsResponse = await api.get('/provider-portal/dashboard/stats');
      if (statsResponse.data && statsResponse.data.data) {
        setStats(statsResponse.data.data);
      }

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await api.get(`/provider-portal/appointments?date=${today}`);
      if (appointmentsResponse.data && appointmentsResponse.data.data) {
        setTodayAppointments(appointmentsResponse.data.data);
      }

      // Fetch completed appointments with follow-up required
      const completedResponse = await api.get('/provider-portal/appointments?status=completed');
      if (completedResponse.data && completedResponse.data.data) {
        const followUps = completedResponse.data.data.filter(apt => apt.follow_up_required);
        setFollowUpAppointments(followUps);
        // Update stats with follow-up count
        setStats(prev => ({ ...prev, followUpPatients: followUps.length }));
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleFollowUpClick = (appointment) => {
    // Store patient info in localStorage for filtering on appointments page
    localStorage.setItem('highlightedPatient', JSON.stringify({
      id: appointment.patient_id,
      name: appointment.patient_name
    }));
    // Navigate to appointments page
    navigate('/provider/appointments');
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
    return <div className="loading">Loading provider dashboard...</div>;
  }

  return (
    <div className="provider-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, Dr. {user?.username || 'Provider'}</h2>
        <p className="subtitle">Your schedule and patient information</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.today_appointments}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.today_scheduled}</h3>
            <p>Scheduled Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">�</div>
          <div className="stat-content">
            <h3>{stats.upcoming_appointments}</h3>
            <p>Upcoming Appointments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <h3>{stats.today_completed}</h3>
            <p>Completed Today</p>
          </div>
        </div>
        <div className="stat-card follow-up-stat">
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <h3>{stats.followUpPatients}</h3>
            <p>Follow-up Required</p>
          </div>
        </div>
      </div>

      {/* Follow-up Required Section */}
      {followUpAppointments.length > 0 && (
        <div className="appointments-section follow-up-section">
          <h3>
            <span className="follow-up-badge">🔔</span> Patients Requiring Follow-up
          </h3>
          <div className="info-box">
            <p>📋 Click on any patient card to view and schedule their follow-up appointment</p>
          </div>
          <div className="appointments-list">
            {followUpAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="provider-appointment-card follow-up-required clickable-appointment"
                onClick={() => handleFollowUpClick(appointment)}
                style={{ cursor: 'pointer' }}
              >
                <div className="appointment-time">
                  <span className="time">{formatDate(appointment.next_visit_date)}</span>
                  <span className="date">Next Visit</span>
                </div>
                <div className="appointment-details">
                  <h4>{appointment.patient_name}</h4>
                  <p className="appointment-type">Last Visit: {formatDate(appointment.appointment_date)}</p>
                  {appointment.follow_up_notes && (
                    <p className="appointment-notes">
                      <strong>Follow-up Notes:</strong> {appointment.follow_up_notes}
                    </p>
                  )}
                </div>
                <div className="appointment-status">
                  <span className="status-badge status-follow-up">
                    Follow-up Due
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Appointments */}
      <div className="appointments-section">
        <h3>Today's Appointments</h3>
        {todayAppointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="appointments-list">
            {todayAppointments.map((appointment) => (
              <div key={appointment.id} className="provider-appointment-card">
                <div className="appointment-time">
                  <span className="time">{formatTime(appointment.appointment_time)}</span>
                </div>
                <div className="appointment-details">
                  <h4>{appointment.patient_name}</h4>
                  <p className="appointment-type">{appointment.appointment_type || 'General Checkup'}</p>
                  {appointment.notes && (
                    <p className="appointment-notes">
                      <strong>Notes:</strong> {appointment.notes}
                    </p>
                  )}
                </div>
                <div className="appointment-status">
                  <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => window.location.href = '/provider/appointments'}>
            <span className="action-icon">📅</span>
            <span>My Appointments</span>
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/provider/patients'}>
            <span className="action-icon">👥</span>
            <span>My Patients</span>
          </button>
          <button className="action-btn" onClick={() => alert('Schedule management coming soon!')}>
            <span className="action-icon">🕒</span>
            <span>Manage Schedule</span>
          </button>
          <button className="action-btn" onClick={() => alert('Profile settings coming soon!')}>
            <span className="action-icon">⚙️</span>
            <span>Profile Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProviderDashboard;
