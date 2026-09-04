import Jagfile from '#/io/Jagfile.js';
import Packet from '#/io/Packet.js';

type Meta = {
    numPoints: number;
    numFaces: number;
    vertexOrderOffset: number;
    vertexXOffset: number;
    vertexYOffset: number;
    vertexZOffset: number;
    vertexLabelOffset: number;
    faceIndexOffset: number;
    faceIndexOrderOffset: number;
    faceColourOffset: number;
    faceRenderTypeOffset: number;
    facePriorityOffset: number;
    faceAlphaOffset: number;
};

export type UnpackedModel = {
    id: number;
    points: number;
    faces: number;
    x: Int32Array;
    y: Int32Array;
    z: Int32Array;
    a: Int32Array;
    b: Int32Array;
    c: Int32Array;
    colour: Int32Array;
    renderType: Int32Array | null;
};

export function hslToRgb(hsl: number): [number, number, number] {
    const h = ((hsl >> 10) & 0x3f) / 64;
    const s = ((hsl >> 7) & 0x7) / 8;
    const l = (hsl & 0x7f) / 128;

    if (s <= 0.001) {
        return [l, l, l];
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hk = h;
    const tr = hue2rgb(p, q, hk + 1 / 3);
    const tg = hue2rgb(p, q, hk);
    const tb = hue2rgb(p, q, hk - 1 / 3);
    return [tr, tg, tb];
}

function hue2rgb(p: number, q: number, t: number): number {
    let u = t;
    if (u < 0) {
        u += 1;
    }
    if (u > 1) {
        u -= 1;
    }
    if (u < 1 / 6) {
        return p + (q - p) * 6 * u;
    }
    if (u < 1 / 2) {
        return q;
    }
    if (u < 2 / 3) {
        return p + (q - p) * (2 / 3 - u) * 6;
    }
    return p;
}

export class RsModelArchive {
    private readonly meta: (Meta | null)[] = [];
    private readonly head: Packet | null;
    private readonly face1: Packet | null;
    private readonly face2: Packet | null;
    private readonly face3: Packet | null;
    private readonly face4: Packet | null;
    private readonly point1: Packet | null;
    private readonly point2: Packet | null;
    private readonly point3: Packet | null;
    private readonly point4: Packet | null;
    private readonly point5: Packet | null;
    private readonly vertex1: Packet | null;
    private readonly vertex2: Packet | null;

    constructor(jag: Jagfile) {
        this.head = jag.read('ob_head.dat');
        this.face1 = jag.read('ob_face1.dat');
        this.face2 = jag.read('ob_face2.dat');
        this.face3 = jag.read('ob_face3.dat');
        this.face4 = jag.read('ob_face4.dat');
        this.point1 = jag.read('ob_point1.dat');
        this.point2 = jag.read('ob_point2.dat');
        this.point3 = jag.read('ob_point3.dat');
        this.point4 = jag.read('ob_point4.dat');
        this.point5 = jag.read('ob_point5.dat');
        this.vertex1 = jag.read('ob_vertex1.dat');
        this.vertex2 = jag.read('ob_vertex2.dat');

        if (!this.head || !this.point1 || !this.point2 || !this.point3 || !this.point4 || !this.vertex1 || !this.vertex2 || !this.face1) {
            return;
        }

        const count = this.head.g2();
        let faceColourOffset = 0;
        let faceRenderTypeOffset = 0;
        let facePriorityOffset = 0;
        let faceAlphaOffset = 0;
        let vertexLabelOffset = 0;

        for (let i = 0; i < count; i++) {
            const id = this.head.g2();
            const meta: Meta = {
                numPoints: this.head.g2(),
                numFaces: this.head.g2(),
                vertexOrderOffset: this.point1.pos,
                vertexXOffset: this.point2.pos,
                vertexYOffset: this.point3.pos,
                vertexZOffset: this.point4.pos,
                faceIndexOffset: this.vertex1.pos,
                faceIndexOrderOffset: this.vertex2.pos,
                faceColourOffset,
                faceRenderTypeOffset: -1,
                facePriorityOffset: -1,
                faceAlphaOffset: -1,
                vertexLabelOffset: -1
            };

            this.head.g1(); // numT
            const hasInfo = this.head.g1();
            const priority = this.head.g1();
            const hasAlpha = this.head.g1();
            const hasSkins = this.head.g1();
            const hasLabels = this.head.g1();

            for (let v = 0; v < meta.numPoints; v++) {
                const flags = this.point1.g1();
                if ((flags & 0x1) !== 0) {
                    this.point2.gsmart();
                }
                if ((flags & 0x2) !== 0) {
                    this.point3.gsmart();
                }
                if ((flags & 0x4) !== 0) {
                    this.point4.gsmart();
                }
            }

            for (let f = 0; f < meta.numFaces; f++) {
                const type = this.vertex2.g1();
                if (type === 1) {
                    this.vertex1.gsmart();
                    this.vertex1.gsmart();
                }
                this.vertex1.gsmart();
            }

            faceColourOffset += meta.numFaces * 2;

            if (hasInfo === 1) {
                meta.faceRenderTypeOffset = faceRenderTypeOffset;
                faceRenderTypeOffset += meta.numFaces;
            }
            if (priority === 255) {
                meta.facePriorityOffset = facePriorityOffset;
                facePriorityOffset += meta.numFaces;
            }
            if (hasAlpha === 1) {
                meta.faceAlphaOffset = faceAlphaOffset;
                faceAlphaOffset += meta.numFaces;
            }
            if (hasSkins === 1) {
                // skip face labels in the index pass
            }
            if (hasLabels === 1) {
                meta.vertexLabelOffset = vertexLabelOffset;
                vertexLabelOffset += meta.numPoints;
            }

            this.meta[id] = meta;
        }
    }

    get ids(): number[] {
        return this.meta.map((m, id) => (m ? id : -1)).filter(id => id >= 0);
    }

    load(id: number): UnpackedModel | null {
        const meta = this.meta[id];
        if (!meta || !this.point1 || !this.point2 || !this.point3 || !this.point4 || !this.vertex1 || !this.vertex2 || !this.face1) {
            return null;
        }

        const model: UnpackedModel = {
            id,
            points: meta.numPoints,
            faces: meta.numFaces,
            x: new Int32Array(meta.numPoints),
            y: new Int32Array(meta.numPoints),
            z: new Int32Array(meta.numPoints),
            a: new Int32Array(meta.numFaces),
            b: new Int32Array(meta.numFaces),
            c: new Int32Array(meta.numFaces),
            colour: new Int32Array(meta.numFaces),
            renderType: null
        };

        this.point1.pos = meta.vertexOrderOffset;
        this.point2.pos = meta.vertexXOffset;
        this.point3.pos = meta.vertexYOffset;
        this.point4.pos = meta.vertexZOffset;

        let dx = 0;
        let dy = 0;
        let dz = 0;
        for (let v = 0; v < model.points; v++) {
            const order = this.point1.g1();
            let x = 0;
            let y = 0;
            let z = 0;
            if ((order & 0x1) !== 0) {
                x = this.point2.gsmart();
            }
            if ((order & 0x2) !== 0) {
                y = this.point3.gsmart();
            }
            if ((order & 0x4) !== 0) {
                z = this.point4.gsmart();
            }
            model.x[v] = dx + x;
            model.y[v] = dy + y;
            model.z[v] = dz + z;
            dx = model.x[v];
            dy = model.y[v];
            dz = model.z[v];
        }

        this.face1.pos = meta.faceColourOffset;
        if (meta.faceRenderTypeOffset >= 0 && this.face2) {
            model.renderType = new Int32Array(meta.numFaces);
            this.face2.pos = meta.faceRenderTypeOffset;
        }
        for (let f = 0; f < model.faces; f++) {
            model.colour[f] = this.face1.g2();
            if (model.renderType && this.face2) {
                model.renderType[f] = this.face2.g1();
            }
        }

        this.vertex1.pos = meta.faceIndexOffset;
        this.vertex2.pos = meta.faceIndexOrderOffset;
        let a = 0;
        let b = 0;
        let c = 0;
        let last = 0;
        for (let f = 0; f < model.faces; f++) {
            const order = this.vertex2.g1();
            if (order === 1) {
                a = this.vertex1.gsmart() + last;
                b = this.vertex1.gsmart() + a;
                c = this.vertex1.gsmart() + b;
                last = c;
            } else if (order === 2) {
                b = c;
                c = this.vertex1.gsmart() + last;
                last = c;
            } else if (order === 3) {
                a = c;
                c = this.vertex1.gsmart() + last;
                last = c;
            } else if (order === 4) {
                const tmp = a;
                a = b;
                b = tmp;
                c = this.vertex1.gsmart() + last;
                last = c;
            }
            model.a[f] = a;
            model.b[f] = b;
            model.c[f] = c;
        }

        return model;
    }
}

type FaceGroup = {
    tex: number;
    pos: number[];
    col: number[];
    uv: number[];
    idx: number[];
};

function faceTextureId(model: UnpackedModel, face: number): number {
    const info = model.renderType ? model.renderType[face] : 0;
    if ((info & 0x2) !== 0x2) {
        return -1;
    }
    const tex = model.colour[face];
    if (tex < 0 || tex > 49) {
        return -1;
    }
    return tex;
}

function planarUv(px: number, py: number, pz: number, nx: number, ny: number, nz: number): [number, number] {
    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    const az = Math.abs(nz);
    if (ay >= ax && ay >= az) {
        return [px, pz];
    }
    if (ax >= az) {
        return [pz, py];
    }
    return [px, py];
}

export function writeGlb(model: UnpackedModel): Uint8Array {
    const groups = new Map<number, FaceGroup>();
    const ensure = (tex: number): FaceGroup => {
        let group = groups.get(tex);
        if (!group) {
            group = { tex, pos: [], col: [], uv: [], idx: [] };
            groups.set(tex, group);
        }
        return group;
    };

    for (let f = 0; f < model.faces; f++) {
        const ia = model.a[f];
        const ib = model.b[f];
        const ic = model.c[f];
        if (ia < 0 || ib < 0 || ic < 0 || ia >= model.points || ib >= model.points || ic >= model.points) {
            continue;
        }
        if (ia === ib || ib === ic || ia === ic) {
            continue;
        }
        const pts = [
            [model.x[ia] / 128, -model.y[ia] / 128, model.z[ia] / 128],
            [model.x[ib] / 128, -model.y[ib] / 128, model.z[ib] / 128],
            [model.x[ic] / 128, -model.y[ic] / 128, model.z[ic] / 128]
        ];
        const e1x = pts[1][0] - pts[0][0];
        const e1y = pts[1][1] - pts[0][1];
        const e1z = pts[1][2] - pts[0][2];
        const e2x = pts[2][0] - pts[0][0];
        const e2y = pts[2][1] - pts[0][1];
        const e2z = pts[2][2] - pts[0][2];
        const nx = e1y * e2z - e1z * e2y;
        const ny = e1z * e2x - e1x * e2z;
        const nz = e1x * e2y - e1y * e2x;
        const tex = faceTextureId(model, f);
        const group = ensure(tex);
        const [r, g, b] = tex < 0 ? hslToRgb(model.colour[f]) : [1, 1, 1];
        const base = group.pos.length / 3;
        for (const p of pts) {
            group.pos.push(p[0], p[1], p[2]);
            if (tex >= 0) {
                const uv = planarUv(p[0], p[1], p[2], nx, ny, nz);
                group.uv.push(uv[0], uv[1]);
            } else {
                group.col.push(r, g, b);
            }
        }
        group.idx.push(base, base + 1, base + 2);
    }

    if (groups.size === 0) {
        throw new Error(`model ${model.id} has no valid faces`);
    }

    const pad = (n: number) => (4 - (n % 4)) % 4;
    const binParts: Uint8Array[] = [];
    const primitives: object[] = [];
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

    const bounds = (pos: Float32Array): { min: number[]; max: number[] } => {
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        const count = pos.length / 3;
        for (let i = 0; i < count; i++) {
            for (let k = 0; k < 3; k++) {
                const v = pos[i * 3 + k];
                if (v < min[k]) {
                    min[k] = v;
                }
                if (v > max[k]) {
                    max[k] = v;
                }
            }
        }
        return { min, max };
    };

    for (const group of groups.values()) {
        if (group.idx.length === 0) {
            continue;
        }
        const pos = Float32Array.from(group.pos);
        const idx = Uint32Array.from(group.idx);
        const { min, max } = bounds(pos);
        const posView = addView(new Uint8Array(pos.buffer), 34962);
        const posAcc = accessors.length;
        accessors.push({
            bufferView: posView,
            componentType: 5126,
            count: pos.length / 3,
            type: 'VEC3',
            min,
            max
        });
        const attributes: Record<string, number> = { POSITION: posAcc };
        if (group.tex >= 0) {
            const uv = Float32Array.from(group.uv);
            const uvView = addView(new Uint8Array(uv.buffer), 34962);
            attributes.TEXCOORD_0 = accessors.length;
            accessors.push({ bufferView: uvView, componentType: 5126, count: uv.length / 2, type: 'VEC2' });
        } else {
            const col = Float32Array.from(group.col);
            const colView = addView(new Uint8Array(col.buffer), 34962);
            attributes.COLOR_0 = accessors.length;
            accessors.push({ bufferView: colView, componentType: 5126, count: col.length / 3, type: 'VEC3' });
        }
        const idxView = addView(new Uint8Array(idx.buffer), 34963);
        const prim: Record<string, unknown> = {
            attributes,
            indices: accessors.length,
            mode: 4
        };
        accessors.push({ bufferView: idxView, componentType: 5125, count: idx.length, type: 'SCALAR' });
        if (group.tex >= 0) {
            prim.extras = { tex: group.tex };
        }
        primitives.push(prim);
    }

    if (primitives.length === 0) {
        throw new Error(`model ${model.id} has no valid faces`);
    }

    const bin = new Uint8Array(binSize);
    let cursor = 0;
    for (const part of binParts) {
        bin.set(part, cursor);
        cursor += part.length + pad(part.length);
    }

    const gltf = {
        asset: { version: '2.0', generator: 'lostcity-vr-export' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name: `model_${model.id}` }],
        meshes: [{ primitives }],
        accessors,
        bufferViews,
        buffers: [{ byteLength: bin.byteLength }]
    };

    const json = Buffer.from(JSON.stringify(gltf), 'utf8');
    const jsonPad = pad(json.length);
    const jsonChunk = json.length + jsonPad;
    const binPad = pad(bin.length);
    const binChunk = bin.length + binPad;
    const total = 12 + 8 + jsonChunk + 8 + binChunk;

    const out = Buffer.alloc(total);
    out.writeUInt32LE(0x46546c67, 0); // glTF
    out.writeUInt32LE(2, 4);
    out.writeUInt32LE(total, 8);
    out.writeUInt32LE(jsonChunk, 12);
    out.writeUInt32LE(0x4e4f534a, 16); // JSON
    json.copy(out, 20);
    out.writeUInt32LE(binChunk, 20 + jsonChunk);
    out.writeUInt32LE(0x004e4942, 24 + jsonChunk); // BIN
    Buffer.from(bin).copy(out, 28 + jsonChunk);
    return new Uint8Array(out);
}
