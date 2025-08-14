// Test relationship field flattening
String query = 'SELECT Id, Name, CodeBuddha__Account__r.Name FROM CodeBuddha__AAA_Test_Object__c LIMIT 2';
Map<String, Object> result = CodeBuddhaSOQLRunner.runSOQLForExport(query, 0);

List<Map<String, Object>> records = (List<Map<String, Object>>) result.get('records');

System.debug('Number of records: ' + records.size());

for (Map<String, Object> record : records) {
    System.debug('Record keys: ' + record.keySet());
    System.debug('Full record: ' + JSON.serializePretty(record));
    System.debug('---');
}
