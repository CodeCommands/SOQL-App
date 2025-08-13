import { LightningElement, track } from 'lwc';
import runSOQL from '@salesforce/apex/CodeBuddhaSOQLRunner.runSOQL';
import getSObjects from '@salesforce/apex/CodeBuddhaSOQLMeta.getSObjects';
import getSObjectFields from '@salesforce/apex/CodeBuddhaSOQLMeta.getSObjectFields';
import getRecentQueries from '@salesforce/apex/CodeBuddhaSOQLMeta.getRecentQueries';

export default class SoqlRunner extends LightningElement {
    // Theme
    themeColor = '#4B3F72'; // Modern purple
    accentColor = '#1976D2'; // Blue accent
    fontFamily = 'Segoe UI, Arial, sans-serif';

    // Sidebar SObjects
    @track sobjects = [];
    @track filteredSObjects = [];
    @track sobjectSearch = '';
    @track selectedSObject = null;
    @track sobjectFields = [];
    @track filteredFields = [];
    @track fieldSearch = '';
    @track sobjectChildRels = [];
    @track showFieldsTab = true;
    @track showChildRelTab = false;
    @track selectedFields = new Set();
    @track selectedSubqueries = new Map(); // Map of relationshipName -> Set of field names
    @track expandedRelationships = {};
    @track expandedFields = {}; // For tracking expanded reference fields

    // Query and Results
    @track query = '';
    @track results = [];
    @track error = '';
    @track columns = [];
    @track isLoading = false;
    
    // Child relationship data viewing
    @track childRelationshipData = [];
    @track childDataTableColumns = [];
    @track childRelationshipTitle = '';
    @track rawQueryResults = []; // Store raw results for child expansion

    connectedCallback() {
        this.loadSObjects();
        this.loadRecentQueries();
    }
    
    // Computed property for datatable columns with subquery handling
    get dataTableColumns() {
        return this.columns.map(col => {
            // Check if this column contains subquery data
            const isSubqueryColumn = this.isSubqueryColumn(col.fieldName);
            
            if (isSubqueryColumn) {
                return {
                    ...col,
                    type: 'button',
                    typeAttributes: {
                        label: { fieldName: col.fieldName },
                        name: col.fieldName,
                        variant: 'base',
                        class: 'subquery-cell'
                    },
                    cellAttributes: {
                        class: 'slds-text-align_left'
                    }
                };
            } else {
                return col;
            }
        });
    }

    // Check if a column contains subquery data (ends with " rows")
    isSubqueryColumn(fieldName) {
        if (!this.results || this.results.length === 0) return false;
        
        // Check first few records to see if this field contains "X rows" pattern
        for (let i = 0; i < Math.min(3, this.results.length); i++) {
            const value = this.results[i][fieldName];
            if (value && typeof value === 'string' && value.match(/^\d+ rows?$/)) {
                return true;
            }
        }
        return false;
    }

    loadSObjects() {
        getSObjects()
            .then(data => {
                this.sobjects = data;
                this.filteredSObjects = data;
            })
            .catch(() => {
                this.sobjects = [];
                this.filteredSObjects = [];
            });
    }

    loadRecentQueries() {
        getRecentQueries()
            .then(data => {
                this.recentQueries = data;
            })
            .catch(() => {
                this.recentQueries = [];
            });
    }

    handleSObjectSearch(event) {
        this.sobjectSearch = event.target.value;
        const search = this.sobjectSearch.toLowerCase();
        this.filteredSObjects = this.sobjects.filter(obj =>
            obj.label.toLowerCase().includes(search) || obj.apiName.toLowerCase().includes(search)
        );
    }

