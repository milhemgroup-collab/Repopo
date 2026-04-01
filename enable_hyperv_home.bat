@echo off
setlocal EnableDelayedExpansion

:: ============================================================
:: Enable Hyper-V on Windows 11 Home
:: Required for Claude Desktop Cowork feature
:: Must be run as Administrator
:: ============================================================

:: Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator.
    echo Right-click the file and select "Run as administrator".
    pause
    exit /b 1
)

:: Check Windows edition
for /f "tokens=*" %%i in ('wmic os get Caption /value ^| findstr "Caption"') do set "OS_CAPTION=%%i"
echo Detected: %OS_CAPTION%

echo %OS_CAPTION% | findstr /i "Home" >nul
if %errorlevel% neq 0 (
    echo.
    echo This script is intended for Windows 11 Home edition.
    echo Your edition already supports Hyper-V natively.
    echo Use "Turn Windows features on or off" to enable Hyper-V instead.
    pause
    exit /b 0
)

echo.
echo ============================================================
echo  ENABLE HYPER-V ON WINDOWS 11 HOME
echo ============================================================
echo.
echo This script will:
echo   1. Create a system restore point
echo   2. Install Hyper-V packages from Windows servicing directory
echo   3. Enable the Microsoft Hyper-V feature
echo.
echo This is needed for Claude Desktop's Cowork feature.
echo.
echo WARNING: This modifies system files. A restore point will be
echo created automatically, but you should also have a backup.
echo.
set /p CONFIRM="Type YES to continue: "
if /i not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [Step 1/4] Creating system restore point...
powershell -Command "Enable-ComputerRestore -Drive 'C:\' -ErrorAction SilentlyContinue; Checkpoint-Computer -Description 'Before Hyper-V install for Claude Cowork' -RestorePointType MODIFY_SETTINGS -ErrorAction SilentlyContinue"
if %errorlevel% neq 0 (
    echo WARNING: Could not create restore point. Continuing anyway...
) else (
    echo Restore point created.
)

echo.
echo [Step 2/4] Finding Hyper-V packages...
pushd "%~dp0"
dir /b %SystemRoot%\servicing\Packages\*Hyper-V*.mum >hyper-v.txt 2>nul

:: Check if any packages were found
for %%A in (hyper-v.txt) do (
    if %%~zA==0 (
        echo ERROR: No Hyper-V packages found in %SystemRoot%\servicing\Packages\
        echo Your Windows installation may not include the required files.
        del hyper-v.txt 2>nul
        pause
        exit /b 1
    )
)

echo Found Hyper-V packages. Installing...
echo.

echo [Step 3/4] Installing Hyper-V packages (this may take several minutes)...
for /f %%i in ('findstr /i . hyper-v.txt 2^>nul') do (
    echo   Installing: %%i
    dism /online /norestart /add-package:"%SystemRoot%\servicing\Packages\%%i" >nul 2>&1
)
del hyper-v.txt 2>nul

echo.
echo [Step 4/4] Enabling Microsoft Hyper-V feature...
dism /online /enable-feature /featurename:Microsoft-Hyper-V -All /LimitAccess /ALL /norestart
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Feature enable returned an error. This may still work after reboot.
    echo Run verify_cowork_readiness.ps1 after rebooting to check.
)

echo.
echo ============================================================
echo  DONE - REBOOT REQUIRED
echo ============================================================
echo.
echo Hyper-V packages have been installed. You MUST restart your
echo computer for the changes to take effect.
echo.
echo After rebooting:
echo   1. Run verify_cowork_readiness.ps1 to confirm everything is ready
echo   2. Open Claude Desktop and try Cowork
echo.
set /p REBOOT="Reboot now? (Y/N): "
if /i "%REBOOT%"=="Y" (
    shutdown /r /t 10 /c "Rebooting to complete Hyper-V installation for Claude Cowork"
    echo Rebooting in 10 seconds... Close this window to cancel.
)

pause
exit /b 0
