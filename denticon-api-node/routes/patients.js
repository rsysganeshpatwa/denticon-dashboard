const express = require('express');
const router = express.Router();

// Mock patient data
let patients = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0101',
    dateOfBirth: '1980-05-15',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    isActive: true,
    primaryProviderId: 1,
    lastVisit: '2024-02-15',
    nextAppointment: '2024-03-10',
    insuranceProvider: 'Blue Cross',
    totalVisits: 8
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-0102',
    dateOfBirth: '1992-08-22',
    address: '456 Oak Ave',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    isActive: true,
    primaryProviderId: 2,
    lastVisit: '2024-02-20',
    nextAppointment: '2024-03-15',
    insuranceProvider: 'Aetna',
    totalVisits: 5
  },
  {
    id: 3,
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    phone: '555-0103',
    dateOfBirth: '1975-12-10',
    address: '789 Pine Rd',
    city: 'San Diego',
    state: 'CA',
    zipCode: '92101',
    isActive: true,
    primaryProviderId: 1,
    lastVisit: '2024-02-10',
    nextAppointment: '2024-03-05',
    insuranceProvider: 'Cigna',
    totalVisits: 12
  },
  {
    id: 4,
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice.williams@example.com',
    phone: '555-0104',
    dateOfBirth: '1985-03-20',
    address: '321 Elm St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    isActive: true,
    primaryProviderId: 3,
    lastVisit: '2024-02-25',
    nextAppointment: '2024-03-20',
    insuranceProvider: 'UnitedHealthcare',
    totalVisits: 15
  },
  {
    id: 5,
    firstName: 'Michael',
    lastName: 'Davis',
    email: 'michael.davis@example.com',
    phone: '555-0105',
    dateOfBirth: '1990-07-14',
    address: '654 Maple Dr',
    city: 'Sacramento',
    state: 'CA',
    zipCode: '95814',
    isActive: true,
    primaryProviderId: 5,
    lastVisit: '2024-02-18',
    nextAppointment: '2024-03-12',
    insuranceProvider: 'Blue Shield',
    totalVisits: 6
  },
  {
    id: 6,
    firstName: 'Emma',
    lastName: 'Martinez',
    email: 'emma.martinez@example.com',
    phone: '555-0106',
    dateOfBirth: '2010-11-05',
    address: '987 Cedar Ln',
    city: 'San Jose',
    state: 'CA',
    zipCode: '95110',
    isActive: true,
    primaryProviderId: 5,
    lastVisit: '2024-02-22',
    nextAppointment: '2024-03-18',
    insuranceProvider: 'Kaiser Permanente',
    totalVisits: 4
  },
  {
    id: 7,
    firstName: 'David',
    lastName: 'Garcia',
    email: 'david.garcia@example.com',
    phone: '555-0107',
    dateOfBirth: '1978-09-30',
    address: '147 Birch Ave',
    city: 'Oakland',
    state: 'CA',
    zipCode: '94601',
    isActive: true,
    primaryProviderId: 4,
    lastVisit: '2024-02-12',
    nextAppointment: '2024-03-08',
    insuranceProvider: 'Anthem',
    totalVisits: 10
  },
  {
    id: 8,
    firstName: 'Sophia',
    lastName: 'Lee',
    email: 'sophia.lee@example.com',
    phone: '555-0108',
    dateOfBirth: '1995-01-25',
    address: '258 Spruce St',
    city: 'Berkeley',
    state: 'CA',
    zipCode: '94704',
    isActive: true,
    primaryProviderId: 2,
    lastVisit: '2024-02-28',
    nextAppointment: '2024-03-25',
    insuranceProvider: 'MetLife',
    totalVisits: 7
  }
];

// GET /api/Patient - Get all patients
router.get('/', (req, res) => {
  const { Page = 1, Count = 10, IncludeInactive = false } = req.query;
  
  let filteredPatients = IncludeInactive === 'true' 
    ? patients 
    : patients.filter(p => p.isActive);
  
  const page = parseInt(Page);
  const count = parseInt(Count);
  const startIndex = (page - 1) * count;
  const endIndex = startIndex + count;
  
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
  
  res.json({
    statusCode: 200,
    data: paginatedPatients,
    pagination: {
      page: page,
      count: count,
      total: filteredPatients.length,
      totalPages: Math.ceil(filteredPatients.length / count)
    }
  });
});

// GET /api/Patient/:id - Get patient by ID
router.get('/:id', (req, res) => {
  const patient = patients.find(p => p.id === parseInt(req.params.id));
  
  if (!patient) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Patient not found'
    });
  }
  
  res.json({
    statusCode: 200,
    data: patient
  });
});

// POST /api/Patient - Create new patient
router.post('/', (req, res) => {
  const newPatient = {
    id: patients.length + 1,
    ...req.body,
    isActive: true
  };
  
  patients.push(newPatient);
  
  res.status(201).json({
    statusCode: 201,
    message: 'Patient created successfully',
    data: newPatient
  });
});

// PUT /api/Patient/:id - Update patient
router.put('/:id', (req, res) => {
  const index = patients.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Patient not found'
    });
  }
  
  patients[index] = {
    ...patients[index],
    ...req.body,
    id: patients[index].id
  };
  
  res.json({
    statusCode: 200,
    message: 'Patient updated successfully',
    data: patients[index]
  });
});

// DELETE /api/Patient/:id - Delete patient (soft delete)
router.delete('/:id', (req, res) => {
  const index = patients.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Patient not found'
    });
  }
  
  patients[index].isActive = false;
  
  res.json({
    statusCode: 200,
    message: 'Patient deleted successfully'
  });
});

// POST /api/Patient/Search - Search patients
router.post('/Search', (req, res) => {
  const { searchTerm = '', IncludeInactive = false } = req.body;
  
  let filteredPatients = IncludeInactive 
    ? patients 
    : patients.filter(p => p.isActive);
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredPatients = filteredPatients.filter(p => 
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.phone.includes(term)
    );
  }
  
  res.json({
    statusCode: 200,
    data: filteredPatients,
    count: filteredPatients.length
  });
});

module.exports = router;
