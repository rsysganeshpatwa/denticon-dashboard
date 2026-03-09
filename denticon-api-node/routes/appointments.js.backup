const express = require('express');
const router = express.Router();

// Mock patient data (for reference)
const patients = [
  { id: 1, firstName: 'John', lastName: 'Doe' },
  { id: 2, firstName: 'Jane', lastName: 'Smith' },
  { id: 3, firstName: 'Bob', lastName: 'Johnson' },
  { id: 4, firstName: 'Alice', lastName: 'Williams' },
  { id: 5, firstName: 'Michael', lastName: 'Davis' },
  { id: 6, firstName: 'Emma', lastName: 'Martinez' },
  { id: 7, firstName: 'David', lastName: 'Garcia' },
  { id: 8, firstName: 'Sophia', lastName: 'Lee' }
];

// Mock provider data (for reference)
const providers = [
  { id: 1, firstName: 'Dr. Sarah', lastName: 'Williams' },
  { id: 2, firstName: 'Dr. Michael', lastName: 'Chen' },
  { id: 3, firstName: 'Dr. Emily', lastName: 'Brown' },
  { id: 4, firstName: 'Dr. James', lastName: 'Rodriguez' },
  { id: 5, firstName: 'Dr. Lisa', lastName: 'Anderson' }
];

// Mock appointment data
let appointments = [
  {
    id: 1,
    patientId: 1,
    providerId: 1,
    appointmentDate: '2026-03-05',
    appointmentTime: '10:00',
    duration: 60,
    type: 'Cleaning',
    status: 'Scheduled',
    notes: 'Regular checkup and cleaning',
    room: '101'
  },
  {
    id: 2,
    patientId: 2,
    providerId: 2,
    appointmentDate: '2026-03-06',
    appointmentTime: '14:00',
    duration: 90,
    type: 'Orthodontic Consultation',
    status: 'Scheduled',
    notes: 'Initial braces consultation',
    room: '203'
  },
  {
    id: 3,
    patientId: 1,
    providerId: 1,
    appointmentDate: '2026-02-20',
    appointmentTime: '09:00',
    duration: 30,
    type: 'Follow-up',
    status: 'Completed',
    notes: 'Post-procedure checkup',
    room: '101'
  },
  {
    id: 4,
    patientId: 3,
    providerId: 1,
    appointmentDate: '2026-03-10',
    appointmentTime: '11:00',
    duration: 45,
    type: 'Filling',
    status: 'Scheduled',
    notes: 'Cavity filling upper right molar',
    room: '102'
  },
  {
    id: 5,
    patientId: 4,
    providerId: 3,
    appointmentDate: '2026-03-08',
    appointmentTime: '15:00',
    duration: 60,
    type: 'Periodontal Treatment',
    status: 'Scheduled',
    notes: 'Deep cleaning and scaling',
    room: '105'
  },
  {
    id: 6,
    patientId: 5,
    providerId: 5,
    appointmentDate: '2026-03-12',
    appointmentTime: '10:30',
    duration: 45,
    type: 'Pediatric Checkup',
    status: 'Scheduled',
    notes: 'Routine pediatric dental exam',
    room: '201'
  },
  {
    id: 7,
    patientId: 6,
    providerId: 5,
    appointmentDate: '2026-03-15',
    appointmentTime: '13:00',
    duration: 45,
    type: 'Pediatric Cleaning',
    status: 'Scheduled',
    notes: 'Children dental cleaning',
    room: '201'
  },
  {
    id: 8,
    patientId: 7,
    providerId: 4,
    appointmentDate: '2026-03-09',
    appointmentTime: '16:00',
    duration: 90,
    type: 'Root Canal',
    status: 'Scheduled',
    notes: 'Root canal therapy',
    room: '104'
  },
  {
    id: 9,
    patientId: 8,
    providerId: 2,
    appointmentDate: '2026-03-18',
    appointmentTime: '11:30',
    duration: 60,
    type: 'Orthodontic Adjustment',
    status: 'Scheduled',
    notes: 'Braces adjustment and tightening',
    room: '203'
  },
  {
    id: 10,
    patientId: 2,
    providerId: 2,
    appointmentDate: '2026-02-25',
    appointmentTime: '10:00',
    duration: 30,
    type: 'Follow-up',
    status: 'Completed',
    notes: 'Post-consultation follow-up',
    room: '203'
  },
  {
    id: 11,
    patientId: 4,
    providerId: 3,
    appointmentDate: '2026-02-28',
    appointmentTime: '14:30',
    duration: 45,
    type: 'Consultation',
    status: 'Completed',
    notes: 'Initial periodontal consultation',
    room: '105'
  },
  {
    id: 12,
    patientId: 3,
    providerId: 1,
    appointmentDate: '2026-03-20',
    appointmentTime: '09:30',
    duration: 60,
    type: 'Crown Fitting',
    status: 'Scheduled',
    notes: 'Dental crown fitting appointment',
    room: '102'
  }
];

