@echo off
chcp 65001 >nul
title HUNGDV - Cloudflare Tunnel
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-tunnel.ps1"
pause
