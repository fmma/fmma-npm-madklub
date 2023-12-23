import { html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { mkBeleob, insertUdlaeg, Traef } from '../model';

@customElement('madklub-udlaeg')
export class MadklubUdlaeg extends LitElement {

    @property({ type: Object }) traef?: Traef

    @query('#udlaeg-deltager') deltagerInput!: HTMLSelectElement;
    @query('#udlaeg-fritekst') fritekstInput!: HTMLInputElement;
    @query('#udlaeg-beloeb') beloebInput!: HTMLInputElement;

    renderRoot = this;

    private _modelChanged = () => {
        this.requestUpdate();
    }

    connectedCallback(): void {
        window.addEventListener('madklub-model-changed', this._modelChanged);
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        window.removeEventListener('madklub-model-changed', this._modelChanged);
        super.disconnectedCallback();
    }

    render() {
        if (!this.traef) {
            return;
        }
        return html`
            <h2> Registrer udlæg</h2>
            <div class="form">
                <label>
                    Deltager
                    <select id="udlaeg-deltager">
                        ${this.traef?.deltagere.map(x => html`<option>${x.v}</option>`)}
                    </select>
                </label>
                <label>
                    Beløb
                    <input id="udlaeg-beloeb" type="number" min="1" step="any"> <!--  step="any" !-->
                </label>
                <label> Fritekst <textarea id="udlaeg-fritekst"></textarea></label>
                <button @click=${this._gem}> Gem </button>
            </div>
        `
    }

    private _gem = async () => {
        const deltager = this.traef?.deltagere.find(x => x.v === this.deltagerInput.value);
        const fritekst = this.fritekstInput.value;
        const beloeb = this.beloebInput.valueAsNumber;

        if (!this.traef)
            return;

        if (!deltager) {
            this.deltagerInput.setCustomValidity('Ukendt medlem?');
            this.deltagerInput.reportValidity();
            return
        }

        if (!beloeb) {
            this.beloebInput.setCustomValidity('Udfyld beløb tak');
            this.beloebInput.reportValidity();
            return;
        }

        const udlaeg = {
            beloeb: mkBeleob(beloeb),
            fritekst: fritekst,
            navn: deltager
        };
        await insertUdlaeg(this.traef, udlaeg);
        this.beloebInput.value = '';
        this.fritekstInput.value = '';
    }

}