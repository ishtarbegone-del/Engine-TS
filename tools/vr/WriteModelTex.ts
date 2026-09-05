import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const MODEL_DIR = path.resolve(process.argv[2] ?? '../vr-client/assets/rs/models');
const OUT = path.resolve(process.argv[3] ?? '../vr-client/assets/rs/model-tex.json');

export function glbFaceTexIds(buf: Buffer): number[] {
    if (buf.length < 28 || buf.readUInt32LE(0) !== 0x46546c67) {
        return [];
    }
    const jsonChunk = buf.readUInt32LE(12);
    const json = buf.subarray(20, 20 + jsonChunk).toString('utf8').split(String.fromCharCode(0)).join('').trim();
    let parsed: { meshes?: Array<{ primitives?: Array<{ extras?: { tex?: number } }> }> };
    try {
        parsed = JSON.parse(json);
    } catch {
        return [];
    }
    const ids = new Set<number>();
    for (const mesh of parsed.meshes ?? []) {
        for (const prim of mesh.primitives ?? []) {
            const tex = prim.extras?.tex;
            if (typeof tex === 'number' && tex >= 0) {
                ids.add(tex);
            }
        }
    }
    return [...ids].sort((a, b) => a - b);
}

export function writeModelTexJson(modelDir: string, outPath: string): number {
    if (!fs.existsSync(modelDir)) {
        return 0;
    }
    const texByModel: Record<string, number[]> = {};
    for (const name of fs.readdirSync(modelDir)) {
        if (!name.endsWith('.glb')) {
            continue;
        }
        const id = path.basename(name, '.glb');
        const tex = glbFaceTexIds(fs.readFileSync(path.join(modelDir, name)));
        if (tex.length > 0) {
            texByModel[id] = tex;
        }
    }
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(texByModel));
    return Object.keys(texByModel).length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const n = writeModelTexJson(MODEL_DIR, OUT);
    console.log(`Wrote ${OUT} models=${n}`);
}
