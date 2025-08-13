public with sharing class CodeBuddhaSOQLRunner {
    @AuraEnabled(cacheable=false)
    public static List<Map<String, Object>> runSOQL(String soql) {
        // Basic security: block DML and non-SELECT
        if (String.isBlank(soql) || !soql.trim().toLowerCase().startsWith('select')) {
            throw new AuraHandledException('Only SELECT queries are allowed.');
        }
        try {
            List<SObject> records = Database.query(soql);
            List<Map<String, Object>> result = new List<Map<String, Object>>();
            for (SObject rec : records) {
                result.add(rec.getPopulatedFieldsAsMap());
            }
            return result;
        } catch (Exception e) {
            throw new AuraHandledException('Query Error: ' + e.getMessage());
        }
    }
}
