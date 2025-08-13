#!/bin/bash

# SOQL Builder Pro - New Version Creation Script
# This script creates a new version of an existing package

echo "🔄 Creating New Version for SOQL Builder Pro..."

# Get version information from user
read -p "Enter version name (e.g., Spring 2025): " VERSION_NAME
read -p "Enter version number (e.g., 1.1.0): " VERSION_NUMBER
read -p "Enter version description: " VERSION_DESCRIPTION

echo ""
echo "📋 Version Details:"
echo "Name: $VERSION_NAME"
echo "Number: $VERSION_NUMBER"
echo "Description: $VERSION_DESCRIPTION"
echo ""

# Confirm before proceeding
read -p "Continue with version creation? (y/n): " CONFIRM
if [[ $CONFIRM != [yY] ]]; then
    echo "❌ Version creation cancelled."
    exit 0
fi

echo ""
echo "📝 Creating new package version..."

# Create new package version
sf package version create \
  --package "SOQL Builder Pro" \
  --code-coverage \
  --installation-key-bypass \
  --version-name "$VERSION_NAME" \
  --version-number "$VERSION_NUMBER.NEXT" \
  --version-description "$VERSION_DESCRIPTION" \
  --definition-file "config/project-scratch-def.json" \
  --wait 30

if [ $? -ne 0 ]; then
    echo "❌ Version creation failed!"
    exit 1
fi

echo "✅ Package version created successfully!"

# Get the new version ID for promotion
echo ""
read -p "Enter the new Package Version ID (04t...): " PACKAGE_VERSION_ID

echo ""
echo "🔄 Promoting package version to released..."

# Promote to released
sf package version promote \
  --package "$PACKAGE_VERSION_ID"

if [ $? -ne 0 ]; then
    echo "❌ Version promotion failed!"
    exit 1
fi

echo "✅ Package version promoted to released!"

# Display final information
echo ""
echo "🎉 New Version Created Successfully!"
echo ""
echo "📦 Version Details:"
echo "Package: SOQL Builder Pro"
echo "Version: $VERSION_NAME ($VERSION_NUMBER)"
echo "Package Version ID: $PACKAGE_VERSION_ID"
echo "Status: Released"
echo ""
echo "🔗 Installation URL:"
echo "https://login.salesforce.com/packaging/installPackage.apexp?p0=$PACKAGE_VERSION_ID"
echo ""
echo "📋 Next Steps:"
echo "1. Test the new version in a fresh org"
echo "2. Update documentation if needed"
echo "3. Notify users of the new version"
echo "4. Update any installation links"

echo ""