    selectSObject(event) {
        const apiName = event.currentTarget.dataset.apiname;
        this.selectedSObject = apiName;
        this.showFieldsTab = true;
        this.showChildRelTab = false;
        this.expandedRelationships = {};
        getSObjectFields({ sobjectApiName: apiName })
            .then(data => {
                console.log('Raw field data:', data.fields.slice(0, 5)); // Debug first 5 fields
                // Process fields similar to lwc-soql-builder
                this.sobjectFields = data.fields.map(field => {
                    const isReference = field.type === 'reference' || field.referenceTo;
                    return {
                        ...field,
                        details: `${field.type.toUpperCase()} / ${field.label}`,
                        isNotReference: !isReference,
                        isActive: this.selectedFields.has(field.name),
                        isExpanded: false,
                        referenceFields: [], // Will be loaded when expanded
                        relationshipSObjectName: field.referenceTo && field.referenceTo.length > 0 ? field.referenceTo[0] : null,
                        relationshipName: field.relationshipName
                    };
                });
                console.log('Processed fields with reference info:', this.sobjectFields.filter(f => !f.isNotReference)); // Debug reference fields
                this.filteredFields = this.sobjectFields;
                // Process child relationships with expand state
                this.sobjectChildRels = data.childRelationships.map(rel => ({
                    ...rel,
                    isExpanded: false,
                    expandIconClass: '',
                    childFields: [] // Will be loaded when expanded
                }));
            })
            .catch(() => {
                this.sobjectFields = [];
                this.filteredFields = [];
                this.sobjectChildRels = [];
            });
        // Auto-generate basic SOQL query
        this.query = `SELECT Id FROM ${apiName}`;
    }

    goBackToSObjects() {
        this.selectedSObject = null;
        this.sobjectFields = [];
        this.filteredFields = [];
        this.fieldSearch = '';
        this.selectedFields.clear();
        this.selectedSubqueries.clear(); // Clear subqueries when changing SObject
        this.showFieldsTab = true;
        this.showChildRelTab = false;
    }

    // Renamed for clarity - same as goBackToSObjects
    deselectSObject() {
        this.goBackToSObjects();
    }

    get fieldsTabClass() {
        return 'slds-tabs_default__item' + (this.showFieldsTab ? ' slds-is-active' : '');
    }

    get relationshipsTabClass() {
        return 'slds-tabs_default__item' + (this.showChildRelTab ? ' slds-is-active' : '');
    }

    handleFieldSearch(event) {
        this.fieldSearch = event.target.value;
        const search = this.fieldSearch.toLowerCase();
        this.filteredFields = this.sobjectFields.filter(field =>
            field.label.toLowerCase().includes(search) || field.apiName.toLowerCase().includes(search)
        );
    }

    showFields(event) {
        event.preventDefault();
        this.showFieldsTab = true;
        this.showChildRelTab = false;
    }

    showChildRelationships(event) {
        event.preventDefault();
        this.showFieldsTab = false;
        this.showChildRelTab = true;
    }

    selectField(event) {
        const fieldName = event.currentTarget.dataset.name || event.target.dataset.name;
        if (this.selectedFields.has(fieldName)) {
            this.selectedFields.delete(fieldName);
        } else {
            this.selectedFields.add(fieldName);
        }
        
        // Update field active state
        this.filteredFields = this.filteredFields.map(field => ({
            ...field,
            isActive: this.selectedFields.has(field.name)
        }));
        
        this.updateSOQLQuery();
    }

    selectReferenceField(event) {
        const fieldName = event.currentTarget.dataset.name;
        const parentField = event.currentTarget.dataset.parent;
        
        // Find the parent field to get its relationship name
        const parentFieldObj = this.filteredFields.find(f => f.name === parentField);
        if (!parentFieldObj || !parentFieldObj.relationshipName) {
            console.error('Parent field or relationship name not found:', parentField);
            return;
        }
        
        // Use relationship name instead of field name for SOQL path
        const relationshipPath = parentFieldObj.relationshipName;
        const fullFieldName = `${relationshipPath}.${fieldName}`;
        
        if (this.selectedFields.has(fullFieldName)) {
            this.selectedFields.delete(fullFieldName);
        } else {
            this.selectedFields.add(fullFieldName);
        }
        
        // Update reference field active state
        this.filteredFields = this.filteredFields.map(field => {
            if (field.name === parentField && field.referenceFields) {
                return {
                    ...field,
                    referenceFields: field.referenceFields.map(refField => ({
                        ...refField,
                        isActive: this.selectedFields.has(`${relationshipPath}.${refField.name}`)
                    }))
                };
            }
            return {
                ...field,
                isActive: this.selectedFields.has(field.name)
            };
        });
        
        this.updateSOQLQuery();
    }

