@echo off
chcp 65001 >nul
setlocal
cd /d %~dp0
REM 英雄塔防 Hero Defense — 生成上架 Google Play 用的签名 .aab
where node >nul 2>nul || (echo 需要先安装 Node.js: https://nodejs.org & pause & exit /b 1)
node -e "process.exit(+process.versions.node.split('.')[0]>=22?0:1)" || (echo Node.js 版本太旧，需要 22 或更新：https://nodejs.org & pause & exit /b 1)
if "%JAVA_HOME%"=="" if exist "%ProgramFiles%\Android\Android Studio\jbr" set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
if "%ANDROID_HOME%"=="" if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if "%ANDROID_HOME%"=="" (echo 没找到 Android SDK & pause & exit /b 1)
call npm install || goto :err
call node prepare.js || goto :err
if not exist android call npx cap add android || goto :err
call npx cap sync android || goto :err
call node patch-native.js
call npm run assets
if not exist release.keystore (
  echo.
  echo 现在创建上传密钥 release.keystore —— 自己设一个密码并【写下来】。
  echo release.keystore 一定要备份：以后每次更新 Google Play 都要用同一把钥匙。
  "%JAVA_HOME%\bin\keytool.exe" -genkeypair -v -keystore release.keystore -alias herodefense -keyalg RSA -keysize 2048 -validity 10000 || goto :err
)
set /p KSP=密钥密码: 
call npx cap build android --keystorepath "%cd%\release.keystore" --keystorepass "%KSP%" --keystorealias herodefense --keystorealiaspass "%KSP%" --androidreleasetype AAB || goto :err
echo.
echo 完成。把 android\app\build\outputs\bundle\release\ 里的 .aab 上传到 Google Play Console。
pause
exit /b 0
:err
echo 编译失败，请看上面的报错。
pause
exit /b 1
