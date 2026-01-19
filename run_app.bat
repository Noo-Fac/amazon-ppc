@echo off
title Amazon PPC Analyzer Launcher
color 0b

:: Always set directory to where the script is
cd /d "%~dp0"

echo ===================================================
echo "  Amazon PPC Analyzer & Automation App Launcher"
echo ===================================================
echo.

:: 1. Check Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if not errorlevel 1 goto found_python

:: Try 'py' launcher if 'python' generic command fails
py --version >nul 2>&1
if not errorlevel 1 goto found_py

goto error_python

:found_python
set PYTHON_CMD=python
goto check_node

:found_py
set PYTHON_CMD=py
goto check_node

:error_python
echo Error: Python is not installed or not in PATH.
echo Please install Python from python.org
pause
exit /b

:check_node
echo Python command: %PYTHON_CMD%
echo.

:: 2. Check Node
echo [2/4] Checking Node.js...
call npm --version >nul 2>&1
if errorlevel 1 goto error_node
echo Node.js is installed.
goto start_backend

:error_node
echo Error: Node.js is not installed or not in PATH.
echo Please install Node.js (LTS) from nodejs.org
pause
exit /b

:start_backend
echo.
echo [3/4] Starting Backend...
if not exist "backend" goto error_backend_dir

cd backend
echo Installing/Verifying Python dependencies...
%PYTHON_CMD% -m pip install -r requirements.txt
if errorlevel 1 goto error_pip

echo Starting Backend Server...
:: Launch in new window and keep open
start "Amazon PPC Backend" cmd /k "%PYTHON_CMD% main.py"
goto start_frontend

:error_backend_dir
echo Error: 'backend' directory not found!
pause
exit /b

:error_pip
echo Error installing Python dependencies.
pause
exit /b

:start_frontend
echo.
echo [4/4] Starting Frontend...
cd ..\frontend
if errorlevel 1 goto error_frontend_dir

echo Installing/Verifying Node.js dependencies...
call npm install
if errorlevel 1 goto error_npm

echo Starting Frontend Server...
:: Launch in new window and keep open
start "Amazon PPC Frontend" cmd /k "npm run dev"
goto success

:error_frontend_dir
echo Error: Could not find 'frontend' directory.
pause
exit /b

:error_npm
echo Error installing Node.js dependencies.
pause
exit /b

:success
echo.
echo ===================================================
echo   Application launched!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   (You can close this window if you want)
echo ===================================================
echo.
pause
