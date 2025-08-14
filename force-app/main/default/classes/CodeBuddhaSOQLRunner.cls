public with sharing class CodeBuddhaSOQLRunner {
    // Constants for pagination and limits
    private static final Integer DEFAULT_PAGE_SIZE = 2000;
    private static final Integer MAX_PAGE_SIZE = 10000;
    private static final Integer EXPORT_BATCH_SIZE = 5000;
    
    @AuraEnabled(cacheable=false)
    public static List<Map<String, Object>> runSOQL(String soql) {
        return runSOQLWithOptions(soql, false, DEFAULT_PAGE_SIZE, 0);
    }
    
    @AuraEnabled(cacheable=false)
    public static List<Map<String, Object>> runSOQLAll(String soql) {
        return runSOQLWithOptions(soql, true, MAX_PAGE_SIZE, 0);
    }
    
    @AuraEnabled(cacheable=false)
    public static Map<String, Object> runSOQLPaginated(String soql, Integer pageSize, Integer offset) {
        List<Map<String, Object>> records = runSOQLWithOptions(soql, false, pageSize, offset);
        
        // Get total count for pagination info
        Integer totalCount = getTotalCount(soql);
        
        return new Map<String, Object>{
            'records' => records,
            'totalCount' => totalCount,
            'pageSize' => pageSize,
            'offset' => offset,
            'hasMore' => (offset + pageSize) < totalCount
        };
    }
    
    @AuraEnabled(cacheable=false)
    public static Map<String, Object> runSOQLForExport(String soql, Integer batchNumber) {
        try {
            // For export, use larger batch sizes and return with metadata
            Integer offset = batchNumber * EXPORT_BATCH_SIZE;
            List<Map<String, Object>> records = runSOQLWithOptions(soql, true, EXPORT_BATCH_SIZE, offset);
            
            Integer totalCount = getTotalCount(soql);
            Boolean hasMore = (offset + EXPORT_BATCH_SIZE) < totalCount;
            
            return new Map<String, Object>{
                'records' => records,
                'totalCount' => totalCount,
                'batchNumber' => batchNumber,
                'batchSize' => EXPORT_BATCH_SIZE,
                'hasMore' => hasMore,
                'recordsInBatch' => records.size()
            };
            
        } catch (Exception e) {
            throw new AuraHandledException('Export Error: ' + e.getMessage());
        }
    }
    
    // Core method with options for different query modes
    private static List<Map<String, Object>> runSOQLWithOptions(String soql, Boolean useAllRows, Integer pageSize, Integer offset) {
        // Basic security: block DML and non-SELECT
        if (String.isBlank(soql)) {
            throw new AuraHandledException('Only SELECT queries are allowed.');
        }
        
        String trimmedSOQL = soql.trim();
        String upperSOQL = trimmedSOQL.toUpperCase();
        
        // Check if it starts with SELECT
        if (!upperSOQL.startsWith('SELECT ')) {
            throw new AuraHandledException('Only SELECT queries are allowed.');
        }
        
        // Additional security checks for forbidden operations anywhere in the query
        if (upperSOQL.contains('UPDATE ') || upperSOQL.contains('INSERT ') || 
            upperSOQL.contains('DELETE ') || upperSOQL.contains('UPSERT ') ||
            upperSOQL.contains('MERGE ') || upperSOQL.contains('TRUNCATE ')) {
            throw new AuraHandledException('Only SELECT queries are allowed.');
        }
        
        try {
            String secureSOQL = soql.trim();
            
            // Add ALL ROWS clause if requested and not already present
            if (useAllRows && !secureSOQL.toUpperCase().contains('ALL ROWS')) {
                // Insert ALL ROWS before any ORDER BY, GROUP BY, HAVING, LIMIT, OFFSET
                String[] keywords = new String[]{'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET'};
                Integer insertPosition = secureSOQL.length();
                
                for (String keyword : keywords) {
                    Integer keywordPos = secureSOQL.toUpperCase().indexOf(' ' + keyword + ' ');
                    if (keywordPos != -1 && keywordPos < insertPosition) {
                        insertPosition = keywordPos;
                    }
                }
                
                secureSOQL = secureSOQL.substring(0, insertPosition) + ' ALL ROWS' + secureSOQL.substring(insertPosition);
            }
            
            // Add LIMIT and OFFSET for pagination (only if not using ALL ROWS and not an aggregate query)
            if (!useAllRows && !secureSOQL.toUpperCase().contains('LIMIT') && 
                !secureSOQL.toUpperCase().contains('COUNT(') && 
                !secureSOQL.toUpperCase().contains('SUM(') &&
                !secureSOQL.toUpperCase().contains('AVG(') &&
                !secureSOQL.toUpperCase().contains('MIN(') &&
                !secureSOQL.toUpperCase().contains('MAX(')) {
                secureSOQL += ' LIMIT ' + pageSize;
            }
            
            if (!useAllRows && offset > 0) {
                secureSOQL += ' OFFSET ' + offset;
            }
            
            List<SObject> records = Database.query(secureSOQL);
            List<Map<String, Object>> result = new List<Map<String, Object>>();
            
            for (SObject rec : records) {
                Map<String, Object> recordMap = convertSObjectToMap(rec);
                result.add(recordMap);
            }
            
            return result;
            
        } catch (System.QueryException e) {
            throw new AuraHandledException('Query Error: ' + e.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException('Query Error: ' + e.getMessage());
        }
    }
    
    // Get total count for pagination
    private static Integer getTotalCount(String soql) {
        try {
            // Convert SELECT query to COUNT query
            String countQuery = convertToCountQuery(soql);
            return Database.countQuery(countQuery);
        } catch (Exception e) {
            // Fallback: estimate based on query without COUNT
            System.debug('Could not get exact count: ' + e.getMessage());
            return 50000; // Conservative estimate for pagination UI
        }
    }
    
    // Convert a SELECT query to a COUNT query
    private static String convertToCountQuery(String soql) {
        String upperSOQL = soql.toUpperCase();
        
        // Find FROM clause
        Integer fromIndex = upperSOQL.indexOf(' FROM ');
        if (fromIndex == -1) {
            throw new QueryException('Invalid SOQL: FROM clause not found');
        }
        
        // Extract FROM clause and everything after it
        String fromClause = soql.substring(fromIndex);
        
        // Remove ORDER BY, LIMIT, OFFSET, ALL ROWS for count query
        fromClause = fromClause.replaceAll('(?i)\\s+ORDER\\s+BY\\s+[^\\s]+(?:\\s+(?:ASC|DESC))?(?:\\s*,\\s*[^\\s]+(?:\\s+(?:ASC|DESC))?)*', '');
        fromClause = fromClause.replaceAll('(?i)\\s+LIMIT\\s+\\d+', '');
        fromClause = fromClause.replaceAll('(?i)\\s+OFFSET\\s+\\d+', '');
        fromClause = fromClause.replaceAll('(?i)\\s+ALL\\s+ROWS', '');
        
        return 'SELECT COUNT()' + fromClause.trim();
    }
    
    @AuraEnabled(cacheable=false)
    public static Map<String, Object> runSOQLWithCursor(String soql, String cursorFieldName, String lastCursorValue, Integer batchSize) {
        try {
            if (batchSize == null || batchSize <= 0) {
                batchSize = DEFAULT_PAGE_SIZE;
            }
            
            String modifiedSOQL = soql.trim();
            
            // Add cursor-based pagination
            if (String.isNotBlank(lastCursorValue) && String.isNotBlank(cursorFieldName)) {
                String whereClause = cursorFieldName + ' > \'' + String.escapeSingleQuotes(lastCursorValue) + '\'';
                
                if (modifiedSOQL.toUpperCase().contains(' WHERE ')) {
                    // Append to existing WHERE clause
                    modifiedSOQL = modifiedSOQL.replaceAll('(?i)\\s+WHERE\\s+', ' WHERE (' + whereClause + ') AND (') + ')';
                } else {
                    // Add new WHERE clause
                    String beforeOrderBy = modifiedSOQL;
                    String orderByClause = '';
                    
                    // Extract ORDER BY if present
                    Pattern orderByPattern = Pattern.compile('(?i)\\s+(ORDER\\s+BY\\s+.*)$');
                    Matcher matcher = orderByPattern.matcher(modifiedSOQL);
                    if (matcher.find()) {
                        orderByClause = ' ' + matcher.group(1);
                        beforeOrderBy = modifiedSOQL.substring(0, matcher.start());
                    }
                    
                    modifiedSOQL = beforeOrderBy + ' WHERE ' + whereClause + orderByClause;
                }
            }
            
            // Ensure ORDER BY for cursor-based pagination
            if (String.isNotBlank(cursorFieldName) && !modifiedSOQL.toUpperCase().contains('ORDER BY')) {
                modifiedSOQL += ' ORDER BY ' + cursorFieldName + ' ASC';
            }
            
            // Add LIMIT
            if (!modifiedSOQL.toUpperCase().contains('LIMIT')) {
                modifiedSOQL += ' LIMIT ' + batchSize;
            }
            
            List<SObject> records = Database.query(modifiedSOQL);
            List<Map<String, Object>> result = new List<Map<String, Object>>();
            String nextCursorValue = null;
            
            for (SObject rec : records) {
                Map<String, Object> recordMap = convertSObjectToMap(rec);
                result.add(recordMap);
                
                // Update cursor value for next batch
                if (String.isNotBlank(cursorFieldName) && rec.get(cursorFieldName) != null) {
                    nextCursorValue = String.valueOf(rec.get(cursorFieldName));
                }
            }
            
            return new Map<String, Object>{
                'records' => result,
                'nextCursorValue' => nextCursorValue,
                'hasMore' => records.size() >= batchSize,
                'batchSize' => batchSize,
                'recordsReturned' => records.size()
            };
            
        } catch (Exception e) {
            throw new AuraHandledException('Cursor Query Error: ' + e.getMessage());
        }
    }
    
    // Helper method to properly convert SObject to Map including subquery results
    private static Map<String, Object> convertSObjectToMap(SObject record) {
        Map<String, Object> recordMap = new Map<String, Object>();
        
        // Get all populated fields
        Map<String, Object> populatedFields = record.getPopulatedFieldsAsMap();
        
        for (String fieldName : populatedFields.keySet()) {
            Object fieldValue = populatedFields.get(fieldName);
            
            // Check if this is a child relationship (List of SObjects)
            if (fieldValue instanceof List<SObject>) {
                List<SObject> childRecords = (List<SObject>) fieldValue;
                List<Map<String, Object>> childMaps = new List<Map<String, Object>>();
                
                for (SObject childRecord : childRecords) {
                    childMaps.add(convertSObjectToMap(childRecord));
                }
                
                recordMap.put(fieldName, childMaps);
            } else {
                recordMap.put(fieldName, fieldValue);
            }
        }
        
        return recordMap;
    }
}
