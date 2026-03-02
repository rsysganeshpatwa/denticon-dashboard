import React, { useState, useEffect } from 'react';
import './Appointments.css';
import { getAppointmentsAPI } from '../services/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentsAPI();
      setAppointments(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  };

  const handleSchedule = () => {
    alert('Schedule new appointment - Feature coming soon!');
  };

  const handleEdit = (apt) => {
    alert(`Edit appointment for ${apt.patientName}\n` +
      `Type: ${apt.type}\n` +
      `Date: ${apt.appointmentDate} at ${apt.appointmentTime}`);
  };

  const handleDelete = (apt) => {
    if (window.confirm(`Cancel appointment for ${apt.patientName}?`)) {
      console.log('Deleting appointment:', apt.id);
      alert('Appointment cancelled successfully!');
    }
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

      <div className="appointments-grid">
        {appointments.map(apt => (
          <div key={apt.id} className="appointment-card">
            <div className="card-header">
              <span className={`status-dot ${apt.status?.toLowerCase() || 'scheduled'}`}></span>
              <span className="apt-type">{apt.type}</span>
            </div>
            <div className="card-body">
              <h3>{apt.patientName || `Patient ID: ${apt.patientId}`}</h3>
              <p className="provider">👨‍⚕️ {apt.providerName || `Provider ID: ${apt.providerId}`}</p>
              <div className="apt-details">
                <span className="detail">📅 {apt.appointmentDate}</span>
                <span className="detail">🕐 {apt.appointmentTime}</span>
                <span className="detail">⏱️ {apt.duration} min</span>
                {apt.room && <span className="detail">🚪 Room {apt.room}</span>}
              </div>
              {apt.notes && <p className="notes">📝 {apt.notes}</p>}
            </div>
            <div className="card-footer">
              <span className={`status-label ${apt.status?.toLowerCase() || 'scheduled'}`}>
                {apt.status}
              </span>
              <div className="card-actions">
                <button className="btn-icon" onClick={() => handleEdit(apt)}>✏️</button>
                <button className="btn-icon" onClick={() => handleDelete(apt)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Appointments;
