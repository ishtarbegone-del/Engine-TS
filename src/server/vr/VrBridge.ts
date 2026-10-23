import fs from 'fs';

import LocType from '#/cache/config/LocType.js';
import NpcType from '#/cache/config/NpcType.js';
import ObjType from '#/cache/config/ObjType.js';
import InvType from '#/cache/config/InvType.js';
import { CoordGrid } from '#/engine/CoordGrid.js';
import { Interaction } from '#/engine/entity/Interaction.js';
import Loc from '#/engine/entity/Loc.js';
import Npc from '#/engine/entity/Npc.js';
import { EntityLifeCycle } from '#/engine/entity/EntityLifeCycle.js';
import Obj from '#/engine/entity/Obj.js';
import Player from '#/engine/entity/Player.js';
import { PlayerLoading } from '#/engine/entity/PlayerLoading.js';
import { NpcStat } from '#/engine/entity/NpcStat.js';
import { PlayerStat } from '#/engine/entity/PlayerStat.js';
import Component from '#/cache/config/Component.js';
import ScriptProvider from '#/engine/script/ScriptProvider.js';
import ScriptRunner from '#/engine/script/ScriptRunner.js';
import ServerTriggerType from '#/engine/script/ServerTriggerType.js';
import World from '#/engine/World.js';
import Packet from '#/io/Packet.js';
import MessageGame from '#/network/game/server/model/MessageGame.js';
import ServerGameMessage from '#/network/game/server/ServerGameMessage.js';
import Environment from '#/util/Environment.js';
import { printError, printInfo } from '#/util/Logger.js';

type VrIntent =
    | { type: 'hello' }
    | { type: 'walk'; x: number; z: number; run?: boolean }
    | { type: 'oploc'; x: number; z: number; loc: number; op?: number }
    | { type: 'opnpc'; slot: number; op?: number }
    | { type: 'opobj'; x: number; z: number; obj: number; op?: number }
    | { type: 'invop'; slot: number; obj: number; op?: number }
    | { type: 'logout' };

type InvSlot = { slot: number; id: number; count: number; name: string };

const MELEE_HINT = /sword|scimitar|dagger|mace|battleaxe|axe|spear|halberd|warhammer|claws|whip|hasta|rapier/i;
const RANGED_HINT = /bow|crossbow|seercull|crystal bow/i;

function cleanOps(ops: (string | null)[] | null | undefined): (string | null)[] {
    return ops ? [...ops] : [];
}

function modelsOf(value: Uint16Array | null | undefined): number[] {
    return value ? Array.from(value) : [];
}

function weaponKind(player: Player): 'melee' | 'ranged' | 'none' {
    const worn = player.getInventory(InvType.WORN);
    if (!worn) {
        return 'none';
    }

    // wearpos 3 = righthand
    const item = worn.get(3);
    if (!item) {
        return 'none';
    }

    const type = ObjType.get(item.id);
    const name = type?.name ?? '';
    if (RANGED_HINT.test(name)) {
        return 'ranged';
    }
    if (MELEE_HINT.test(name)) {
        return 'melee';
    }
    return 'none';
}

function readInventory(player: Player, invId: number): InvSlot[] {
    const inv = player.getInventory(invId);
    if (!inv) {
        return [];
    }

    const slots: InvSlot[] = [];
    for (let slot = 0; slot < inv.capacity; slot++) {
        const item = inv.get(slot);
        if (!item) {
            continue;
        }
        const type = ObjType.get(item.id);
        slots.push({
            slot,
            id: item.id,
            count: item.count,
            name: type?.name ?? `#${item.id}`
        });
    }
    return slots;
}

function loadOrCreatePlayer(username: string): Player {
    const profile = Environment.NODE_PROFILE;
    const path = `data/players/${profile}/${username}.sav`;

    if (fs.existsSync(path)) {
        const sav = Packet.load(path);
        return PlayerLoading.load(username, sav, null);
    }

    return PlayerLoading.load(username, new Packet(new Uint8Array(0)), null);
}

function firstValidOp(ops: (string | null)[] | null | undefined, preferred: number): number {
    if (ops && ops[preferred - 1] && ops[preferred - 1] !== 'hidden') {
        return preferred;
    }
    if (!ops) {
        return preferred;
    }
    const idx = ops.findIndex(op => op && op !== 'hidden');
    return idx === -1 ? preferred : idx + 1;
}

