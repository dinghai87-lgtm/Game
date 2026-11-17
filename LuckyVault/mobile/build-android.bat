@echo off
setlocal
cd /d %~dp0
REM Builds an installable Android APK.  Usage:  build-android.bat [server address]
REM Example: build-android.bat http://192.168.1.20:8080
where node >nul 2>nul || (echo Node.js is required: https://nodejs.org & pause & exit /b 1)
if "%JAVA_HOME%"=="" if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if "%ANDROID_HOME%"=="" if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if "%ANDROID_HOME%"=="" (echo Android SDK not found. Install Android Studio from https://developer.android.com/studio and open it once. & pause & exit /b 1)
echo [1/4] Installing Capacitor...
call npm install || goto :err
echo [2/4] Copying the game...
call node prepare.js %1 || goto :err
if not exist android (
  echo [3/4] Creating the Android project...
  call npx cap add android || goto :err
)
call npx cap sync android || goto :err
call node icons.js
echo [4/4] Building the APK (first build downloads Gradle, can take 5-10 minutes)...
cd android
call gradlew.bat assembleDebug || goto :err
cd ..
copy /y android\app\build\outputs\apk\debug\app-debug.apk LuckyVault.apk >nul
echo.
echo DONE: %cd%\LuckyVault.apk
echo Copy it to your Android phone and open it to install (allow "install unknown apps").
pause
exit /b 0
:err
echo Build failed - see the messages above.
pause
exit /b 1
