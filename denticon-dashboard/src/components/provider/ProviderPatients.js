import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../admin/Patients.css';

function ProviderPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/provider-portal/patients');
      
      if (response.data && response.data.data) {
        setPatients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewPatientDetails = async (patientId) => {
    try {
      const response = await api.get(`/provider-portal/patients/${patientId}`);
      console.log('Patient details response:', response.data);
      
      if (response.data && response.data.data) {
        // Backend returns { data: { patient: {...}, appointments: [...] } }
        const responseData = response.data.data;
        const patientData = responseData.patient || responseData;
        const appointments = responseData.appointments || [];
        
        console.log('Patient data:', patientData);
        console.log('Appointments:', appointments);
        
        setSelectedPatient(patientData);
        setPatientAppointments(appointments);
        setShowDetailsModal(true);
      } else {
        console.error('Unexpected response structure:', response.data);
        alert('Failed to load patient details - unexpected response format');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      alert(`Failed to load patient details: ${error.response?.data?.message || error.message}`);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

  return (
    <div className="patients-container">
      <div className="patients-header">
        <h2>My Patients</h2>
        <p>Patients under your care</p>
      </div>

      {/* Patients List */}
      <div className="patients-list">
        {patients.length === 0 ? (
          <div className="no-data">
            <p>No patients found</p>
          </div>
        ) : (
          <table className="patients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Last Visit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <strong>{patient.first_name} {patient.last_name}</strong>
                  </td>
                  <td>{calculateAge(patient.date_of_birth)}</td>
                  <td>{patient.gender || 'N/A'}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.email}</td>
                  <td>{formatDate(patient.last_appointment_date)}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => viewPatientDetails(patient.id)}
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="patient-info-grid">
                <div className="info-group">
                  <label>Name:</label>
                  <p>{selectedPatient.first_name} {selectedPatient.last_name}</p>
                </div>
                <div className="info-group">
                  <label>Date of Birth:</label>
                  <p>{formatDate(selectedPatient.date_of_birth)}</p>
                </div>
                <div className="info-group">
                  <label>Gender:</label>
                  <p>{selectedPatient.gender || 'N/A'}</p>
                </div>
                <div className="info-group">
                  <label>Phone:</label>
                  <p>{selectedPatient.phone}</p>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <p>{selectedPatient.email || 'N/A'}</p>
                </div>
                <div className="info-group">
                  <label>Address:</label>
                  <p>
                    {selectedPatient.address && `${selectedPatient.address}, `}
                    {selectedPatient.city && `${selectedPatient.city}, `}
                    {selectedPatient.state} {selectedPatient.zip_code}
                  </p>
                </div>
                {selectedPatient.medical_history && (
                  <div className="info-group full-width">
                    <label>Medical History:</label>
                    <p>{selectedPatient.medical_history}</p>
                  </div>
                )}
                {selectedPatient.diagnosis && (
                  <div className="info-group full-width">
                    <label>Diagnosis:</label>
                    <p>{selectedPatient.diagnosis}</p>
                  </div>
                )}
              </div>
              
              {/* Appointment History */}
              {patientAppointments && patientAppointments.length > 0 && (
                <div className="appointment-history">
                  <h4>Appointment History</h4>
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td>{formatDate(apt.appointment_date)}</td>
                          <td>{formatTime(apt.appointment_time)}</td>
                          <td>{apt.appointment_type || 'General'}</td>
                          <td>
                            <span className={`status-badge status-${apt.status}`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderPatients;
