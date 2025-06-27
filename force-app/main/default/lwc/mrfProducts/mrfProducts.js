import { LightningElement, track, wire, api } from 'lwc';
import getMrfList from '@salesforce/apex/MrfListController.getMrfList';
import saveMrfList from '@salesforce/apex/MrfListController.saveMrfList';
import getItemPicklistValues from '@salesforce/apex/MrfListController.getItemPicklistValues';
import getCategoryPicklistValues from '@salesforce/apex/MrfListController.getCategoryPicklistValues';
import getItemMaster from '@salesforce/apex/MrfListController.getItemMaster';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

export default class MrfProductTable extends LightningElement {
    @track productRows = [];
    @track itemOptions = [];
    @track categoryOptions = [];
    @track deletedIds = [];
    @api recordId; // Add this to receive the ID from parent

    @wire(getMrfList, { recordId: '$recordId' }) // Reacts to recordId changes

    wiredProducts({ data, error }) {
        if (data) {
            this.productRows = data.map(item => ({
                key: item.Id, // ← required for template key
                id: item.Id,
                item: item.Item__c,
                category: item.Category__c,
                part: item.Part_Number__c,
                description: item.Description__c,
                listPrice: item.List_Price_INR__c,
                gl: item.GL__c,
                glName: item.GL_Name__c
            }));

        } else if (error) {
            console.error('❌ Error loading MRF List:', error);
        }
    }
    @api
    save() {
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

        saveMrfList({ products: payload, deletedIds: this.deletedIds })
            .then(() => {
                this.showToast('Success', '✅ MRF List saved and linked to MRF!', 'success');
                this.navigateToMrfView();
            })
            .catch(error => {
                this.showToast('Error', '❌ Failed to save MRF List', 'error');
                console.error('Save MRF List error:', error);
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }

    //navigate to mrf view page it will refresh the dynamic related list data
    navigateToMrfView() {
        window.location.assign(`/lightning/r/MRF__c/${this.recordId}/view`);
    }

    @wire(getItemPicklistValues)
    wiredItemOptions({ data, error }) {
        if (data) {
            this.itemOptions = data.map(label => ({
                label: label,
                value: label
            }));
        } else if (error) {
            console.error('❌ Error loading item picklist:', error);
        }
    }

    @wire(getCategoryPicklistValues)
    wiredCategoryOptions({ data, error }) {
        if (data) {
            this.categoryOptions = data.map(label => ({
                label: label,
                value: label
            }));
        } else if (error) {
            console.error('❌ Error loading category picklist:', error);
        }
    }

    addRow() {
        const uniqueKey = Date.now().toString(); // or use a counter or UUID
        this.productRows = [...this.productRows, {
            key: uniqueKey,
            id: null,
            item: '',
            category: '',
            part: '',
            description: '',
            listPrice: '',
            gl: '',
            glName: ''
        }];
    }


    removeRow(event) {
        const index = event.currentTarget.dataset.index;
        const row = this.productRows[index];

        if (row.id) {
            this.deletedIds.push(row.id); // collect IDs for deletion
        }

        this.productRows.splice(index, 1);
        this.productRows = [...this.productRows];

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Row Deleted',
                message: `Row ${parseInt(index) + 1} marked for deletion.`,
                variant: 'error'
            })
        );
    }




    handleChange(event) {
        const index = event.target.dataset.index;
        const field = event.target.dataset.field;
        const value = event.detail.value;

        const updatedRows = [...this.productRows];
        updatedRows[index][field] = value;

        if (field === 'category') {
            // Set isNonInventory
            const isNonInv = value === 'Non-Inventory';
            updatedRows[index].isNonInventory = isNonInv;

            // Reset item if category changes
            updatedRows[index].item = '';
        }

        // 🔄 Call Apex only when item is selected and category is already selected
        if (field === 'item' && updatedRows[index].category && value) {
            getItemMaster({
                item: value,
                category: updatedRows[index].category
            })
                .then(data => {
                    if (data) {
                        updatedRows[index].part = data.Part_Number__c || '';
                        updatedRows[index].description = data.Description__c || '';
                        updatedRows[index].listPrice = data.List_Price_INR__c || '';
                        updatedRows[index].gl = data.GL__c || '';
                        updatedRows[index].glName = data.GL_Name__c || '';
                    } else {
                        // No match found, optionally clear fields
                        updatedRows[index].part = '';
                        updatedRows[index].description = '';
                        updatedRows[index].listPrice = '';
                        updatedRows[index].gl = '';
                        updatedRows[index].glName = '';
                    }
                    this.productRows = updatedRows;
                })
                .catch(error => {
                    console.error('❌ Error fetching item master:', error);
                });
        } else {
            this.productRows = updatedRows;
        }
    }

}
