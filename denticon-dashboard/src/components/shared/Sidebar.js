import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState(null);

  // Get user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Menu items based on role
  const getMenuItems = () => {
    if (user?.role === 'provider') {
      return [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/provider/dashboard' },
        { id: 'appointments', icon: '📅', label: 'My Appointments', path: '/provider/appointments' },
        { id: 'patients', icon: '👥', label: 'My Patients', path: '/provider/patients' },
        { id: 'schedule', icon: '🗓️', label: 'My Schedule', path: '/provider/schedule' }
      ];
    } else if (user?.role === 'front_desk') {
      return [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/frontdesk/dashboard' },
        { id: 'patients', icon: '👥', label: 'Patients', path: '/patients' },
        { id: 'appointments', icon: '📅', label: 'Appointments', path: '/appointments' },
        { id: 'appointment-requests', icon: '📋', label: 'Appointment Requests', path: '/appointment-requests', badge: pendingCount },
        { id: 'share-link', icon: '🔗', label: 'Share Booking Link', path: '/share-link' }
      ];
    } else {
      // Admin menu
      return [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
        { id: 'patients', icon: '👥', label: 'Patients', path: '/patients' },
        { id: 'appointments', icon: '📅', label: 'Appointments', path: '/appointments' },
        { id: 'appointment-requests', icon: '📋', label: 'Appointment Requests', path: '/appointment-requests', badge: pendingCount },
        { id: 'providers', icon: '👨‍⚕️', label: 'Providers', path: '/providers' },
        { id: 'locations', icon: '📍', label: 'Locations', path: '/locations' },
        { id: 'share-link', icon: '🔗', label: 'Share Booking Link', path: '/share-link' }
      ];
    }
  };

  const menuItems = getMenuItems();

  // Fetch pending appointment requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await api.get('/AppointmentRequest?status=pending&count=1');
        if (response.data && response.data.pagination) {
          setPendingCount(response.data.pagination.total);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    fetchPendingCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (item) => {
    setActiveTab(item.id);
    navigate(item.path);
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <span className="logo-icon">🦷</span>
        <h2>Denticon</h2>
      </div>
      
      <nav className="nav-menu">
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div 
          className={`nav-item ${activeTab === 'api-docs' ? 'active' : ''}`}
          onClick={() => handleNavigation({ id: 'api-docs', path: '/api-docs' })}
        >
          <span className="nav-icon">🔌</span>
          <span className="nav-label">API Docs</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
