@echo off
rem Grafito - arma salida\Grafito.exe desde el codigo (ver README.md). Necesita Python 3 e internet.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0construir.ps1" %*
set "CODIGO=%errorlevel%"
echo.
if "%CODIGO%"=="0" (echo Listo: el instalador quedo en la carpeta salida.) else (echo Algo fallo: ver el mensaje de arriba.)
pause
exit /b %CODIGO%
