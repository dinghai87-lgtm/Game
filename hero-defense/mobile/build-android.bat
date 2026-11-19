@echo off
chcp 65001 >nul
setlocal
cd /d %~dp0
REM 英雄塔防 Hero Defense — 生成可直接安装测试的 Android APK（debug）
where node >nul 2>nul || (echo 需要先安装 Node.js: https://nodejs.org & pause & exit /b 1)
node -e "process.exit(+process.versions.node.split('.')[0]>=22?0:1)" || (echo Node.js 版本太旧，需要 22 或更新：https://nodejs.org & pause & exit /b 1)
if "%JAVA_HOME%"=="" if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if "%ANDROID_HOME%"=="" if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if "%ANDROID_HOME%"=="" (echo 没找到 Android SDK：请安装 Android Studio 并打开一次 https://developer.android.com/studio & pause & exit /b 1)
echo [1/4] 安装 Capacitor...
call npm install || goto :err
echo [2/4] 复制游戏文件...
call node prepare.js || goto :err
if not exist android (
  echo [3/4] 创建 Android 工程...
  call npx cap add android || goto :err
)
call npx cap sync android || goto :err
call node patch-native.js
call npm run assets
echo [4/4] 编译 APK（第一次要下载 Gradle，约 5-10 分钟）...
cd android
call gradlew.bat assembleDebug || goto :err
cd ..
copy /y android\app\build\outputs\apk\debug\app-debug.apk HeroDefense.apk >nul
echo.
echo 完成: %cd%\HeroDefense.apk  —— 拷到安卓手机上点开安装即可
pause
exit /b 0
:err
echo 编译失败，请看上面的报错。
pause
exit /b 1
