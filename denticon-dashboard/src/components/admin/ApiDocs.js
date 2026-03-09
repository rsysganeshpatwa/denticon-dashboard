import React, { useState } from 'react';
import './ApiDocs.css';

const ApiDocs = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  
  const getApiBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    return `${window.location.protocol}//${window.location.host}/api`;
  };
  
  const apiBaseUrl = getApiBaseUrl();

  const apiEndpoints = [
    {
      category: 'Authentication',
      endpoints: [
        {
          name: 'Login',
          method: 'POST',
          path: '/auth/login',
          description: 'Authenticate user and receive JWT token',
          authRequired: false,
          body: { username: 'admin', password: 'Admin@2026' },
          response: {
            statusCode: 200,
            message: 'Login successful',
            data: {
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: { id: 1, username: 'admin', email: 'admin@denticon.com', role: 'admin' }
            }
          }
        },
        {
          name: 'Verify Token',
          method: 'GET',
          path: '/auth/verify',
          description: 'Verify if the current JWT token is valid',
          authRequired: true,
          response: { statusCode: 200, valid: true, user: { id: 1, username: 'admin', role: 'admin' } }
        }
      ]
    },
    {
      category: 'Patient Management',
      endpoints: [
        {
          name: 'Get All Patients',
          method: 'GET',
          path: '/Patient',
          description: 'Retrieve all patients (Admin and Front Desk only)',
          authRequired: true,
          roles: ['admin', 'front_desk'],
          queryParams: [
            { name: 'page', type: 'number', default: '1', description: 'Page number' },
            { name: 'limit', type: 'number', default: '10', description: 'Records per page' }
          ],
          response: {
            statusCode: 200,
            data: [{
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              phone: '555-0101',
              date_of_birth: '1980-05-15'
            }]
          }
        },
        {
          name: 'Create Patient',
          method: 'POST',
          path: '/Patient',
          description: 'Create a new patient record',
          authRequired: true,
          roles: ['admin', 'front_desk'],
          body: {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            phone: '555-0102',
            date_of_birth: '1990-03-20'
          },
          response: { statusCode: 201, message: 'Patient created successfully' }
        }
      ]
    },
    {
      category: 'Appointments',
      endpoints: [
        {
          name: 'Get All Appointments',
          method: 'GET',
          path: '/Appointment',
          description: 'Retrieve all appointments',
          authRequired: true,
          roles: ['admin', 'front_desk'],
          queryParams: [
            { name: 'date', type: 'string', description: 'Filter by date (YYYY-MM-DD)' },
            { name: 'provider_id', type: 'number', description: 'Filter by provider' }
          ],
          response: {
            statusCode: 200,
            data: [{
              id: 1,
              patient_name: 'John Doe',
              provider_name: 'Dr. John Smith',
              appointment_date: '2026-03-10',
              appointment_time: '10:00:00',
              status: 'scheduled'
            }]
          }
        },
        {
          name: 'Create Appointment',
          method: 'POST',
          path: '/Appointment',
          description: 'Schedule a new appointment',
          authRequired: true,
          roles: ['admin', 'front_desk'],
          body: {
            patient_id: 1,
            provider_id: 1,
            appointment_date: '2026-03-15',
            appointment_time: '14:00',
            appointment_type: 'checkup',
            status: 'scheduled'
          },
          response: { statusCode: 201, message: 'Appointment created successfully' }
        }
      ]
    },
    {
      category: 'Appointment Requests (Public)',
      endpoints: [
        {
          name: 'Get Appointment Requests',
          method: 'GET',
          path: '/AppointmentRequest',
          description: 'Retrieve appointment requests',
          authRequired: false,
          queryParams: [
            { name: 'status', type: 'string', description: 'Filter by status (pending/approved/rejected)' }
          ],
          response: {
            statusCode: 200,
            data: [{
              id: 1,
              patient_name: 'Alice Williams',
              provider_name: 'Dr. John Smith',
              appointment_date: '2026-03-12',
              status: 'pending'
            }]
          }
        },
        {
          name: 'Create Appointment Request',
          method: 'POST',
          path: '/AppointmentRequest',
          description: 'Submit appointment request (public booking form)',
          authRequired: false,
          body: {
            patient_name: 'Bob Johnson',
            patient_email: 'bob@example.com',
            patient_phone: '555-0105',
            location_id: 1,
            provider_id: 1,
            appointment_date: '2026-03-20',
            appointment_time: '14:00',
            reason: 'Regular checkup'
          },
          response: { statusCode: 201, message: 'Appointment request submitted successfully' }
        },
        {
          name: 'Approve Request',
          method: 'PUT',
          path: '/AppointmentRequest/:id/approve',
          description: 'Approve pending appointment request',
          authRequired: true,
          roles: ['admin', 'front_desk'],
          pathParams: [{ name: 'id', type: 'number', description: 'Request ID' }],
          body: { patient_id: 5, appointment_type: 'checkup' },
          response: { statusCode: 200, message: 'Appointment request approved' }
        }
      ]
    },
    {
      category: 'Providers',
      endpoints: [
        {
          name: 'Get All Providers (Admin)',
          method: 'GET',
          path: '/Provider',
          description: 'Retrieve all providers (Admin only)',
          authRequired: true,
          roles: ['admin'],
          response: {
            statusCode: 200,
            data: [{
              id: 1,
              first_name: 'John',
              last_name: 'Smith',
              specialization: 'General Dentistry',
              email: 'john.smith@denticon.com',
              is_active: true
            }]
          }
        },
        {
          name: 'Get Providers (Public)',
          method: 'GET',
          path: '/public/providers',
          description: 'Retrieve active providers (no auth required)',
          authRequired: false,
          queryParams: [{ name: 'location_id', type: 'number', description: 'Filter by location' }],
          response: {
            statusCode: 200,
            data: [{ id: 1, first_name: 'John', last_name: 'Smith', specialization: 'General Dentistry' }]
          }
        },
        {
          name: 'Get Provider Availability',
          method: 'GET',
          path: '/public/providers/:id/availability',
          description: 'Get available time slots for a provider',
          authRequired: false,
          pathParams: [{ name: 'id', type: 'number', description: 'Provider ID' }],
          queryParams: [{ name: 'date', type: 'string', required: true, description: 'Date (YYYY-MM-DD)' }],
          response: {
            statusCode: 200,
            data: {
              providerId: 1,
              date: '2026-03-15',
              availableSlots: [
                { time: '09:00:00', available: true },
                { time: '10:00:00', available: false },
                { time: '11:00:00', available: true }
              ]
            }
          }
        }
      ]
    },
    {
      category: 'Locations',
      endpoints: [
        {
          name: 'Get Locations (Admin)',
          method: 'GET',
          path: '/Location',
          description: 'Retrieve all locations (authenticated)',
          authRequired: true,
          response: {
            statusCode: 200,
            data: [{
              id: 1,
              name: 'Downtown Dental Center',
              address: '123 Main St',
              city: 'San Francisco',
              state: 'CA',
              phone: '555-0100'
            }]
          }
        },
        {
          name: 'Get Locations (Public)',
          method: 'GET',
          path: '/public/locations',
          description: 'Retrieve active locations (no auth)',
          authRequired: false,
          response: {
            statusCode: 200,
            data: [{ id: 1, name: 'Downtown Dental Center', city: 'San Francisco' }]
          }
        }
      ]
    }
  ];

  const renderEndpointDetails = (endpoint) => {
    const token = localStorage.getItem('token');
    
    return (
      <div className="endpoint-details">
        <div className="endpoint-header">
          <span className={`method-badge ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
          <code className="endpoint-path">{endpoint.path}</code>
        </div>
        
        <p className="endpoint-description">{endpoint.description}</p>

        <div className="section">
          <h4>Authentication</h4>
          {endpoint.authRequired ? (
            <div className="auth-info">
              <span className="auth-badge required">🔒 JWT Token Required</span>
              {endpoint.roles && (
                <div className="roles-info">
                  <strong>Allowed Roles:</strong> {endpoint.roles.map(role => (
                    <span key={role} className="role-tag">{role}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="auth-badge public">🌐 Public (No Authentication)</span>
          )}
        </div>

        {endpoint.authRequired && (
          <div className="section">
            <h4>Headers</h4>
            <div className="headers-table">
              <div className="header-row">
                <span className="header-name">Authorization</span>
                <code className="header-value">Bearer {token ? token.substring(0, 20) + '...' : '<your-jwt-token>'}</code>
                <span className="required-badge">Required</span>
              </div>
            </div>
          </div>
        )}

        {endpoint.pathParams && (
          <div className="section">
            <h4>Path Parameters</h4>
            <div className="params-table">
              {endpoint.pathParams.map((param, idx) => (
                <div key={idx} className="param-row">
                  <span className="param-name">{param.name}</span>
                  <span className="param-type">{param.type}</span>
                  <span className="param-desc">{param.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.queryParams && (
          <div className="section">
            <h4>Query Parameters</h4>
            <div className="params-table">
              {endpoint.queryParams.map((param, idx) => (
                <div key={idx} className="param-row">
                  <span className="param-name">{param.name}</span>
                  <span className="param-type">{param.type}</span>
                  {param.default && <span className="param-default">default: {param.default}</span>}
                  {param.required && <span className="required-badge">Required</span>}
                  <span className="param-desc">{param.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {endpoint.body && (
          <div className="section">
            <h4>Request Body</h4>
            <pre className="code-block">{JSON.stringify(endpoint.body, null, 2)}</pre>
          </div>
        )}

        <div className="section">
          <h4>Response</h4>
          <pre className="code-block">{JSON.stringify(endpoint.response, null, 2)}</pre>
        </div>

        <div className="section">
          <h4>Try it out</h4>
          <div className="curl-example">
            <pre className="code-block">
{`curl -X ${endpoint.method} '${apiBaseUrl}${endpoint.path.replace(':id', '1')}' ${endpoint.authRequired ? `\\
  -H "Authorization: Bearer ${token || '<your-jwt-token>'}"` : ''}${endpoint.body ? ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.body)}'` : ''}`}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="api-docs">
      <div className="docs-header">
        <h1>🔌 API Documentation</h1>
        <p>Complete REST API reference for Denticon Healthcare Management System</p>
        <div className="base-url">
          <strong>Base URL:</strong> <code>{apiBaseUrl}</code>
        </div>
      </div>

      <div className="docs-content">
        <div className="api-docs-sidebar">
          <div className="api-docs-sidebar-section">
            <h3>📖 Quick Start</h3>
            <p className="auth-note">
              Authentication uses JWT tokens. Login to receive a token, then include it in the Authorization header.
            </p>
          </div>

          {apiEndpoints.map((category, catIdx) => (
            <div key={catIdx} className="api-docs-sidebar-section">
              <h3>{category.category}</h3>
              <ul className="endpoint-list">
                {category.endpoints.map((endpoint, epIdx) => (
                  <li 
                    key={epIdx}
                    className={selectedEndpoint === `${catIdx}-${epIdx}` ? 'active' : ''}
                    onClick={() => setSelectedEndpoint(`${catIdx}-${epIdx}`)}
                  >
                    <span className={`method-tag ${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>
                    {endpoint.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="main-content">
          {selectedEndpoint ? (
            renderEndpointDetails(
              apiEndpoints[parseInt(selectedEndpoint.split('-')[0])]
                .endpoints[parseInt(selectedEndpoint.split('-')[1])]
            )
          ) : (
            <div className="welcome-section">
              <h2>Welcome to Denticon API Documentation</h2>
              <p>Select an endpoint from the left sidebar to view detailed documentation.</p>
              
              <div className="quick-start">
                <h3>🚀 Quick Start Guide</h3>
                <ol>
                  <li><strong>Login:</strong> POST to <code>/auth/login</code> with credentials</li>
                  <li><strong>Get Token:</strong> Receive JWT token in the response</li>
                  <li><strong>Authenticate:</strong> Include token in Authorization header: <code>Bearer &lt;token&gt;</code></li>
                  <li><strong>Public Endpoints:</strong> Some endpoints (🌐) don't require authentication</li>
                </ol>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <h4>🔐 Authentication</h4>
                  <p>JWT-based auth with role-based access (Admin, Provider, Front Desk)</p>
                </div>
                <div className="feature-card">
                  <h4>👥 Patient Management</h4>
                  <p>Full CRUD operations for patient records</p>
                </div>
                <div className="feature-card">
                  <h4>📅 Appointments</h4>
                  <p>Schedule and manage appointments with slot availability</p>
                </div>
                <div className="feature-card">
                  <h4>📋 Public Booking</h4>
                  <p>Online appointment request system</p>
                </div>
                <div className="feature-card">
                  <h4>👨‍⚕️ Providers</h4>
                  <p>Provider management with schedules</p>
                </div>
                <div className="feature-card">
                  <h4>📍 Locations</h4>
                  <p>Multiple practice location support</p>
                </div>
              </div>

              <div className="api-info">
                <h3>📊 API Information</h3>
                <ul>
                  <li><strong>Version:</strong> 2.0.0</li>
                  <li><strong>Authentication:</strong> JWT Bearer Token</li>
                  <li><strong>Response Format:</strong> JSON</li>
                  <li><strong>Base URL:</strong> <code>{apiBaseUrl}</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
