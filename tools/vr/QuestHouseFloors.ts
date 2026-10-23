/**
 * Source check: quest-house L1 wood from 48_48 overlay[1]==5,
 * minus stair shaft. Hatch is RING. Syncs buildings/quest_house.json.
 *
 * Usage (from engine/):
 *   npx tsx tools/vr/QuestHouseFloors.ts [path/to/48_48.json]
 */
import fs from 'fs';
import path from 'path';

const HATCH = { x: 3088, z: 3119 };
const STAIR = { x: 3083, z: 3124 };
const PAD = { x0: 3080, x1: 3089, z0: 3119, z1: 3125 };
const CHUNK = 8;
const EXPECTED_CHUNKS: Record<string, number> = {
    '3080,3112': 8,
    '3080,3120': 36,
    '3088,3112': 2,
    '3088,3120': 4,
};

const mapPath = path.resolve(
    process.argv[2] ?? path.join('..', 'vr-client', 'assets', 'rs', 'maps', '48_48.json')
);
const buildingPath = path.resolve(
    process.argv[3] ?? path.join('..', 'vr-client', 'assets', 'rs', 'buildings', 'quest_house.json')
);

type Loc = { x: number; z: number; level?: number; shape?: number; cave?: boolean; type?: number };

function isWallShape(shape: number): boolean {
    return shape <= 3 || shape === 9;
}

const BANK = { x0: 3114, x1: 3130, z0: 3117, z1: 3132 };

function pullTutorBank(
    m: { mx: number; mz: number },
    ov: number[][][]
): { l1: string[]; l2: string[]; json: Record<string, unknown> } {
    const l1: string[] = [];
    const l2: string[] = [];
    for (let x = BANK.x0; x <= BANK.x1; x++) {
        for (let z = BANK.z0; z <= BANK.z1; z++) {
            const lx = x - m.mx * 64;
            const lz = z - m.mz * 64;
            if ((ov[1]?.[lx]?.[lz] ?? 0) > 0) l1.push(`${x},${z}`);
            if ((ov[2]?.[lx]?.[lz] ?? 0) > 0) l2.push(`${x},${z}`);
        }
    }
    l1.sort();
    l2.sort();
    return {
        l1,
        l2,
        json: {
            id: 'tutor_bank',
            pad: BANK,
            l1_floor: l1,
            l2_floor: l2,
            notes:
				'Ground floor stays the outdoor mesh. Ceiling of a story is that tile’s overlay on the story above. Packed shape 22 is not a floor.',
        },
    };
}

