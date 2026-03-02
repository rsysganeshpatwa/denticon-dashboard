import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Appointments from './components/Appointments';
import Providers from './components/Providers';
import Locations from './components/Locations';
import ApiDocs from './components/ApiDocs';
import Login from './components/Login';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to false to test login

  const handleLogin = (credentials) => {
    // Simple mock authentication
    if (credentials.username === 'admin' && credentials.password === 'demo123') {
      setIsLoggedIn(true);
    } else if (credentials.username && credentials.password) {
      setIsLoggedIn(true);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('dashboard');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <header className="app-header">
          <h1>Denticon API Dashboard</h1>
          <div className="header-right">
            <div className="search-box">
              <input type="text" placeholder="Search..." />
              <span className="search-icon">🔍</span>
            </div>
            <div className="user-profile">
              <span className="user-avatar">👤</span>
              <span className="user-name">Admin User</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'patients' && <Patients />}
          {activeTab === 'appointments' && <Appointments />}
          {activeTab === 'providers' && <Providers />}
          {activeTab === 'locations' && <Locations />}
          {activeTab === 'api-docs' && <ApiDocs />}
        </div>
      </div>
    </div>
  );
}

export default App;
