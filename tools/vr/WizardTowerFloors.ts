/**
 * Wizard Tower floors: L0 from 48_49 overlay==5; L1 from F10 house-005404
 * AABB; L2 from F10 house-030228 AABB solid (gaps + demon pen wash).
 *
 * Usage (from engine/):
 *   npx tsx tools/vr/WizardTowerFloors.ts
 */
import fs from 'fs';
import path from 'path';

const PAD = { x0: 3102, x1: 3116, z0: 3153, z1: 3168 };
const STAIRS = {
    l0_up: { x: 3103, z: 3159, type: 1738 },
    l1: { x: 3103, z: 3159, type: 1739 },
    l2_down: { x: 3104, z: 3160, type: 1740 },
};
const BASEMENT = {
    square: '48_149',
    down: { x: 3104, z: 3162, type: 2147 },
    up: { x: 3103, z: 3176, type: 2148, raw_z: 9576 },
};
const MUSIC_ZONE = { x0: 3096, x1: 3120, z0: 3148, z1: 3199 };
const CAGE_BARS = [
    { type: 997, x: 3109, z: 3159, level: 2 },
    { type: 997, x: 3110, z: 3159, level: 2 },
    { type: 997, x: 3111, z: 3159, level: 2 },
    { type: 997, x: 3112, z: 3159, level: 2 },
];
const LESSER_DEMON = { type: 82, x: 3112, z: 3158, level: 2 };

const EXPECT_L0_MIN = 140;
const EXPECT_L1_MIN = 140; // F10 HOUSE aabb solid fill minus L01+L12 stairs
const EXPECT_L2_MIN = 110; // F10 HOUSE aabb solid fill minus L12 stair
const EXPECT_L2_CARPET = 25;
const EXPECT_L0_F10_UNION_MIN = 130;
const L1_INSET = 0.04;

const dumpRootL0 = path.resolve(
    path.join('..', 'vr-client', 'debug-dumps', 'rs2004', '2026-09-10')
);
const dumpRootL1 = path.resolve(
    path.join('..', 'vr-client', 'debug-dumps', 'rs2004', '2026-09-11')
);

const mapPath = path.resolve(
    process.argv[2] ?? path.join('..', 'vr-client', 'assets', 'rs', 'maps', '48_49.json')
);
const cavePath = path.resolve(
    process.argv[3] ?? path.join('..', 'vr-client', 'assets', 'rs', 'maps', '48_149.json')
);
const buildingPath = path.resolve(
    process.argv[4] ?? path.join('..', 'vr-client', 'assets', 'rs', 'buildings', 'wizard_tower.json')
);
const houseL0Paths = [
    path.join(dumpRootL0, 'house-214042-3106-3161', 'house.txt'),
    path.join(dumpRootL0, 'house-214049-3108-3163', 'house.txt'),
    path.join(dumpRootL0, 'house-214058-3112-3160', 'house.txt'),
];
const houseL1Path = path.join(dumpRootL1, 'house-005404-3105-3161', 'house.txt');
const _houseL1TraibornPath = path.join(dumpRootL1, 'house-005357-3108-3158', 'house.txt');
const houseL2Path = path.join(dumpRootL1, 'house-030228-3110-3161', 'house.txt');
const roofPath = path.resolve(
    process.argv[5] ??
		path.join(
		    '..',
		    'vr-client',
		    'debug-dumps',
		    'rs2004',
		    'unknown',
		    'roof-roof-20260910-201222-3110-3168',
		    'roof.txt'
		)
);

type Loc = {
	x: number;
	z: number;
	level?: number;
	shape?: number;
	angle?: number;
	cave?: boolean;
	type?: number;
};

type DumpLoc = {
	kind: string;
	type: number;
	x: number;
	z: number;
	shape: number;
	angle: number;
	level: number;
};

function isWallShape(shape: number): boolean {
    return shape <= 3 || shape === 9;
}

function wallKey(loc: {
	type: number;
	x: number;
	z: number;
	shape: number;
	angle: number;
}): string {
    return `${loc.type},${loc.x},${loc.z},${loc.shape},${loc.angle}`;
}

