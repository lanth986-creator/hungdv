@echo off
chcp 65001 >nul
title HUNGDV - Quan ly Cong viec

echo ============================================
echo    HUNGDV - He thong Quan ly Cong viec
echo ============================================
echo.

:: Them PostgreSQL vao PATH
set "PGPATH=C:\Program Files\PostgreSQL\17\bin"
set "PATH=%PGPATH%;%PATH%"

:: Kiem tra PostgreSQL
echo [1/3] Kiem tra PostgreSQL...
pg_isready -q 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL chua chay! Vui long bat dich vu PostgreSQL.
    echo         Hoac chay: net start postgresql-x64-17
    echo.
    pause
    exit /b 1
)
echo        PostgreSQL dang chay.

:: Kiem tra database
echo [2/3] Kiem tra database hungdv...
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

:: Chay Backend + Frontend
echo [3/3] Khoi dong Backend va Frontend...
echo.

cd /d "%~dp0"

start "HUNGDV Backend" cmd /k "cd /d %~dp0backend && echo Backend: http://localhost:5000 && npm run dev"

timeout /t 2 /nobreak >nul

start "HUNGDV Frontend" cmd /k "cd /d %~dp0frontend && echo Frontend: http://localhost:5173 && npm run dev"

:: Cho frontend khoi dong roi mo trinh duyet
echo        Dang cho Frontend khoi dong...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ============================================
echo  HUNGDV da khoi dong!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:5000
echo ============================================
echo.
echo Nhan phim bat ky de dong...
pause >nul
