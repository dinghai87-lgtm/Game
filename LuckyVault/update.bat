@echo off
chcp 65001 >nul
setlocal
cd /d %~dp0
title Lucky Vault update
rem ============================================================================
rem  一键更新 Lucky Vault / One-click update
rem  用法: 把新的 LuckyVault-vX.zip 拖到这个 update.bat 上 (或者: update.bat 路径\LuckyVault-vX.zip)
rem  Usage: drag the new LuckyVault-vX.zip onto update.bat
rem  1. 备份 data 文件夹 (玩家账号、金币) 到 backups\
rem  2. 停止正在运行的服务器
rem  3. 解压新版本并覆盖程序文件 (data、runtime、backups 不会被改动)
rem  4. 重新启动服务器
rem ============================================================================
set "ZIP=%~1"
if "%ZIP%"=="" (
  echo 请把新的 LuckyVault-vX.zip 拖到 update.bat 上。
  echo Drag the new LuckyVault-vX.zip onto update.bat.
  pause
  exit /b 1
)
if not exist "%ZIP%" (
  echo 找不到文件 / File not found: %ZIP%
  pause
  exit /b 1
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set STAMP=%%i

echo [1/4] 备份数据 Backing up data ...
if exist "%~dp0data" (
  if not exist "%~dp0backups" mkdir "%~dp0backups"
  powershell -NoProfile -Command "Compress-Archive -Path '%~dp0data\*' -DestinationPath '%~dp0backups\data-%STAMP%.zip' -Force"
  if errorlevel 1 (
    echo 备份失败，已停止更新。Backup failed - update stopped.
    pause
    exit /b 1
  )
  echo        backups\data-%STAMP%.zip
)

echo [2/4] 停止服务器 Stopping the server ...
taskkill /FI "WINDOWTITLE eq Lucky Vault server*" /T /F >nul 2>nul
timeout /t 2 /nobreak >nul

echo [3/4] 解压新版本 Installing the new version ...
set "TMPX=%TEMP%\lv-update-%STAMP%"
powershell -NoProfile -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%TMPX%' -Force"
if errorlevel 1 (
  echo 解压失败 Could not extract the zip.
  pause
  exit /b 1
)
rem the zip holds one folder (LuckyVault-vX); copy its contents over this folder, never touching data / runtime / backups
set "SRC=%TMPX%"
for /d %%d in ("%TMPX%\*") do if exist "%%d\server.js" set "SRC=%%d"
robocopy "%SRC%" "%~dp0." /E /XD data runtime backups node_modules /NFL /NDL /NJH /NJS /NP >nul
if %errorlevel% GEQ 8 (
  echo 复制文件失败 Copy failed. 数据备份在 backups\data-%STAMP%.zip
  pause
  exit /b 1
)
rmdir /s /q "%TMPX%" >nul 2>nul

echo [4/4] 启动服务器 Starting the server ...
start "Lucky Vault server" cmd /c "%~dp0start.bat"
echo.
echo 更新完成 Update complete. 浏览器按 Ctrl+F5 刷新 / Press Ctrl+F5 in the browser.
timeout /t 5 >nul
endlocal
