@echo off
setlocal enabledelayedexpansion

REM Root folder (defaults to current if not passed)
set "ROOT=%~1"
if "%ROOT%"=="" set "ROOT=%CD%"

echo Walking: %ROOT%
echo.

for /r "%ROOT%" %%F in (*.ipu) do (
    set "IN=%%F"
    set "OUT=%%~dpnF.png"

    echo Converting: %%F
    ffmpeg -y -loglevel error -i "%%F" "!OUT!"
)

echo.
echo Done.
pause
