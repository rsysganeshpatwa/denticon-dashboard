import React, { useState, useEffect } from 'react';
import './Locations.css';
import { getLocationsAPI, createLocationAPI, updateLocationAPI } from '../../services/api';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await getLocationsAPI();
      console.log('Locations API Response:', response);
      console.log('Locations data:', response.data);
      console.log('Number of locations:', response.data?.length);
      setLocations(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setModalMode('add');
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      email: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (location) => {
    setModalMode('edit');
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip_code: location.zip_code,
      phone: location.phone,
      email: location.email
    });
    setShowModal(true);
  };

  const handleViewClick = (location) => {
    setModalMode('view');
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zip_code: location.zip_code,
      phone: location.phone,
      email: location.email
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLocation(null);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await createLocationAPI(formData);
        alert('Location created successfully!');
      } else if (modalMode === 'edit') {
        await updateLocationAPI(selectedLocation.id, formData);
        alert('Location updated successfully!');
      }
      handleCloseModal();
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading locations...</div>;
  }

  return (
    <div className="locations">
      <div className="page-header">
        <h2>Clinic Locations</h2>
        <button className="add-btn" onClick={handleAddClick}>📍 Add Location</button>
      </div>

      <div className="locations-list">
        {locations.map(location => (
          <div key={location.id} className="location-card">
            <div className="location-header">
              <div className="location-icon">🏥</div>
              <div className="location-info">
                <h3>{location.name}</h3>
                <span className={`status-badge ${location.is_active ? 'active' : 'inactive'}`}>
                  {location.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="location-details">
              <div className="detail-row">
                <span className="icon">📍</span>
                <span>{location.address}, {location.city}, {location.state} {location.zip_code}</span>
              </div>
              <div className="detail-row">
                <span className="icon">📞</span>
                <span>{location.phone}</span>
              </div>
              <div className="detail-row">
                <span className="icon">✉️</span>
                <span>{location.email}</span>
              </div>
            </div>

            <div className="location-stats">
              <div className="mini-stat">
                <span className="mini-icon">👥</span>
                <div>
                  <strong>{location.total_patients || 0}</strong>
                  <span>Patients</span>
                </div>
              </div>
              <div className="mini-stat">
                <span className="mini-icon">👨‍⚕️</span>
                <div>
                  <strong>{location.total_providers || 0}</strong>
                  <span>Providers</span>
                </div>
              </div>
            </div>

            <div className="location-actions">
              <button className="action-btn" onClick={() => handleViewClick(location)}>View Details</button>
              <button className="action-btn secondary" onClick={() => handleEditClick(location)}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add/Edit/View */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === 'add' && '📍 Add New Location'}
                {modalMode === 'edit' && '✏️ Edit Location'}
                {modalMode === 'view' && '👁️ View Location Details'}
              </h3>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Location Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                  />
                </div>
              </div>

              {modalMode !== 'view' && (
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {modalMode === 'add' ? 'Create Location' : 'Update Location'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Locations;
