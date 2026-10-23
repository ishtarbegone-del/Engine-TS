/**
 * Compare rs2004 F12 LOCS/TILES at Draynor bank to exported maps/48_50.json.
 * Focus: buildings (walls/scenery/decor), roads (overlays), ground nodes (gdecor).
 * Stairs deferred — report stair-like types but do not fail on them.
 *
 * Usage (from engine/):
 *   npx tsx tools/vr/CompareMap50Dump.ts
 */
import fs from 'fs';
import path from 'path';

const DUMP =
	process.argv[2] ??
	'../vr-client/debug-dumps/rs2004/2026-09-12/220214-3112-3229/tick-0025/dump.txt';
const MAP = process.argv[3] ?? '../vr-client/assets/rs/maps/48_50.json';

const STAIR_TYPES = new Set([1738, 1739, 1740, 2147, 2148]);

type DumpLoc = {
	type: number;
	shape: number;
	angle: number;
	level: number;
	x: number;
	z: number;
	kind: string;
};

function parseDumpLocs(text: string): DumpLoc[] {
    const out: DumpLoc[] = [];
    for (const line of text.split(/\r?\n/)) {
        if (!line.startsWith('loc ')) {
            continue;
        }
        const type = num(line, /type=([-\d]+)/);
        const shape = num(line, /shape=([-\d]+)/);
        const angle = num(line, /angle=([-\d]+)/);
        const level = num(line, /level=([-\d]+)/) ?? 0;
        const at = line.match(/at\s+(-?\d+)\s*,\s*(-?\d+)/);
        const kindM = line.match(/kind=(\w+)/);
        if (type === null || shape === null || angle === null || !at) {
            continue;
        }
        out.push({
            type,
            shape,
            angle: angle % 4,
            level,
            x: Number(at[1]),
            z: Number(at[2]),
            kind: kindM?.[1] ?? ''
        });
    }
    return out;
}

function num(line: string, re: RegExp): number | null {
    const m = line.match(re);
    return m ? Math.trunc(Number(m[1])) : null;
}

function key(l: { type: number; shape: number; angle: number; level: number; x: number; z: number }): string {
    return `${l.type}:${l.shape}:${l.angle}:${l.level}:${l.x},${l.z}`;
}

function isBuildingOrNode(l: DumpLoc): boolean {
    if (STAIR_TYPES.has(l.type)) {
        return false;
    }
    // walls, scenery, decor, gdecor — bank/mill/road furniture
    return l.kind === 'wall' || l.kind === 'scenery' || l.kind === 'decor' || l.kind === 'gdecor' || l.kind === '';
}

const dumpText = fs.readFileSync(path.resolve(DUMP), 'utf8');
const map = JSON.parse(fs.readFileSync(path.resolve(MAP), 'utf8')) as {
	mx: number;
	mz: number;
	overlay: number[][][];
	overlayShape: number[][][];
	overlayRotation: number[][][];
	height: number[][][];
	heightOp?: number[][][];
	locs: Array<{ type: number; shape: number; angle: number; level: number; x: number; z: number }>;
};

const dumpLocs = parseDumpLocs(dumpText).filter(isBuildingOrNode);
const mapByKey = new Map<string, (typeof map.locs)[0]>();
for (const loc of map.locs) {
    mapByKey.set(
        key({
            type: loc.type,
            shape: loc.shape,
            angle: loc.angle % 4,
            level: loc.level,
            x: loc.x,
            z: loc.z
        }),
        loc
    );
}

let missing = 0;
let matched = 0;
const missingSamples: string[] = [];
const angleMismatch: string[] = [];

for (const d of dumpLocs) {
    const k = key(d);
    if (mapByKey.has(k)) {
        matched++;
        continue;
    }
    // Same type/x/z/level/shape but wrong angle?
    const soft = map.locs.find(
        l => l.type === d.type && l.x === d.x && l.z === d.z && l.level === d.level && l.shape === d.shape
    );
    if (soft) {
        angleMismatch.push(
            `type=${d.type} shape=${d.shape} at ${d.x},${d.z} L${d.level} dumpAngle=${d.angle} mapAngle=${soft.angle % 4}`
        );
        continue;
    }
    missing++;
    if (missingSamples.length < 25) {
        missingSamples.push(`type=${d.type} kind=${d.kind} shape=${d.shape} angle=${d.angle} L${d.level} at ${d.x},${d.z}`);
    }
}

// Road / path overlays near bank (dump TILES ov>0)
const tileLines = dumpText.split(/\r?\n/).filter(l => l.startsWith('tile '));
let tileMatch = 0;
let tileMismatch = 0;
const tileSamples: string[] = [];
for (const line of tileLines) {
    const m = line.match(
        /^tile\s+(\d+),(\d+)\s+lx=\d+,\d+\s+ov=(\d+)\s+packed=(\d+)\s+rot=(\d+)/
    );
    if (!m) {
        continue;
    }
    const wx = Number(m[1]);
    const wz = Number(m[2]);
    const ov = Number(m[3]);
    const packed = Number(m[4]);
    const rot = Number(m[5]);
    if (wx < 3072 || wx >= 3136 || wz < 3200 || wz >= 3264) {
        continue;
    }
    const lx = wx - 3072;
    const lz = wz - 3200;
    const mapOv = map.overlay[0][lx][lz];
    const mapSh = map.overlayShape[0][lx][lz];
    const mapRot = map.overlayRotation[0][lx][lz];
    if (mapOv === ov && mapSh === packed && mapRot === rot) {
        tileMatch++;
    } else {
        tileMismatch++;
        if (tileSamples.length < 15) {
            tileSamples.push(
                `${wx},${wz} dump ov=${ov} packed=${packed} rot=${rot} map ov=${mapOv} sh=${mapSh} rot=${mapRot}`
            );
        }
    }
}

console.log(`map ${map.mx}_${map.mz} locs=${map.locs.length}`);
console.log(`dump building/node locs=${dumpLocs.length} matched=${matched} missing=${missing} angleSoft=${angleMismatch.length}`);
if (missingSamples.length) {
    console.log('MISSING samples:');
    for (const s of missingSamples) {
        console.log('  ' + s);
    }
}
if (angleMismatch.length) {
    console.log(`ANGLE mismatches (${Math.min(angleMismatch.length, 15)}):`);
    for (const s of angleMismatch.slice(0, 15)) {
        console.log('  ' + s);
    }
}
console.log(`TILES in 48_50: match=${tileMatch} mismatch=${tileMismatch}`);
if (tileSamples.length) {
    console.log('TILE mismatch samples:');
    for (const s of tileSamples) {
        console.log('  ' + s);
    }
}

const ok = missing === 0 && angleMismatch.length === 0 && tileMismatch === 0;
console.log(ok ? 'VERIFY 48_50 dump parity OK' : 'VERIFY 48_50 dump parity FAIL');
process.exit(ok ? 0 : 1);
