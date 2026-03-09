import React, { useState } from 'react';
import api from '../../services/api';
import { FaUserMd, FaLock, FaUser } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleDemoCredentialClick = (username, password) => {
    setCredentials({
      username: username,
      password: password
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.statusCode === 200) {
        const { token, user } = response.data.data;
        
        // Store token and user info in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('Login successful, token saved:', token.substring(0, 20) + '...');
        console.log('User:', user);
        
        // Determine redirect path based on role
        let redirectPath = '/dashboard';
        switch (user.role) {
          case 'admin':
            redirectPath = '/dashboard';
            break;
          case 'provider':
            redirectPath = '/provider/dashboard';
            break;
          case 'front_desk':
            redirectPath = '/frontdesk/dashboard';
            break;
          default:
            redirectPath = '/dashboard';
        }
        
        // Use window.location for a full page reload to ensure auth state is properly initialized
        window.location.href = redirectPath;
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response.data.message || 'Invalid credentials');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FaUserMd className="login-icon" />
          <h1>Denticon</h1>
          <p>Dental Clinic Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">
              <FaUser /> Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="demo-credentials">
            <strong>Demo Credentials:</strong>
            <div 
              className="credential-item clickable" 
              onClick={() => handleDemoCredentialClick('admin', 'Admin@2026')}
              title="Click to auto-fill"
            >
              <span className="role-badge admin">Admin</span>
              <span>admin / Admin@2026</span>
            </div>
            <div 
              className="credential-item clickable" 
              onClick={() => handleDemoCredentialClick('john.smith', 'Provider@2026')}
              title="Click to auto-fill"
            >
              <span className="role-badge provider">Provider</span>
              <span>john.smith / Provider@2026</span>
            </div>
            <div 
              className="credential-item clickable" 
              onClick={() => handleDemoCredentialClick('sarah.johnson', 'Provider@2026')}
              title="Click to auto-fill"
            >
              <span className="role-badge provider">Provider</span>
              <span>sarah.johnson / Provider@2026</span>
            </div>
          </div>

          <div className="user-manual-link">
            <a href="/public/user-manual" target="_blank" rel="noopener noreferrer">
              📖 View User Manual
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
