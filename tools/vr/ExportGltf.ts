import fs from 'fs';
import path from 'path';

import FloType from '#/cache/config/FloType.js';
import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import Jagfile from '#/io/Jagfile.js';
import Packet from '#/io/Packet.js';
import { printError, printInfo } from '#/util/Logger.js';
import { RsModelArchive, lastWriteGlbSrc, modelHasFaceAlpha, modelTexIds, writeGlb } from '#tools/vr/RsModel.js';
import { writeModelTexJson } from '#tools/vr/WriteModelTex.js';
import SeqType from '#/cache/config/SeqType.js';
import SeqFrame from '#/cache/config/SeqFrame.js';
import AnimBase from '#/cache/graphics/AnimBase.js';
import AnimFrame from '#/cache/graphics/AnimFrame.js';

const OUT = path.resolve(process.argv[2] && !String(process.argv[2]).startsWith('--') ? process.argv[2] : '../vr-client/assets/rs');
const ONLY_SQUARE = process.argv[3] && !String(process.argv[3]).startsWith('--') ? process.argv[3] : '';
const ALPHA_ONLY = process.argv.includes('--alpha-models');
const MAPS_ONLY = process.argv.includes('--maps-only');
const MODELS_ARG_IDX = process.argv.findIndex(a => String(a).startsWith('--models'));
const MODELS_ARG = MODELS_ARG_IDX >= 0 ? process.argv[MODELS_ARG_IDX] : '';
const MODELS_INLINE = MODELS_ARG ? String(MODELS_ARG).replace('--models', '').replace(/^=/, '') : '';
const MODELS_LIST = MODELS_INLINE || (MODELS_ARG_IDX >= 0 ? String(process.argv[MODELS_ARG_IDX + 1] ?? '') : '');
const MODEL_IDS: number[] = MODELS_LIST
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isFinite(n));
const MODEL_DIR = path.join(OUT, 'models');
const MAP_DIR = path.join(OUT, 'maps');
const TEX_DIR = path.join(OUT, 'textures');
const TEXTURE_PACK = path.resolve('../content/pack/texture.pack');
const TEXTURE_SRC = path.resolve('../content/textures');
const LINK_BELOW = 0x2;

function unpackCoord(packed: number): { x: number; z: number; level: number } {
    return {
        z: packed & 0x3f,
        x: (packed >> 6) & 0x3f,
        level: (packed >> 12) & 0x3
    };
}

function packCoord(x: number, z: number, level: number): number {
    return (z & 0x3f) | ((x & 0x3f) << 6) | ((level & 0x3) << 12);
}

function ensureDir(dir: string): void {
    fs.mkdirSync(dir, { recursive: true });
}

function writeKeepImport(filePath: string): void {
    fs.writeFileSync(`${filePath}.import`, '[remap]\nimporter="keep"\n');
}

