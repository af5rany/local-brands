# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (if using a build step)
RUN npm run build

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "dist/main.js"]