    toggleReferenceField(event) {
        const fieldName = event.target.dataset.field;
        const field = this.filteredFields.find(f => f.name === fieldName);
        
        if (!field || field.isNotReference) return;
        
        this.expandedFields[fieldName] = !this.expandedFields[fieldName];
        
        // Load reference fields if expanding for the first time
        if (this.expandedFields[fieldName] && field.referenceFields.length === 0 && field.relationshipSObjectName) {
            getSObjectFields({ sobjectApiName: field.relationshipSObjectName })
                .then(data => {
                    const relationshipPath = field.relationshipName || fieldName.replace('Id', ''); // Fallback if relationshipName not set
                    const referenceFields = data.fields.slice(0, 10).map(refField => ({
                        ...refField,
                        details: `${refField.type.toUpperCase()} / ${refField.label}`,
                        isActive: this.selectedFields.has(`${relationshipPath}.${refField.name}`)
                    }));
                    
                    this.filteredFields = this.filteredFields.map(f => {
                        if (f.name === fieldName) {
                            return {
                                ...f,
                                isExpanded: this.expandedFields[fieldName],
                                referenceFields: referenceFields
                            };
                        }
                        return f;
                    });
                })
                .catch(error => {
                    console.error('Error loading reference fields:', error);
                });
        } else {
            // Just update the expanded state
            this.filteredFields = this.filteredFields.map(f => {
                if (f.name === fieldName) {
                    return {
                        ...f,
                        isExpanded: this.expandedFields[fieldName]
                    };
                }
                return f;
            });
        }
    }

    toggleField(event) {
        const fieldApiName = event.currentTarget.dataset.apiname || event.target.dataset.apiname;
        if (event.target.checked) {
            this.selectedFields.add(fieldApiName);
        } else {
            this.selectedFields.delete(fieldApiName);
        }
        // Update SOQL query with selected fields
        this.updateSOQLQuery();
    }

    updateSOQLQuery() {
        if (this.selectedSObject) {
            let fields = [];
            
            // Add regular fields
            if (this.selectedFields.size > 0) {
                fields = fields.concat(Array.from(this.selectedFields));
            }
            
            // Add subqueries for child relationships
            if (this.selectedSubqueries.size > 0) {
                for (const [relationshipName, fieldSet] of this.selectedSubqueries) {
                    if (fieldSet.size > 0) {
                        const subqueryFields = Array.from(fieldSet).join(', ');
                        const subquery = `(SELECT ${subqueryFields} FROM ${relationshipName})`;
                        fields.push(subquery);
                    }
                }
            }
            
            // Build final query
            if (fields.length > 0) {
                this.query = `SELECT ${fields.join(', ')} FROM ${this.selectedSObject}`;
            } else {
                this.query = `SELECT Id FROM ${this.selectedSObject}`;
            }
        }
    }

    toggleChildRelationship(event) {
        const relationshipName = event.currentTarget.dataset.name;
        const relationship = this.sobjectChildRels.find(rel => rel.relationshipName === relationshipName);
        
        if (relationship) {
            relationship.isExpanded = !relationship.isExpanded;
            relationship.expandIconClass = relationship.isExpanded ? 'slds-icon-utility-chevrondown' : '';
            
            // Load child object fields when expanding for the first time
            if (relationship.isExpanded && relationship.childFields.length === 0) {
                getSObjectFields({ sobjectApiName: relationship.childSObject })
                    .then(data => {
                        relationship.childFields = data.fields.slice(0, 10).map(field => ({
                            ...field,
                            isSelected: this.isChildFieldSelected(relationship.relationshipName, field.apiName)
                        }));
                        this.sobjectChildRels = [...this.sobjectChildRels]; // Trigger reactivity
                    })
                    .catch(() => {
                        relationship.childFields = [];
                    });
            }
            
            this.sobjectChildRels = [...this.sobjectChildRels]; // Trigger reactivity
        }
    }