function exportCatalogs(): void {
    LocType.load('data/pack');
    NpcType.load('data/pack');
    ObjType.load('data/pack');

    const locs = [];
    for (let id = 0; id < LocType.count; id++) {
        const t = LocType.get(id);
        if (!t) {
            continue;
        }
        locs.push({
            id,
            name: t.name,
            models: t.models ? Array.from(t.models) : [],
            shapes: t.shapes ? Array.from(t.shapes) : [],
            ops: t.op ? [...t.op] : [],
            width: t.width,
            length: t.length,
            blockwalk: t.blockwalk,
            hillskew: t.hillskew,
            anim: t.anim ?? -1,
            hasalpha: t.hasalpha ?? false,
            offsetx: t.offsetx,
            offsety: t.offsety,
            offsetz: t.offsetz,
            resizex: t.resizex,
            resizey: t.resizey,
            resizez: t.resizez
        });
    }

    const npcs = [];
    for (let id = 0; id < NpcType.count; id++) {
        const t = NpcType.get(id);
        if (!t) {
            continue;
        }
        npcs.push({
            id,
            name: t.name,
            models: t.models ? Array.from(t.models) : [],
            ops: t.op ? [...t.op] : [],
            size: t.size,
            readyanim: t.readyanim ?? -1,
            walkanim: t.walkanim ?? -1,
            walkanim_b: t.walkanim_b ?? -1,
            walkanim_r: t.walkanim_r ?? -1,
            walkanim_l: t.walkanim_l ?? -1,
            recols:
                t.recol_s && t.recol_d
                    ? Array.from(t.recol_s).map((s, i) => [s, t.recol_d[i] as number])
                    : []
        });
    }

    const objs = [];
    for (let id = 0; id < ObjType.count; id++) {
        const t = ObjType.get(id);
        if (!t) {
            continue;
        }
        objs.push({
            id,
            name: t.name,
            model: t.model,
            ops: t.op ? [...t.op] : [],
            wearpos: t.wearpos,
            recol1s: t.recol_s && t.recol_s.length > 0 ? t.recol_s[0] : -1,
            recol1d: t.recol_d && t.recol_d.length > 0 ? t.recol_d[0] : -1
        });
    }

    FloType.load('data/pack');
    const flos = [];
    for (let id = 0; id < FloType.configs.length; id++) {
        const t = FloType.get(id);
        if (!t) {
            continue;
        }
        flos.push({
            id,
            land: id + 1,
            rgb: t.rgb,
            overlay: t.overlay,
            texture: typeof t.texture === 'number' ? t.texture : -1
        });
    }

    fs.writeFileSync(path.join(OUT, 'locs.json'), JSON.stringify(locs));
    fs.writeFileSync(path.join(OUT, 'npcs.json'), JSON.stringify(npcs));
    const rat = NpcType.get(950);
    if (rat) {
        printInfo(`npc 950 ${rat.name} ready=${rat.readyanim} walk=${rat.walkanim} models=${rat.models ? Array.from(rat.models).join(',') : '-'}`);
    }
    fs.writeFileSync(path.join(OUT, 'objs.json'), JSON.stringify(objs));
    fs.writeFileSync(path.join(OUT, 'flo.json'), JSON.stringify(flos));
    printInfo(`Wrote catalogs: ${locs.length} locs, ${npcs.length} npcs, ${objs.length} objs, ${flos.length} flos`);
}

function exportTextures(): number {
    ensureDir(TEX_DIR);
    if (!fs.existsSync(TEXTURE_PACK)) {
        printError(`Missing ${TEXTURE_PACK}`);
        return 0;
    }
    let copied = 0;
    for (const line of fs.readFileSync(TEXTURE_PACK, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^(\d+)=(.+)$/);
        if (!match) {
            continue;
        }
        const id = match[1];
        const name = match[2].trim();
        const src = path.join(TEXTURE_SRC, `${name}.png`);
        if (!fs.existsSync(src)) {
            printError(`missing texture ${id}=${name} at ${src}`);
            continue;
        }
        fs.copyFileSync(src, path.join(TEX_DIR, `${id}.png`));
        copied++;
    }
    printInfo(`Copied ${copied} textures to ${TEX_DIR}`);
    return copied;
}

function exportModelIds(ids: number[]): number {
    const jagPath = 'data/pack/client/models';
    if (!fs.existsSync(jagPath)) {
        printError(`Missing ${jagPath} — skip model meshes`);
        return 0;
    }
    const archive = new RsModelArchive(Jagfile.load(jagPath));
    let written = 0;
    const texByModel: Record<string, number[]> = {};
    const existingPath = path.join(OUT, 'model-tex.json');
    if (fs.existsSync(existingPath)) {
        try {
            Object.assign(texByModel, JSON.parse(fs.readFileSync(existingPath, 'utf8')) as Record<string, number[]>);
        } catch {
            // rewrite from this pass
        }
    }
    for (const id of ids) {
        try {
            const model = archive.load(id);
            if (!model || model.points === 0 || model.faces === 0) {
                printError(`model ${id}: empty`);
                continue;
            }
            const tex = modelTexIds(model);
            if (tex.length > 0) {
                texByModel[String(id)] = tex;
            }
            const dest = path.join(MODEL_DIR, `${id}.glb`);
            fs.writeFileSync(dest, writeGlb(model));
            writeKeepImport(dest);
            written++;
        } catch (err) {
            printError(`model ${id}: ${err}`);
        }
    }
    if (written > 0) {
        writeSidecar(texByModel);
    }
    printInfo(`Wrote ${written} requested glTF models`);
    return written;
}

