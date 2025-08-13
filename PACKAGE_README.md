# SOQL Builder Pro - Managed Package

## Package Overview

**SOQL B### **2. Assign Permission Set**
1. Navigate to **Setup** → **Permission Sets**
2. Select **"CodeBuddha__SOQL_Runner_User"**
3. Click **Manage Assignments**
4. Add users who need accessr Pro** is a comprehensive Salesforce Lightning Web Component application that provides an intuitive interface for building, executing, and exporting SOQL queries. Perfect for administrators, developers, and power users who need to query Salesforce data efficiently.

## 🚀 Key Features

### **Visual Query Builder**
- **Drag & Drop Interface**: Intuitive object and field selection
- **Real-time Query Generation**: See SOQL syntax as you build
- **Smart Field Filtering**: Quick search and categorization
- **Relationship Navigation**: Easy parent-child relationship queries

### **Advanced Query Execution**
- **Secure Execution**: Built-in DML protection and field-level security
- **Subquery Support**: Handle complex nested queries
- **Performance Optimized**: Efficient query processing
- **Error Handling**: Clear, actionable error messages

### **Export & Analysis**
- **Excel Export**: One-click export to spreadsheet format
- **CSV Support**: Standard comma-separated value export
- **Formatted Results**: Clean, readable data presentation
- **Large Dataset Handling**: Optimized for bulk data export

### **Enhanced User Experience**
- **Modern UI**: Lightning Design System compliant
- **Responsive Design**: Works on desktop and mobile
- **Enhanced Clear Function**: Smart reset preserves context
- **Utility Bar Integration**: Quick access from any page

## 📦 Package Contents

### **Lightning Web Components**
- `soqlRunner` - Main query builder interface

### **Apex Classes**
- `CodeBuddha__CodeBuddhaSOQLMeta__c` - SObject metadata service (94% test coverage)
- `CodeBuddha__CodeBuddhaSOQLRunner__c` - Secure query execution engine (82% test coverage)
- `CodeBuddha__CodeBuddhaSOQLMetaTest__c` - Comprehensive test coverage
- `CodeBuddha__CodeBuddhaSOQLRunnerTest__c` - Complete unit tests

### **Configuration**
- `CodeBuddha__SOQL_Runner__c` - Lightning App
- `CodeBuddha__SOQL_Runner_User__c` - Permission Set
- `CodeBuddha__SOQL_Runner_UtilityBar__c` - Utility Bar Configuration
- Static Resources for external libraries (SheetJS)

## 🛠 Installation Requirements

### **Salesforce Edition**
- Enterprise, Performance, Unlimited, or Developer Edition
- Lightning Experience enabled

### **User Permissions**
- System Administrator or custom profile with:
  - Apex Classes access
  - Lightning Components access
  - Static Resources access

### **API Version**
- Salesforce API version 64.0 or higher

## 📋 Installation Steps

### **1. Install the Package**
```
https://login.salesforce.com/packaging/installPackage.apexp?p0=[PACKAGE_ID]
```

### **2. Assign Permission Set**
1. Navigate to **Setup** → **Permission Sets**
2. Select **SOQL_Runner_User**
3. Click **Manage Assignments**
4. Add users who need access

### **3. Add to App Launcher**
- The **SOQL Runner** app will be available in the App Launcher
- Or add the component to Lightning pages as needed

### **4. Configure Utility Bar (Optional)**
1. Go to **Setup** → **App Manager**
2. Edit your Lightning App
3. Add **SOQL Runner** to the Utility Bar

## 🔧 Configuration Options

### **Security Settings**
- Field-level security is automatically enforced
- Object permissions are respected
- DML operations are blocked for security

### **User Experience**
- Customize component placement on Lightning pages
- Configure utility bar behavior
- Set up page-level permissions

## 📖 User Guide

### **Basic Query Building**
1. **Select Object**: Choose from the filtered list of accessible objects
2. **Choose Fields**: Select individual fields or use relationship fields
3. **Add Conditions**: Use the WHERE clause builder (manual entry)
4. **Execute Query**: Click "Execute" to run your SOQL
5. **Export Results**: Use "Export to Excel" for data analysis

### **Advanced Features**
- **Subqueries**: Build complex parent-child queries
- **Aggregation**: Use COUNT, SUM, AVG functions
- **Sorting**: Add ORDER BY clauses
- **Limiting**: Control result size with LIMIT

### **Best Practices**
- Start with specific objects to reduce load time
- Use field filtering to find relevant fields quickly
- Export large datasets in manageable chunks
- Test queries before adding complex conditions

## 🛡 Security & Compliance

### **Data Protection**
- **Field-Level Security**: Respects user field permissions
- **Object Permissions**: Only shows accessible objects
- **DML Prevention**: Blocks INSERT/UPDATE/DELETE operations
- **Sharing Rules**: Honors organization-wide defaults

### **Audit & Compliance**
- All query executions are logged in standard Salesforce logs
- No data modification capabilities
- Read-only access to organizational data
- Supports standard Salesforce auditing

## 🔍 Troubleshooting

### **Common Issues**

**Q: Objects not showing in the list**
A: Check user permissions and object accessibility settings

**Q: Fields appear empty**
A: Verify field-level security settings for the user

**Q: Export not working**
A: Ensure browser allows downloads and check popup blockers

**Q: Query execution fails**
A: Review SOQL syntax and verify field/object permissions

### **Support Resources**
- Salesforce Trailhead: SOQL and SOSL
- Package Documentation: [Link to documentation]
- Community Support: [Link to community]

## 📊 Performance Considerations

### **Query Optimization**
- Use selective filters to reduce result sets
- Limit subquery depth for better performance
- Consider query timeout limits (120 seconds)
- Use indexed fields in WHERE clauses when possible

### **Large Data Handling**
- Results automatically paginated
- Export functionality optimized for large datasets
- Memory-efficient processing
- Timeout protection built-in

## 🔄 Version History

### **v1.0.0 - Winter 2025 (Current)**
- Initial managed package release
- Complete query builder interface
- Excel/CSV export functionality
- Comprehensive test coverage (88% average)
- Production-ready security validation

## 🤝 Support & Feedback

### **Getting Help**
- Package documentation and guides
- Salesforce Trailhead resources
- Community forums and discussions

### **Feature Requests**
We welcome feedback and feature requests to improve SOQL Builder Pro.

## 📄 License & Attribution

This package builds upon the open-source [lwc-soql-builder](https://github.com/atskimura/lwc-soql-builder) by Atsuhiko Kimura, used under MIT License.

**SOQL Builder Pro** © 2025 CodeCommands  
Licensed for Salesforce AppExchange distribution.

---

*Transform your Salesforce data querying experience with SOQL Builder Pro - where powerful meets intuitive.*