    selectRelationship(event) {
        const relationshipName = event.currentTarget.dataset.name;
        // Add subquery to SOQL
        if (this.query.includes('FROM')) {
            const subquery = `(SELECT Id FROM ${relationshipName})`;
            if (!this.query.includes(subquery)) {
                // Insert subquery before FROM clause
                const parts = this.query.split(' FROM ');
                this.query = `${parts[0]}, ${subquery} FROM ${parts[1]}`;
            }
        }
    }

    toggleChildField(event) {
        const fieldApiName = event.target.dataset.apiname;
        const relationshipName = event.target.dataset.relationship;
        
        // Get or create the field set for this relationship
        if (!this.selectedSubqueries.has(relationshipName)) {
            this.selectedSubqueries.set(relationshipName, new Set());
        }
        
        const relationshipFields = this.selectedSubqueries.get(relationshipName);
        
        if (event.target.checked) {
            // Add field to subquery
            relationshipFields.add(fieldApiName);
        } else {
            // Remove field from subquery
            relationshipFields.delete(fieldApiName);
            
            // If no fields left in this relationship, remove the relationship entirely
            if (relationshipFields.size === 0) {
                this.selectedSubqueries.delete(relationshipName);
            }
        }
        
        // Update the field state in the UI
        this.sobjectChildRels = this.sobjectChildRels.map(rel => {
            if (rel.relationshipName === relationshipName) {
                return {
                    ...rel,
                    childFields: rel.childFields.map(field => {
                        if (field.apiName === fieldApiName) {
                            return { ...field, isSelected: event.target.checked };
                        }
                        return field;
                    })
                };
            }
            return rel;
        });
        
        this.updateSOQLQuery();
    }

    // Helper method to check if a child field is selected
    isChildFieldSelected(relationshipName, fieldName) {
        const relationshipFields = this.selectedSubqueries.get(relationshipName);
        return relationshipFields ? relationshipFields.has(fieldName) : false;
    }

    handleQueryChange(event) {
        this.query = event.target.value;
    }

    handleRun() {
        this.error = '';
        this.results = [];
        this.columns = [];
        this.isLoading = true;
        this.closeChildRelationship(); // Close any open child relationship
        
        if (!this.query) {
            this.error = 'Please enter a SOQL query.';
            this.isLoading = false;
            return;
        }
        
        runSOQL({ soql: this.query })
            .then(data => {
                console.log('Raw SOQL response:', JSON.stringify(data, null, 2));
                
                if (data && data.length > 0) {
                    // Store raw results for child relationship expansion FIRST
                    this.rawQueryResults = JSON.parse(JSON.stringify(data)); // Deep clone to avoid issues
                    console.log('Stored raw query results:', this.rawQueryResults);
                    
                    // Use the new column collection method based on actual response data
                    const { records, columns } = this.convertQueryResponse(data);
                    
                    console.log('Converted columns:', columns);
                    console.log('Converted records:', JSON.stringify(records, null, 2));
                    
                    // Create columns for the datatable
                    this.columns = columns.map(field => {
                        return {
                            label: field.replace(/\./g, ' '),
                            fieldName: field,
                            type: 'text'
                        };
                    });
                    
                    this.results = records;
                } else {
                    this.results = [];
                    this.columns = [];
                    this.rawQueryResults = [];
                }
                
                this.isLoading = false;
            })
            .catch(err => {
                console.error('SOQL execution error:', err);
                this.error = err.body && err.body.message ? err.body.message : err.message;
                this.isLoading = false;
                this.rawQueryResults = [];
            });
    }