function exportModels(): number {
    const jagPath = 'data/pack/client/models';
    if (!fs.existsSync(jagPath)) {
        printError(`Missing ${jagPath} — skip model meshes`);
        return 0;
    }

    const archive = new RsModelArchive(Jagfile.load(jagPath));
    let written = 0;
    const texByModel: Record<string, number[]> = {};
    for (const id of archive.ids) {
        try {
            const model = archive.load(id);
            if (!model || model.points === 0 || model.faces === 0) {
                continue;
            }
            const tex = modelTexIds(model);
            if (tex.length > 0) {
                texByModel[String(id)] = tex;
            }
            const glb = writeGlb(model);
            fs.writeFileSync(path.join(MODEL_DIR, `${id}.glb`), glb);
            written++;
        } catch (err) {
            printError(`model ${id}: ${err}`);
        }
    }
    writeSidecar(texByModel);
    printInfo(`Wrote ${written} glTF models`);
    return written;
}

function exportAlphaModels(): number {
    const jagPath = 'data/pack/client/models';
    if (!fs.existsSync(jagPath)) {
        printError(`Missing ${jagPath} — skip alpha model rewrite`);
        return 0;
    }
    const archive = new RsModelArchive(Jagfile.load(jagPath));
    let written = 0;
    const texByModel: Record<string, number[]> = {};
    const existing = path.join(OUT, 'model-tex.json');
    if (fs.existsSync(existing)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(existing, 'utf8')) as Record<string, number[]>;
            Object.assign(texByModel, parsed);
        } catch {
            // rewrite from this pass
        }
    }
    for (const id of archive.ids) {
        try {
            const model = archive.load(id);
            if (!model || model.points === 0 || model.faces === 0) {
                continue;
            }
            if (!modelHasFaceAlpha(model) && id !== 2116 && id !== 2136 && id !== 2137) {
                continue;
            }
            const tex = modelTexIds(model);
            if (tex.length > 0) {
                texByModel[String(id)] = tex;
            } else if (id === 2116) {
                texByModel['2116'] = [0];
            }
            fs.writeFileSync(path.join(MODEL_DIR, `${id}.glb`), writeGlb(model));
            written++;
        } catch (err) {
            printError(`alpha model ${id}: ${err}`);
        }
    }
    if (written > 0) {
        writeSidecar(texByModel);
    }
    printInfo(`Rewrote ${written} alpha glTF models`);
    return written;
}

function writeSidecar(texByModel: Record<string, number[]>): void {
    const dest = path.join(OUT, 'model-tex.json');
    fs.writeFileSync(dest, JSON.stringify(texByModel));
    printInfo(`Wrote model-tex.json models=${Object.keys(texByModel).length}`);
}

