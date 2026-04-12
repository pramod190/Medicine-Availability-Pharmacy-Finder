@echo off
echo MediFind Server Starter
echo ======================

echo Checking and killing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000
    taskkill /PID %%a /F >nul 2>&1
)

echo Checking and killing processes on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5173
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Servers starting... Please wait a few seconds.
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:5173 (or next available port)
echo.
pause