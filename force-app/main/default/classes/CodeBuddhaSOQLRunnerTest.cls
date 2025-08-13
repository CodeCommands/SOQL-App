@IsTest
public class CodeBuddhaSOQLRunnerTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test data for SOQL queries
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 5; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + i,
                Industry = 'Technology',
                AnnualRevenue = 1000000 + (i * 100000)
            ));
        }
        insert accounts;
        
        // Create contacts for the accounts
        List<Contact> contacts = new List<Contact>();
        for (Account acc : accounts) {
            contacts.add(new Contact(
                FirstName = 'Test',
                LastName = 'Contact ' + acc.Name.substring(acc.Name.length() - 1),
                AccountId = acc.Id,
                Email = 'test' + acc.Name.substring(acc.Name.length() - 1) + '@example.com'
            ));
        }
        insert contacts;
    }
    
    @IsTest
    static void testRunSoqlSimpleSelectSuccess() {
        // Test simple SELECT query
        String soql = 'SELECT Id, Name FROM Account LIMIT 5';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.size() > 0, 'Should return at least one record');
        System.assert(result.size() <= 5, 'Should respect LIMIT clause');
        
        // Verify structure
        Map<String, Object> firstRecord = result[0];
        System.assert(firstRecord.containsKey('Id'), 'Should contain Id field');
        System.assert(firstRecord.containsKey('Name'), 'Should contain Name field');
        System.assertNotEquals(null, firstRecord.get('Id'), 'Id should not be null');
    }
    
    @IsTest
    static void testRunSoqlWithWhereSuccess() {
        // Test SELECT with WHERE clause
        String soql = 'SELECT Id, Name, Industry FROM Account WHERE Industry = \'Technology\'';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        
        // Verify all returned records have correct Industry
        for (Map<String, Object> record : result) {
            System.assertEquals('Technology', record.get('Industry'), 'All records should have Technology industry');
        }
    }
    
    @IsTest
    static void testRunSoqlWithSubquerySuccess() {
        // Test SELECT with subquery
        String soql = 'SELECT Id, Name, (SELECT Id, FirstName, LastName FROM Contacts) FROM Account LIMIT 3';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        
        // Check if subquery results are properly handled
        for (Map<String, Object> record : result) {
            System.assert(record.containsKey('Id'), 'Should contain Id field');
            System.assert(record.containsKey('Name'), 'Should contain Name field');
            
            // Check for subquery results
            if (record.containsKey('Contacts')) {
                Object contactsObj = record.get('Contacts');
                if (contactsObj != null) {
                    System.assert(contactsObj instanceof List<Object>, 'Contacts should be a list');
                }
            }
        }
    }
    
    @IsTest
    static void testRunSoqlCountSuccess() {
        // Test COUNT query - simplified version
        String soql = 'SELECT COUNT(Id) FROM Account';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(1, result.size(), 'COUNT query should return one result');
    }
    
    @IsTest
    static void testRunSoqlEmptyQuery() {
        // Test with empty query
        Test.startTest();
        try {
            CodeBuddhaSOQLRunner.runSOQL('');
            System.assert(false, 'Should have thrown an exception for empty query');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Only SELECT queries are allowed'), 'Should throw SELECT-only error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testRunSoqlNullQuery() {
        // Test with null query
        Test.startTest();
        try {
            CodeBuddhaSOQLRunner.runSOQL(null);
            System.assert(false, 'Should have thrown an exception for null query');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Only SELECT queries are allowed'), 'Should throw SELECT-only error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testRunSoqlNonSelectQuery() {
        // Test with non-SELECT query (INSERT)
        Test.startTest();
        try {
            CodeBuddhaSOQLRunner.runSOQL('INSERT INTO Account (Name) VALUES (\'Test\')');
            System.assert(false, 'Should have thrown an exception for INSERT query');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Only SELECT queries are allowed'), 'Should throw SELECT-only error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testRunSoqlUpdateQuery() {
        // Test with UPDATE query
        Test.startTest();
        try {
            CodeBuddhaSOQLRunner.runSOQL('UPDATE Account SET Name = \'Updated\'');
            System.assert(false, 'Should have thrown an exception for UPDATE query');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Only SELECT queries are allowed'), 'Should throw SELECT-only error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testRunSoqlDeleteQuery() {
        // Test with DELETE query
        Test.startTest();
        try {
            CodeBuddhaSOQLRunner.runSOQL('DELETE FROM Account');
            System.assert(false, 'Should have thrown an exception for DELETE query');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Only SELECT queries are allowed'), 'Should throw SELECT-only error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testRunSoqlInvalidSyntax() {
        // Test with invalid SOQL syntax
        String invalidSOQL = 'SELECT Id, Name FROM InvalidObject__c';
        
        Test.startTest();
        try {
            CodeBuddhaSOQLRunner.runSOQL(invalidSOQL);
            System.assert(false, 'Should have thrown an exception for invalid SOQL');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Query Error') || e.getMessage().contains('error'), 'Should throw Query Error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testRunSoqlInvalidField() {
        // Test with invalid field name
        String invalidSOQL = 'SELECT Id, InvalidField__c FROM Account';
        
        Test.startTest();
        try {
            CodeBuddhaSOQLRunner.runSOQL(invalidSOQL);
            System.assert(false, 'Should have thrown an exception for invalid field');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Query Error') || e.getMessage().contains('error'), 'Should throw Query Error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testRunSoqlCaseInsensitiveSelect() {
        // Test case insensitive SELECT
        String soql = 'select Id, Name from Account limit 1';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Should work with lowercase 'select'
        System.assertNotEquals(null, result, 'Result should not be null');
    }
    
    @IsTest
    static void testRunSoqlWithOrderBy() {
        // Test SELECT with ORDER BY
        String soql = 'SELECT Id, Name FROM Account ORDER BY Name ASC LIMIT 3';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        
        // Verify ordering (if we have multiple results)
        if (result.size() > 1) {
            String firstName = (String) result[0].get('Name');
            String secondName = (String) result[1].get('Name');
            System.assert(firstName <= secondName, 'Results should be ordered by Name ASC');
        }
    }
    
    @IsTest
    static void testRunSoqlWithAggregate() {
        // Test aggregate query
        String soql = 'SELECT Industry, COUNT(Id) recordCount FROM Account GROUP BY Industry';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        
        if (result.size() > 0) {
            Map<String, Object> firstResult = result[0];
            System.assert(firstResult.containsKey('Industry'), 'Should contain Industry field');
            System.assert(firstResult.containsKey('recordCount'), 'Should contain recordCount field');
        }
    }
}
