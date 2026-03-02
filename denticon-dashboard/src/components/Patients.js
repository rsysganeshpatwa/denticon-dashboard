import React, { useState, useEffect } from 'react';
import './Patients.css';
import { getPatientsAPI } from '../services/api';
import EditPatient from './EditPatient';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await getPatientsAPI();
      setPatients(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedPatient(null);
    setShowEditModal(true);
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleSave = (patientData) => {
    console.log('Saving patient:', patientData);
    setShowEditModal(false);
    // In real app, would call API here
    alert('Patient saved successfully!');
  };

  const handleDelete = (patient) => {
    if (window.confirm(`Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`)) {
      console.log('Deleting patient:', patient.id);
      // In real app, would call API here
      alert('Patient deleted successfully!');
    }
  };

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

  return (
    <div className="patients">
      <div className="page-header">
        <h2>Patient Management</h2>
        <button className="add-btn" onClick={handleAddNew}>➕ Add New Patient</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Last Visit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id}>
                <td>#{patient.id}</td>
                <td>
                  <div className="patient-name">
                    <span className="avatar">👤</span>
                    {`${patient.firstName} ${patient.lastName}`}
                  </div>
                </td>
                <td>{patient.email}</td>
                <td>{patient.phone}</td>
                <td>{patient.lastVisit || patient.dateOfBirth || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${patient.isActive ? 'active' : 'inactive'}`}>
                    {patient.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-edit" onClick={() => handleEdit(patient)}>✏️</button>
                    <button className="btn-delete" onClick={() => handleDelete(patient)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <EditPatient
          patientId={selectedPatient?.id}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Patients;