    // Handle cell click for subquery expansion
    handleCellClick(event) {
        console.log('Cell click event:', event.detail);
        
        const { row, rowIndex, fieldName } = event.detail;
        
        // Check if this is a subquery column
        if (this.isSubqueryColumn(fieldName)) {
            console.log('Expanding subquery for:', fieldName, 'row:', rowIndex);
            this.expandChildRelationship(rowIndex, fieldName, row);
        }
    }

    // Handle row action (for button clicks in datatable)
    handleRowAction(event) {
        console.log('Row action event:', event.detail);
        
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        
        // Use the stored original index if available
        let rowIndex = row._originalIndex;
        
        // If original index not available, try finding by Id
        if (rowIndex === undefined && row.Id) {
            rowIndex = this.rawQueryResults.findIndex(r => r.Id === row.Id);
        }
        
        // If still not found, try finding by matching field values
        if (rowIndex === undefined || rowIndex === -1) {
            rowIndex = this.results.findIndex(r => {
                return Object.keys(row).every(key => {
                    if (key === '_originalIndex') return true; // Skip internal fields
                    return r[key] === row[key];
                });
            });
        }
        
        console.log('Button clicked:', actionName, 'for row index:', rowIndex);
        console.log('Row data:', row);
        console.log('Raw results length:', this.rawQueryResults.length);
        console.log('Results array length:', this.results.length);
        
        if (rowIndex !== -1 && rowIndex !== undefined && rowIndex < this.rawQueryResults.length) {
            this.expandChildRelationship(rowIndex, actionName, row);
        } else {
            console.error('Could not find valid row index. Row index:', rowIndex);
            console.error('Row:', row);
            console.error('Raw results:', this.rawQueryResults);
            console.error('Processed results:', this.results);
        }
    }

    // Expand child relationship data
    expandChildRelationship(rowIndex, fieldName, row) {
        console.log('Expanding child relationship:', { rowIndex, fieldName, row });
        console.log('Raw query results:', this.rawQueryResults);
        
        // Validate inputs
        if (rowIndex < 0 || rowIndex >= this.rawQueryResults.length) {
            console.error('Invalid row index:', rowIndex);
            return;
        }
        
        // Get the raw data for this row
        const rawRow = this.rawQueryResults[rowIndex];
        console.log('Raw row data:', rawRow);
        
        if (!rawRow || !rawRow[fieldName]) {
            console.warn('No child data found for field:', fieldName, 'in row:', rawRow);
            return;
        }

        const childData = rawRow[fieldName];
        console.log('Child data:', childData);
        
        // Handle both array format and object format
        let childRecords = [];
        if (Array.isArray(childData)) {
            childRecords = childData;
            console.log('Child data is array with', childRecords.length, 'records');
        } else if (childData.records && Array.isArray(childData.records)) {
            childRecords = childData.records;
            console.log('Child data has records array with', childRecords.length, 'records');
        } else {
            console.warn('Child data format not recognized:', typeof childData, childData);
            return;
        }

        if (childRecords.length === 0) {
            console.warn('No child records to display');
            return;
        }

        // Generate columns for child data
        this.childDataTableColumns = this.generateChildColumns(childRecords);
        console.log('Generated child columns:', this.childDataTableColumns);
        
        // Set the child data and title
        this.childRelationshipData = childRecords;
        this.childRelationshipTitle = `${fieldName} (${childRecords.length} records)`;
        
        console.log('Child relationship display set:', {
            title: this.childRelationshipTitle,
            columns: this.childDataTableColumns,
            data: this.childRelationshipData
        });
    }

    // Generate columns for child relationship data
    generateChildColumns(records) {
        if (!records || records.length === 0) return [];
        
        // Get all unique keys from the child records
        const allKeys = new Set();
        records.forEach(record => {
            Object.keys(record).forEach(key => {
                if (key !== 'attributes') {
                    allKeys.add(key);
                }
            });
        });

        // Convert to column format
        return Array.from(allKeys).map(key => ({
            label: key,
            fieldName: key,
            type: 'text'
        }));
    }