function sectionEndsFloor(line: string): boolean {
    return (
        line.startsWith('WALK') ||
		line.startsWith('CLIP') ||
		line.startsWith('LOCS') ||
		line.startsWith('ROOF') ||
		line.startsWith('EDGE') ||
		line.startsWith('GAPS') ||
		line.startsWith('PAD13') ||
		line.startsWith('SHUTTERS') ||
		line.startsWith('VR')
    );
}

function woodForOverlays(
    ov: number[][][],
    mx: number,
    mz: number,
    level: number,
    overlayIds: number[],
    skip: Set<string>
): string[] {
    const wood: string[] = [];
    const allow = new Set(overlayIds);
    for (let x = PAD.x0; x <= PAD.x1; x++) {
        for (let z = PAD.z0; z <= PAD.z1; z++) {
            const key = `${x},${z}`;
            if (skip.has(key)) continue;
            const lx = x - mx * 64;
            const lz = z - mz * 64;
            const v = ov[level]?.[lx]?.[lz];
            if (allow.has(v)) wood.push(key);
        }
    }
    return wood.sort();
}

function floorsFromHouseDump(dumpPath: string): Set<string> {
    const out = new Set<string>();
    if (!fs.existsSync(dumpPath)) {
        console.error(`missing house dump ${dumpPath}`);
        return out;
    }
    let inFloor = false;
    for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
        if (line.startsWith('FLOOR')) {
            inFloor = true;
            continue;
        }
        if (sectionEndsFloor(line)) {
            inFloor = false;
            continue;
        }
        if (!inFloor) continue;
        const m = /^tile (\d+),(\d+)/.exec(line);
        if (m) out.add(`${m[1]},${m[2]}`);
    }
    return out;
}

/** Parse HOUSE aabb=minX,minZ..maxX,maxZ from F10 house.txt. */
function aabbFromHouseDump(
    dumpPath: string
): { minX: number; minZ: number; maxX: number; maxZ: number } | null {
    if (!fs.existsSync(dumpPath)) return null;
    for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
        const m = /aabb=(\d+),(\d+)\.\.(\d+),(\d+)/.exec(line);
        if (!m) continue;
        return {
            minX: Number(m[1]),
            minZ: Number(m[2]),
            maxX: Number(m[3]),
            maxZ: Number(m[4]),
        };
    }
    return null;
}

/** Solid rectangle fill for cell wash (may clip outside walls). */
function woodSolidFromAabb(
    aabb: { minX: number; minZ: number; maxX: number; maxZ: number },
    skip: Set<string>
): string[] {
    const wood: string[] = [];
    for (let x = aabb.minX; x <= aabb.maxX; x++) {
        for (let z = aabb.minZ; z <= aabb.maxZ; z++) {
            const key = `${x},${z}`;
            if (skip.has(key)) continue;
            wood.push(key);
        }
    }
    return wood.sort();
}

/** Enclosed FLOOR tiles whose ov matches allow — one-to-one wash source. */
function woodFromHouseDumpOv(dumpPath: string, allowOv: number[]): string[] {
    if (!fs.existsSync(dumpPath)) {
        console.error(`missing house dump ${dumpPath}`);
        return [];
    }
    const allow = new Set(allowOv);
    const wood: string[] = [];
    let inFloor = false;
    for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
        if (line.startsWith('FLOOR')) {
            inFloor = true;
            continue;
        }
        if (sectionEndsFloor(line)) {
            inFloor = false;
            continue;
        }
        if (!inFloor) continue;
        const m = /^tile (\d+),(\d+).*?\bov=(\d+)/.exec(line);
        if (!m) continue;
        const ovId = Number(m[3]);
        if (!allow.has(ovId)) continue;
        wood.push(`${m[1]},${m[2]}`);
    }
    return [...new Set(wood)].sort();
}

