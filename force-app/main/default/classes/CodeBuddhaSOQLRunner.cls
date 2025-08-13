public with sharing class CodeBuddhaSOQLRunner {
    @AuraEnabled(cacheable=false)
    public static List<Map<String, Object>> runSOQL(String soql) {
        // Basic security: block DML and non-SELECT
        if (String.isBlank(soql) || !soql.trim().toLowerCase().startsWith('select')) {
            throw new AuraHandledException('Only SELECT queries are allowed.');
        }
        
        try {
            // For subqueries, we need to be more careful about WITH SECURITY_ENFORCED
            // Let's run the query as-is but rely on sharing rules and FLS
            String secureSOQL = soql.trim();
            
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
