import React, { useState, useEffect } from 'react';
import './Patients.css';
import api from '../../services/api';
import EditPatient from '../shared/EditPatient';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    count: 10,
    total: 0,
    totalPages: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/Patient?page=${pagination.page}&count=${pagination.count}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await api.get(url);
      
      if (response.data && response.data.data) {
        setPatients(response.data.data);
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total,
            totalPages: response.data.pagination.totalPages
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setError('Failed to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAddNew = () => {
    setSelectedPatient(null);
    setShowEditModal(true);
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleSave = async (patientData) => {
    try {
      // Convert form field names to API field names
      const apiData = {
        first_name: patientData.firstName,
        last_name: patientData.lastName,
        email: patientData.email,
        phone: patientData.phone,
        date_of_birth: patientData.dateOfBirth,
        address: patientData.address,
        city: patientData.city,
        state: patientData.state,
        zip_code: patientData.zipCode,
        insurance_provider: patientData.insuranceProvider
      };

      if (selectedPatient) {
        // Update existing patient
        await api.put(`/Patient/${selectedPatient.id}`, apiData);
        alert('Patient updated successfully!');
      } else {
        // Create new patient
        await api.post('/Patient', apiData);
        alert('Patient created successfully!');
      }
      
      setShowEditModal(false);
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      alert(`Failed to save patient: ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  const handleDelete = async (patient) => {
    if (window.confirm(`Are you sure you want to delete ${patient.first_name} ${patient.last_name}?`)) {
      try {
        await api.delete(`/Patient/${patient.id}`);
        alert('Patient deleted successfully!');
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient. Please try again.');
      }
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

  return (
    <div className="patients">
      <div className="page-header">
        <h2>Patient Management</h2>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <button className="add-btn" onClick={handleAddNew}>➕ Add New Patient</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

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
                    {`${patient.first_name} ${patient.last_name}`}
                  </div>
                </td>
                <td>{patient.email || 'N/A'}</td>
                <td>{patient.phone}</td>
                <td>{patient.last_visit_date ? new Date(patient.last_visit_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={`status-badge ${patient.is_active ? 'active' : 'inactive'}`}>
                    {patient.is_active ? 'Active' : 'Inactive'}
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

      {showEditModal && (
        <EditPatient
          patient={selectedPatient}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Patients;
