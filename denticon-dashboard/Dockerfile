# Frontend React Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage - serve with simple http server
FROM node:18-alpine

WORKDIR /app

# Install serve to host the static files
RUN npm install -g serve

# Copy built files
COPY --from=build /app/build ./build

# Expose port
EXPOSE 3000

# Start serve
CMD ["serve", "-s", "build", "-l", "3000"]
