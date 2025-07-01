import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import { CloseActionScreenEvent } from "lightning/actions";

export default class AddMrfList extends LightningModal {
    @api recordId;

    handleSaveClick() {
        const child = this.template.querySelector('c-mrf-products');
        console.log('child',child);
        
        if (child) {
            child.save();
        }
    }

    handleClose() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
}
