import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { CloseActionScreenEvent } from "lightning/actions";

export default class AddMrfList extends LightningModal {
    // Receive recordId from the parent or modal launcher
    @api recordId;

    // Called when the Save button is clicked in the modal footer
    handleSaveClick() {
        // Access the child component <c-mrf-products>
        const child = this.template.querySelector('c-mrf-products');

        if (child) {
            // Call the public method 'save()' defined in c-mrf-products
            child.save();
        }
    }

    // Called when Back button is clicked or after save completes
    handleClose() {
        // Close the modal using the built-in CloseActionScreenEvent
        this.dispatchEvent(new CloseActionScreenEvent());
    }
}
