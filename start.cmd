@echo off
setlocal enabledelayedexpansion

echo 🚀 AgroMarket Enterprise - Setup
echo ==================================
echo.

if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ✅ .env file created
) else (
    echo ✅ .env file already exists
)

echo.
set "DOCKER_CMD=docker"
for /f "usebackq delims=" %%A in (`docker context show 2^>nul`) do set "CURRENT_CONTEXT=%%A"
if defined CURRENT_CONTEXT (
    docker --context default info >nul 2>&1
    if !errorlevel! equ 0 (
        set "DOCKER_CMD=docker --context default"
        echo ℹ️ Using Docker context: default
    ) else (
        echo ℹ️ Using current Docker context: !CURRENT_CONTEXT!
    )
) else (
    echo ℹ️ Docker context not detected. Using default docker command.
)

echo.
echo 🐳 Starting Docker services...
%DOCKER_CMD% compose -f docker-compose.dev.yml up --build -d
if errorlevel 1 (
    echo.
    echo ❌ Erreur lors du démarrage avec Docker Compose.
    echo Exécutez "%DOCKER_CMD% compose ps" pour vérifier le démon Docker.
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo 📍 Access the application:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:4000
echo.
pause
