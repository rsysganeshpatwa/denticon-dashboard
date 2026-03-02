const express = require('express');
const router = express.Router();

// Mock provider data
let providers = [
  {
    id: 1,
    firstName: 'Dr. Sarah',
    lastName: 'Williams',
    title: 'DDS',
    specialty: 'General Dentistry',
    email: 'sarah.williams@dental.com',
    phone: '555-0201',
    licenseNumber: 'DDS-12345',
    isActive: true,
    patientsCount: 45,
    appointmentsCount: 23,
    rating: 4.8,
    experience: '15 years',
    education: 'UCLA School of Dentistry'
  },
  {
    id: 2,
    firstName: 'Dr. Michael',
    lastName: 'Chen',
    title: 'DMD',
    specialty: 'Orthodontics',
    email: 'michael.chen@dental.com',
    phone: '555-0202',
    licenseNumber: 'DMD-67890',
    isActive: true,
    patientsCount: 38,
    appointmentsCount: 18,
    rating: 4.9,
    experience: '12 years',
    education: 'Harvard School of Dental Medicine'
  },
  {
    id: 3,
    firstName: 'Dr. Emily',
    lastName: 'Brown',
    title: 'DDS',
    specialty: 'Periodontics',
    email: 'emily.brown@dental.com',
    phone: '555-0203',
    licenseNumber: 'DDS-11111',
    isActive: true,
    patientsCount: 52,
    appointmentsCount: 31,
    rating: 4.7,
    experience: '20 years',
    education: 'UCSF School of Dentistry'
  },
  {
    id: 4,
    firstName: 'Dr. James',
    lastName: 'Rodriguez',
    title: 'DDS',
    specialty: 'Endodontics',
    email: 'james.rodriguez@dental.com',
    phone: '555-0204',
    licenseNumber: 'DDS-22222',
    isActive: true,
    patientsCount: 29,
    appointmentsCount: 15,
    rating: 4.6,
    experience: '8 years',
    education: 'Columbia College of Dental Medicine'
  },
  {
    id: 5,
    firstName: 'Dr. Lisa',
    lastName: 'Anderson',
    title: 'DMD',
    specialty: 'Pediatric Dentistry',
    email: 'lisa.anderson@dental.com',
    phone: '555-0205',
    licenseNumber: 'DMD-33333',
    isActive: true,
    patientsCount: 67,
    appointmentsCount: 42,
    rating: 5.0,
    experience: '18 years',
    education: 'University of Pennsylvania School of Dental Medicine'
  }
];

// GET /api/Provider - Get all providers
router.get('/', (req, res) => {
  const { Page = 1, Count = 10, IncludeInactive = false } = req.query;
  
  let filteredProviders = IncludeInactive === 'true' 
    ? providers 
    : providers.filter(p => p.isActive);
  
  const page = parseInt(Page);
  const count = parseInt(Count);
  const startIndex = (page - 1) * count;
  const endIndex = startIndex + count;
  
  const paginatedProviders = filteredProviders.slice(startIndex, endIndex);
  
  res.json({
    statusCode: 200,
    data: paginatedProviders,
    pagination: {
      page: page,
      count: count,
      total: filteredProviders.length,
      totalPages: Math.ceil(filteredProviders.length / count)
    }
  });
});

// GET /api/Provider/:id - Get provider by ID
router.get('/:id', (req, res) => {
  const provider = providers.find(p => p.id === parseInt(req.params.id));
  
  if (!provider) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Provider not found'
    });
  }
  
  res.json({
    statusCode: 200,
    data: provider
  });
});

// POST /api/Provider - Create new provider
router.post('/', (req, res) => {
  const newProvider = {
    id: providers.length + 1,
    ...req.body,
    isActive: true
  };
  
  providers.push(newProvider);
  
  res.status(201).json({
    statusCode: 201,
    message: 'Provider created successfully',
    data: newProvider
  });
});

// PUT /api/Provider/:id - Update provider
router.put('/:id', (req, res) => {
  const index = providers.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Provider not found'
    });
  }
  
  providers[index] = {
    ...providers[index],
    ...req.body,
    id: providers[index].id
  };
  
  res.json({
    statusCode: 200,
    message: 'Provider updated successfully',
    data: providers[index]
  });
});

// DELETE /api/Provider/:id - Delete provider
router.delete('/:id', (req, res) => {
  const index = providers.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Provider not found'
    });
  }
  
  providers[index].isActive = false;
  
  res.json({
    statusCode: 200,
    message: 'Provider deleted successfully'
  });
});

module.exports = router;
