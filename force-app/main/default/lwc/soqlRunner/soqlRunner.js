import { LightningElement, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import SHEETJS from '@salesforce/resourceUrl/sheetjs';
import runSOQL from '@salesforce/apex/CodeBuddhaSOQLRunner.runSOQL';
import runSOQLAll from '@salesforce/apex/CodeBuddhaSOQLRunner.runSOQLAll';
import runSOQLPaginated from '@salesforce/apex/CodeBuddhaSOQLRunner.runSOQLPaginated';
import runSOQLForExport from '@salesforce/apex/CodeBuddhaSOQLRunner.runSOQLForExport';
import runSOQLWithCursor from '@salesforce/apex/CodeBuddhaSOQLRunner.runSOQLWithCursor';
import getSObjects from '@salesforce/apex/CodeBuddhaSOQLMeta.getSObjects';
import getSObjectFields from '@salesforce/apex/CodeBuddhaSOQLMeta.getSObjectFields';

/* global XLSX */

export default class SoqlRunner extends LightningElement {
    // Theme
    themeColor = '#4B3F72'; // Modern purple
    accentColor = '#1976D2'; // Blue accent
    fontFamily = 'Segoe UI, Arial, sans-serif';

    // SheetJS Library
    sheetJSInitialized = false;
    
    // SOQL Parser JS Library
    soqlParserInitialized = false;
    soqlParser = null;

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
    @track queryLimit = '';
    @track finalQuery = ''; // Query with limit applied
    @track results = [];
    @track error = '';
    @track columns = [];
    @track isLoading = false;
    
    // Pagination
    @track currentPage = 1;
    @track pageSize = 2000;
    @track totalRecords = 0;
    @track totalPages = 0;
    @track hasNextPage = false;
    @track hasPreviousPage = false;
    @track isQueryAll = false;
    @track showPagination = false;
    
    // Export handling
    @track isExporting = false;
    @track exportProgress = 0;
    @track exportTotal = 0;
    
    // Child relationship data viewing
    @track childRelationshipData = [];
    @track childDataTableColumns = [];
    @track childRelationshipTitle = '';
    @track rawQueryResults = []; // Store raw results for child expansion
    
    // Loading states
    @track isLoadingSObjects = false;
    @track isLoadingFields = false;

    connectedCallback() {
        this.loadSObjects();
        this.loadSheetJS();
    }

    // Load SheetJS library
    loadSheetJS() {
        if (this.sheetJSInitialized) {
            return;
        }
        loadScript(this, SHEETJS)
            .then(() => {
                this.sheetJSInitialized = true;
            })
            .catch(() => {
                this.showToast('Error', 'Failed to load export library', 'error');
            });
    }

    // Load SOQL Parser JS library
    
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
            }
            return col;
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
        this.isLoadingSObjects = true;
        getSObjects()
            .then(data => {
                this.sobjects = data;
                this.filteredSObjects = data;
                this.isLoadingSObjects = false;
            })
            .catch(() => {
                this.sobjects = [];
                this.filteredSObjects = [];
                this.isLoadingSObjects = false;
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
        this.isLoadingFields = true;
        
        getSObjectFields({ sobjectApiName: apiName })
            .then(data => {
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
                this.filteredFields = this.sobjectFields;
                // Process child relationships with expand state
                this.sobjectChildRels = data.childRelationships.map(rel => ({
                    ...rel,
                    isExpanded: false,
                    chevronIcon: '/_slds/icons/utility-sprite/svg/symbols.svg#chevronright',
                    childFields: [] // Will be loaded when expanded
                }));
                this.isLoadingFields = false;
            })
            .catch(() => {
                this.sobjectFields = [];
                this.filteredFields = [];
                this.sobjectChildRels = [];
                this.isLoadingFields = false;
            });
        // Auto-generate basic SOQL query with formatting
        this.query = `SELECT Id\nFROM ${apiName}`;
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
                .catch(() => {
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
                        // Build subquery as single line - formatting will be applied when user clicks Format SOQL
                        const subquery = `(SELECT ${subqueryFields} FROM ${relationshipName})`;
                        fields.push(subquery);
                    }
                }
            }
            
            // Build final query as single line - user can format it later
            if (fields.length > 0) {
                // Join fields with comma and space only (no line breaks)
                const formattedFields = fields.join(', ');
                this.query = `SELECT ${formattedFields} FROM ${this.selectedSObject}`;
            } else {
                this.query = `SELECT Id FROM ${this.selectedSObject}`;
            }
        }
    }

    toggleChildRelationship(event) {
        const relationshipName = event.currentTarget.dataset.name;
        
        this.sobjectChildRels = this.sobjectChildRels.map(rel => {
            if (rel.relationshipName === relationshipName) {
                const newExpanded = !rel.isExpanded;
                
                const updatedRel = {
                    ...rel,
                    isExpanded: newExpanded,
                    chevronIcon: newExpanded ? 
                        '/_slds/icons/utility-sprite/svg/symbols.svg#chevrondown' : 
                        '/_slds/icons/utility-sprite/svg/symbols.svg#chevronright'
                };
                
                if (newExpanded && updatedRel.childFields.length === 0) {
                    
                    getSObjectFields({ sobjectApiName: rel.childSObject })
                        .then(data => {
                            const childFields = data.fields.map(field => ({
                                ...field,
                                isSelected: this.isChildFieldSelected(rel.relationshipName, field.apiName),
                                labelClass: this.isChildFieldSelected(rel.relationshipName, field.apiName) ? 
                                    'selected-field' : ''
                            }));
                            
                            // Update the specific relationship with the loaded fields
                            this.sobjectChildRels = this.sobjectChildRels.map(r => {
                                if (r.relationshipName === relationshipName) {
                                    return { ...r, childFields: childFields };
                                }
                                return r;
                            });
                        })
                        .catch(() => {
                            this.sobjectChildRels = this.sobjectChildRels.map(r => {
                                if (r.relationshipName === relationshipName) {
                                    return { ...r, childFields: [] };
                                }
                                return r;
                            });
                        });
                }
                
                return updatedRel;
            }
            return rel;
        });
    }

    selectRelationship(event) {
        const relationshipName = event.currentTarget.dataset.name;
        // Add subquery to SOQL
        if (this.query.includes('FROM')) {
            const subquery = `(\n    SELECT Id\n    FROM ${relationshipName}\n)`;
            if (!this.query.includes(subquery)) {
                // Insert subquery before FROM clause
                const parts = this.query.split(' FROM ');
                this.query = `${parts[0]},\n       ${subquery}\nFROM ${parts[1]}`;
            }
        }
    }

    toggleChildField(event) {
        const fieldApiName = event.currentTarget.dataset.apiname;
        const relationshipName = event.currentTarget.dataset.relationship;
        
        if (!this.selectedSubqueries.has(relationshipName)) {
            this.selectedSubqueries.set(relationshipName, new Set());
        }
        
        const relationshipFields = this.selectedSubqueries.get(relationshipName);
        
        // Toggle the field selection
        if (relationshipFields.has(fieldApiName)) {
            relationshipFields.delete(fieldApiName);
        } else {
            relationshipFields.add(fieldApiName);
        }
        
        // If no fields left in this relationship, remove the relationship entirely
        if (relationshipFields.size === 0) {
            this.selectedSubqueries.delete(relationshipName);
        }
        
        // Update the field state in the UI
        this.sobjectChildRels = this.sobjectChildRels.map(rel => {
            if (rel.relationshipName === relationshipName) {
                return {
                    ...rel,
                    childFields: rel.childFields.map(field => {
                        if (field.apiName === fieldApiName) {
                            const isSelected = relationshipFields.has(fieldApiName);
                            return { 
                                ...field, 
                                isSelected: isSelected,
                                labelClass: isSelected ? 'selected-field' : ''
                            };
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

    handleLimitChange(event) {
        this.queryLimit = event.target.value;
    }

    handleRun() {
        this.executeQuery(false);
    }

    handleRunAll() {
        this.executeQuery(true);
    }

    executeQuery(useAllRows = false) {
        this.error = '';
        this.results = [];
        this.columns = [];
        this.isLoading = true;
        this.isQueryAll = useAllRows;
        this.currentPage = 1;
        this.closeChildRelationship(); // Close any open child relationship
        
        if (!this.query) {
            this.error = 'Please enter a SOQL query.';
            this.isLoading = false;
            return;
        }

        // Prepare query with limit if specified
        this.finalQuery = this.prepareQueryWithLimit(this.query);

        const queryMethod = useAllRows ? runSOQLAll : runSOQL;
        
        queryMethod({ soql: this.finalQuery })
            .then(data => {
                this.processQueryResults(data);
                
                // For regular queries, get pagination info
                if (!useAllRows && data && data.length > 0) {
                    this.setupPagination();
                } else {
                    this.showPagination = false;
                }
                
                this.isLoading = false;
            })
            .catch(err => {
                this.error = err.body && err.body.message ? err.body.message : err.message;
                this.isLoading = false;
                this.rawQueryResults = [];
                this.showPagination = false;
            });
    }

    // Setup pagination for regular queries
    setupPagination() {
        if (this.results.length >= this.pageSize) {
            runSOQLPaginated({ 
                soql: this.finalQuery, 
                pageSize: this.pageSize, 
                offset: 0 
            })
            .then(paginationData => {
                this.totalRecords = paginationData.totalCount;
                this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
                this.hasNextPage = paginationData.hasMore;
                this.hasPreviousPage = false;
                this.showPagination = this.totalRecords > this.pageSize;
            })
            .catch(err => {
                console.error('Pagination setup error:', err);
                this.showPagination = false;
            });
        } else {
            this.showPagination = false;
        }
    }

    // Navigate to specific page
    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages || pageNumber === this.currentPage) {
            return;
        }

        this.isLoading = true;
        this.currentPage = pageNumber;
        const offset = (pageNumber - 1) * this.pageSize;

        runSOQLPaginated({ 
            soql: this.finalQuery, 
            pageSize: this.pageSize, 
            offset: offset 
        })
        .then(paginationData => {
            this.processQueryResults(paginationData.records);
            this.hasNextPage = paginationData.hasMore;
            this.hasPreviousPage = pageNumber > 1;
            this.isLoading = false;
        })
        .catch(err => {
            this.error = err.body && err.body.message ? err.body.message : err.message;
            this.isLoading = false;
        });
    }

    // Pagination navigation methods
    handleFirstPage() {
        this.goToPage(1);
    }

    handlePreviousPage() {
        this.goToPage(this.currentPage - 1);
    }

    handleNextPage() {
        this.goToPage(this.currentPage + 1);
    }

    handleLastPage() {
        this.goToPage(this.totalPages);
    }

    // Process query results (common logic)
    processQueryResults(data) {
        if (data && data.length > 0) {
            this.rawQueryResults = JSON.parse(JSON.stringify(data));
            
            const { records, columns } = this.convertQueryResponse(data);
            
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
    }

    // Handle cell click for subquery expansion
    handleCellClick(event) {
        const { row, rowIndex, fieldName } = event.detail;
        
        if (this.isSubqueryColumn(fieldName)) {
            this.expandChildRelationship(rowIndex, fieldName, row);
        }
    }

    // Handle row action (for button clicks in datatable)
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        
        let rowIndex = row._originalIndex;
        
        if (rowIndex === undefined && row.Id) {
            rowIndex = this.rawQueryResults.findIndex(r => r.Id === row.Id);
        }
        
        if (rowIndex === undefined || rowIndex === -1) {
            rowIndex = this.results.findIndex(r => {
                return Object.keys(row).every(key => {
                    if (key === '_originalIndex') return true;
                    return r[key] === row[key];
                });
            });
        }
        
        if (rowIndex !== -1 && rowIndex !== undefined && rowIndex < this.rawQueryResults.length) {
            this.expandChildRelationship(rowIndex, actionName, row);
        }
    }

    // Expand child relationship data
    expandChildRelationship(rowIndex, fieldName) {
        if (rowIndex < 0 || rowIndex >= this.rawQueryResults.length) {
            return;
        }
        
        const rawRow = this.rawQueryResults[rowIndex];
        
        if (!rawRow || !rawRow[fieldName]) {
            return;
        }

        const childData = rawRow[fieldName];
        
        let childRecords = [];
        if (Array.isArray(childData)) {
            childRecords = childData;
        } else if (childData.records && Array.isArray(childData.records)) {
            childRecords = childData.records;
        } else {
            return;
        }

        if (childRecords.length === 0) {
            return;
        }

        this.childDataTableColumns = this.generateChildColumns(childRecords);
        this.childRelationshipData = childRecords;
        this.childRelationshipTitle = `${fieldName} (${childRecords.length} records)`;
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
        this._flattenColumnMap(columnMap, columns);
        
        // Filter columns to only include fields that were explicitly requested in the SELECT clause
        const requestedFields = this.parseSelectFields(this.query);
        
        const filteredColumns = columns.filter(column => {
            const isRequested = requestedFields.includes(column);
            return isRequested;
        });
        
        return filteredColumns;
    }
    
    // Helper method to prepare query with limit if specified
    prepareQueryWithLimit(query) {
        if (!this.queryLimit || this.queryLimit.trim() === '') {
            return query;
        }
        
        const limitValue = parseInt(this.queryLimit, 10);
        if (isNaN(limitValue) || limitValue <= 0) {
            return query;
        }
        
        // Check if query already has LIMIT clause (case insensitive)
        const hasLimit = /\bLIMIT\s+\d+/i.test(query);
        
        if (hasLimit) {
            // Replace existing LIMIT with new value
            return query.replace(/\bLIMIT\s+\d+/i, `LIMIT ${limitValue}`);
        }
        
        // Add LIMIT clause at the end
        return `${query.trim()} LIMIT ${limitValue}`;
    }
    
    // Parse SOQL query to extract the fields from SELECT clause
    parseSelectFields(query) {
        if (!query || typeof query !== 'string') return [];
        
        try {
            // Extract the SELECT clause (case insensitive)
            const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM(?:\s+\w+)?(?:\s+WHERE|$)/i);
            if (!selectMatch) return [];
            
            const selectClause = selectMatch[1];
            
            // Handle parentheses for subqueries - split by commas but respect parentheses
            const fields = [];
            let parenCount = 0;
            let currentField = '';
            
            for (let i = 0; i < selectClause.length; i++) {
                const char = selectClause[i];
                
                if (char === '(') {
                    parenCount++;
                    currentField += char;
                } else if (char === ')') {
                    parenCount--;
                    currentField += char;
                } else if (char === ',' && parenCount === 0) {
                    // We're at a comma outside any parentheses, this marks a field boundary
                    const fieldName = this.extractFieldNameFromSelect(currentField.trim());
                    if (fieldName) fields.push(fieldName);
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            
            // Don't forget the last field
            if (currentField.trim()) {
                const fieldName = this.extractFieldNameFromSelect(currentField.trim());
                if (fieldName) fields.push(fieldName);
            }
            
            return fields;
        } catch (error) {
            console.error('Error parsing SELECT fields:', error);
            return [];
        }
    }
    
    // Extract field name from a SELECT field item (handles subqueries and regular fields)
    extractFieldNameFromSelect(fieldText) {
        if (!fieldText) return null;
        
        // Check if this is a subquery (starts with parentheses)
        if (fieldText.trim().startsWith('(')) {
            // Extract the FROM clause from the subquery to get the relationship name
            const fromMatch = fieldText.match(/FROM\s+(\w+)/i);
            if (fromMatch) {
                return fromMatch[1]; // Return the relationship name
            }
            return null;
        }
        
        // Regular field - clean up and take only the field name (ignore aliases)
        const cleaned = fieldText.trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .split(' ')[0]; // Take only the field name (ignore aliases)
        
        return cleaned;
    }
    
    _collectColumnMap(record, columnMap, relationships = []) {
        if (!record || typeof record !== 'object') return;
        
        Object.keys(record).forEach(name => {
            if (name !== 'attributes') {
                const data = record[name];
                
                // Check if this key is already a flattened relationship field (contains dots)
                if (name.includes('.')) {
                    // This is a pre-flattened field from Apex, add it directly
                    if (!columnMap.has(name)) {
                        columnMap.set(name, null); // Use null to indicate this is a terminal field
                    }
                }
                // Check if this is a subquery result (array or object with totalSize)
                else if ((Array.isArray(data)) || (data && typeof data === 'object' && data.totalSize !== undefined)) {
                    // This is a subquery - add the relationship name as a column
                    const fullPath = [...relationships, name].join('.');
                    if (!columnMap.has(fullPath)) {
                        columnMap.set(fullPath, null); // Use null to indicate this is a terminal field
                    }
                }
                // Only recurse if it's a nested object (not array, not subquery result, not null, not flattened)
                else if (data && typeof data === 'object' && !data.totalSize && !Array.isArray(data) && data !== null) {
                    // Check if we already have a flattened version of this relationship
                    const hasFlattened = Object.keys(record).some(key => key.startsWith(name + '.'));
                    
                    if (!hasFlattened) {
                        // This is a relationship object without flattened equivalent, recurse into it
                        this._collectColumnMap(data, columnMap, [...relationships, name]);
                    }
                    // If we have flattened versions, skip the nested recursion to avoid duplicates
                } else {
                    // This is a leaf field (actual data value), create the full path
                    const fullPath = [...relationships, name].join('.');
                    if (!columnMap.has(fullPath)) {
                        columnMap.set(fullPath, null); // Use null to indicate this is a terminal field
                    }
                }
            }
        });
    }
    
    _flattenColumnMap(columnMap, columns) {
        if (!columnMap || typeof columnMap !== 'object' || !columnMap.size) return;
        
        // Since we're now storing full paths directly in the columnMap,
        // we can just extract the keys
        for (let [columnPath, data] of columnMap) {
            if (data === null && !columns.includes(columnPath)) {
                columns.push(columnPath);
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
        } catch {
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
            
            if (value && Array.isArray(value)) {
                flattened[newKey] = `${value.length} rows`;
            }
            else if (value && typeof value === 'object' && value.totalSize !== undefined) {
                flattened[newKey] = `${value.totalSize} rows`;
            }
            else if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenRecordSimple(value, newKey));
            }
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
            
        } catch {
            return [];
        }
    }

    handleFormatSOQL() {
        if (!this.query) {
            this.showToast('Info', 'No query to format', 'info');
            return;
        }
        
        try {
            // Format using simple but effective formatter
            const formatted = this.formatSOQLSimple(this.query);
            this.query = formatted;
            this.showToast('Success', 'SOQL formatted successfully', 'success');
        } catch (error) {
            this.showToast('Error', 'Failed to format SOQL: ' + error.message, 'error');
        }
    }

    // Simple but effective SOQL formatter
    formatSOQLSimple(query) {
        let formatted = query.replace(/\s+/g, ' ').trim();
        
        if (!formatted.toUpperCase().includes('SELECT') || !formatted.toUpperCase().includes('FROM')) {
            throw new Error('Query must contain SELECT and FROM');
        }
        
        const fromIndex = formatted.lastIndexOf(' FROM ');
        
        if (fromIndex !== -1) {
            const selectPart = formatted.substring(0, fromIndex);
            const fromPart = formatted.substring(fromIndex + 6);
            
            const selectMatch = selectPart.match(/SELECT\s+(.+)$/i);
            if (selectMatch) {
                const [, fieldsStr] = selectMatch;
                const fromClause = fromPart;
                
                const fields = this.splitFields(fieldsStr.trim());
                
                const regularFields = [];
                const subqueryFields = [];
                
                fields.forEach(field => {
                    field = field.trim();
                    if (field.includes('(') && field.toUpperCase().includes('SELECT')) {
                        subqueryFields.push(field);
                    } else {
                        regularFields.push(field);
                    }
                });
                
                let formattedRegularFields = '';
                if (regularFields.length > 0) {
                    const fieldsLine = regularFields.join(', ');
                    if (fieldsLine.length > 80) {
                        formattedRegularFields = this.wrapFieldsIntelligently(regularFields);
                    } else {
                        formattedRegularFields = fieldsLine;
                    }
                }
                
                const formattedSubqueries = subqueryFields.map(field => {
                    return this.formatSubquery(field, false);
                });
                
                const allFormattedFields = [];
                if (formattedRegularFields) {
                    allFormattedFields.push(formattedRegularFields);
                }
                allFormattedFields.push(...formattedSubqueries);
                
                formatted = 'SELECT ' + allFormattedFields.join(',\n') + '\nFROM ' + fromClause.trim();
            } else {
                throw new Error('Could not parse SELECT statement');
            }
        } else {
            throw new Error('Could not find FROM clause');
        }
        
        formatted = formatted.replace(/\s+WHERE\s+/gi, '\nWHERE ');
        formatted = formatted.replace(/\s+AND\s+/gi, '\n    AND ');
        formatted = formatted.replace(/\s+OR\s+/gi, '\n    OR ');
        formatted = formatted.replace(/\s+ORDER\s+BY\s+/gi, '\nORDER BY ');
        formatted = formatted.replace(/\s+GROUP\s+BY\s+/gi, '\nGROUP BY ');
        formatted = formatted.replace(/\s+HAVING\s+/gi, '\nHAVING ');
        formatted = formatted.replace(/\s+LIMIT\s+/gi, '\nLIMIT ');
        formatted = formatted.replace(/\s+OFFSET\s+/gi, '\nOFFSET ');
        
        return formatted.trim();
    }

    // Split fields respecting parentheses
    splitFields(fieldsStr) {
        const fields = [];
        let current = '';
        let parenCount = 0;
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < fieldsStr.length; i++) {
            const char = fieldsStr[i];
            
            if (!inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
                current += char;
            } else if (inString && char === stringChar) {
                inString = false;
                current += char;
            } else if (inString) {
                current += char;
            } else if (char === '(') {
                parenCount++;
                current += char;
            } else if (char === ')') {
                parenCount--;
                current += char;
            } else if (char === ',' && parenCount === 0) {
                if (current.trim()) {
                    fields.push(current.trim());
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current.trim()) {
            fields.push(current.trim());
        }
        
        return fields;
    }

    // Intelligently wrap fields when line gets too long
    wrapFieldsIntelligently(fields) {
        const maxLineLength = 80;
        let currentLine = '';
        const lines = [];
        
        fields.forEach((field, index) => {
            const fieldWithComma = (index === 0) ? field : ', ' + field;
            
            // Check if adding this field would exceed line length
            if (currentLine.length + fieldWithComma.length > maxLineLength && currentLine.length > 0) {
                // Save current line and start new one with proper indentation
                lines.push(currentLine);
                currentLine = '\t' + field; // Start new line with tab and field (no comma at start)
            } else {
                currentLine += fieldWithComma;
            }
        });
        
        // Add the last line
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.join(',\n');
    }

    // Wrap subquery fields with proper indentation
    wrapSubqueryFields(fields) {
        const maxLineLength = 60; // Shorter for subqueries due to extra indentation
        let currentLine = '';
        const lines = [];
        
        fields.forEach((field, index) => {
            const fieldWithComma = (index === 0) ? field : ', ' + field;
            
            // Check if adding this field would exceed line length
            if (currentLine.length + fieldWithComma.length > maxLineLength && currentLine.length > 0) {
                // Save current line and start new one with proper indentation for subqueries
                lines.push(currentLine);
                currentLine = '\t\t\t' + field; // Extra indentation for subquery fields
            } else {
                currentLine += fieldWithComma;
            }
        });
        
        // Add the last line
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.join(',\n');
    }

    // Format subquery with proper indentation
    formatSubquery(field, isFirstField) {
        const baseIndent = isFirstField ? '' : '\t';
        
        // Find the opening parenthesis
        const parenIndex = field.indexOf('(');
        if (parenIndex === -1) return field;
        
        const afterParen = field.substring(parenIndex + 1);
        
        // Find matching closing parenthesis
        let parenCount = 1;
        let subqueryEnd = -1;
        
        for (let i = 0; i < afterParen.length; i++) {
            if (afterParen[i] === '(') parenCount++;
            if (afterParen[i] === ')') {
                parenCount--;
                if (parenCount === 0) {
                    subqueryEnd = i;
                    break;
                }
            }
        }
        
        if (subqueryEnd === -1) return field;
        
        const subquery = afterParen.substring(0, subqueryEnd).trim();
        const suffix = afterParen.substring(subqueryEnd + 1).trim();
        
        // Parse the subquery to format it properly
        const subqueryMatch = subquery.match(/SELECT\s+([^FROM]+?)\s+FROM\s+(.+)$/i);
        if (subqueryMatch) {
            const [, subFields, subFrom] = subqueryMatch;
            const fieldList = this.splitFields(subFields.trim());
            
            // Format subquery fields like main fields - on same line, wrap if too long
            let formattedSubFields = '';
            const subFieldsLine = fieldList.join(', ');
            if (subFieldsLine.length > 60) { // Shorter limit for subqueries due to indentation
                formattedSubFields = this.wrapSubqueryFields(fieldList);
            } else {
                formattedSubFields = subFieldsLine;
            }
            
            // Create formatted subquery with proper structure
            const formattedSubquery = `SELECT ${formattedSubFields}\n\t\tFROM ${subFrom.trim()}`;
            
            return baseIndent + '(\n\t\t' + formattedSubquery + '\n\t)' + (suffix ? ' ' + suffix : '');
        }
        
        // Fallback if regex doesn't match
        return baseIndent + field;
    }

    handleClear() {
        // Clear query and reset state
        this.query = '';
        this.queryLimit = '';
        this.finalQuery = '';
        this.results = [];
        this.columns = [];
        this.error = '';
        this.selectedFields.clear();
        this.selectedSubqueries.clear();
        this.childRelationshipResults = new Map();
        this.expandedChildRelationships = new Set();
        
        // Reset pagination
        this.currentPage = 1;
        this.totalRecords = 0;
        this.totalPages = 0;
        this.hasNextPage = false;
        this.hasPreviousPage = false;
        this.showPagination = false;
        this.isQueryAll = false;
        
        // Reset export state
        this.isExporting = false;
        this.exportProgress = 0;
        this.exportTotal = 0;
        
        // Reset left pane to original state
        this.selectedSObject = null;
        this.sobjectSearch = '';
        this.fieldSearch = '';
        this.showFieldsTab = true;
        this.showChildRelTab = false;
        
        // Reset UI
        this.showResults = false;
        this.showChildResults = false;
        this.currentChildRelData = null;
        this.currentChildRelTitle = '';
        
        this.showToast('Success', 'Query and selection cleared successfully', 'success');
    }

    // Dynamic height adjustment from Medium article
    handleTextareaInput(event) {
        const textarea = event.target;
        if (textarea) {
            // Reset height to auto to get the scroll height
            textarea.style.height = 'auto';
            // Set height based on content, with min/max constraints
            const newHeight = Math.max(225, Math.min(400, textarea.scrollHeight));
            textarea.style.height = newHeight + 'px';
        }
    }

    handleExportCSV() {
        if (!this.results.length) {
            this.showToast('Warning', 'No data to export', 'warning');
            return;
        }

        if (!this.sheetJSInitialized) {
            this.showToast('Error', 'Export library not loaded. Please refresh and try again.', 'error');
            return;
        }

        // Check if this is a large dataset that needs batch export
        if (this.isQueryAll && this.results.length >= 2000) {
            this.exportLargeDataset('csv');
        } else {
            this.exportCurrentData('csv');
        }
    }

    handleExportExcel() {
        if (!this.results.length) {
            this.showToast('Warning', 'No data to export', 'warning');
            return;
        }

        if (!this.sheetJSInitialized) {
            this.showToast('Error', 'Export library not loaded. Please refresh and try again.', 'error');
            return;
        }

        // Check if this is a large dataset that needs batch export
        if (this.isQueryAll && this.results.length >= 2000) {
            this.exportLargeDataset('excel');
        } else {
            this.exportCurrentData('excel');
        }
    }

    // Export current visible data (for regular queries or small datasets)
    exportCurrentData(format) {
        try {
            if (format === 'csv') {
                this.exportSingleCSV();
            } else {
                this.exportCurrentExcel();
            }
        } catch (error) {
            this.showToast('Error', 'Failed to export data: ' + error.message, 'error');
        }
    }

    // Export current Excel data (existing method renamed for clarity)
    exportCurrentExcel() {
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // 1. First, prepare child relationship sheets to know which ones exist
        const childSheets = this.prepareChildRelationshipSheets();
        
        // 2. Main Results Sheet with hyperlinks
        const mainExportData = this.prepareMainExportDataWithLinks(childSheets);
        const mainWS = XLSX.utils.json_to_sheet(mainExportData);
        
        // Enhanced formatting for main sheet
        const mainColumnWidths = mainExportData.length > 0 ? 
            Object.keys(mainExportData[0]).map(key => {
                const maxLength = Math.max(
                    key.length,
                    ...mainExportData.slice(0, 100).map(row => 
                        String(row[key] || '').length
                    )
                );
                return { wch: Math.min(Math.max(maxLength, 12), 50) };
            }) : [];
        mainWS['!cols'] = mainColumnWidths;
        
        // Add header styling and hyperlinks for main sheet
        this.applyHeaderStyling(mainWS);
        this.addHyperlinksToMainSheet(mainWS, mainExportData, childSheets);
        
        // Add main sheet to workbook
        XLSX.utils.book_append_sheet(wb, mainWS, 'Main Results');
        
        // 3. Child Relationship Sheets
        childSheets.forEach(({ sheetName, data }) => {
            if (data && data.length > 0) {
                const childWS = XLSX.utils.json_to_sheet(data);
                
                // Auto-size columns for child sheets
                const childColumnWidths = Object.keys(data[0]).map(key => {
                    const maxLength = Math.max(
                        key.length,
                        ...data.slice(0, 100).map(row => 
                            String(row[key] || '').length
                        )
                    );
                    return { wch: Math.min(Math.max(maxLength, 12), 50) };
                });
                childWS['!cols'] = childColumnWidths;
                
                // Apply styling
                this.applyHeaderStyling(childWS);
                
                // Add visual separators between different parent records
                this.addParentGroupSeparators(childWS, data);
                
                // Add back-to-main link in child sheet
                this.addBackToMainLink(childWS);
                
                // Add child sheet with truncated name (Excel sheet name limit is 31 chars)
                const truncatedSheetName = sheetName.length > 31 ? 
                    sheetName.substring(0, 28) + '...' : sheetName;
                XLSX.utils.book_append_sheet(wb, childWS, truncatedSheetName);
            }
        });
        
        // 4. Navigation Guide Sheet
        this.addNavigationGuideSheet(wb, childSheets);
        
        // 5. Metadata Sheet
        const metaData = [
            { Property: 'Export Date', Value: new Date().toLocaleString() },
            { Property: 'SOQL Query', Value: this.query },
            { Property: 'Total Main Records', Value: this.results.length },
            { Property: 'Selected Object', Value: this.selectedSObject || 'N/A' },
            { Property: 'Child Relationships Found', Value: childSheets.length },
            { Property: 'Sheets Created', Value: wb.SheetNames.length },
            { Property: 'Navigation', Value: 'Click on child relationship counts in Main Results to jump to child data sheets' }
        ];
        const metaWS = XLSX.utils.json_to_sheet(metaData);
        XLSX.utils.book_append_sheet(wb, metaWS, 'Export Info');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `soql_export_${timestamp}.xlsx`;
        
        // Export Excel file
        XLSX.writeFile(wb, filename);
        
        const totalRecords = childSheets.reduce((sum, sheet) => sum + (sheet.data?.length || 0), this.results.length);
        this.showToast('Success', 
            `Data exported successfully as ${filename}. ${wb.SheetNames.length} sheets created with ${totalRecords} total records. Click on child relationship counts to navigate between sheets.`, 
            'success');
    }

    // Export large datasets using batch processing
    exportLargeDataset(format) {
        this.isExporting = true;
        this.exportProgress = 0;
        this.exportTotal = 0;

        this.showToast('Info', 'Starting large dataset export. This may take a few moments...', 'info');

        // Get first batch to determine total count
        runSOQLForExport({ soql: this.finalQuery, batchNumber: 0 })
            .then(firstBatch => {
                this.exportTotal = firstBatch.totalCount;
                return this.processBatchExport(firstBatch, 0, [], format);
            })
            .then(allData => {
                // Export all collected data
                if (format === 'csv') {
                    this.exportLargeCSV(allData);
                } else {
                    this.exportLargeExcel(allData);
                }

                this.isExporting = false;
                this.exportProgress = 0;
                this.exportTotal = 0;
            })
            .catch(error => {
                this.isExporting = false;
                this.exportProgress = 0;
                this.exportTotal = 0;
                this.showToast('Error', 'Failed to export large dataset: ' + error.message, 'error');
            });
    }

    // Process batches recursively to avoid async/await in loops
    processBatchExport(batchData, batchNumber, allData, format) {
        // Convert batch data to export format
        const convertedBatch = this.convertExportData(batchData.records);
        const updatedData = allData.concat(convertedBatch);

        // Update progress
        this.exportProgress = updatedData.length;
        
        if (batchData.hasMore) {
            // Process next batch
            return runSOQLForExport({ soql: this.finalQuery, batchNumber: batchNumber + 1 })
                .then(nextBatch => {
                    return this.processBatchExport(nextBatch, batchNumber + 1, updatedData, format);
                });
        }
        
        // Return final data
        return Promise.resolve(updatedData);
    }

    // Convert raw data to export format
    convertExportData(rawData) {
        // For large datasets, use the same conversion logic as the UI
        // to ensure we get all columns including flattened relationship fields
        const { records: convertedRecords } = this.convertQueryResponse(rawData);
        return convertedRecords;
    }

    // Export large CSV dataset
    exportLargeCSV(allData) {
        // allData is already processed through convertExportData during batch collection
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(allData);
        
        XLSX.utils.book_append_sheet(wb, ws, 'SOQL Results');
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `soql_large_export_${timestamp}.csv`;
        
        XLSX.writeFile(wb, filename);
        
        this.showToast('Success', 
            `Large dataset exported successfully as ${filename}. ${allData.length} records exported.`, 
            'success');
    }

    // Export large Excel dataset with enhanced features
    exportLargeExcel(allData) {
        const wb = XLSX.utils.book_new();
        
        // allData is already processed through convertExportData during batch collection
        const processedData = allData;
        
        // Split large datasets into multiple sheets if needed (Excel has row limits)
        const maxRowsPerSheet = 1000000; // Conservative limit
        const totalSheets = Math.ceil(processedData.length / maxRowsPerSheet);

        if (totalSheets === 1) {
            // Single sheet export
            const ws = XLSX.utils.json_to_sheet(processedData);
            this.applyHeaderStyling(ws);
            this.autoSizeColumns(ws, processedData);
            XLSX.utils.book_append_sheet(wb, ws, 'SOQL Results');
        } else {
            // Multi-sheet export for very large datasets
            for (let sheetIndex = 0; sheetIndex < totalSheets; sheetIndex++) {
                const startIndex = sheetIndex * maxRowsPerSheet;
                const endIndex = Math.min(startIndex + maxRowsPerSheet, processedData.length);
                const sheetData = processedData.slice(startIndex, endIndex);
                
                const ws = XLSX.utils.json_to_sheet(sheetData);
                this.applyHeaderStyling(ws);
                this.autoSizeColumns(ws, sheetData);
                
                const sheetName = `Results ${sheetIndex + 1}`;
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }
        }

        // Add metadata sheet
        this.addLargeExportMetadata(wb, processedData.length, totalSheets);
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `soql_large_export_${timestamp}.xlsx`;
        
        XLSX.writeFile(wb, filename);
        
        this.showToast('Success', 
            `Large dataset exported successfully as ${filename}. ${processedData.length} records across ${totalSheets} sheet(s).`, 
            'success');
    }

    // Add metadata for large exports
    addLargeExportMetadata(workbook, totalRecords, totalSheets) {
        const metaData = [
            { Property: 'Export Date', Value: new Date().toLocaleString() },
            { Property: 'Export Type', Value: 'Large Dataset Export' },
            { Property: 'SOQL Query', Value: this.query },
            { Property: 'Total Records Exported', Value: totalRecords },
            { Property: 'Selected Object', Value: this.selectedSObject || 'N/A' },
            { Property: 'Sheets Created', Value: totalSheets },
            { Property: 'Export Method', Value: 'Batch Processing with Apex Cursors' },
            { Property: 'Performance Note', Value: 'Data exported using optimized batch processing for large datasets' }
        ];
        
        const metaWS = XLSX.utils.json_to_sheet(metaData);
        this.applyHeaderStyling(metaWS);
        XLSX.utils.book_append_sheet(workbook, metaWS, 'Export Info');
    }

    // Auto-size columns based on content
    autoSizeColumns(worksheet, data) {
        if (!data || data.length === 0) return;
        
        const columnWidths = Object.keys(data[0]).map(key => {
            const maxLength = Math.max(
                key.length,
                ...data.slice(0, 100).map(row => 
                    String(row[key] || '').length
                )
            );
            return { wch: Math.min(Math.max(maxLength, 12), 50) };
        });
        worksheet['!cols'] = columnWidths;
    }

    // Computed properties for pagination UI
    get paginationInfo() {
        if (!this.showPagination) return '';
        
        const startRecord = (this.currentPage - 1) * this.pageSize + 1;
        const endRecord = Math.min(this.currentPage * this.pageSize, this.totalRecords);
        
        return `Showing ${startRecord}-${endRecord} of ${this.totalRecords} records`;
    }

    get exportButtonLabel() {
        if (this.isQueryAll && this.results.length >= 2000) {
            return `Export All ${this.results.length}+ Records`;
        }
        return `Export ${this.results.length} Records`;
    }

    get exportProgressInfo() {
        if (!this.isExporting) return '';
        
        const percentage = this.exportTotal > 0 ? Math.round((this.exportProgress / this.exportTotal) * 100) : 0;
        return `Exporting... ${this.exportProgress} of ${this.exportTotal} records (${percentage}%)`;
    }

    // Check if there are child relationships in the data
    checkForChildRelationships() {
        if (!this.rawQueryResults || this.rawQueryResults.length === 0) {
            return false;
        }
        
        return this.rawQueryResults.some(record => {
            return Object.keys(record).some(fieldName => {
                const value = record[fieldName];
                return value && (Array.isArray(value) || (typeof value === 'object' && value.totalSize !== undefined));
            });
        });
    }

    // Export single CSV file (when no child relationships)
    exportSingleCSV() {
        const exportData = this.prepareMainExportData();
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'SOQL Results');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `soql_export_${timestamp}.csv`;
        
        // Export as CSV
        XLSX.writeFile(wb, filename);
        
        this.showToast('Success', `Data exported successfully as ${filename}`, 'success');
    }

    // Export multiple CSV files when child relationships exist
    exportMultipleCSVFiles() {
        // For now, just export the main CSV and show a message about Excel for full data
        this.exportSingleCSV();
        
        this.showToast('Info', 
            'Child relationship data detected. For complete data export with child relationships in separate sheets, use Excel export.', 
            'info');
    }

    // Prepare main export data with enhanced formatting for hyperlinks
    prepareMainExportDataWithLinks(childSheets) {
        const availableChildSheets = new Set(childSheets.map(sheet => sheet.sheetName));
        
        return this.results.map((row, rowIndex) => {
            const exportRow = {};
            
            this.columns.forEach(col => {
                const fieldName = col.fieldName;
                let value = row[fieldName];
                
                // Handle null/undefined values
                if (value === null || value === undefined) {
                    value = '';
                }
                // For subquery columns, enhance with navigation hint
                else if (typeof value === 'string' && value.match(/^\d+ rows?$/)) {
                    // Check if this field has a corresponding child sheet
                    if (availableChildSheets.has(fieldName)) {
                        value = `${value} (Click to view details)`; // Add hint for user
                    }
                }
                // Handle complex objects by converting to string
                else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                // Handle boolean values
                else if (typeof value === 'boolean') {
                    value = value.toString();
                }
                // Convert numbers to string to preserve formatting
                else if (typeof value === 'number') {
                    value = value.toString();
                }
                
                // Use column label as the export column name
                const exportColumnName = col.label || fieldName;
                exportRow[exportColumnName] = value;
            });
            
            // Add row identifier for linking
            exportRow._rowIndex = rowIndex;
            exportRow._fieldMapping = {}; // Store original field names for linking
            this.columns.forEach(col => {
                exportRow._fieldMapping[col.label || col.fieldName] = col.fieldName;
            });
            
            return exportRow;
        });
    }

    // Add hyperlinks to cells in the main sheet that link to child relationship sheets
    addHyperlinksToMainSheet(worksheet, exportData, childSheets) {
        if (!worksheet['!ref'] || exportData.length === 0) return;
        
        const availableChildSheets = new Map();
        childSheets.forEach(sheet => {
            const truncatedName = sheet.sheetName.length > 31 ? 
                sheet.sheetName.substring(0, 28) + '...' : sheet.sheetName;
            availableChildSheets.set(sheet.sheetName, truncatedName);
        });
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const headers = Object.keys(exportData[0]).filter(key => !key.startsWith('_'));
        
        // Go through each data row (skip header row)
        for (let row = 1; row <= range.e.r; row++) {
            const dataRowIndex = row - 1;
            if (dataRowIndex >= exportData.length) break;
            
            const rowData = exportData[dataRowIndex];
            
            // Check each column for child relationship data
            headers.forEach((header, colIndex) => {
                const cellValue = rowData[header];
                const originalFieldName = rowData._fieldMapping ? rowData._fieldMapping[header] : header;
                
                // If this is a child relationship column with data
                if (typeof cellValue === 'string' && 
                    cellValue.includes('rows') && 
                    cellValue.includes('Click to view') &&
                    availableChildSheets.has(originalFieldName)) {
                    
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
                    const targetSheet = availableChildSheets.get(originalFieldName);
                    const parentRowNum = row + 1; // Excel row number including header
                    
                    // Find the starting row for this parent's data in the child sheet
                    const childSheet = childSheets.find(sheet => sheet.sheetName === originalFieldName);
                    const targetRow = this.findChildSheetStartRow(childSheet, parentRowNum);
                    
                    // Create hyperlink to specific row in child sheet
                    worksheet[cellAddress] = {
                        t: 's', // string type
                        v: cellValue.replace(' (Click to view details)', ''), // Clean display value
                        l: {
                            Target: `#'${targetSheet}'!A${targetRow}`, // Link to specific row in child sheet
                            Tooltip: `Click to jump to ${originalFieldName} data for row ${parentRowNum} (starts at row ${targetRow})`
                        },
                        s: {
                            font: { color: { rgb: "0000FF" }, underline: true }, // Blue and underlined
                            fill: { fgColor: { rgb: "F0F8FF" } } // Light blue background
                        }
                    };
                }
            });
        }
    }

    // Find the starting row for a specific parent's data in a child sheet
    findChildSheetStartRow(childSheet, parentRowNumber) {
        if (!childSheet || !childSheet.data || childSheet.data.length === 0) {
            return 1; // Default to top if no data
        }
        
        // Find the first occurrence of this parent row number in the child data
        const firstMatchIndex = childSheet.data.findIndex(childRecord => 
            childRecord.Parent_Row_Number === parentRowNumber
        );
        
        if (firstMatchIndex === -1) {
            return 1; // Default to top if parent not found
        }
        
        // Add 2 to convert from 0-based array index to Excel row (1-based + header row)
        return firstMatchIndex + 2;
    }

    // Add a back-to-main navigation link in child sheets
    addBackToMainLink(worksheet) {
        if (!worksheet['!ref']) return;
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Add navigation instructions in a cell below the data
        const navRow = range.e.r + 3; // Leave some space
        const navCell = XLSX.utils.encode_cell({ r: navRow, c: 0 });
        
        worksheet[navCell] = {
            t: 's',
            v: '← Back to Main Results',
            l: {
                Target: "#'Main Results'!A1",
                Tooltip: 'Click to return to main results sheet'
            },
            s: {
                font: { color: { rgb: "0000FF" }, underline: true, bold: true },
                fill: { fgColor: { rgb: "E8F5E8" } }
            }
        };
        
        // Update the sheet range to include the navigation cell
        const newRange = XLSX.utils.encode_range({
            s: range.s,
            e: { r: navRow, c: Math.max(range.e.c, 0) }
        });
        worksheet['!ref'] = newRange;
    }

    // Add a navigation guide sheet
    addNavigationGuideSheet(workbook, childSheets) {
        const guideData = [
            { Section: 'NAVIGATION GUIDE', Description: 'How to use this workbook effectively' },
            { Section: '', Description: '' },
            { Section: 'Main Results Sheet', Description: 'Contains your primary SOQL query results' },
            { Section: '• Child Relationship Cells', Description: 'Blue underlined cells (e.g., "3 rows") are clickable' },
            { Section: '• Click Links', Description: 'Click on these cells to jump to detailed child data' },
            { Section: '', Description: '' },
            { Section: 'Child Relationship Sheets', Description: 'Separate sheets for each child relationship' },
            { Section: '• Parent Context', Description: 'Each row shows which parent record it belongs to' },
            { Section: '• Back Navigation', Description: 'Click "← Back to Main Results" to return' },
            { Section: '', Description: '' },
            { Section: 'Available Child Sheets:', Description: '' }
        ];
        
        // Add information about each child sheet
        childSheets.forEach((sheet, index) => {
            const truncatedName = sheet.sheetName.length > 31 ? 
                sheet.sheetName.substring(0, 28) + '...' : sheet.sheetName;
            guideData.push({
                Section: `${index + 1}. ${truncatedName}`,
                Description: `${sheet.data?.length || 0} child records`
            });
        });
        
        if (childSheets.length === 0) {
            guideData.push({
                Section: 'No child relationships found',
                Description: 'This export contains only main object data'
            });
        }
        
        const guideWS = XLSX.utils.json_to_sheet(guideData);
        
        // Format the guide sheet
        const guideRange = XLSX.utils.decode_range(guideWS['!ref']);
        guideWS['!cols'] = [{ wch: 25 }, { wch: 50 }];
        
        // Add styling to the guide sheet
        for (let row = 0; row <= guideRange.e.r; row++) {
            const sectionCell = guideWS[XLSX.utils.encode_cell({ r: row, c: 0 })];
            if (sectionCell && sectionCell.v && sectionCell.v.includes('GUIDE')) {
                sectionCell.s = {
                    font: { color: { rgb: "FFFFFF" }, bold: true, size: 14 },
                    fill: { fgColor: { rgb: "4472C4" } }
                };
            }
        }
        
        XLSX.utils.book_append_sheet(workbook, guideWS, 'Navigation Guide');
    }

    // Prepare main export data (excluding child relationship raw data)
    prepareMainExportData() {
        return this.results.map(row => {
            const exportRow = {};
            
            this.columns.forEach(col => {
                const fieldName = col.fieldName;
                let value = row[fieldName];
                
                // Handle null/undefined values
                if (value === null || value === undefined) {
                    value = '';
                }
                // For subquery columns, keep the summary (e.g., "3 rows")
                else if (typeof value === 'string' && value.match(/^\d+ rows?$/)) {
                    // Keep as is - this is a subquery summary
                }
                // Handle complex objects by converting to string
                else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                // Handle boolean values
                else if (typeof value === 'boolean') {
                    value = value.toString();
                }
                // Convert numbers to string to preserve formatting
                else if (typeof value === 'number') {
                    value = value.toString();
                }
                
                // Use column label as the export column name
                const exportColumnName = col.label || fieldName;
                exportRow[exportColumnName] = value;
            });
            
            return exportRow;
        });
    }

    // Prepare child relationship sheets from raw query results
    prepareChildRelationshipSheets() {
        const childSheets = [];
        
        if (!this.rawQueryResults || this.rawQueryResults.length === 0) {
            return childSheets;
        }
        
        // Find all child relationship fields by examining the raw data
        const childRelationshipFields = new Set();
        
        this.rawQueryResults.forEach(record => {
            Object.keys(record).forEach(fieldName => {
                const value = record[fieldName];
                // Check if this is child relationship data
                if (value && (Array.isArray(value) || (typeof value === 'object' && value.totalSize !== undefined))) {
                    childRelationshipFields.add(fieldName);
                }
            });
        });
        
        childRelationshipFields.forEach(relationshipName => {
            const childData = [];
            
            this.rawQueryResults.forEach((parentRecord, parentIndex) => {
                const childRecords = parentRecord[relationshipName];
                let records = [];
                
                // Handle both array and object with records property
                if (Array.isArray(childRecords)) {
                    records = childRecords;
                } else if (childRecords && childRecords.records && Array.isArray(childRecords.records)) {
                    records = childRecords.records;
                }
                
                // Add each child record with parent context
                records.forEach(childRecord => {
                    const exportChildRecord = {
                        'Parent_Row_Number': parentIndex + 2, // +2 because: +1 for header row, +1 for 0-based to 1-based conversion
                        'Parent_Id': parentRecord.Id || 'N/A',
                        'Parent_Name': parentRecord.Name || parentRecord.Subject || parentRecord.Title || 'N/A'
                    };
                    
                    // Add all child record fields
                    Object.keys(childRecord).forEach(childFieldName => {
                        if (childFieldName !== 'attributes') {
                            let value = childRecord[childFieldName];
                            
                            // Clean up the value
                            if (value === null || value === undefined) {
                                value = '';
                            } else if (typeof value === 'object') {
                                value = JSON.stringify(value);
                            } else if (typeof value === 'boolean') {
                                value = value.toString();
                            }
                            
                            exportChildRecord[childFieldName] = value;
                        }
                    });
                    
                    childData.push(exportChildRecord);
                });
            });
            
            if (childData.length > 0) {
                // Sort child data by Parent_Row_Number to ensure proper grouping and navigation
                childData.sort((a, b) => {
                    const parentRowA = parseInt(a.Parent_Row_Number, 10) || 0;
                    const parentRowB = parseInt(b.Parent_Row_Number, 10) || 0;
                    if (parentRowA !== parentRowB) {
                        return parentRowA - parentRowB;
                    }
                    // Secondary sort by child record Id for consistency
                    const idA = a.Id || '';
                    const idB = b.Id || '';
                    return idA.localeCompare(idB);
                });
                
                childSheets.push({
                    sheetName: relationshipName,
                    data: childData
                });
            }
        });
        
        return childSheets;
    }

    // Add visual separators between different parent records in child sheets
    addParentGroupSeparators(worksheet, data) {
        if (!worksheet['!ref'] || data.length === 0) return;
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        let currentParentRow = null;
        
        // Go through each data row and add styling to separate parent groups
        for (let row = 1; row <= range.e.r; row++) { // Start from 1 to skip header
            const dataIndex = row - 1;
            if (dataIndex >= data.length) break;
            
            const rowData = data[dataIndex];
            const parentRowNumber = rowData.Parent_Row_Number;
            
            // If this is a new parent record group, add a top border
            if (currentParentRow !== null && currentParentRow !== parentRowNumber) {
                // Add thick top border to indicate new parent group
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    const cell = worksheet[cellAddress];
                    if (cell) {
                        if (!cell.s) cell.s = {};
                        if (!cell.s.border) cell.s.border = {};
                        cell.s.border.top = { style: 'thick', color: { rgb: '4472C4' } };
                    }
                }
            }
            
            // Highlight Parent_Row_Number column for easier identification
            const parentRowCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]; // Assuming first column
            if (parentRowCell && currentParentRow !== parentRowNumber) {
                if (!parentRowCell.s) parentRowCell.s = {};
                parentRowCell.s.fill = { fgColor: { rgb: "E8F5E8" } }; // Light green background
                parentRowCell.s.font = { bold: true };
            }
            
            currentParentRow = parentRowNumber;
        }
    }

    // Apply header styling to a worksheet
    applyHeaderStyling(worksheet) {
        if (!worksheet['!ref']) return;
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let col = range.s.c; col <= range.e.c; col++) {
            const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
            if (headerCell) {
                headerCell.s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "E3F2FD" } }
                };
            }
        }
    }

    // Helper method to show toast messages
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}