// Helper function to enrich appointment with patient and provider names
const enrichAppointment = (appointment) => {
  const patient = patients.find(p => p.id === appointment.patientId);
  const provider = providers.find(p => p.id === appointment.providerId);
  
  return {
    ...appointment,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
    providerName: provider ? `${provider.firstName} ${provider.lastName}` : 'Unknown Provider'
  };
};

// GET /api/Appointment - Get all appointments
router.get('/', (req, res) => {
  const { Page = 1, Count = 10, Status = '' } = req.query;
  
  let filteredAppointments = Status 
    ? appointments.filter(a => a.status === Status)
    : appointments;
  
  // Enrich appointments with names
  filteredAppointments = filteredAppointments.map(enrichAppointment);
  
  const page = parseInt(Page);
  const count = parseInt(Count);
  const startIndex = (page - 1) * count;
  const endIndex = startIndex + count;
  
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);
  
  res.json({
    statusCode: 200,
    data: paginatedAppointments,
    pagination: {
      page: page,
      count: count,
      total: filteredAppointments.length
    }
  });
});

// GET /api/Appointment/:id - Get appointment by ID
router.get('/:id', (req, res) => {
  const appointment = appointments.find(a => a.id === parseInt(req.params.id));
  
  if (!appointment) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Appointment not found'
    });
  }
  
  // Enrich with names
  const enrichedAppointment = enrichAppointment(appointment);
  
  res.json({
    statusCode: 200,
    data: enrichedAppointment
  });
});

// POST /api/Appointment - Create new appointment
router.post('/', (req, res) => {
  const newAppointment = {
    id: appointments.length + 1,
    ...req.body,
    status: 'Scheduled'
  };
  
  appointments.push(newAppointment);
  
  res.status(201).json({
    statusCode: 201,
    message: 'Appointment created successfully',
    data: newAppointment
  });
});

// PUT /api/Appointment/:id - Update appointment
router.put('/:id', (req, res) => {
  const index = appointments.findIndex(a => a.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Appointment not found'
    });
  }
  
  appointments[index] = {
    ...appointments[index],
    ...req.body,
    id: appointments[index].id
  };
  
  res.json({
    statusCode: 200,
    message: 'Appointment updated successfully',
    data: appointments[index]
  });
});

// DELETE /api/Appointment/:id - Cancel appointment
router.delete('/:id', (req, res) => {
  const index = appointments.findIndex(a => a.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      statusCode: 404,
      message: 'Appointment not found'
    });
  }
  
  appointments[index].status = 'Cancelled';
  
  res.json({
    statusCode: 200,
    message: 'Appointment cancelled successfully'
  });
});

// GET /api/Appointment/Patient/:patientId - Get appointments by patient
router.get('/Patient/:patientId', (req, res) => {
  const patientAppointments = appointments.filter(
    a => a.patientId === parseInt(req.params.patientId)
  );
  
  res.json({
    statusCode: 200,
    data: patientAppointments,
    count: patientAppointments.length
  });
});

// GET /api/Appointment/Provider/:providerId - Get appointments by provider
router.get('/Provider/:providerId', (req, res) => {
  const providerAppointments = appointments.filter(
    a => a.providerId === parseInt(req.params.providerId)
  );
  
  res.json({
    statusCode: 200,
    data: providerAppointments,
    count: providerAppointments.length
  });
});

module.exports = router;
