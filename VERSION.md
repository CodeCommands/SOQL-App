# SOQL Builder Pro - Version Information

## Current Release

### 🚀 Version 1.1.0-2 (Spring 2025 Enhanced)
- **Release Date**: August 13, 2025
- **Status**: ✅ Released and Promoted
- **Package Version ID**: `04tgL0000004vSjQAI`
- **Installation URL**: https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vSjQAI

### Key Features
- ✅ Query All functionality with cursor-based pagination
- ✅ Large dataset export capabilities (unlimited records)
- ✅ Enhanced subquery support with expandable results
- ✅ LIMIT input controls (1-50,000 records)
- ✅ Complete relationship field handling in exports
- ✅ Unified export processing for all query types
- ✅ 100% test coverage

## Previous Releases

### Version 1.0.0-1 (Winter 2025)
- **Release Date**: January 15, 2025
- **Status**: ✅ Released
- **Package Version ID**: `04tgL0000004vCbQAI`
- **Installation URL**: https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vCbQAI

### Features
- ✅ Visual SOQL query builder
- ✅ Excel/CSV export capabilities
- ✅ Field-level security enforcement
- ✅ Object permission validation
- ✅ 88% test coverage

## Version Comparison Matrix

| Feature | v1.0.0-1 | v1.1.0-2 |
|---------|----------|----------|
| **Core Functionality** | | |
| Visual Query Builder | ✅ | ✅ |
| Excel Export | ✅ | ✅ |
| CSV Export | ✅ | ✅ |
| Field-Level Security | ✅ | ✅ |
| **Advanced Features** | | |
| Query All Mode | ❌ | ✅ |
| Large Dataset Export | ❌ | ✅ |
| Subquery Support | ❌ | ✅ |
| LIMIT Controls | ❌ | ✅ |
| Cursor Pagination | ❌ | ✅ |
| Relationship Field Export | ⚠️ Basic | ✅ Complete |
| **Technical** | | |
| Test Coverage | 88% | 100% |
| Export Processing | Basic | Unified |
| Column Detection | Basic | Advanced |

## Installation Commands

### Latest Version (Recommended)
```bash
# Using Salesforce CLI
sf package install --package 04tgL0000004vSjQAI --target-org YOUR_ORG_ALIAS

# Using Package Manager URL
https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vSjQAI
```

### Previous Version
```bash
# Using Salesforce CLI
sf package install --package 04tgL0000004vCbQAI --target-org YOUR_ORG_ALIAS

# Using Package Manager URL
https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vCbQAI
```

## Upgrade Instructions

### From v1.0.0-1 to v1.1.0-2
1. **Install New Version**: Use the installation URL or CLI command above
2. **Automatic Upgrade**: The package will automatically upgrade existing installation
3. **No Configuration Required**: All existing settings and permissions remain intact
4. **New Features Available**: Query All, LIMIT controls, and enhanced exports are immediately available

### Breaking Changes
- ❌ **None**: This is a fully backward-compatible release
- ✅ **All existing functionality preserved**
- ✅ **Same permission set**: `SOQL_Runner_User`
- ✅ **Same app location**: SOQL Runner in App Launcher

## Package Metadata

### Package Information
- **Package Name**: SOQL Builder Pro
- **Package ID**: `0HogL0000000PT3SAM`
- **Package Type**: Unlocked Package
- **Namespace**: None (unmanaged)
- **API Version**: 64.0

### Dev Hub Information
- **Dev Hub Org**: `agentforce-devhub`
- **Dev Hub ID**: `00DgL000005Cn0ZUAS`
- **Username**: `pawan.patel528@agentforce.com`

### Version History
```json
{
  "SOQL Builder Pro": "0HogL0000000PT3SAM",
  "SOQL Builder Pro@1.0.0-1": "04tgL0000004vCbQAI",
  "SOQL Builder Pro@1.1.0-1": "04tgL0000004vR7QAI",
  "SOQL Builder Pro@1.1.0-2": "04tgL0000004vSjQAI"
}
```

## Support Information

### Salesforce Edition Compatibility
| Edition | v1.0.0-1 | v1.1.0-2 | Notes |
|---------|----------|----------|-------|
| Developer | ✅ | ✅ | Full support |
| Professional | ✅ | ✅ | Full support |
| Enterprise | ✅ | ✅ | Full support |
| Unlimited | ✅ | ✅ | Full support |
| Essentials | ⚠️ | ⚠️ | Limited Lightning support |

### Required Permissions
- **Permission Set**: `SOQL_Runner_User` (automatically included)
- **User Permissions**: No additional permissions required
- **Object Access**: Respects existing user permissions
- **Field Access**: Enforces Field-Level Security

## Quality Metrics

### Test Coverage (v1.1.0-2)
- **CodeBuddhaSOQLMeta**: 100% (14/14 test methods passing)
- **CodeBuddhaSOQLRunner**: 100% (100% of lines covered)
- **Overall Package**: 100% coverage

### Performance Benchmarks
- **Query Execution**: < 2 seconds for typical queries
- **Large Dataset Export**: Optimized cursor-based processing
- **UI Response**: < 500ms for field selection and query building
- **Export Generation**: < 30 seconds for 50,000+ records

## Release Notes Summary

### What's New in v1.1.0-2
🎉 **Major Enhancements**: Query All mode, large dataset exports, enhanced subqueries  
🔧 **Improvements**: Unified export processing, 100% test coverage  
🐛 **Bug Fixes**: Relationship field exports, subquery column display  
📈 **Performance**: Optimized large dataset handling with cursor pagination  

### Migration Benefits
- **Zero Downtime**: Seamless upgrade process
- **Enhanced Capabilities**: Access to unlimited data querying
- **Better Exports**: Complete relationship field support
- **Improved Reliability**: 100% test coverage ensures stability

---

*Last Updated: August 13, 2025*  
*Next Scheduled Update: Q2 2025 (v1.2.0)*
