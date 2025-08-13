@IsTest
public class CodeBuddhaSOQLRunnerTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test data
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 3; i++) {
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
