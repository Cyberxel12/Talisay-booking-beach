@echo off
title Talisay Beach Resort - Localhost Server
cd /d "%~dp0"
echo Starting local web server for Talisay Beach Resort...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