function exportMaps(): number {
    const src = 'data/pack/server/maps';
    if (!fs.existsSync(src)) {
        printError(`Missing ${src}`);
        return 0;
    }

    const files = fs.readdirSync(src).filter(name => name.startsWith('m') && name.includes('_'));
    let count = 0;

    for (const file of files) {
        const [mx, mz] = file.substring(1).split('_').map(Number);
        if (ONLY_SQUARE && `${mx}_${mz}` !== ONLY_SQUARE) {
            continue;
        }
        const mapsquareX = mx << 6;
        const mapsquareZ = mz << 6;
        const landPkt = Packet.load(path.join(src, file));
        const height: number[][][] = Array.from({ length: 4 }, () => Array.from({ length: 64 }, () => new Array(64).fill(0)));
        const heightOp: number[][][] = Array.from({ length: 4 }, () => Array.from({ length: 64 }, () => new Array(64).fill(0)));
        const underlay: number[][][] = Array.from({ length: 4 }, () => Array.from({ length: 64 }, () => new Array(64).fill(0)));
        const overlay: number[][][] = Array.from({ length: 4 }, () => Array.from({ length: 64 }, () => new Array(64).fill(0)));
        const overlayShape: number[][][] = Array.from({ length: 4 }, () => Array.from({ length: 64 }, () => new Array(64).fill(0)));
        const overlayRotation: number[][][] = Array.from({ length: 4 }, () => Array.from({ length: 64 }, () => new Array(64).fill(0)));
        const lands = new Int8Array(64 * 4 * 64);
        const linkBelow: number[][] = Array.from({ length: 64 }, () => new Array(64).fill(0));

        for (let level = 0; level < 4; level++) {
            for (let x = 0; x < 64; x++) {
                for (let z = 0; z < 64; z++) {
                    while (true) {
                        const opcode = landPkt.g1();
                        if (opcode === 0) {
                            break;
                        }
                        if (opcode === 1) {
                            heightOp[level][x][z] = 1;
                            height[level][x][z] = landPkt.g1();
                            break;
                        }
                        if (opcode <= 49) {
                            const packed = opcode - 2;
                            overlay[level][x][z] = landPkt.g1();
                            overlayShape[level][x][z] = packed >> 2;
                            overlayRotation[level][x][z] = packed & 0x3;
                        } else if (opcode <= 81) {
                            lands[packCoord(x, z, level)] = opcode - 49;
                        } else {
                            underlay[level][x][z] = opcode - 81;
                        }
                    }
                }
            }
        }

        for (let x = 0; x < 64; x++) {
            for (let z = 0; z < 64; z++) {
                if ((lands[packCoord(x, z, 1)] & LINK_BELOW) === LINK_BELOW) {
                    linkBelow[x][z] = 1;
                }
            }
        }

        const locs: object[] = [];
        const locPath = path.join(src, `l${mx}_${mz}`);
        if (fs.existsSync(locPath)) {
            const locPkt = Packet.load(locPath);
            let locId = -1;
            let locIdOffset = locPkt.gsmarts();
            while (locIdOffset !== 0) {
                locId += locIdOffset;
                let coord = 0;
                let coordOffset = locPkt.gsmarts();
                while (coordOffset !== 0) {
                    const unpacked = unpackCoord((coord += coordOffset - 1));
                    const info = locPkt.g1();
                    coordOffset = locPkt.gsmarts();
                    const packed = packCoord(unpacked.x, unpacked.z, unpacked.level);
                    const bridged =
                        (unpacked.level === 1 ? lands[packed] & LINK_BELOW : lands[packCoord(unpacked.x, unpacked.z, 1)] & LINK_BELOW) ===
                        LINK_BELOW;
                    const actualLevel = bridged ? unpacked.level - 1 : unpacked.level;
                    if (actualLevel < 0) {
                        continue;
                    }
                    locs.push({
                        type: locId,
                        x: mapsquareX + unpacked.x,
                        z: mapsquareZ + unpacked.z,
                        level: actualLevel,
                        rawLevel: unpacked.level,
                        shape: info >> 2,
                        angle: info & 0x3
                    });
                }
                locIdOffset = locPkt.gsmarts();
            }
        }

        const tile = { mx, mz, height, heightOp, underlay, overlay, overlayShape, overlayRotation, linkBelow, locs };
        fs.writeFileSync(path.join(MAP_DIR, `${mx}_${mz}.json`), JSON.stringify(tile));
        count++;
    }

    printInfo(`Wrote ${count} mapsquares`);
    return count;
}

