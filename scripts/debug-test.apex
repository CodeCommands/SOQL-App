try {
    CodeBuddhaSOQLRunner.runSOQL('UPDATE Account SET Name = \'Test\'');
    System.debug('ERROR: Should have thrown exception');
} catch (AuraHandledException e) {
    System.debug('SUCCESS: Caught exception: ' + e.getMessage());
} catch (Exception e) {
    System.debug('OTHER ERROR: ' + e.getTypeName() + ': ' + e.getMessage());
}
