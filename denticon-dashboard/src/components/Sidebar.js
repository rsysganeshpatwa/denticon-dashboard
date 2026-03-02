import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'patients', icon: '👥', label: 'Patients' },
    { id: 'appointments', icon: '📅', label: 'Appointments' },
    { id: 'providers', icon: '👨‍⚕️', label: 'Providers' },
    { id: 'locations', icon: '📍', label: 'Locations' }
  ];

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
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div 
          className={`nav-item ${activeTab === 'api-docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-docs')}
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
