const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Load database configuration
const { pool } = require('./config/database');

// Load authentication middleware
const { verifyToken, adminOnly, adminOrFrontDesk, adminOrProvider } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const providerRoutes = require('./routes/providers');
const appointmentRoutes = require('./routes/appointments');
const practiceRoutes = require('./routes/practice');
const locationRoutes = require('./routes/locations');
const appointmentRequestRoutes = require('./routes/appointmentRequests');
const providerPortalRoutes = require('./routes/provider');

// API base route
app.get('/api', (req, res) => {
  res.json({
    message: 'Denticon-style API with JWT Authentication',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      patients: '/api/Patient',
      providers: '/api/Provider',
      appointments: '/api/Appointment',
      practice: '/api/Practice',
      locations: '/api/Location',
      appointmentRequests: '/api/AppointmentRequest',
      providerPortal: '/api/provider-portal'
    }
  });
});

// Public routes (no authentication required)
app.use('/api/auth', authRoutes); // Login, verify, logout
app.use('/api/AppointmentRequest', appointmentRequestRoutes); // Public appointment booking

// Public access to locations and providers (for appointment booking)
app.use('/api/public/locations', locationRoutes); // Public can view locations
app.use('/api/public/providers', providerRoutes); // Public can view providers

// Protected routes (require JWT authentication)
app.use('/api/Location', verifyToken, locationRoutes); // All authenticated users
app.use('/api/Patient', verifyToken, adminOrFrontDesk, patientRoutes); // Admin and Front Desk only
app.use('/api/Provider', verifyToken, adminOnly, providerRoutes); // Admin only (CRUD on provider records)
app.use('/api/Appointment', verifyToken, adminOrFrontDesk, appointmentRoutes); // Admin and Front Desk
app.use('/api/Practice', verifyToken, adminOnly, practiceRoutes); // Admin only

// Provider Portal routes (provider-specific) - AFTER admin routes
app.use('/api/provider-portal', providerPortalRoutes); // Has its own middleware inside

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    activityId: generateActivityId()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: 'Endpoint not found'
  });
});

// Helper function
function generateActivityId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

app.listen(PORT, async () => {
  console.log(`🚀 Denticon API Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  
  // Test database connection
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ Database connected successfully at ${result.rows[0].now}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('⚠️  Server is running but database operations will fail');
  }
});

module.exports = app;
