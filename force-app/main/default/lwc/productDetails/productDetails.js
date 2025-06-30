// Import necessary modules from LWC and Salesforce
import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi'; // For fetching record data
import { ShowToastEvent } from 'lightning/platformShowToastEvent'; // For showing toast messages
import saveMrfData from '@salesforce/apex/MrfListController.saveMrfList'; // Apex method to save MRF
import { refreshApex } from '@salesforce/apex'; // For refreshing wire data

// Define the fields to fetch from MRF__c object
const FIELDS = [
    'MRF__c.Name',
    'MRF__c.Owner.Name',
    'MRF__c.Requested_Date__c'
];

export default class ProductDetails extends LightningElement {
    @api recordId; // Record ID passed from parent (used to fetch MRF record)

    // Reactive tracked variables to hold MRF record details
    mrfName;
    ownerName;
    requestedDate;

    wiredRecordResult; // Holds the wire result for refreshing later

    // Wire adapter to get MRF record from Salesforce using the recordId and defined fields
    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord(result) {
        this.wiredRecordResult = result; // Save for later use in refreshApex
        const { data, error } = result;

        if (data) {
            const fields = data.fields;
            // Get MRF Name
            this.mrfName = fields.Name?.value;

            // Get Owner Name (check for display value or fallback to nested fields)
            this.ownerName =
                fields.Owner?.displayValue || fields.Owner?.value?.fields?.Name?.value;

            // Format Requested Date to "dd MMMM yyyy"
            const rawDate = fields.Requested_Date__c?.value;
            this.requestedDate = rawDate
                ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(rawDate))
                : '';
        } else if (error) {
            // Log any wire error
            console.error('❌ Error loading record:', JSON.stringify(error, null, 2));
        }
    }

    // Method to trigger saving of MRF data by calling Apex
    handleSave() {
        saveMrfData({ recordId: this.recordId })
            .then(() => {
                // Show success toast message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'MRF data saved successfully',
                        variant: 'success'
                    })
                );

                // Refresh the UI record data after save
                return refreshApex(this.wiredRecordResult);
            })
            .then(() => {
                // Notify the parent component/modal to close if needed
                this.dispatchEvent(new CustomEvent('close'));
            })
            .catch(error => {
                // Show error toast message
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error saving MRF',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}
