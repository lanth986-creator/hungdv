@echo off
chcp 65001 >nul
title HUNGDV - Dungung

echo Dang dung HUNGDV...

:: Tat node processes
taskkill /f /im node.exe >nul 2>&1

echo Da dung tat ca dich vu HUNGDV.
timeout /t 2 /nobreak >nul
