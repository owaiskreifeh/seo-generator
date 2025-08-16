# Fix Host Directory Permissions for Docker Bind Mounts
# Use this if you need to keep host directory mounts

Write-Host "🔧 Fixing Host Directory Permissions for Docker Bind Mounts" -ForegroundColor Cyan
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

# Stop containers first
Write-Status "Stopping containers..."
docker-compose down

# Create directories if they don't exist
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force
    Write-Status "Created uploads directory"
}

if (!(Test-Path "generated")) {
    New-Item -ItemType Directory -Path "generated" -Force
    Write-Status "Created generated directory"
}

# Remove all files from directories to start fresh
Write-Status "Cleaning up existing files..."
Get-ChildItem -Path "uploads" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path "generated" -File -ErrorAction SilentlyContinue | Remove-Item -Force

# On Windows, we need to ensure directories are accessible to Docker
# The key is to make them writable by everyone (not ideal but works for development)
Write-Status "Setting directory permissions for Docker access..."

# Make directories writable by everyone (for development only)
$acl = Get-Acl "uploads"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Everyone","FullControl","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule)
Set-Acl "uploads" $acl

$acl = Get-Acl "generated"
$acl.SetAccessRule($accessRule)
Set-Acl "generated" $acl

Write-Success "Directory permissions updated"

# Start containers
Write-Status "Starting containers..."
docker-compose up -d

Write-Success "Host directory permissions fixed!"
Write-Status "Your app should now be able to write to uploads/ and generated/ directories"
Write-Warning "Note: This makes directories writable by everyone. For production, use named volumes instead."
