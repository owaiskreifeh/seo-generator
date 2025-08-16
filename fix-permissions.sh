#!/bin/bash

# SEO Generator - Docker Permission Fix Script
# This script restarts Docker containers and fixes permission issues

set -e  # Exit on any error

echo "🔧 SEO Generator - Docker Permission Fix Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_warning "This script may need elevated privileges for permission changes"
    print_status "If you encounter permission issues, run with: sudo ./fix-permissions.sh"
fi

# Step 1: Stop and remove existing containers
print_status "Stopping existing Docker containers..."
docker compose down --remove-orphans

# Step 2: Clean up any dangling containers or images (optional)
print_status "Cleaning up Docker resources..."
docker system prune -f

# Step 3: Fix permissions on host directories
print_status "Fixing permissions on uploads and generated directories..."

# Create directories if they don't exist
mkdir -p uploads generated

# Set proper ownership and permissions
# The Docker container runs as user 'nextjs' with UID 1001
if command -v getent >/dev/null 2>&1; then
    # Try to get the actual UID of nextjs user if it exists
    NEXTJS_UID=$(getent passwd nextjs | cut -d: -f3 2>/dev/null || echo "1001")
else
    NEXTJS_UID="1001"
fi

print_status "Setting ownership to UID $NEXTJS_UID (nextjs user)..."

# Fix ownership
chown -R $NEXTJS_UID:$NEXTJS_UID uploads/ 2>/dev/null || {
    print_warning "Could not change ownership to UID $NEXTJS_UID"
    print_status "Trying alternative approach..."
    # Alternative: make directories writable by all
    chmod -R 777 uploads/
}

chown -R $NEXTJS_UID:$NEXTJS_UID generated/ 2>/dev/null || {
    print_warning "Could not change ownership to UID $NEXTJS_UID"
    print_status "Trying alternative approach..."
    chmod -R 777 generated/
}

# Set proper permissions
chmod -R 755 uploads/
chmod -R 755 generated/

# Step 4: Rebuild and start containers
print_status "Rebuilding Docker containers..."
docker compose build --no-cache

print_status "Starting Docker containers..."
docker compose up -d

# Step 5: Wait for containers to be healthy
print_status "Waiting for containers to be healthy..."
sleep 10

# Step 6: Check container status
print_status "Checking container status..."
if docker compose ps | grep -q "Up"; then
    print_success "Containers are running successfully!"
else
    print_error "Containers failed to start properly"
    print_status "Checking logs..."
    docker compose logs
    exit 1
fi

# Step 7: Test file permissions inside container
print_status "Testing file permissions inside container..."
docker compose exec -T seo-generator sh -c "
    echo 'Testing uploads directory permissions...' &&
    touch /app/uploads/test-permission.txt &&
    echo 'Permission test successful!' > /app/uploads/test-permission.txt &&
    rm /app/uploads/test-permission.txt &&
    echo '✅ Uploads directory is writable'
" || {
    print_error "Permission test failed inside container"
    print_status "Container logs:"
    docker compose logs seo-generator
    exit 1
}

# Step 8: Final status check
print_status "Final status check..."
echo ""
echo "📊 Container Status:"
docker compose ps
echo ""
echo "🔍 Recent logs:"
docker compose logs --tail=10 seo-generator

print_success "Permission fix completed successfully!"
print_status "Your SEO Generator should now be accessible at: http://localhost:9580"
print_status "Uploads directory permissions have been fixed for user 'nextjs' (UID $NEXTJS_UID)"

echo ""
echo "💡 Troubleshooting tips:"
echo "  - If you still have permission issues, try: sudo chmod -R 777 uploads/ generated/"
echo "  - Check container logs: docker compose logs -f seo-generator"
echo "  - Restart containers: docker compose restart"
echo "  - Access container shell: docker compose exec seo-generator sh"
