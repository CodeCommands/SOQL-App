# SOQL Builder Pro - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v1.1.0
- Advanced filter builder with date/number operators
- Query history and favorites functionality
- Batch export capabilities for large datasets
- Performance optimizations for metadata loading

## [1.0.0] - 2025-08-13

### Added
- **Initial Release** 🎉
- Visual SOQL query builder with drag-and-drop interface
- Excel export functionality with proper formatting
- CSV export support
- Field-level security enforcement
- Object permission validation
- Enhanced Clear button functionality
- Responsive Lightning Design System UI
- Comprehensive Apex classes with 88% test coverage
- Permission set for user access control

### Package Details
- **Package ID**: `0HogL0000000PT3SAM`
- **Package Version ID**: `04tgL0000004vCbQAI`
- **Type**: Unlocked Package
- **Installation URL**: https://login.salesforce.com/packaging/installPackage.apexp?p0=04tgL0000004vCbQAI

### Components Included
- Lightning Web Component: `soqlRunner`
- Apex Classes: `CodeBuddhaSOQLMeta`, `CodeBuddhaSOQLRunner`
- Test Classes: `CodeBuddhaSOQLMetaTest`, `CodeBuddhaSOQLRunnerTest`
- Permission Set: `SOQL_Runner_User`
- Static Resources: Export libraries and dependencies

### Security & Compliance
- Field-level security validation
- Object access permission checks
- DML operation prevention
- Sharing rule compliance
- Governor limit awareness

### Technical Specifications
- **API Version**: 64.0
- **Platform**: Lightning Experience
- **Dependencies**: None
- **Test Coverage**: 88% average (94% CodeBuddhaSOQLMeta, 82% CodeBuddhaSOQLRunner)

---

## Version History Template

When creating new versions, use this template:

```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- New features added

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security-related changes

### Package Details
- **Package Version ID**: `04t...`
- **Installation URL**: https://login.salesforce.com/packaging/installPackage.apexp?p0=04t...
```

---

## Future Roadmap

### v1.1.0 - Spring 2025
- [ ] Advanced filter builder with operators
- [ ] Query history with favorites
- [ ] Batch export for large datasets
- [ ] Performance optimizations

### v1.2.0 - Summer 2025
- [ ] Dashboard integration
- [ ] Scheduled exports
- [ ] Additional export formats (JSON, XML)
- [ ] Query templates

### v2.0.0 - Winter 2026
- [ ] API access for external tools
- [ ] Custom export templates
- [ ] Multi-org support
- [ ] Advanced analytics

---

## Support & Contribution

### Reporting Issues
- **Bug Reports**: [GitHub Issues](https://github.com/CodeCommands/SOQL-App/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/CodeCommands/SOQL-App/discussions)

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
