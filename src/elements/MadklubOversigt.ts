import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Balance, beloebToString, deleteDeltager, deleteOverfoersel, deleteTraef, insertDeltager, insertOverfoersel, Medlem, model, Traef } from '../model';
import './MadklubBeloeb';
import './MadklubUdlaeg';

@customElement('madklub-oversigt')
export class MadklubOversigt extends LitElement {

    @property({ type: Object })
    traef?: Traef

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

    private _renderDeltager = (x: Medlem) => {
        const deltager = this.traef?.deltagere.find(y => y.v === x.v) != null;
        return html`<li class="${!deltager ? 'editmode' : '' }">${x.v} <input class="editmode" @click=${this._toggleDeltager(x)} type="checkbox" .checked=${deltager}> </li>`;
    }

    render() {
        if (this.traef == null)
            return nothing;
        return html`
            <div>
                ${
                    this.traef.lande.map((x,i) => html`
                        <div class="${x.landekode?.toLocaleLowerCase()} flag flag${i}_${this.traef?.lande.length}"></div>
                    `)
                }

                <span class="svaevende">
                    ${this.traef.dato.toLocaleDateString('da-DK')}
                </span>

                <p>${this.traef.fritekst}</p>

                <madklub-udlaeg .traef=${this.traef}></madklub-udlaeg>

                <h3> Deltagere (${this.traef.deltagere.length}) </h3>
                <ul>
                    ${model.medlemmer.map(this._renderDeltager)}
                </ul>

                <h3> Udlæg </h3>
                <ul>
                    ${this.traef.udlaeg.map(x => html`<li>${x.navn.v} <madklub-beloeb .beloeb=${x.beloeb}></madklub-beloeb> <span class="svaevende">${x.fritekst}</span></li>`)}
                </ul>
                <div>
                    Total: <madklub-beloeb .beloeb=${this.traef.udregning?.total}></madklub-beloeb>
                </div>
                <div>
                    Per mand: <madklub-beloeb .beloeb=${this.traef.udregning?.perMand}></madklub-beloeb>
                </div>
                <h3> Balance </h3>
                <ul>
                    ${this.traef.udregning?.balance.map(this._renderBalanceLinje)}
                </ul>
                <h3> Overførsler </h3>
                <ul>
                    ${this.traef.overfoersler.map(this._renderOverfoerselLinje)}
                </ul>
                <div>
                    Madklubskonto: <madklub-beloeb .beloeb=${this.traef.udregning?.konto}></madklub-beloeb>
                </div>
                <button class="editmode danger" @click=${this._deleteMadklub}> Slet madklubsaften </button>
            </div>
        `
    }

    private _deleteMadklub = () => {
        if(this.traef == null)
            return;
        if(confirm(`Er du sikker på at du vil slette ${this.traef.hash}`))
            return deleteTraef(this.traef);
    }

    private _renderBalanceLinje = (x: Balance) => {
        if (x.beloeb.v === 0) {
            return html`<li>${x.navn.v} stemmer <input class="editmode" type="checkbox" checked disabled></li>`;
        }
        else if (x.beloeb.v < 0) {
            return html`<li>${x.navn.v} skal betale <madklub-beloeb .beloeb=${x.beloeb} class="negativ" negate></madklub-beloeb> <input class="editmode" @click=${this._afstem(x)} type="checkbox"></li>`
        }
        else {
            return html`<li>${x.navn.v} skal modtage <madklub-beloeb .beloeb=${x.beloeb} class="positiv"></madklub-beloeb> <input class="editmode" @click=${this._afstem(x)} type="checkbox"></li>`
        }
    }

    private _renderOverfoerselLinje = (x: Balance) => {
        if (x.beloeb.v < 0) {
            return html`<li>${x.navn.v} har betalt <madklub-beloeb .beloeb=${x.beloeb} negate></madklub-beloeb> <span class="svaevende">${x.dato?.toLocaleDateString('da-DK')}</span> <i class="fa-solid fa-trash editmode" @click=${this._sletOverforsel(x)}></i> </li>`
        }
        else {
            return html`<li>${x.navn.v} har modtaget <madklub-beloeb .beloeb=${x.beloeb}></madklub-beloeb> <span class="svaevende">${x.dato?.toLocaleDateString('da-DK')}</span> <i
        class="fa-solid fa-trash editmode" @click=${this._sletOverforsel(x)}></i></li>`
        }
    }

    private _sletOverforsel = (x: Balance) => async () => {
        if (this.traef == null)
            return;
        if (confirm(`Er du sikker på at du vil slette overførslen ${beloebToString(x.beloeb)} ${x.beloeb.v < 0 ? 'fra' : 'til'} ${x.navn.v}?`))
            await deleteOverfoersel(this.traef, x);
    }

    private _afstem = (x: Balance) => async () => {
        if (this.traef == null)
            return;
        await insertOverfoersel(this.traef, x);
    }

    private _toggleDeltager = (deltager: Medlem) => async (e: Event) => {
        if (!this.traef)
            return;
        const i = this.traef.deltagere.findIndex(x => x.v === deltager.v);
        if (i === -1)
            await insertDeltager(this.traef, deltager);

        else {
            if (this.traef.udlaeg.find(x => x.navn.v === deltager.v)) {
                if (!confirm("Deltageren har udlæg. Disse vil blive slettet hvis medlemmet fjernes som deltager. Er det ok?")) {
                    e.preventDefault();
                    return;
                }
            }
            await deleteDeltager(this.traef, deltager);
        }
    }
}