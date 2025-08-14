  "CodeBuddha__Account__c": "001gL00000G8t7mQAB",
  "CodeBuddha__Account__r": {
    "Name": "Burlington Textiles Corp of America",
    "Id": "001gL00000G8t7mQAB"
  }// Script to create test records for CodeBuddha__AAA_Test_Object__c
// Create 2100 records for each of the first 3 accounts to test Query All and pagination

// Get all existing accounts
List<Account> accounts = [SELECT Id, Name FROM Account ORDER BY Name LIMIT 3];
System.debug('Found ' + accounts.size() + ' accounts for testing');

// We'll create records in batches to avoid governor limits
Integer RECORDS_PER_ACCOUNT = 2100;
Integer BATCH_SIZE = 200; // Safe batch size for DML operations
Integer totalRecordsToCreate = accounts.size() * RECORDS_PER_ACCOUNT;

System.debug('Planning to create ' + totalRecordsToCreate + ' total records (' + RECORDS_PER_ACCOUNT + ' per account)');

Integer globalRecordCounter = 1;

// Process each account
for (Integer accountIndex = 0; accountIndex < accounts.size(); accountIndex++) {
    Account acc = accounts[accountIndex];
    System.debug('Processing account: ' + acc.Name);
    
    // Create records for this account in batches
    Integer recordsCreatedForAccount = 0;
    
    while (recordsCreatedForAccount < RECORDS_PER_ACCOUNT) {
        List<CodeBuddha__AAA_Test_Object__c> batchRecords = new List<CodeBuddha__AAA_Test_Object__c>();
        
        // Create a batch of records
        Integer recordsInThisBatch = Math.min(BATCH_SIZE, RECORDS_PER_ACCOUNT - recordsCreatedForAccount);
        
        for (Integer i = 0; i < recordsInThisBatch; i++) {
            CodeBuddha__AAA_Test_Object__c testRecord = new CodeBuddha__AAA_Test_Object__c();
            
            // Set the Name field with account index and record number
            testRecord.Name = 'Test Record ' + String.valueOf(globalRecordCounter).leftPad(5, '0');
            
            // Set the Account lookup
            testRecord.CodeBuddha__Account__c = acc.Id;
            
            // Set the Text field with meaningful data
            testRecord.CodeBuddha__Text_Field__c = 'Sample text for ' + acc.Name + ' - Batch Record ' + (recordsCreatedForAccount + i + 1);
            
            // Set the Checkbox field (alternate pattern)
            testRecord.CodeBuddha__Checkbox_Field__c = Math.mod(globalRecordCounter, 3) == 1;
            
            batchRecords.add(testRecord);
            globalRecordCounter++;
        }
        
        // Insert this batch
        try {
            insert batchRecords;
            recordsCreatedForAccount += batchRecords.size();
            System.debug('  Inserted batch of ' + batchRecords.size() + ' records. Total for ' + acc.Name + ': ' + recordsCreatedForAccount);
        } catch (Exception e) {
            System.debug('Error inserting batch for account ' + acc.Name + ': ' + e.getMessage());
            break;
        }
    }
    
    System.debug('Completed account ' + acc.Name + ' with ' + recordsCreatedForAccount + ' records');
}

System.debug('==== RECORD CREATION SUMMARY ====');
System.debug('Total records created: ' + (globalRecordCounter - 1));
System.debug('Accounts processed: ' + accounts.size());
System.debug('Records per account target: ' + RECORDS_PER_ACCOUNT);

// Verify the records were created
for (Account acc : accounts) {
    Integer actualCount = [
        SELECT COUNT() 
        FROM CodeBuddha__AAA_Test_Object__c 
        WHERE CodeBuddha__Account__c = :acc.Id
    ];
    System.debug('  ' + acc.Name + ': ' + actualCount + ' records created');
}

System.debug('==== READY FOR TESTING ====');
System.debug('You can now test with queries like:');
System.debug('SELECT Id, Name, CodeBuddha__Account__r.Name, CodeBuddha__Text_Field__c, CodeBuddha__Checkbox_Field__c FROM CodeBuddha__AAA_Test_Object__c');
System.debug('This will test pagination, Query All button, and large dataset export functionality');
