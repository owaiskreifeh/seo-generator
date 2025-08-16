# Use the official Node.js 18 LTS image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Create necessary directories
RUN mkdir -p uploads generated generated/sessions public

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=production

# Health check to ensure the application is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { \
    if (res.statusCode === 200 || res.statusCode === 404) process.exit(0); \
    else process.exit(1); \
  }).on('error', () => process.exit(1));"

# Command to run the application
CMD ["npm", "start"]
