@echo off
chcp 65001 >nul
title HUNGDV - Production Server

echo ============================================
echo    HUNGDV - Production Server
echo ============================================
echo.

set "PGPATH=C:\Program Files\PostgreSQL\17\bin"
set "PATH=%PGPATH%;%PATH%"

echo [1/4] Kiem tra PostgreSQL...
pg_isready -q 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL chua chay. Vui long bat dich vu PostgreSQL.
    echo         Hoac chay: net start postgresql-x64-17
    pause
    exit /b 1
)
echo        PostgreSQL dang chay.

echo [2/4] Kiem tra database hungdv...
set PGPASSWORD=postgres
psql -U postgres -h localhost -d hungdv -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo        Database khong ton tai. Dang tao moi...
    psql -U postgres -h localhost -c "CREATE DATABASE hungdv;" 2>nul
    psql -U postgres -h localhost -d hungdv -f "%~dp0backend\src\config\init.sql" 2>nul
    echo        Database da duoc tao.
) else (
    echo        Database OK.
)

echo [3/4] Build frontend...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build frontend that bai.
    pause
    exit /b 1
)

echo [4/4] Khoi dong backend tai http://localhost:5000 ...
cd /d "%~dp0backend"
set NODE_ENV=production
call npm start
