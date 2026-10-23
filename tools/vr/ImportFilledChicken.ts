import fs from 'fs';
import path from 'path';

const SRC = process.argv[2] ?? 'C:\\Users\\mrspu\\Documents\\raw_chicken_filled2.obj';
const DEST = path.resolve(process.argv[3] ?? '../vr-client/assets/rs/models/raw_chicken_filled.glb');
const WHITE: [number, number, number] = [0.9922, 0.9922, 0.9922];
const PINK: [number, number, number] = [0.90, 0.58, 0.62];

function parseMtl(mtlPath: string): Map<string, [number, number, number]> {
    const colors = new Map<string, [number, number, number]>();
    if (!fs.existsSync(mtlPath)) {
        return colors;
    }
    let name = '';
    for (const raw of fs.readFileSync(mtlPath, 'utf8').split(/\r?\n/)) {
        const line = raw.trim();
        if (line.startsWith('newmtl ')) {
            name = line.slice(7).trim();
            continue;
        }
        if (!line.startsWith('Kd ') || name === '') {
            continue;
        }
        const p = line.slice(3).trim().split(/\s+/).map(Number);
        if (p.length >= 3 && p.every(Number.isFinite)) {
            colors.set(name, [p[0], p[1], p[2]]);
        }
    }
    return colors;
}

function colorFor(colors: Map<string, [number, number, number]>, name: string): [number, number, number] {
    if (colors.has(name)) {
        return colors.get(name) as [number, number, number];
    }
    const base = name.replace(/\.\d+$/, '');
    if (colors.has(base)) {
        return colors.get(base) as [number, number, number];
    }
    return WHITE;
}

type Vec3 = [number, number, number];

function parseIndex(token: string, count: number): number {
    const i = Number.parseInt(token, 10);
    if (!Number.isFinite(i) || i === 0) {
        return -1;
    }
    return i > 0 ? i - 1 : count + i;
}

function add(a: Vec3, b: Vec3): void {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
}

function norm(a: Vec3): Vec3 {
    const len = Math.hypot(a[0], a[1], a[2]);
    if (len < 1e-8) {
        return [0, 1, 0];
    }
    return [a[0] / len, a[1] / len, a[2] / len];
}

function faceNormal(verts: Vec3[], corners: number[]): Vec3 {
    const a = verts[corners[0]];
    const b = verts[corners[1]];
    const c = verts[corners[2]];
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    return norm([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]);
}

function parseObj(text: string, colors: Map<string, [number, number, number]>): { pos: number[]; nrm: number[]; col: number[]; idx: number[] } {
    const verts: Vec3[] = [];
    const norms: Vec3[] = [];
    const faces: { color: Vec3; vi: number[]; ni: number[] }[] = [];
    let color: Vec3 = PINK;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line.startsWith('o ') || line.startsWith('g ')) {
            const name = line.slice(2).trim().toLowerCase();
            color = name.startsWith('bone') ? WHITE : PINK;
            continue;
        }
        if (line.startsWith('usemtl ')) {
            color = colorFor(colors, line.slice(7).trim());
            continue;
        }
        if (line.startsWith('v ')) {
            const p = line.slice(2).trim().split(/\s+/).map(Number);
            if (p.length >= 3 && p.every(Number.isFinite)) {
                verts.push([p[0], p[1], p[2]]);
            }
            continue;
        }
        if (line.startsWith('vn ')) {
            const p = line.slice(3).trim().split(/\s+/).map(Number);
            if (p.length >= 3 && p.every(Number.isFinite)) {
                norms.push(norm([p[0], p[1], p[2]]));
            }
            continue;
        }
        if (!line.startsWith('f ')) {
            continue;
        }
        const vi: number[] = [];
        const ni: number[] = [];
        for (const token of line.slice(2).trim().split(/\s+/)) {
            const bits = token.split('/');
            const v = parseIndex(bits[0] ?? '', verts.length);
            if (v < 0 || v >= verts.length) {
                continue;
            }
            vi.push(v);
            const n = bits.length > 2 ? parseIndex(bits[2] ?? '', norms.length) : -1;
            ni.push(n >= 0 && n < norms.length ? n : -1);
        }
        if (vi.length >= 3) {
            faces.push({ color, vi, ni });
        }
    }
    const acc: Vec3[] = verts.map(() => [0, 0, 0]);
    for (const face of faces) {
        const fn = faceNormal(verts, face.vi);
        for (let i = 0; i < face.vi.length; i++) {
            const n = face.ni[i] >= 0 ? norms[face.ni[i]] : fn;
            add(acc[face.vi[i]], n);
        }
    }
    const smooth = acc.map(norm);
    const pos: number[] = [];
    const nrm: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    for (const face of faces) {
        const corners = face.vi.length;
        for (let i = 1; i < corners - 1; i++) {
            const tri = [0, i, i + 1];
            const pts = tri.map(k => verts[face.vi[k]]);
            if (pts[0] === pts[1] || pts[1] === pts[2] || pts[0] === pts[2]) {
                continue;
            }
            const base = pos.length / 3;
            for (const k of tri) {
                const p = verts[face.vi[k]];
                const n = smooth[face.vi[k]];
                pos.push(p[0], p[1], p[2]);
                nrm.push(n[0], n[1], n[2]);
                col.push(face.color[0], face.color[1], face.color[2], 1);
            }
            idx.push(base, base + 1, base + 2);
        }
    }
    return { pos, nrm, col, idx };
}

function writeColoredGlb(pos: number[], nrm: number[], col: number[], idx: number[], name: string): Uint8Array {
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
    const nrmArr = Float32Array.from(nrm);
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
    const nrmView = addView(new Uint8Array(nrmArr.buffer), 34962);
    accessors.push({ bufferView: nrmView, componentType: 5126, count: nrmArr.length / 3, type: 'VEC3' });
    const colView = addView(new Uint8Array(colArr.buffer), 34962);
    accessors.push({ bufferView: colView, componentType: 5126, count: colArr.length / 4, type: 'VEC4' });
    const idxView = addView(new Uint8Array(idxArr.buffer), 34963);
    accessors.push({ bufferView: idxView, componentType: 5125, count: idxArr.length, type: 'SCALAR' });
    const gltf = {
        asset: { version: '2.0', generator: 'lostcity-vr-filled-chicken' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name }],
        meshes: [
            {
                primitives: [
                    {
                        attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 },
                        indices: 3,
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

const parsed = parseObj(fs.readFileSync(SRC, 'utf8'), parseMtl(SRC.replace(/\.obj$/i, '.mtl')));
if (parsed.idx.length === 0) {
    console.error('No faces in OBJ');
    process.exit(1);
}
fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, writeColoredGlb(parsed.pos, parsed.nrm, parsed.col, parsed.idx, 'raw_chicken_filled'));
console.log(`wrote ${DEST} tris=${parsed.idx.length / 3}`);
