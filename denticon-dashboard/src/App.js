import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Shared Components
import Sidebar from './components/shared/Sidebar';
import Login from './components/shared/Login';

// Admin Components
import Dashboard from './components/admin/Dashboard';
import Patients from './components/admin/Patients';
import Appointments from './components/admin/Appointments';
import Providers from './components/admin/Providers';
import Locations from './components/admin/Locations';
import ApiDocs from './components/admin/ApiDocs';
import UserManual from './components/admin/UserManual';
import AppointmentRequests from './components/admin/AppointmentRequests';

// Provider Components
import ProviderDashboard from './components/provider/ProviderDashboard';
import ProviderAppointments from './components/provider/ProviderAppointments';
import ProviderPatients from './components/provider/ProviderPatients';
import ProviderSchedule from './components/provider/ProviderSchedule';

// Front Desk Components
import FrontDeskDashboard from './components/frontdesk/FrontDeskDashboard';

// Public Components
import PublicAppointmentForm from './components/public/PublicAppointmentForm';
import ShareBookingLink from './components/public/ShareBookingLink';

// Auth checker component
function AuthChecker({ setIsLoggedIn, setUser }) {
  const location = useLocation();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
      console.log('Auth check: User is logged in', JSON.parse(storedUser));
    } else {
      setIsLoggedIn(false);
      setUser(null);
      console.log('Auth check: No user logged in');
    }
  }, [location, setIsLoggedIn, setUser]);
  
  return null;
}

// Protected Route Component
function ProtectedLayout({ children, isLoggedIn, activeTab, setActiveTab, handleLogout, user }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
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
              <span className="user-name">{user?.username || 'User'}</span>
              <span className="user-role">({user?.role || 'N/A'})</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(storedUser));
    }
    setAuthChecked(true);
  }, []);

  // Don't render routes until auth check is complete
  if (!authChecked) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  return (
    <Router>
      <AuthChecker setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
      <Routes>
        {/* Public Routes - No Login Required */}
        <Route path="/book-appointment" element={<PublicAppointmentForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/public/user-manual" element={<UserManual />} />

        {/* Protected Routes - Login Required */}
        <Route path="/dashboard" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <Dashboard />
          </ProtectedLayout>
        } />
        <Route path="/patients" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <Patients />
          </ProtectedLayout>
        } />
        <Route path="/appointments" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <Appointments />
          </ProtectedLayout>
        } />
        <Route path="/appointment-requests" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <AppointmentRequests />
          </ProtectedLayout>
        } />
        <Route path="/providers" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <Providers />
          </ProtectedLayout>
        } />
        <Route path="/locations" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <Locations />
          </ProtectedLayout>
        } />
        <Route path="/api-docs" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <ApiDocs />
          </ProtectedLayout>
        } />
        <Route path="/user-manual" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <UserManual />
          </ProtectedLayout>
        } />
        <Route path="/share-link" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <ShareBookingLink />
          </ProtectedLayout>
        } />

        {/* Provider Routes */}
        <Route path="/provider/dashboard" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <ProviderDashboard />
          </ProtectedLayout>
        } />
        <Route path="/provider/appointments" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <ProviderAppointments />
          </ProtectedLayout>
        } />
        <Route path="/provider/patients" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <ProviderPatients />
          </ProtectedLayout>
        } />
        <Route path="/provider/schedule" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <ProviderSchedule />
          </ProtectedLayout>
        } />

        {/* Front Desk Routes */}
        <Route path="/frontdesk/dashboard" element={
          <ProtectedLayout isLoggedIn={isLoggedIn} activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} user={user}>
            <FrontDeskDashboard />
          </ProtectedLayout>
        } />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
