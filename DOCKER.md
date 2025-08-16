# Docker Setup for SEO Generator

This guide will help you run the SEO Generator application using Docker.

## Quick Start

### 1. Build and Run with Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Run in detached mode (background)
docker-compose up --build -d

# Stop the application
docker-compose down
```

### 2. Build and Run with Docker Commands

```bash
# Build the Docker image
docker build -t seo-generator .

# Run the container
docker run -p 3000:3000 --name seo-generator-app seo-generator

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --name seo-generator-app \
  seo-generator
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# AI/API Keys (replace with your actual keys)
GENAI_API_KEY=your_google_genai_api_key_here

# Add any other environment variables your application requires
```

## Docker Compose Configuration

The `docker-compose.yml` file includes:
- Automatic container restart
- Health checks
- Volume mapping for persistent data
- Environment variable support

## Production Deployment

For production deployment:

1. **Set Environment Variables**: Make sure all required environment variables are set
2. **Volume Persistence**: The compose file maps local directories for data persistence
3. **Security**: The Dockerfile runs the app as a non-root user
4. **Health Checks**: Built-in health monitoring

### Production Commands

```bash
# Production build and run
docker-compose -f docker-compose.yml up --build -d

# View logs
docker-compose logs -f seo-generator

# Restart service
docker-compose restart seo-generator

# Update application
docker-compose down
docker-compose up --build -d
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port mapping in docker-compose.yml
   ```yaml
   ports:
     - "8080:3000"  # Use port 8080 instead
   ```

2. **Permission issues**: Ensure the uploads and generated directories are writable
   ```bash
   chmod 755 uploads generated
   ```

3. **Environment variables not loaded**: Check your .env file exists and has correct format

### Viewing Application Logs

```bash
# View logs
docker-compose logs seo-generator

# Follow logs in real-time
docker-compose logs -f seo-generator

# View last 100 lines
docker-compose logs --tail=100 seo-generator
```

### Accessing the Container

```bash
# Access container shell
docker-compose exec seo-generator sh

# Or if using docker run:
docker exec -it seo-generator-app sh
```

## Development with Docker

For development, you can mount your source code:

```bash
docker run -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --name seo-generator-dev \
  seo-generator npm run dev
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi seo-generator

# Remove all unused Docker objects
docker system prune -a
```

## Application Access

Once running, access the application at:
- **Local**: http://localhost:3000
- **With custom port**: http://localhost:CUSTOM_PORT

The application includes:
- Health checks at `/` endpoint
- File serving for generated content
- Rate limiting and security headers
