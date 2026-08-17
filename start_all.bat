@echo off
setlocal
set "ROOT=%~dp0"

echo Starting S.A.F.E House Backend (FastAPI, Port 8000)...
start "S.A.F.E House Backend" /D "%ROOT%backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo Starting S.A.F.E House Frontend (Vite, Port 5173)...
start "S.A.F.E House Frontend" /D "%ROOT%frontend" cmd /k "npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo =======================================================
echo Canonical local services launched in separate terminals:
echo  - Backend:  http://localhost:8000
echo  - Frontend: http://localhost:5173
echo =======================================================
echo.
endlocal
