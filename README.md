# SOQL Builder Pro

[![AppExchange](https://img.shields.io/badge/AppExchange-Available-brightgreen)](https://appexchange.salesforce.com/soqlbuilderpro)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/Coverage-88%25-green)](README.md)
[![Salesforce API](https://img.shields.io/badge/Salesforce%20API-v64.0-blue)](README.md)

> **The most intuitive visual SOQL query builder for Salesforce with powerful export capabilities.**

Transform your Salesforce data querying experience with **SOQL Builder Pro** - where complex queries become simple drag-and-drop operations.

## 📝 Important Notes
- **Package Name**: SOQL Builder Pro (what you install)
- **App Name in Salesforce**: SOQL Runner (what you see in App Launcher)
- **Permission Set**: SOQL_Runner_User (what users need)

## 🚀 Key Features

### **Visual Query Builder**
- **Drag & Drop Interface**: No SOQL syntax knowledge required
- **Real-time Generation**: See your query build as you select
- **Smart Filtering**: Quick field search and categorization
- **Relationship Navigation**: Easy parent-child queries

### **Professional Export**
- **Excel Export**: One-click .xlsx download with formatting
- **CSV Support**: Standard data interchange format
- **Large Dataset Handling**: Optimized for bulk exports
- **Governor Limit Aware**: Respects Salesforce constraints

### **Enterprise Security**
- **Field-Level Security**: Automatic FLS enforcement
- **Object Permissions**: Respects user access levels
- **DML Protection**: Prevents data modification
- **Audit Compliant**: Full Salesforce logging integration

### **Modern UX**
- **Lightning Design**: Native Salesforce look and feel
- **Responsive**: Works on desktop and mobile
- **Utility Bar**: Quick access from any page
- **Enhanced Clear**: Smart reset functionality

## 📦 Installation

### **Direct Package Installation**
**Package ID**: `0HogL0000000PT3SAM`  
**Installation URL**: https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vCbQAI

[![Install Package](https://img.shields.io/badge/Install-Package-blue?style=for-the-badge)](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vCbQAI)

### **Using Salesforce CLI**
```bash
sf package install --package 04tgL0000004vCbQAI --target-org YOUR_ORG_ALIAS
```

### **Manual Installation**
1. Deploy this repository to your Salesforce org
2. Assign the `SOQL_Runner_User` permission set
3. Access via App Launcher or Utility Bar

[📖 Detailed Installation Guide](INSTALLATION_GUIDE.md)

## 🎯 Quick Start

1. **Install Package**: Use the installation URL above
2. **Assign Permissions**: Give users the "SOQL_Runner_User" permission set
3. **Open App**: Find "SOQL Runner" in App Launcher
4. **Select Object**: Choose from accessible SObjects
5. **Pick Fields**: Drag fields to your query
6. **Add Conditions**: Build WHERE clauses (optional)
7. **Execute**: Run your query safely
8. **Export**: Download results to Excel/CSV

## 📊 Technical Details

### **Package Contents**
- **Lightning Web Component**: Modern, responsive query interface
- **Apex Classes**: Secure backend with 88% test coverage
- **Permission Set**: Ready-to-assign user permissions
- **Static Resources**: Optimized export libraries

### **Architecture**
```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   soqlRunner LWC    │ => │  CodeBuddhaSOQLMeta  │ => │    Salesforce       │
│  (User Interface)   │    │   (Metadata API)     │    │   (Schema API)      │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
           │                          │                           │
           v                          v                           v
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Export Handler    │ <= │ CodeBuddhaSOQLRunner │ <= │   Query Execution   │
│   (SheetJS/CSV)     │    │   (Secure Execute)   │    │   (Database API)    │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### **Test Coverage**
- `CodeBuddhaSOQLMeta`: 94% coverage
- `CodeBuddhaSOQLRunner`: 82% coverage
- **Overall**: 88% average coverage

### **Package Information**
- **Package ID**: `0HogL0000000PT3SAM`
- **Version**: 1.0.0 (Winter 2025)
- **Type**: Unlocked Package
- **Status**: Released ✅

## 🛡️ Security & Compliance

### **Data Protection**
- ✅ Field-Level Security enforcement
- ✅ Object permission validation  
- ✅ Sharing rule compliance
- ✅ DML operation blocking

### **Enterprise Ready**
- ✅ Governor limit awareness
- ✅ Error handling and logging
- ✅ Audit trail compatibility
- ✅ No data modification capabilities

## 🔧 Development

### **Prerequisites**
- Salesforce CLI
- VS Code with Salesforce Extensions
- Node.js (for local testing)

### **Local Development**
```bash
# Clone the repository
git clone https://github.com/CodeCommands/SOQL-App.git

# Deploy to scratch org
sf org create scratch -f config/project-scratch-def.json -a soql-dev
sf project deploy start --target-org soql-dev
sf org assign permset -n SOQL_Runner_User --target-org soql-dev

# Open org
sf org open --target-org soql-dev
```

### **Testing**
```bash
# Run all tests
sf apex run test --target-org YOUR_ORG

# Run specific test classes
sf apex run test --class-names CodeBuddhaSOQLMetaTest,CodeBuddhaSOQLRunnerTest --target-org YOUR_ORG

# Get coverage
sf apex run test --code-coverage --target-org YOUR_ORG
```

## 📚 Documentation

- [📖 Installation Guide](INSTALLATION_GUIDE.md) - Complete setup instructions
- [📖 Package Documentation](PACKAGE_README.md) - Detailed feature guide
- [📖 AppExchange Listing](APPEXCHANGE_LISTING.md) - Marketing materials
- [📝 User Guide](https://github.com/CodeCommands/SOQL-App/wiki) - How-to tutorials

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## 📈 Roadmap

### **Q2 2025**
- [ ] Advanced filter builder
- [ ] Query history and favorites
- [ ] Batch export capabilities

### **Q3 2025**
- [ ] Dashboard integration
- [ ] Scheduled exports
- [ ] Advanced analytics features

### **Q4 2025**
- [ ] API access for external tools
- [ ] Custom export templates
- [ ] Multi-org support

## 🆘 Support

### **Community Support**
- [GitHub Issues](https://github.com/CodeCommands/SOQL-App/issues) - Bug reports and feature requests
- [Community Forum](https://community.soqlbuilderpro.com) - User discussions
- [Stack Overflow](https://stackoverflow.com/questions/tagged/soql-builder-pro) - Technical questions

### **Premium Support**
- **Pro/Enterprise**: Email support with 24-48h response
- **Enterprise**: Phone support and dedicated success manager

## 📄 License & Attribution

This project builds upon the excellent foundation of [lwc-soql-builder](https://github.com/atskimura/lwc-soql-builder) by Atsuhiko Kimura, used under MIT License.

### **Open Source License**
- Original lwc-soql-builder: Copyright (c) 2020 Atsuhiko Kimura
- SOQL Builder Pro enhancements: Copyright (c) 2025 CodeCommands
- Licensed under [MIT License](LICENSE)

### **Commercial License**
- AppExchange distribution: Licensed for Salesforce ecosystem
- Enterprise features: Available under commercial license

## 🌟 Credits

**Original Inspiration**: [lwc-soql-builder](https://github.com/atskimura/lwc-soql-builder) by Atsuhiko Kimura  
**Enhancement Development**: CodeCommands Team  
**Community**: Salesforce Developer Community

---

## 🏆 Why Choose SOQL Builder Pro?

✅ **Most Secure**: Only SOQL builder with comprehensive FLS enforcement  
✅ **Most Intuitive**: Visual drag-drop interface requires no SOQL knowledge  
✅ **Most Professional**: Native Excel export with proper formatting  
✅ **Most Reliable**: 88% test coverage ensures production stability  
✅ **Most Modern**: Built with latest Lightning Web Components  

**Ready to transform your Salesforce data querying experience?**

[![Install Package](https://img.shields.io/badge/Install-Package-blue?style=for-the-badge)](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vCbQAI)
