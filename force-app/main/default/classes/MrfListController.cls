public with sharing class MrfListController {

    @AuraEnabled(cacheable=true)
    public static List<MRF_List__c> getMrfList() {
        return [SELECT Id, Item__c, Category__c, Part_Number__c, Description__c, List_Price_INR__c, GL__c, GL_Name__c FROM MRF_List__c];
    }

    @AuraEnabled
    public static void saveMrfList(List<MRF_List__c> products, List<Id> deletedIds) {
    if (products != null && !products.isEmpty()) {
        upsert products;
    }
    if (deletedIds != null && !deletedIds.isEmpty()) {
        delete [SELECT Id FROM MRF_List__c WHERE Id IN :deletedIds];
    }
}

    @AuraEnabled(cacheable=true)
    public static Item_Master__c getItemMaster(String item, String category) {
    List<Item_Master__c> results = [
        SELECT Id, Item__c, Category__c, Part_Number__c, Description__c,
               List_Price_INR__c, GL__c, GL_Name__c
        FROM Item_Master__c
        WHERE Item__c = :item AND Category__c = :category
        LIMIT 1
    ];
    return results.isEmpty() ? null : results[0];
}


    @AuraEnabled(cacheable=true)
    public static List<String> getItemPicklistValues() {
        List<String> values = new List<String>();
        Schema.DescribeFieldResult fieldResult = MRF_List__c.Item__c.getDescribe();
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            values.add(entry.getLabel());
        }
        return values;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getCategoryPicklistValues() {
        List<String> values = new List<String>();
        Schema.DescribeFieldResult fieldResult = MRF_List__c.Category__c.getDescribe();
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            values.add(entry.getLabel());
        }
        return values;
    }
    
}