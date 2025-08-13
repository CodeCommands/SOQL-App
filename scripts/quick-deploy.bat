@echo off
REM SOQL Builder Pro - Quick Deployment Script for Windows
REM This script deploys the source code to a Salesforce org for development

echo 🚀 SOQL Builder Pro - Quick Deployment

REM Get target org from user
set /p TARGET_ORG="Enter target org alias (or press Enter for default): "

if "%TARGET_ORG%"=="" (
    echo Using default org...
    set ORG_PARAM=
) else (
    echo Using org: %TARGET_ORG%
    set ORG_PARAM=--target-org %TARGET_ORG%
)

echo.
echo 📦 Deploying source code...

REM Deploy the source
sf project deploy start %ORG_PARAM%

if %ERRORLEVEL% neq 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo ✅ Source code deployed successfully!

echo.
echo 👥 Assigning permission set...

REM Assign permission set
sf org assign permset --name SOQL_Runner_User %ORG_PARAM%

if %ERRORLEVEL% neq 0 (
    echo ⚠️  Permission set assignment failed. You may need to assign it manually.
) else (
    echo ✅ Permission set assigned successfully!
)

echo.
echo 🧪 Running tests...

REM Run tests
sf apex run test --class-names CodeBuddhaSOQLMetaTest,CodeBuddhaSOQLRunnerTest %ORG_PARAM%

echo.
echo 🎉 Deployment Complete!
echo.
echo 📋 Next Steps:
echo 1. Open your Salesforce org
echo 2. Go to App Launcher and search for "SOQL"
echo 3. Open SOQL Builder Pro
echo 4. Test the functionality

echo.
set /p OPEN_ORG="Open the org now? (y/n): "
if /i "%OPEN_ORG%"=="y" (
    sf org open %ORG_PARAM%
)

pause
