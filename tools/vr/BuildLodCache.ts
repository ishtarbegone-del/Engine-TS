import fs from 'fs';
import path from 'path';

import { printError, printInfo } from '#/util/Logger.js';

const OUT = path.resolve(process.argv[2] && !String(process.argv[2]).startsWith('--') ? process.argv[2] : '../vr-client/assets/rs');
const ZONE_SQUARES = ['48_48', '47_48', '48_47', '48_49', '49_48'];
const TREE_TYPE = 3033;
const SHUTTER = 1838;
const GLASS = 1854;
const CLUTTER_NAME = /\b(tree|plant|bush|flower|fern|dead)\b/i;

type Catalog = {
    id: number;
    name?: string;
    models?: number[];
    shapes?: number[];
    ops?: Array<string | null>;
};

type Loc = { type: number; x: number; z: number; level?: number; shape: number; angle?: number };

function modelLookupShape(shape: number): number {
    if (shape >= 5 && shape <= 8) {
        return 4;
    }
    if (shape === 11) {
        return 10;
    }
    return shape;
}

function isWallShape(shape: number): boolean {
    return shape <= 3 || shape === 9;
}

function showLoc(loc: Loc): boolean {
    const shape = loc.shape;
    const level = loc.level ?? 0;
    if (shape >= 12 && shape <= 21) {
        return true;
    }
    if (level === 0) {
        return true;
    }
    if (level === 1 && isWallShape(shape)) {
        return shape === 0 || shape === 2 || shape === 9;
    }
    return false;
}

function modelForShape(loc: Loc, catalog: Catalog | undefined): number {
    const lookup = modelLookupShape(loc.shape);
    const models = catalog?.models ?? [];
    const shapes = catalog?.shapes ?? [];
    for (let i = 0; i < models.length; i++) {
        if (i < shapes.length && shapes[i] === lookup) {
            return models[i];
        }
    }
    if (isWallShape(loc.shape) && models.length > 0) {
        return models[0];
    }
    return -1;
}

function isDoor(catalog: Catalog | undefined): boolean {
    if (!catalog) {
        return false;
    }
    for (const op of catalog.ops ?? []) {
        if (String(op ?? '').toLowerCase() === 'open') {
            return true;
        }
    }
    return String(catalog.name ?? '')
        .toLowerCase()
        .includes('door');
}

function isClutter(id: number, name: string): boolean {
    if (id === TREE_TYPE) {
        return true;
    }
    return CLUTTER_NAME.test(name);
}

function main(): void {
    const locsPath = path.join(OUT, 'locs.json');
    if (!fs.existsSync(locsPath)) {
        printError(`Missing ${locsPath}`);
        process.exit(1);
    }
    const catalog = new Map<number, Catalog>();
    const raw = JSON.parse(fs.readFileSync(locsPath, 'utf8')) as Catalog[];
    for (const entry of raw) {
        catalog.set(entry.id, entry);
    }
    const models = new Set<number>();
    const clutter = new Set<number>();
    const keep = new Set<number>();
    const shutter = new Set<number>();
    const glass = new Set<number>();
    const doors = new Set<number>();
    for (const sq of ZONE_SQUARES) {
        const mapPath = path.join(OUT, 'maps', `${sq}.json`);
        if (!fs.existsSync(mapPath)) {
            continue;
        }
        const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as { locs: Loc[] };
        for (const loc of map.locs ?? []) {
            if (!showLoc(loc)) {
                continue;
            }
            const type = loc.type;
            const cat = catalog.get(type);
            const model = modelForShape(loc, cat);
            if (model >= 0) {
                models.add(model);
            }
            const name = cat?.name ?? '';
            if (isClutter(type, name)) {
                clutter.add(type);
            } else {
                keep.add(type);
            }
            if (type === SHUTTER && model >= 0) {
                shutter.add(model);
            }
            if (type === GLASS && model >= 0) {
                glass.add(model);
            }
            if (isDoor(cat) && model >= 0) {
                doors.add(model);
            }
        }
    }
    const punchedDir = path.join(OUT, 'models', 'punched');
    const punched: string[] = [];
    if (fs.existsSync(punchedDir)) {
        for (const file of fs.readdirSync(punchedDir)) {
            if (file.endsWith('.glb')) {
                punched.push(file.replace(/\.glb$/i, ''));
            }
        }
        punched.sort();
    }
    const dest = path.join(OUT, 'lod-cache.json');
    const payload = {
        squares: ZONE_SQUARES,
        models: [...models].sort((a, b) => a - b),
        punched,
        clutter: [...clutter].sort((a, b) => a - b),
        keep: [...keep].sort((a, b) => a - b),
        shutter: [...shutter].sort((a, b) => a - b),
        glass: [...glass].sort((a, b) => a - b),
        doors: [...doors].sort((a, b) => a - b)
    };
    fs.writeFileSync(dest, `${JSON.stringify(payload)}\n`);
    printInfo(
        `BuildLodCache models=${payload.models.length} punched=${payload.punched.length} clutter=${payload.clutter.length} keep=${payload.keep.length} -> ${dest}`
    );
}

main();
