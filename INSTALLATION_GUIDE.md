# SOQL Builder Pro - Installation & Setup Guide

## 📦 Pre-Installation Checklist

### **Salesforce Environment Requirements**
- ✅ Salesforce Edition: Enterprise, Performance, Unlimited, or Developer
- ✅ Lightning Experience enabled
- ✅ API Version: 64.0 or higher
- ✅ Administrator access for installation

### **User Requirements**
- ✅ System Administrator or custom profile with package installation rights
- ✅ Users need "SOQL_Runner_User" permission set after installation

---

## 🚀 Quick Installation (3 Steps)

### **Step 1: Install the Package**

**Option A: Direct Package Installation (Recommended)**
```
https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vCbQAI
```

**Option B: Salesforce CLI**
```bash
sf package install --package 04tgL0000004vCbQAI --target-org YOUR_ORG_ALIAS
```

**Option C: Manual Deployment**

**Installation Options:**
- ✅ **Recommended**: Install for All Users
- ⚠️ **Alternative**: Install for Admins Only (requires manual permission assignment)

### **Step 2: Assign Permission Set**
1. Navigate to **Setup** → **Permission Sets**
2. Find and click **"CodeBuddha__SOQL_Runner_User"**
3. Click **"Manage Assignments"**
4. Click **"Add Assignments"**
5. Select users who need access
6. Click **"Assign"** → **"Done"**

### **Step 3: Access the App**
**Method 1: App Launcher**
1. Click the App Launcher (9 dots) in top-left
2. Search for "SOQL Runner"
3. Click to open

**Method 2: Utility Bar (Optional)**
1. App will be automatically available in utility bar
2. Look for SOQL icon in bottom toolbar

---

## ⚙️ Advanced Configuration

### **Custom Lightning App Integration**
1. Go to **Setup** → **App Manager**
2. Find your custom Lightning app
3. Click **Edit**
4. Go to **Utility Items**
5. Add **"SOQL Runner"**
6. Configure display settings
7. Save

### **Lightning Page Integration**
1. Go to **Setup** → **Lightning App Builder**
2. Create new or edit existing page
3. Add **"SOQL Runner"** component
4. Configure component properties
5. Activate page

### **Permission Set Customization**
If you need custom permissions:
1. Clone the **"CodeBuddha__SOQL_Runner_User"** permission set
2. Modify as needed for your organization
3. Assign the custom permission set instead

---

## 🔧 Post-Installation Configuration

### **Verify Installation**
1. Check **Setup** → **Installed Packages**
2. Confirm "SOQL Builder Pro" is listed
3. Verify version number
4. Check installation status

### **Test Basic Functionality**
1. Open SOQL Runner app
2. Select "Account" object
3. Add "Name" field
4. Click "Execute"
5. Verify results display
6. Test "Export to Excel" function

### **Configure Security Settings**
The package automatically respects:
- ✅ Field-Level Security (FLS)
- ✅ Object permissions
- ✅ Sharing rules
- ✅ DML prevention

No additional security configuration needed!

---

## 👥 User Management

### **Adding New Users**
When adding new users who need SOQL Builder Pro access:
1. Create/modify user account
2. Assign **"CodeBuddha__SOQL_Runner_User"** permission set
3. User can immediately access the app

### **Removing User Access**
1. Go to **Setup** → **Permission Sets**
2. Select **"CodeBuddha__SOQL_Runner_User"**
3. Click **"Manage Assignments"**
4. Remove user assignments as needed

### **Bulk User Assignment**
For large user groups:
1. Use Data Loader or Workbench
2. Export current assignments
3. Modify CSV with new users
4. Upload permission set assignments

---

## 🔍 Troubleshooting Common Issues

### **"Component not found" Error**
**Cause**: Package not fully deployed
**Solution**: 
1. Check **Setup** → **Deployment Status**
2. Wait for deployment completion
3. Refresh browser

### **"Insufficient Privileges" Error**
**Cause**: User lacks necessary permissions
**Solution**:
1. Verify **"CodeBuddha__SOQL_Runner_User"** permission set assignment
2. Check user profile has Lightning Components access
3. Ensure Lightning Experience is enabled

### **Objects/Fields Not Visible**
**Cause**: User permissions or field-level security
**Solution**:
1. Review object permissions on user profile
2. Check field-level security settings
3. Verify sharing rules allow access

### **Export Function Not Working**
**Cause**: Browser settings or popup blockers
**Solution**:
1. Allow downloads from your Salesforce domain
2. Disable popup blockers for Salesforce
3. Check browser security settings

### **Performance Issues**
**Cause**: Large datasets or complex queries
**Solution**:
1. Use more selective WHERE clauses
2. Limit number of fields selected
3. Add LIMIT clause to queries
4. Query smaller date ranges

---

## 📊 Monitoring & Analytics

### **Usage Tracking**
Monitor app usage through:
- **Setup** → **Event Monitoring** (if available)
- **Setup** → **Login History**
- Standard Salesforce reports on user activity

### **Performance Monitoring**
Track performance via:
- Query execution times in debug logs
- Governor limit usage
- User feedback and support cases

---

## 🔄 Updates & Maintenance

### **Package Updates**
- Updates are automatically pushed to your org
- Check **Setup** → **Installed Packages** for update notifications
- Review release notes before accepting updates

### **Backup Recommendations**
Before major updates:
1. Export key configuration settings
2. Document any customizations
3. Test in sandbox environment first

---

## 📞 Support & Resources

### **Documentation**
- User Guide: [Link to user documentation]
- Video Tutorials: [Link to video library]
- FAQ: [Link to frequently asked questions]

### **Community Support**
- Community Forum: [Link to community]
- User Groups: [Link to user groups]
- Best Practices: [Link to best practices guide]

### **Premium Support**
- Pro/Enterprise customers: support@soqlbuilderpro.com
- Response time: 24-48 hours
- Phone support available for Enterprise customers

---

## ✅ Installation Checklist

**Pre-Installation**
- [ ] Verified Salesforce edition compatibility
- [ ] Confirmed Lightning Experience is enabled
- [ ] Have administrator access
- [ ] Reviewed user requirements

**Installation**
- [ ] Package successfully installed
- [ ] Permission sets assigned to users
- [ ] App accessible from App Launcher
- [ ] Basic functionality tested

**Post-Installation**
- [ ] Security settings verified
- [ ] User training completed
- [ ] Documentation shared with team
- [ ] Support contacts established

**Ongoing**
- [ ] Monitor usage and performance
- [ ] Keep package updated
- [ ] Gather user feedback
- [ ] Plan feature enhancements

---

*Need help? Contact our support team or visit the community forum for assistance.*
