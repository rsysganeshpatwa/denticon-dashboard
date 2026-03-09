import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FrontDeskDashboard.css';

function FrontDeskDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingRequests: 0,
    checkedInToday: 0,
    totalPatients: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await api.get(`/Appointment?date_from=${today}&date_to=${today}&count=10`);
      
      if (appointmentsResponse.data && appointmentsResponse.data.data) {
        const appointments = appointmentsResponse.data.data;
        setRecentAppointments(appointments);
        
        // Calculate stats
        setStats({
          todayAppointments: appointments.length,
          pendingRequests: 0, // Will be fetched separately if needed
          checkedInToday: appointments.filter(a => a.status === 'confirmed').length,
          totalPatients: appointmentsResponse.data.pagination?.total || appointments.length
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getStatusClass = (status) => {
    const statusMap = {
      'scheduled': 'status-scheduled',
      'confirmed': 'status-confirmed',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no-show': 'status-no-show'
    };
    return statusMap[status] || 'status-default';
  };

  if (loading) {
    return <div className="loading">Loading front desk dashboard...</div>;
  }

  return (
    <div className="frontdesk-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.username || 'Front Desk'}</h2>
        <p className="subtitle">Manage appointments and patient check-ins</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.todayAppointments}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.checkedInToday}</h3>
            <p>Checked In Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingRequests}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalPatients}</h3>
            <p>Total Patients</p>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="appointments-section">
        <h3>Today's Appointments</h3>
        {recentAppointments.length === 0 ? (
          <div className="no-appointments">
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="appointments-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="time-cell">{formatTime(appointment.appointmentTime)}</td>
                    <td>{appointment.patientName || `${appointment.first_name} ${appointment.last_name}`}</td>
                    <td>{appointment.providerName || 'N/A'}</td>
                    <td>{appointment.type || 'General'}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-small" onClick={() => alert('Check-in functionality coming soon')}>
                        Check In
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => window.location.href = '/appointments'}>
            <span className="action-icon">📅</span>
            <span>View All Appointments</span>
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/patients'}>
            <span className="action-icon">👥</span>
            <span>Patient List</span>
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/appointment-requests'}>
            <span className="action-icon">📋</span>
            <span>Appointment Requests</span>
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/book-appointment'}>
            <span className="action-icon">➕</span>
            <span>Book New Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FrontDeskDashboard;
