# MediFind Server Starter (PowerShell)
Write-Host "MediFind Server Starter" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

# Function to kill process on specific port
function Kill-ProcessOnPort {
    param([int]$port)
    $process = netstat -ano | findstr ":$port" | findstr "LISTENING"
    if ($process) {
        $pid = ($process -split '\s+')[-1]
        Write-Host "Killing process $pid on port $port" -ForegroundColor Yellow
        taskkill /PID $pid /F >$null 2>&1
    }
}

# Kill processes on required ports
Write-Host "Checking and killing processes on required ports..."
Kill-ProcessOnPort 5000
Kill-ProcessOnPort 5173
Kill-ProcessOnPort 5174
Kill-ProcessOnPort 5175
Kill-ProcessOnPort 5176

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d $PSScriptRoot\backend && npm start" -WindowStyle Normal

Write-Host "Waiting 3 seconds for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d $PSScriptRoot\frontend && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Servers starting... Please wait a few seconds." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend will be available at: http://localhost:5173 (or next available port)" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"