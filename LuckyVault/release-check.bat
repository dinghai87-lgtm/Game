@echo off
cd /d "%~dp0"
if exist "%~dp0runtime\node.exe" set "PATH=%~dp0runtime;%PATH%"
node tools\release_check.js
pause
