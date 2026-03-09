# Denticon Dashboard Application

A comprehensive dental practice management dashboard with patient records, provider information, appointments, and API documentation. Features a public appointment booking system with PostgreSQL database backend.

## 🏗️ Architecture

This application consists of four main services:

- **PostgreSQL Database**: PostgreSQL 15-alpine on port 5432
- **Backend (Node.js/Express)**: REST API on port 3001 with PostgreSQL integration
- **Frontend (React)**: Dashboard UI on port 3000
- **Nginx**: Reverse proxy on port 80

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Ports 80, 3000, 3001, 5432 available

### Start the Application

```bash
# Start all services (database will auto-initialize)
./start-docker.sh

# Or manually
sudo docker-compose up -d --build
```

The database will automatically:
- Create the `denticon` database
- Initialize 7 tables with sample data
- Create views, functions, and triggers
- Be ready for API connections

### Access the Application

- **Frontend Dashboard**: http://localhost
- **API Endpoints**: http://localhost/api
- **Health Check**: http://localhost/health
- **Public Appointment Form**: http://localhost/public-appointment (Coming soon)
- **Database**: localhost:5432 (postgres/denticon_password_2024)

**Login Credentials:**
- Username: `admin`
- Password: `demo123`

### Stop the Application

```bash
# Stop all services (preserves database data)
./stop-docker.sh

# Or manually
sudo docker-compose down

# Stop and remove database volume (⚠️ deletes all data)
sudo docker-compose down -v
```

## 📁 Project Structure

```
practise/
├── denticon-api-node/          # Backend API
│   ├── routes/                 # API routes
│   │   ├── patients.js        # Patient management (PostgreSQL)
│   │   ├── providers.js       # Provider management (PostgreSQL)
│   │   ├── appointments.js    # Appointment scheduling (PostgreSQL)
│   │   ├── locations.js       # Clinic locations (PostgreSQL)
│   │   └── appointmentRequests.js  # Public booking system (PostgreSQL)
│   ├── config/
│   │   └── database.js        # PostgreSQL connection pool
│   ├── database/
│   │   └── init.sql           # Database schema and sample data
│   ├── middleware/            # Auth middleware
│   ├── server.js              # Express server
│   ├── .env                   # Environment variables
│   └── Dockerfile
├── denticon-dashboard/         # Frontend React app
│   ├── src/
│   │   ├── components/        # React components
│   │   └── services/          # API services
│   └── Dockerfile
├── nginx/                      # Nginx reverse proxy
│   ├── conf.d/                # Nginx configuration
│   ├── logs/                  # Access and error logs
│   └── Dockerfile
├── docker-compose.yml          # Docker orchestration (4 services)
├── IMPLEMENTATION-STATUS.md    # Development progress tracker
└── PUBLIC-APPOINTMENT-SYSTEM.md # Public booking system design
```

## 🔧 Development

### Backend API

```bash
cd denticon-api-node
npm install
npm start                       # Port 3001
```

### Frontend Dashboard

```bash
cd denticon-dashboard
npm install
npm start                       # Port 3000
```

## 📋 Features

### 🗄️ Database (PostgreSQL)
- 7 tables: locations, providers, patients, appointments, appointment_requests, provider_availability, appointment_history
- Sample data pre-loaded (3 locations, 5 providers, 8 patients, 12 appointments)
- Database functions for availability checking
- Views for complex queries
- Automatic timestamp triggers
- Indexes for performance optimization

### 📍 Location Management
- Manage multiple clinic locations
- Track address, phone, email, hours
- Soft delete support

### 👥 Patient Management
- View all patients with insurance and provider information
- Add, edit, and delete patient records
- Track appointment history and next appointments
- Search by name, phone, or email
- Emergency contact information
- Medical history and allergies tracking

### 👨‍⚕️ Provider Management
- View provider profiles with statistics
- Track patient counts and appointment numbers
- Display specialization and experience
- Check real-time availability
- Working hours management

### 📅 Appointments
- Schedule new appointments with conflict checking
- View appointment details (duration, room, notes)
- Edit and cancel appointments
- Complete appointment history tracking
- Filter by status, provider, patient, location, date range
- Automatic change logging