    // Close child relationship view
    closeChildRelationship() {
        this.childRelationshipData = [];
        this.childDataTableColumns = [];
        this.childRelationshipTitle = '';
    }

    handleRunAll() {
        // For demo, same as handleRun. In production, use ALL ROWS if needed.
        this.handleRun();
    }

    // Helper method to collect columns dynamically from response data (like lwc-soql-builder)
    collectColumnsFromResponse(records) {
        if (!records || records.length === 0) return [];
        
        const columnMap = new Map();
        
        // Collect all possible column paths from the records
        records.forEach(record => {
            this._collectColumnMap(record, columnMap, []);
        });
        
        // Convert column map to flat column list
        const columns = [];
        this._flattenColumnMap(columnMap, columns, []);
        
        return columns;
    }
    
    _collectColumnMap(record, columnMap, relationships = []) {
        if (!record || typeof record !== 'object') return;
        
        Object.keys(record).forEach(name => {
            if (name !== 'attributes') {
                let parentMap = columnMap;
                
                // Navigate to the correct parent map
                relationships.forEach(relation => {
                    if (parentMap && parentMap.has && parentMap.has(relation)) {
                        parentMap = parentMap.get(relation);
                    } else {
                        // If we can't navigate further, create the missing map
                        if (parentMap && parentMap.set) {
                            parentMap.set(relation, new Map());
                            parentMap = parentMap.get(relation);
                        }
                    }
                });
                
                // Ensure parentMap is valid before proceeding
                if (parentMap && parentMap.has && parentMap.set) {
                    if (!parentMap.has(name)) {
                        parentMap.set(name, new Map());
                    }
                    
                    const data = record[name];
                    // Only recurse if it's a nested object (not array, not subquery result)
                    if (data && typeof data === 'object' && !data.totalSize && !Array.isArray(data)) {
                        this._collectColumnMap(data, parentMap.get(name), [...relationships, name]);
                    }
                }
            }
        });
    }
    
    _flattenColumnMap(columnMap, columns, relationships = []) {
        if (!columnMap || typeof columnMap !== 'object' || !columnMap.size) return;
        
        for (let [name, data] of columnMap) {
            if (data && data.size && data.size > 0) {
                // This has nested properties, recurse
                this._flattenColumnMap(data, columns, [...relationships, name]);
            } else {
                // This is a leaf field, add it to columns
                const columnPath = [...relationships, name].join('.');
                if (!columns.includes(columnPath)) {
                    columns.push(columnPath);
                }
            }
        }
    }
    
    // Helper method to get field value using dot notation
    getFieldValue(column, record) {
        if (!record || !column) return null;
        
        let value = record;
        const parts = column.split('.');
        
        for (let i = 0; i < parts.length; i++) {
            if (value && typeof value === 'object' && parts[i] in value) {
                value = value[parts[i]];
            } else {
                return null;
            }
        }
        
        return value;
    }

    // Helper method to convert query response to displayable format
    convertQueryResponse(records) {
        if (!records || records.length === 0) return { records: [], columns: [] };
        
        try {
            const columns = this.collectColumnsFromResponse(records);
            
            const convertedRecords = records.map((record, index) => {
                const convertedRecord = { 
                    _originalIndex: index, // Add original index for reliable mapping
                };
                columns.forEach(column => {
                    const rawValue = this.getFieldValue(column, record);
                    let displayValue = rawValue;
                    
                    // Handle subquery results - both array and object patterns
                    if (rawValue && Array.isArray(rawValue)) {
                        // Array of child records
                        displayValue = `${rawValue.length} rows`;
                    }
                    else if (rawValue && typeof rawValue === 'object' && rawValue.totalSize !== undefined) {
                        // Object with totalSize property
                        displayValue = `${rawValue.totalSize} rows`;
                    }
                    
                    convertedRecord[column] = displayValue;
                });
                return convertedRecord;
            });
            
            return { records: convertedRecords, columns };
        } catch (error) {
            console.error('Error in convertQueryResponse:', error);
            // Fallback to simple flattening if column collection fails
            return this.fallbackConvertResponse(records);
        }
    }    // Fallback method for when column collection fails
    fallbackConvertResponse(records) {
        const columns = [];
        const convertedRecords = records.map(record => {
            const flattened = this.flattenRecordSimple(record);
            Object.keys(flattened).forEach(key => {
                if (!columns.includes(key)) {
                    columns.push(key);
                }
            });
            return flattened;
        });
        
        return { records: convertedRecords, columns };
    }
    
