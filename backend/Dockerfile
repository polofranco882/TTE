# Use node 18 alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Install ts-node and typescript globally to run the start script
RUN npm install -g ts-node typescript

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
