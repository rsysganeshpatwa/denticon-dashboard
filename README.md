# Denticon Dashboard Application

A comprehensive dental practice management dashboard with patient records, provider information, appointments, and API documentation.

## 🏗️ Architecture

This application consists of three main services:

- **Frontend (React)**: Dashboard UI on port 3000
- **Backend (Node.js/Express)**: REST API on port 3001  
- **Nginx**: Reverse proxy on port 80

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Ports 80, 3000, 3001 available

### Start the Application

```bash
# Start all services
./start-docker.sh

# Or manually
sudo docker-compose up -d --build
```

### Access the Application

- **Frontend Dashboard**: http://localhost
- **API Endpoints**: http://localhost/api
- **Health Check**: http://localhost/health

**Login Credentials:**
- Username: `admin`
- Password: `demo123`

### Stop the Application

```bash
# Stop all services
./stop-docker.sh

# Or manually
sudo docker-compose down
```

## 📁 Project Structure

```
practise/
├── denticon-api-node/          # Backend API
│   ├── routes/                 # API routes (patients, providers, appointments)
│   ├── middleware/             # Auth middleware
│   ├── server.js              # Express server
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
├── docker-compose.yml          # Docker orchestration
└── DOCKER-README.md           # Detailed Docker documentation
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

### Patient Management
- View all patients with insurance and provider information
- Add, edit, and delete patient records
- Track appointment history and next appointments

### Provider Management
- View provider profiles with statistics
- Track patient counts and appointment numbers
- Display specialization and experience

### Appointments
- Schedule new appointments
- View appointment details (duration, room, notes)
- Edit and cancel appointments

### API Documentation
- Interactive API documentation
- Endpoint details with request/response examples
- cURL command examples

### Authentication
- Login/logout functionality
- Session management
- Protected routes

## 🐳 Docker Services

### Health Checks
All services include health checks:
- API: Every 30s
- Frontend: Every 30s  
- Nginx: Every 30s

### Logs
View logs for troubleshooting:

```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f nginx
sudo docker-compose logs -f denticon-api
sudo docker-compose logs -f denticon-dashboard
```

## 🔒 API Authentication

All API requests require headers:

```bash
VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7
ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB
Pgid: 1
```

## 📖 Additional Documentation

- [DOCKER-README.md](./DOCKER-README.md) - Comprehensive Docker guide
- [nginx/README.md](./nginx/README.md) - Nginx configuration details

## 🛠️ Technologies

- **Frontend**: React 18.2.0, Axios
- **Backend**: Node.js, Express.js
- **Proxy**: Nginx (Alpine)
- **Containerization**: Docker, Docker Compose
- **Authentication**: Custom middleware

## 📝 License

This project is for educational and demonstration purposes.

## 👥 Contributing

Feel free to submit issues and enhancement requests!
# denticon-dashboard
