import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveMrfData from '@salesforce/apex/MrfListController.saveMrfList';
import { refreshApex } from '@salesforce/apex';

const FIELDS = [
    'MRF__c.Name',
    'MRF__c.Owner.Name',
    'MRF__c.Requested_Date__c'
];

export default class ProductDetails extends LightningElement {
    @api recordId;

    mrfName;
    ownerName;
    requestedDate;
    wiredRecordResult;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord(result) {
        this.wiredRecordResult = result;
        const { data, error } = result;
        if (data) {
            const fields = data.fields;
            this.mrfName = fields.Name?.value;
            this.ownerName =
                fields.Owner?.displayValue || fields.Owner?.value?.fields?.Name?.value;

            const rawDate = fields.Requested_Date__c?.value;
            this.requestedDate = rawDate
                ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(rawDate))
                : '';

        } else if (error) {
            console.error('❌ Error loading record:', JSON.stringify(error, null, 2));
        }
    }

    handleSave() {
        saveMrfData({ recordId: this.recordId })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'MRF data saved successfully',
                        variant: 'success'
                    })
                );

                // Refresh data by saving data in wiredRecordResult and then using it
                return refreshApex(this.wiredRecordResult);
            })
            .then(() => {
                // Notify parent to close modal
                this.dispatchEvent(new CustomEvent('close'));
            })
            .catch(error => {
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
