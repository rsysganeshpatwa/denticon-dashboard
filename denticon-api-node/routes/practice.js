const express = require('express');
const router = express.Router();

// Mock practice data
const practiceInfo = {
  id: 1,
  name: 'Dental Excellence Practice',
  address: '789 Healthcare Blvd',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102',
  phone: '555-0100',
  email: 'info@dentalexcellence.com',
  website: 'www.dentalexcellence.com',
  hours: {
    monday: '8:00 AM - 5:00 PM',
    tuesday: '8:00 AM - 5:00 PM',
    wednesday: '8:00 AM - 5:00 PM',
    thursday: '8:00 AM - 5:00 PM',
    friday: '8:00 AM - 3:00 PM',
    saturday: 'Closed',
    sunday: 'Closed'
  }
};

// GET /api/Practice - Get practice information
router.get('/', (req, res) => {
  res.json({
    statusCode: 200,
    data: practiceInfo
  });
});

// PUT /api/Practice - Update practice information
router.put('/', (req, res) => {
  Object.assign(practiceInfo, req.body);
  
  res.json({
    statusCode: 200,
    message: 'Practice information updated successfully',
    data: practiceInfo
  });
});

module.exports = router;
