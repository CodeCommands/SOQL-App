# SOQL App

A powerful Salesforce SOQL query builder and executor built with Lightning Web Components.

## Features

- **Interactive SOQL Builder**: Visual interface for building complex SOQL queries
- **Real-time Query Execution**: Execute queries with immediate results
- **Export Functionality**: Export query results to Excel/CSV
- **Enhanced UX**: Clean, modern interface with improved Clear button functionality
- **Production Ready**: Comprehensive test coverage and security validation

## Attribution

This project builds upon the excellent foundation of [lwc-soql-builder](https://github.com/atskimura/lwc-soql-builder) by Atsuhiko Kimura, licensed under the MIT License.

### Major Enhancements:
- Complete code cleanup and performance optimization  
- Enhanced Clear button resets left pane state
- 94%+ test coverage on core Apex classes
- Production-ready security validation
- Modern component design and UX improvements

## Installation

1. Clone this repository
2. Deploy to your Salesforce org using `sf project deploy start`
3. Assign the `SOQL_Runner_User` permission set to users
4. Access via the SOQL Runner app or add to utility bar

## License

MIT License - see [LICENSE](LICENSE) file for details.

Original lwc-soql-builder: Copyright (c) 2020 Atsuhiko Kimura  
SOQL App enhancements: Copyright (c) 2025 CodeCommands

## Technical Details

### Apex Classes:
- `CodeBuddhaSOQLMeta` - SObject metadata retrieval (94% test coverage)
- `CodeBuddhaSOQLRunner` - Secure SOQL execution (82% test coverage)

### Lightning Web Component:
- `soqlRunner` - Main query builder interface

### Security Features:
- DML operation blocking
- Field-level security validation
- Permission-based object access

## Development

This project follows Salesforce DX development model. See [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm) for more details.
