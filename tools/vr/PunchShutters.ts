import fs from 'fs';
import path from 'path';

import { printError, printInfo } from '#/util/Logger.js';

const OUT = path.resolve(process.argv[2] && !String(process.argv[2]).startsWith('--') ? process.argv[2] : '../vr-client/assets/rs');
const ZONE_SQUARES = ['48_48', '47_48', '48_47', '48_49', '49_48'];
const SHUTTER = 1838;
const WALL = 1902;
const INSET = 0;
const NUDGE = 0.02;
const THROUGH = 0.45;
const WALL_MODELS: Record<number, number> = { 0: 634, 1: 635, 2: 574, 3: 575, 9: 576 };

type Vec3 = { x: number; y: number; z: number };
type Vert = { p: Vec3; c?: [number, number, number, number]; uv?: [number, number] };
type Box = { min: Vec3; max: Vec3 };
type Prim = {
    pos: Vec3[];
    idx: number[];
    col: ([number, number, number, number] | null)[];
    uv: ([number, number] | null)[];
    tex: number;
};

function yawOf(angle: number): number {
    return (angle % 4) * Math.PI * 0.5;
}

function applyYaw(p: Vec3, yaw: number): Vec3 {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function intoWall(angle: number): Vec3 {
    switch (angle % 4) {
        case 0:
            return { x: -1, y: 0, z: 0 };
        case 1:
            return { x: 0, y: 0, z: 1 };
        case 2:
            return { x: 1, y: 0, z: 0 };
        default:
            return { x: 0, y: 0, z: -1 };
    }
}

function shutterFoot(angle: number): { x: number; z: number } {
    const step = 16 / 128;
    switch (angle % 4) {
        case 0:
            return { x: 0.5 + step, z: 0.5 };
        case 1:
            return { x: 0.5, z: 0.5 - step };
        case 2:
            return { x: 0.5 - step, z: 0.5 };
        default:
            return { x: 0.5, z: 0.5 + step };
    }
}

function add(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function sub(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(a: Vec3, s: number): Vec3 {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
}

function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

function inBox(p: Vec3, box: Box): boolean {
    return p.x >= box.min.x && p.x <= box.max.x && p.y >= box.min.y && p.y <= box.max.y && p.z >= box.min.z && p.z <= box.max.z;
}

function axisOf(p: Vec3, axis: number): number {
    return axis === 0 ? p.x : axis === 1 ? p.y : p.z;
}

function _setAxis(p: Vec3, axis: number, v: number): Vec3 {
    if (axis === 0) {
        return { x: v, y: p.y, z: p.z };
    }
    if (axis === 1) {
        return { x: p.x, y: v, z: p.z };
    }
    return { x: p.x, y: p.y, z: v };
}

function readGlb(file: string): Prim[] {
    const buf = fs.readFileSync(file);
    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8').replace(/\0/g, '').trim());
    const binStart = 20 + jsonLen + 8;
    const accessors = json.accessors as Array<Record<string, number | string>>;
    const views = json.bufferViews as Array<Record<string, number>>;
    const prims = json.meshes[0].primitives as Array<Record<string, unknown>>;
    const out: Prim[] = [];
    for (const prim of prims) {
        const attrs = prim.attributes as Record<string, number>;
        const extras = (prim.extras as Record<string, number>) ?? {};
        const posAcc = accessors[attrs.POSITION] as Record<string, number>;
        const posView = views[posAcc.bufferView];
        const posOff = binStart + (posView.byteOffset ?? 0) + (posAcc.byteOffset ?? 0);
        const pos: Vec3[] = [];
        for (let i = 0; i < (posAcc.count as number); i++) {
            const o = posOff + i * 12;
            pos.push({ x: buf.readFloatLE(o), y: buf.readFloatLE(o + 4), z: buf.readFloatLE(o + 8) });
        }
        const idxAcc = accessors[prim.indices as number] as Record<string, number>;
        const idxView = views[idxAcc.bufferView];
        const idxOff = binStart + (idxView.byteOffset ?? 0) + (idxAcc.byteOffset ?? 0);
        const idxSize = (idxAcc.componentType as number) === 5125 ? 4 : 2;
        const idx: number[] = [];
        for (let i = 0; i < (idxAcc.count as number); i++) {
            idx.push(idxSize === 4 ? buf.readUInt32LE(idxOff + i * 4) : buf.readUInt16LE(idxOff + i * 2));
        }
        const col: ([number, number, number, number] | null)[] = pos.map(() => null);
        if (attrs.COLOR_0 !== undefined) {
            const cAcc = accessors[attrs.COLOR_0] as Record<string, number | string>;
            const cView = views[cAcc.bufferView as number];
            const cOff = binStart + (cView.byteOffset ?? 0) + ((cAcc.byteOffset as number) ?? 0);
            const vec4 = cAcc.type === 'VEC4';
            const stride = vec4 ? 16 : 12;
            for (let i = 0; i < (cAcc.count as number); i++) {
                const o = cOff + i * stride;
                col[i] = [buf.readFloatLE(o), buf.readFloatLE(o + 4), buf.readFloatLE(o + 8), vec4 ? buf.readFloatLE(o + 12) : 1];
            }
        }
        const uv: ([number, number] | null)[] = pos.map(() => null);
        if (attrs.TEXCOORD_0 !== undefined) {
            const uAcc = accessors[attrs.TEXCOORD_0] as Record<string, number>;
            const uView = views[uAcc.bufferView];
            const uOff = binStart + (uView.byteOffset ?? 0) + (uAcc.byteOffset ?? 0);
            for (let i = 0; i < uAcc.count; i++) {
                uv[i] = [buf.readFloatLE(uOff + i * 8), buf.readFloatLE(uOff + i * 8 + 4)];
            }
        }
        out.push({ pos, idx, col, uv, tex: extras.tex ?? -1 });
    }
    return out;
}

function openingVerts(prims: Prim[]): Vec3[] {
    // 2116 gray is only the sill (y 0.875..1.0). The shutter opening is the
    // whole model; skip faces that are majority-black (unused cap verts).
    const verts: Vec3[] = [];
    for (const prim of prims) {
        for (let t = 0; t + 2 < prim.idx.length; t += 3) {
            const ia = prim.idx[t];
            const ib = prim.idx[t + 1];
            const ic = prim.idx[t + 2];
            const cols = [prim.col[ia], prim.col[ib], prim.col[ic]];
            let black = 0;
            for (const c of cols) {
                if (c && Math.max(c[0], c[1], c[2]) < 0.08) {
                    black++;
                }
            }
            if (black >= 2) {
                continue;
            }
            verts.push(prim.pos[ia], prim.pos[ib], prim.pos[ic]);
        }
    }
    return verts;
}

function emptyBox(): Box {
    return {
        min: { x: Infinity, y: Infinity, z: Infinity },
        max: { x: -Infinity, y: -Infinity, z: -Infinity }
    };
}

function expand(box: Box, p: Vec3): void {
    box.min.x = Math.min(box.min.x, p.x);
    box.min.y = Math.min(box.min.y, p.y);
    box.min.z = Math.min(box.min.z, p.z);
    box.max.x = Math.max(box.max.x, p.x);
    box.max.y = Math.max(box.max.y, p.y);
    box.max.z = Math.max(box.max.z, p.z);
}

function _boxSize(box: Box): Vec3 {
    return sub(box.max, box.min);
}

function insetFace(box: Box, into: Vec3): Box {
    const out: Box = { min: { ...box.min }, max: { ...box.max } };
    out.min.y += INSET - NUDGE;
    out.max.y -= INSET - NUDGE;
    if (Math.abs(into.x) > 0.5) {
        out.min.z += INSET - NUDGE;
        out.max.z -= INSET - NUDGE;
    } else {
        out.min.x += INSET - NUDGE;
        out.max.x -= INSET - NUDGE;
    }
    if (out.max.y - out.min.y < 0.02) {
        out.max.y = out.min.y + 0.02;
    }
    return out;
}

function throughWall(box: Box, into: Vec3): Box {
    const out: Box = { min: { ...box.min }, max: { ...box.max } };
    if (Math.abs(into.x) > 0.5) {
        out.min.x -= THROUGH;
        out.max.x += THROUGH;
    } else {
        out.min.z -= THROUGH;
        out.max.z += THROUGH;
    }
    return out;
}

function lerpVert(a: Vert, b: Vert, t: number): Vert {
    return {
        p: lerp(a.p, b.p, t),
        c: a.c && b.c ? [a.c[0] + (b.c[0] - a.c[0]) * t, a.c[1] + (b.c[1] - a.c[1]) * t, a.c[2] + (b.c[2] - a.c[2]) * t, a.c[3] + (b.c[3] - a.c[3]) * t] : a.c ?? b.c,
        uv: a.uv && b.uv ? [a.uv[0] + (b.uv[0] - a.uv[0]) * t, a.uv[1] + (b.uv[1] - a.uv[1]) * t] : a.uv ?? b.uv
    };
}

function planeInside(coord: number, value: number, insideGe: boolean): boolean {
    return insideGe ? coord >= value - 1e-5 : coord <= value + 1e-5;
}

function splitPoly(poly: Vert[], axis: number, value: number, insideGe: boolean): { inn: Vert[]; outp: Vert[] } {
    const inn: Vert[] = [];
    const outp: Vert[] = [];
    if (poly.length === 0) {
        return { inn, outp };
    }
    let prev = poly[poly.length - 1];
    let prevIn = planeInside(axisOf(prev.p, axis), value, insideGe);
    for (const cur of poly) {
        const curIn = planeInside(axisOf(cur.p, axis), value, insideGe);
        if (curIn !== prevIn) {
            const pc = axisOf(prev.p, axis);
            const cc = axisOf(cur.p, axis);
            const t = Math.abs(cc - pc) > 1e-7 ? (value - pc) / (cc - pc) : 0;
            const hit = lerpVert(prev, cur, Math.min(1, Math.max(0, t)));
            inn.push(hit);
            outp.push(hit);
        }
        if (curIn) {
            inn.push(cur);
        } else {
            outp.push(cur);
        }
        prev = cur;
        prevIn = curIn;
    }
    return { inn, outp };
}

function triOutside(a: Vert, b: Vert, c: Vert, box: Box): Vert[][] {
    let frags: Vert[][] = [[a, b, c]];
    const planes: [number, number, boolean][] = [
        [0, box.min.x, true],
        [0, box.max.x, false],
        [1, box.min.y, true],
        [1, box.max.y, false],
        [2, box.min.z, true],
        [2, box.max.z, false]
    ];
    for (const [axis, value, insideGe] of planes) {
        const next: Vert[][] = [];
        for (const frag of frags) {
            const sides = splitPoly(frag, axis, value, insideGe);
            if (sides.inn.length >= 3) {
                next.push(sides.inn);
            }
            if (sides.outp.length >= 3) {
                next.push(sides.outp);
            }
        }
        frags = next;
    }
    const kept: Vert[][] = [];
    for (const frag of frags) {
        if (frag.length < 3) {
            continue;
        }
        const mid = scale(
            frag.reduce((acc, v) => add(acc, v.p), { x: 0, y: 0, z: 0 }),
            1 / frag.length
        );
        if (inBox(mid, box)) {
            continue;
        }
        kept.push(frag);
    }
    return kept;
}

function fanTris(poly: Vert[]): Vert[][] {
    const out: Vert[][] = [];
    for (let i = 1; i + 1 < poly.length; i++) {
        out.push([poly[0], poly[i], poly[i + 1]]);
    }
    return out;
}

function punchPrim(prim: Prim, boxes: Box[]): Prim {
    const pos: Vec3[] = [];
    const idx: number[] = [];
    const col: ([number, number, number, number] | null)[] = [];
    const uv: ([number, number] | null)[] = [];
    const emit = (v: Vert) => {
        pos.push(v.p);
        col.push(v.c ?? null);
        uv.push(v.uv ?? null);
        idx.push(pos.length - 1);
    };
    for (let t = 0; t + 2 < prim.idx.length; t += 3) {
        const ia = prim.idx[t];
        const ib = prim.idx[t + 1];
        const ic = prim.idx[t + 2];
        let pieces: Vert[][] = [
            [
                { p: prim.pos[ia], c: prim.col[ia] ?? undefined, uv: prim.uv[ia] ?? undefined },
                { p: prim.pos[ib], c: prim.col[ib] ?? undefined, uv: prim.uv[ib] ?? undefined },
                { p: prim.pos[ic], c: prim.col[ic] ?? undefined, uv: prim.uv[ic] ?? undefined }
            ]
        ];
        for (const box of boxes) {
            const next: Vert[][] = [];
            for (const tri of pieces) {
                const tb = emptyBox();
                expand(tb, tri[0].p);
                expand(tb, tri[1].p);
                expand(tb, tri[2].p);
                const overlap =
                    tb.min.x <= box.max.x &&
                    tb.max.x >= box.min.x &&
                    tb.min.y <= box.max.y &&
                    tb.max.y >= box.min.y &&
                    tb.min.z <= box.max.z &&
                    tb.max.z >= box.min.z;
                if (!overlap) {
                    next.push(tri);
                    continue;
                }
                if (inBox(tri[0].p, box) && inBox(tri[1].p, box) && inBox(tri[2].p, box)) {
                    continue;
                }
                for (const frag of triOutside(tri[0], tri[1], tri[2], box)) {
                    next.push(...fanTris(frag));
                }
            }
            pieces = next;
        }
        for (const tri of pieces) {
            emit(tri[0]);
            emit(tri[1]);
            emit(tri[2]);
        }
    }
    return { pos, idx, col, uv, tex: prim.tex };
}

function writeGlb(prims: Prim[], name: string): Buffer {
    const accessors: object[] = [];
    const bufferViews: object[] = [];
    const primitives: object[] = [];
    const parts: Buffer[] = [];
    let binSize = 0;
    const pad = (n: number) => (4 - (n % 4)) % 4;
    const addView = (bytes: Buffer, target: number) => {
        const off = binSize;
        parts.push(bytes);
        bufferViews.push({ buffer: 0, byteOffset: off, byteLength: bytes.length, target });
        binSize += bytes.length + pad(bytes.length);
        return bufferViews.length - 1;
    };
    for (const prim of prims) {
        if (prim.idx.length === 0) {
            continue;
        }
        const pos = Buffer.alloc(prim.pos.length * 12);
        const min = [Infinity, Infinity, Infinity];
        const max = [-Infinity, -Infinity, -Infinity];
        prim.pos.forEach((p, i) => {
            pos.writeFloatLE(p.x, i * 12);
            pos.writeFloatLE(p.y, i * 12 + 4);
            pos.writeFloatLE(p.z, i * 12 + 8);
            min[0] = Math.min(min[0], p.x);
            min[1] = Math.min(min[1], p.y);
            min[2] = Math.min(min[2], p.z);
            max[0] = Math.max(max[0], p.x);
            max[1] = Math.max(max[1], p.y);
            max[2] = Math.max(max[2], p.z);
        });
        const posView = addView(pos, 34962);
        const posAcc = accessors.length;
        accessors.push({ bufferView: posView, componentType: 5126, count: prim.pos.length, type: 'VEC3', min, max });
        const attributes: Record<string, number> = { POSITION: posAcc };
        if (prim.uv.some((u) => u)) {
            const uv = Buffer.alloc(prim.pos.length * 8);
            prim.uv.forEach((u, i) => {
                uv.writeFloatLE(u?.[0] ?? 0, i * 8);
                uv.writeFloatLE(u?.[1] ?? 0, i * 8 + 4);
            });
            attributes.TEXCOORD_0 = accessors.length;
            accessors.push({ bufferView: addView(uv, 34962), componentType: 5126, count: prim.pos.length, type: 'VEC2' });
        }
        if (prim.col.some((c) => c)) {
            const col = Buffer.alloc(prim.pos.length * 16);
            prim.col.forEach((c, i) => {
                const v = c ?? [1, 1, 1, 1];
                col.writeFloatLE(v[0], i * 16);
                col.writeFloatLE(v[1], i * 16 + 4);
                col.writeFloatLE(v[2], i * 16 + 8);
                col.writeFloatLE(v[3], i * 16 + 12);
            });
            attributes.COLOR_0 = accessors.length;
            accessors.push({ bufferView: addView(col, 34962), componentType: 5126, count: prim.pos.length, type: 'VEC4' });
        }
        const idx = Buffer.alloc(prim.idx.length * 4);
        prim.idx.forEach((v, i) => idx.writeUInt32LE(v, i * 4));
        const primOut: Record<string, unknown> = {
            attributes,
            indices: accessors.length,
            mode: 4
        };
        accessors.push({ bufferView: addView(idx, 34963), componentType: 5125, count: prim.idx.length, type: 'SCALAR' });
        if (prim.tex >= 0) {
            primOut.extras = { tex: prim.tex };
        }
        primitives.push(primOut);
    }
    if (primitives.length === 0) {
        throw new Error(`punched ${name} has no faces`);
    }
    const bin = Buffer.alloc(binSize);
    let cursor = 0;
    for (const part of parts) {
        part.copy(bin, cursor);
        cursor += part.length + pad(part.length);
    }
    const gltf = {
        asset: { version: '2.0', generator: 'lostcity-vr-punch-shutters' },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, name }],
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
    out.writeUInt32LE(0x46546c67, 0);
    out.writeUInt32LE(2, 4);
    out.writeUInt32LE(total, 8);
    out.writeUInt32LE(jsonChunk, 12);
    out.writeUInt32LE(0x4e4f534a, 16);
    json.copy(out, 20);
    out.writeUInt32LE(binChunk, 20 + jsonChunk);
    out.writeUInt32LE(0x004e4942, 24 + jsonChunk);
    bin.copy(out, 28 + jsonChunk);
    return out;
}

type Loc = { type: number; x: number; z: number; level: number; shape: number; angle: number };

function locOrigin(loc: Loc, shutter: boolean): Vec3 {
    if (shutter) {
        const f = shutterFoot(loc.angle);
        return { x: loc.x + f.x, y: 0, z: loc.z + f.z };
    }
    return { x: loc.x + 0.5, y: 0, z: loc.z + 0.5 };
}

function toWorld(local: Vec3, loc: Loc, shutter: boolean): Vec3 {
    return add(locOrigin(loc, shutter), applyYaw(local, yawOf(loc.angle)));
}

function toLocal(world: Vec3, loc: Loc): Vec3 {
    return applyYaw(sub(world, locOrigin(loc, false)), -yawOf(loc.angle));
}

function boxCorners(box: Box): Vec3[] {
    return [
        box.min,
        { x: box.max.x, y: box.min.y, z: box.min.z },
        { x: box.min.x, y: box.max.y, z: box.min.z },
        { x: box.min.x, y: box.min.y, z: box.max.z },
        { x: box.max.x, y: box.max.y, z: box.min.z },
        { x: box.max.x, y: box.min.y, z: box.max.z },
        { x: box.min.x, y: box.max.y, z: box.max.z },
        box.max
    ];
}

function boxesOverlap(a: Box, b: Box): boolean {
    const ox = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
    const oy = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
    const oz = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
    return ox > 0.05 && oy > 0.05 && oz > 0.05;
}

function sameAxis(shutterAngle: number, wallAngle: number): boolean {
    return shutterAngle % 2 === wallAngle % 2;
}

function worldHole(opening: Vec3[], shutter: Loc): Box | null {
    const worldBox = emptyBox();
    for (const v of opening) {
        expand(worldBox, toWorld(v, shutter, true));
    }
    if (!Number.isFinite(worldBox.min.x)) {
        return null;
    }
    const into = intoWall(shutter.angle);
    return throughWall(insetFace(worldBox, into), into);
}

function holeToLocal(world: Box, wall: Loc): Box {
    const local = emptyBox();
    for (const c of boxCorners(world)) {
        expand(local, toLocal(c, wall));
    }
    return local;
}

function primsLocalAabb(prims: Prim[]): Box {
    const box = emptyBox();
    for (const prim of prims) {
        for (const p of prim.pos) {
            expand(box, p);
        }
    }
    return box;
}

function slabWorld(wall: Loc, local: Box): Box {
    return slabWorldYaw(wall, local, yawOf(wall.angle));
}

function slabWorldYaw(wall: Loc, local: Box, yaw: number): Box {
    const world = emptyBox();
    for (const c of boxCorners(local)) {
        expand(world, add(locOrigin(wall, false), applyYaw(c, yaw)));
    }
    return world;
}

function mirrorPrimZ(prim: Prim): Prim {
    return {
        pos: prim.pos.map((p) => ({ x: p.x, y: p.y, z: -p.z })),
        idx: [...prim.idx],
        col: [...prim.col],
        uv: [...prim.uv],
        tex: prim.tex
    };
}

function rotatePrimY(prim: Prim, yaw: number): Prim {
    return {
        pos: prim.pos.map((p) => applyYaw(p, yaw)),
        idx: [...prim.idx],
        col: [...prim.col],
        uv: [...prim.uv],
        tex: prim.tex
    };
}

function locLabel(loc: Loc): string {
    return `${loc.x},${loc.z}`;
}

function _findOpposite(shutters: Loc[], shutter: Loc): Loc | undefined {
    const into = intoWall(shutter.angle);
    const oppAngle = (shutter.angle + 2) % 4;
    const same = shutters.find(
        (s) =>
            s !== shutter &&
            s.x === shutter.x &&
            s.z === shutter.z &&
            s.level === shutter.level &&
            s.angle % 4 === oppAngle
    );
    if (same) {
        return same;
    }
    const nx = shutter.x + Math.round(into.x);
    const nz = shutter.z + Math.round(into.z);
    return shutters.find((s) => s.x === nx && s.z === nz && s.level === shutter.level && s.angle % 4 === oppAngle);
}

function findSkip(walls: Loc[], shutter: Loc): Loc[] {
    return walls.filter(
        (w) =>
            w.x === shutter.x &&
            w.z === shutter.z &&
            w.level === shutter.level &&
            w.shape !== 2 &&
            !sameAxis(shutter.angle, w.angle)
    );
}

function leafTiles(shutter: Loc): Set<string> {
    const tiles = new Set<string>([`${shutter.x},${shutter.z}`]);
    const into = intoWall(shutter.angle);
    tiles.add(`${shutter.x + Math.round(into.x)},${shutter.z + Math.round(into.z)}`);
    return tiles;
}

function axisOk(window: Loc, wall: Loc): boolean {
    if (wall.shape === 2) {
        return true;
    }
    return sameAxis(window.angle, wall.angle);
}

function wallHitsHole(wall: Loc, hole: Box, localAabb: Box): boolean {
    if (wall.shape === 2) {
        const y0 = yawOf(wall.angle);
        const y1 = yawOf((wall.angle + 1) % 4);
        return boxesOverlap(hole, slabWorldYaw(wall, localAabb, y0)) || boxesOverlap(hole, slabWorldYaw(wall, localAabb, y1));
    }
    return boxesOverlap(hole, slabWorld(wall, localAabb));
}

function findLeaves(walls: Loc[], shutter: Loc, hole: Box, localAabbOf: (wall: Loc) => Box): Loc[] {
    const tiles = leafTiles(shutter);
    return walls.filter(
        (w) =>
            w.level === shutter.level &&
            tiles.has(`${w.x},${w.z}`) &&
            axisOk(shutter, w) &&
            wallHitsHole(w, hole, localAabbOf(w))
    );
}

function main(): void {
    const modelDir = path.join(OUT, 'models');
    const mapDir = path.join(OUT, 'maps');
    const punchedDir = path.join(modelDir, 'punched');
    const shutterPath = path.join(modelDir, '2116.glb');
    if (!fs.existsSync(shutterPath)) {
        printError(`Missing ${shutterPath}`);
        process.exit(1);
    }
    const opening = openingVerts(readGlb(shutterPath));
    if (opening.length === 0) {
        printError('2116 has no shutter-opening faces');
        process.exit(1);
    }
    const pane = emptyBox();
    for (const v of opening) {
        expand(pane, v);
    }
    printInfo(
        `2116 opening verts=${opening.length} aabb=${pane.min.x.toFixed(3)}..${pane.max.x.toFixed(3)} ${pane.min.y.toFixed(3)}..${pane.max.y.toFixed(3)} ${pane.min.z.toFixed(3)}..${pane.max.z.toFixed(3)}`
    );
    fs.mkdirSync(punchedDir, { recursive: true });
    const wallCache = new Map<number, Prim[]>();
    const loadWall = (modelId: number): Prim[] => {
        if (!wallCache.has(modelId)) {
            const p = path.join(modelDir, `${modelId}.glb`);
            if (!fs.existsSync(p)) {
                throw new Error(`missing wall model ${modelId}`);
            }
            wallCache.set(modelId, readGlb(p));
        }
        return wallCache.get(modelId)!.map((pr) => ({
            pos: pr.pos.map((v) => ({ ...v })),
            idx: [...pr.idx],
            col: [...pr.col],
            uv: [...pr.uv],
            tex: pr.tex
        }));
    };
    const slabLocal = new Map<number, Box>();
    const localAabbOf = (wall: Loc): Box => {
        const modelId = WALL_MODELS[wall.shape] ?? 634;
        if (!slabLocal.has(modelId)) {
            slabLocal.set(modelId, primsLocalAabb(loadWall(modelId)));
        }
        return slabLocal.get(modelId)!;
    };
    const holes = new Map<string, { wall: Loc; boxes: Box[] }>();
    let shutters = 0;
    for (const sq of ZONE_SQUARES) {
        const mapPath = path.join(mapDir, `${sq}.json`);
        if (!fs.existsSync(mapPath)) {
            continue;
        }
        const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as { locs: Loc[] };
        const walls = map.locs.filter((l) => l.type === WALL);
        const shuttersOn = map.locs.filter((l) => l.type === SHUTTER);
        for (const shutter of shuttersOn) {
            const hole = worldHole(opening, shutter);
            if (!hole) {
                continue;
            }
            const leaves = findLeaves(walls, shutter, hole, localAabbOf);
            const skip = findSkip(walls, shutter);
            printInfo(
                `shutter ${locLabel(shutter)} a${shutter.angle} leaves=${leaves.length ? leaves.map(locLabel).join('|') : '-'} skip=${skip.length ? skip.map(locLabel).join('|') : '-'}`
            );
            if (leaves.length === 0) {
                continue;
            }
            for (const wall of leaves) {
                const box = holeToLocal(hole, wall);
                const key = `${wall.x}_${wall.z}_${wall.level}`;
                const row = holes.get(key) ?? { wall, boxes: [] };
                row.boxes.push(box);
                holes.set(key, row);
            }
            shutters++;
        }
    }
    let written = 0;
    const keep = new Set<string>();
    for (const [key, row] of holes) {
        const modelId = WALL_MODELS[row.wall.shape] ?? 634;
        try {
            let prims: Prim[];
            if (row.wall.shape === 2) {
                const arm0 = loadWall(modelId).map((p) => punchPrim(mirrorPrimZ(p), row.boxes));
                const arm1 = loadWall(modelId).map((p) => punchPrim(rotatePrimY(p, Math.PI * 0.5), row.boxes));
                prims = [...arm0, ...arm1];
            } else {
                prims = loadWall(modelId).map((p) => punchPrim(p, row.boxes));
            }
            const dest = path.join(punchedDir, `1902_${key}.glb`);
            fs.writeFileSync(dest, writeGlb(prims, `1902_${key}`));
            keep.add(`1902_${key}.glb`);
            written++;
        } catch (err) {
            printError(`punch ${key}: ${err}`);
        }
    }
    for (const name of fs.readdirSync(punchedDir)) {
        if (name.startsWith('1902_') && name.endsWith('.glb') && !keep.has(name)) {
            fs.unlinkSync(path.join(punchedDir, name));
            printInfo(`removed stale ${name}`);
        }
    }
    printInfo(`PunchShutters shutters=${shutters} walls=${written} dir=${punchedDir}`);
}

main();
