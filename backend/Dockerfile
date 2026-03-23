# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies for tsc
RUN npm install

# Copy source
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy compiled files from build stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5000

# Start command using node (more memory efficient than ts-node)
CMD ["npm", "start"]
