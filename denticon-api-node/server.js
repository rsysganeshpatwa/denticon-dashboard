const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Custom authentication middleware
const authenticate = (req, res, next) => {
  const vendorKey = req.headers['vendorkey'] || req.headers['VendorKey'];
  const clientKey = req.headers['clientkey'] || req.headers['ClientKey'];
  const pgid = req.headers['pgid'] || req.headers['Pgid'];

  // Mock authentication - replace with real logic
  const validVendorKey = 'BCF756D4-DCE6-4F2B-BAAE-7679D87037A7';
  const validClientKey = 'AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB';

  if (!vendorKey || !clientKey || !pgid) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Missing authentication headers'
    });
  }

  if (vendorKey !== validVendorKey || clientKey !== validClientKey) {
    return res.status(401).json({
      statusCode: 401,
      message: 'Request is not authorized.'
    });
  }

  req.pgid = pgid;
  next();
};

// Routes
const patientRoutes = require('./routes/patients');
const providerRoutes = require('./routes/providers');
const appointmentRoutes = require('./routes/appointments');
const practiceRoutes = require('./routes/practice');

// API base route
app.get('/api', (req, res) => {
  res.json({
    message: 'Denticon-style API',
    version: '1.0.0',
    endpoints: {
      patients: '/api/Patient',
      providers: '/api/Provider',
      appointments: '/api/Appointment',
      practice: '/api/Practice'
    }
  });
});

// Apply authentication to all /api routes
app.use('/api/Patient', authenticate, patientRoutes);
app.use('/api/Provider', authenticate, providerRoutes);
app.use('/api/Appointment', authenticate, appointmentRoutes);
app.use('/api/Practice', authenticate, practiceRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Denticon API Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
});

module.exports = app;
