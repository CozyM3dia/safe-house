@echo off
echo Starting S.A.F.E House Backend (Port 3001)...
start cmd /k "cd backend && npm run dev"

echo Starting S.A.F.E House Frontend (Port 5173)...
start cmd /k "cd frontend && npm run dev"

echo Starting FreeLLMAPI Proxy ^& Dashboard (Port 3003 / Port 5174+)...
start cmd /k "cd freellmapi && npm run dev"

echo.
echo =======================================================
echo All services have been launched in separate terminals:
echo  - Backend: http://localhost:3001
echo  - Frontend: http://localhost:5173
echo  - FreeLLMAPI Admin: http://localhost:3003 (or dashboard on http://localhost:5174)
echo =======================================================
echo.
pause
