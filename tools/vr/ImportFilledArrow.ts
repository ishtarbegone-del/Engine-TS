import fs from 'fs';
import path from 'path';

const SRC = process.argv[2] ?? 'C:\\Users\\mrspu\\Documents\\bronze_arrow_filled_2711.obj';
const DEST = path.resolve(process.argv[3] ?? '../vr-client/assets/rs/models/2711.glb');

const SHAFT: [number, number, number] = [0.293, 0.1221, 0.0195];
const TIP: [number, number, number] = [0.804, 0.498, 0.196];
const FLIGHT: [number, number, number] = [0.4395, 0.0293, 0.0293];

function colorForObject(name: string): [number, number, number] {
    const n = name.trim();
    if (n === 'Cylinder' || n.startsWith('Cylinder')) {
        return SHAFT;
    }
    if (n.startsWith('Cone.')) {
        return FLIGHT;
    }
    if (n === 'Cone' || n.startsWith('Cone')) {
        return TIP;
    }
    return SHAFT;
}

function parseObj(text: string): { pos: number[]; col: number[]; idx: number[] } {
    const verts: number[][] = [];
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    let color = SHAFT;
    const faceVert = (token: string): number[] => {
        const i = Number.parseInt(token.split('/')[0] ?? '0', 10);
        if (!Number.isFinite(i) || i === 0) {
            return [];
        }
        const vi = i > 0 ? i - 1 : verts.length + i;
        return verts[vi] ?? [];
    };
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line.startsWith('o ') || line.startsWith('g ')) {
            color = colorForObject(line.slice(2));
            continue;
        }
        if (line.startsWith('v ')) {
            const p = line.slice(2).trim().split(/\s+/).map(Number);
            if (p.length >= 3 && p.every(Number.isFinite)) {
                verts.push([p[0], p[1], p[2]]);
            }
            continue;
        }
        if (!line.startsWith('f ')) {
            continue;
        }
        const corners = line
            .slice(2)
            .trim()
            .split(/\s+/)
            .map(faceVert)
            .filter(p => p.length === 3);
        if (corners.length < 3) {
            continue;
        }
        for (let i = 1; i < corners.length - 1; i++) {
            const tri = [corners[0], corners[i], corners[i + 1]];
            if (tri[0] === tri[1] || tri[1] === tri[2] || tri[0] === tri[2]) {
                continue;
            }
            const base = pos.length / 3;
            for (const p of tri) {
                pos.push(p[0], p[1], p[2]);
                col.push(color[0], color[1], color[2], 1);
            }
            idx.push(base, base + 1, base + 2);
        }
    }
    return { pos, col, idx };
}

function writeColoredGlb(pos: number[], col: number[], idx: number[], name: string): Uint8Array {
    const pad = (n: number) => (4 - (n % 4)) % 4;
    const binParts: Uint8Array[] = [];
    const accessors: object[] = [];
    const bufferViews: object[] = [];
    let binSize = 0;
    const addView = (bytes: Uint8Array, target: number): number => {
        const off = binSize;
        binParts.push(bytes);
        bufferViews.push({ buffer: 0, byteOffset: off, byteLength: bytes.length, target });
        binSize += bytes.length + pad(bytes.length);
        return bufferViews.length - 1;
    };
    const posArr = Float32Array.from(pos);
    const colArr = Float32Array.from(col);
    const idxArr = Uint32Array.from(idx);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    const count = posArr.length / 3;
    for (let i = 0; i < count; i++) {
        for (let k = 0; k < 3; k++) {
            const v = posArr[i * 3 + k];
            if (v < min[k]) {
                min[k] = v;
            }
            if (v > max[k]) {
                max[k] = v;
            }
        }
    }
    const posView = addView(new Uint8Array(posArr.buffer), 34962);
    accessors.push({ bufferView: posView, componentType: 5126, count, type: 'VEC3', min, max });
    const colView = addView(new Uint8Array(colArr.buffer), 34962);
    accessors.push({ bufferView: colView, componentType: 5126, count: colArr.length / 4, type: 'VEC4' });
    const idxView = addView(new Uint8Array(idxArr.buffer), 34963);
    accessors.push({ bufferView: idxView, componentType: 5125, count: idxArr.length, type: 'SCALAR' });
    const gltf = {
        asset: { version: '2.0', generator: 'lostcity-vr-filled-arrow' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name }],
        meshes: [
            {
                primitives: [
                    {
                        attributes: { POSITION: 0, COLOR_0: 1 },
                        indices: 2,
                        mode: 4
                    }
                ]
            }
        ],
        accessors,
        bufferViews,
        buffers: [{ byteLength: 0 }]
    };
    const bin = new Uint8Array(binSize);
    let cursor = 0;
    for (const part of binParts) {
        bin.set(part, cursor);
        cursor += part.length + pad(part.length);
    }
    gltf.buffers[0].byteLength = bin.byteLength;
    const json = Buffer.from(JSON.stringify(gltf), 'utf8');
    const jsonPad = pad(json.length);
    const jsonChunk = json.length + jsonPad;
    const binPad = pad(bin.length);
    const binChunk = bin.length + binPad;
    const total = 12 + 8 + jsonChunk + 8 + binChunk;
    const out = Buffer.alloc(total);
    out.writeUInt32LE(0x46546c67, 0);
    out.writeUInt32LE(2, 4);
    out.writeUInt32LE(total, 8);
    out.writeUInt32LE(jsonChunk, 12);
    out.writeUInt32LE(0x4e4f534a, 16);
    json.copy(out, 20);
    out.writeUInt32LE(binChunk, 20 + jsonChunk);
    out.writeUInt32LE(0x004e4942, 24 + jsonChunk);
    Buffer.from(bin).copy(out, 28 + jsonChunk);
    return new Uint8Array(out);
}

if (!fs.existsSync(SRC)) {
    console.error(`Missing ${SRC}`);
    process.exit(1);
}

const parsed = parseObj(fs.readFileSync(SRC, 'utf8'));
if (parsed.idx.length === 0) {
    console.error('No faces in OBJ');
    process.exit(1);
}
fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, writeColoredGlb(parsed.pos, parsed.col, parsed.idx, 'model_2711'));
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < parsed.pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
        const v = parsed.pos[i + k];
        if (v < min[k]) {
            min[k] = v;
        }
        if (v > max[k]) {
            max[k] = v;
        }
    }
}
const span = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
console.log(`wrote ${DEST} tris=${parsed.idx.length / 3} span=${span.map(n => n.toFixed(4)).join(',')}`);
