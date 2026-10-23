import fs from 'fs';
import path from 'path';

import Jagfile from '#/io/Jagfile.js';
import { hslToRgb, RsModelArchive, writeGlb, type UnpackedModel } from '#tools/vr/RsModel.js';

const OUT = path.resolve(process.argv[2] ?? '../vr-client/assets/rs/models');
const ids = process.argv.slice(3).map(Number).filter(n => Number.isFinite(n) && n >= 0);
const list = ids.length > 0 ? ids : [551, 2403, 2590];
// Cooked shrimp is un-recolored 2590. Raw 317 recol from fishing.obj.
const RAW_RECOL: [number, number][] = [
    [31201, 30419],
    [31041, 30319]
];

const jagPath = 'data/pack/client/models';
if (!fs.existsSync(jagPath)) {
    console.error(`Missing ${jagPath}`);
    process.exit(1);
}

function recolour(model: UnpackedModel, pairs: [number, number][]): UnpackedModel {
    const colour = new Int32Array(model.colour);
    for (let i = 0; i < colour.length; i++) {
        for (const [src, dst] of pairs) {
            if (colour[i] === src) {
                colour[i] = dst;
                break;
            }
        }
    }
    return { ...model, colour };
}

function writeObj(model: UnpackedModel, dest: string): void {
    const mtlPath = dest.replace(/\.obj$/i, '.mtl');
    const used = new Set<number>();
    const obj: string[] = [`# RS model ${model.id}`, `mtllib ${path.basename(mtlPath)}`, `o model_${model.id}`];
    for (let i = 0; i < model.points; i++) {
        obj.push(`v ${model.x[i] / 128} ${-model.y[i] / 128} ${model.z[i] / 128}`);
    }
    for (let f = 0; f < model.faces; f++) {
        const ia = model.a[f];
        const ib = model.b[f];
        const ic = model.c[f];
        if (ia < 0 || ib < 0 || ic < 0 || ia === ib || ib === ic || ia === ic) {
            continue;
        }
        const hsl = model.colour[f];
        used.add(hsl);
        obj.push(`usemtl hsl_${hsl}`);
        obj.push(`f ${ia + 1} ${ib + 1} ${ic + 1}`);
    }
    const mtl: string[] = [`# RS model ${model.id}`];
    for (const hsl of [...used].sort((a, b) => a - b)) {
        const [r, g, b] = hslToRgb(hsl);
        mtl.push(`newmtl hsl_${hsl}`, `Kd ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`, 'd 1', '');
    }
    fs.writeFileSync(dest, `${obj.join('\n')}\n`);
    fs.writeFileSync(mtlPath, `${mtl.join('\n')}\n`);
}

function writeSrcPair(model: UnpackedModel, cookedName: string, rawName: string): void {
    const srcDir = path.join(OUT, '_src');
    fs.mkdirSync(srcDir, { recursive: true });
    const cooked = model;
    const raw = recolour(model, RAW_RECOL);
    const cookedGlb = path.join(srcDir, `${cookedName}.glb`);
    const rawGlb = path.join(srcDir, `${rawName}.glb`);
    fs.writeFileSync(cookedGlb, writeGlb(cooked));
    fs.writeFileSync(rawGlb, writeGlb(raw));
    writeObj(cooked, path.join(srcDir, `${cookedName}.obj`));
    writeObj(raw, path.join(srcDir, `${rawName}.obj`));
    console.log(`wrote ${cookedGlb} and ${rawGlb} (plus .obj/.mtl)`);
}

if (process.argv.includes('--raw-beef-chicken')) {
    const docs = 'C:\\Users\\mrspu\\Documents';
    fs.mkdirSync(docs, { recursive: true });
    const meatArchive = new RsModelArchive(Jagfile.load(jagPath));
    const beef = meatArchive.load(2760);
    const chickenSrc = meatArchive.load(2498);
    if (!beef || beef.points === 0 || !chickenSrc || chickenSrc.points === 0) {
        console.error('missing raw beef or raw chicken model');
        process.exit(1);
    }
    const chicken = recolour(chickenSrc, [[15619, 22098]]);
    writeObj(beef, path.join(docs, 'raw_beef.obj'));
    writeObj(chicken, path.join(docs, 'raw_chicken.obj'));
    console.log(`wrote ${path.join(docs, 'raw_beef.obj')} points=${beef.points} faces=${beef.faces}`);
    console.log(`wrote ${path.join(docs, 'raw_chicken.obj')} points=${chicken.points} faces=${chicken.faces}`);
    process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
const archive = new RsModelArchive(Jagfile.load(jagPath));
for (const id of list) {
    const model = archive.load(id);
    if (!model || model.points === 0 || model.faces === 0) {
        console.error(`missing model ${id}`);
        continue;
    }
    const dest = path.join(OUT, `${id}.glb`);
    fs.writeFileSync(dest, writeGlb(model));
    console.log(`wrote ${dest} points=${model.points} faces=${model.faces}`);
    if (id === 2590) {
        writeSrcPair(model, 'shrimp_cooked', 'shrimp_raw');
    }
}
