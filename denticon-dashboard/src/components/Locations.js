import React, { useState, useEffect } from 'react';
import './Locations.css';
import { getLocationsAPI } from '../services/api';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await getLocationsAPI();
      setLocations(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading locations...</div>;
  }

  return (
    <div className="locations">
      <div className="page-header">
        <h2>Clinic Locations</h2>
        <button className="add-btn">📍 Add Location</button>
      </div>

      <div className="locations-list">
        {locations.map(location => (
          <div key={location.id} className="location-card">
            <div className="location-header">
              <div className="location-icon">🏥</div>
              <div className="location-info">
                <h3>{location.name}</h3>
                <span className={`status-badge ${location.status.toLowerCase()}`}>
                  {location.status}
                </span>
              </div>
            </div>

            <div className="location-details">
              <div className="detail-row">
                <span className="icon">📍</span>
                <span>{location.address}</span>
              </div>
              <div className="detail-row">
                <span className="icon">📞</span>
                <span>{location.phone}</span>
              </div>
            </div>

            <div className="location-stats">
              <div className="mini-stat">
                <span className="mini-icon">👥</span>
                <div>
                  <strong>{location.totalPatients || 0}</strong>
                  <span>Patients</span>
                </div>
              </div>
              <div className="mini-stat">
                <span className="mini-icon">👨‍⚕️</span>
                <div>
                  <strong>{location.totalProviders || 0}</strong>
                  <span>Providers</span>
                </div>
              </div>
            </div>

            <div className="location-actions">
              <button className="action-btn">View Details</button>
              <button className="action-btn secondary">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Locations;
