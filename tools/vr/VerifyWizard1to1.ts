/**
 * Headless checks for Wizard Tower L1/L2 AABB wash + pen walls + rails.
 * Usage (from engine/): npx tsx tools/vr/VerifyWizard1to1.ts
 */
import fs from 'fs';
import path from 'path';

const buildingPath = path.resolve(
    path.join('..', 'vr-client', 'assets', 'rs', 'buildings', 'wizard_tower.json')
);
const mapPath = path.resolve(path.join('..', 'vr-client', 'assets', 'rs', 'maps', '48_49.json'));
const dumpRootL1 = path.resolve(
    path.join('..', 'vr-client', 'debug-dumps', 'rs2004', '2026-09-11')
);
const houseL1 = path.join(dumpRootL1, 'house-005404-3105-3161', 'house.txt');
const houseL2 = path.join(dumpRootL1, 'house-030228-3110-3161', 'house.txt');

const L1_SKIP = new Set(['3103,3159', '3104,3160']);
const L2_SKIP = new Set(['3104,3160']);

function aabbWoodFromHouse(dumpPath: string, skip: Set<string>): string[] {
    let aabb: { minX: number; minZ: number; maxX: number; maxZ: number } | null = null;
    for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
        const m = /aabb=(\d+),(\d+)\.\.(\d+),(\d+)/.exec(line);
        if (!m) continue;
        aabb = {
            minX: Number(m[1]),
            minZ: Number(m[2]),
            maxX: Number(m[3]),
            maxZ: Number(m[4]),
        };
        break;
    }
    if (!aabb) return [];
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

function woodFromHouse(dumpPath: string, allowOv: number[]): string[] {
    const allow = new Set(allowOv);
    const wood: string[] = [];
    let inFloor = false;
    for (const line of fs.readFileSync(dumpPath, 'utf8').split(/\r?\n/)) {
        if (line.startsWith('FLOOR')) {
            inFloor = true;
            continue;
        }
        if (
            line.startsWith('WALK') ||
			line.startsWith('CLIP') ||
			line.startsWith('LOCS') ||
			line.startsWith('ROOF') ||
			line.startsWith('EDGE')
        ) {
            inFloor = false;
            continue;
        }
        if (!inFloor) continue;
        const m = /^tile (\d+),(\d+).*?\bov=(\d+)/.exec(line);
        if (!m) continue;
        if (!allow.has(Number(m[3]))) continue;
        wood.push(`${m[1]},${m[2]}`);
    }
    return [...new Set(wood)].sort();
}

function main(): void {
    const b = JSON.parse(fs.readFileSync(buildingPath, 'utf8')) as {
		l1_wood: string[];
		l2_wood: string[];
		l2_carpet: string[];
		l1_inset?: number;
		l1_walls?: string[];
		l2_walls?: string[];
		l1_locs?: Array<{ type: number; x: number; z: number }>;
		lesser_demon: { type: number; x: number; z: number; level: number };
		cage_bars: Array<{ type: number; x: number; z: number; level: number }>;
		music_zone?: { x0: number; x1: number; z0: number; z1: number };
	};
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as {
		locs: Array<{
			type?: number;
			x: number;
			z: number;
			level?: number;
			shape?: number;
			angle?: number;
			cave?: boolean;
		}>;
	};

    const expectL1 = aabbWoodFromHouse(houseL1, L1_SKIP);
    const expectL2 = aabbWoodFromHouse(houseL2, L2_SKIP);
    const expectCarpet = woodFromHouse(houseL2, [10]);

    let failed = false;
    const check = (label: string, ok: boolean, detail = '') => {
        console.log(`${ok ? 'ok' : 'FAIL'} ${label}${detail ? ' ' + detail : ''}`);
        if (!ok) failed = true;
    };

    check('l1_wood fill >=140', b.l1_wood.length >= 140, `got ${b.l1_wood.length}`);
    check(
        'l1 matches F10 AABB punch stairs',
        JSON.stringify(b.l1_wood) === JSON.stringify(expectL1),
        `got ${b.l1_wood.length} expect ${expectL1.length}`
    );
    check('l1 punches L12 stair 3104,3160', !b.l1_wood.includes('3104,3160'));
    check('l1 has Traiborn sill 3108,3158', b.l1_wood.includes('3108,3158'));
    check('l1_inset 0.04', Number(b.l1_inset) === 0.04, `got ${b.l1_inset}`);
    check(
        'l1_walls has open east 1537@3110,3162',
        (b.l1_walls ?? []).some(k => k.startsWith('1537,3110,3162,'))
    );
    check('l1_locs decor n>=20', (b.l1_locs ?? []).length >= 20, `got ${(b.l1_locs ?? []).length}`);

    check('l2_wood fill >=110', b.l2_wood.length >= 110, `got ${b.l2_wood.length}`);
    check(
        'l2 matches F10 AABB solid',
        JSON.stringify(b.l2_wood) === JSON.stringify(expectL2),
        `got ${b.l2_wood.length} expect ${expectL2.length}`
    );
    check('l2 punches stair 3104,3160', !b.l2_wood.includes('3104,3160'));
    check('l2 pen wood 3109,3158', b.l2_wood.includes('3109,3158'));
    check('l2 pen wood 3112,3158', b.l2_wood.includes('3112,3158'));
    check('l2_carpet count', b.l2_carpet.length === 25, `got ${b.l2_carpet.length}`);
    check(
        'carpet matches house-030228 ov10',
        JSON.stringify(b.l2_carpet) === JSON.stringify(expectCarpet)
    );
    check(
        'l2_walls has cage 997@3109,3159',
        (b.l2_walls ?? []).some(k => k.startsWith('997,3109,3159,'))
    );
    check(
        'l2_walls has stair 1902@3104,3160',
        (b.l2_walls ?? []).some(k => k.startsWith('1902,3104,3160,'))
    );

    const bars = (map.locs ?? []).filter(
        l =>
            !l.cave &&
			(l.type ?? -1) === 997 &&
			(l.level ?? 0) === 2 &&
			l.z === 3159 &&
			l.x >= 3109 &&
			l.x <= 3112
    );
    check('map cage bars 997 n=4', bars.length === 4, `got ${bars.length}`);

    const doors = (map.locs ?? []).filter(
        l => !l.cave && (l.type ?? -1) === 1536 && (l.level ?? 0) === 1
    );
    check('L1 doors 1536 n=3', doors.length === 3, `got ${doors.length}`);
    check(
        'Traiborn door 1536@3108,3158',
        doors.some(d => d.x === 3108 && d.z === 3158)
    );

    check(
        'lesser_demon blueprint',
        b.lesser_demon?.type === 82 && b.lesser_demon?.x === 3112 && b.lesser_demon?.z === 3158
    );
    check('music_zone z1=3199', Number(b.music_zone?.z1) === 3199, `got ${b.music_zone?.z1}`);

    if (failed) {
        console.error('FAIL wizard L1/L2 AABB verify');
        process.exit(1);
    }
    console.log('ok wizard L1/L2 AABB rebuild verify');
}

main();
