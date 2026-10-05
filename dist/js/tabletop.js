import { validateState, consumeTableHit } from './engine.js';
import { cards, cardById, monsterById, isHero, stackIds, playerFor, runtimePlayable } from './advanced.js';
import { advancedCatalog } from './advanced-data.js';
import { validateContentPack } from './content-validation.js';
import { unitDefinitions } from './content.js';
const fail = (message) => { throw new Error(message); };
const number = (n, min, max, label) => Number.isSafeInteger(n) && n >= min && n <= max ? n : fail(`${label} must be a whole number from ${min} to ${max}.`);
const die = (s, sides) => { const limit = Math.floor(0xffffffff / sides) * sides; for (;;) {
    let x = s.rng | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    s.rng = x >>> 0;
    const value = s.rng - 1;
    if (value < limit)
        return 1 + value % sides;
} };
const removeCard = (s, id) => {
    const a = s.advanced;
    for (const zones of [a.hands, a.owned, a.decks, a.discards])
        for (const key of Object.keys(zones))
            zones[key] = zones[key].filter(x => x !== id);
    a.eliminatedTreasures = a.eliminatedTreasures.filter(x => x !== id);
    a.removedCards = a.removedCards.filter(x => x !== id);
};
const shuffle = (s, ids) => { for (let i = ids.length - 1; i > 0; i--) {
    let value = 0, space = 1;
    while (space < i + 1) {
        value = value * 6 + die(s, 6) - 1;
        space *= 6;
    }
    const limit = Math.floor(space / (i + 1)) * (i + 1);
    if (value >= limit) {
        i++;
        continue;
    }
    const j = value % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
} return ids; };
export function validateTabletop(value) {
    if (value === undefined)
        return [];
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return ['Invalid tabletop state.'];
    const t = value;
    if (t.version !== 1 || typeof t.manualVictory !== 'boolean' || typeof t.setupSource !== 'string' || t.setupSource.length > 2000 || !Array.isArray(t.rulings) || t.rulings.length > 250 || t.rulings.some(x => typeof x !== 'string' || x.length > 2000))
        return ['Invalid tabletop record.'];
    if (t.review !== null && (!t.review || typeof t.review.playerId !== 'string' || !cardById(t.review.cardId)))
        return ['Invalid table adjudication.'];
    if (t.reviews !== undefined && (!Array.isArray(t.reviews) || t.reviews.length > 12 || t.reviews.some(x => !x || typeof x.playerId !== 'string' || !cardById(x.cardId))))
        return ['Invalid nested table resolutions.'];
    if (t.privateRulings !== undefined && (!t.privateRulings || typeof t.privateRulings !== 'object' || Array.isArray(t.privateRulings) || Object.keys(t.privateRulings).length > 6 || Object.values(t.privateRulings).some(p => !Array.isArray(p) || p.length > 250 || p.some(x => typeof x !== 'string' || x.length > 2000))))
        return ['Invalid private table rulings.'];
    if (t.enslaved !== undefined && (!Array.isArray(t.enslaved) || t.enslaved.length > 4 || t.enslaved.some(x => !x || typeof x.id !== 'string' || typeof x.armyId !== 'string') || new Set(t.enslaved.map(x => x.id)).size !== t.enslaved.length || new Set(t.enslaved.map(x => x.armyId)).size !== t.enslaved.length))
        return ['Invalid Enslaved Hero markers.'];
    return [];
}
export function applyTableOperation(state, operation, reason, actorPlayerId) {
    if (!state.tabletop || !state.advanced)
        fail('Start a Full tabletop campaign to use table controls.');
    if (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 800)
        fail('Describe the printed rule or table ruling (3–800 characters).');
    const s = structuredClone(state), a = s.advanced, t = s.tabletop;
    const hex = (id) => s.hexes.find(h => h.id === id) ?? fail('Choose an existing hex.');
    const unit = (id) => s.units.find(u => u.id === id) ?? fail('Choose a deployed unit.');
    const kingdom = (id) => s.kingdoms.find(k => k.id === id && !k.collapsed) ?? fail('Choose a living kingdom.');
    const player = (id) => a.players.find(p => p.id === id) ?? fail('Choose a player.');
    const unlink = (id) => { delete a.stacks[id]; for (const hero of Object.keys(a.stacks))
        if (a.stacks[hero] === id)
            delete a.stacks[hero]; };
    const place = (u, h) => {
        if (s.units.some(v => v.id !== u.id && v.hexId === h.id && (v.kingdom !== u.kingdom || isHero(s, v) === isHero(s, u))))
            fail('This hex already holds an incompatible unit.');
        u.hexId = h.id;
        const partner = s.units.find(v => v.id !== u.id && v.hexId === h.id && v.kingdom === u.kingdom && isHero(s, v) !== isHero(s, u));
        if (partner)
            a.stacks[isHero(s, u) ? u.id : partner.id] = isHero(s, u) ? partner.id : u.id;
    };
    const removeUnit = (u) => { if (t.enslaved)
        t.enslaved = t.enslaved.filter(x => x.armyId !== u.id); unlink(u.id); a.locked = a.locked.filter(id => id !== u.id); a.activationIds = a.activationIds.filter(id => id !== u.id); delete a.movement[u.id]; if (isHero(s, u))
        a.eliminatedHeroes.push(u.defId); s.units = s.units.filter(v => v.id !== u.id); if (s.activeUnitId === u.id) {
        s.activeUnitId = null;
        s.remainingMP = 0;
    } };
    let summary = '', privateChange = false, playerId = actorPlayerId ?? t.review?.playerId ?? playerFor(s, s.currentKingdom).id;
    player(playerId);
    switch (operation.kind) {
        case 'place': {
            const d = s.unitDefinitions.find(d => d.id === operation.defId) ?? fail('Choose a counter from the supply.');
            kingdom(d.kingdom);
            if (s.units.filter(u => u.defId === d.id).length >= d.count)
                fail('All copies of this counter are deployed.');
            if (d.kind === 'hero') {
                if (!a.heroPools[d.kingdom]?.includes(d.id))
                    fail('This Hero is not in the available pool.');
                a.heroPools[d.kingdom] = a.heroPools[d.kingdom].filter(id => id !== d.id);
            }
            const u = { id: `unit-${s.serial++}`, defId: d.id, kingdom: d.kingdom, hexId: operation.hexId, weakened: operation.weakened, activated: operation.finished };
            place(u, hex(operation.hexId));
            s.units.push(u);
            summary = `Placed ${d.name} at ${operation.hexId}.`;
            break;
        }
        case 'move': {
            const u = unit(operation.unitId), h = hex(operation.hexId), ids = operation.wholeStack ? stackIds(s, u.id) : [u.id];
            if (!operation.wholeStack)
                unlink(u.id);
            const moving = s.units.filter(v => ids.includes(v.id));
            if (s.units.some(v => !ids.includes(v.id) && v.hexId === h.id && (v.kingdom !== u.kingdom || moving.some(m => isHero(s, v) === isHero(s, m)))))
                fail('The destination holds an incompatible unit.');
            const from = u.hexId;
            for (const v of moving)
                v.hexId = h.id;
            if (moving.length === 1)
                place(u, h);
            summary = `Relocated ${s.unitDefinitions.find(d => d.id === u.defId).name} from ${from} to ${h.id}.`;
            break;
        }
        case 'unit': {
            const u = unit(operation.unitId), name = s.unitDefinitions.find(d => d.id === u.defId).name;
            if (operation.status === 'eliminate')
                removeUnit(u);
            if (operation.status === 'weakened') {
                if (isHero(s, u))
                    fail('Heroes have no weakened side.');
                u.weakened = true;
            }
            if (operation.status === 'full')
                u.weakened = false;
            if (operation.status === 'ready')
                u.activated = false;
            if (operation.status === 'finished') {
                u.activated = true;
                if (stackIds(s, u.id).includes(s.activeUnitId ?? '')) {
                    s.activeUnitId = null;
                    s.remainingMP = 0;
                    a.activationIds = [];
                }
            }
            if (operation.status === 'lock') {
                if (!isHero(s, u))
                    fail('Only a Hero card can lock.');
                if (!a.locked.includes(u.id))
                    a.locked.push(u.id);
            }
            if (operation.status === 'unlock')
                a.locked = a.locked.filter(id => id !== u.id);
            summary = `${name}: ${operation.status}.`;
            break;
        }
        case 'stack': {
            const h = unit(operation.heroId);
            if (!isHero(s, h))
                fail('Choose a Hero.');
            unlink(h.id);
            if (operation.armyId) {
                const army = unit(operation.armyId);
                if (isHero(s, army) || army.kingdom !== h.kingdom || army.hexId !== h.hexId || Object.values(a.stacks).includes(army.id))
                    fail('Choose an unaccompanied Army of the same kingdom in this hex.');
                a.stacks[h.id] = army.id;
            }
            summary = operation.armyId ? 'Joined Hero and Army.' : 'Detached Hero.';
            break;
        }
        case 'resource': {
            const k = kingdom(operation.kingdomId);
            k.gold = number(operation.gold, 0, 1000000, 'Gold');
            k.income = number(operation.income, 0, 10000, 'Income');
            k.revolt = number(operation.revolt, 0, 19, 'Revolt');
            k.controlLimit = number(operation.controlLimit, 0, 200, 'Control supply');
            s.scenario.kingdoms.find(v => v.id === k.id).controlLimit = k.controlLimit;
            summary = `${k.name}: ${k.gold} gold, ${k.income} income, ${k.revolt} revolt, ${k.controlLimit} control supply.`;
            break;
        }
        case 'marker': {
            const h = hex(operation.hexId);
            if (!h.settlement)
                fail('Markers require a Settlement.');
            delete s.controls[h.id];
            s.razed = s.razed.filter(id => id !== h.id);
            s.covens = s.covens.filter(id => id !== h.id);
            s.covenProtected = s.covenProtected.filter(id => id !== h.id);
            if (operation.marker === 'control') {
                const k = kingdom(operation.kingdomId);
                s.controls[h.id] = k.id;
                k.hasEverControlled = true;
            }
            if (operation.marker === 'coven') {
                kingdom('night');
                s.covens.push(h.id);
                privateChange = true;
                playerId = playerFor(s, 'night').id;
            }
            if (operation.marker === 'razed')
                s.razed.push(h.id);
            summary = privateChange ? 'Adjusted a secret marker.' : `${h.settlement.name}: ${operation.marker} marker.`;
            break;
        }
        case 'draw': {
            const p = player(operation.playerId);
            playerId = p.id;
            const key = operation.deck;
            if (!['spells', 'treasures', ...p.kingdoms.map(k => `blessings-${k}`)].includes(key))
                fail('Choose a deck belonging to this player.');
            const n = number(operation.count, 1, 10, 'Draw count'), deck = a.decks[key] ??= [];
            let drawn = 0;
            for (let i = 0; i < n; i++) {
                if (!deck.length) {
                    if (key === 'treasures') {
                        deck.push(...shuffle(s, a.eliminatedTreasures));
                        a.eliminatedTreasures = [];
                    }
                    else {
                        const zone = key === 'spells' ? 'spells' : 'blessings', ids = a.discards[zone].filter(id => key === 'spells' || cardById(id)?.kingdom === key.slice(10));
                        a.discards[zone] = a.discards[zone].filter(id => !ids.includes(id));
                        deck.push(...shuffle(s, ids));
                    }
                }
                const id = deck.shift();
                if (id) {
                    a.hands[p.id].push(id);
                    drawn++;
                }
            }
            summary = `${p.name} drew ${drawn} ${key === 'spells' ? 'Spell' : key === 'treasures' ? 'Treasure' : 'Blessing'} card${drawn === 1 ? '' : 's'}.`;
            privateChange = true;
            break;
        }
        case 'card':
        case 'play': {
            const p = player(operation.playerId), c = cardById(operation.cardId) ?? fail('Choose a Magic card.');
            playerId = p.id;
            if (c.kind === 'hero')
                fail('Hero cards travel with their counters.');
            if (![...a.hands[p.id], ...a.owned[p.id]].includes(c.id))
                fail('That card is not in this player’s hand or owned collection.');
            if (operation.kind === 'play') {
                if (t.review)
                    (t.reviews ??= []).push(t.review);
                if ((t.reviews?.length ?? 0) > 12)
                    fail('Finish a nested resolution before adding another.');
                if (!a.hands[p.id].includes(c.id))
                    fail('Retrieve the Treasure before playing it.');
                removeCard(s, c.id);
                (c.kind === 'treasure' ? a.owned[p.id] : a.discards[c.kind === 'spell' ? 'spells' : 'blessings']).push(c.id);
                t.review = { cardId: c.id, playerId: p.id };
                summary = `${p.name} played ${c.name}; resolving at the table.`;
            }
            else {
                if (operation.zone === 'owned' && c.kind !== 'treasure')
                    fail('Only Treasures enter an owned collection.');
                if (operation.zone === 'eliminated' && c.kind !== 'treasure')
                    fail('Use the discard pile for Spells and Blessings.');
                removeCard(s, c.id);
                if (operation.zone === 'hand')
                    a.hands[p.id].push(c.id);
                if (operation.zone === 'owned')
                    a.owned[p.id].push(c.id);
                if (operation.zone === 'discard') {
                    if (c.kind === 'treasure')
                        a.eliminatedTreasures.push(c.id);
                    else
                        a.discards[c.kind === 'spell' ? 'spells' : 'blessings'].push(c.id);
                }
                if (operation.zone === 'eliminated')
                    a.eliminatedTreasures.push(c.id);
                if (operation.zone === 'removed')
                    a.removedCards.push(c.id);
                privateChange = operation.zone === 'hand';
                summary = privateChange ? `${p.name} adjusted a private card.` : `${c.name} moved to ${operation.zone}.`;
            }
            break;
        }
        case 'complete':
            if (!t.review)
                fail('No table card is waiting.');
            else {
                if (t.review.playerId !== playerId)
                    fail('Pass table controls to the player resolving this card.');
                summary = `Completed table resolution of ${cardById(t.review.cardId).name}.`;
                t.review = t.reviews?.pop() ?? null;
            }
            break;
        case 'consume-hit':
            consumeTableHit(s);
            summary = 'Consumed one pending hit after a table prevention or rescue.';
            break;
        case 'monster': {
            const d = monsterById(operation.defId) ?? fail('Choose a Monster.'), h = hex(operation.hexId), pool = a.monsterPools[d.pool];
            const index = pool.indexOf(d.id);
            if (index < 0)
                fail('That Monster is not in the supply.');
            if (a.monsters.some(m => m.hexId === h.id))
                fail('This hex already holds a Monster.');
            if (operation.kingdomId) {
                kingdom(operation.kingdomId);
                if (a.monsters.filter(m => m.kingdom === operation.kingdomId).length >= 3)
                    fail('A kingdom can command at most three Monsters.');
            }
            a.eventSerial = Math.max(a.eventSerial, ...a.monsters.map(m => Number(m.id.replace('monster-', ''))).filter(Number.isFinite)) + 1;
            pool.splice(index, 1);
            a.monsters.push({ id: `monster-${a.eventSerial}`, defId: d.id, hexId: h.id, kingdom: operation.kingdomId, lair: operation.lair, weakened: false, activated: false });
            summary = `Placed ${d.name} at ${h.id}.`;
            break;
        }
        case 'remove-monster': {
            const m = a.monsters.find(m => m.id === operation.monsterId) ?? fail('Choose a deployed Monster.');
            a.monsters = a.monsters.filter(v => v.id !== m.id);
            if (operation.recycle)
                a.monsterPools[monsterById(m.defId).pool].push(m.defId);
            else
                a.defeatedMonsters.push(m.defId);
            summary = `${monsterById(m.defId).name} ${operation.recycle ? 'returned to the pool' : 'defeated'}.`;
            break;
        }
        case 'hex': {
            const original = hex(operation.hex.id);
            if (original.q !== operation.hex.q || original.r !== operation.hex.r)
                fail('Use a content pack to change board coordinates.');
            s.hexes[s.hexes.indexOf(original)] = structuredClone(operation.hex);
            summary = `Updated map data at ${original.id}.`;
            break;
        }
        case 'edge': {
            const from = hex(operation.from), to = hex(operation.to);
            if (Math.max(Math.abs(from.q - to.q), Math.abs(from.r - to.r), Math.abs(from.q + from.r - to.q - to.r)) !== 1)
                fail('Choose adjacent hexes.');
            (from.edges ??= {})[to.id] = structuredClone(operation.edge);
            (to.edges ??= {})[from.id] = structuredClone(operation.edge);
            summary = `Updated crossing ${from.id} ↔ ${to.id}.`;
            break;
        }
        case 'clock': {
            kingdom(operation.kingdomId);
            number(operation.year, s.scenario.startYear, s.scenario.endYear, 'Year');
            if (![0, 1, 2].includes(operation.season) || !['income-actions', 'activation'].includes(operation.phase))
                fail('Choose a valid date and phase.');
            s.year = operation.year;
            s.season = operation.season;
            s.turnIndex = s.scenario.turnOrder.indexOf(operation.kingdomId);
            s.currentKingdom = operation.kingdomId;
            s.phase = operation.phase;
            s.turnSerial++;
            s.winner = null;
            s.victoryReason = '';
            s.pendingCombat = null;
            s.activeUnitId = null;
            s.remainingMP = 0;
            s.shipUsed = false;
            s.moved = false;
            s.allRoad = true;
            a.pending = null;
            a.battle = null;
            a.activationIds = [];
            a.movement = {};
            summary = `Table resumes with ${kingdom(operation.kingdomId).name}, ${['Spring', 'Summer', 'Autumn'][s.season]} ${s.year}, ${s.phase}.`;
            break;
        }
        case 'roll': {
            if (![6, 8].includes(operation.sides))
                fail('Choose light d6 or heavy d8.');
            const n = number(operation.count, 1, 20, 'Dice count');
            summary = `Table dice (${n}d${operation.sides}): ${Array.from({ length: n }, () => die(s, operation.sides)).join(', ')}.`;
            break;
        }
        case 'effect': {
            if (!cardById(operation.cardId))
                fail('Choose a source card.');
            if (!s.units.some(u => u.id === operation.target) && !s.hexes.some(h => h.id === operation.target) && !a.monsters.some(m => m.id === operation.target))
                fail('Choose an effect target.');
            for (const key of ['light', 'heavy', 'movement', 'fortification'])
                number(operation[key], -20, 20, key);
            if (!['activation', 'turn'].includes(operation.duration))
                fail('Choose a printed effect duration.');
            if (operation.duration === 'activation' && !s.activeUnitId)
                fail('Activate the relevant unit before applying a current-activation effect.');
            const abilities = operation.abilities;
            if (abilities.length > 12 || abilities.some(x => !['mage', 'flying', 'ranged', 'stealth', 'regenerate', 'siege'].includes(x)))
                fail('Choose printed abilities.');
            a.effects.push({ cardId: operation.cardId, target: operation.target, light: operation.light, heavy: operation.heavy, movement: operation.movement, fortification: operation.fortification, abilities, expires: s.turnSerial, activation: operation.duration === 'activation' ? s.activeUnitId : null, extra: { tableRuling: true } });
            if (a.movement[operation.target] !== undefined) {
                a.movement[operation.target] += operation.movement;
                if (s.activeUnitId)
                    s.remainingMP = Math.max(0, Math.min(...stackIds(s, s.activeUnitId).map(id => a.movement[id] ?? s.unitDefinitions.find(d => d.id === unit(id).defId).movement)));
            }
            summary = `Applied table modifiers from ${cardById(operation.cardId).name} to ${operation.target}.`;
            break;
        }
        case 'victory':
            if (!['invader', 'resistance'].includes(operation.side) || !operation.reason.trim() || operation.reason.length > 800)
                fail('Choose the winning alliance and explain the scenario result.');
            else {
                s.winner = operation.side;
                s.phase = 'game-over';
                s.victoryReason = operation.reason;
                s.pendingCombat = null;
                s.activeUnitId = null;
                s.remainingMP = 0;
                a.pending = null;
                a.battle = null;
                t.review = null;
                summary = `${operation.side} victory: ${operation.reason}`;
            }
            break;
        case 'enslave': {
            const u = unit(operation.armyId);
            if (isHero(s, u))
                fail('An Enslaved Hero must accompany an Army.');
            t.enslaved ??= [];
            if (operation.release) {
                t.enslaved = t.enslaved.filter(x => x.armyId !== u.id);
                summary = `Released ${s.unitDefinitions.find(d => d.id === u.defId).name} to its printed kingdom.`;
            }
            else {
                const night = kingdom('night');
                if (s.kingdoms.find(k => k.id === u.kingdom)?.side === night.side || s.hexes.find(h => h.id === u.hexId)?.settlement || stackIds(s, u.id).length > 1 || t.enslaved.some(x => x.armyId === u.id))
                    fail('Enslave requires an enemy Army with no Hero, outside any Settlement.');
                if (t.enslaved.length >= 4)
                    fail('All four Enslaved Hero counters are deployed.');
                const id = ['enslaved-1', 'enslaved-2', 'enslaved-3', 'enslaved-4'].find(id => !t.enslaved.some(x => x.id === id));
                t.enslaved.push({ id, armyId: u.id });
                summary = `${id} accompanies ${s.unitDefinitions.find(d => d.id === u.defId).name}; Night controls its table actions. Printed kingdom remains ${u.kingdom}.`;
            }
            break;
        }
        case 'hero-power': {
            const p = player(operation.playerId), hero = s.units.find(u => u.defId === operation.cardId && isHero(s, u) && p.kingdoms.includes(u.kingdom)) ?? fail('This Hero is not controlled by the current player.');
            if (t.review)
                (t.reviews ??= []).push(t.review);
            if ((t.reviews?.length ?? 0) > 12)
                fail('Finish a nested resolution before adding another.');
            playerId = p.id;
            t.review = { cardId: hero.defId, playerId: p.id };
            summary = `${p.name} resolves ${cardById(hero.defId).name}’s Power at the table.`;
            break;
        }
        case 'campaign': {
            if (!operation.name.trim() || operation.name.length > 100 || operation.source.length > 2000)
                fail('Enter a campaign name and source of at most 2,000 characters.');
            const ids = s.kingdoms.map(k => k.id);
            if (operation.turnOrder.length !== ids.length || new Set(operation.turnOrder).size !== ids.length || operation.turnOrder.some(id => !ids.includes(id)))
                fail('Turn order must contain each kingdom once.');
            for (const k of s.kingdoms) {
                const side = operation.alliances[k.id];
                if (!['invader', 'resistance'].includes(side))
                    fail('Choose an alliance for every kingdom.');
                k.side = side;
                s.scenario.kingdoms.find(v => v.id === k.id).side = side;
            }
            if (!s.kingdoms.some(k => k.side === 'invader') || !s.kingdoms.some(k => k.side === 'resistance'))
                fail('Include both alliances.');
            s.scenario.name = operation.name;
            s.scenario.source = operation.source;
            s.scenario.turnOrder = operation.turnOrder;
            s.turnIndex = operation.turnOrder.indexOf(s.currentKingdom);
            s.scenario.objective = structuredClone(operation.objective);
            t.manualVictory = operation.manualVictory;
            t.setupSource = operation.source;
            summary = `Updated campaign alliances, turn order and victory conditions.`;
            break;
        }
        case 'note':
            if (!operation.text.trim() || operation.text.length > 800)
                fail('Enter a table note (up to 800 characters).');
            else
                summary = operation.text;
            break;
        default: fail('Unknown table operation.');
    }
    const log = `Table: ${summary} Rule: ${reason.trim()}`;
    s.log.push(log);
    s.log = s.log.slice(-250);
    if (privateChange) {
        const pile = (t.privateRulings ??= {})[playerId] ??= [];
        pile.push(log);
        t.privateRulings[playerId] = pile.slice(-250);
    }
    else {
        t.rulings.push(log);
        t.rulings = t.rulings.slice(-250);
    }
    validateContentPack({ version: 1, hexes: s.hexes, unitDefinitions: s.unitDefinitions, scenario: s.scenario });
    const issues = validateState(s);
    if (issues.length)
        fail(issues.slice(0, 3).join('; '));
    return { state: s, summary, private: privateChange, playerId };
}
/** Blank calibration templates carry location labels but make no terrain claims. */
export function tabletopConfig(boardIds, name, startYear = 1, endYear = 10) {
    const boards = advancedCatalog.maps.boards.filter(b => boardIds.includes(b.id));
    if (!boards.length)
        fail('Choose at least one board.');
    const hexes = [], coordinates = new Set();
    for (const [index, board] of boards.entries()) {
        const offsetQ = (index % 2) * 15, offsetR = Math.floor(index / 2) * 17 - Math.floor(offsetQ / 2);
        for (let q = 0; q < 14; q++)
            for (let j = 0; j < 15; j++) {
                const r = j - Math.floor(q / 2), globalQ = q + offsetQ, globalR = r + offsetR, key = `${globalQ},${globalR}`;
                if (coordinates.has(key))
                    continue;
                coordinates.add(key);
                // The scanned-board coordinate inventory and the cropped digital Wildlands
                // graph have different origins. Never copy mechanics across those origins.
                const h = { id: `${board.id}-${q}-${r}`, q: globalQ, r: globalR, terrain: 'clear' };
                const settlement = board.settlements.find(x => x.axialQ === q && x.axialR === r);
                if (settlement && !h.settlement)
                    h.settlement = { name: settlement.name, loyalty: null, city: false, fortified: 0, port: false };
                if (board.mines.some(x => x.axialQ === q && x.axialR === r))
                    h.mine = true;
                if (board.lairs.some(x => x.axialQ === q && x.axialR === r))
                    h.terrain = 'lair';
                hexes.push(h);
            }
    }
    const names = { empire: 'Eastern Empire', fjordland: 'Fjordland', oathborn: 'Oathborn', goblins: 'Goblins', orcs: 'Orcs', night: 'Army of the Night' };
    const ids = ['empire', 'fjordland', 'oathborn', 'goblins', 'orcs', 'night'];
    const scenario = { id: 'tabletop-custom', name: name.trim() || 'Custom campaign table', official: false, source: 'Player-entered Campaign Book setup; board template has unverified terrain and seams.', startYear, endYear, startSeason: 0, endSeason: 2, turnOrder: ids, kingdoms: ids.map(id => ({ id, name: names[id], side: ['goblins', 'orcs', 'night'].includes(id) ? 'invader' : 'resistance', gold: 10, income: ['goblins', 'orcs'].includes(id) ? 0 : 3, controlLimit: id === 'night' ? 5 : 100, ...(id === 'empire' ? { revolt: 0 } : {}) })), initialUnits: [], objective: { type: 'survival', hexIds: [], count: 0, deadlineOnly: true }, notes: ['Full tabletop: enter the printed setup before play. Unknown terrain defaults to clear as an editable placeholder. Boards are separated by a gap; calibrate joins in a content pack. Victory is adjudicated from the printed scenario.'] };
    return { hexes, unitDefinitions: structuredClone(unitDefinitions), scenario, profile: 'advanced', tabletop: true, controllers: Object.fromEntries(ids.map(id => [id, 'human'])) };
}
export const manualEffectCount = cards.filter(c => !runtimePlayable(c)).length;
