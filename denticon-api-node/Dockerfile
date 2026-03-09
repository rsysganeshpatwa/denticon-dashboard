# Backend Node.js API Dockerfile
FROM node:18-alpine

# Install PostgreSQL client for migrations
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Make scripts executable
RUN chmod +x /app/docker-entrypoint.sh /app/database/run-migrations.sh

# Expose port
EXPOSE 3001

# Set entrypoint to run migrations before starting server
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Start the server
CMD ["node", "server.js"]
