import fs from 'fs';
import path from 'path';

const VR = path.resolve(process.argv[2] ?? '../vr-client/debug-dumps/2026-09-04-235842-3093-3108');
const RS = path.resolve(process.argv[3] ?? '../vr-client/debug-dumps/rs2004/20260904-224635-3096-3105');

type LocKey = string;

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

function parseLocs(text: string): Map<LocKey, string> {
    const out = new Map<LocKey, string>();
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
        const key = `${type}:${shape}:${angle}:${at[1]},${at[2]}`;
        out.set(key, line);
    }
    return out;
}

function num(line: string, re: RegExp): number | null {
    const m = line.match(re);
    return m ? Math.trunc(Number(m[1])) : null;
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