export function startVrBridge(): void {
    const host = Environment.VR_BIND;
    const port = Environment.VR_BRIDGE_PORT;
    const chat: string[] = [];
    let player: Player | null = null;
    let snapshotTimer: ReturnType<typeof setInterval> | null = null;

    function attachChat(target: Player): void {
        const original = target.write.bind(target);
        target.write = (message: ServerGameMessage) => {
            if (message instanceof MessageGame) {
                chat.push(message.msg);
                if (chat.length > 40) {
                    chat.shift();
                }
            }
            original(message);
        };
    }

    function keepAlive(): void {
        if (!player || !player.isActive) {
            return;
        }
        player.lastConnected = World.currentTick;
        player.lastResponse = World.currentTick;
    }

    function snapshot() {
        if (!player || !player.isActive) {
            return null;
        }

        keepAlive();
        ensureBronzeAxe(player);

        const range = Environment.VR_SNAPSHOT_RANGE;
        const zoneR = Math.max(1, Math.ceil(range / 8));
        const npcs: object[] = [];
        const locs: object[] = [];
        const objs: object[] = [];
        const seenLoc = new Set<string>();
        const seenNpc = new Set<number>();
        const seenObj = new Set<string>();

        for (let dz = -zoneR; dz <= zoneR; dz++) {
            for (let dx = -zoneR; dx <= zoneR; dx++) {
                const zx = player.x + dx * 8;
                const zz = player.z + dz * 8;
                const zone = World.gameMap.getZone(zx, zz, player.level);

                for (const npc of zone.getAllNpcsSafe()) {
                    if (seenNpc.has(npc.nid) || CoordGrid.distanceToSW(player, npc) > range) {
                        continue;
                    }
                    seenNpc.add(npc.nid);
                    const type = NpcType.get(npc.type);
                    npcs.push({
                        slot: npc.nid,
                        type: npc.type,
                        name: type?.name ?? `#${npc.type}`,
                        x: npc.x,
                        z: npc.z,
                        level: npc.level,
                        size: type?.size ?? 1,
                        models: modelsOf(type?.models),
                        ops: cleanOps(type?.op),
                        hp: npc.levels[NpcStat.HITPOINTS],
                        hpMax: npc.baseLevels[NpcStat.HITPOINTS],
                        anim: npc.animId
                    });
                }

                for (const loc of zone.getAllLocsSafe()) {
                    const key = `${loc.x}:${loc.z}:${loc.type}:${loc.shape}`;
                    if (seenLoc.has(key) || CoordGrid.distanceToSW(player, loc) > range) {
                        continue;
                    }
                    seenLoc.add(key);
                    const type = LocType.get(loc.type);
                    locs.push({
                        type: loc.type,
                        name: type?.name ?? `#${loc.type}`,
                        x: loc.x,
                        z: loc.z,
                        level: loc.level,
                        shape: loc.shape,
                        angle: loc.angle,
                        width: loc.width,
                        length: loc.length,
                        models: modelsOf(type?.models),
                        ops: cleanOps(type?.op),
                        anim: type?.anim ?? -1,
                        seq: type?.anim ?? -1,
                        changed: loc.isChanged()
                    });
                }

                for (const obj of zone.getAllObjsSafe()) {
                    const key = `${obj.x}:${obj.z}:${obj.type}`;
                    if (seenObj.has(key) || CoordGrid.distanceToSW(player, obj) > range) {
                        continue;
                    }
                    seenObj.add(key);
                    const type = ObjType.get(obj.type);
                    objs.push({
                        type: obj.type,
                        name: type?.name ?? `#${obj.type}`,
                        x: obj.x,
                        z: obj.z,
                        level: obj.level,
                        count: obj.count,
                        model: type?.model ?? -1,
                        stackH: 0,
                        ops: cleanOps(type?.op)
                    });
                }
            }
        }

        const pending = chat.splice(0, chat.length);

        return {
            type: 'snapshot',
            tick: World.currentTick,
            player: {
                username: player.username,
                x: player.x,
                z: player.z,
                level: player.level,
                runEnergy: player.runenergy,
                combatLevel: player.combatLevel,
                anim: player.animId,
                delayed: player.delayed,
                inv: readInventory(player, InvType.INV),
                worn: readInventory(player, InvType.WORN),
                weaponKind: weaponKind(player),
                hp: player.levels[PlayerStat.HITPOINTS],
                hpMax: player.baseLevels[PlayerStat.HITPOINTS]
            },
            npcs,
            locs,
            objs,
            chat: pending
        };
    }

    let bronzeAxeGranted = false;

    function inventoryHas(target: Player, invId: number, objId: number): boolean {
        if (invId < 0) {
            return false;
        }
        const inv = target.getInventory(invId);
        return !!inv && inv.getItemCount(objId) > 0;
    }

    function ensureBronzeAxe(target: Player): void {
        let axeId = ObjType.getId('bronze_axe');
        if (axeId < 0) {
            axeId = 1351;
        }
        if (inventoryHas(target, InvType.INV, axeId) || inventoryHas(target, InvType.WORN, axeId)) {
            bronzeAxeGranted = true;
            return;
        }
        if (bronzeAxeGranted) {
            return;
        }
        if (InvType.INV < 0) {
            printInfo('[vr] bronze_axe skip: InvType.INV not loaded');
            return;
        }
        const inv = target.getInventory(InvType.INV);
        if (!inv) {
            printInfo('[vr] bronze_axe skip: no inv');
            return;
        }
        const added = target.invAdd(InvType.INV, axeId, 1, false);
        bronzeAxeGranted = true;
        printInfo(`[vr] bronze_axe add id=${axeId} added=${added}`);
    }

    function login(): Player {
        const existing = World.getPlayerByUsername(Environment.VR_USERNAME);
        if (existing) {
            attachChat(existing);
            ensureBronzeAxe(existing);
            return existing;
        }

        const created = loadOrCreatePlayer(Environment.VR_USERNAME);
        created.members = true;
        if (!Environment.NODE_PRODUCTION) {
            created.staffModLevel = 4;
        }
        attachChat(created);
        World.newPlayers.add(created);
        ensureBronzeAxe(created);
        return created;
    }

    function handleIntent(intent: VrIntent): object {
        if (intent.type === 'hello') {
            player = login();
            return { type: 'logged_in', username: Environment.VR_USERNAME };
        }

        if (intent.type === 'logout') {
            if (player && player.isActive) {
                player.requestLogout = true;
            }
            return { type: 'ok' };
        }

        if (!player) {
            return { type: 'error', message: 'Send hello first' };
        }

        if (!player.isActive) {
            return { type: 'error', message: 'Player is still joining the world' };
        }

        keepAlive();

        if (intent.type === 'walk') {
            if (player.delayed) {
                return { type: 'ok', ignored: 'delayed' };
            }
            player.clearPendingAction();
            const packed = [CoordGrid.packCoord(player.level, intent.x | 0, intent.z | 0)];
            player.pathToMoveClick(packed, true);
            player.tempRun = intent.run ? 1 : 0;
            return { type: 'ok' };
        }

        if (intent.type === 'oploc') {
            const loc = World.getLoc(intent.x | 0, intent.z | 0, player.level, intent.loc | 0);
            if (!(loc instanceof Loc)) {
                return { type: 'error', message: 'Loc not found' };
            }
            const type = LocType.get(loc.type);
            const op = firstValidOp(type?.op, intent.op ?? 1);
            if (player.delayed) {
                return { type: 'ok', ignored: 'delayed' };
            }
            player.clearPendingAction();
            player.setInteraction(Interaction.ENGINE, loc, ServerTriggerType.APLOC1 + (op - 1));
            player.pathToTarget();
            return { type: 'ok', op };
        }

        if (intent.type === 'opnpc') {
            const npc = World.getNpc(intent.slot | 0);
            if (!(npc instanceof Npc)) {
                return { type: 'error', message: 'Npc not found' };
            }
            const type = NpcType.get(npc.type);
            const op = firstValidOp(type?.op, intent.op ?? 1);
            if (player.delayed || npc.delayed) {
                return { type: 'ok', ignored: 'delayed' };
            }
            player.clearPendingAction();
            player.setInteraction(Interaction.ENGINE, npc, ServerTriggerType.APNPC1 + (op - 1));
            player.pathToTarget();
            return { type: 'ok', op };
        }

        if (intent.type === 'opobj') {
            const obj = World.getObj(intent.x | 0, intent.z | 0, player.level, intent.obj | 0, player.hash64);
            if (!(obj instanceof Obj)) {
                return { type: 'error', message: 'Obj not found' };
            }
            const type = ObjType.get(obj.type);
            const op = firstValidOp(type?.op, intent.op ?? 1);
            if (player.delayed) {
                return { type: 'ok', ignored: 'delayed' };
            }
            player.clearPendingAction();
            player.setInteraction(Interaction.ENGINE, obj, ServerTriggerType.APOBJ1 + (op - 1));
            player.pathToTarget();
            return { type: 'ok', op };
        }

        if (intent.type === 'invop') {
            if (player.delayed) {
                return { type: 'ok', ignored: 'delayed' };
            }
            let slot = intent.slot | 0;
            const objId = intent.obj | 0;
            const inv = player.getInventory(InvType.INV);
            if (!inv) {
                return { type: 'error', message: 'Inv slot mismatch', slot, obj: objId };
            }
            if (!inv.validSlot(slot) || !inv.hasAt(slot, objId)) {
                slot = inv.getItemIndex(objId);
            }
            if (slot < 0) {
                return { type: 'error', message: 'Inv slot mismatch', slot, obj: objId };
            }
            const obj = ObjType.get(objId);
            if (!obj) {
                return { type: 'error', message: 'Inv slot mismatch', slot, obj: objId };
            }
            // Wear/Wield is [opheld2,_] — not INV_BUTTON1 (that's wornitems:wear).
            let op = intent.op ?? 1;
            if (op !== 5 && obj.wearpos >= 0) {
                const wearIdx = obj.iop.findIndex(s => s !== null && /^(wear|wield)$/i.test(s));
                op = wearIdx >= 0 ? wearIdx + 1 : 2;
            }
            // Packed iop[4] is often null; 2004 still shows default Drop.
            if (op !== 5 && obj.iop[op - 1] === null) {
                return { type: 'error', message: 'No item op', slot, obj: objId, op };
            }
            const com = Component.getByName('inventory:inv');
            if (com && !player.isComponentVisible(com)) {
                player.setTab(com.rootLayer, 3);
            }
            player.lastItem = objId;
            player.lastSlot = slot;
            player.clearPendingAction();
            player.moveClickRequest = false;
            const trigger = ServerTriggerType.OPHELD1 + (op - 1);
            const script = ScriptProvider.getByTrigger(trigger, obj.id, obj.category);
            if (script) {
                player.executeScript(ScriptRunner.init(script, player), true);
                return { type: 'ok', op, slot };
            }
            if (op === 5) {
                const item = inv.get(slot);
                const count = item?.count ?? 0;
                const dropped = player.invDel(InvType.INV, objId, count, slot);
                if (dropped === 0) {
                    return { type: 'error', message: 'Inv slot mismatch', slot, obj: objId };
                }
                const floorObj = new Obj(player.level, player.x, player.z, EntityLifeCycle.DESPAWN, objId, dropped);
                World.addObj(floorObj, player.hash64, 200);
                return { type: 'ok', op, slot, dropped };
            }
            return { type: 'ok', op, slot };
        }

        return { type: 'error', message: 'Unknown intent' };
    }

    const server = Bun.serve<{ buffer: string }>({
        hostname: host,
        port,
        fetch(req, srv) {
            const upgraded = srv.upgrade(req, { data: { buffer: '' } });
            if (upgraded) {
                return undefined;
            }
            return new Response('Lost City VR bridge', { status: 200 });
        },
        websocket: {
            open(ws) {
                printInfo('VR client connected');
                ws.send(JSON.stringify({ type: 'ready', bind: host, port }));
                if (snapshotTimer) {
                    clearInterval(snapshotTimer);
                }
                snapshotTimer = setInterval(() => {
                    const snap = snapshot();
                    if (snap) {
                        try {
                            ws.send(JSON.stringify(snap));
                        } catch {
                            // socket closed between ticks
                        }
                    }
                }, 200);
            },
            message(ws, message) {
                const text = typeof message === 'string' ? message : Buffer.from(message).toString('utf8');
                ws.data.buffer += text;
                const parts = ws.data.buffer.split('\n');
                ws.data.buffer = parts.pop() ?? '';
                for (const part of parts) {
                    const line = part.trim();
                    if (!line) {
                        continue;
                    }
                    try {
                        const intent = JSON.parse(line) as VrIntent;
                        ws.send(JSON.stringify(handleIntent(intent)));
                    } catch (err) {
                        printError(`VR bridge bad message: ${err}`);
                        ws.send(JSON.stringify({ type: 'error', message: 'Bad JSON' }));
                    }
                }

                // also accept a single JSON object without a trailing newline
                const leftover = ws.data.buffer.trim();
                if (leftover.startsWith('{') && leftover.endsWith('}')) {
                    try {
                        const intent = JSON.parse(leftover) as VrIntent;
                        ws.data.buffer = '';
                        ws.send(JSON.stringify(handleIntent(intent)));
                    } catch {
                        // wait for more data
                    }
                }
            },
            close() {
                printInfo('VR client disconnected');
                if (snapshotTimer) {
                    clearInterval(snapshotTimer);
                    snapshotTimer = null;
                }
                if (player && player.isActive) {
                    player.requestLogout = true;
                }
            }
        }
    });

    printInfo(`VR bridge listening on ws://${host}:${port}`);
    return server;
}
