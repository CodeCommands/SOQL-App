public with sharing class CodeBuddhaSOQLMeta {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getSObjects() {
        List<Map<String, String>> sobjects = new List<Map<String, String>>();
        
        try {
            for (Schema.SObjectType objType : Schema.getGlobalDescribe().values()) {
                Schema.DescribeSObjectResult describe = objType.getDescribe();
                
                // Filter similar to lwc-soql-builder: only queryable objects with proper labels
                // IMPORTANT: Check isAccessible() to respect user permissions
                String apiName = describe.getName();
                String label = describe.getLabel();
                
                if (describe.isQueryable() && 
                    describe.isAccessible() && // User must have read access to the object
                    !describe.isCustomSetting() && 
                    !describe.isDeprecatedAndHidden() &&
                    label != null &&
                    !label.startsWith('__MISSING LABEL__') &&
                    !apiName.startsWith('SBQQ__') && // Exclude CPQ objects unless needed
                    !apiName.endsWith('Share') && // Exclude Share objects
                    !apiName.endsWith('History') && // Exclude History objects  
                    !apiName.endsWith('Feed') && // Exclude Feed objects
                    !apiName.contains('ChangeEvent') && // Exclude Change Data Capture
                    !apiName.contains('__dlm') && // Exclude Data Lifecycle Management
                    !apiName.startsWith('External') && // Exclude External objects
                    !apiName.startsWith('Lightning') && // Exclude Lightning objects
                    !apiName.startsWith('Flow') && // Exclude Flow objects
                    !apiName.startsWith('Quick') && // Exclude Quick Action objects
                    apiName != 'ContentDocumentLink' && // Common exclusions
                    apiName != 'ContentVersion' &&
                    apiName != 'EmailMessage' &&
                    apiName != 'ProcessInstance' &&
                    apiName != 'ProcessInstanceHistory' &&
                    apiName != 'ProcessInstanceStep' &&
                    apiName != 'ProcessInstanceWorkitem' &&
                    apiName != 'UserLogin' &&
                    apiName != 'LoginHistory' &&
                    apiName != 'SetupAuditTrail') {
                    
                    Map<String, String> entry = new Map<String, String>{
                        'apiName' => apiName,
                        'label' => label,
                        'queryable' => String.valueOf(describe.isQueryable())
                    };
                    sobjects.add(entry);
                }
            }
        } catch (Exception e) {
            System.debug('Error getting SObjects: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve objects. Please check your permissions: ' + e.getMessage());
        }
        
        // Simple bubble sort by label
        Integer n = sobjects.size();
        for (Integer i = 0; i < n; i++) {
            for (Integer j = 0; j < n - 1; j++) {
                if (sobjects[j].get('label') > sobjects[j+1].get('label')) {
                    Map<String, String> temp = sobjects[j];
                    sobjects[j] = sobjects[j+1];
                    sobjects[j+1] = temp;
                }
            }
        }
        return sobjects;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getSObjectFields(String sobjectApiName) {
        Map<String, Object> result = new Map<String, Object>();
        
        try {
            Schema.DescribeSObjectResult objectDescribe = validateObjectAccess(sobjectApiName);
            
            List<Map<String, Object>> fieldList = buildAccessibleFieldList(objectDescribe);
            result.put('fields', fieldList);
            
            List<Map<String, String>> childRels = buildChildRelationshipList(objectDescribe);
            result.put('childRelationships', childRels);
            
        } catch (Exception e) {
            System.debug('Error getting SObject fields: ' + e.getMessage());
            throw new AuraHandledException('Unable to retrieve fields. Please check your permissions: ' + e.getMessage());
        }
        
        return result;
    }
    
    private static Schema.DescribeSObjectResult validateObjectAccess(String sobjectApiName) {
        Schema.SObjectType objectType = Schema.getGlobalDescribe().get(sobjectApiName);
        if (objectType == null) {
            throw new AuraHandledException('Object not found: ' + sobjectApiName);
        }
        
        Schema.DescribeSObjectResult objectDescribe = objectType.getDescribe();
        if (!objectDescribe.isAccessible()) {
            throw new AuraHandledException('You do not have permission to access this object: ' + sobjectApiName);
        }
        
        return objectDescribe;
    }
    
    private static List<Map<String, Object>> buildAccessibleFieldList(Schema.DescribeSObjectResult objectDescribe) {
        Map<String, Schema.SObjectField> fields = objectDescribe.fields.getMap();
        List<Map<String, Object>> fieldList = new List<Map<String, Object>>();
        
        for (String fieldName : fields.keySet()) {
            Schema.DescribeFieldResult f = fields.get(fieldName).getDescribe();
            
            if (f.isAccessible()) {
                Map<String, Object> fieldMap = buildFieldMap(f);
                fieldList.add(fieldMap);
            }
        }
        
        return fieldList;
    }
    
    private static Map<String, Object> buildFieldMap(Schema.DescribeFieldResult f) {
        String fieldType = String.valueOf(f.getType()).toLowerCase();
        
        Map<String, Object> fieldMap = new Map<String, Object>{
            'apiName' => f.getName(),
            'name' => f.getName(),
            'label' => f.getLabel(),
            'type' => fieldType
        };
        
        addReferenceFieldInfo(fieldMap, f);
        
        return fieldMap;
    }
    
    private static void addReferenceFieldInfo(Map<String, Object> fieldMap, Schema.DescribeFieldResult f) {
        if (f.getType() == Schema.DisplayType.REFERENCE && f.getReferenceTo().size() > 0) {
            fieldMap.put('referenceTo', new List<String>());
            
            for (Schema.SObjectType refType : f.getReferenceTo()) {
                Schema.DescribeSObjectResult refDescribe = refType.getDescribe();
                if (refDescribe.isAccessible()) {
                    ((List<String>)fieldMap.get('referenceTo')).add(String.valueOf(refType));
                }
            }
            
            if (f.getRelationshipName() != null) {
                fieldMap.put('relationshipName', f.getRelationshipName());
            }
        }
    }
    
    private static List<Map<String, String>> buildChildRelationshipList(Schema.DescribeSObjectResult objectDescribe) {
        List<Map<String, String>> childRels = new List<Map<String, String>>();
        
        for (Schema.ChildRelationship rel : objectDescribe.getChildRelationships()) {
            if (rel.getRelationshipName() != null) {
                Schema.SObjectType childType = rel.getChildSObject();
                Schema.DescribeSObjectResult childDescribe = childType.getDescribe();
                
                if (childDescribe.isAccessible() && childDescribe.isQueryable()) {
                    childRels.add(new Map<String, String>{
                        'relationshipName' => rel.getRelationshipName(),
                        'childSObject' => String.valueOf(rel.getChildSObject())
                    });
                }
            }
        }
        
        return childRels;
    }
}
