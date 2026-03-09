import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getPatientsAPI, getAppointmentsAPI, getProvidersAPI, getLocationsAPI } from '../../services/api';
import api from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalProviders: 0,
    totalLocations: 0,
    todayAppointments: 0,
    pendingRequests: 0,
    activeProviders: 0,
    inactiveProviders: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [patientsData, appointmentsData, providersData, locationsData, requestsData] = await Promise.all([
        getPatientsAPI(),
        getAppointmentsAPI(),
        getProvidersAPI(),
        getLocationsAPI(),
        api.get('/AppointmentRequest?status=pending')
      ]);

      const allAppointments = appointmentsData.data || [];
      const allProviders = providersData.data || [];
      const allRequests = requestsData.data?.data || [];
      
      console.log('Dashboard - All appointments:', allAppointments);
      console.log('Dashboard - Pending requests:', allRequests);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = allAppointments.filter(apt => 
        apt.appointment_date?.startsWith(today) || apt.appointmentDate?.startsWith(today)
      );

      // Count active and inactive providers
      const activeProviders = allProviders.filter(p => p.is_active === true).length;
      const inactiveProviders = allProviders.filter(p => p.is_active === false).length;

      // Count pending requests (already filtered by API)
      const pendingRequests = allRequests.length;

      setStats({
        totalPatients: patientsData.data?.length || 0,
        totalAppointments: allAppointments.length,
        totalProviders: allProviders.length,
        totalLocations: locationsData.data?.length || 0,
        todayAppointments: todayAppointments.length,
        pendingRequests: pendingRequests,
        activeProviders: activeProviders,
        inactiveProviders: inactiveProviders
      });

      // Sort appointments by date and time (most recent first) and take top 5
      const sortedAppointments = [...allAppointments].sort((a, b) => {
        const dateA = new Date(`${a.appointment_date || a.appointmentDate} ${a.appointment_time || a.appointmentTime}`);
        const dateB = new Date(`${b.appointment_date || b.appointmentDate} ${b.appointment_time || b.appointmentTime}`);
        return dateB - dateA; // Descending order (most recent first)
      });
      
      setAppointments(sortedAppointments.slice(0, 5));
      setAppointmentRequests(allRequests.slice(0, 3)); // Already filtered by API
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // If time is in HH:MM:SS format, convert to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleTodayAppointments = () => {
    navigate('/appointments');
  };

  const handlePendingRequests = () => {
    navigate('/appointment-requests');
  };

  const handleManageProviders = () => {
    navigate('/providers');
  };

  const handleManageLocations = () => {
    navigate('/locations');
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalPatients}</h3>
            <p>Total Patients</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{stats.totalAppointments}</h3>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-info">
            <h3>{stats.totalProviders}</h3>
            <p>Active Providers</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <h3>{stats.totalLocations}</h3>
            <p>Clinic Locations</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-section">
          <h2>Recent Appointments</h2>
          <div className="appointment-list">
            {appointments.length > 0 ? (
              appointments.map(apt => (
                <div key={apt.id} className="appointment-item">
                  <div className="apt-time">
                    <div>{formatDate(apt.appointment_date || apt.appointmentDate)}</div>
                    <small>{formatTime(apt.appointment_time || apt.appointmentTime)}</small>
                  </div>
                  <div className="apt-details">
                    <strong>{apt.patient_name || apt.patientName || `Patient ID: ${apt.patient_id || apt.patientId}`}</strong>
                    <span>{apt.provider_name || apt.providerName || `Provider ID: ${apt.provider_id || apt.providerId}`}</span>
                  </div>
                  <div className={`apt-status ${apt.status?.toLowerCase() || 'scheduled'}`}>
                    {apt.status}
                  </div>
                </div>
              ))
            ) : (
              <p>No appointments available</p>
            )}
          </div>
        </div>

        <div className="activity-section">
          <h2>Admin Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleTodayAppointments}>
              <span>📅</span>
              <div className="action-info">
                <strong>Today's Appointments</strong>
                <small>{stats.todayAppointments} scheduled</small>
              </div>
            </button>
            <button className="action-btn secondary" onClick={handlePendingRequests}>
              <span>⏳</span>
              <div className="action-info">
                <strong>Pending Requests</strong>
                <small>{stats.pendingRequests} waiting</small>
              </div>
            </button>
            <button className="action-btn tertiary" onClick={handleManageProviders}>
              <span>�‍⚕️</span>
              <div className="action-info">
                <strong>Manage Providers</strong>
                <small>{stats.activeProviders} active, {stats.inactiveProviders} inactive</small>
              </div>
            </button>
            <button className="action-btn quaternary" onClick={handleManageLocations}>
              <span>📍</span>
              <div className="action-info">
                <strong>Manage Locations</strong>
                <small>{stats.totalLocations} locations</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
