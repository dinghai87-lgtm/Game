@echo off
setlocal
cd /d %~dp0
REM Builds the signed Android App Bundle (.aab) for Google Play.
REM Usage:  build-android-release.bat https://your-domain.com
if "%~1"=="" (echo Usage: build-android-release.bat https://your-domain.com & pause & exit /b 1)
echo %~1| findstr /b /i "https://" >nul || (echo The store build must use an https:// server address. & pause & exit /b 1)
where node >nul 2>nul || (echo Node.js is required: https://nodejs.org & pause & exit /b 1)
if "%JAVA_HOME%"=="" if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if "%ANDROID_HOME%"=="" if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if "%ANDROID_HOME%"=="" (echo Android SDK not found. Install Android Studio and open it once. & pause & exit /b 1)
call npm install || goto :err
call node prepare.js %1 || goto :err
if not exist android call npx cap add android || goto :err
call npx cap sync android || goto :err
call node icons.js
if not exist release.keystore (
  echo.
  echo Creating your upload key release.keystore - choose a password and WRITE IT DOWN.
  echo Back up release.keystore: Google Play needs the same key for every future update.
  "%JAVA_HOME%\bin\keytool.exe" -genkeypair -v -keystore release.keystore -alias luckyvault -keyalg RSA -keysize 2048 -validity 10000 || goto :err
)
set /p KSP=Keystore password: 
call npx cap build android --keystorepath "%cd%\release.keystore" --keystorepass "%KSP%" --keystorealias luckyvault --keystorealiaspass "%KSP%" --androidreleasetype AAB || goto :err
echo.
echo DONE. Upload the .aab from android\app\build\outputs\bundle\release\ to Google Play Console.
pause
exit /b 0
:err
echo Build failed - see the messages above.
pause
exit /b 1
