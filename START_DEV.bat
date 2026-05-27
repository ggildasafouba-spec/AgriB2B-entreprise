@echo off
echo ============================================
echo   AgroMarket Enterprise - Demarrage Local
echo ============================================
echo.

echo [1/4] Demarrage PostgreSQL + Redis via Docker...
docker compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo ERREUR: Docker n'est pas demarre. Lancez Docker Desktop d'abord.
    pause
    exit /b 1
)

echo.
echo [2/4] Attente que PostgreSQL soit pret...
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Application des migrations Prisma...
cd backend
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERREUR: Migration echouee.
    pause
    exit /b 1
)

echo.
echo [4/4] Demarrage du backend et du frontend...
echo.
echo ============================================
echo   Backend  : http://localhost:4000
echo   Frontend : http://localhost:3000
echo   Swagger  : http://localhost:4000/api/docs
echo ============================================
echo.
echo Ouvrez 2 terminaux separement :
echo   Terminal 1 (backend)  : cd backend  ^& npm run dev
echo   Terminal 2 (frontend) : cd frontend ^& npm run dev
echo.
pause