function chunkKey(x: number, z: number): string {
    const ox = Math.floor(x / CHUNK) * CHUNK;
    const oz = Math.floor(z / CHUNK) * CHUNK;
    return `${ox},${oz}`;
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
    if (!ov?.[1]) {
        console.error('no overlay[1]');
        process.exit(2);
    }

    const ov5: string[] = [];
    const walls = new Set<string>();
    for (const loc of m.locs ?? []) {
        if (loc.cave) continue;
        if ((loc.level ?? 0) !== 1) continue;
        if (loc.x < PAD.x0 || loc.x > PAD.x1 || loc.z < PAD.z0 || loc.z > PAD.z1) continue;
        if (!isWallShape(loc.shape ?? 10)) continue;
        walls.add(`${loc.x},${loc.z}`);
    }

    for (let x = PAD.x0; x <= PAD.x1; x++) {
        for (let z = PAD.z0; z <= PAD.z1; z++) {
            const lx = x - mx * 64;
            const lz = z - mz * 64;
            if (ov[1][lx]?.[lz] === 5) {
                ov5.push(`${x},${z}`);
            }
        }
    }

    const hatchKey = `${HATCH.x},${HATCH.z}`;
    const stairKey = `${STAIR.x},${STAIR.z}`;
    const wood = ov5.filter(k => k !== stairKey);
    const inset = wood.filter(k => k !== hatchKey && walls.has(k));
    const plain = wood.filter(k => k !== hatchKey && !walls.has(k));
    const hatchInOv5 = ov5.includes(hatchKey);
    const hatchInWood = wood.includes(hatchKey);

    const chunks: Record<string, number> = {};
    for (const k of wood) {
        const [xs, zs] = k.split(',');
        const ck = chunkKey(Number(xs), Number(zs));
        chunks[ck] = (chunks[ck] ?? 0) + 1;
    }

    console.log(`map=${mapPath}`);
    console.log(
        `ov5=${ov5.length} wallTiles=${walls.size} wood=${wood.length} plain=${plain.length} inset=${inset.length} ring=${hatchInWood ? 1 : 0}`
    );
    console.log(`hatch ov5=${hatchInOv5} wood=${hatchInWood} mode=RING open shaft cell=QuestL1Cell`);
    console.log(`stair skipped=${stairKey}`);

    console.log('GRID (#=wood I=inset R=hatch-ring S=stair .=other):');
    for (let z = PAD.z1; z >= PAD.z0; z--) {
        let row = `${z} `;
        for (let x = PAD.x0; x <= PAD.x1; x++) {
            const k = `${x},${z}`;
            if (k === hatchKey && hatchInWood) row += 'R';
            else if (k === stairKey) row += 'S';
            else if (inset.includes(k)) row += 'I';
            else if (wood.includes(k)) row += '#';
            else if (walls.has(k)) row += 'W';
            else row += '.';
        }
        console.log(row);
    }

    if (inset.length) {
        console.log(`INSET wall∩ov5: ${inset.sort().join(' ')}`);
    }
    console.log(`WOOD: ${wood.sort().join(' ')}`);

    const chunkKeys = Object.keys(chunks).sort();
    for (const ck of chunkKeys) {
        console.log(`chunk=${ck} n=${chunks[ck]}`);
    }

    let failed = false;
    if (wood.length === 0) {
        console.error('FAIL: wood set empty');
        failed = true;
    }
    if (!hatchInWood) {
        console.error('FAIL: hatch must be RING wood (open shaft), not missing');
        failed = true;
    }
    if (wood.includes(stairKey)) {
        console.error('FAIL: stair must be skipped');
        failed = true;
    }
    if (wood.length !== 50) {
        console.error(`FAIL: expected wood=50 got ${wood.length}`);
        failed = true;
    }
    for (const [ck, n] of Object.entries(EXPECTED_CHUNKS)) {
        const got = chunks[ck] ?? 0;
        if (got !== n) {
            console.error(`FAIL: chunk=${ck} expected n=${n} got ${got}`);
            failed = true;
        }
    }
    for (const ck of chunkKeys) {
        if (!(ck in EXPECTED_CHUNKS)) {
            console.error(`FAIL: unexpected chunk=${ck} n=${chunks[ck]}`);
            failed = true;
        }
    }

    const l0: string[] = [];
    for (let x = PAD.x0; x <= PAD.x1; x++) {
        for (let z = PAD.z0; z <= PAD.z1; z++) {
            const lx = x - mx * 64;
            const lz = z - mz * 64;
            if ((ov[0]?.[lx]?.[lz] ?? 0) > 0) {
                l0.push(`${x},${z}`);
            }
        }
    }
    l0.sort();
    if (l0.length !== 69) {
        console.error(`FAIL: expected l0=69 got ${l0.length}`);
        failed = true;
    }
    if (ov[2]) {
        let l2 = 0;
        for (let x = PAD.x0; x <= PAD.x1; x++) {
            for (let z = PAD.z0; z <= PAD.z1; z++) {
                const lx = x - mx * 64;
                const lz = z - mz * 64;
                if ((ov[2][lx]?.[lz] ?? 0) > 0) l2++;
            }
        }
        if (l2 !== 0) {
            console.error(`FAIL: quest house l2 overlay=${l2}`);
            failed = true;
        }
    }

    const building = {
        id: 'quest_house',
        pad: PAD,
        hatch: HATCH,
        stair: STAIR,
        inset: 0.12,
        hatch_hole: 0.55,
        l0_floor: l0,
        l1_wood: wood.sort(),
        notes:
			'L0 overlay stays the ground floor. L1 overlay is the upstairs floor and the ground-floor ceiling. No L2 overlay, so no upstairs ceiling. Hatch ring, stair open. Packed L1 shape 22 is not the ceiling.',
    };
    fs.mkdirSync(path.dirname(buildingPath), { recursive: true });
    fs.writeFileSync(buildingPath, JSON.stringify(building, null, '\t') + '\n', 'utf8');
    console.log(`wrote ${buildingPath} l0=${l0.length} wood=${wood.length}`);

    const bankPath = path.resolve(
        process.argv[4] ?? path.join('..', 'vr-client', 'assets', 'rs', 'buildings', 'tutor_bank.json')
    );
    const bank = pullTutorBank(m, ov);
    fs.writeFileSync(bankPath, JSON.stringify(bank.json, null, '\t') + '\n', 'utf8');
    console.log(`wrote ${bankPath} l1=${bank.l1.length} l2=${bank.l2.length}`);
    if (bank.l1.length !== 53 || bank.l2.length !== 19) {
        console.error(`FAIL: tutor bank l1=${bank.l1.length} l2=${bank.l2.length}`);
        failed = true;
    }

    if (failed) {
        process.exit(1);
    }
    console.log('ok expected chunks 8/36/2/4 total 50 hatch=RING cell=QuestL1Cell');
}

main();
