@echo off
echo ============================================
echo   AgriB2B - Script de Deploiement
echo ============================================
echo.

echo [1/4] Verification de Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Git n'est pas installe.
    echo Telecharger: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [2/4] Configuration du remote GitHub...
echo.
echo === INSTRUCTIONS ===
echo 1. Va sur https://github.com/new
echo 2. Cree un repo nomme "AgriB2B-enterprise"
echo 3. Ne coche PAS "Initialize with README"
echo 4. Copie l'URL du repo (ex: https://github.com/ton-user/AgriB2B-enterprise.git)
echo.
set /p REPO_URL="Colle l'URL de ton repo GitHub: "

git remote add origin %REPO_URL% 2>nul
git branch -M main
git push -u origin main

echo.
echo [3/4] Code pousse sur GitHub !
echo.
echo === PROCHAINES ETAPES ===
echo.
echo A. BACKEND (Railway) :
echo    1. Va sur https://railway.app/new
echo    2. Clique "Deploy from GitHub repo"
echo    3. Selectionne "AgriB2B-enterprise"
echo    4. Root Directory: backend
echo    5. Ajoute un service PostgreSQL (+ New > Database > PostgreSQL)
echo    6. Configure les variables (voir ci-dessous)
echo.
echo B. FRONTEND (Vercel) :
echo    1. Va sur https://vercel.com/new
echo    2. Importe "AgriB2B-enterprise"
echo    3. Root Directory: frontend
echo    4. Configure les variables (voir ci-dessous)
echo.
echo [4/4] Variables d'environnement a configurer :
echo.
echo --- RAILWAY (Backend) ---
echo NODE_ENV=production
echo PORT=4000
echo JWT_SECRET=[genere un secret de 64 caracteres]
echo JWT_EXPIRES_IN=7d
echo FRONTEND_URL=https://ton-app.vercel.app
echo SMS_PROVIDER=console
echo.
echo --- VERCEL (Frontend) ---
echo NEXT_PUBLIC_API_URL=/api
echo BACKEND_API_URL=https://ton-backend.railway.app
echo.
echo ============================================
echo   Deploiement prepare avec succes !
echo ============================================
pause
