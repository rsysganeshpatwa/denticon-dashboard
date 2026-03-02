# Nginx Reverse Proxy

This directory contains the Nginx reverse proxy configuration for the Denticon Healthcare Management System.

## Structure

```
nginx/
├── Dockerfile              # Nginx container configuration
├── nginx.conf             # Main nginx configuration
├── conf.d/
│   └── default.conf       # Server block configuration
└── logs/                  # Nginx logs (mounted volume)
```

## Configuration

### Upstreams
- **denticon_api**: Backend API service (port 3001)
- **denticon_frontend**: Frontend React app (port 3000)

### Routes
- `/` → Frontend React application
- `/api/` → Backend API (proxied)
- `/health` → Health check endpoint

### Features
- ✅ Reverse proxy for API and frontend
- ✅ Load balancing ready
- ✅ Gzip compression
- ✅ Security headers
- ✅ Request buffering
- ✅ Connection keep-alive
- ✅ Health checks
- ✅ Access and error logging

## Customization

### Change Port
Edit `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # Change to desired port
```

### Add SSL/HTTPS
1. Add certificates to `nginx/certs/`
2. Update `conf.d/default.conf`:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    ...
}
```

### View Logs
```bash
# Real-time logs
docker-compose logs -f nginx

# Access logs
tail -f nginx/logs/denticon-access.log

# Error logs
tail -f nginx/logs/denticon-error.log
```

## Testing Configuration

Test nginx config before restarting:
```bash
docker exec denticon-nginx nginx -t
```

Reload configuration without downtime:
```bash
docker exec denticon-nginx nginx -s reload
```
