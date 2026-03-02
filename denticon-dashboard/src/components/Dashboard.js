import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import { getPatientsAPI, getAppointmentsAPI, getProvidersAPI, getLocationsAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalProviders: 0,
    totalLocations: 0,
    patientsGrowth: 0,
    appointmentsGrowth: 0,
    providersGrowth: 0,
    locationsGrowth: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock previous month data for comparison
  const calculateGrowth = useCallback((current, previous) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [patientsData, appointmentsData, providersData, locationsData] = await Promise.all([
        getPatientsAPI(),
        getAppointmentsAPI(),
        getProvidersAPI(),
        getLocationsAPI()
      ]);

      const currentPatients = patientsData.data?.length || 0;
      const currentAppointments = appointmentsData.data?.length || 0;
      const currentProviders = providersData.data?.length || 0;
      const currentLocations = locationsData.data?.length || 0;

      // Mock previous month data (simulating last month had fewer records)
      const previousPatients = Math.max(1, currentPatients - 1); // Last month had 1 less patient
      const previousAppointments = Math.max(1, currentAppointments - 2); // 2 less appointments
      const previousProviders = currentProviders; // Same providers
      const previousLocations = currentLocations; // Same locations

      setStats({
        totalPatients: currentPatients,
        totalAppointments: currentAppointments,
        totalProviders: currentProviders,
        totalLocations: currentLocations,
        patientsGrowth: calculateGrowth(currentPatients, previousPatients),
        appointmentsGrowth: calculateGrowth(currentAppointments, previousAppointments),
        providersGrowth: calculateGrowth(currentProviders, previousProviders),
        locationsGrowth: calculateGrowth(currentLocations, previousLocations)
      });

      setAppointments(appointmentsData.data?.slice(0, 4) || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, [calculateGrowth]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAddPatient = () => {
    alert('Add Patient - Feature coming soon!\nThis will open a form to add a new patient.');
  };

  const handleNewAppointment = () => {
    alert('Schedule New Appointment - Feature coming soon!\nThis will open the appointment scheduling form.');
  };

  const handleViewReports = () => {
    alert('View Reports - Feature coming soon!\nThis will show detailed analytics and reports.');
  };

  const handleSettings = () => {
    alert('Settings - Feature coming soon!\nThis will open the system settings panel.');
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
                  <div className="apt-time">{apt.appointmentTime}</div>
                  <div className="apt-details">
                    <strong>{apt.patientName || `Patient ID: ${apt.patientId}`}</strong>
                    <span>{apt.providerName || `Provider ID: ${apt.providerId}`}</span>
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
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleAddPatient}>
              <span>➕</span>
              Add Patient
            </button>
            <button className="action-btn secondary" onClick={handleNewAppointment}>
              <span>📅</span>
              New Appointment
            </button>
            <button className="action-btn tertiary" onClick={handleViewReports}>
              <span>📊</span>
              View Reports
            </button>
            <button className="action-btn quaternary" onClick={handleSettings}>
              <span>⚙️</span>
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
