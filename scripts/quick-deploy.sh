#!/bin/bash

# SOQL Builder Pro - Quick Deployment Script
# This script deploys the source code to a Salesforce org for development

echo "🚀 SOQL Builder Pro - Quick Deployment"

# Get target org from user
read -p "Enter target org alias (or press Enter for default): " TARGET_ORG

if [ -z "$TARGET_ORG" ]; then
    echo "Using default org..."
    ORG_PARAM=""
else
    echo "Using org: $TARGET_ORG"
    ORG_PARAM="--target-org $TARGET_ORG"
fi

echo ""
echo "📦 Deploying source code..."

# Deploy the source
sf project deploy start $ORG_PARAM

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Source code deployed successfully!"

echo ""
echo "👥 Assigning permission set..."

# Assign permission set
sf org assign permset --name SOQL_Runner_User $ORG_PARAM

if [ $? -ne 0 ]; then
    echo "⚠️  Permission set assignment failed. You may need to assign it manually."
else
    echo "✅ Permission set assigned successfully!"
fi

echo ""
echo "🧪 Running tests..."

# Run tests
sf apex run test --class-names CodeBuddhaSOQLMetaTest,CodeBuddhaSOQLRunnerTest $ORG_PARAM

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Open your Salesforce org"
echo "2. Go to App Launcher and search for 'SOQL Runner'"
echo "3. Open SOQL Runner app"
echo "4. Test the functionality"

echo ""
read -p "Open the org now? (y/n): " OPEN_ORG
if [[ $OPEN_ORG == [yY] ]]; then
    sf org open $ORG_PARAM
fi
