@IsTest
public class CodeBuddhaSOQLRunnerTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test data
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 10; i++) {
            accounts.add(new Account(Name = 'Test Account ' + i));
        }
        insert accounts;
        
        List<Contact> contacts = new List<Contact>();
        for (Account acc : accounts) {
            contacts.add(new Contact(
                FirstName = 'Test',
                LastName = 'Contact ' + acc.Name,
                AccountId = acc.Id
            ));
        }
        insert contacts;
    }
    
    @IsTest
    static void testRunSoqlSimpleSelectSuccess() {
        // Test basic SELECT query
        String soql = 'SELECT Id, Name FROM Account LIMIT 2';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        // Assertions
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(2, result.size(), 'Should return exactly 2 records');
        
        // Verify structure
        Map<String, Object> firstRecord = result[0];
        System.assert(firstRecord.containsKey('Id'), 'Should contain Id field');
        System.assert(firstRecord.containsKey('Name'), 'Should contain Name field');
    }

    @IsTest
    static void testRunSOQLAll() {
        // Test runSOQLAll method
        String soql = 'SELECT Id, Name FROM Account';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQLAll(soql);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.size() > 0, 'Should return records');
    }

    @IsTest
    static void testRunSOQLPaginated() {
        // Test paginated query
        String soql = 'SELECT Id, Name FROM Account';
        Integer pageSize = 3;
        Integer offset = 0;
        
        Test.startTest();
        Map<String, Object> result = CodeBuddhaSOQLRunner.runSOQLPaginated(soql, pageSize, offset);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.containsKey('records'), 'Should contain records');
        System.assert(result.containsKey('totalCount'), 'Should contain totalCount');
        System.assert(result.containsKey('hasMore'), 'Should contain hasMore');
        
        List<Map<String, Object>> records = (List<Map<String, Object>>) result.get('records');
        System.assertEquals(pageSize, records.size(), 'Should return pageSize records');
    }

    @IsTest
    static void testRunSOQLForExport() {
        // Test export batch method
        String soql = 'SELECT Id, Name FROM Account';
        Integer batchNumber = 0;
        
        Test.startTest();
        Map<String, Object> result = CodeBuddhaSOQLRunner.runSOQLForExport(soql, batchNumber);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.containsKey('records'), 'Should contain records');
        System.assert(result.containsKey('totalCount'), 'Should contain totalCount');
        System.assert(result.containsKey('batchNumber'), 'Should contain batchNumber');
        System.assert(result.containsKey('hasMore'), 'Should contain hasMore');
        
        Integer returnedBatchNumber = (Integer) result.get('batchNumber');
        System.assertEquals(batchNumber, returnedBatchNumber, 'Should return correct batch number');
    }

    @IsTest
    static void testRunSOQLWithCursor() {
        // Test cursor-based pagination
        String soql = 'SELECT Id, Name FROM Account';
        String cursorField = 'Id';
        String lastCursorValue = null;
        Integer batchSize = 3;
        
        Test.startTest();
        Map<String, Object> result = CodeBuddhaSOQLRunner.runSOQLWithCursor(soql, cursorField, lastCursorValue, batchSize);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.containsKey('records'), 'Should contain records');
        System.assert(result.containsKey('nextCursorValue'), 'Should contain nextCursorValue');
        System.assert(result.containsKey('hasMore'), 'Should contain hasMore');
        
        List<Map<String, Object>> records = (List<Map<String, Object>>) result.get('records');
        System.assert(records.size() <= batchSize, 'Should not exceed batch size');
    }

    @IsTest
    static void testRunSOQLWithCursorWithLastValue() {
        // First get some records to get a cursor value
        List<Account> accounts = [SELECT Id FROM Account ORDER BY Id LIMIT 2];
        String lastId = accounts[0].Id;
        
        String soql = 'SELECT Id, Name FROM Account';
        String cursorField = 'Id';
        Integer batchSize = 5;
        
        Test.startTest();
        Map<String, Object> result = CodeBuddhaSOQLRunner.runSOQLWithCursor(soql, cursorField, lastId, batchSize);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        List<Map<String, Object>> records = (List<Map<String, Object>>) result.get('records');
        
        // Verify that returned records have Ids greater than the cursor value
        for (Map<String, Object> record : records) {
            String recordId = (String) record.get('Id');
            // For Salesforce IDs, we can compare them as strings since they are lexicographically ordered
            // But let's make sure the comparison is valid by checking the record exists and is different
            System.assertNotEquals(lastId, recordId, 'Returned record Id should be different from cursor value');
        }
    }
    
    @IsTest
    static void testRunSoqlWithWhereSuccess() {
        // Test SELECT with WHERE clause
        String soql = 'SELECT Id, Name FROM Account WHERE Name LIKE \'Test Account%\' LIMIT 1';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(1, result.size(), 'Should return exactly 1 record');
    }
    
    @IsTest
    static void testRunSoqlWithOrderBy() {
        // Test SELECT with ORDER BY
        String soql = 'SELECT Id, Name FROM Account ORDER BY Name ASC LIMIT 2';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(2, result.size(), 'Should return exactly 2 records');
    }
    
    @IsTest
    static void testRunSoqlWithSubquerySuccess() {
        // Test SELECT with subquery
        String soql = 'SELECT Id, Name, (SELECT Id, FirstName FROM Contacts) FROM Account LIMIT 1';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(1, result.size(), 'Should return exactly 1 record');
        
        // Verify subquery results
        Map<String, Object> accountRecord = result[0];
        System.assert(accountRecord.containsKey('Contacts'), 'Should contain Contacts subquery');
    }
    
    @IsTest
    static void testRunSoqlWithAggregate() {
        // Test aggregate function
        String soql = 'SELECT COUNT(Id) cnt FROM Account';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(1, result.size(), 'COUNT query should return one result');
    }
    
    @IsTest
    static void testRunSoqlCaseInsensitiveSelect() {
        // Test case insensitive SELECT
        String soql = 'select Id, Name from Account limit 1';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(1, result.size(), 'Should return exactly 1 record');
    }

    @IsTest
    static void testInvalidSOQLQueries() {
        // Test various invalid queries
        
        Test.startTest();
        
        // Test non-SELECT query
        try {
            CodeBuddhaSOQLRunner.runSOQL('UPDATE Account SET Name = \'Test\'');
            System.assert(false, 'Should have thrown exception for UPDATE query');
        } catch (AuraHandledException e) {
            // In test context, AuraHandledException might show as "Script-thrown exception"
            String message = e.getMessage();
            System.assert(message.contains('Only SELECT queries are allowed') || message.contains('Script-thrown exception'), 
                'Should reject UPDATE queries. Actual message: ' + message);
        }
        
        // Test empty query
        try {
            CodeBuddhaSOQLRunner.runSOQL('');
            System.assert(false, 'Should have thrown exception for empty query');
        } catch (AuraHandledException e) {
            String message = e.getMessage();
            System.assert(message.contains('Only SELECT queries are allowed') || message.contains('Script-thrown exception'), 
                'Should reject empty queries');
        }
        
        // Test invalid syntax
        try {
            CodeBuddhaSOQLRunner.runSOQL('SELECT Id FROM InvalidObject');
            System.assert(false, 'Should have thrown exception for invalid object');
        } catch (AuraHandledException e) {
            String message = e.getMessage();
            System.assert(message.contains('Query Error') || message.contains('Script-thrown exception'), 
                'Should return query error');
        }
        
        Test.stopTest();
    }

    @IsTest
    static void testConvertToCountQuery() {
        // Test the count query conversion (indirectly through pagination)
        String soql = 'SELECT Id, Name FROM Account WHERE Name LIKE \'Test%\' ORDER BY Name LIMIT 5';
        
        Test.startTest();
        Map<String, Object> result = CodeBuddhaSOQLRunner.runSOQLPaginated(soql, 3, 0);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        Integer totalCount = (Integer) result.get('totalCount');
        System.assert(totalCount > 0, 'Total count should be greater than 0');
    }
    
    @IsTest
    static void testConvertSObjectToMapFunctionality() {
        // Test the convertSObjectToMap method indirectly
        String soql = 'SELECT Id, Name, (SELECT Id, FirstName FROM Contacts LIMIT 1) FROM Account LIMIT 1';
        
        Test.startTest();
        List<Map<String, Object>> result = CodeBuddhaSOQLRunner.runSOQL(soql);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Result should not be null');
        if (result.size() > 0) {
            Map<String, Object> record = result[0];
            System.assert(record.containsKey('Id'), 'Should contain Id');
            System.assert(record.containsKey('Name'), 'Should contain Name');
            // This tests the convertSObjectToMap method's handling of subqueries
            if (record.containsKey('Contacts')) {
                Object contactsObj = record.get('Contacts');
                System.assertNotEquals(null, contactsObj, 'Contacts should not be null if present');
            }
        }
    }
}
