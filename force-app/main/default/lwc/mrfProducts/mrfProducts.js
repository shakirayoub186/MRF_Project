import { LightningElement, track, wire, api } from 'lwc';
import getMrfList from '@salesforce/apex/MrfListController.getMrfList';
import saveMrfList from '@salesforce/apex/MrfListController.saveMrfList';
import getItemPicklistValues from '@salesforce/apex/MrfListController.getItemPicklistValues';
import getCategoryPicklistValues from '@salesforce/apex/MrfListController.getCategoryPicklistValues';
import getItemMaster from '@salesforce/apex/MrfListController.getItemMaster';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MrfProductTable extends LightningElement {
    // Tracks product rows for dynamic table
    @track productRows = [];

    // Stores item and category picklist options
    @track itemOptions = [];
    @track categoryOptions = [];

    // Stores record IDs to be deleted
    @track deletedIds = [];

    // Receives the MRF parent recordId from parent component
    @api recordId;

    // Fetch existing MRF List records when component loads or recordId changes
    @wire(getMrfList, { recordId: '$recordId' })
    wiredProducts({ data, error }) {
        if (data) {
            // Map server data to UI-friendly row structure
            this.productRows = data.map(item => ({
                key: item.Id,
                id: item.Id,
                item: item.Item__c,
                category: item.Category__c,
                part: item.Part_Number__c,
                description: item.Description__c,
                listPrice: item.List_Price_INR__c,
                gl: item.GL__c,
                glName: item.GL_Name__c,

                // UI state helpers
                isNonInventory: item.Category__c === 'Non-Inventory',
                showItem: !!item.Category__c,
                showDetails: !!item.Item__c
            }));
        } else if (error) {
            console.error('❌ Error loading MRF List:', error);
        }
    }

    // Save handler - validates and submits productRows to Apex
    @api
    save() {
        // Validation: prevent save if any row is missing a category
        const invalidRows = this.productRows.filter(row => !row.category);
        if (invalidRows.length > 0) {
            this.showToast('Validation Error', '❌ Please select a Category for all products before saving.', 'error');
            return;
        }

        // Prepare payload for Apex
        const payload = this.productRows.map(row => ({
            Id: row.id,
            LIST__c: this.recordId,
            Item__c: row.item,
            Category__c: row.category,
            Part_Number__c: row.part,
            Description__c: row.description,
            List_Price_INR__c: row.listPrice,
            GL__c: row.gl,
            GL_Name__c: row.glName
        }));

        // Call Apex to save products
        saveMrfList({ products: payload, deletedIds: this.deletedIds })
            .then(() => {
                this.showToast('Success', '✅ MRF List saved and linked to MRF!', 'success');
                this.navigateToMrfView(); // Refresh the record page to see changes
            })
            .catch(error => {
                this.showToast('Error', '❌ Failed to save MRF List', 'error');
                console.error('Save MRF List error:', error);
            });
    }

    // Show toast notifications
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    // Refresh view by navigating back to the MRF record page
    navigateToMrfView() {
        window.location.assign(`/lightning/r/MRF__c/${this.recordId}/view`);
    }

    // Load item picklist options
    @wire(getItemPicklistValues)
    wiredItemOptions({ data, error }) {
        if (data) {
            this.itemOptions = data.map(label => ({ label, value: label }));
        } else if (error) {
            console.error('❌ Error loading item picklist:', error);
        }
    }

    // Load category picklist options
    @wire(getCategoryPicklistValues)
    wiredCategoryOptions({ data, error }) {
        if (data) {
            this.categoryOptions = data.map(label => ({ label, value: label }));
        } else if (error) {
            console.error('❌ Error loading category picklist:', error);
        }
    }

    // Add a new empty row to the productRows list
    addRow() {
        const uniqueKey = Date.now().toString(); // unique key for tracking
        this.productRows = [...this.productRows, {
            key: uniqueKey,
            id: null,
            item: '',
            category: '',
            part: '',
            description: '',
            listPrice: '',
            gl: '',
            glName: '',
            isNonInventory: false,
            showItem: false,
            showDetails: false
        }];
    }

    // Remove a row and optionally track it for deletion if already saved
    removeRow(event) {
        const index = event.currentTarget.dataset.index;
        const row = this.productRows[index];

        if (row.id) {
            this.deletedIds.push(row.id); // mark for delete
        }

        this.productRows.splice(index, 1); // remove from list
        this.productRows = [...this.productRows]; // trigger re-render

        this.showToast('Row Deleted', `Row ${parseInt(index) + 1} marked for deletion.`, 'error');
    }

    // Handle input changes in any field
    handleChange(event) {
        const index = event.target.dataset.index;
        const field = event.target.dataset.field;
        const value = event.detail.value;

        const updatedRows = [...this.productRows];
        updatedRows[index][field] = value;

        // If category is changed
        if (field === 'category') {
            updatedRows[index].isNonInventory = value === 'Non-Inventory';
            updatedRows[index].item = ''; // clear previous item
            updatedRows[index].showItem = true; // show item input next
            updatedRows[index].showDetails = false; // hide rest initially
        }

        // If item is selected, show additional fields and fetch master data
        if (field === 'item') {
            updatedRows[index].showDetails = true;

            getItemMaster({
                item: value,
                category: updatedRows[index].category
            })
                .then(data => {
                    if (data) {
                        // Auto-fill details from item master
                        updatedRows[index].part = data.Part_Number__c || '';
                        updatedRows[index].description = data.Description__c || '';
                        updatedRows[index].listPrice = data.List_Price_INR__c || '';
                        updatedRows[index].gl = data.GL__c || '';
                        updatedRows[index].glName = data.GL_Name__c || '';
                    } else {
                        // Clear if no match found
                        updatedRows[index].part = '';
                        updatedRows[index].description = '';
                        updatedRows[index].listPrice = '';
                        updatedRows[index].gl = '';
                        updatedRows[index].glName = '';
                    }
                    this.productRows = [...updatedRows];
                })
                .catch(error => {
                    console.error('❌ Error fetching item master:', error);
                });
        } else {
            this.productRows = [...updatedRows];
        }
    }
}