function parseHouseLocs(dumpPath: string): DumpLoc[] {
    if (!fs.existsSync(dumpPath)) return [];
    const out: DumpLoc[] = [];
    let inLocs = false;
    for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
        if (line.startsWith('LOCS')) {
            inLocs = true;
            continue;
        }
        if (
            line.startsWith('FLOOR') ||
			line.startsWith('WALK') ||
			line.startsWith('CLIP') ||
			line.startsWith('ROOF') ||
			line.startsWith('EDGE') ||
			line.startsWith('GAPS') ||
			line.startsWith('PAD13') ||
			line.startsWith('SHUTTERS') ||
			line.startsWith('VR')
        ) {
            inLocs = false;
            continue;
        }
        if (!inLocs || !line.startsWith('loc ')) continue;
        const kindM = /kind=(\w+)/.exec(line);
        const typeM = /type=(\d+)/.exec(line);
        const shapeM = /shape=(\d+)/.exec(line);
        const angleM = /angle=(\d+)/.exec(line);
        const levelM = /level=(\d+)/.exec(line);
        const atM = /at (\d+),(\d+)/.exec(line);
        if (!typeM || !shapeM || !angleM || !atM) continue;
        const x = Number(atM[1]);
        const z = Number(atM[2]);
        if (x < PAD.x0 || x > PAD.x1 || z < PAD.z0 || z > PAD.z1) continue;
        out.push({
            kind: kindM?.[1] ?? 'loc',
            type: Number(typeM[1]),
            x,
            z,
            shape: Number(shapeM[1]),
            angle: Number(angleM[1]) % 4,
            level: levelM ? Number(levelM[1]) : 1,
        });
    }
    return out;
}

function wallsFromHouseDump(dumpPath: string, opts?: { include997?: boolean }): string[] {
    const include997 = opts?.include997 === true;
    const walls: string[] = [];
    for (const loc of parseHouseLocs(dumpPath)) {
        if (!isWallShape(loc.shape)) continue;
        if (loc.type === 997 && !include997) continue;
        walls.push(wallKey(loc));
    }
    return [...new Set(walls)].sort();
}

