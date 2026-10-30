@echo off
echo ===================================================
echo Starting Smart Campus Resource Booking System
echo ===================================================

echo Starting Backend Server on port 5000...
start "CampusBook - Backend API" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting Frontend on port 5173...
start "CampusBook - Frontend App" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo Frontend will be accessible at: http://localhost:5173
echo Backend will be accessible at:  http://localhost:5000
echo ===================================================

