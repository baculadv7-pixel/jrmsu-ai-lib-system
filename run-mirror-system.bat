@echo off
echo ========================================
echo JRMSU Mirror Login Page - Quick Start
echo ========================================
echo.

echo This script will help you run the Mirror Login Page system.
echo.
echo System Ports:
echo - Main System: http://localhost:8080
echo - Mirror Login: http://localhost:8081
echo - Backend API: http://localhost:5000
echo.

echo Choose an option:
echo 1. Start Mirror Login Page (Port 8081)
echo 2. Start Backend Server (Port 5000)
echo 3. Start Both (Mirror + Backend)
echo 4. Run Database Migration
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto mirror
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto migration
if "%choice%"=="5" goto end

echo Invalid choice!
pause
goto end

:mirror
echo.
echo Starting Mirror Login Page on port 8081...
echo.
cd "mirror-login-page"
start cmd /k "npm run dev"
echo Mirror Login Page started!
echo Open: http://localhost:8081
pause
goto end

:backend
echo.
echo Starting Backend Server on port 5000...
echo.
cd "jrmsu-wise-library-main\python-backend"
start cmd /k "python app.py"
echo Backend Server started!
echo API: http://localhost:5000
pause
goto end

:both
echo.
echo Starting both Mirror Login Page and Backend Server...
echo.
cd "mirror-login-page"
start cmd /k "npm run dev"
cd "..\jrmsu-wise-library-main\python-backend"
start cmd /k "python app.py"
echo.
echo Both services started!
echo Mirror Login: http://localhost:8081
echo Backend API: http://localhost:5000
pause
goto end

:migration
echo.
echo Running Database Migration...
echo.
echo Please ensure MySQL is running and you have access to the database.
echo.
set /p dbuser="Enter MySQL username (default: root): "
if "%dbuser%"=="" set dbuser=root

set /p dbpass="Enter MySQL password: "

echo.
echo Running migration script...
mysql -u %dbuser% -p%dbpass% < "jrmsu-wise-library-main\database\library_sessions_migration.sql"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Migration completed successfully!
) else (
    echo.
    echo ❌ Migration failed! Please check your MySQL credentials and try again.
)
pause
goto end

:end
echo.
echo Thank you for using JRMSU Mirror Login Page!
echo.
