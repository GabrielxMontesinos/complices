@echo off
title Complices VIP - Servidor Android (Metro + ADB)
color 0E
echo ========================================================
echo   COMPLICES VIP - CONECTANDO CON ANDROID STUDIO / CELULAR
echo ========================================================
echo.
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%PATH%;%LOCALAPPDATA%\Android\Sdk\platform-tools;%LOCALAPPDATA%\Android\Sdk\emulator"

echo [1/3] Buscando tu celular Android o Emulador conectado...
adb devices
echo.
echo [2/3] Configurando puente de red (puerto 8081) hacia tu celular...
adb reverse tcp:8081 tcp:8081
echo.
echo [3/3] Iniciando e instalando la app en tu Android...
call npm run android
pause

