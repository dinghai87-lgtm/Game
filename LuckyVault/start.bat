@echo off
chcp 65001 >nul
cd /d %~dp0
title Lucky Vault server

rem ---- 1. use a portable Node.js in .\runtime if we already downloaded one
if exist "%~dp0runtime\node.exe" set "PATH=%~dp0runtime;%PATH%"

rem ---- 2. check the installed Node.js (needs 22.13+ for the built-in SQLite)
set NEEDNODE=0
where node >nul 2>nul
if errorlevel 1 (set NEEDNODE=1) else (
  node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
  if errorlevel 1 set NEEDNODE=1
)

rem ---- 3. no suitable Node.js: download the portable Node 22 LTS (about 30 MB) into .\runtime
if "%NEEDNODE%"=="1" (
  echo Node.js 22.13+ not found - downloading portable Node.js 22 LTS into .\runtime ...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get-node.ps1"
  if errorlevel 1 (
    echo.
    echo Could not download Node.js automatically. Install Node.js 22 LTS from https://nodejs.org and run this file again.
    pause
    exit /b 1
  )
  set "PATH=%~dp0runtime;%PATH%"
)

echo.
node -v
echo Starting Lucky Vault ... (keep this window open; close it to stop the server)
echo.
set OPEN_BROWSER=1
node server.js
pause
