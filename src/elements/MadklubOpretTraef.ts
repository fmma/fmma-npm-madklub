import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { countryColors, sortedCodes } from '../functions/countryColors';
import { detailsClick } from '../functions/detailsBehaviour';
import { urlify } from '../functions/urlify';
import { insertTraef, Land, Traef } from '../model';

@customElement('madklub-opret-traef')
export class MadklubOpretTraef extends LitElement {

    renderRoot = this;

    @query('#dato') dateInput!: HTMLInputElement;
    @query('#fritekst') fritekstInput!: HTMLInputElement;
    @query('#land') landInput!: HTMLInputElement;
    @query('#landekode') landekodeInput!: HTMLInputElement;

    @state() lande: Land[] = [];

    render() {
        return html`
            <details @click=${detailsClick}  class="editmode">
                <summary class="menu-item">
                    Ny madklubsaften
                </summary>
                <div class="form">
                    <label> Lande
                        <select id="landekode" @change=${() => this.landInput.value = countryColors.get(this.landekodeInput.value.split('-')[0].trim())?.country ?? ''}>
                            <option></option>
                            ${sortedCodes.map(code => {
                                const l = countryColors.get(code);
                                if(l)
                                    return html`<option>${l.alpha2} - ${l.country}</option>`;
                            })}
                        </select>
                        <input id="land" type="text">
                        <button @click=${this._tilfoejLand}>Tilføj</button>
                        <ul>
                            ${this.lande.map(x => html`<li>${x.v} <i class="fa-solid fa-trash" @click=${this._sletLand(x)}></i></li>
                            `)}
                        </ul>
                    </label>
                    <label> Dato <input id="dato" type="date"></label>
                    <label> Fritekst <textarea id="fritekst"></textarea></label>
                    <button @click=${this._gem}> Gem </button>
                </div>

            </details>
        `
    }

    private _tilfoejLand = () => {
        const v = this.landInput.value;
        if (!v) {
            this.landInput.setCustomValidity('Udfyld land tak');
            this.landInput.reportValidity();
            return;
        }
        if (this.lande.find(x => x.v === v)) {
            this.landInput.setCustomValidity('Landet er allerede tilføjet');
            this.landInput.reportValidity();
            return;
        }
        this.lande = [...this.lande, { k: 'land', v, landekode: this.landekodeInput.value.split('-')[0].trim() || undefined }]
        this.landInput.value = "";
    }

    private _sletLand = (deltager: Land) => () => {
        this.lande = this.lande.filter(x => x.v !== deltager.v);
    }

    private async _gem() {
        const dato = this.dateInput.valueAsDate;
        const fritekst = this.fritekstInput.value;

        if (!dato) {
            this.dateInput.setCustomValidity('Udfyld dato tak');
            this.dateInput.reportValidity();
            return;
        }

        if (!this.lande[0]) {
            this.landInput.setCustomValidity("Indsæt mindst 1 land tak");
            this.landInput.reportValidity();
            return;
        }

        const traef: Traef = {
            dato,
            lande: this.lande,
            hash: `#${urlify(this.lande.map(x => x.v).join('+'))}`,
            deltagere: [],
            fritekst,
            udlaeg: [],
            overfoersler: []
        };
        await insertTraef(traef);
        this.dateInput.value = "";
        this.fritekstInput.value = "";
    }
}