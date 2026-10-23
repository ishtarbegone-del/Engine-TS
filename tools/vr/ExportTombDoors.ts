import fs from 'fs';
import path from 'path';

import Jagfile from '#/io/Jagfile.js';
import { printError, printInfo } from '#/util/Logger.js';
import { RsModelArchive, UnpackedModel, writeGlb } from '#tools/vr/RsModel.js';

// Rashiliyia tomb doors (thzq_tombroom*, model 1762). Each fill state is baked here because the
// recess colours are told apart only by raw face HSL. Compiled LocType recol_s/recol_d values.
// Usage: npx tsx tools/vr/ExportTombDoors.ts ../vr-client/assets/rs [--inspect]

const OUT = path.resolve(process.argv[2] && !String(process.argv[2]).startsWith('--') ? process.argv[2] : '../vr-client/assets/rs');
const INSPECT = process.argv.includes('--inspect');
const DOOR_MODEL = 1762;
const FILLED = 5231;
// 900 leg (y 82-124), 902 arm (y 154-188), 898 skull (y 200-225).
const SLOTS = [900, 902, 898];

// thzq_tombrooml1 fills 900; thzq_tombroomr1 (mirror) fills 902 + 898.
const START_L = [900];
const START_R = [902, 898];
// Empty recesses in fill order: leg, arm, skull.
const FILL_ORDER: { side: 'L' | 'R'; colour: number }[] = [
    { side: 'R', colour: 900 },
    { side: 'L', colour: 902 },
    { side: 'L', colour: 898 }
];

// The right leaf is LocType mirror=yes; the client mirrors it with _rs_mirror_mesh.
function recolour(src: UnpackedModel, fill: number[]): UnpackedModel {
    const colour = Int32Array.from(src.colour);
    for (let f = 0; f < src.faces; f++) {
        if (fill.includes(colour[f])) {
            colour[f] = FILLED;
        }
    }
    return { ...src, colour };
}

function inspect(model: UnpackedModel): void {
    for (const slot of SLOTS) {
        let n = 0;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let f = 0; f < model.faces; f++) {
            if (model.colour[f] !== slot) {
                continue;
            }
            for (const v of [model.a[f], model.b[f], model.c[f]]) {
                sx += model.x[v];
                sy += -model.y[v];
                sz += model.z[v];
                minY = Math.min(minY, -model.y[v]);
                maxY = Math.max(maxY, -model.y[v]);
                n++;
            }
        }
        if (n === 0) {
            printInfo(`slot ${slot}: no faces`);
            continue;
        }
        printInfo(`slot ${slot}: faces=${n / 3} mean x=${(sx / n).toFixed(1)} y=${(sy / n).toFixed(1)} z=${(sz / n).toFixed(1)} y=[${minY},${maxY}]`);
    }
}

function main(): void {
    const jagPath = 'data/pack/client/models';
    if (!fs.existsSync(jagPath)) {
        printError(`Missing ${jagPath}`);
        return;
    }
    const archive = new RsModelArchive(Jagfile.load(jagPath));
    const model = archive.load(DOOR_MODEL);
    if (!model) {
        printError(`model ${DOOR_MODEL}: missing`);
        return;
    }
    inspect(model);
    if (INSPECT) {
        return;
    }
    const dir = path.join(OUT, 'models');
    for (let n = 0; n <= FILL_ORDER.length; n++) {
        const left = [...START_L];
        const right = [...START_R];
        for (let i = 0; i < n; i++) {
            const slot = FILL_ORDER[i];
            (slot.side === 'L' ? left : right).push(slot.colour);
        }
        for (const [side, fill] of [['L', left], ['R', right]] as const) {
            const dest = path.join(dir, `rashdoor_${side}${n}.glb`);
            fs.writeFileSync(dest, writeGlb(recolour(model, [...fill])));
            fs.writeFileSync(`${dest}.import`, '[remap]\nimporter="keep"\n');
        }
        printInfo(`rashdoor ${n}: L=${left.join(',')} R=${right.join(',')}`);
    }
}

main();
