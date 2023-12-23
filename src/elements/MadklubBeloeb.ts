import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Beloeb, beloebToString } from "../model";

@customElement('madklub-beloeb')
export class MadklubBeloeb extends LitElement {

    @property({ type: Boolean })
    negate = false;

    @property({ type: Object })
    beloeb?: Beloeb;

    @state()
    private _copied = false;

    renderRoot = this;

    render() {
        if (!this.beloeb)
            return;
        return html`
            <span style="position:relative" title="Kopier beløb" @click=${this._click} class="beloeb">
                ${beloebToString(this.beloeb, this.negate)}
                ${this._copied ? html`
                <div
                    style="z-index:100; position:absolute; right:-46px; top:-1px; background-color:white; white-space: nowrap; padding-left: 3px; padding-right: 3px; border: 1px solid black; border-radius: 3px;">
                    <span> ${beloebToString(this.beloeb, this.negate)} kopieret <i class="fa-solid fa-check"></i> </span>
                </div>
                ` : html``}
            </span>

        `
    }

    private _click = () => {
        this._copied = true;
        setTimeout(() => this._copied = false, 800);
        navigator.clipboard.writeText(beloebToString(this.beloeb));
    }

}