import fs from 'fs';
import path from 'path';

import NpcType from '#/cache/config/NpcType.js';
import { printInfo } from '#/util/Logger.js';

// Write only npcs.json with recols (packed HSL pairs). No maps / models.
const OUT = path.resolve(process.argv[2] ?? '../vr-client/assets/rs');

NpcType.load('data/pack');
const npcs = [];
for (let id = 0; id < NpcType.count; id++) {
    const t = NpcType.get(id);
    if (!t) {
        continue;
    }
    const recols: number[][] = [];
    if (t.recol_s && t.recol_d) {
        for (let i = 0; i < t.recol_s.length; i++) {
            recols.push([t.recol_s[i], t.recol_d[i]]);
        }
    }
    npcs.push({
        id,
        name: t.name,
        models: t.models ? Array.from(t.models) : [],
        ops: t.op ? [...t.op] : [],
        size: t.size,
        readyanim: t.readyanim ?? -1,
        walkanim: t.walkanim ?? -1,
        walkanim_b: t.walkanim_b ?? -1,
        walkanim_r: t.walkanim_r ?? -1,
        walkanim_l: t.walkanim_l ?? -1,
        recols
    });
}
fs.mkdirSync(OUT, { recursive: true });
const dest = path.join(OUT, 'npcs.json');
fs.writeFileSync(dest, JSON.stringify(npcs));
const lev = npcs.find(n => n.id === 942);
printInfo(`Wrote ${npcs.length} npcs → ${dest}`);
printInfo(`npc 942 recols=${JSON.stringify(lev?.recols ?? [])}`);