/** Non-wall F10 LOCS (scenery / decor / walldecor). Skip shape 22 wash — cell-only. */
function decorFromHouseDump(dumpPath: string): DumpLoc[] {
    const out: DumpLoc[] = [];
    const seen = new Set<string>();
    for (const loc of parseHouseLocs(dumpPath)) {
        if (isWallShape(loc.shape)) continue;
        if (loc.shape === 22) continue;
        const key = `${loc.type},${loc.x},${loc.z},${loc.shape},${loc.angle},${loc.level}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(loc);
    }
    return out;
}

function wallsFromMap(
    locs: Loc[],
    level: number,
    opts?: { types?: number[] }
): string[] {
    const typeAllow = opts?.types ? new Set(opts.types) : null;
    const walls: string[] = [];
    for (const loc of locs ?? []) {
        if (loc.cave) continue;
        if ((loc.level ?? 0) !== level) continue;
        const typ = loc.type ?? -1;
        if (typeAllow && !typeAllow.has(typ)) continue;
        const shape = loc.shape ?? 10;
        if (!isWallShape(shape)) continue;
        const x = loc.x;
        const z = loc.z;
        if (x < PAD.x0 || x > PAD.x1 || z < PAD.z0 || z > PAD.z1) continue;
        walls.push(
            wallKey({
                type: typ,
                x,
                z,
                shape,
                angle: (loc.angle ?? 0) % 4,
            })
        );
    }
    return [...new Set(walls)].sort();
}

function unionWallKeys(...lists: string[][]): string[] {
    const out = new Set<string>();
    for (const list of lists) {
        for (const k of list) out.add(k);
    }
    return [...out].sort();
}

function diffWalls(label: string, dump: string[], map: string[]): number {
    const mapSet = new Set(map);
    const missingInMap = dump.filter(k => !mapSet.has(k));
    console.log(
        `${label} walls dump=${dump.length} map=${map.length} missingInMap=${missingInMap.length}`
    );
    if (missingInMap.length > 0) {
        console.log(`  missingInMap (do not invent): ${missingInMap.slice(0, 12).join(' | ')}`);
    }
    return missingInMap.length;
}

function roofMinLevelFromDump(dumpPath: string): Record<string, number> {
    const out: Record<string, number> = {};
    if (!fs.existsSync(dumpPath)) {
        console.error(`missing roof dump ${dumpPath}`);
        return out;
    }
    for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
        const m = /shape=(\d+).*?level=(\d+).*?at (\d+),(\d+)/.exec(line);
        if (!m) continue;
        const shape = Number(m[1]);
        if (shape < 12 || shape > 21) continue;
        const level = Number(m[2]);
        const key = `${m[3]},${m[4]}`;
        if (!(key in out) || level < out[key]) out[key] = level;
    }
    return out;
}

function loadExistingBuilding(): { roof_min_level?: Record<string, number> } {
    if (!fs.existsSync(buildingPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(buildingPath, 'utf8')) as {
			roof_min_level?: Record<string, number>;
		};
    } catch {
        return {};
    }
}

function main(): void {
    if (!fs.existsSync(mapPath)) {
        console.error(`missing map ${mapPath}`);
        process.exit(2);
    }
    const m = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as {
		mx: number;
		mz: number;
		overlay: number[][][];
		locs: Loc[];
	};
    const mx = m.mx;
    const mz = m.mz;
    const ov = m.overlay;
    if (!ov?.[0] || !ov?.[1] || !ov?.[2]) {
        console.error('no overlay[0]/[1]/[2]');
        process.exit(2);
    }

    const existing = loadExistingBuilding();
    const skipL0 = new Set([
        `${STAIRS.l0_up.x},${STAIRS.l0_up.z}`,
        `${BASEMENT.down.x},${BASEMENT.down.z}`,
    ]);

    const l0 = woodForOverlays(ov, mx, mz, 0, [5], skipL0);
    const skipL1 = new Set([
        `${STAIRS.l1.x},${STAIRS.l1.z}`,
        `${STAIRS.l2_down.x},${STAIRS.l2_down.z}`,
    ]);
    const l1Aabb = aabbFromHouseDump(houseL1Path);
    if (!l1Aabb) {
        console.error(`FAIL: missing HOUSE aabb in ${houseL1Path}`);
        process.exit(2);
    }
    const l1 = woodSolidFromAabb(l1Aabb, skipL1);
    const skipL2 = new Set([`${STAIRS.l2_down.x},${STAIRS.l2_down.z}`]);
    const l2Aabb = aabbFromHouseDump(houseL2Path);
    if (!l2Aabb) {
        console.error(`FAIL: missing HOUSE aabb in ${houseL2Path}`);
        process.exit(2);
    }
    const l2 = woodSolidFromAabb(l2Aabb, skipL2);
    const l2Carpet = woodFromHouseDumpOv(houseL2Path, [10]);
    console.log(
        `L1 F10 aabb solid ${l1Aabb.minX},${l1Aabb.minZ}..${l1Aabb.maxX},${l1Aabb.maxZ} n=${l1.length} (skip stairs ${STAIRS.l1.x},${STAIRS.l1.z} + ${STAIRS.l2_down.x},${STAIRS.l2_down.z})`
    );
    console.log(
        `L2 F10 aabb solid ${l2Aabb.minX},${l2Aabb.minZ}..${l2Aabb.maxX},${l2Aabb.maxZ} n=${l2.length} carpet=${l2Carpet.length} (skip stair ${STAIRS.l2_down.x},${STAIRS.l2_down.z})`
    );

    const f10Union = new Set<string>();
    for (const p of houseL0Paths) {
        const s = floorsFromHouseDump(p);
        console.log(`F10 L0 ${path.basename(path.dirname(p))} floors=${s.size}`);
        for (const k of s) f10Union.add(k);
    }
    console.log(`F10 L0 floor union=${f10Union.size}`);
    const l0Set = new Set(l0);
    const unionMissing = [...f10Union].filter(k => !l0Set.has(k) && !skipL0.has(k));
    console.log(`F10 L0 union missing from ov5=${unionMissing.length}`, unionMissing.slice(0, 8));

    let roofMin = roofMinLevelFromDump(roofPath);
    if (Object.keys(roofMin).length === 0 && existing.roof_min_level) {
        console.warn('WARN: roof dump missing — keeping existing roof_min_level');
        roofMin = existing.roof_min_level;
    }

    const dumpL0Walls = [...new Set(houseL0Paths.flatMap(p => wallsFromHouseDump(p)))].sort();
    const dumpL1Walls = wallsFromHouseDump(houseL1Path);
    const dumpL1Locs = decorFromHouseDump(houseL1Path);
    const dumpL2Walls = wallsFromHouseDump(houseL2Path, { include997: true });
    const mapL0Walls = wallsFromMap(m.locs ?? [], 0);
    const mapL1Walls = wallsFromMap(m.locs ?? [], 1);
    const mapL2Walls = wallsFromMap(m.locs ?? [], 2);
    // Dump 997 + dump walls ∪ map stone (1902/994) for pen/stair faces missing from F10 flood.
    const mapL2Stone = wallsFromMap(m.locs ?? [], 2, { types: [1902, 994] });
    const l2WallsUnion = unionWallKeys(dumpL2Walls, mapL2Stone);
    diffWalls('L0', dumpL0Walls, mapL0Walls);
    diffWalls('L1', dumpL1Walls, mapL1Walls);
    diffWalls('L2', dumpL2Walls, mapL2Walls);
    console.log(
        `L2 walls dump=${dumpL2Walls.length} +map_stone=${mapL2Stone.length} -> union=${l2WallsUnion.length}`
    );
    console.log(`L1 decor (non-wall, no shape22) n=${dumpL1Locs.length}`);

    const map997 = (m.locs ?? []).filter(
        l =>
            !l.cave &&
			(l.type ?? -1) === 997 &&
			(l.level ?? 0) === 2 &&
			l.x >= 3109 &&
			l.x <= 3112 &&
			l.z === 3159
    );
    console.log(`cage bars type=997 in map n=${map997.length} expect=4`);
    console.log(
        `lesser_demon blueprint ${LESSER_DEMON.type}@${LESSER_DEMON.x},${LESSER_DEMON.z} L${LESSER_DEMON.level}`
    );

    const stairHits: Loc[] = [];
    const ladderHits: Loc[] = [];
    for (const loc of m.locs ?? []) {
        if (loc.cave) continue;
        if (loc.x < PAD.x0 || loc.x > PAD.x1 || loc.z < PAD.z0 || loc.z > PAD.z1) continue;
        const t = loc.type ?? -1;
        if (t === 1738 || t === 1739 || t === 1740) stairHits.push(loc);
        if (t === 2147) ladderHits.push(loc);
    }

    let caveOk = false;
    if (fs.existsSync(cavePath)) {
        const cave = JSON.parse(fs.readFileSync(cavePath, 'utf8')) as { locs: Loc[]; mz: number };
        for (const loc of cave.locs ?? []) {
            if ((loc.type ?? -1) === 2148 && loc.x === BASEMENT.up.x && loc.z === BASEMENT.up.raw_z) {
                caveOk = true;
            }
        }
        console.log(`cave mz=${cave.mz} up2148=${caveOk}`);
    }

    console.log(`houseL1=${houseL1Path} exists=${fs.existsSync(houseL1Path)}`);
    console.log(`houseL2=${houseL2Path} exists=${fs.existsSync(houseL2Path)}`);
    console.log(`l0=${l0.length} l1=${l1.length} l2=${l2.length} carpet=${l2Carpet.length}`);

    let failed = false;
    if (l0.length < EXPECT_L0_MIN) {
        console.error(`FAIL: l0_floor>=${EXPECT_L0_MIN} got ${l0.length}`);
        failed = true;
    }
    if (f10Union.size < EXPECT_L0_F10_UNION_MIN) {
        console.error(`FAIL: F10 union>=${EXPECT_L0_F10_UNION_MIN} got ${f10Union.size}`);
        failed = true;
    }
    if (unionMissing.length > 0) {
        console.error('FAIL: F10 union tiles missing from L0 ov5');
        failed = true;
    }
    if (l1.length < EXPECT_L1_MIN) {
        console.error(`FAIL: l1_wood>=${EXPECT_L1_MIN} got ${l1.length}`);
        failed = true;
    }
    if (!l1.includes('3108,3158')) {
        console.error('FAIL: missing Traiborn door sill 3108,3158');
        failed = true;
    }
    if (!dumpL1Walls.some(k => k.startsWith('1537,3110,3162,'))) {
        console.error('FAIL: missing F10 open east door 1537@3110,3162');
        failed = true;
    }
    if (l2.length < EXPECT_L2_MIN) {
        console.error(`FAIL: l2_wood>=${EXPECT_L2_MIN} got ${l2.length}`);
        failed = true;
    }
    if (l2.includes(`${STAIRS.l2_down.x},${STAIRS.l2_down.z}`)) {
        console.error('FAIL: l2_wood must not include stair hole 3104,3160');
        failed = true;
    }
    if (!l2.includes('3109,3158') || !l2.includes('3112,3158')) {
        console.error('FAIL: l2_wood must include demon pen wash 3109/3112,3158');
        failed = true;
    }
    if (l1.includes(`${STAIRS.l2_down.x},${STAIRS.l2_down.z}`)) {
        console.error('FAIL: l1_wood must punch L12 stair 3104,3160');
        failed = true;
    }
    if (!l2WallsUnion.some(k => k.startsWith('997,3109,3159,'))) {
        console.error('FAIL: l2_walls missing cage 997@3109,3159');
        failed = true;
    }
    if (!l2WallsUnion.some(k => k.startsWith('1902,3104,3160,'))) {
        console.error('FAIL: l2_walls missing stair wall 1902@3104,3160');
        failed = true;
    }
    if (l2Carpet.length !== EXPECT_L2_CARPET) {
        console.error(`FAIL: l2_carpet=${EXPECT_L2_CARPET} got ${l2Carpet.length}`);
        failed = true;
    }
    if (map997.length !== 4) {
        console.error(`FAIL: expected 4 cage bars 997 in map got ${map997.length}`);
        failed = true;
    }
    if (Object.keys(roofMin).length < 40) {
        console.error(`FAIL: roof tiles>=40 got ${Object.keys(roofMin).length}`);
        failed = true;
    }
    for (const need of [
        { x: 3103, z: 3159, type: 1738, level: 0 },
        { x: 3103, z: 3159, type: 1739, level: 1 },
        { x: 3104, z: 3160, type: 1740, level: 2 },
    ]) {
        const hit = stairHits.some(
            s =>
                s.x === need.x &&
				s.z === need.z &&
				(s.type ?? -1) === need.type &&
				(s.level ?? 0) === need.level
        );
        if (!hit) {
            console.error(`FAIL: missing stair L${need.level} ${need.x},${need.z}`);
            failed = true;
        }
    }
    if (!ladderHits.some(s => s.x === 3104 && s.z === 3162 && (s.level ?? 0) === 0)) {
        console.error('FAIL: missing ladder 2147');
        failed = true;
    }
    if (!caveOk) {
        console.error('FAIL: missing cave ladder 2148');
        failed = true;
    }

    const building = {
        id: 'wizard_tower',
        pad: PAD,
        stairs: STAIRS,
        basement: BASEMENT,
        inset: 0.12,
        l1_inset: L1_INSET,
        hatch_hole: 0.55,
        l0_floor: l0,
        l1_wood: l1,
        l2_wood: l2,
        l2_carpet: l2Carpet,
        cage_bars: CAGE_BARS,
        lesser_demon: LESSER_DEMON,
        l0_walls: mapL0Walls,
        l1_walls: dumpL1Walls.length > 0 ? dumpL1Walls : mapL1Walls,
        l2_walls: l2WallsUnion.length > 0 ? l2WallsUnion : mapL2Walls,
        l0_walls_dump: dumpL0Walls,
        l1_walls_map: mapL1Walls,
        l2_walls_map: mapL2Walls,
        l1_locs: dumpL1Locs,
        roof_min_level: roofMin,
        music_zone: MUSIC_ZONE,
        notes:
			'L0 ov5 + full wood ceil. L1 AABB punch L01+L12. L2 AABB house-030228 (pen wood), no ceil. Vision z1=3199 bridge. Basement 48_149.',
    };
    fs.mkdirSync(path.dirname(buildingPath), { recursive: true });
    fs.writeFileSync(buildingPath, JSON.stringify(building, null, '\t') + '\n', 'utf8');
    console.log(
        `wrote ${buildingPath} l0=${l0.length} l1=${l1.length} l2=${l2.length} carpet=${l2Carpet.length} l1_walls=${dumpL1Walls.length} l2_walls=${l2WallsUnion.length} l1_locs=${dumpL1Locs.length}`
    );

    if (failed) process.exit(1);
    console.log('ok wizard tower floors');
}

main();
