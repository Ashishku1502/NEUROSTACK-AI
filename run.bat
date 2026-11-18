@echo off
echo ==============================================
echo   Starting NeuroStack AI Services
echo ==============================================
start "NeuroStack Server" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul
start "NeuroStack Client" cmd /k "cd client && npm run dev"
echo.
echo Server: http://localhost:4000
echo Client: http://localhost:5173
echo.
echo Both services launched in separate windows!