function exportAnimCatalogs(): void {
    SeqFrame.load('data/pack');
    SeqType.load('data/pack');
    const seqs: Record<string, object> = {};
    for (let id = 0; id < SeqType.count; id++) {
        const t = SeqType.get(id);
        if (!t) {
            continue;
        }
        seqs[String(id)] = {
            frames: t.frames ? Array.from(t.frames) : [],
            iframes: t.iframes ? Array.from(t.iframes) : [],
            delay: t.delay ? Array.from(t.delay) : [],
            walkmerge: t.walkmerge ? Array.from(t.walkmerge) : null,
            loops: t.loops,
            duration: t.duration
        };
    }
    fs.writeFileSync(path.join(OUT, 'seqs.json'), JSON.stringify(seqs));
    writeKeepImport(path.join(OUT, 'seqs.json'));
    printInfo(`Wrote seqs.json n=${Object.keys(seqs).length}`);
    const giantReady = seqs['140'] as { frames?: number[] } | undefined;
    const giantWalk = seqs['137'] as { frames?: number[] } | undefined;
    printInfo(`seq 140 frames=${giantReady?.frames?.length ?? 0} seq 137 frames=${giantWalk?.frames?.length ?? 0}`);

    const jagPath = 'data/pack/client/models';
    if (!fs.existsSync(jagPath)) {
        printError(`Missing ${jagPath} — skip anim bases/frames`);
        return;
    }
    const jag = Jagfile.load(jagPath);
    AnimBase.unpack225(jag);
    AnimFrame.unpack225(jag);

    const usedFrames = new Set<number>();
    const usedBases = new Set<number>();
    for (const seq of Object.values(seqs) as { frames?: number[] }[]) {
        for (const fid of seq.frames ?? []) {
            if (fid >= 0) {
                usedFrames.add(fid);
            }
        }
    }

    const frames: Record<string, object> = {};
    for (const id of usedFrames) {
        const frame = AnimFrame.instances[id];
        if (!frame) {
            continue;
        }
        usedBases.add(frame.base);
        frames[String(id)] = {
            base: frame.base,
            delay: frame.delay,
            ti: Array.from(frame.groups),
            tx: Array.from(frame.x),
            ty: Array.from(frame.y),
            tz: Array.from(frame.z)
        };
    }

    const bases: Record<string, object> = {};
    for (const id of usedBases) {
        const base = AnimBase.instances[id];
        if (!base) {
            continue;
        }
        bases[String(id)] = {
            types: Array.from(base.types),
            labels: base.labels.map(row => Array.from(row))
        };
    }
    fs.writeFileSync(path.join(OUT, 'anim-bases.json'), JSON.stringify(bases));
    writeKeepImport(path.join(OUT, 'anim-bases.json'));
    printInfo(`Wrote anim-bases.json n=${Object.keys(bases).length}`);
    fs.writeFileSync(path.join(OUT, 'anim-frames.json'), JSON.stringify(frames));
    writeKeepImport(path.join(OUT, 'anim-frames.json'));
    printInfo(`Wrote anim-frames.json n=${Object.keys(frames).length}`);

    const archive = new RsModelArchive(jag);
    const npcModels = new Set<number>();
    for (let id = 0; id < NpcType.count; id++) {
        const t = NpcType.get(id);
        if (!t?.models) {
            continue;
        }
        for (const mid of t.models) {
            npcModels.add(mid);
        }
    }
    let labels = 0;
    for (const id of npcModels) {
        const model = archive.load(id);
        if (!model || !model.vertexLabel) {
            continue;
        }
        try {
            writeGlb(model);
        } catch {
            continue;
        }
        const payload = {
            id,
            points: model.points,
            x: Array.from(model.x),
            y: Array.from(model.y),
            z: Array.from(model.z),
            labels: Array.from(model.vertexLabel),
            glb_src: lastWriteGlbSrc
        };
        fs.writeFileSync(path.join(MODEL_DIR, `${id}.labels.json`), JSON.stringify(payload));
        writeKeepImport(path.join(MODEL_DIR, `${id}.labels.json`));
        labels++;
    }
    printInfo(`Wrote ${labels} model label sidecars`);
}

ensureDir(OUT);
ensureDir(MODEL_DIR);
if (MODEL_IDS.length > 0) {
    exportModelIds(MODEL_IDS);
    printInfo(`VR assets ready in ${OUT} (models ${MODEL_IDS.join(',')})`);
    process.exit(0);
}
ensureDir(MAP_DIR);
if (MAPS_ONLY) {
    exportMaps();
    printInfo(`VR assets ready in ${OUT}${ONLY_SQUARE ? ` (square ${ONLY_SQUARE})` : ''} (maps only)`);
    process.exit(0);
}
ensureDir(TEX_DIR);
if (!fs.existsSync(path.join(TEX_DIR, '0.png'))) {
    exportTextures();
}
exportCatalogs();
exportAnimCatalogs();
if (ALPHA_ONLY) {
    exportCatalogs();
    exportAlphaModels();
} else {
    if (!fs.existsSync(path.join(MODEL_DIR, '0.glb'))) {
        exportModels();
    }
    exportAlphaModels();
    if (!fs.existsSync(path.join(OUT, 'model-tex.json'))) {
        const n = writeModelTexJson(MODEL_DIR, path.join(OUT, 'model-tex.json'));
        printInfo(`Wrote model-tex.json from glbs models=${n}`);
    }
    exportMaps();
}
printInfo(`VR assets ready in ${OUT}${ONLY_SQUARE ? ` (square ${ONLY_SQUARE})` : ''}`);
