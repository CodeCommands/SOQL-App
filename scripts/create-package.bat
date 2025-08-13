@echo off
REM SOQL Builder Pro - Package Creation Script for Windows
REM This script creates a managed package for AppExchange distribution

echo 🚀 Starting SOQL Builder Pro Package Creation...

REM Step 1: Create the package (run this in a Developer Edition org with namespace)
echo 📦 Creating managed package...
sf package create ^
  --name "SOQL Builder Pro" ^
  --description "Visual SOQL query builder with Excel export capabilities" ^
  --package-type "Managed" ^
  --path "force-app" ^
  --target-dev-hub-username "YOUR_DEV_HUB_ORG"

echo ✅ Package created! Note the Package ID and update sfdx-project.json

REM Step 2: Create package version
echo 📝 Creating package version...
sf package version create ^
  --package "SOQL Builder Pro" ^
  --code-coverage ^
  --installation-key-bypass ^
  --definition-file "config/project-scratch-def.json" ^
  --version-name "Winter 2025" ^
  --version-number "1.0.0.NEXT" ^
  --target-dev-hub-username "YOUR_DEV_HUB_ORG" ^
  --wait 30

echo ✅ Package version created!

REM Step 3: Promote to released
echo 🔄 Promoting package version to released...
set /p PACKAGE_VERSION_ID="Enter the Package Version ID (04t...): "

sf package version promote ^
  --package "%PACKAGE_VERSION_ID%" ^
  --target-dev-hub-username "YOUR_DEV_HUB_ORG"

echo ✅ Package version promoted to released!

REM Step 4: Generate installation URL
echo 🔗 Installation URL:
echo https://login.salesforce.com/packaging/installPackage.apexp?p0=%PACKAGE_VERSION_ID%

echo 🎉 Package creation complete! Ready for AppExchange submission.

echo.
echo 📋 Next Steps:
echo 1. Test the package in a fresh org
echo 2. Prepare AppExchange listing materials
echo 3. Submit to AppExchange Partner Portal
echo 4. Complete security review
echo 5. Launch on AppExchange!

pause
