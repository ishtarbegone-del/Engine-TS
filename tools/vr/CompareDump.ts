import fs from 'fs';
import path from 'path';

const VR = path.resolve(process.argv[2] ?? '../vr-client/debug-dumps/2026-09-04-235842-3093-3108');
const RS = path.resolve(process.argv[3] ?? '../vr-client/debug-dumps/rs2004/20260904-224635-3096-3105');

const LEVEL_HEIGHT = 1.875;
const FLOAT_SLACK = 0.05;

type LocKey = string;

type DumpLoc = {
    key: LocKey;
    line: string;
    type: number;
    shape: number;
    angle: number;
    x: number;
    z: number;
    level: number;
    y: number | null;
    shown: boolean | null;
};

function findDump(dir: string): string {
    const direct = path.join(dir, 'dump.txt');
    if (fs.existsSync(direct)) {
        return direct;
    }
    const ticks = fs.readdirSync(dir).filter(name => name.startsWith('tick-')).sort();
    for (const tick of ticks) {
        const p = path.join(dir, tick, 'dump.txt');
        if (fs.existsSync(p)) {
            return p;
        }
    }
    throw new Error(`no dump.txt under ${dir}`);
}

function isRoofShape(shape: number): boolean {
    return shape >= 12 && shape <= 21;
}

function isWallShape(shape: number): boolean {
    return shape <= 3 || shape === 9;
}

function parseLocs(text: string): Map<LocKey, DumpLoc> {
    const out = new Map<LocKey, DumpLoc>();
    for (const line of text.split(/\r?\n/)) {
        if (!line.startsWith('loc ')) {
            continue;
        }
        const type = num(line, /type=([-\d.]+)/);
        const shape = num(line, /shape=([-\d.]+)/);
        const angle = num(line, /angle=([-\d.]+)/);
        const at = line.match(/at\s+(-?\d+)\s*,\s*(-?\d+)/);
        if (type === null || shape === null || angle === null || !at) {
            continue;
        }
        const y = floatNum(line, /y=([-\d.]+)/);
        const level = num(line, /level=([-\d.]+)/) ?? 0;
        let shown: boolean | null = null;
        if (/\bshown\b/.test(line)) {
            shown = true;
        } else if (/\bhidden\b/.test(line)) {
            shown = false;
        }
        const key = `${type}:${shape}:${angle}:${at[1]},${at[2]}`;
        out.set(key, {
            key,
            line,
            type,
            shape,
            angle,
            x: Number(at[1]),
            z: Number(at[2]),
            level,
            y,
            shown
        });
    }
    return out;
}

function num(line: string, re: RegExp): number | null {
    const m = line.match(re);
    return m ? Math.trunc(Number(m[1])) : null;
}

function floatNum(line: string, re: RegExp): number | null {
    const m = line.match(re);
    if (!m) {
        return null;
    }
    const v = Number(m[1]);
    return Number.isFinite(v) ? v : null;
}

function wallTopNear(wallTop: Map<string, number>, tile: string): number | undefined {
    const hit = wallTop.get(tile);
    if (hit !== undefined) {
        return hit;
    }
    const [xs, zs] = tile.split(',');
    const x = Number(xs);
    const z = Number(zs);
    let best: number | undefined;
    for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ] as Array<[number, number]>) {
        const n = wallTop.get(`${x + dx},${z + dz}`);
        if (n !== undefined && (best === undefined || n > best)) {
            best = n;
        }
    }
    if (best !== undefined) {
        return best;
    }
    for (const v of wallTop.values()) {
        if (best === undefined || v > best) {
            best = v;
        }
    }
    return best;
}


function addWallTop(wallTop: Map<string, number>, loc: DumpLoc): void {
    if (!isWallShape(loc.shape) || loc.y === null) {
        return;
    }
    const tile = `${loc.x},${loc.z}`;
    const top = loc.y + LEVEL_HEIGHT;
    const prev = wallTop.get(tile);
    if (prev === undefined || top > prev) {
        wallTop.set(tile, top);
    }
}

function floatingRoofs(locs: Map<LocKey, DumpLoc>): string[] {
    const shownTop = new Map<string, number>();
    const l0Top = new Map<string, number>();
    for (const loc of locs.values()) {
        if (loc.shown === true) {
            addWallTop(shownTop, loc);
        }
        if (loc.level === 0) {
            addWallTop(l0Top, loc);
        }
    }
    const floats: string[] = [];
    for (const loc of locs.values()) {
        if (loc.shown !== true || !isRoofShape(loc.shape) || loc.y === null) {
            continue;
        }
        const tile = `${loc.x},${loc.z}`;
        const top = wallTopNear(shownTop, tile) ?? wallTopNear(l0Top, tile);
        if (top === undefined) {
            if (loc.level < 3) {
                continue;
            }
            floats.push(`FLOAT tile=${tile} type=${loc.type} level=${loc.level} y=${loc.y.toFixed(3)} wall_top=-inf`);
            continue;
        }
        if (loc.y > top + FLOAT_SLACK) {
            floats.push(`FLOAT tile=${tile} type=${loc.type} level=${loc.level} y=${loc.y.toFixed(3)} wall_top=${top.toFixed(3)}`);
        }
    }
    floats.sort();
    return floats;
}

const vrPath = findDump(VR);
const rsPath = findDump(RS);
const vr = parseLocs(fs.readFileSync(vrPath, 'utf8'));
const rs = parseLocs(fs.readFileSync(rsPath, 'utf8'));

const onlyVr: string[] = [];
const onlyRs: string[] = [];
for (const key of vr.keys()) {
    if (!rs.has(key)) {
        onlyVr.push(key);
    }
}
for (const key of rs.keys()) {
    if (!vr.has(key)) {
        onlyRs.push(key);
    }
}
onlyVr.sort();
onlyRs.sort();

console.log(`VR ${vrPath} locs=${vr.size}`);
console.log(`2004 ${rsPath} locs=${rs.size}`);
console.log(`match=${vr.size - onlyVr.length} only-vr=${onlyVr.length} only-2004=${onlyRs.length}`);
for (const key of onlyVr.slice(0, 40)) {
    console.log(`only-vr ${key}`);
}
for (const key of onlyRs.slice(0, 40)) {
    console.log(`only-2004 ${key}`);
}
if (onlyVr.length > 40 || onlyRs.length > 40) {
    console.log('(truncated)');
}

const floats = floatingRoofs(vr);
if (floats.length === 0) {
    console.log('FLOAT_ROOF (none)');
} else {
    console.log(`FLOAT_ROOF ${floats.length}`);
    for (const line of floats) {
        console.log(line);
    }
    process.exit(1);
}
