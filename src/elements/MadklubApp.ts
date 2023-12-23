import './MadklubOversigt';
import './MadklubOpretTraef';
import './MadklubOpretMedlem';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Land, model, regn, Traef } from '../model';
import { getToken } from '@fmma-npm/http-client';
import { getFlag } from '../functions/countryColors';

@customElement('madklub-app')
export class MadklubApp extends LitElement {

    renderRoot = this;

    @state() menuSlice = 3;

    @state()
    private traef = this.getTraef();

    private _hashChanged = () => {
        this.traef = this.getTraef();
    }

    private _modelChanged = () => {
        this._hashChanged();
        this.requestUpdate();
    }

    private getTraef() {
        const traf = model.traef.find(x => x.hash === window.location.hash);
        if (traf) {
            traf.udregning = regn(traf);
        }
        return traf;
    }

    connectedCallback(): void {
        window.addEventListener('hashchange', this._hashChanged);
        window.addEventListener('madklub-model-changed', this._modelChanged);
        super.connectedCallback();
    }

    disconnectedCallback(): void {
        window.removeEventListener('hashchange', this._hashChanged);
        window.removeEventListener('madklub-model-changed', this._modelChanged);
        super.disconnectedCallback();
    }

    render() {
        return html`
            <div style="margin: 5px">
                <h1><a href="#">Den Kulturelle Madklub</a></h1>
                <nav>
                    ${this.renderMenu()}
                </nav>
                <div>
                    ${this.renderPage()}
                </div>
            </div>
        `
    }

    private _renderFlagIcon(land: Land) {

        if (!land?.landekode)
            return;

        return getFlag(land.landekode);
    }

    renderPage() {
        return html`
            <madklub-oversigt .traef=${this.traef}></madklub-oversigt>
            <madklub-opret-traef></madklub-opret-traef>
            <madklub-opret-medlem></madklub-opret-medlem>
            <button style="margin-top:100px" @click=${async (e: Event) => {
                const token = await getToken("Redigering kræver adgangskode");
                if (!token)
                    return;

                const styles = `
                .editmode {
                display: unset !important
                }
                `

                var styleTag = document.getElementById('styles') as any;

                var sheet = styleTag.sheet ? styleTag.sheet : styleTag.styleSheet as CSSStyleSheet;
                const i = [...sheet.rules].findIndex((x: any) => x.selectorText === '.editmode')
                sheet.deleteRule(i);
                const eventTarget = e.composedPath()[0];
                (eventTarget as HTMLElement)?.remove();
            }}> Rediger </button>
        `
    }

    renderMenu() {
        let traef = model.traef.map(x => x).sort((a, b) => b.dato.getTime() - a.dato.getTime())

        const showMoreButtons = traef.length > this.menuSlice;
        return html`
            ${traef.slice(0, this.menuSlice).map(this._renderMenuItem)}
            ${showMoreButtons ? html`<a href="#" class="menu-item" @click=${this._visFlere}> Vis flere </a>` : undefined}
        `;
    }

    private _visFlere = (e: Event) => {
        e.preventDefault();
        this.menuSlice = Number.MAX_SAFE_INTEGER;
    }

    private _renderMenuItem = (traef: Traef, i: number) => {
        const title = traef.lande.map((x,i) => html`${i === 0 ? '' : ' & '} ${x.v} ${this._renderFlagIcon(x)}`)
        return html`<a class="menu-item${traef === this.traef ? ' current' : ''}" href="${traef.hash}"> ${title}</a>`;
    }
}