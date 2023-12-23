import { html, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { detailsClick } from '../functions/detailsBehaviour';
import { insertMedlem, Medlem, model } from '../model';

@customElement('madklub-opret-medlem')
export class MadklubOpretMedlem extends LitElement {

    renderRoot = this;

    @query('#medlem-navn') navnInput!: HTMLInputElement;

    render() {
        return html`
            <details @click=${detailsClick}  class="editmode">
                <summary class="menu-item">
                    Nyt medlem
                </summary>
                <div class="form">
                    <label> Navn <input id="medlem-navn" type="text"></label>
                    <button @click=${this._gem}> Gem </button>
                </div>
            </details>
        `;
    }

    private async _gem() {
        const navn = this.navnInput.value;

        if (!navn) {
            this.navnInput.setCustomValidity('Udfyld navn tak');
            this.navnInput.reportValidity();
            return;
        }

        if (model.medlemmer.find(x => x.v === navn)) {
            this.navnInput.setCustomValidity('Medlemmet er allerede oprettet. Du må gerne udfylde med efternavn også.');
            this.navnInput.reportValidity();
            return;
        }

        const medlem: Medlem = {
            k: 'medlem',
            v: navn
        };
        await insertMedlem(medlem);
        this.navnInput.value = '';
    }
}