# Development Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5000

# Start the application in development mode with hot reload
CMD ["npm", "run", "start:dev"]