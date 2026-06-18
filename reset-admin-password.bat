@echo off
chcp 65001 >nul
title HUNGDV - Reset Admin Password

echo Doc ADMIN_USERNAME va ADMIN_PASSWORD tu backend\.env ...
cd /d "%~dp0backend"
node src\scripts\resetAdminPassword.js
pause