    // Simple record flattening without complex column collection
    flattenRecordSimple(record, prefix = '') {
        const flattened = {};
        
        if (!record || typeof record !== 'object') return flattened;
        
        for (const [key, value] of Object.entries(record)) {
            if (key === 'attributes') continue;
            
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            console.log(`Processing field: ${newKey}, value:`, value);
            
            // Handle subquery results - check for both patterns:
            // 1. Objects with totalSize property (when no records or aggregate queries)
            // 2. Arrays (when there are actual records)
            if (value && Array.isArray(value)) {
                // This is an array of child records (subquery result)
                flattened[newKey] = `${value.length} rows`;
                console.log(`Detected array subquery for ${newKey}: ${value.length} rows`);
            }
            else if (value && typeof value === 'object' && value.totalSize !== undefined) {
                // This is an object with totalSize (empty subquery result)
                flattened[newKey] = `${value.totalSize} rows`;
                console.log(`Detected object subquery for ${newKey}: ${value.totalSize} rows`);
            }
            // Handle nested objects (relationship fields)
            else if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenRecordSimple(value, newKey));
            }
            // Handle primitive values
            else {
                flattened[newKey] = value;
            }
        }
        
        return flattened;
    }

    // Helper method to extract field names from SOQL query
    extractFieldsFromSOQL(soqlQuery) {
        try {
            // Remove extra whitespace and normalize
            const cleanQuery = soqlQuery.trim().replace(/\s+/g, ' ');
            
            // Extract the SELECT part (between SELECT and FROM)
            const selectMatch = cleanQuery.match(/SELECT\s+(.*?)\s+FROM/i);
            if (!selectMatch) return [];
            
            const selectClause = selectMatch[1];
            
            // Split by comma but be careful of parentheses (for subqueries)
            const fields = [];
            let currentField = '';
            let parenLevel = 0;
            
            for (let i = 0; i < selectClause.length; i++) {
                const char = selectClause[i];
                if (char === '(') {
                    parenLevel++;
                } else if (char === ')') {
                    parenLevel--;
                } else if (char === ',' && parenLevel === 0) {
                    if (currentField.trim()) {
                        fields.push(currentField.trim());
                    }
                    currentField = '';
                    continue;
                }
                currentField += char;
            }
            
            // Add the last field
            if (currentField.trim()) {
                fields.push(currentField.trim());
            }
            
            // Process fields to extract subquery fields
            const allFields = [];
            fields.forEach(field => {
                if (field.startsWith('(SELECT') && field.endsWith(')')) {
                    // This is a subquery - don't include it as a column
                    // Subquery results will be handled differently
                } else {
                    // Remove any alias (everything after AS keyword)
                    const withoutAlias = field.replace(/\s+AS\s+\w+/i, '');
                    allFields.push(withoutAlias.trim());
                }
            });
            
            return allFields;
            
        } catch (error) {
            console.warn('Could not parse SOQL query for fields:', error);
            return [];
        }
    }

    handleFormatSOQL() {
        // Simple formatting: uppercase keywords
        if (this.query) {
            let formatted = this.query.replace(/\b(select|from|where|order by|group by|limit|offset|having|and|or|not|asc|desc)\b/gi,
                match => match.toUpperCase()
            );
            this.query = formatted;
        }
    }

    handleExportCSV() {
        if (!this.results.length) return;
        const columns = this.columns.map(col => col.fieldName);
        let csv = columns.join(',') + '\n';
        this.results.forEach(row => {
            csv += columns.map(col => '"' + (row[col] || '') + '"').join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soql_results.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
}