### 🌐 Public Appointment Booking (NEW!)
- Public form for new patients (no authentication required)
- Auto-assign provider if not selected
- Request submission and tracking
- Admin approval workflow
- Creates patient record on approval
- Email/phone validation

### 📖 API Documentation
- Interactive API documentation
- Endpoint details with request/response examples
- cURL command examples
- Dynamic host detection (localhost/production)

### Authentication
- Login/logout functionality
- Session management
- Protected routes

## 🐳 Docker Services

### Service Overview
1. **postgres** - PostgreSQL 15-alpine database
   - Auto-initializes on first run
   - Data persisted in volume `postgres-data`
   - Health check: pg_isready every 10s
   
2. **denticon-api** - Node.js Express API
   - Waits for database to be healthy
   - Connects to PostgreSQL on startup
   - Health check: API endpoint every 30s
   
3. **denticon-dashboard** - React frontend
   - Depends on API service
   - Health check: Homepage every 30s
   
4. **nginx** - Reverse proxy
   - Routes requests to appropriate services
   - Health check: /health endpoint every 30s

### Health Checks
All services include health checks with automatic restart on failure:
- PostgreSQL: Every 10s
- API: Every 30s
- Frontend: Every 30s  
- Nginx: Every 30s

### Database Connection
The API automatically tests database connection on startup:
```
✅ Database connected successfully at 2026-03-05 10:30:45
```

If connection fails, the API will still run but database operations will fail.

### Logs
View logs for troubleshooting:

```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f postgres
sudo docker-compose logs -f denticon-api
sudo docker-compose logs -f denticon-dashboard
sudo docker-compose logs -f nginx

# Last 100 lines
sudo docker-compose logs --tail=100 denticon-api
```

### Database Management

```bash
# Access PostgreSQL CLI
docker exec -it denticon-postgres psql -U postgres -d denticon

# Backup database
docker exec denticon-postgres pg_dump -U postgres denticon > backup.sql

# Restore database
docker exec -i denticon-postgres psql -U postgres denticon < backup.sql

# View database logs
docker logs denticon-postgres
```

## 🔒 API Authentication

### Protected Endpoints
All API requests (except public appointment form) require headers:

```bash
VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7
ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB
Pgid: 1
```

### Public Endpoints
The following endpoints do NOT require authentication:
- `POST /api/AppointmentRequest` - Submit public appointment request
- `GET /api` - API documentation

### Example API Request

```bash
# Protected endpoint (requires auth headers)
curl -X GET http://localhost/api/Patient \
  -H "VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7" \
  -H "ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB" \
  -H "Pgid: 1"

# Public endpoint (no auth required)
curl -X POST http://localhost/api/AppointmentRequest \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-0199",
    "email": "john@example.com",
    "location_id": 1,
    "requested_date": "2026-03-10",
    "requested_time": "10:00:00"
  }'
```

## 📖 Additional Documentation

- [DOCKER-README.md](./DOCKER-README.md) - Comprehensive Docker guide
- [nginx/README.md](./nginx/README.md) - Nginx configuration details

## 🛠️ Technologies

- **Database**: PostgreSQL 15-alpine
- **Backend**: Node.js, Express.js, pg (PostgreSQL driver)
- **Frontend**: React 18.2.0, Axios
- **Proxy**: Nginx (Alpine)
- **Containerization**: Docker, Docker Compose
- **Authentication**: Custom middleware

## 📊 Database Schema

### Tables
1. **locations** - Clinic locations
2. **providers** - Doctors and specialists
3. **patients** - Patient records
4. **appointments** - Scheduled appointments
5. **appointment_requests** - Public booking requests
6. **provider_availability** - Working hours
7. **appointment_history** - Audit trail

### Special Features
- `get_available_slots(provider_id, date)` function
- Views for complex queries
- Automatic timestamp updates
- Soft deletes (is_active flags)
- Indexes on foreign keys and search fields

## 📝 License

This project is for educational and demonstration purposes.

## 👥 Contributing

Feel free to submit issues and enhancement requests!
# denticon-dashboard
