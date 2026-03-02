# Denticon-Style REST API - Node.js

A REST API built with Node.js and Express, mimicking the Denticon API structure.

## Features

- ✅ Patient management
- ✅ Provider management
- ✅ Appointment scheduling
- ✅ Practice information
- ✅ Header-based authentication (VendorKey, ClientKey, Pgid)
- ✅ Pagination support
- ✅ Search functionality

## Installation

```bash
npm install
```

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication Headers
All API requests require these headers:
```
VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7
ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB
Pgid: 1
```

### Patients

#### Get All Patients
```
GET /api/Patient?Page=1&Count=10&IncludeInactive=false
```

#### Get Patient by ID
```
GET /api/Patient/:id
```

#### Create Patient
```
POST /api/Patient
Body: {
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-0101",
  "dateOfBirth": "1980-05-15"
}
```

#### Update Patient
```
PUT /api/Patient/:id
```

#### Delete Patient
```
DELETE /api/Patient/:id
```

#### Search Patients
```
POST /api/Patient/Search
Body: {
  "searchTerm": "John",
  "IncludeInactive": false
}
```

### Providers

#### Get All Providers
```
GET /api/Provider?Page=1&Count=5&IncludeInactive=false
```

#### Get Provider by ID
```
GET /api/Provider/:id
```

#### Create Provider
```
POST /api/Provider
```

#### Update Provider
```
PUT /api/Provider/:id
```

#### Delete Provider
```
DELETE /api/Provider/:id
```

### Appointments

#### Get All Appointments
```
GET /api/Appointment?Page=1&Count=10&Status=Scheduled
```

#### Get Appointment by ID
```
GET /api/Appointment/:id
```

#### Create Appointment
```
POST /api/Appointment
Body: {
  "patientId": 1,
  "providerId": 1,
  "appointmentDate": "2026-03-01",
  "appointmentTime": "10:00",
  "duration": 60,
  "type": "Cleaning"
}
```

#### Update Appointment
```
PUT /api/Appointment/:id
```

#### Cancel Appointment
```
DELETE /api/Appointment/:id
```

#### Get Appointments by Patient
```
GET /api/Appointment/Patient/:patientId
```

#### Get Appointments by Provider
```
GET /api/Appointment/Provider/:providerId
```

### Practice

#### Get Practice Information
```
GET /api/Practice
```

#### Update Practice Information
```
PUT /api/Practice
```

## Testing with curl

```bash
# Get all providers
curl -X GET http://localhost:3000/api/Provider \
  -H "VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7" \
  -H "ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB" \
  -H "Pgid: 1"

# Create a patient
curl -X POST http://localhost:3000/api/Patient \
  -H "VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7" \
  -H "ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB" \
  -H "Pgid: 1" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'
```

## Response Format

All responses follow this structure:

```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Success message"
}
```

Error responses:
```json
{
  "statusCode": 401,
  "message": "Request is not authorized."
}
```

## Tech Stack

- Node.js
- Express.js
- CORS
- Body-parser
- dotenv
