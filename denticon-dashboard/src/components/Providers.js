import React, { useState, useEffect } from 'react';
import './Providers.css';
import { getProvidersAPI } from '../services/api';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await getProvidersAPI();
      setProviders(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setLoading(false);
    }
  };

  const handleViewProfile = (provider) => {
    alert(`Viewing profile for ${provider.firstName} ${provider.lastName}\n\n` +
      `Specialty: ${provider.specialty}\n` +
      `Experience: ${provider.experience || 'N/A'}\n` +
      `Education: ${provider.education || 'N/A'}\n` +
      `Patients: ${provider.patientsCount || 0}\n` +
      `Rating: ${provider.rating || 'N/A'}`);
  };

  if (loading) {
    return <div className="loading">Loading providers...</div>;
  }

  return (
    <div className="providers">
      <div className="page-header">
        <h2>Healthcare Providers</h2>
        <button className="add-btn">➕ Add Provider</button>
      </div>

      <div className="providers-grid">
        {providers.map(provider => (
          <div key={provider.id} className="provider-card">
            <div className="provider-avatar">👨‍⚕️</div>
            <h3>{`${provider.firstName} ${provider.lastName}`}</h3>
            <p className="specialty">{provider.specialty}</p>
            
            <div className="provider-stats">
              <div className="stat">
                <span className="stat-value">{provider.patientsCount || 0}</span>
                <span className="stat-label">Patients</span>
              </div>
              <div className="stat">
                <span className="stat-value">⭐ {provider.rating || 4.5}</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>

            <div className="provider-footer">
              <span className={`availability ${provider.isActive ? 'available' : 'inactive'}`}>
                {provider.isActive ? 'Available' : 'Inactive'}
              </span>
              <button className="view-btn" onClick={() => handleViewProfile(provider)}>View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Providers;
