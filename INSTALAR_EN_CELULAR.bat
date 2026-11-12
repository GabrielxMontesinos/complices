@echo off
title Complices VIP - Compilar e Instalar en Android
color 0A
echo ========================================================
echo   COMPLICES VIP - COMPILANDO CON JAVA (JDK 21)
echo ========================================================
echo.

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo [*] Version de Java detectada:
java -version
echo.

echo [*] Dispositivos conectados:
adb devices
echo.

echo [*] Configurando conexion por cable hacia tu celular...
adb reverse tcp:8081 tcp:8081

echo.
echo [*] Compilando e instalando en tu Android...
call npm run android

pause

