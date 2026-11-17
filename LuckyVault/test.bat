@echo off
cd /d %~dp0
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
echo Running the Lucky Vault test suite (about 1-2 minutes)...
node tests\run.js
echo.
if errorlevel 1 (echo SOME TESTS FAILED - see the list above.) else (echo ALL TESTS PASSED.)
pause
