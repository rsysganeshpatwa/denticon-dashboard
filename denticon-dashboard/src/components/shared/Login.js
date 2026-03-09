import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
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
        
        // Redirect based on role
        switch (user.role) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'provider':
            navigate('/provider/dashboard');
            break;
          case 'front_desk':
            navigate('/frontdesk/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
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
            <div className="credential-item">
              <span className="role-badge admin">Admin</span>
              <span>admin / Admin@2026</span>
            </div>
            <div className="credential-item">
              <span className="role-badge provider">Provider</span>
              <span>john.smith / Provider@2026</span>
            </div>
            <div className="credential-item">
              <span className="role-badge frontdesk">Front Desk</span>
              <span>receptionist / FrontDesk@2026</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
