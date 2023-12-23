import { configure, db } from '@fmma-npm/http-client';

configure({
    host: 'https://snesl.dk'
});

export type Land = { k: 'land', v: string, landekode?: string; };
export type Medlem = { k: 'medlem', v: string };
export type Beloeb = { k: 'beloeb', v: number };

export interface Udlaeg {
    navn: Medlem;
    beloeb: Beloeb;
    fritekst: string;
}

export interface Traef {
    hash: string;
    lande: Land[];
    dato: Date;
    deltagere: Medlem[];
    udlaeg: Udlaeg[];
    overfoersler: Balance[];
    fritekst: string;
    udregning?: Udregning;
}

export interface Model {
    medlemmer: Medlem[];
    traef: Traef[];
}

export interface Balance {
    navn: Medlem;
    beloeb: Beloeb;
    dato?: Date;
}

export interface Udregning {
    balance: Balance[];
    total: Beloeb;
    perMand: Beloeb;
    konto: Beloeb;
}

export function mkBeleob(v: number): Beloeb {
    return {
        k: 'beloeb',
        v: v < 0 ? Math.ceil(v * 100) : Math.floor(v * 100)
    }
}

export function beloebToString(b: Beloeb | undefined, negate = false): string {
    if (b == null)
        return '';
    const result = ((negate ? -b.v : b.v) / 100).toLocaleString('da-DK', { style: 'currency', currency: 'DKK' });
    if(result === 'NaN kr.')
        return '0,00 kr.';
    if(result === '-0,00 kr.')
        return '0,00 kr.';
    return result;

}

function emptyModel(): Model {
    return {
        medlemmer: [], traef: []
    };
}

export let model = emptyModel();
UpdateModelFromDb();

function saving() {
    window.dispatchEvent(new CustomEvent('madklub-model-saving'));
}

function modelChanged(newModel: Model) {
    model = newModel;
    console.log('modelChanged', newModel);
    window.dispatchEvent(new CustomEvent('madklub-model-changed'));
}

export async function UpdateModelFromDb() {
    const modelFromDb = await DbGetModel();
    if (modelFromDb) {
        modelChanged(modelFromDb);
    }
}

export async function insertUdlaeg(traef: Traef, udlaeg: Udlaeg) {
    await DbOpenpostUdlaeg(traef.hash, udlaeg);
    traef.udlaeg.push(udlaeg);
    traef.udregning = regn(traef);
    modelChanged(model);
}

export async function insertOverfoersel(traef: Traef, overfoersel: Balance) {
    overfoersel.dato = new Date();
    const model = await DbGetModel();
    if (!model)
        throw new Error('Kunne ikke kontakte databasen');
    const traefFromDb = model?.traef.find(x => x.hash === traef.hash);
    if (!traefFromDb)
        throw new Error('Madklubsaftenen er forsvundet!');
    traefFromDb.overfoersler.push(overfoersel);
    await DbSaveModel(model);
    traefFromDb.udregning = regn(traef);
    modelChanged(model);
}

export async function deleteOverfoersel(traef: Traef, overfoersel: Balance) {
    const model = await DbGetModel();
    if (!model)
        throw new Error('Kunne ikke kontakte databasen');
    const traefFromDb = model?.traef.find(x => x.hash === traef.hash);
    if (!traefFromDb)
        throw new Error('Madklubsaftenen er forsvundet!');
    const i = traefFromDb.overfoersler.findIndex(x => x.beloeb.v === overfoersel.beloeb.v && x.navn.v === overfoersel.navn.v && x.dato?.toDateString() === overfoersel.dato?.toDateString());
    if (i === -1)
        throw new Error('Overførslen var forsvundet!');

    traefFromDb.overfoersler.splice(i, 1);
    await DbSaveModel(model);
    traefFromDb.udregning = regn(traef);
    modelChanged(model);
}

export async function insertDeltager(traef: Traef, deltager: Medlem) {
    const model = await DbGetModel();
    if (!model)
        throw new Error('Kunne ikke kontakte databasen');
    const traefFromDb = model?.traef.find(x => x.hash === traef.hash);
    if (!traefFromDb)
        throw new Error('Madklubsaftenen er forsvundet!');
    traefFromDb.deltagere.push(deltager);
    await DbSaveModel(model);
    traefFromDb.udregning = regn(traef);
    modelChanged(model);
}

