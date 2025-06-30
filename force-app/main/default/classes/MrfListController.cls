// Apex Controller to support Lightning Web Components (LWC) for managing MRF_List__c records
public with sharing class MrfListController {

    /**
     * Get all MRF_List__c records
     * Used to fetch existing product rows related to the MRF
     * Cacheable since it's read-only data
     */
    @AuraEnabled(cacheable=true)
    public static List<MRF_List__c> getMrfList() {
        return [
            SELECT Id, Item__c, Category__c, Part_Number__c, Description__c,
                   List_Price_INR__c, GL__c, GL_Name__c
            FROM MRF_List__c
        ];
    }

    /**
     * Save (insert/update) MRF_List__c records and delete removed ones
     * - Upserts incoming list of products (handles both new and edited rows)
     * - Deletes any records marked for removal using their Ids
     */
    @AuraEnabled
    public static void saveMrfList(List<MRF_List__c> products, List<Id> deletedIds) {
        if (products != null && !products.isEmpty()) {
            upsert products;
        }
        if (deletedIds != null && !deletedIds.isEmpty()) {
            delete [SELECT Id FROM MRF_List__c WHERE Id IN :deletedIds];
        }
    }

    /**
     * Fetch Item_Master__c details for a given item and category
     * Used to auto-fill part number, price, GL, etc. based on selection
     * Limited to 1 result to avoid duplicates
     */
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

    /**
     * Return all picklist values for the Item__c field in Item_Master__c
     * Used to populate dropdown options in the UI
     */
    @AuraEnabled(cacheable=true)
    public static List<String> getItemPicklistValues() {
        List<String> values = new List<String>();
        Schema.DescribeFieldResult fieldResult = Item_Master__c.Item__c.getDescribe();
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            values.add(entry.getLabel());
        }
        return values;
    }

    /**
     * Return all picklist values for the Category__c field in MRF_List__c
     * Used to populate the Category dropdown in the UI
     */
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
