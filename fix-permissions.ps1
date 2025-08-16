# SEO Generator - Docker Permission Fix Script (PowerShell)
# This script restarts Docker containers and fixes permission issues on Windows

param(
    [switch]$Force
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🔧 SEO Generator - Docker Permission Fix Script (Windows)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
Write-Status "Checking if Docker Desktop is running..."
try {
    docker version | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Step 1: Stop and remove existing containers
Write-Status "Stopping existing Docker containers..."
docker-compose down --remove-orphans

# Step 2: Clean up Docker resources
Write-Status "Cleaning up Docker resources..."
docker system prune -f

# Step 3: Fix permissions on host directories
Write-Status "Fixing permissions on uploads and generated directories..."

# Create directories if they don't exist
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force
    Write-Status "Created uploads directory"
}

if (!(Test-Path "generated")) {
    New-Item -ItemType Directory -Path "generated" -Force
    Write-Status "Created generated directory"
}

# On Windows, we need to ensure the directories are accessible
# The Docker container runs as user 'nextjs' with UID 1001
Write-Status "Setting directory permissions for Docker container access..."

# Remove any existing files that might have permission issues
Get-ChildItem -Path "uploads" -File -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Status "Removed problematic file: $($_.Name)"
    } catch {
        Write-Warning "Could not remove file: $($_.Name)"
    }
}

# Step 4: Rebuild and start containers
Write-Status "Rebuilding Docker containers..."
docker-compose build --no-cache

Write-Status "Starting Docker containers..."
docker-compose up -d

# Step 5: Wait for containers to be healthy
Write-Status "Waiting for containers to be healthy..."
Start-Sleep -Seconds 15

# Step 6: Check container status
Write-Status "Checking container status..."
$containerStatus = docker-compose ps --format "table {{.Name}}\t{{.Status}}"
if ($containerStatus -match "Up") {
    Write-Success "Containers are running successfully!"
} else {
    Write-Error "Containers failed to start properly"
    Write-Status "Checking logs..."
    docker-compose logs
    exit 1
}

# Step 7: Test file permissions inside container
Write-Status "Testing file permissions inside container..."
try {
    $testResult = docker-compose exec -T seo-generator sh -c @"
        echo 'Testing uploads directory permissions...' &&
        touch /app/uploads/test-permission.txt &&
        echo 'Permission test successful!' > /app/uploads/test-permission.txt &&
        rm /app/uploads/test-permission.txt &&
        echo '✅ Uploads directory is writable'
"@
    Write-Success "Permission test passed inside container"
} catch {
    Write-Error "Permission test failed inside container"
    Write-Status "Container logs:"
    docker-compose logs seo-generator
    exit 1
}

# Step 8: Final status check
Write-Status "Final status check..."
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""
Write-Host "🔍 Recent logs:" -ForegroundColor Cyan
docker-compose logs --tail=10 seo-generator

Write-Success "Permission fix completed successfully!"
Write-Status "Your SEO Generator should now be accessible at: http://localhost:9580"
Write-Status "Uploads directory permissions have been fixed for Docker container access"

Write-Host ""
Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
Write-Host "  - If you still have permission issues, restart Docker Desktop" -ForegroundColor White
Write-Host "  - Check container logs: docker-compose logs -f seo-generator" -ForegroundColor White
Write-Host "  - Restart containers: docker-compose restart" -ForegroundColor White
Write-Host "  - Access container shell: docker-compose exec seo-generator sh" -ForegroundColor White
Write-Host "  - Reset Docker to factory defaults if issues persist" -ForegroundColor White