export async function insertMedlem(medlem: Medlem) {
    const model = await DbGetModel();
    if (!model)
        throw new Error('Kunne ikke kontakte databasen');
    if (model.medlemmer.find(x => x.v === medlem.v))
        throw new Error('Medlemmet findet allerede');
    model.medlemmer.push(medlem);
    await DbSaveModel(model);
    modelChanged(model);
}

export async function insertTraef(traef: Traef) {
    const model = await DbGetModel();
    if (!model)
        throw new Error('Kunne ikke kontakte databasen');
    if (model.traef.find(x => x.hash === traef.hash))
        throw new Error('Landet har allerede været besøgt');
    model.traef.push(traef);
    await DbSaveModel(model);
    modelChanged(model);
}

export async function deleteTraef(traef: Traef) {
    const model = await DbGetModel();
    if (!model)
        throw new Error('Kunne ikke kontakte databasen');
    const traefFromDb = model.traef.find(x => x.hash === traef.hash);
    if (!traefFromDb)
        throw new Error('Madklubsaftenen er forsvundet!');
    model.traef = model.traef.filter(x => x.hash !== traef.hash);
    await DbSaveModel(model);
    modelChanged(model);
}

export async function deleteDeltager(traef: Traef, deltager: Medlem) {
    const model = await DbGetModel();
    if (!model)
        throw new Error('Kunne ikke kontakte databasen');
    const traefFromDb = model?.traef.find(x => x.hash === traef.hash);
    if (!traefFromDb)
        throw new Error('Madklubsaftenen er forsvundet!');

    traefFromDb.deltagere = traefFromDb.deltagere.filter(x => x.v !== deltager.v);
    traefFromDb.udlaeg = traefFromDb.udlaeg.filter(x => x.navn.v !== deltager.v);
    await DbSaveModel(model);
    traefFromDb.udregning = regn(traef);
    modelChanged(model);
}

export async function DbGetModel() {
    const model = await db.getObject<Model>(`madklub`);
    console.log(model);
    return model;
}

export async function DbSaveModel(model: Model) {
    await db.putObject<Model>(`madklub`, model);
}

export async function DbOpenpostUdlaeg(traefHash: string, udlaeg: Udlaeg) {
    await db.openpostObject<{traefHash: string, udlaeg: Udlaeg}>(`madklub`, {traefHash, udlaeg});
}

export function regn(traef: Traef): Udregning {
    var map = new Map<string, number>();

    let total = 0;
    let konto = 0;

    for (const udlaeg of traef.udlaeg) {
        total += udlaeg.beloeb.v;
        let x = map.get(udlaeg.navn.v);
        if (x == null)
            x = 0;
        map.set(udlaeg.navn.v, x + udlaeg.beloeb.v);
    }

    const ikkeDeltagere = new Set<string>();

    for (const overfoersel of traef.overfoersler) {
        konto += overfoersel.beloeb.v;
        let x = map.get(overfoersel.navn.v);
        if (x == null)
            x = 0;
        map.set(overfoersel.navn.v, x - overfoersel.beloeb.v);

        if (!traef.deltagere.find(x => x.v === overfoersel.navn.v))
            ikkeDeltagere.add(overfoersel.navn.v);
    }

    const split = Math.floor(total / traef.deltagere.length);
    let splitter = total;
    const balance: Balance[] = [];

    for (const navn of traef.deltagere) {
        splitter -= split;
        balance.push({
            navn,
            beloeb: { k: 'beloeb', v: (map.get(navn.v) ?? 0) - split }
        });
    }
    for (const navn of ikkeDeltagere) {
        balance.push({
            navn: { k: 'medlem', v: navn },
            beloeb: { k: 'beloeb', v: (map.get(navn) ?? 0) }
        });

    }

    let i = 0;
    while (splitter > 0 && balance.length > 0) {
        balance[i].beloeb.v--;
        splitter--;
        i = (i + 1) % balance.length;
    }

    return {
        total: { k: 'beloeb', v: total },
        perMand: { k: 'beloeb', v: split },
        balance,
        konto: { k: 'beloeb', v: -konto }
    }
}