@echo off
setlocal enabledelayedexpansion

echo 🔧 SEO Generator - Docker Permission Fix Script (Windows Batch)
echo ================================================================

REM Check if Docker is running
echo [INFO] Checking if Docker Desktop is running...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo [SUCCESS] Docker is running

REM Step 1: Stop and remove existing containers
echo [INFO] Stopping existing Docker containers...
docker-compose down --remove-orphans

REM Step 2: Clean up Docker resources
echo [INFO] Cleaning up Docker resources...
docker system prune -f

REM Step 3: Fix permissions on host directories
echo [INFO] Fixing permissions on uploads and generated directories...

REM Create directories if they don't exist
if not exist "uploads" (
    mkdir uploads
    echo [INFO] Created uploads directory
)

if not exist "generated" (
    mkdir generated
    echo [INFO] Created generated directory
)

REM Remove any existing files that might have permission issues
echo [INFO] Cleaning up problematic files...
for %%f in (uploads\*) do (
    del "%%f" 2>nul
    if !errorlevel! equ 0 (
        echo [INFO] Removed problematic file: %%~nxf
    )
)

REM Step 4: Rebuild and start containers
echo [INFO] Rebuilding Docker containers...
docker-compose build --no-cache

echo [INFO] Starting Docker containers...
docker-compose up -d

REM Step 5: Wait for containers to be healthy
echo [INFO] Waiting for containers to be healthy...
timeout /t 15 /nobreak >nul

REM Step 6: Check container status
echo [INFO] Checking container status...
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Containers are running successfully!
) else (
    echo [ERROR] Containers failed to start properly
    echo [INFO] Checking logs...
    docker-compose logs
    pause
    exit /b 1
)

REM Step 7: Test file permissions inside container
echo [INFO] Testing file permissions inside container...
docker-compose exec -T seo-generator sh -c "touch /app/uploads/test-permission.txt && echo 'Permission test successful!' > /app/uploads/test-permission.txt && rm /app/uploads/test-permission.txt && echo '✅ Uploads directory is writable'"
if %errorlevel% equ 0 (
    echo [SUCCESS] Permission test passed inside container
) else (
    echo [ERROR] Permission test failed inside container
    echo [INFO] Container logs:
    docker-compose logs seo-generator
    pause
    exit /b 1
)

REM Step 8: Final status check
echo [INFO] Final status check...
echo.
echo 📊 Container Status:
docker-compose ps
echo.
echo 🔍 Recent logs:
docker-compose logs --tail=10 seo-generator

echo.
echo [SUCCESS] Permission fix completed successfully!
echo [INFO] Your SEO Generator should now be accessible at: http://localhost:9580
echo [INFO] Uploads directory permissions have been fixed for Docker container access

echo.
echo 💡 Troubleshooting tips:
echo   - If you still have permission issues, restart Docker Desktop
echo   - Check container logs: docker-compose logs -f seo-generator
echo   - Restart containers: docker-compose restart
echo   - Access container shell: docker-compose exec seo-generator sh
echo   - Reset Docker to factory defaults if issues persist

pause
