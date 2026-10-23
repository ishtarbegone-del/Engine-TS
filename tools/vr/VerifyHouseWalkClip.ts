/**
 * Headless smoke: buildHouseText emits WALK + CLIP over FLOOR flood tiles.
 * Run from engine/: npx tsx tools/vr/VerifyHouseWalkClip.ts
 */
import CollisionMap from '../../../webclient/src/dash3d/CollisionMap.ts';
import { CollisionFlag } from '../../../webclient/src/dash3d/CollisionFlag.ts';
import { buildHouseText } from '../../../webclient/src/client/HouseBlueprint.ts';

function fail(msg: string): never {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
}

function ok(msg: string): void {
    console.log(`ok ${msg}`);
}

const baseX = 3000;
const baseZ = 3000;
const cmap0 = new CollisionMap();
const cmap1 = new CollisionMap();
// Open tile with north wall at world 3100,3100
cmap0.flags[CollisionMap.index(100, 100)] = CollisionFlag.W_N;
// Blocked scenery square at 3101,3100
cmap0.flags[CollisionMap.index(101, 100)] = CollisionFlag.WALK_SCENERY;
// Outdoor AABB padding tile — must NOT appear in flood-scoped WALK
cmap0.flags[CollisionMap.index(102, 99)] = CollisionFlag._OPEN;
// L1: 3100 open, 3101 blocked
cmap1.flags[CollisionMap.index(100, 100)] = CollisionFlag._OPEN;
cmap1.flags[CollisionMap.index(101, 100)] = CollisionFlag.WALK_SCENERY;

const dump = buildHouseText({
    wx: 3100,
    wz: 3100,
    level: 0,
    baseX,
    baseZ,
    fill: {
        inside: true,
        tiles: [
            { x: 3100, z: 3100 },
            { x: 3101, z: 3100 }
        ],
        reason: 'enclosed'
    },
    groundh: null,
    collision: [cmap0, cmap1, null, null],
    world: null,
    build: null
});

if (!dump.includes('\nWALK\n')) {
    fail('missing WALK section');
}
if (!dump.includes('\nCLIP\n')) {
    fail('missing CLIP section');
}
if (!dump.includes('FLOOR flood')) {
    fail('WALK header should say FLOOR flood');
}
if (!dump.includes('tile 3100,3100 level=0') || !dump.includes('walk=yes') || !dump.includes('block=N')) {
    fail('L0 open tile with N wall missing');
}
if (!dump.includes('tile 3101,3100 level=0') || !dump.includes('walk=no') || !dump.includes('sq=blocked')) {
    fail('L0 blocked tile missing');
}
if (!dump.includes('tile 3100,3100 level=1') || !/tile 3100,3100 level=1 flags=\d+ walk=yes/.test(dump)) {
    fail('L1 walkable tile missing');
}
if (dump.includes('tile 3102,3099')) {
    fail('outdoor AABB padding must not appear in flood-scoped WALK');
}
if (!dump.includes('edge 3100,3100>3100,3101 level=0')) {
    fail('CLIP north edge missing');
}
if (!dump.includes('compare CLIP to VR EDGES LIVE / story edges')) {
    fail('VR CLIP note missing');
}
const walkL0 = (dump.match(/tile \d+,\d+ level=0 flags=\d+ walk=yes/g) ?? []).length;
const walkL1 = (dump.match(/tile \d+,\d+ level=1 flags=\d+ walk=yes/g) ?? []).length;
const walkL0All = (dump.match(/tile \d+,\d+ level=0 flags=\d+ walk=/g) ?? []).length;
if (walkL0All !== 2) {
    fail(`L0 WALK lines should equal flood size 2 got ${walkL0All}`);
}
if (walkL0 !== 1 || walkL1 !== 1) {
    fail(`expected flood-scoped walkable L0=1 L1=1 got L0=${walkL0} L1=${walkL1}`);
}
ok(`WALK flood-scoped L0 walkable=${walkL0} L1=${walkL1}`);
ok('CLIP + VR note present');
console.log('ok house WALK/CLIP verify');
