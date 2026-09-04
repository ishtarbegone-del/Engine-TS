import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

const PORT = 43596;
const HOST = '127.0.0.1';
const OUT = path.resolve(import.meta.dir, '../../../vr-client/debug-dumps/rs2004');
const RADIUS = 12;

function safeName(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

function mapsquareKeys(wx: number, wz: number): string[] {
    const keys = new Set<string>();
    for (let z = wz - RADIUS; z <= wz + RADIUS; z++) {
        for (let x = wx - RADIUS; x <= wx + RADIUS; x++) {
            const key = `${x >> 6}_${z >> 6}`;
            if (key !== '48_148') {
                keys.add(key);
            }
        }
    }
    return [...keys].sort();
}

function locLinesFromDump(dump: string): string[] {
    const lines = dump.split(/\r?\n/);
    const start = lines.findIndex(line => line === 'LOCS');
    if (start < 0) {
        return [];
    }
    return lines.slice(start + 1).filter(line => line.startsWith('loc '));
}

function locCountLines(locLines: string[]): string[] {
    const counts = new Map<string, number>();
    const re = /kind=(\S+) type=(\d+).*shape=(\d+).*level=(\d+)/;
    for (const line of locLines) {
        const m = line.match(re);
        if (!m) {
            continue;
        }
        const key = `kind=${m[1]} type=${m[2]} shape=${m[3]} level=${m[4]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.keys()].sort().map(key => `n=${counts.get(key)} ${key}`);
}

function synthesizeGodotBuild(wx: number, wz: number, dump: string): string {
    const keys = mapsquareKeys(wx, wz);
    const lines: string[] = [
        `godot-build tile ${wx},${wz} radius=${RADIUS}`,
        `mapsquares ${keys.join(' ')}`,
        'never 48_148',
        '',
        'EXPORT from engine/'
    ];
    for (const key of keys) {
        lines.push(`npx tsx tools/vr/ExportGltf.ts ../vr-client/assets/rs ${key}`);
    }
    lines.push('');
    lines.push('GODOT');
    lines.push(`append ${keys.join(', ')} to ZONE_SQUARES in vr-client/scripts/WorldStreamer.gd`);
    lines.push(`LostCityVR.bat then F12 at ${wx},${wz}`);
    lines.push('compare this folder to vr-client/debug-dumps/');
    lines.push('');
    lines.push('RULES');
    lines.push('do not invent locs');
    lines.push('if LOCS has no wall loc it is a 2004 gap');
    lines.push('walk uses _edges only (shape 0/9 one side, 1/3 none, 2 both)');
    lines.push('keep cook-east overlay 22');
    lines.push('do not flatten height');
    lines.push('loc-edits.json only after comparing this dump');
    lines.push('');
    const locLines = locLinesFromDump(dump);
    lines.push('COUNTS');
    if (locLines.length === 0) {
        lines.push('(none)');
    } else {
        lines.push(...locCountLines(locLines));
    }
    lines.push('');
    lines.push('LOCS');
    lines.push(...(locLines.length > 0 ? locLines : ['(none)']));
    return lines.join('\n') + '\n';
}

const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

const server = Bun.serve({
    hostname: HOST,
    port: PORT,
    async fetch(req) {
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors });
        }
        if (req.method !== 'POST' || new URL(req.url).pathname !== '/capture') {
            return new Response('not found', { status: 404, headers: cors });
        }
        let body: {
            session?: string;
            tick?: number;
            wx?: number;
            wz?: number;
            dump?: string;
            build?: string;
            png?: string;
        };
        try {
            body = await req.json();
        } catch {
            return new Response('bad json', { status: 400, headers: cors });
        }
        const session = safeName(String(body.session ?? 'session'));
        const tick = Math.max(0, Math.min(9999, Number(body.tick) | 0));
        const wx = Number(body.wx) | 0;
        const wz = Number(body.wz) | 0;
        const dir = path.join(OUT, `${session}-${wx}-${wz}`, `tick-${String(tick).padStart(4, '0')}`);
        mkdirSync(dir, { recursive: true });
        const dump = String(body.dump ?? '');
        const build = String(body.build ?? '').trim() || synthesizeGodotBuild(wx, wz, dump);
        writeFileSync(path.join(dir, 'dump.txt'), dump, 'utf8');
        writeFileSync(path.join(dir, 'godot-build.txt'), build, 'utf8');
        if (body.png) {
            writeFileSync(path.join(dir, 'view.png'), Buffer.from(body.png, 'base64'));
        }
        console.log(`ref capture ${dir}`);
        return new Response('ok', { headers: cors });
    }
});

console.log(`Ref capture ingest ${HOST}:${PORT} -> ${OUT}`);
console.log(server.url.href);
