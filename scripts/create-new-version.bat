@echo off
REM SOQL Builder Pro - New Version Creation Script for Windows
REM This script creates a new version of an existing package

echo 🔄 Creating New Version for SOQL Builder Pro...

REM Get version information from user
set /p VERSION_NAME="Enter version name (e.g., Spring 2025): "
set /p VERSION_NUMBER="Enter version number (e.g., 1.1.0): "
set /p VERSION_DESCRIPTION="Enter version description: "

echo.
echo 📋 Version Details:
echo Name: %VERSION_NAME%
echo Number: %VERSION_NUMBER%
echo Description: %VERSION_DESCRIPTION%
echo.

REM Confirm before proceeding
set /p CONFIRM="Continue with version creation? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Version creation cancelled.
    pause
    exit /b
)

echo.
echo 📝 Creating new package version...

REM Create new package version
sf package version create ^
  --package "SOQL Builder Pro" ^
  --code-coverage ^
  --installation-key-bypass ^
  --version-name "%VERSION_NAME%" ^
  --version-number "%VERSION_NUMBER%.NEXT" ^
  --version-description "%VERSION_DESCRIPTION%" ^
  --definition-file "config/project-scratch-def.json" ^
  --wait 30

if %ERRORLEVEL% neq 0 (
    echo ❌ Version creation failed!
    pause
    exit /b 1
)

echo ✅ Package version created successfully!

REM Get the new version ID for promotion
echo.
set /p PACKAGE_VERSION_ID="Enter the new Package Version ID (04t...): "

echo.
echo 🔄 Promoting package version to released...

REM Promote to released
sf package version promote ^
  --package "%PACKAGE_VERSION_ID%"

if %ERRORLEVEL% neq 0 (
    echo ❌ Version promotion failed!
    pause
    exit /b 1
)

echo ✅ Package version promoted to released!

REM Display final information
echo.
echo 🎉 New Version Created Successfully!
echo.
echo 📦 Version Details:
echo Package: SOQL Builder Pro
echo Version: %VERSION_NAME% (%VERSION_NUMBER%)
echo Package Version ID: %PACKAGE_VERSION_ID%
echo Status: Released
echo.
echo 🔗 Installation URL:
echo https://login.salesforce.com/packaging/installPackage.apexp?p0=%PACKAGE_VERSION_ID%
echo.
echo 📋 Next Steps:
echo 1. Test the new version in a fresh org
echo 2. Update documentation if needed
echo 3. Notify users of the new version
echo 4. Update any installation links

echo.
pause
