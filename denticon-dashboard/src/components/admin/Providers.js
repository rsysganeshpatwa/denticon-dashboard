import React, { useState, useEffect } from 'react';
import './Providers.css';
import api, { createProviderAPI, updateProviderAPI, getProviderByIdAPI } from '../../services/api';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location_id: '',
    specialization: '',
    is_active: 'true'
  });
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    location_id: '',
    experience_years: '',
    education: '',
    is_active: true
  });
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [providerAvailability, setProviderAvailability] = useState([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchProviders();
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
      setLoading(true);
      let url = `/Provider?`;
      if (filters.location_id) url += `location_id=${filters.location_id}&`;
      if (filters.specialization) url += `specialization=${encodeURIComponent(filters.specialization)}&`;
      if (filters.is_active) url += `is_active=${filters.is_active}&`;
      
      const response = await api.get(url);
      setProviders(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClick = () => {
    setModalMode('add');
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      specialization: '',
      location_id: '',
      experience_years: '',
      education: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleEditClick = async (provider) => {
    try {
      setModalMode('edit');
      setSelectedProvider(provider);
      // Fetch full provider details
      const response = await getProviderByIdAPI(provider.id);
      const fullProvider = response.data;
      setFormData({
        first_name: fullProvider.first_name || '',
        last_name: fullProvider.last_name || '',
        email: fullProvider.email || '',
        phone: fullProvider.phone || '',
        specialization: fullProvider.specialization || '',
        location_id: fullProvider.location_id || '',
        experience_years: fullProvider.experience_years || '',
        education: fullProvider.education || '',
        is_active: fullProvider.is_active !== undefined ? fullProvider.is_active : true
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching provider details:', error);
      alert('Error loading provider details');
    }
  };

  const handleViewClick = async (provider) => {
    try {
      setModalMode('view');
      setSelectedProvider(provider);
      // Fetch full provider details
      const response = await getProviderByIdAPI(provider.id);
      const fullProvider = response.data;
      setFormData({
        first_name: fullProvider.first_name || '',
        last_name: fullProvider.last_name || '',
        email: fullProvider.email || '',
        phone: fullProvider.phone || '',
        specialization: fullProvider.specialization || '',
        location_id: fullProvider.location_id || '',
        experience_years: fullProvider.experience_years || '',
        education: fullProvider.education || '',
        is_active: fullProvider.is_active !== undefined ? fullProvider.is_active : true
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching provider details:', error);
      alert('Error loading provider details');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProvider(null);
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
        await createProviderAPI(formData);
        alert('Provider created successfully!');
      } else if (modalMode === 'edit') {
        await updateProviderAPI(selectedProvider.id, formData);
        alert('Provider updated successfully!');
      }
      handleCloseModal();
      fetchProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('Error saving provider: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewProfile = (provider) => {
    handleViewClick(provider);
  };

  const handleViewAvailability = async (provider) => {
    try {
      setSelectedProvider(provider);
      const response = await api.get(`/Provider/${provider.id}/schedule`);
      setProviderAvailability(response.data?.data || []);
      setShowAvailabilityModal(true);
    } catch (error) {
      console.error('Error fetching provider availability:', error);
      alert('Error loading availability schedule');
    }
  };

  const handleCloseAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    setProviderAvailability([]);
    setSelectedProvider(null);
  };

  const getDayName = (dayNumber) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  if (loading) {
    return <div className="loading">Loading providers...</div>;
  }

  return (
    <div className="providers">
      <div className="page-header">
        <h2>Healthcare Providers</h2>
        <button className="add-btn" onClick={handleAddClick}>➕ Add Provider</button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Location:</label>
          <select name="location_id" value={filters.location_id} onChange={handleFilterChange}>
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Specialization:</label>
          <select name="specialization" value={filters.specialization} onChange={handleFilterChange}>
            <option value="">All Specializations</option>
            <option value="General Dentistry">General Dentistry</option>
            <option value="Orthodontics">Orthodontics</option>
            <option value="Oral Surgery">Oral Surgery</option>
            <option value="Periodontics">Periodontics</option>
            <option value="Endodontics">Endodontics</option>
            <option value="Pediatric Dentistry">Pediatric Dentistry</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select name="is_active" value={filters.is_active} onChange={handleFilterChange}>
            <option value="">All Providers</option>
            <option value="true">🟢 Active Only</option>
            <option value="false">🔴 Inactive Only</option>
          </select>
        </div>
      </div>

      <div className="providers-grid">
        {providers.map(provider => (
          <div key={provider.id} className="provider-card">
            <div className="provider-avatar">👨‍⚕️</div>
            <div className="provider-header-info">
              <h3>{`Dr. ${provider.first_name} ${provider.last_name}`}</h3>
              <button 
                className="schedule-btn-small" 
                onClick={() => handleViewAvailability(provider)}
                title="View Availability Schedule"
              >
                ⏰
              </button>
            </div>
            <p className="specialty">{provider.specialization}</p>
            
            <div className="provider-stats">
              <div className="stat">
                <span className="stat-value">{provider.patients_count || 0}</span>
                <span className="stat-label">Patients</span>
              </div>
              <div className="stat">
                <span className="stat-value">{provider.appointments_count || 0}</span>
                <span className="stat-label">Appointments</span>
              </div>
              <div className="stat">
                <span className="stat-value">{provider.experience_years || 0} yrs</span>
                <span className="stat-label">Experience</span>
              </div>
            </div>

            <div className="provider-footer">
              <span className={`availability ${provider.is_active ? 'available' : 'inactive'}`}>
                <span className="status-dot"></span>
                {provider.is_active ? 'Available' : 'Inactive'}
              </span>
              <div className="provider-actions">
                <button className="view-btn" onClick={() => handleViewProfile(provider)}>View</button>
                <button className="edit-btn" onClick={() => handleEditClick(provider)}>Edit</button>
              </div>
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
                {modalMode === 'add' && '➕ Add New Provider'}
                {modalMode === 'edit' && '✏️ Edit Provider'}
                {modalMode === 'view' && '👁️ View Provider Details'}
              </h3>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    required
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
                  <label>Specialization</label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                  >
                    <option value="">Select Specialization</option>
                    <option value="General Dentistry">General Dentistry</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Oral Surgery">Oral Surgery</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <select
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                  >
                    <option value="">Select Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Experience (years)</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    min="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Education</label>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleFormChange}
                    disabled={modalMode === 'view'}
                    rows="3"
                  />
                </div>

                {modalMode !== 'add' && (
                  <div className="form-group">
                    <label>Active Status</label>
                    <select
                      name="is_active"
                      value={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                      disabled={modalMode === 'view'}
                    >
                      <option value="true">🟢 Active</option>
                      <option value="false">🔴 Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              {modalMode !== 'view' && (
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {modalMode === 'add' ? 'Create Provider' : 'Update Provider'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && selectedProvider && (
        <div className="modal-overlay" onClick={handleCloseAvailabilityModal}>
          <div className="modal-content availability-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⏰ Availability Schedule - Dr. {selectedProvider.first_name} {selectedProvider.last_name}</h3>
              <button className="close-btn" onClick={handleCloseAvailabilityModal}>✕</button>
            </div>

            <div className="availability-content">
              {providerAvailability.length === 0 ? (
                <div className="no-availability">
                  <p>No availability schedule set for this provider.</p>
                  <p className="hint">Provider needs to set their working hours in their portal.</p>
                </div>
              ) : (
                <div className="availability-list">
                  {providerAvailability.map((schedule, index) => (
                    <div key={index} className="availability-item">
                      <div className="day-info">
                        <span className="day-name">{getDayName(schedule.day_of_week)}</span>
                        <span className={`status-badge ${schedule.is_active ? 'active' : 'inactive'}`}>
                          {schedule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="time-info">
                        <span className="time-label">⏰ Working Hours:</span>
                        <span className="time-value">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      </div>
                      <div className="slot-info">
                        <span className="slot-label">📊 Slot Duration:</span>
                        <span className="slot-value">{schedule.slot_duration} minutes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={handleCloseAvailabilityModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Providers;
