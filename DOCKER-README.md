# Denticon Healthcare Management System - Docker Setup

## Quick Start

### Prerequisites
- Docker installed (https://docs.docker.com/get-docker/)
- Docker Compose installed (https://docs.docker.com/compose/install/)

### Run the Application

1. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Access the application:**
   - Frontend Dashboard: http://localhost
   - Backend API: http://localhost:3001/api

3. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f denticon-dashboard
   docker-compose logs -f denticon-api
   ```

4. **Stop all services:**
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes:**
   ```bash
   docker-compose down -v
   ```

## Services

### Nginx Reverse Proxy (nginx)
- **Container:** denticon-nginx
- **Port:** 80
- **Technology:** Nginx
- **Purpose:** Reverse proxy and load balancer
- **URL:** http://localhost

### Frontend (denticon-dashboard)
- **Container:** denticon-dashboard
- **Internal Port:** 3000
- **Technology:** React 18 + Node serve
- **Access:** Through Nginx at http://localhost

### Backend (denticon-api)
- **Container:** denticon-api
- **Internal Port:** 3001
- **Technology:** Node.js + Express
- **Access:** Through Nginx at http://localhost/api

## Architecture

```
┌─────────────────┐
│   Browser       │
│  (localhost)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nginx Proxy    │
│   (Port 80)     │
│  Load Balancer  │
└────┬───────┬────┘
     │       │
     │       └──────────┐
     ▼                  ▼
┌─────────┐      ┌──────────┐
│ React   │      │ Node.js  │
│ App     │      │ API      │
│ :3000   │      │ :3001    │
└─────────┘      └──────────┘
```

## API Endpoints

All API requests are proxied through Nginx from `/api/*` to the backend service.

Example:
- `http://localhost/api/Patient` → `http://denticon-api:3001/api/Patient`

### Direct Access (Development):
- Backend API direct: Not exposed (internal port 3001)
- Frontend direct: Not exposed (internal port 3000)
- All access through Nginx on port 80

### Authentication Headers Required:
```
VendorKey: BCF756D4-DCE6-4F2B-BAAE-7679D87037A7
ClientKey: AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB
Pgid: 1
```

## Development

### Rebuild specific service:
```bash
# Rebuild frontend
docker-compose up -d --build denticon-dashboard

# Rebuild backend
docker-compose up -d --build denticon-api
```

### Access container shell:
```bash
# Frontend
docker exec -it denticon-dashboard sh

# Backend
docker exec -it denticon-api sh
```

### Check container status:
```bash
docker-compose ps
```

### View resource usage:
```bash
docker stats
```

## Troubleshooting

### Container won't start:
```bash
# Check logs
docker-compose logs denticon-dashboard
docker-compose logs denticon-api

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Port conflicts:
If ports 80 or 3001 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change frontend to 8080
  - "3002:3001"  # Change backend to 3002
```

### Clear Docker cache:
```bash
docker system prune -a --volumes
```

## Production Deployment

For production, consider:
1. Use environment variables for sensitive data
2. Add SSL/TLS certificates
3. Configure proper logging
4. Set up monitoring
5. Use Docker secrets for credentials
6. Implement backup strategy

## Network

All services run on the `denticon-network` bridge network, allowing inter-container communication using service names.

## Health Checks

Both services include health checks:
- **Frontend:** Checks if Nginx is responding
- **Backend:** Checks if API endpoint is accessible

## Updates

To update the application:
```bash
git pull  # If using version control
docker-compose down
docker-compose up -d --build
```

## Support

For issues or questions, check the logs:
```bash
docker-compose logs -f
```
