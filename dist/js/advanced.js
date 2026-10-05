import { advancedCatalog } from './advanced-data.js';
export const cards = advancedCatalog.cards;
export const monsters = advancedCatalog.monsters;
export const cardById = (id) => cards.find(c => c.id === id);
export const monsterById = (id) => monsters.find(m => m.id === id);
/** Reference faces are separate from rules whose complete decision flow is implemented.
 * Incomplete effects never enter the playable decks or appear as legal Powers. */
export const runtimeLimitations = {
    'treasure-05': 'Interception before enemy entry needs a placement window.',
    'treasure-12': 'The Hero escape occurs after that Hero is chosen for a hit.',
    'blessing-oathborn-06': 'The winner chooses an extra advance and attack.',
    'blessing-goblins-05': 'Returning the card to hand needs a combat result choice.',
    'blessing-orcs-01': 'Movement must preserve a mandatory legal Attack action.',
    'blessing-night-02': 'Enslaved Heroes require their separate four-counter supply and release lifecycle.',
    'blessing-night-03': 'Enslaved Heroes require their separate four-counter supply and release lifecycle.',
    'blessing-night-04': 'Enslaved Heroes require their separate four-counter supply and release lifecycle.',
    'blessing-night-06': 'Coven protection needs all build and discovery event hooks.',
    'blessing-night-08': 'Coven discovery needs a Strike replacement window.',
    'blessing-night-09': 'The Hero escape occurs after it is selected for elimination.',
    'hero-fjordland-13': 'The save interrupts the chosen Hero’s elimination.',
    'hero-empire-13': 'Post-advance movement and extra Attack need a new activation window.',
    'hero-oathborn-11': 'The defender needs optional advance and counterattack choices.',
    'hero-goblins-16': 'Reroll selection must include every d6 event, including outside combat.',
    'hero-orcs-12': 'The Power requires two separately chosen enemy targets.',
    'hero-night-12': 'Assassination uses elimination instead of ordinary Strike hits.',
};
export const runtimePlayable = (c) => !runtimeLimitations[c.id];
export const playableCounts = Object.fromEntries(['spell', 'treasure', 'blessing', 'hero'].map(kind => [kind, cards.filter(c => c.kind === kind && runtimePlayable(c)).length]));
const unique = (x) => [...new Set(x)];
export const isHero = (s, u) => s.unitDefinitions.find(d => d.id === u.defId)?.kind === 'hero';
export function stackIds(s, id) {
    const a = s.advanced;
    if (!a)
        return [id];
    const army = a.stacks[id] ?? id;
    return unique([army, ...Object.keys(a.stacks).filter(h => a.stacks[h] === army)]).filter(id => s.units.some(u => u.id === id));
}
export const playerFor = (s, kingdom) => s.advanced?.players.find(p => p.kingdoms.includes(kingdom));
export function advancedActor(s) {
    const a = s.advanced, p = a?.pending;
    if (p) {
        if (p.kind === 'study' || p.kind === 'winter')
            return a.players[p.playerIndex].kingdoms.find(k => !s.kingdoms.find(x => x.id === k)?.collapsed) ?? a.players[p.playerIndex].kingdoms[0];
        if (p.kind === 'window')
            return a.players.find(x => x.id === p.players[p.index])?.kingdoms.find(k => !s.kingdoms.find(x => x.id === k)?.collapsed) ?? s.currentKingdom;
        if (p.kind === 'hit')
            return s.units.find(u => u.id === p.target)?.kingdom ?? a.monsters.find(m => m.id === p.target)?.kingdom ?? s.currentKingdom;
        if (p.kind === 'satchel')
            return a.players.find(x => x.id === p.playerId)?.kingdoms.find(k => !s.kingdoms.find(x => x.id === k)?.collapsed) ?? s.currentKingdom;
        if (p.kind === 'choice')
            return a.players.find(x => x.id === p.playerId)?.kingdoms.find(k => !s.kingdoms.find(x => x.id === k)?.collapsed) ?? s.currentKingdom;
        if (p.kind === 'command')
            return p.choices[0] ?? s.currentKingdom;
    }
    return s.pendingCombat?.decisionKingdom ?? s.currentKingdom;
}
function shuffle(s, array, ctx) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randomIndex(s, i + 1, ctx);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function randomIndex(s, n, ctx) {
    if (n < 2)
        return 0;
    let value = 0, space = 1;
    while (space < n) {
        value = value * 6 + ctx.die(s, 6) - 1;
        space *= 6;
    }
    const limit = Math.floor(space / n) * n;
    return value >= limit ? randomIndex(s, n, ctx) : value % n;
}
export function assignStudyMarkers(s, ctx) { const a = s.advanced; const live = s.scenario.turnOrder.filter(k => !s.kingdoms.find(x => x.id === k)?.collapsed), n = s.scenario.turnOrder.length; const glyphs = n === 2 ? 2 : n === 3 ? 3 : 4, churns = n >= 4 ? 2 : 1; const pool = [...Array(glyphs).fill('glyph'), ...Array(churns + (a.extraChurn ? 1 : 0)).fill('churn')]; shuffle(s, pool, ctx); a.studyMarkers = Object.fromEntries(live.map((k, i) => [k, pool[i]])); }
export function initializeAdvanced(s, config, ctx) {
    const players = config.players?.length ? structuredClone(config.players) : s.kingdoms.map(k => ({ id: `player-${k.id}`, name: k.name, kingdoms: [k.id] }));
    const a = { version: 1, players, hands: {}, owned: {}, decks: { spells: [], treasures: [] }, discards: { spells: [], blessings: [] }, eliminatedTreasures: [], removedCards: [], heroPools: {}, eliminatedHeroes: [], locked: [], stacks: {}, movement: {}, activationIds: [], effects: [], monsters: [], monsterPools: { land: [], sea: [] }, explored: [], defeatedMonsters: [], studyMarkers: {}, extraChurn: false, pending: null, battle: null, playedTreasures: {}, lastPlay: null, eventSerial: 0 };
    s.advanced = a;
    for (const c of cards.filter(c => c.verified && (c.kind === 'hero' || config.tabletop || runtimePlayable(c)))) {
        if (c.kind === 'spell')
            a.decks.spells.push(c.id);
        if (c.kind === 'treasure')
            a.decks.treasures.push(c.id);
        if (c.kind === 'blessing' && s.kingdoms.some(k => k.id === c.kingdom))
            (a.decks[`blessings-${c.kingdom}`] ??= []).push(c.id);
        if (c.kind === 'hero' && s.kingdoms.some(k => k.id === c.kingdom))
            (a.heroPools[c.kingdom] ??= []).push(c.id);
    }
    for (const m of monsters)
        for (let i = 0; i < (m.count ?? 1); i++)
            a.monsterPools[m.pool].push(m.id);
    for (const u of s.units.filter(u => isHero(s, u)))
        a.heroPools[u.kingdom] = a.heroPools[u.kingdom].filter(id => id !== u.defId);
    for (const deck of Object.values(a.decks))
        shuffle(s, deck, ctx);
    for (const pool of Object.values(a.heroPools))
        shuffle(s, pool, ctx);
    shuffle(s, a.monsterPools.land, ctx);
    shuffle(s, a.monsterPools.sea, ctx);
    for (const p of players) {
        a.hands[p.id] = [];
        a.owned[p.id] = [];
        draw(s, p.id, 'spells', 3, ctx);
        for (const k of p.kingdoms)
            draw(s, p.id, `blessings-${k}`, 1, ctx);
    }
    assignStudyMarkers(s, ctx);
    ctx.log(s, 'Advanced rules: shared player hands, Heroes, Magic, Monsters and Arcane Study.');
}
function draw(s, player, deck, count, ctx) {
    const a = s.advanced, d = a.decks[deck] ??= [];
    for (let i = 0; i < count; i++) {
        if (!d.length) {
            const discard = deck.startsWith('blessings-') ? 'blessings' : deck;
            if (discard === 'treasures') {
                d.push(...shuffle(s, a.eliminatedTreasures, ctx));
                a.eliminatedTreasures = [];
            }
            const recycled = discard === 'treasures' ? [] : (a.discards[discard] ?? []).filter(id => deck === 'spells' || cardById(id)?.kingdom === deck.slice(10));
            a.discards[discard] = (a.discards[discard] ?? []).filter(id => !recycled.includes(id));
            d.push(...shuffle(s, recycled, ctx));
        }
        const id = d.shift();
        if (id)
            a.hands[player].push(id);
    }
}
function discard(s, player, id) {
    const a = s.advanced, c = cardById(id);
    a.hands[player] = a.hands[player].filter(x => x !== id);
    if (c.kind === 'treasure') {
        if (!a.owned[player].includes(id))
            a.owned[player].push(id);
        a.playedTreasures[id] = s.turnSerial;
    }
    else if (c.kind === 'spell' || c.kind === 'blessing')
        (a.discards[c.kind === 'spell' ? 'spells' : 'blessings'] ??= []).push(id);
}
export function beginStudy(s, ctx) { const a = s.advanced; recycleHeroes(s, ctx); const marker = a.studyMarkers[s.currentKingdom] ?? 'churn'; a.pending = { kind: 'study', playerIndex: 0, allowance: marker === 'glyph' ? 3 : 1, disciplines: [], marker }; ctx.log(s, `Arcane Study: ${marker === 'glyph' ? 'Glyph — up to 3 different disciplines' : 'Churn — 1 discipline'} for every player.`); skipCollapsedPlayers(s, ctx); }
function skipCollapsedPlayers(s, ctx) {
    const a = s.advanced, p = a.pending;
    if (!p || !(p.kind === 'study' || p.kind === 'winter'))
        return;
    while (p.playerIndex < a.players.length && a.players[p.playerIndex].kingdoms.every(k => s.kingdoms.find(x => x.id === k)?.collapsed))
        p.playerIndex++;
    if (p.playerIndex >= a.players.length) {
        a.pending = null;
        if (p.kind === 'winter') {
            finishWinterDecks(s, ctx);
        }
        ctx.advanceTurn(s);
    }
}
export function beginWinter(s, ctx) {
    const a = s.advanced;
    for (const id of a.defeatedMonsters)
        a.monsterPools[monsterById(id).pool].push(id);
    a.defeatedMonsters = [];
    a.explored = [];
    a.effects = [];
    a.extraChurn = false;
    assignStudyMarkers(s, ctx);
    for (const pool of Object.values(a.monsterPools))
        shuffle(s, pool, ctx);
    a.pending = { kind: 'winter', playerIndex: 0 };
    ctx.log(s, 'Winter: defeated Lairs reopen. Commanded Monsters remain. Sell excess Treasures before the decks are shuffled.');
    skipCollapsedPlayers(s, ctx);
}
function finishWinterDecks(s, ctx) {
    const a = s.advanced;
    a.decks.treasures.push(...a.eliminatedTreasures);
    a.eliminatedTreasures = [];
    a.decks.spells.push(...a.discards.spells);
    a.discards.spells = [];
    for (const k of s.kingdoms) {
        a.decks[`blessings-${k.id}`] ??= [];
        a.decks[`blessings-${k.id}`].push(...a.discards.blessings.filter(id => cardById(id)?.kingdom === k.id));
    }
    a.discards.blessings = [];
    for (const deck of Object.values(a.decks))
        shuffle(s, deck, ctx);
}
function recycleHeroes(s, ctx) {
    const a = s.advanced;
    for (const id of a.eliminatedHeroes) {
        const c = cardById(id);
        if (c?.kingdom)
            (a.heroPools[c.kingdom] ??= []).push(id);
    }
    a.eliminatedHeroes = [];
    for (const pool of Object.values(a.heroPools))
        shuffle(s, pool, ctx);
}
export function heroDefinitions() { return cards.filter(c => c.kind === 'hero' && c.verified && c.unitDefinition).map(c => ({ ...Object.fromEntries(Object.entries(c.unitDefinition).filter(([key]) => ['cost', 'recoveryCost', 'movement', 'light', 'heavy', 'weakenedLight', 'weakenedHeavy', 'abilities', 'characteristics'].includes(key))), id: c.id, name: c.name, kingdom: c.kingdom, kind: 'hero', heroCardId: c.id, count: 1 })); }
function gainHero(s, k, hex, ctx, chosen, gainedByMagic = false) {
    if (s.kingdoms.find(v => v.id === k)?.collapsed)
        return;
    const a = s.advanced, id = chosen ?? a.heroPools[k]?.shift();
    if (chosen)
        a.heroPools[k] = a.heroPools[k].filter(id => id !== chosen);
    const d = s.unitDefinitions.find(d => d.id === id);
    if (!id || !d)
        return;
    const h = ctx.hex(s, hex), army = s.units.find(u => u.hexId === hex && !isHero(s, u));
    const u = { id: `unit-${s.serial++}`, defId: id, kingdom: k, hexId: hex, weakened: false, activated: gainedByMagic && army ? army.activated : !!army?.activated || !(h.entry === k || (h.settlement && ctx.controller(s, h) === k && !s.razed.includes(hex))) };
    s.units.push(u);
    if (army && army.kingdom === k)
        a.stacks[u.id] = army.id;
    ctx.log(s, `${d.name} joins ${s.kingdoms.find(x => x.id === k).name}${army ? ' with ' + ctx.rawDef(s, army).name : ''}.`);
    return u;
}
export function effectiveDefinition(s, u, base) {
    const a = s.advanced;
    if (!a)
        return base;
    const group = stackIds(s, u.id).map(id => s.units.find(v => v.id === id)).filter(Boolean);
    const ownEffects = a.effects.filter(e => e.target === u.id || e.target === u.hexId);
    const memberAbilities = (v) => unique([...s.unitDefinitions.find(d => d.id === v.defId).abilities, ...a.effects.filter(e => e.target === v.id || e.target === v.hexId).flatMap(e => e.abilities ?? [])]);
    let abilities = memberAbilities(u);
    if (group.length > 1) {
        abilities = unique([...abilities, ...group.flatMap(v => memberAbilities(v).filter(x => ['ranged', 'stealth'].includes(x)))]);
        if (!group.every(v => memberAbilities(v).includes('flying')))
            abilities = abilities.filter(x => x !== 'flying');
    }
    let characteristics = unique([...base.characteristics, ...ownEffects.flatMap(e => e.extra?.characteristics ?? [])]);
    const army = group.find(v => !isHero(s, v)), hero = group.find(v => isHero(s, v));
    if (isHero(s, u) && army && a.enslaved?.[army.id])
        return { ...base, movement: s.unitDefinitions.find(d => d.id === army.defId).movement, abilities: memberAbilities(army), characteristics: [] };
    if (hero && army && hero.defId === 'hero-goblins-15' && /plague fl/i.test(s.unitDefinitions.find(d => d.id === army.defId).name))
        abilities = unique([...abilities, 'flying']);
    if (!isHero(s, u) && hero) {
        const hd = s.unitDefinitions.find(d => d.id === hero.defId);
        const feral = hd.characteristics.includes('feral') || a.effects.some(e => e.target === hero.id && e.extra?.characteristics?.includes('feral'));
        if (!feral)
            characteristics = characteristics.filter(x => x !== 'feral');
    }
    const wind = hero && army && u.id === army.id && hero.defId === 'hero-night-15' && base.abilities.includes('flying') ? 1 : 0;
    const deep = ownEffects.some(e => e.extra?.deepPaths);
    return { ...base, abilities, characteristics, movement: deep ? 5 : base.movement + wind + ownEffects.reduce((n, e) => n + (e.movement ?? 0), 0) };
}
function stackEffect(e) {
    return cardById(e.cardId)?.targets.some(t => t === 'stack' || t.endsWith('-stack') || t.includes('combat-stack') || t.includes('stack-with')) ?? false;
}
function modifyPool(pool, effects) {
    let { light, heavy } = pool;
    for (const e of effects) {
        light += e.light ?? 0;
        heavy += e.heavy ?? 0;
        if (e.multiplyLight)
            light *= e.multiplyLight;
        if (e.extra?.multiplyHeavy)
            heavy *= e.extra.multiplyHeavy;
        if (e.convertLightToHeavy) {
            const n = Math.min(Math.max(0, light), e.convertLightToHeavy);
            light -= n;
            heavy += n;
        }
    }
    return { light: Math.max(0, light), heavy: Math.max(0, heavy) };
}
export function adjustedDice(s, id, base, includeStack = true) {
    const a = s.advanced;
    if (!a)
        return base;
    const fullStack = stackIds(s, id), ids = includeStack ? fullStack : [id], army = fullStack.map(id => s.units.find(u => u.id === id)).find(u => u && !isHero(s, u));
    let light = 0, heavy = 0;
    for (const member of ids) {
        const u = s.units.find(u => u.id === member), d = u && s.unitDefinitions.find(d => d.id === u.defId), hex = u && s.hexes.find(h => h.id === u.hexId);
        const pool = member === id ? { ...base } : d ? { light: u.weakened ? d.weakenedLight ?? d.light : d.light, heavy: u.weakened ? d.weakenedHeavy ?? d.heavy : d.heavy } : { light: 0, heavy: 0 };
        if (u && isHero(s, u)) {
            if (u.defId === 'hero-oathborn-15' && army && /miner/i.test(s.unitDefinitions.find(d => d.id === army.defId).name))
                pool.light++;
            if (u.defId === 'hero-goblins-14' && army && /elite/i.test(s.unitDefinitions.find(d => d.id === army.defId).name))
                pool.light++;
            if (u.defId === 'hero-orcs-15' && hex?.terrain === 'forest')
                pool.light++;
            if (u.defId === 'hero-night-16' && army && s.unitDefinitions.find(d => d.id === army.defId).characteristics.includes('feral'))
                pool.light++;
        }
        const adjusted = modifyPool(pool, a.effects.filter(e => e.target === member && !stackEffect(e)));
        light += adjusted.light;
        heavy += adjusted.heavy;
    }
    const stackEffects = a.effects.filter(e => ids.includes(e.target) && stackEffect(e));
    ({ light, heavy } = modifyPool({ light, heavy }, stackEffects));
    const hex = s.hexes.find(h => h.id === s.units.find(u => u.id === id)?.hexId);
    if (ids.some(id => s.units.find(u => u.id === id)?.defId === 'hero-fjordland-12') && hex && (hex.coastal || hex.terrain === 'coastal') && light > 0) {
        light--;
        heavy++;
    }
    for (const e of a.effects.filter(e => ids.includes(e.target))) {
        if (e.cardId === 'treasure-26') {
            const b = a.battle, owner = s.units.find(u => u.id === e.target)?.kingdom, op = b && (ctxSide(s, b.attackerKingdom, owner ?? '') ? playerFor(s, b.defenderKingdom) : playerFor(s, b.attackerKingdom));
            heavy += (b?.plays ?? []).filter((p) => p.playerId === op?.id && ['spell', 'treasure'].includes(cardById(p.cardId)?.kind ?? '')).length;
        }
        if (e.cardId === 'treasure-15') {
            const b = a.battle, op = playerFor(s, combatantKingdom(s, e.target)), count = (b?.plays ?? []).filter((p) => p.playerId === op?.id && ['spell', 'treasure'].includes(cardById(p.cardId)?.kind ?? '')).length;
            if (e.extra?.choice === 'heavy')
                heavy -= count;
            else
                light -= count;
        }
    }
    return { light: Math.max(0, light), heavy: Math.max(0, heavy) };
}
export function finishAdvancedActivation(s, ctx) {
    const a = s.advanced;
    const ids = unique([...a.activationIds, ...(s.activeUnitId ? stackIds(s, s.activeUnitId) : [])]);
    for (const id of ids) {
        const u = s.units.find(x => x.id === id);
        if (u)
            u.activated = true;
    }
    a.effects = a.effects.filter(e => !e.activation || !ids.includes(e.activation));
    a.activationIds = [];
    a.movement = {};
}
export function advancedTurnReady(s) {
    const a = s.advanced;
    a.shipsThisTurn = [];
    a.locked = a.locked.filter(id => s.units.find(u => u.id === id)?.kingdom !== s.currentKingdom);
    for (const m of a.monsters)
        if (m.kingdom === s.currentKingdom)
            m.activated = false;
    a.effects = a.effects.filter(e => e.expires >= s.turnSerial);
}
export function recordElimination(s, u, ctx) {
    const a = s.advanced;
    queueAdvancedEvent(s, { type: 'unit-eliminated', unitId: u.id, unit: structuredClone(u), army: !isHero(s, u), kingdom: u.kingdom });
    if (isHero(s, u)) {
        if (!a.eliminatedHeroes.includes(u.defId))
            a.eliminatedHeroes.push(u.defId);
        delete a.stacks[u.id];
        a.locked = a.locked.filter(x => x !== u.id);
    }
    else
        for (const h of Object.keys(a.stacks))
            if (a.stacks[h] === u.id)
                delete a.stacks[h];
    a.activationIds = a.activationIds.filter(x => x !== u.id);
}
export function advancedCanBuild(s, d, h) {
    const a = s.advanced;
    if (!a)
        return !s.units.some(u => u.hexId === h.id);
    return !s.units.some(u => u.hexId === h.id && (u.kingdom !== d.kingdom || (d.kind === 'hero' ? isHero(s, u) : !isHero(s, u))));
}
function hexFeatures(h) { return unique([h.terrain, ...(h.coastal ? ['coastal'] : []), ...(h.settlement?.wilderness ? [h.settlement.wilderness] : []), ...(Object.values(h.edges ?? {}).some(e => e.river === 2) ? ['major-river'] : [])]); }
function hexDistance(a, b) { return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r)); }
function targetHex(s, id, ctx) { const u = s.units.find(u => u.id === id) ?? (s.advanced?.pending?.kind === 'window' && s.advanced.pending.event?.unitId === id ? s.advanced.pending.event.unit : undefined), m = s.advanced.monsters.find(m => m.id === id); return s.hexes.find(h => h.id === (u?.hexId ?? m?.hexId ?? id)); }
function combatantKingdom(s, id) { return s.units.find(u => u.id === id)?.kingdom ?? s.advanced.monsters.find(m => m.id === id)?.kingdom ?? s.currentKingdom; }
function combatantPool(s, id, ctx, stack = true) {
    const u = s.units.find(u => u.id === id);
    if (u) {
        const d = ctx.rawDef(s, u);
        return adjustedDice(s, u.id, u.weakened ? { light: d.weakenedLight ?? d.light, heavy: d.weakenedHeavy ?? d.heavy } : { light: d.light, heavy: d.heavy }, stack);
    }
    const m = s.advanced.monsters.find(m => m.id === id);
    if (m) {
        const d = monsterById(m.defId);
        return adjustedDice(s, m.id, m.weakened ? { light: d.weakenedLight ?? d.light, heavy: d.weakenedHeavy ?? d.heavy } : { light: d.light, heavy: d.heavy });
    }
    const h = s.hexes.find(h => h.id === id);
    return adjustedDice(s, id ?? '', { light: h?.settlement ? (h.settlement.city ? 3 : 1) : 0, heavy: 0 });
}
function combatantAbilities(s, id, ctx) {
    const u = s.units.find(u => u.id === id);
    if (u)
        return ctx.def(s, u).abilities;
    const m = s.advanced.monsters.find(m => m.id === id);
    return unique([...(m ? monsterById(m.defId)?.abilities ?? [] : []), ...s.advanced.effects.filter(e => e.target === id).flatMap(e => e.abilities ?? [])]);
}
function eventAllows(s, c, player) {
    const a = s.advanced, p = a.pending;
    const current = playerFor(s, s.currentKingdom)?.id === player;
    if (c.kind === 'blessing' && !c.cantrip && c.kingdom !== s.currentKingdom)
        return false;
    if (!p)
        return s.phase === 'activation' && (current || c.cantrip) && c.timing.some(t => ['activation', 'battle-magic'].includes(t) && t !== 'battle-magic');
    if (p.kind !== 'window')
        return false;
    if (p.players[p.index] !== player)
        return false;
    const w = p.window;
    if (w === 'interject')
        return c.cantrip && c.timing.includes('activation');
    if (w === 'battle')
        return c.timing.some(t => ['activation', 'battle-magic', 'attack-or-strike-before-roll', 'caster-stack-attacked-or-struck', 'defending-or-struck-in-unfortified-hex'].includes(t)) && (p.step === 0 && current || c.cantrip);
    if (!c.cantrip && !current)
        return false;
    if (w === 'reaction')
        return c.timing.some(t => ['magic-card-just-played', 'magic-card-just-played-before-roll', 'spell-just-cast', 'hero-that-just-cast-spell', 'source-casts-mage-required-spell-or-blessing'].includes(t));
    if (w === 'roll')
        return c.timing.some(t => ['after-dice-roll', 'after-own-combat-roll', 'after-caster-stack-combat-roll', 'after-combat-or-strike-success-roll'].includes(t));
    if (w === 'critical')
        return c.timing.includes('critical-confirmation-pending');
    if (w === 'hits')
        return c.timing.some(t => ['hits-pending', 'between-pending-hits'].includes(t)) || c.effect.recoverArmy;
    if (w === 'strike' && c.effect.type === 'lightning-axes')
        return a.battle?.kind === 'ambush';
    if (w === 'strike')
        return c.timing.some(t => ['strike-declared-before-roll', 'attack-or-strike-before-roll', 'caster-stack-attacked-or-struck', 'defending-or-struck-in-unfortified-hex'].includes(t));
    if (w === 'movement')
        return c.timing.some(t => ['immediately-after-hex-entry', 'immediately-on-sea-hexside-crossing'].includes(t)) && !(p.event?.ship && c.effect.type === 'earth-to-mud') && (!p.event?.ship ? c.effect.type !== 'moryanas-fury' : true);
    if (w === 'elimination')
        return c.timing.some(t => (t === p.event?.type || p.event?.type === 'unit-eliminated' && (t === 'army-eliminated' && p.event.army || t === 'goblin-army-eliminated' && p.event.army && p.event.kingdom === 'goblins')));
    return false;
}
function relevantTarget(s, c, id, caster, player, ctx) {
    const e = c.effect, a = s.advanced, p = a.pending, b = a.battle, u = s.units.find(u => u.id === id), m = a.monsters.find(m => m.id === id), h = targetHex(s, id, ctx), cu = s.units.find(u => u.id === caster), ch = caster ? targetHex(s, caster, ctx) : undefined, owner = a.players.find(p => p.id === player);
    if (c.kingdom && u && u.kingdom !== c.kingdom && !(['enslave', 'pestilence'].includes(e.type) || c.kind === 'hero' && !c.targets.some(t => t.includes(c.kingdom) || t.includes('source'))))
        return false;
    if (c.kind === 'blessing' && m)
        return false;
    if (c.range && ch && h) {
        const dist = hexDistance(ch, h);
        if (dist < c.range.min || dist > c.range.max)
            return false;
    }
    const targetsStack = c.targets.some(t => t === 'stack' || t.endsWith('-stack') || t.includes('stack-with'));
    if (e.requiresLightDice && combatantPool(s, id, ctx, targetsStack).light === 0)
        return false;
    if (e.requiresHeavyDice && combatantPool(s, id, ctx, targetsStack).heavy === 0)
        return false;
    if (e.light < 0 && combatantPool(s, id, ctx, targetsStack).light <= 0)
        return false;
    if (e.heavy < 0 && combatantPool(s, id, ctx, targetsStack).heavy <= 0)
        return false;
    if (c.targets.some(t => t === 'army' || t.endsWith('-army')) && !c.targets.some(t => ['unit', 'stack', 'monster', 'garrison'].includes(t)) && u && isHero(s, u))
        return false;
    if (e.requiresStackedArmy && e.requiresStackedArmy !== 'fragile-or-weakened' && cu && !stackIds(s, cu.id).some(id => s.units.find(u => u.id === id)?.defId === e.requiresStackedArmy))
        return false;
    if (e.requiresAtLeastOneSpellBeforePlay && !a.hands[player].some(id => cardById(id)?.kind === 'spell'))
        return false;
    if (e.oncePerCombat && a.effects.some(e => e.cardId === c.id))
        return false;
    if (c.targets.some(t => t === 'army-in-source-hero-hex' || t === 'army-stacked-with-source-hero') && (!cu || !u || isHero(s, u) || cu.hexId !== u.hexId))
        return false;
    if (e.recoverAll && !s.units.some(u => u.kingdom === c.kingdom && u.weakened))
        return false;
    if (e.recoverArmy && (!u || isHero(s, u) || !u.weakened))
        return false;
    if (e.requiresFullStrengthSpells && a.hands[player].filter(id => cardById(id)?.kind === 'spell').length < 3)
        return false;
    if ((e.discardSpells ?? 0) > a.hands[player].filter(x => x !== c.id && cardById(x)?.kind === 'spell').length)
        return false;
    if (e.requiresNotInSettlement && ch?.settlement && !s.razed.includes(ch.id))
        return false;
    if (e.strike && ((h?.settlement?.fortified && e.type !== 'earthquake' && e.type !== 'knives-in-the-dark') || (e.type !== 'knives-in-the-dark' && a.effects.some(e => (e.target === id || e.target === h?.id) && (e.fortification ?? 0) > 0)) || (e.type === 'earthquake' && h?.settlement?.fortified === 2)))
        return false;
    if (e.requiresAttackingSettlement && (!b || b.attackerKingdom !== cu?.kingdom || !ctx.hex(s, b.targetHex).settlement))
        return false;
    if (e.requiresDefender && (!b || id === b.attacker || stackIds(s, b.attacker).includes(id)))
        return false;
    if (e.requiresUnfortifiedHex && h?.settlement?.fortified)
        return false;
    if (e.requiresTerrain && h) {
        if (e.requiresTerrain === 'coastal-adjacent-to-sea') {
            if (!hexFeatures(h).includes('coastal') || !ctx.adjacent(s, h.id).some(t => t.terrain === 'sea'))
                return false;
        }
        else {
            const terrain = e.requiresTerrain.replace('in-or-adjacent-to-', '').replace('adjacent-to-', '');
            const around = ctx.adjacent(s, h.id);
            if (!((!e.requiresTerrain.startsWith('adjacent-to-') && h.terrain === terrain) || around.some(t => t.terrain === terrain)))
                return false;
        }
    }
    if (e.requiresOccupyingOrAttacking && h) {
        const terrains = Array.isArray(e.requiresOccupyingOrAttacking) ? e.requiresOccupyingOrAttacking : [e.requiresOccupyingOrAttacking];
        const hs = [h, ...(b && id === b.attacker ? [ctx.hex(s, b.targetHex)] : [])];
        if (!hs.some(h => hexFeatures(h).some(x => terrains.includes(x)) || terrains.includes('wilderness') && hexFeatures(h).some(x => ['forest', 'mountain', 'swamp'].includes(x))))
            return false;
    }
    const type = e.type;
    if (type === 'immortal-sorceress') {
        const original = p?.kind === 'window' ? p.play : undefined, card = cardById(original?.cardId ?? '');
        if (!original || original.casterId !== caster || original.playerId !== player || !['spell', 'blessing'].includes(card?.kind ?? '') || !(card?.mage || cardById(original.tomeId ?? '')?.mage))
            return false;
    }
    if (type === 'illusion' && (!b || id !== (b.kind === 'ambush' ? (b.step === 0 ? (b.ambush === 'attacker' ? b.attacker : b.defender) : (b.ambush === 'attacker' ? b.defender : b.attacker)) : b.attacker) && !stackIds(s, b.attacker).includes(id)))
        return false;
    if (type === 'cloud-of-darkness' && (!b || h?.id !== b.targetHex))
        return false;
    if (type === 'staff-of-plagues' && (!b || id === caster || caster && stackIds(s, caster).includes(id)))
        return false;
    if (type === 'sleep' && (!b || id !== b.attacker || !u || isHero(s, u)))
        return false;
    if (type === 'blood-magic' && (!cu || !isHero(s, cu) || !u || isHero(s, u) || u.hexId !== cu.hexId))
        return false;
    if (type === 'ritual-of-power' && (!cu || !u || isHero(s, u) || u.hexId !== cu.hexId || !combatantPool(s, id, ctx, false).light))
        return false;
    if (type === 'sigil-of-courage' && (!cu || !stackIds(s, cu.id).some(id => { const v = s.units.find(u => u.id === id); return v && !isHero(s, v) && (v.weakened || ctx.rawDef(s, v).characteristics.includes('fragile')); })))
        return false;
    if (['tidal-shelter', 'ring-of-invisibility', 'shapeshift'].includes(type) && p?.kind === 'window' && p.window === 'hits' && p.event?.target !== id && !stackIds(s, p.event?.target ?? '').includes(id))
        return false;
    if (c.kind === 'hero' && e.ongoing)
        return false;
    if (c.kind === 'spell' && b && p?.kind === 'window' && (p.window === 'battle' || p.window === 'reaction' && p.resume?.kind === 'window' && p.resume.window === 'battle')) {
        const other = ctxSide(s, owner.kingdoms[0], b.attackerKingdom) ? b.defender : b.attacker;
        if (other && stackIds(s, other).some(id => s.units.find(u => u.id === id)?.defId === 'hero-empire-14'))
            return false;
    }
    if (m && e.strike && m.kingdom && ctx.sameSide(s, m.kingdom, owner.kingdoms[0]))
        return false;
    if (type === 'delve-greedily' && (!(p?.kind === 'window') || id !== p.event?.unitId))
        return false;
    if (type === 'natural-selection' && (!(p?.kind === 'window') || !p.event?.army || p.event?.kingdom !== 'goblins' || !a.heroPools.goblins?.length))
        return false;
    if (type === 'pestilence' && (!u || u.kingdom === 'orcs' || ctx.sameSide(s, u.kingdom, 'orcs') || !ctx.adjacent(s, u.hexId).some(h => s.units.some(v => v.hexId === h.id && v.kingdom === 'orcs'))))
        return false;
    if (type === 'necromancy' && p?.kind === 'window' && (id !== p.event?.unitId || !p.event?.unit))
        return false;
    if (type === 'spellbound' && a.hands[player].filter(x => x !== c.id && cardById(x)?.kind === 'spell').length >= 3)
        return false;
    if (type === 'fear' && (!u || isHero(s, u)))
        return false;
    if (type === 'enslave' && (!u || isHero(s, u) || u.kingdom === 'night' || ctx.sameSide(s, u.kingdom, 'night') || !!h?.settlement || stackIds(s, id).length > 1 || !a.heroPools.night?.length))
        return false;
    if (type === 'demonic-possession' && (!u || !isHero(s, u) || owner.kingdoms.includes(u.kingdom)))
        return false;
    if (type === 'summon-the-dead' && m)
        return false;
    if (['summon-kraken', 'summon-morag'].includes(type) && !u)
        return false;
    if (c.targets.some(t => t.includes('feral-army')) && (!u || isHero(s, u) || !ctx.rawDef(s, u).characteristics.includes('feral')))
        return false;
    if (c.targets.some(t => t.includes('non-fragile')) && u && ctx.rawDef(s, u).characteristics.includes('fragile'))
        return false;
    const armyTypes = ['berserkir', 'rangers', 'cataphracts', 'korsari', 'sneaks', 'reavers'].filter(keyword => c.targets.some(t => t.includes(keyword)));
    if (armyTypes.length && (!u || !armyTypes.some(keyword => ctx.rawDef(s, u).name.toLowerCase().includes(keyword.replace('rangers', 'ranger')))))
        return false;
    if (c.kind === 'blessing' && c.kingdom && !u && h?.settlement && ctx.controller(s, h) !== c.kingdom)
        return false;
    if (e.casterRequires && (!caster || !combatantAbilities(s, caster, ctx).includes(e.casterRequires)))
        return false;
    if (e.casterArmyTypes && (!cu || isHero(s, cu) || !e.casterArmyTypes.includes(cu.defId)))
        return false;
    if (e.requiresCasterOccupies && ch?.terrain !== e.requiresCasterOccupies)
        return false;
    if (e.excludeArmyInSettlement && h?.settlement)
        return false;
    if (e.requiresArmyLightDice && (!u || isHero(s, u) || combatantPool(s, id, ctx, false).light === 0))
        return false;
    if (type === 'earth-to-mud' || type === 'moryanas-fury')
        return p?.kind === 'window' && id === p.event?.unitId && (type === 'moryanas-fury' ? !!p.event?.sea : !!u && !combatantAbilities(s, id, ctx).includes('flying') && !!h && ctx.canEnd(s, u, h));
    if (type === 'banished-to-meji')
        return p?.kind === 'window' && id === p.play?.casterId && !!u && isHero(s, u) && cardById(p.play?.cardId ?? '')?.kind === 'spell';
    if (['negation', 'orb-of-confusion', 'undertow'].includes(type)) {
        const last = p?.kind === 'window' ? p.play : a.lastPlay;
        if (!last || last.playerId === player || id !== last.playerId)
            return false;
        const other = cardById(last.cardId);
        if (type === 'undertow')
            return other?.kind === 'spell' && a.hands[last.playerId].some(x => cardById(x)?.kind === 'spell');
        if (type === 'orb-of-confusion')
            return other?.kind === 'spell' || other?.kind === 'blessing';
        return ['spell', 'treasure', 'blessing'].includes(other?.kind ?? '');
    }
    if (type === 'ray-of-weakness')
        return !!b && (id === b.attacker ? b.attackerRolls : b.defenderRolls).some(d => d.success);
    if (['unerring-darts', 'overrun', 'ring-of-the-moirai', 'black-diamond', 'festering-wounds'].includes(type)) {
        if (!b)
            return false;
        const rolls = id === b.attacker || stackIds(s, b.attacker).includes(id) ? b.attackerRolls : b.defenderRolls;
        if (type === 'unerring-darts')
            return rolls.some(d => d.success && !d.critical);
        if (type === 'black-diamond' || type === 'festering-wounds')
            return rolls.some(d => d.critical);
        return rolls.some(d => !d.success);
    }
    if (e.suppressionProhibitionApplies && a.effects.some(e => e.extra?.noSuppression) && (e.suppressRevolts || e.suppressRevoltsPerGold))
        return false;
    if (e.suppressRevolts && !(s.kingdoms.find(k => k.id === c.kingdom)?.revolt ?? 0))
        return false;
    if (e.gainHeroes && e.type !== 'natural-selection' && (!a.heroPools[c.kingdom ?? s.currentKingdom]?.length || !s.units.some(v => v.kingdom === (c.kingdom ?? s.currentKingdom) && !isHero(s, v) && !s.units.some(h => h.hexId === v.hexId && isHero(s, h)))))
        return false;
    if (e.gainTreasures && !a.decks.treasures.length && !a.eliminatedTreasures.length)
        return false;
    if (e.type === 'the-deep-paths' && (!u || u.activated || h?.terrain !== 'mountain'))
        return false;
    if ((e.light || e.heavy || e.movement || e.armyMovement || e.abilities) && !s.activeUnitId && !a.battle && !e.ongoing && !e.recoverArmy)
        return false;
    if (e.readyStack && (!u || stackIds(s, id).every(id => !s.units.find(u => u.id === id)?.activated)))
        return false;
    if (e.placeWanderingMonster && !a.monsterPools[e.placeWanderingMonster.replace('-pool', '')].length)
        return false;
    if (type === 'black-tide')
        return !!h && h.terrain === 'sea' && !h.settlement && !s.units.some(u => u.hexId === h.id) && !a.monsters.some(m => m.hexId === h.id) && ctx.adjacent(s, h.id).some(t => t.coastal || t.terrain === 'coastal');
    if (type === 'monsters-in-the-hills' || type === 'out-of-the-shadows')
        return !!h && h.terrain !== 'sea' && h.terrain !== 'lair' && !h.settlement && !h.prohibited && !s.units.some(u => u.hexId === h.id) && !a.monsters.some(m => m.hexId === h.id) && s.hexes.some(l => l.terrain === 'lair' && (!e.withinHexesOfUnexploredLair || !a.explored.includes(l.id)) && hexDistance(l, h) <= (e.withinHexesOfLair ?? e.withinHexesOfUnexploredLair ?? 3));
    if (type === 'the-four-fingered-fist')
        return !!h && (!!m || h.terrain === 'lair' && !a.explored.includes(h.id)) && s.hexes.some(t => t.settlement && ctx.welcoming(s, t, s.currentKingdom) && hexDistance(t, h) <= 4);
    if (type === 'lost-city-of-khazud')
        return !!h && h.terrain === 'mountain' && !h.settlement && !h.mine && !h.prohibited && !s.units.some(u => u.hexId === h.id) && !Object.values(h.edges ?? {}).some(e => e.road) && !ctx.adjacent(s, h.id).some(t => t.settlement || t.terrain === 'lair');
    if (type === 'the-ravens-are-flying')
        return !!h && h.settlement?.loyalty === 'oathborn' && !s.units.some(u => u.hexId === h.id);
    if (type === 'for-the-emperor')
        return !!h && e.placementCityNames.includes(h.settlement?.name) && !s.razed.includes(h.id) && ctx.welcoming(s, h, 'empire') && !s.units.some(u => u.hexId === h.id && !isHero(s, u));
    if (e.gainHeroes || e.gainTreasures || e.gold || e.gainGoldEquals || e.drawBlessings || e.drawSpells)
        return true;
    return true;
}
function magicTargets(s, c, caster, player, ctx) {
    const a = s.advanced, ts = c.targets, e = c.effect, b = a.battle, p = a.pending;
    let ids = [];
    if (e.placeWanderingMonster || e.type === 'lost-city-of-khazud' || e.type === 'the-four-fingered-fist')
        ids = s.hexes.map(h => h.id);
    else if (ts.some(t => ['owner', 'owning-player', 'casting-player', 'empire', 'orcs', 'all-covens', 'all-weakened-orc-armies', 'oathborn'].includes(t)))
        ids = [player];
    else if (ts.some(t => t.includes('player') || t.includes('just-played')))
        ids = a.players.map(p => p.id);
    else if (ts.some(t => t === 'source-hero' || t === 'source-hero-stack' || t.startsWith('source-hero-stacked') || t === 'caster' || t === 'caster-stack' || t === 'each-unit-in-caster-hex' || t === 'caster-hero' || t === 'caster-stack-with-army'))
        ids = caster ? [caster] : [];
    else if (['earth-to-mud', 'moryanas-fury'].includes(e.type))
        ids = p?.kind === 'window' && p.event?.unitId ? [p.event.unitId] : [];
    else if (ts.some(t => t.includes('hex') || t === 'unexplored-lair' || t.includes('settlement') && !t.includes('army')) && !ts.some(t => t.includes('hero') || t.includes('monster') || t.includes('source')))
        ids = s.hexes.map(h => h.id);
    else {
        ids = s.units.map(u => u.id);
        if (ts.some(t => t.includes('monster')))
            ids.push(...a.monsters.map(m => m.id));
        if (ts.some(t => t.includes('garrison')))
            ids.push(...s.hexes.filter(h => h.settlement && !s.razed.includes(h.id) && !s.units.some(u => u.hexId === h.id && !isHero(s, u))).map(h => h.id));
        if (e.type === 'the-four-fingered-fist')
            ids.push(...s.hexes.filter(h => h.terrain === 'lair' && !a.explored.includes(h.id)).map(h => h.id));
        if (e.type === 'necromancy' && p?.kind === 'window' && p.event?.unitId)
            ids.push(p.event.unitId);
    }
    if (ts.some(t => t.includes('hero') && !t.includes('opponent')) && !ts.some(t => t === 'unit' || t === 'stack' || t.includes('army') || t === 'monster'))
        ids = ids.filter(id => isHero(s, s.units.find(u => u.id === id) ?? { defId: '' }));
    if (ts.some(t => t.includes('friendly') || t === 'army-in-caster-hex' || t === 'army-stacked-with-caster' || t.includes('caster')) && ids.some(id => s.units.some(u => u.id === id)))
        ids = ids.filter(id => { const u = s.units.find(u => u.id === id); return !!u && a.players.find(p => p.id === player)?.kingdoms.some(k => ctx.sameSide(s, k, u.kingdom)); });
    if (c.timing.includes('battle-magic') && b && !ts.includes('owner') && !ts.some(t => t.includes('player')))
        ids = ids.filter(id => id === b.attacker || id === b.defender || id === b.targetHex || stackIds(s, b.attacker).includes(id) || b.defender && stackIds(s, b.defender).includes(id));
    return unique(ids).filter(id => relevantTarget(s, c, id, caster, player, ctx));
}
function casterIds(s, c, player, ctx) {
    const a = s.advanced, p = a.players.find(p => p.id === player);
    if (c.kind === 'hero')
        return s.units.filter(u => u.defId === c.id && p.kingdoms.includes(u.kingdom) && !a.locked.includes(u.id)).map(u => u.id);
    if (!c.mage && !c.effect.casterRequires && !c.targets.some(t => t.includes('caster')) && !c.effect.casterArmyTypes)
        return [undefined];
    const u = s.units.filter(u => p.kingdoms.includes(u.kingdom) && (!c.kingdom || u.kingdom === c.kingdom) && (!c.mage || isHero(s, u) && ctx.rawDef(s, u).abilities.includes('mage')) && (!c.effect.casterRequires || ctx.def(s, u).abilities.includes(c.effect.casterRequires)));
    const m = c.kind === 'spell' && !c.effect.eliminateCaster && !c.effect.place && !c.effect.placeWithinHexes && !c.effect.finishStack && !c.effect.readyStack ? a.monsters.filter(m => m.kingdom && p.kingdoms.includes(m.kingdom) && monsterById(m.defId)?.abilities.includes('mage')) : [];
    return [...u.map(u => u.id), ...m.map(m => m.id)];
}
function cardChoices(s, c) {
    const e = c.effect;
    if (e.casterChoosesDiceType)
        return ['light', 'heavy'];
    if (e.choices)
        return e.choices.map((x, i) => String(i));
    if (e.chooseRollD6Count)
        return ['1', '2', '3', '4'];
    if (e.chooseHeavyDice)
        return ['1', '2', '3'];
    if (e.chooseGoldX)
        return Array.from({ length: Math.min(15, s.kingdoms.find(k => k.id === c.kingdom)?.gold ?? 0) }, (_, i) => String(i + 1));
    return [''];
}
function placementOptions(s, c, caster, target, ctx) {
    const e = c.effect, u = s.units.find(u => u.id === target), ch = caster ? targetHex(s, caster, ctx) : undefined;
    if (!u)
        return [''];
    if (e.placeWithinHexes)
        return s.hexes.filter(h => hexDistance(ctx.hex(s, u.hexId), h) <= e.placeWithinHexes && h.id !== u.hexId && ctx.canEnd(s, u, h)).map(h => h.id);
    if (e.place === 'caster-hex-or-adjacent' && ch)
        return [ch, ...ctx.adjacent(s, ch.id)].filter(h => h.id !== u.hexId && ctx.canEnd(s, u, h)).map(h => h.id);
    if (e.type === 'paths-of-dread') {
        if (!ch || !ctx.adjacent(s, ch.id).some(h => h.terrain === 'lair'))
            return [];
        return s.hexes.filter(h => ctx.adjacent(s, h.id).some(l => l.terrain === 'lair') && h.id !== u.hexId && ctx.canEnd(s, u, h)).map(h => h.id);
    }
    if (e.type === 'shapeshift')
        return s.hexes.filter(h => s.controls[h.id] === 'night' && ctx.canEnd(s, u, h)).map(h => h.id);
    return [''];
}
function cardCosts(s, player, c, target) {
    const e = c.effect, a = s.advanced, unit = s.units.find(u => u.id === target);
    const count = e.discardBlessings ?? e.discardSpells ?? 0;
    if (!count)
        return [undefined];
    const eligible = a.hands[player].filter(id => id !== c.id && cardById(id)?.kind === (e.discardBlessings ? 'blessing' : 'spell') && (!e.blessingMustMatchTargetKingdom || cardById(id)?.kingdom === unit?.kingdom));
    const out = [];
    const choose = (start, selected) => { if (selected.length === count) {
        out.push(selected.join(','));
        return;
    } for (let i = start; i < eligible.length; i++)
        choose(i + 1, [...selected, eligible[i]]); };
    choose(0, []);
    return out;
}
function magicActions(s, player, ctx) {
    const a = s.advanced, out = [];
    if (!a.players.find(p => p.id === player)?.kingdoms.some(k => !s.kingdoms.find(v => v.id === k)?.collapsed))
        return out;
    const available = [...a.hands[player], ...s.units.filter(u => playerFor(s, u.kingdom)?.id === player && isHero(s, u)).map(u => u.defId)];
    for (const id of available) {
        const card = cardById(id);
        if (!card?.verified || !runtimePlayable(card) || card.tome || !!card.kingdom && !!s.kingdoms.find(k => k.id === card.kingdom)?.collapsed || !eventAllows(s, card, player))
            continue;
        const tomes = card.kind === 'spell' ? [undefined, ...a.hands[player].filter(id => cardById(id)?.tome && runtimePlayable(cardById(id)))] : [undefined];
        for (const tomeId of tomes) {
            const c = { ...card, mage: card.mage || !!cardById(tomeId ?? '')?.mage, range: card.range && tomeId === 'treasure-08' ? { min: card.range.min, max: card.range.max * 2 } : card.range };
            for (const caster of casterIds(s, c, player, ctx))
                for (const choice of cardChoices(s, c)) {
                    if (tomeId && cardById(tomeId)?.kind === 'treasure' && a.monsters.some(m => m.id === caster))
                        continue;
                    const bonus = c.effect.optionalExtraDie && choice === 'boost' ? { ...c.effect.optionalExtraDie, heavy: undefined } : {};
                    const chosen = { ...c, effect: { ...c.effect, ...(c.effect.choices?.[Number(choice)] ?? {}), ...bonus } };
                    for (const target of magicTargets(s, chosen, caster, player, ctx))
                        for (const hex of placementOptions(s, chosen, caster, target, ctx)) {
                            const e = chosen.effect, u = s.units.find(u => u.id === target);
                            if (['ray-of-weakness', 'festering-wounds'].includes(e.type) && a.battle) {
                                const side = target === a.battle.attacker || stackIds(s, a.battle.attacker).includes(target) ? 'attacker' : 'defender';
                                if (!choice.startsWith(side + ':'))
                                    continue;
                            }
                            if (e.choices && !Number.isInteger(Number(choice)))
                                continue;
                            if (e.light < 0 && combatantPool(s, target, ctx).light === 0 || e.heavy < 0 && combatantPool(s, target, ctx).heavy === 0)
                                continue;
                            const costCards = cardCosts(s, player, chosen, target);
                            for (const costCardId of costCards)
                                out.push({ type: c.kind === 'hero' ? 'hero-power' : 'play-card', playerId: player, cardId: id, ...(caster ? { casterId: caster } : {}), targetId: target, ...(hex ? { targetHex: hex } : {}), ...(choice ? { choice } : {}), ...(tomeId ? { tomeId } : {}), ...(costCardId ? { costCardId } : {}) });
                        }
                }
        }
    }
    return out;
}
function playersOnSide(s, k) { return s.advanced.players.filter(p => p.kingdoms.some(id => ctxSide(s, id, k))).map(p => p.id); }
function ctxSide(s, a, b) { return a === b || s.kingdoms.find(k => k.id === a)?.side === s.kingdoms.find(k => k.id === b)?.side; }
function openWindow(s, window, event, resume, ctx, players, step = 0) { const a = s.advanced; a.pending = { kind: 'window', window, players: players ?? a.players.map(p => p.id), index: 0, step, ...(event ? { event } : {}), resume, ...(window === 'reaction' && a.lastPlay ? { play: a.lastPlay } : {}) }; skipEmptyWindow(s, ctx); }
function skipEmptyWindow(s, ctx) {
    const a = s.advanced, p = a.pending;
    if (p?.kind !== 'window')
        return;
    while (p.index < p.players.length && !magicActions(s, p.players[p.index], ctx).length)
        p.index++;
    if (p.index >= p.players.length) {
        a.pending = p.resume ?? null;
        finishWindow(s, p, ctx);
        if (a.pending?.kind === 'window')
            skipEmptyWindow(s, ctx);
    }
}
function finishWindow(s, p, ctx) {
    const a = s.advanced;
    switch (p.window) {
        case 'battle':
            advanceBattleMagic(s, p.step + 1, ctx);
            break;
        case 'reaction':
            if (p.play && !p.play.canceled)
                resolveMagic(s, p.play, ctx);
            break;
        case 'strike':
            rollBattle(s, ctx);
            break;
        case 'roll':
            openWindow(s, 'critical', undefined, null, ctx);
            break;
        case 'critical':
            confirmBattle(s, ctx);
            break;
        case 'hits':
            if (p.event?.target && p.event.count > 0)
                a.pending = { kind: 'hit', target: p.event.target, count: p.event.count, resume: p.resume ?? null, members: p.event.members ?? stackIds(s, p.event.target) };
            else {
                a.pending = p.resume ?? null;
                if (a.battle)
                    continueHits(s, ctx);
            }
            break;
        case 'movement':
            if (p.event && !p.event.canceled)
                continueMovement(s, p.event, ctx);
            break;
        default: break;
    }
}
export function startBattleMagic(s, ctx) { const p = s.pendingCombat, attacker = ctx.unit(s, p.attackerId), defender = s.units.find(u => u.hexId === p.targetHex && !isHero(s, u)) ?? s.units.find(u => u.hexId === p.targetHex); const defenderKingdom = defender?.kingdom ?? ctx.controller(s, ctx.hex(s, p.targetHex)) ?? s.kingdoms.find(k => !ctx.sameSide(s, k.id, attacker.kingdom))?.id ?? attacker.kingdom; s.advanced.battle = { kind: 'battle', attacker: attacker.id, defender: defender?.id ?? p.targetHex, targetHex: p.targetHex, attackerKingdom: attacker.kingdom, defenderKingdom, step: 0, magicLifted: false, attackerRolls: [], defenderRolls: [], attackerSuccesses: 0, defenderSuccesses: 0, attackerHits: 0, defenderHits: 0, result: 'draw', hitQueue: [], reward: 'combat' }; advanceBattleMagic(s, 0, ctx); }
function advanceBattleMagic(s, step, ctx) {
    const a = s.advanced, b = a.battle;
    if (!b)
        return;
    b.step = step;
    if (step < 3) {
        openWindow(s, 'battle', undefined, null, ctx, playersOnSide(s, step === 1 ? b.defenderKingdom : b.attackerKingdom), step);
        return;
    }
    a.pending = null;
    const f = ctx.forecast(s, b.attacker, b.targetHex);
    if (f.attackerCanAmbush || f.defenderCanAmbush) {
        s.pendingCombat.decisionKingdom = f.defenderCanAmbush ? b.defenderKingdom : b.attackerKingdom;
        return;
    }
    beginAdvancedRoll(s, null, ctx);
}
export function beginAdvancedRoll(s, ambush, ctx) {
    const a = s.advanced, b = a.battle;
    if (ambush) {
        b.kind = 'ambush';
        b.ambush = ambush;
        b.step = 0;
    }
    if (ambush) {
        const acting = ambush === 'attacker' ? b.attacker : b.defender;
        for (const e of a.effects.filter(e => e.extra?.sneakAttack && stackIds(s, acting).includes(e.target))) {
            e.light = 1;
            const u = s.units.find(u => u.id === e.target);
            if (u)
                s.kingdoms.find(k => k.id === u.kingdom).gold++;
            e.extra.sneakAttack = false;
        }
    }
    a.pending = null;
    rollBattle(s, ctx);
}
function rawRoll(s, pool, penalty, ctx, target) {
    const a = s.advanced, ids = stackIds(s, target), effects = a.effects.filter(e => ids.includes(e.target));
    const crit = effects.some(e => e.extra?.criticalThreshold === 6) ? 6 : 7;
    const ignore = effects.reduce((n, e) => n + (e.extra?.ignoreFortHeavy ?? 0), 0);
    const b = a.battle, opposite = b && (target === b.attacker ? b.defender : b.attacker), opids = opposite ? stackIds(s, opposite) : [];
    const threshold = a.effects.some(e => opids.includes(e.target) && e.extra?.successThreshold === 6) ? 6 : 5;
    const rolls = [];
    for (const [sides, count] of [[6, pool.light], [8, pool.heavy]])
        for (let i = 0; i < count; i++) {
            const raw = ctx.die(s, sides), modified = raw - (sides === 8 && i >= count - ignore ? 0 : penalty);
            rolls.push({ sides, raw, modified, success: modified >= threshold, critical: modified >= crit });
        }
    return rolls;
}
function rollBattle(s, ctx) {
    const a = s.advanced, b = a.battle;
    if (!b)
        return;
    const rewardingArmy = s.units.find(u => u.id === b.attacker);
    if (b.reward === 'combat' && rewardingArmy)
        b.rewardBlocked = ctx.def(s, rewardingArmy).characteristics.includes('feral');
    if (b.skipStrike) {
        const acting = b.kind === 'ambush' ? (b.step === 0 ? (b.ambush === 'attacker' ? b.attacker : b.defender) : (b.ambush === 'attacker' ? b.defender : b.attacker)) : b.attacker;
        if (acting === b.attacker)
            b.attackerRolls = [];
        else
            b.defenderRolls = [];
        delete b.skipStrike;
        confirmBattle(s, ctx);
        return;
    }
    if (b.kind === 'battle') {
        const monster = a.monsters.find(m => m.id === b.defender);
        const f = monster ? null : ctx.forecast(s, b.attacker, b.targetHex), ap = f ? { light: f.attackerLight, heavy: f.attackerHeavy } : combatantPool(s, b.attacker, ctx), dp = f ? { light: f.defenderLight, heavy: f.defenderHeavy } : combatantPool(s, b.defender, ctx);
        b.attackerRolls = rawRoll(s, ap, f?.fortificationPenalty ?? 0, ctx, b.attacker);
        b.defenderRolls = rawRoll(s, dp, 0, ctx, b.defender);
    }
    else if (b.kind === 'ambush') {
        const first = b.ambush === 'attacker' ? b.attacker : b.defender;
        const acting = b.step === 0 ? first : first === b.attacker ? b.defender : b.attacker;
        const rolls = rawRoll(s, combatantPool(s, acting, ctx), 0, ctx, acting);
        if (acting === b.attacker)
            b.attackerRolls = rolls;
        else
            b.defenderRolls = rolls;
    }
    else {
        const h = ctx.hex(s, b.targetHex), magical = a.effects.filter(e => e.target === b.defender || e.target === h.id).reduce((n, e) => n + (e.fortification ?? 0), 0);
        b.attackerRolls = rawRoll(s, { light: b.light ?? 0, heavy: b.heavy ?? 0 }, (b.sourceCard === 'spell-04' ? 0 : h.settlement?.fortified ?? 0) + magical, ctx, b.attacker);
    }
    b.attackerSuccesses = b.attackerRolls.filter(d => d.success).length;
    b.defenderSuccesses = b.defenderRolls.filter(d => d.success).length;
    ctx.log(s, `${b.kind === 'strike' ? 'Strike' : 'Combat'} dice rolled at ${ctx.hex(s, b.targetHex).settlement?.name ?? b.targetHex}.`);
    openWindow(s, 'roll', undefined, null, ctx);
}
function confirmBattle(s, ctx) {
    const a = s.advanced, b = a.battle;
    if (!b)
        return;
    for (const [id, rolls] of [[b.attacker, b.attackerRolls], [b.defender, b.defenderRolls]]) {
        const effects = a.effects.filter(e => e.target === id || id && stackIds(s, id).includes(e.target)), black = effects.some(e => e.cardId === 'treasure-20'), festering = effects.find(e => e.cardId === 'spell-44');
        let used = false;
        for (const [index, die] of rolls.entries())
            if (die.critical && die.confirmation === undefined) {
                const special = festering && !used && index === (festering.extra?.criticalIndex ?? 0);
                const sides = special ? 6 : black ? 8 : 6;
                die.confirmation = ctx.die(s, sides);
                die.confirmations = [{ sides, raw: die.confirmation }];
                if (special) {
                    const confirmations = [die.confirmation, ctx.die(s, 6), ctx.die(s, 6)];
                    die.confirmations = confirmations.map(raw => ({ sides: 6, raw }));
                    die.bonus = confirmations.filter(v => v >= 5).length;
                    used = true;
                }
                else {
                    let bonus = Number(die.confirmation >= 5), roll = die.confirmation, guard = 0;
                    while (black && roll >= 7 && guard++ < 30) {
                        roll = ctx.die(s, 8);
                        die.confirmations.push({ sides: 8, raw: roll });
                        bonus += Number(roll >= 5);
                    }
                    die.bonus = bonus;
                }
            }
    }
    b.attackerSuccesses = b.attackerRolls.reduce((n, d) => n + Number(d.success) + (d.bonus ?? 0), 0);
    b.defenderSuccesses = b.defenderRolls.reduce((n, d) => n + Number(d.success) + (d.bonus ?? 0), 0);
    if (b.kind === 'battle') {
        b.attackerSuccesses += a.effects.filter(e => stackIds(s, b.attacker).includes(e.target)).reduce((n, e) => n + (e.extra?.addSuccesses ?? 0), 0);
        if (b.attackerSuccesses > b.defenderSuccesses) {
            b.defenderHits = b.attackerSuccesses - b.defenderSuccesses;
            b.result = 'attacker';
        }
        else if (b.defenderSuccesses > b.attackerSuccesses) {
            b.attackerHits = b.defenderSuccesses - b.attackerSuccesses;
            b.result = 'defender';
        }
        else if (b.attackerSuccesses) {
            b.result = 'tie';
            const ar = combatantAbilities(s, b.attacker, ctx).includes('ranged'), dr = combatantAbilities(s, b.defender, ctx).includes('ranged');
            if (ar && !dr) {
                b.defenderHits = 1;
                b.result = 'attacker';
            }
            if (dr && !ar) {
                b.attackerHits = 1;
                b.result = 'defender';
            }
        }
        if (!b.attackerSuccesses && !b.defenderSuccesses) {
            if (stackIds(s, b.attacker).some(id => s.units.find(u => u.id === id)?.defId === 'hero-goblins-12')) {
                b.defenderHits = 1;
                b.result = 'attacker';
            }
            else if (b.defender && stackIds(s, b.defender).some(id => s.units.find(u => u.id === id)?.defId === 'hero-goblins-12')) {
                b.attackerHits = 1;
                b.result = 'defender';
            }
        }
        for (const [target, key] of [[b.attacker, 'attackerHits'], [b.defender, 'defenderHits']])
            if (target) {
                const group = stackIds(s, target).map(id => s.units.find(u => u.id === id)).filter((u) => !!u);
                if (group.some(u => u.defId === 'hero-goblins-11') && group.some(u => !isHero(s, u) && ctx.rawDef(s, u).characteristics.includes('fragile')))
                    b[key] = Math.max(0, b[key] - 1);
            }
        b.magicLifted = true;
    }
    else {
        const acting = b.kind === 'ambush' ? (b.step === 0 ? b.ambush === 'attacker' ? b.attacker : b.defender : b.ambush === 'attacker' ? b.defender : b.attacker) : b.attacker;
        const rolls = acting === b.attacker ? b.attackerRolls : b.defenderRolls;
        const hits = (a.effects.some(e => e.extra?.axes && stackIds(s, acting).includes(e.target)) ? rolls.filter(d => d.success).length : Number(rolls.some(d => d.success))) + rolls.reduce((n, d) => n + (d.bonus ?? 0), 0);
        if (acting === b.attacker)
            b.defenderHits += hits;
        else
            b.attackerHits += hits;
        b.result = b.kind === 'ambush' ? 'ambush' : hits ? 'attacker' : 'draw';
        b.magicLifted = true;
    }
    const targets = b.kind === 'ambush' ? (b.step === 0 ? b.ambush === 'attacker' ? [{ target: b.defender, count: b.defenderHits }] : [{ target: b.attacker, count: b.attackerHits }] : b.ambush === 'attacker' ? [{ target: b.attacker, count: b.attackerHits }] : [{ target: b.defender, count: b.defenderHits }]) : [{ target: b.attacker, count: b.attackerHits }, { target: b.defender ?? b.targetHex, count: b.defenderHits }];
    b.hitQueue = targets.filter(t => t.count > 0);
    continueHits(s, ctx);
}
function continueHits(s, ctx) {
    const a = s.advanced, b = a.battle;
    if (!b)
        return;
    const hit = b.hitQueue.shift();
    if (hit) {
        openWindow(s, 'hits', { ...hit, members: cardById(b.sourceCard ?? '')?.effect.targetHeroOnly ? [hit.target] : stackIds(s, hit.target) }, null, ctx);
        return;
    }
    if (b.kind === 'ambush' && b.step === 0) {
        const second = b.ambush === 'attacker' ? b.defender : b.attacker;
        const exists = s.units.some(u => u.id === second) || a.monsters.some(m => m.id === second) || second === b.targetHex && b.defenderHits === 0;
        if (exists) {
            b.step = 1;
            openWindow(s, 'strike', undefined, null, ctx);
            return;
        }
    }
    completeAdvancedBattle(s, ctx);
}
function completeAdvancedBattle(s, ctx) {
    const a = s.advanced, b = a.battle;
    const result = { attackerId: b.attacker, targetHex: b.targetHex, attackerRolls: b.attackerRolls, defenderRolls: b.defenderRolls, attackerSuccesses: b.attackerSuccesses, defenderSuccesses: b.defenderSuccesses, attackerHits: b.attackerHits, defenderHits: b.defenderHits, result: b.result, ...(b.ambush ? { ambush: b.ambush } : {}) };
    a.battle = null;
    a.pending = null;
    s.lastCombat = result;
    for (const e of a.effects.filter(e => b.kind !== 'strike' && (e.extra?.armyTakesHitsAfterCombat || e.extra?.eliminateCasterAndStackedReaversAfterCombat))) {
        if (e.extra?.armyTakesHitsAfterCombat)
            ctx.hit(s, e.target, e.extra.armyTakesHitsAfterCombat);
        else
            for (const id of stackIds(s, e.target))
                ctx.hit(s, id, 2);
    }
    if (b.kind === 'strike') {
        a.battle = b.parent ?? null;
        a.pending = b.resume ?? null;
        ctx.log(s, `Strike: ${b.defenderHits} hit${b.defenderHits === 1 ? '' : 's'} at ${b.targetHex}.`);
        const h = ctx.hex(s, b.targetHex);
        if (b.defenderHits && h.settlement && !s.units.some(u => u.hexId === h.id) && !ctx.welcoming(s, h, b.attackerKingdom)) {
            if (s.controls[h.id]) {
                const k = s.kingdoms.find(k => k.id === s.controls[h.id]);
                if (k && !['goblins', 'orcs'].includes(k.id))
                    k.income = Math.max(0, k.income - 1);
                delete s.controls[h.id];
            }
            else
                ctx.raze(s, h);
        }
        const play = b.sourcePlay;
        if (play && b.sourceCard === 'spell-35') {
            if (s.units.some(u => u.id === b.defender))
                ctx.hit(s, play.casterId, 2);
            else
                chooseHeroPlacement(s, play, play.casterKingdom ?? s.currentKingdom, 1, a.pending, ctx);
        }
        if (play && b.remaining?.length) {
            const [next, ...rest] = b.remaining;
            magicStrike(s, play, next, ctx, rest);
        }
        else if (play && b.sourceCard === 'spell-05' && !b.repeat && (s.units.some(u => u.id === b.defender) || a.monsters.some(m => m.id === b.defender) || b.defender === b.targetHex && h.settlement && !s.razed.includes(h.id)))
            chooseEffect(s, play, play.playerId, 'repeat-strike', [{ value: 'skip', label: 'Finish Crushing Vines' }, ...a.hands[play.playerId].filter(id => cardById(id)?.kind === 'spell').map(id => ({ value: id, label: `Discard ${cardById(id).name} for a second Strike` }))], a.pending, { target: b.defender }, 'Crushing Vines · after the first Strike');
        if (b.continuation)
            resolveMagic(s, b.continuation, ctx);
        return;
    }
    const monster = monsterById(a.monsters.find(m => m.id === b.defender)?.defId ?? '');
    if (b.defender?.startsWith('monster-') || ctx.hex(s, b.targetHex).terrain === 'lair') {
        ctx.log(s, `Monster battle: ${result.attackerSuccesses} / ${result.defenderSuccesses} successes.`);
        s.pendingCombat = null;
        ctx.finish(s);
        return;
    }
    if (s.pendingCombat && s.units.some(u => u.id === b.attacker))
        ctx.complete(s, result);
    else {
        s.pendingCombat = null;
        if (s.activeUnitId)
            ctx.finish(s);
    }
}
function hitMonster(s, m, hits, reward, kingdom, ctx) {
    const a = s.advanced, d = monsterById(m.defId);
    if (hits >= 1) {
        a.monsters = a.monsters.filter(x => x.id !== m.id);
        if (m.lair)
            a.defeatedMonsters.push(m.defId);
        else {
            a.monsterPools[d.pool].push(m.defId);
            shuffle(s, a.monsterPools[d.pool], ctx);
        }
        if (m.lair && !a.explored.includes(m.hexId))
            a.explored.push(m.hexId);
        const attacker = s.units.find(u => u.id === a.battle?.attacker);
        if (reward && (a.battle?.rewardBlocked || attacker && ctx.def(s, attacker).characteristics.includes('feral')))
            reward = undefined;
        if (reward) {
            const k = s.kingdoms.find(k => k.id === kingdom);
            const gold = Math.max(0, d.rewardGold - (reward === 'fist' ? 1 : 0));
            k.gold += gold;
            if (m.lair || reward === 'fist')
                draw(s, playerFor(s, kingdom).id, 'treasures', 1, ctx);
            ctx.log(s, `${d.name} defeated: +${gold} gold${m.lair || reward === 'fist' ? ' and a Treasure' : ''}.`);
        }
        else
            ctx.log(s, `${d.name} eliminated by Magic; no combat reward.`);
    }
}
function revealMonster(s, hex, lair, pool, kingdom, ctx) {
    const a = s.advanced, defId = a.monsterPools[pool].shift();
    if (!defId)
        return;
    const m = { id: `monster-${++a.eventSerial}`, defId, hexId: hex, kingdom, weakened: false, activated: false, lair };
    a.monsters.push(m);
    ctx.log(s, `${monsterById(defId)?.name ?? defId} revealed ${lair ? 'in its Lair' : 'as a wandering Monster'}.`);
    return m;
}
function addEffect(s, play, values) {
    const a = s.advanced, c = cardById(play.cardId);
    const target = play.targetId ?? play.casterId ?? play.playerId;
    const instant = !s.activeUnitId && c.duration === 'current-activation';
    if (instant && !a.battle)
        return;
    const effect = { cardId: c.id, target, expires: c.duration === 'rest-of-turn' ? s.turnSerial : s.turnSerial + 1, activation: c.duration === 'rest-of-turn' || c.duration.startsWith('while-') || c.duration === 'persistent' ? null : s.activeUnitId, ...values };
    a.effects.push(effect);
}
function paySpellCost(s, player, count, ctx, random = false) {
    for (let i = 0; i < count; i++) {
        const ids = s.advanced.hands[player].filter(id => cardById(id)?.kind === 'spell');
        const id = ids[random ? randomIndex(s, ids.length, ctx) : 0];
        if (id)
            discard(s, player, id);
    }
}
export function queueAdvancedEvent(s, event) {
    if (s.advanced)
        (s.advanced.eventQueue ??= []).push(event);
}
export function flushAdvancedEvents(s, ctx) {
    const a = s.advanced;
    if (!a || s.phase === 'game-over')
        return;
    const processing = (p) => !!p && (p.kind === 'window' && (p.window === 'elimination' || processing(p.resume ?? null)) || 'resume' in p && processing(p.resume ?? null) || p.kind === 'study' && processing(p.immediateResume ?? null));
    for (let guard = 0; guard < 2000 && a.eventQueue?.length && !processing(a.pending); guard++) {
        const event = a.eventQueue.shift();
        openWindow(s, 'elimination', event, a.pending, ctx);
    }
}
function magicStrike(s, play, defender, ctx, remaining = [], repeat = false) {
    const a = s.advanced, c = cardById(play.cardId), e = c.effect, u = s.units.find(u => u.id === defender), h = targetHex(s, defender, ctx);
    if (!h) {
        if (remaining.length)
            magicStrike(s, play, remaining[0], ctx, remaining.slice(1), repeat);
        return;
    }
    const kid = c.kingdom ?? play.casterKingdom ?? s.currentKingdom;
    const strike = { kind: 'strike', attacker: play.casterId ?? kid, defender, targetHex: h.id, attackerKingdom: kid, defenderKingdom: combatantKingdom(s, defender), step: 0, magicLifted: true, attackerRolls: [], defenderRolls: [], attackerSuccesses: 0, defenderSuccesses: 0, attackerHits: 0, defenderHits: 0, result: 'draw', hitQueue: [], light: e.strike.light, heavy: e.strike.heavy + (play.choice === 'boost' ? (e.optionalExtraDie?.heavy ?? 0) : 0) + (e.additionalHeavyIfTargetFeralArmy && u && ctx.rawDef(s, u).characteristics.includes('feral') ? e.additionalHeavyIfTargetFeralArmy : 0), sourceCard: c.id, ...(e.type === 'the-four-fingered-fist' ? { reward: 'fist' } : {}) };
    Object.assign(strike, { parent: a.battle, resume: a.pending, sourcePlay: play, remaining, repeat });
    a.battle = strike;
    openWindow(s, 'strike', undefined, null, ctx);
}
function chooseEffect(s, play, playerId, flow, choices, resume, data = {}, title) {
    s.advanced.pending = choices.length ? { kind: 'choice', playerId, flow, choices, play, resume, data, title: title ?? cardById(play.cardId)?.name } : resume;
}
function chooseDiscard(s, play, playerId, count, resume, kind = 'spell') {
    const a = s.advanced, ids = a.hands[playerId].filter(id => kind === 'either' ? ['spell', 'blessing'].includes(cardById(id)?.kind ?? '') : cardById(id)?.kind === kind);
    if (count <= 0 || !ids.length) {
        a.pending = resume;
        return;
    }
    chooseEffect(s, play, playerId, 'discard', ids.map(value => ({ value, label: `Discard ${cardById(value).name}` })), resume, { count, kind }, `Choose ${count} ${count === 1 ? 'card' : 'cards'} to discard`);
}
function chooseBuild(s, play, defId, count, resume, ctx, near, ready = false) {
    const a = s.advanced, d = s.unitDefinitions.find(d => d.id === defId);
    if (!d || s.kingdoms.find(k => k.id === d.kingdom)?.collapsed || count <= 0 || s.units.filter(u => u.defId === defId).length >= d.count) {
        a.pending = resume;
        return;
    }
    const places = near ? [ctx.hex(s, near), ...ctx.adjacent(s, near)].filter(h => advancedCanBuild(s, d, h) && ctx.canEnd(s, { id: 'new-army', defId, kingdom: d.kingdom, hexId: near, weakened: false, activated: false }, h)) : ctx.buildLocations(s, d);
    chooseEffect(s, play, play.playerId, 'build', places.map(h => ({ value: h.id, label: `Place ${d.name} at ${h.settlement?.name ?? h.id}` })), resume, { defId, count, ...(near ? { near } : {}), ready }, `Place ${d.name} · ${count} remaining`);
}
function chooseHeroPlacement(s, play, kid, count, resume, ctx) {
    const a = s.advanced, d = s.unitDefinitions.find(d => d.kingdom === kid && d.kind === 'hero');
    if (!d || s.kingdoms.find(k => k.id === kid)?.collapsed || count <= 0 || !a.heroPools[kid]?.length) {
        a.pending = resume;
        return;
    }
    const places = s.units.filter(u => u.kingdom === kid && !isHero(s, u) && !s.units.some(v => v.hexId === u.hexId && isHero(s, v))).map(u => ctx.hex(s, u.hexId));
    if (cardById(play.cardId)?.effect.heroMayBePlacedInAnyEligibleHex)
        places.push(...ctx.buildLocations(s, d));
    const ids = unique(places.map(h => h.id));
    if (ids.length === 1) {
        const hero = gainHero(s, kid, ids[0], ctx, cardById(play.cardId)?.effect.type === 'kharks-chosen' ? play.choice : undefined, true);
        if (hero && cardById(play.cardId)?.effect.gainedHeroHeavy)
            addEffect(s, { ...play, targetId: hero.id }, { heavy: cardById(play.cardId).effect.gainedHeroHeavy });
        chooseHeroPlacement(s, play, kid, count - 1, resume, ctx);
        return;
    }
    chooseEffect(s, play, play.playerId, 'hero', ids.map(value => ({ value, label: `Hero at ${ctx.hex(s, value).settlement?.name ?? value}` })), resume, { kid, count });
}
function forcedMoveChoices(s, u, fear, ctx) {
    const group = stackIds(s, u.id), hero = group.find(id => isHero(s, ctx.unit(s, id))), out = [{ label: 'Take one hit', value: 'hit' }];
    for (const h of ctx.adjacent(s, u.hexId)) {
        if (fear && ctx.adjacent(s, h.id).some(t => s.units.some(v => v.hexId === t.id && !isHero(s, v) && !ctx.sameSide(s, v.kingdom, u.kingdom))))
            continue;
        if (ctx.canEnd(s, u, h))
            out.push({ label: `Move ${hero ? 'Army and Hero' : 'stack'} to ${h.settlement?.name ?? h.id}`, value: `stack:${h.id}` });
        if (fear && hero) {
            const copy = structuredClone(s);
            delete copy.advanced.stacks[hero];
            const single = copy.units.find(v => v.id === u.id);
            if (ctx.canEnd(copy, single, copy.hexes.find(t => t.id === h.id)))
                out.push({ label: `Move Army to ${h.settlement?.name ?? h.id}; leave Hero`, value: `army:${h.id}` });
        }
    }
    return out;
}
function resolveMagic(s, play, ctx) {
    const a = s.advanced, c = cardById(play.cardId), base = c.effect, e = { ...base, ...(base.choices?.[Number(play.choice ?? 0)] ?? {}) }, target = play.targetId ?? play.casterId ?? play.playerId, u = s.units.find(u => u.id === target), caster = s.units.find(u => u.id === play.casterId), h = targetHex(s, target, ctx), owner = a.players.find(p => p.id === play.playerId), kid = c.kingdom ?? caster?.kingdom ?? play.casterKingdom ?? s.currentKingdom, k = s.kingdoms.find(k => k.id === kid), pending = a.pending;
    if (e.oncePerCombat)
        addEffect(s, play, { extra: { once: true } });
    if (e.lockSource && caster && !a.locked.includes(caster.id))
        a.locked.push(caster.id);
    if (e.drawSpells)
        draw(s, play.playerId, 'spells', e.drawSpells, ctx);
    if (e.drawSpellsTo) {
        const n = a.hands[play.playerId].filter(id => cardById(id)?.kind === 'spell').length;
        draw(s, play.playerId, 'spells', Math.max(0, e.drawSpellsTo - n), ctx);
    }
    if (e.drawBlessings && e.type !== 'martyrdom')
        for (let i = 0; i < e.drawBlessings; i++)
            draw(s, play.playerId, `blessings-${kid}`, 1, ctx);
    if (e.gainTreasures)
        draw(s, play.playerId, 'treasures', e.gainTreasures, ctx);
    if (e.gainHeroes)
        chooseHeroPlacement(s, play, kid, e.gainHeroes, pending, ctx);
    if (e.gold)
        k.gold += e.gold;
    if (e.gainGoldEquals === 'orc-controlled-settlements-plus-two')
        k.gold += Object.values(s.controls).filter(k => k === 'orcs').length + 2;
    if (e.suppressRevolts)
        k.revolt = Math.max(0, (k.revolt ?? 0) - e.suppressRevolts);
    if (e.suppressRevoltsPerGold) {
        const amount = Number(play.choice ?? 1);
        k.gold -= amount;
        k.revolt = Math.max(0, (k.revolt ?? 0) - e.suppressRevoltsPerGold * amount);
    }
    if (e.chooseRollD6Count) {
        const count = Number(play.choice ?? 1);
        for (let i = 0; i < count; i++)
            k.gold += ctx.die(s, 6);
        k.revolt = (k.revolt ?? 0) + count;
        addEffect(s, play, { extra: { noSuppression: true }, expires: s.turnSerial + s.scenario.turnOrder.length, activation: null });
    }
    if (e.addRevolts)
        k.revolt = (k.revolt ?? 0) + e.addRevolts;
    if (e.recoverArmy && u)
        u.weakened = false;
    if (e.recoverAll)
        for (const unit of s.units)
            if (unit.kingdom === kid && !isHero(s, unit))
                unit.weakened = false;
    if (e.readyStack && u)
        for (const id of stackIds(s, u.id)) {
            const member = s.units.find(u => u.id === id);
            member.activated = false;
        }
    if (e.placeWanderingMonster && h) {
        // §15.7 gives Wandering Monsters to the active Kingdom. At the §15.3
        // command cap, its controller chooses an old Monster to Slink Away
        // before the newly revealed Monster can take that command marker.
        const commander = s.currentKingdom;
        const full = a.monsters.filter(m => m.kingdom === commander).length >= 3;
        const monster = revealMonster(s, h.id, false, e.placeWanderingMonster.replace('-pool', ''), full ? null : commander, ctx);
        if (monster && full)
            a.pending = { kind: 'command', monsterId: monster.id, choices: [commander], resume: pending };
    }
    if (e.eliminateCard || e.eliminateCardPermanently) {
        a.owned[play.playerId] = a.owned[play.playerId].filter(id => id !== c.id);
        for (const pile of Object.values(a.discards)) {
            const i = pile.indexOf(c.id);
            if (i >= 0)
                pile.splice(i, 1);
        }
        if (!e.eliminateCardPermanently)
            a.eliminatedTreasures.push(c.id);
        else
            a.removedCards.push(c.id);
    }
    const values = {};
    for (const key of ['light', 'heavy', 'movement', 'abilities', 'multiplyLight', 'convertLightToHeavy', 'fortification'])
        if (e[key] !== undefined)
            values[key] = e[key];
    if (e.armyMovement)
        values.movement = e.armyMovement;
    if (e.multiplyCombatRating) {
        values.multiplyLight = e.multiplyCombatRating;
        values.extra = { multiplyHeavy: e.multiplyCombatRating };
    }
    if (e.characteristics)
        values.extra = { ...values.extra, characteristics: e.characteristics };
    if (e.criticalThreshold)
        values.extra = { ...values.extra, criticalThreshold: e.criticalThreshold };
    if (e.armyTakesHitsAfterCombat || e.eliminateCasterAndStackedReaversAfterCombat)
        values.extra = { ...values.extra, armyTakesHitsAfterCombat: e.armyTakesHitsAfterCombat, eliminateCasterAndStackedReaversAfterCombat: e.eliminateCasterAndStackedReaversAfterCombat };
    if (e.addSuccesses)
        values.extra = { ...values.extra, addSuccesses: e.addSuccesses };
    const b = a.battle, opponent = b ? (target === b.attacker || stackIds(s, b.attacker).includes(target) ? b.defender : b.attacker) : undefined, opponentGroup = opponent ? stackIds(s, opponent) : [], hasHero = opponentGroup.some(id => s.units.some(u => u.id === id && isHero(s, u))), hasMonster = !!a.monsters.find(m => m.id === opponent);
    if (e.replaceWithHeavyIfOpponentIncludes && (hasHero || hasMonster)) {
        delete values.light;
        values.heavy = 1;
    }
    if (e.additionalLightIfOpponentIncludesHero && hasHero)
        values.light = (values.light ?? 0) + e.additionalLightIfOpponentIncludesHero;
    if (e.additionalLightIfOpponentIncludes && (hasHero || hasMonster))
        values.light = (values.light ?? 0) + e.additionalLight;
    if (e.additionalHeavyIfOpponentIncludes && (hasHero || hasMonster))
        values.heavy = (values.heavy ?? 0) + e.additionalHeavy;
    if (e.conditionalOccupies && h) {
        const conditions = Array.isArray(e.conditionalOccupies) ? e.conditionalOccupies : [e.conditionalOccupies];
        if (hexFeatures(h).some(x => conditions.includes(x)) || conditions.includes('wilderness') && hexFeatures(h).some(x => ['forest', 'mountain', 'swamp'].includes(x))) {
            values.heavy = (values.heavy ?? 0) + (e.conditionalHeavy ?? 0);
            values.light = (values.light ?? 0) + (e.conditionalAdditionalLight ?? 0);
        }
    }
    if (e.conditionalConvertLightToHeavy && h && (h.terrain === e.conditionalOccupyingOrAttacking || b && ctx.hex(s, b.targetHex).terrain === e.conditionalOccupyingOrAttacking))
        values.convertLightToHeavy = e.conditionalConvertLightToHeavy;
    if (e.chooseHeavyDice) {
        values.heavy = Number(play.choice ?? 1);
        k.revolt = (k.revolt ?? 0) + values.heavy;
    }
    if (['treasure-15', 'treasure-26', 'treasure-20', 'spell-44'].includes(c.id))
        values.extra = { ...values.extra, choice: play.choice ?? 'light', ...(c.id === 'spell-44' ? { criticalIndex: Number(play.choice?.split(':')[1] ?? 0) } : {}) };
    if (e.opponentSuccessThreshold)
        values.extra = { ...values.extra, successThreshold: e.opponentSuccessThreshold };
    if (e.providedDieIgnoresAllFortification)
        values.extra = { ...values.extra, ignoreFortHeavy: 1 };
    if (Object.keys(values).length) {
        const joint = ['spell-38', 'treasure-06', 'treasure-28'].includes(c.id);
        const targets = joint && caster ? stackIds(s, caster.id) : [target];
        for (const id of targets) {
            addEffect(s, { ...play, targetId: id }, values);
            if (values.movement && a.movement[id] !== undefined)
                a.movement[id] += values.movement;
        }
    }
    if (e.razeOccupiedSettlement && caster) {
        const at = ctx.hex(s, caster.hexId);
        if (at.settlement && !s.razed.includes(at.id))
            ctx.raze(s, at);
    }
    switch (e.type) {
        case 'sleep': {
            a.battle = null;
            a.pending = null;
            s.pendingCombat = null;
            if (s.activeUnitId)
                ctx.finish(s);
            break;
        }
        case 'cloud-of-darkness': {
            if (b?.kind === 'strike') {
                a.battle = b.parent ?? null;
                a.pending = b.resume ?? null;
            }
            else {
                a.battle = null;
                a.pending = null;
                s.pendingCombat = null;
                if (s.activeUnitId)
                    ctx.finish(s);
            }
            break;
        }
        case 'illusion': {
            if (b)
                b.skipStrike = true;
            break;
        }
        case 'negation':
        case 'orb-of-confusion': {
            let p = a.pending;
            while (p?.kind === 'window') {
                if (p.play && p.play.playerId !== play.playerId) {
                    p.play.canceled = true;
                    if (e.targetDiscardsAndDrawsSameType) {
                        const other = cardById(p.play.cardId);
                        draw(s, p.play.playerId, other.kind === 'blessing' ? `blessings-${other.kingdom}` : 'spells', 1, ctx);
                    }
                    break;
                }
                p = p.resume ?? null;
            }
            break;
        }
        case 'undertow': {
            const original = pending?.kind === 'window' ? pending.play : undefined;
            if (original)
                paySpellCost(s, original.playerId, 1, ctx, true);
            break;
        }
        case 'banished-to-meji':
            ctx.hit(s, target, 2);
            break;
        case 'cure-wounds': break;
        case 'ray-of-weakness':
            if (b) {
                const rolls = target === b.attacker || stackIds(s, b.attacker).includes(target) ? b.attackerRolls : b.defenderRolls, die = rolls[Number(play.choice?.split(':')[1] ?? 0)];
                if (die) {
                    die.success = false;
                    die.critical = false;
                }
            }
            break;
        case 'unerring-darts':
            if (b)
                for (const d of target === b.attacker || stackIds(s, b.attacker).includes(target) ? b.attackerRolls : b.defenderRolls)
                    if (d.success)
                        d.critical = true;
            break;
        case 'ring-of-the-moirai':
        case 'overrun':
            if (b) {
                const rolls = target === b.attacker || stackIds(s, b.attacker).includes(target) ? b.attackerRolls : b.defenderRolls;
                for (const d of rolls)
                    if (!d.success) {
                        d.raw = ctx.die(s, d.sides);
                        d.modified = d.raw;
                        d.success = d.modified >= 5;
                        d.critical = d.modified >= 7;
                    }
            }
            break;
        case 'tidal-shelter':
        case 'sigil-of-courage':
        case 'ring-of-invisibility':
        case 'shapeshift':
        case 'wings-of-valor': {
            if (pending?.kind === 'window' && pending.window === 'hits' && pending.event) {
                const count = e.negateHits ?? (e.cancelCasterHit || e.saveCasterHero || e.saveTargetHero ? 1 : 0);
                let negate = count;
                if (e.roll)
                    for (let i = 0; i < e.roll.light; i++)
                        negate += Number(ctx.die(s, 6) >= 5);
                pending.event.count = Math.max(0, pending.event.count - negate);
            }
            break;
        }
        case 'earth-to-mud':
            if (pending?.kind === 'window' && pending.event)
                pending.event.canceled = true;
            if (s.activeUnitId)
                ctx.finish(s);
            break;
        case 'moryanas-fury': break;
        case 'fear':
        case 'terror-rides-before-him': {
            if (!u || e.rollD6 && ctx.die(s, 6) < 5)
                break;
            chooseEffect(s, play, playerFor(s, u.kingdom).id, 'forced-move', forcedMoveChoices(s, u, e.type === 'fear', ctx), pending, { unitId: u.id }, 'The target owner chooses');
            break;
        }
        case 'philosophers-stone': break;
        case 'hand-of-the-emperor': break;
        case 'runestones': {
            const n = s.units.filter(u => u.kingdom === 'oathborn' && /miner/i.test(ctx.rawDef(s, u).name) && ctx.hex(s, u.hexId).mine).length;
            draw(s, play.playerId, 'spells', n, ctx);
            chooseDiscard(s, play, play.playerId, Math.max(0, a.hands[play.playerId].filter(id => cardById(id)?.kind === 'spell').length - 3), pending);
            break;
        }
        case 'delve-greedily': {
            const roll = ctx.die(s, 6);
            if (roll === 1)
                ctx.hit(s, target, 2);
            else if (roll === 6) {
                k.gold += 2;
                draw(s, play.playerId, 'treasures', 1, ctx);
            }
            else
                chooseEffect(s, play, play.playerId, 'return-card', [{ value: 'keep', label: 'Return Delve Greedily to hand' }, { value: 'discard', label: 'Leave it discarded' }], pending);
            break;
        }
        case 'we-have-our-ways':
            k.gold += ctx.die(s, 6);
            break;
        case 'pestilence': {
            if (u)
                chooseEffect(s, play, play.playerId, 'pestilence', s.units.filter(v => v.kingdom === 'orcs' && !isHero(s, v) && ctx.adjacent(s, u.hexId).some(h => h.id === v.hexId)).map(v => ({ value: v.id, label: `Risk ${ctx.rawDef(s, v).name} at ${v.hexId}` })), pending, { target: u.id }, 'Choose the adjacent Orc stack before rolling');
            break;
        }
        case 'necromancy':
            chooseEffect(s, play, play.playerId, 'recover', s.units.filter(v => v.weakened && !isHero(s, v) && owner.kingdoms.some(k => ctx.sameSide(s, k, v.kingdom))).map(v => ({ value: v.id, label: `Recover ${ctx.rawDef(s, v).name} at ${v.hexId}` })), pending);
            break;
        case 'wave-strider':
            for (const id of stackIds(s, target))
                addEffect(s, { ...play, targetId: id }, { extra: { waveStrider: true } });
            break;
        case 'sneak-attack':
            addEffect(s, play, { extra: { sneakAttack: true } });
            break;
        case 'lightning-axes':
            addEffect(s, play, { extra: { axes: true } });
            break;
        case 'lost-city-of-khazud':
            if (h) {
                a.khazud = h.id;
                h.settlement = { name: 'Khazud', loyalty: 'oathborn', city: true, fortified: 2, port: false };
                k.income++;
            }
            break;
        case 'the-ravens-are-flying':
            if (h) {
                s.razed = s.razed.filter(id => id !== h.id);
                delete s.controls[h.id];
                const d = s.unitDefinitions.find(d => d.id === play.choice && d.kingdom === 'oathborn' && d.cost <= 4 && s.units.filter(u => u.defId === d.id).length < d.count);
                if (d)
                    s.units.push({ id: `unit-${s.serial++}`, defId: d.id, kingdom: k.id, hexId: h.id, weakened: false, activated: false });
            }
            break;
        case 'for-the-emperor':
            if (h) {
                const d = s.unitDefinitions.find(d => d.kingdom === 'empire' && /cataphract/i.test(d.name));
                if (d && s.units.filter(u => u.defId === d.id).length < d.count)
                    s.units.push({ id: `unit-${s.serial++}`, defId: d.id, kingdom: k.id, hexId: h.id, weakened: false, activated: false });
            }
            break;
        case 'enslave':
            if (u) {
                const heroId = a.heroPools.night?.shift(), d = s.unitDefinitions.find(d => d.id === heroId);
                if (heroId && d) {
                    const bonus = s.units.filter(u => u.kingdom === 'night' && isHero(s, u)).reduce((n, u) => n + (cardById(u.defId)?.effect.ongoingEnslaveBonus ?? 0), 0);
                    if (ctx.die(s, 6) + bonus >= 5) {
                        const hero = { id: `unit-${s.serial++}`, defId: heroId, kingdom: 'night', hexId: u.hexId, weakened: false, activated: false };
                        s.units.push(hero);
                        a.enslaved ??= {};
                        a.enslaved[u.id] = u.kingdom;
                        u.kingdom = 'night';
                        u.activated = false;
                        a.stacks[hero.id] = u.id;
                    }
                    else {
                        a.heroPools.night.unshift(heroId);
                    }
                }
            }
            break;
        case 'the-deep-paths':
            if (u)
                for (const id of stackIds(s, u.id)) {
                    const v = s.units.find(u => u.id === id);
                    if (a.movement[id] !== undefined)
                        a.movement[id] += 5 - ctx.rawDef(s, v).movement;
                    addEffect(s, { ...play, targetId: id }, { extra: { deepPaths: true } });
                }
            break;
        case 'secret-ways':
            addEffect(s, play, { extra: { secretWays: true }, activation: null });
            break;
        case 'your-true-rulers':
            addEffect(s, play, { extra: { protectedCovens: true }, activation: null });
            break;
        case 'powerful-and-eternal': {
            a.pending = { kind: 'study', playerIndex: a.players.findIndex(p => p.id === play.playerId), allowance: 1, disciplines: [], marker: 'churn' };
            a.pending.immediateResume = pending;
            a.pending.immediate = true;
            break;
        }
        case 'conscription':
            if (play.choice !== '1')
                chooseBuild(s, play, 'empire-akritoi', 3, pending, ctx);
            break;
        case 'curse-of-xaraxxes':
        case 'the-red-wizards-curse':
            if (a.owned[target]) {
                a.owned[play.playerId] = a.owned[play.playerId].filter(id => id !== c.id);
                a.owned[target].push(c.id);
                draw(s, play.playerId, 'treasures', 1, ctx);
            }
            break;
        case 'mistress-of-the-hunt': break;
        case 'helm-of-the-white-dragon':
            addEffect(s, play, { extra: { blockSpells: true }, activation: s.activeUnitId });
            break;
        case 'kharks-troubadour':
            if (b) {
                const die = [...b.attackerRolls, ...b.defenderRolls].find(d => d.sides === 6);
                if (die) {
                    die.raw = ctx.die(s, 6);
                    die.modified = die.raw;
                    die.success = die.raw >= 5;
                    die.critical = false;
                }
            }
            break;
        case 'lore-of-the-ancients':
            chooseDiscard(s, play, play.playerId, 1, pending);
            break;
        case 'song-of-the-valkyrie':
            if (caster && ctx.die(s, 6) >= 5)
                chooseBuild(s, play, 'fjord-valkyries', 1, pending, ctx, caster.hexId, true);
            break;
        case 'martyrdom':
            chooseEffect(s, play, play.playerId, 'blessing', owner.kingdoms.filter(k => !s.kingdoms.find(v => v.id === k)?.collapsed && (a.decks[`blessings-${k}`]?.length || a.discards.blessings.some(id => cardById(id)?.kingdom === k))).map(value => ({ value, label: `Draw a ${s.kingdoms.find(k => k.id === value).name} Blessing` })), pending, { count: 2 });
            break;
        case 'living-siege-engine':
            addEffect(s, play, { abilities: ['siege'] });
            break;
        case 'immortal-sorceress': {
            const original = pending?.kind === 'window' ? pending.play : undefined, previous = cardById(original?.cardId ?? '');
            if (previous && original && original.casterId === play.casterId && (previous.mage || cardById(original.tomeId ?? '')?.mage))
                draw(s, play.playerId, previous.kind === 'blessing' ? `blessings-${previous.kingdom}` : 'spells', 1, ctx);
            break;
        }
    }
    if (play.targetHex && u) {
        const ids = e.armyDoesNotMove ? [u.id] : stackIds(s, u.id);
        for (const id of ids) {
            const v = s.units.find(u => u.id === id);
            if (v)
                v.hexId = play.targetHex;
        }
        if (e.finishStack)
            ctx.finish(s);
    }
    if (e.strike && h) {
        if (e.type === 'the-four-fingered-fist' && h.terrain === 'lair' && !a.monsters.some(m => m.hexId === h.id))
            revealMonster(s, h.id, true, 'land', null, ctx);
        if (e.type === 'earthquake') {
            const area = [h, ...ctx.adjacent(s, h.id)].filter(t => t.settlement?.fortified !== 2 && !a.effects.some(e => (e.target === t.id || s.units.some(v => v.id === e.target && v.hexId === t.id)) && (e.fortification ?? 0) > 0));
            const targets = area.map(t => a.monsters.find(m => m.hexId === t.id)?.id ?? s.units.find(v => v.hexId === t.id && !isHero(s, v))?.id ?? s.units.find(v => v.hexId === t.id)?.id ?? (t.settlement && !s.razed.includes(t.id) ? t.id : null)).filter((id) => !!id);
            if (targets.length)
                magicStrike(s, play, targets[0], ctx, targets.slice(1));
        }
        else
            magicStrike(s, play, a.monsters.find(m => m.hexId === h.id)?.id ?? u?.id ?? h.id, ctx);
    }
    if (e.inflictHits && u) {
        const members = stackIds(s, u.id);
        openWindow(s, 'hits', { target: u.id, count: e.inflictHits, members }, a.pending, ctx);
    }
    if (play.tomeId) {
        const tome = cardById(play.tomeId);
        const te = tome.effect;
        if (te.drawSpells)
            draw(s, play.playerId, 'spells', te.drawSpells, ctx);
        if (te.drawBlessings)
            draw(s, play.playerId, `blessings-${kid}`, te.drawBlessings, ctx);
        if (te.light && play.casterId)
            addEffect(s, { ...play, cardId: tome.id, targetId: play.casterId }, { light: te.light });
        if (te.discardCount) {
            chooseEffect(s, play, play.playerId, 'book-target', a.players.filter(p => p.id !== play.playerId && p.kingdoms.some(k => !ctx.sameSide(s, k, kid)) && a.hands[p.id].some(id => ['spell', 'blessing'].includes(cardById(id)?.kind ?? ''))).map(p => ({ value: p.id, label: `${p.name} chooses a discard` })), a.pending, {}, 'Book of the Dead · choose an opponent');
        }
        if (te.copyAbilitiesFromOneCommandedMonster && play.casterId)
            chooseEffect(s, play, play.playerId, 'copy-monster', a.monsters.filter(m => m.kingdom !== null).map(m => ({ value: m.id, label: `Copy ${monsterById(m.defId).name} (${monsterById(m.defId).abilities.join(', ') || 'no abilities'})` })), a.pending, {}, 'Encyclopedia · choose any commanded Monster');
    }
    ctx.log(s, `${owner.name} resolves ${c.kind === 'hero' ? c.name + ' — ' + e.type.replaceAll('-', ' ') : c.name}.`);
}
function monsterCanStrike(s, m, h, ctx) {
    if (h.settlement?.fortified || s.advanced.effects.some(e => (e.target === h.id || s.units.some(u => u.hexId === h.id && u.id === e.target)) && (e.fortification ?? 0) > 0))
        return false;
    const d = monsterById(m.defId), range = d.strikeRange ?? (d.pool === 'sea' ? 4 : d.abilities.includes('flying') ? 3 : d.abilities.includes('mage') ? 2 : 1);
    if (d.pool !== 'sea')
        return hexDistance(ctx.hex(s, m.hexId), h) <= range;
    const queue = [{ id: m.hexId, steps: 0 }], seen = new Set();
    while (queue.length) {
        const n = queue.shift();
        if (n.id === h.id)
            return true;
        if (seen.has(n.id) || n.steps >= range)
            continue;
        seen.add(n.id);
        for (const to of ctx.adjacent(s, n.id))
            if (ctx.seaCoastalEdge(s, n.id, to.id))
                queue.push({ id: to.id, steps: n.steps + 1 });
    }
    return false;
}
export function resolveImmediateTreasures(s) {
    const a = s.advanced;
    if (!a || a.pending?.kind === 'satchel' || s.phase === 'game-over')
        return;
    const player = a.players.find(p => a.hands[p.id].includes('treasure-02'));
    if (player)
        a.pending = { kind: 'satchel', playerId: player.id, resume: a.pending };
}
function curseActions(s, player) {
    const a = s.advanced, p = a.players.find(p => p.id === player);
    return a.owned[player].filter(id => cardById(id)?.effect.eliminateCostGold).flatMap(cardId => p.kingdoms.filter(id => !s.kingdoms.find(k => k.id === id)?.collapsed && (s.kingdoms.find(k => k.id === id)?.gold ?? 0) >= 3).map(kingdomId => ({ type: 'remove-curse', playerId: player, cardId, kingdomId })));
}
export function advancedLegalActions(s, ctx) {
    const a = s.advanced, p = a.pending, actions = [];
    if (p?.kind === 'satchel') {
        actions.push({ type: 'store-satchel', playerId: p.playerId });
        for (const kingdomId of a.players.find(x => x.id === p.playerId).kingdoms.filter(id => !s.kingdoms.find(k => k.id === id)?.collapsed))
            actions.push({ type: 'sell-treasure', playerId: p.playerId, cardId: 'treasure-02', kingdomId });
        return { actions, exclusive: true };
    }
    if (p?.kind === 'window') {
        const player = p.players[p.index];
        actions.push(...magicActions(s, player, ctx), { type: 'magic-pass', playerId: player });
        return { actions, exclusive: true };
    }
    if (p?.kind === 'study') {
        const player = a.players[p.playerIndex];
        actions.push(...curseActions(s, player.id));
        if (p.disciplines.length < p.allowance) {
            for (const discipline of ['spells', 'blessings', 'treasures'])
                if (!p.disciplines.includes(discipline)) {
                    if (discipline === 'treasures') {
                        const owned = a.owned[player.id].filter(id => !cardById(id)?.effect.cannotBeRetrieved);
                        for (const treasureId of owned) {
                            const fee = a.owned[player.id].filter(id => cardById(id)?.effect.retrieveTreasureGoldSurcharge).length;
                            const kingdoms = fee ? player.kingdoms.filter(id => (s.kingdoms.find(k => k.id === id)?.gold ?? 0) >= fee) : [undefined];
                            for (const payKingdomId of kingdoms)
                                actions.push({ type: 'study', playerId: player.id, discipline, treasureId, ...(payKingdomId ? { payKingdomId } : {}) });
                            if (a.owned[player.id].includes('treasure-02'))
                                for (const secondTreasureId of owned.filter(id => id !== treasureId))
                                    for (const payKingdomId of (fee ? player.kingdoms.filter(id => (s.kingdoms.find(k => k.id === id)?.gold ?? 0) >= fee * 2) : [undefined]))
                                        actions.push({ type: 'study', playerId: player.id, discipline, treasureId, secondTreasureId, ...(payKingdomId ? { payKingdomId } : {}) });
                        }
                    }
                    else {
                        actions.push({ type: 'study', playerId: player.id, discipline });
                        for (const discardId of a.hands[player.id].filter(id => cardById(id)?.kind === (discipline === 'spells' ? 'spell' : 'blessing')))
                            actions.push({ type: 'study', playerId: player.id, discipline, discardId });
                    }
                }
        }
        actions.push({ type: 'finish-study', playerId: player.id });
        return { actions, exclusive: true };
    }
    if (p?.kind === 'winter') {
        const player = a.players[p.playerIndex];
        actions.push(...curseActions(s, player.id));
        const total = unique([...a.hands[player.id].filter(id => cardById(id)?.kind === 'treasure'), ...a.owned[player.id]]), limit = total.includes('treasure-02') ? 4 : 2;
        for (const cardId of total)
            if (!cardById(cardId)?.effect.cannotBeSold)
                for (const kingdomId of player.kingdoms.filter(k => !s.kingdoms.find(x => x.id === k)?.collapsed))
                    actions.push({ type: 'sell-treasure', playerId: player.id, cardId, kingdomId });
        if (total.length <= limit)
            actions.push({ type: 'finish-winter', playerId: player.id });
        else if (total.every(id => cardById(id)?.effect.cannotBeSold))
            actions.push({ type: 'winter-ruling', playerId: player.id });
        return { actions, exclusive: true };
    }
    if (p?.kind === 'hit') {
        const group = p.members ?? stackIds(s, p.target), units = group.filter(id => s.units.some(u => u.id === id));
        if (units.length)
            for (const unitId of units)
                actions.push({ type: 'allocate-hit', unitId });
        else
            actions.push({ type: 'accept-hit' });
        return { actions, exclusive: true };
    }
    if (p?.kind === 'command') {
        for (const kingdomId of p.choices) {
            if (a.monsters.filter(m => m.kingdom === kingdomId).length < 3)
                actions.push({ type: 'command-monster', kingdomId });
            else
                for (const m of a.monsters.filter(m => m.kingdom === kingdomId))
                    actions.push({ type: 'slink-away', monsterId: m.id });
        }
        return { actions, exclusive: true };
    }
    if (p?.kind === 'choice') {
        for (const { value } of p.choices)
            actions.push({ type: 'magic-choice', value });
        return { actions, exclusive: true };
    }
    if (s.pendingCombat)
        return { actions: [], exclusive: false };
    if (s.phase === 'activation') {
        for (const player of a.players) {
            actions.push(...magicActions(s, player.id, ctx));
            if (!player.kingdoms.includes(s.currentKingdom) && player.kingdoms.some(id => s.kingdoms.find(k => k.id === id)?.controller === 'human') && magicActions(s, player.id, ctx).length)
                actions.push({ type: 'request-cantrip', playerId: player.id });
        }
        const k = s.kingdoms.find(k => k.id === s.currentKingdom);
        actions.push(...curseActions(s, playerFor(s, k.id).id));
        const heroDef = s.unitDefinitions.find(d => d.kind === 'hero' && d.kingdom === k.id);
        if (!s.activeUnitId && heroDef && a.heroPools[k.id]?.length && k.gold >= heroDef.cost)
            for (const h of ctx.buildLocations(s, heroDef))
                actions.push({ type: 'recruit-hero', hexId: h.id });
        for (const u of s.units.filter(u => u.kingdom === k.id)) {
            if (isHero(s, u) && a.stacks[u.id] && (!u.activated || !s.units.find(v => v.id === a.stacks[u.id])?.activated) && (!s.activeUnitId || stackIds(s, s.activeUnitId).includes(u.id)))
                actions.push({ type: 'drop-hero', unitId: u.id }, { type: 'drop-army', unitId: u.id });
            if (isHero(s, u) && !a.stacks[u.id])
                for (const army of s.units.filter(v => v.kingdom === k.id && v.hexId === u.hexId && !isHero(s, v) && (!s.activeUnitId || !u.activated && !v.activated && [u.id, v.id].includes(s.activeUnitId))))
                    actions.push({ type: 'join-stack', unitId: u.id, armyId: army.id });
            if (!u.activated && !stackIds(s, u.id).some(id => s.units.find(v => v.id === id)?.activated) && !isHero(s, u) && (!s.activeUnitId || stackIds(s, s.activeUnitId).includes(u.id)))
                for (const h of ctx.adjacent(s, u.hexId)) {
                    if (h.terrain === 'lair' && !a.explored.includes(h.id) && !a.monsters.some(m => m.hexId === h.id))
                        actions.push({ type: 'explore-lair', unitId: u.id, targetHex: h.id });
                    if (a.monsters.some(m => m.hexId === h.id))
                        actions.push({ type: 'attack-monster', unitId: u.id, targetHex: h.id });
                }
        }
        for (const m of a.monsters.filter(m => m.kingdom === k.id)) {
            if (m.activated || s.activeUnitId)
                continue;
            actions.push({ type: 'slink-away', monsterId: m.id }, { type: 'monster-pass', monsterId: m.id });
            const d = monsterById(m.defId);
            for (const u of s.units.filter(u => !ctx.sameSide(s, u.kingdom, k.id)))
                if (monsterCanStrike(s, m, ctx.hex(s, u.hexId), ctx))
                    actions.push({ type: 'monster-strike', monsterId: m.id, targetId: u.id });
            for (const h of s.hexes.filter(h => h.settlement && !s.razed.includes(h.id) && !ctx.welcoming(s, h, k.id) && !s.units.some(u => u.hexId === h.id)))
                if (monsterCanStrike(s, m, h, ctx))
                    actions.push({ type: 'monster-strike', monsterId: m.id, targetId: h.id });
        }
        for (const player of a.players.filter(p => p.kingdoms.includes(k.id)))
            for (const cardId of unique([...a.hands[player.id].filter(id => cardById(id)?.kind === 'treasure'), ...a.owned[player.id]]))
                if (a.playedTreasures[cardId] !== s.turnSerial && !cardById(cardId)?.effect.cannotBeSold)
                    actions.push({ type: 'sell-treasure', playerId: player.id, cardId, kingdomId: k.id });
    }
    return { actions, exclusive: false };
}
export function applyAdvancedAction(s, action, ctx) {
    const a = s.advanced, p = a.pending;
    switch (action.type) {
        case 'winter-ruling':
            if (p?.kind === 'winter') {
                const message = `Table ruling: ${a.players[p.playerIndex].name} retains unsellable Treasure excess this Winter; the printed holding/sale rules supply no disposal exception.`;
                (a.tableRulings ??= []).push(message);
                ctx.log(s, message);
                p.playerIndex++;
                skipCollapsedPlayers(s, ctx);
            }
            break;
        case 'request-cantrip':
            openWindow(s, 'interject', undefined, p, ctx, [action.playerId]);
            break;
        case 'drop-army': {
            const hero = ctx.unit(s, action.unitId), army = ctx.unit(s, a.stacks[hero.id]);
            delete a.stacks[hero.id];
            if (s.activeUnitId) {
                army.activated = true;
                const before = s.activeUnitId;
                s.activeUnitId = hero.id;
                a.activationIds = [hero.id];
                s.remainingMP = a.movement[hero.id] ?? ctx.def(s, hero).movement;
                a.effects = a.effects.filter(e => !(e.activation === before && e.target === army.id));
                for (const e of a.effects)
                    if (e.activation === before)
                        e.activation = hero.id;
            }
            ctx.log(s, `${ctx.rawDef(s, hero).name} leaves ${ctx.rawDef(s, army).name} behind.`);
            break;
        }
        case 'store-satchel':
            if (p?.kind === 'satchel') {
                discard(s, action.playerId, 'treasure-02');
                a.pending = p.resume;
                ctx.log(s, 'Endless Satchel is now owned: retrieve up to two Treasures and keep four in Winter.');
            }
            break;
        case 'remove-curse': {
            a.owned[action.playerId] = a.owned[action.playerId].filter(id => id !== action.cardId);
            a.eliminatedTreasures.push(action.cardId);
            s.kingdoms.find(k => k.id === action.kingdomId).gold -= 3;
            ctx.log(s, `${cardById(action.cardId).name} removed for 3 gold.`);
            break;
        }
        case 'play-card':
        case 'hero-power': {
            const play = { ...action, ...(action.casterId ? { casterKingdom: combatantKingdom(s, action.casterId) } : {}) };
            if (a.battle && !a.battle.magicLifted) {
                (a.battle.plays ??= []).push({ cardId: action.cardId, playerId: action.playerId });
                if ('tomeId' in action && action.tomeId)
                    a.battle.plays.push({ cardId: action.tomeId, playerId: action.playerId });
            }
            if (action.type === 'play-card') {
                discard(s, action.playerId, action.cardId);
                if (action.tomeId)
                    discard(s, action.playerId, action.tomeId);
            }
            const card = cardById(action.cardId), e = { ...card.effect, ...(card.effect.choices?.[Number(action.choice)] ?? {}), ...(action.choice === 'boost' ? { discardSpells: 1 } : {}) };
            if (action.costCardId)
                for (const id of action.costCardId.split(','))
                    discard(s, action.playerId, id);
            else if (e.discardSpells)
                paySpellCost(s, action.playerId, e.discardSpells, ctx);
            if (e.discardRandomSpells)
                paySpellCost(s, action.playerId, e.discardRandomSpells, ctx, true);
            if (e.lockSource && action.casterId && !a.locked.includes(action.casterId))
                a.locked.push(action.casterId);
            if (e.eliminateCaster || e.eliminateSourceHero)
                ctx.hit(s, action.casterId, 2);
            const prior = a.lastPlay;
            a.lastPlay = play;
            openWindow(s, 'reaction', { previous: prior }, p, ctx, p?.kind === 'window' && p.window === 'battle' && p.step === 2 ? p.players : undefined);
            if (a.pending?.kind === 'window' && a.pending.window === 'reaction')
                a.pending.play = play;
            break;
        }
        case 'magic-pass':
            if (p?.kind === 'window') {
                p.index++;
                skipEmptyWindow(s, ctx);
            }
            break;
        case 'study':
            if (p?.kind === 'study') {
                const player = a.players[p.playerIndex];
                if (action.discardId)
                    discard(s, player.id, action.discardId);
                if (action.discipline === 'spells') {
                    const n = a.hands[player.id].filter(id => cardById(id)?.kind === 'spell').length;
                    draw(s, player.id, 'spells', Math.max(0, 3 - n), ctx);
                }
                if (action.discipline === 'blessings')
                    for (const k of player.kingdoms.filter(id => !s.kingdoms.find(k => k.id === id)?.collapsed))
                        if (!a.hands[player.id].some(id => cardById(id)?.kind === 'blessing' && cardById(id)?.kingdom === k))
                            draw(s, player.id, `blessings-${k}`, 1, ctx);
                if (action.discipline === 'treasures')
                    for (const id of [action.treasureId, action.secondTreasureId].filter((id) => !!id)) {
                        a.owned[player.id] = a.owned[player.id].filter(x => x !== id);
                        a.hands[player.id].push(id);
                    }
                if (action.payKingdomId) {
                    const fee = a.owned[player.id].filter(id => cardById(id)?.effect.retrieveTreasureGoldSurcharge).length * (action.secondTreasureId ? 2 : 1);
                    s.kingdoms.find(k => k.id === action.payKingdomId).gold -= fee;
                }
                p.disciplines.push(action.discipline);
                ctx.log(s, `${player.name} studies ${action.discipline}.`);
            }
            break;
        case 'finish-study':
            if (p?.kind === 'study') {
                if (p.immediate)
                    a.pending = p.immediateResume ?? null;
                else {
                    p.playerIndex++;
                    p.disciplines = [];
                    skipCollapsedPlayers(s, ctx);
                }
            }
            break;
        case 'sell-treasure': {
            a.hands[action.playerId] = a.hands[action.playerId].filter(id => id !== action.cardId);
            a.owned[action.playerId] = a.owned[action.playerId].filter(id => id !== action.cardId);
            a.eliminatedTreasures.push(action.cardId);
            s.kingdoms.find(k => k.id === action.kingdomId).gold += 2;
            ctx.log(s, `${cardById(action.cardId).name} sold for 2 gold.`);
            if (p?.kind === 'satchel')
                a.pending = p.resume;
            break;
        }
        case 'finish-winter':
            if (p?.kind === 'winter') {
                p.playerIndex++;
                skipCollapsedPlayers(s, ctx);
            }
            break;
        case 'recruit-hero': {
            const d = s.unitDefinitions.find(d => d.kind === 'hero' && d.kingdom === s.currentKingdom);
            s.kingdoms.find(k => k.id === s.currentKingdom).gold -= d.cost;
            gainHero(s, s.currentKingdom, action.hexId, ctx);
            break;
        }
        case 'drop-hero':
            if (s.activeUnitId)
                ctx.unit(s, action.unitId).activated = true;
            delete a.stacks[action.unitId];
            a.activationIds = a.activationIds.filter(id => id !== action.unitId);
            if (s.activeUnitId === action.unitId) {
                const army = s.units.find(u => u.id !== action.unitId && u.hexId === ctx.unit(s, action.unitId).hexId && !isHero(s, u));
                if (army) {
                    s.activeUnitId = army.id;
                    s.remainingMP = a.movement[army.id] ?? ctx.def(s, army).movement;
                }
            }
            ctx.log(s, `${ctx.rawDef(s, ctx.unit(s, action.unitId)).name} leaves its stack.`);
            break;
        case 'join-stack':
            a.stacks[action.unitId] = action.armyId;
            if (ctx.unit(s, action.armyId).activated || ctx.unit(s, action.unitId).activated) {
                ctx.unit(s, action.unitId).activated = true;
                ctx.unit(s, action.armyId).activated = true;
                if (s.activeUnitId && [action.unitId, action.armyId].includes(s.activeUnitId))
                    ctx.finish(s);
            }
            else if (s.activeUnitId) {
                a.activationIds = unique([...a.activationIds, action.unitId, action.armyId]);
                a.movement[action.unitId] ??= ctx.def(s, ctx.unit(s, action.unitId)).movement;
                s.remainingMP = Math.min(a.movement[action.unitId], a.movement[action.armyId] ?? ctx.def(s, ctx.unit(s, action.armyId)).movement);
            }
            break;
        case 'allocate-hit':
        case 'accept-hit':
            if (p?.kind === 'hit') {
                const id = action.type === 'allocate-hit' ? action.unitId : p.target, m = a.monsters.find(m => m.id === id);
                if (m)
                    hitMonster(s, m, 1, a.battle?.reward, a.battle?.attackerKingdom ?? s.currentKingdom, ctx);
                else if (s.units.some(u => u.id === id))
                    ctx.hit(s, id, 1);
                p.count--;
                const remaining = (p.members ?? stackIds(s, p.target)).filter(id => s.units.some(u => u.id === id));
                if (p.count > 0 && remaining.length) {
                    const rest = { target: remaining[0], count: p.count, members: remaining };
                    openWindow(s, 'hits', rest, p.resume, ctx);
                }
                else {
                    a.pending = p.resume;
                    if (a.battle)
                        continueHits(s, ctx);
                }
            }
            break;
        case 'explore-lair':
        case 'attack-monster': {
            ctx.start(s, ctx.unit(s, action.unitId));
            let m = a.monsters.find(m => m.hexId === action.targetHex);
            if (!m)
                m = revealMonster(s, action.targetHex, true, 'land', null, ctx);
            if (!m) {
                ctx.log(s, 'The Monster pool is empty.');
                ctx.finish(s);
                break;
            }
            const choices = s.kingdoms.filter(k => !k.collapsed && !ctx.sameSide(s, k.id, s.currentKingdom)).map(k => k.id);
            if (!m.kingdom) {
                a.pending = { kind: 'command', monsterId: m.id, choices, resume: null, attackerId: action.unitId };
                a.lairAttacker = action.unitId;
            }
            else
                beginMonsterBattle(s, action.unitId, m, ctx);
            break;
        }
        case 'command-monster':
            if (p?.kind === 'command') {
                const m = a.monsters.find(m => m.id === p.monsterId);
                m.kingdom = action.kingdomId;
                a.pending = p.resume;
                if (m.lair)
                    beginMonsterBattle(s, p.attackerId ?? a.lairAttacker, m, ctx);
                else if (a.pending?.kind === 'window')
                    skipEmptyWindow(s, ctx);
            }
            break;
        case 'monster-pass':
            a.monsters.find(m => m.id === action.monsterId).activated = true;
            break;
        case 'slink-away': {
            const m = a.monsters.find(m => m.id === action.monsterId);
            a.monsterPools[monsterById(m.defId).pool].push(m.defId);
            a.monsters = a.monsters.filter(m => m.id !== action.monsterId);
            ctx.log(s, `${monsterById(m.defId).name} slinks away.`);
            break;
        }
        case 'monster-strike': {
            const m = a.monsters.find(m => m.id === action.monsterId), pool = combatantPool(s, m.id, ctx);
            m.activated = true;
            const h = targetHex(s, action.targetId, ctx);
            a.battle = { kind: 'strike', attacker: m.id, defender: action.targetId, targetHex: h.id, attackerKingdom: m.kingdom, defenderKingdom: combatantKingdom(s, action.targetId), step: 0, magicLifted: true, attackerRolls: [], defenderRolls: [], attackerSuccesses: 0, defenderSuccesses: 0, attackerHits: 0, defenderHits: 0, result: 'draw', hitQueue: [], light: pool.light, heavy: pool.heavy };
            openWindow(s, 'strike', undefined, null, ctx);
            break;
        }
        case 'magic-choice':
            if (p?.kind === 'choice') {
                const data = p.data ?? {}, value = action.value;
                if (p.flow === 'repeat-strike') {
                    a.pending = p.resume;
                    if (value !== 'skip') {
                        discard(s, p.playerId, value);
                        magicStrike(s, p.play, data.target, ctx, [], true);
                    }
                    break;
                }
                if (p.flow === 'return-card') {
                    if (value === 'keep') {
                        for (const pile of Object.values(a.discards)) {
                            const index = pile.indexOf(p.play.cardId);
                            if (index >= 0)
                                pile.splice(index, 1);
                        }
                        a.hands[p.playerId].push(p.play.cardId);
                    }
                    a.pending = p.resume;
                    break;
                }
                if (p.flow === 'recover') {
                    const unit = ctx.unit(s, value);
                    unit.weakened = false;
                    a.pending = p.resume;
                    break;
                }
                if (p.flow === 'book-target') {
                    chooseEffect(s, p.play, value, 'book-discard', a.hands[value].filter(id => ['spell', 'blessing'].includes(cardById(id)?.kind ?? '')).map(id => ({ value: id, label: `Discard ${cardById(id).name} (${cardById(id).kind})` })), p.resume, {}, 'Book of the Dead · choose your card');
                    break;
                }
                if (p.flow === 'book-discard') {
                    discard(s, p.playerId, value);
                    a.pending = p.resume;
                    break;
                }
                if (p.flow === 'copy-monster') {
                    const m = a.monsters.find(m => m.id === value);
                    addEffect(s, { ...p.play, cardId: 'treasure-22', targetId: p.play.casterId }, { abilities: monsterById(m.defId).abilities });
                    a.pending = p.resume;
                    break;
                }
                if (p.flow === 'pestilence') {
                    const id = ctx.die(s, 6) >= 5 ? value : data.target;
                    const members = stackIds(s, id);
                    openWindow(s, 'hits', { target: id, count: 1, members }, p.resume, ctx);
                    break;
                }
                if (p.flow === 'discard') {
                    discard(s, p.playerId, value);
                    chooseDiscard(s, p.play, p.playerId, data.count - 1, p.resume, data.kind);
                    break;
                }
                if (p.flow === 'build') {
                    const d = s.unitDefinitions.find(d => d.id === data.defId), h = ctx.hex(s, value), ready = data.ready || h.entry === d.kingdom || h.settlement && ctx.controller(s, h) === d.kingdom && !s.razed.includes(h.id);
                    const built = { id: `unit-${s.serial++}`, defId: d.id, kingdom: d.kingdom, hexId: value, weakened: false, activated: !ready };
                    s.units.push(built);
                    const hero = s.units.find(u => u.id !== built.id && u.hexId === value && u.kingdom === d.kingdom && isHero(s, u));
                    if (hero) {
                        a.stacks[hero.id] = built.id;
                        if (hero.activated && !data.ready)
                            built.activated = true;
                    }
                    chooseBuild(s, p.play, d.id, data.count - 1, p.resume, ctx, data.near, data.ready);
                    break;
                }
                if (p.flow === 'hero') {
                    const hero = gainHero(s, data.kid, value, ctx, cardById(p.play.cardId)?.effect.type === 'kharks-chosen' ? p.play.choice : undefined, true);
                    if (hero && cardById(p.play.cardId)?.effect.gainedHeroHeavy)
                        addEffect(s, { ...p.play, targetId: hero.id }, { heavy: cardById(p.play.cardId).effect.gainedHeroHeavy });
                    chooseHeroPlacement(s, p.play, data.kid, data.count - 1, p.resume, ctx);
                    break;
                }
                if (p.flow === 'blessing') {
                    draw(s, p.playerId, `blessings-${value}`, 1, ctx);
                    const count = data.count - 1;
                    if (count > 0)
                        chooseEffect(s, p.play, p.playerId, 'blessing', a.players.find(v => v.id === p.playerId).kingdoms.filter(k => !s.kingdoms.find(v => v.id === k)?.collapsed && (a.decks[`blessings-${k}`]?.length || a.discards.blessings.some(id => cardById(id)?.kingdom === k))).map(value => ({ value, label: `Draw a ${s.kingdoms.find(k => k.id === value).name} Blessing` })), p.resume, { count });
                    else
                        a.pending = p.resume;
                    break;
                }
                if (p.flow === 'forced-move') {
                    const unit = s.units.find(u => u.id === data.unitId);
                    if (value === 'hit') {
                        const members = stackIds(s, unit.id);
                        openWindow(s, 'hits', { target: unit.id, count: 1, members }, p.resume, ctx);
                    }
                    else {
                        const [mode, hexId] = value.split(':');
                        const ids = mode === 'army' ? [unit.id] : stackIds(s, unit.id);
                        if (mode === 'army')
                            for (const id of Object.keys(a.stacks))
                                if (a.stacks[id] === unit.id)
                                    delete a.stacks[id];
                        for (const id of ids)
                            ctx.unit(s, id).hexId = hexId;
                        a.pending = p.resume;
                    }
                    break;
                }
                const u = s.units.find(u => u.id === p.play.targetId);
                if (u) {
                    if (action.value === 'hit')
                        ctx.hit(s, u.id, 1);
                    else
                        for (const id of stackIds(s, u.id)) {
                            const v = s.units.find(u => u.id === id);
                            if (v)
                                v.hexId = action.value;
                        }
                }
                a.pending = p.resume;
            }
            break;
    }
}
function beginMonsterBattle(s, attacker, m, ctx) { const a = s.advanced; s.pendingCombat = { attackerId: attacker, targetHex: m.hexId, stage: 'ambush', decisionKingdom: s.currentKingdom, defenderUnitId: m.id }; a.battle = { kind: 'battle', attacker, defender: m.id, targetHex: m.hexId, attackerKingdom: s.currentKingdom, defenderKingdom: m.kingdom, step: 0, magicLifted: false, attackerRolls: [], defenderRolls: [], attackerSuccesses: 0, defenderSuccesses: 0, attackerHits: 0, defenderHits: 0, result: 'draw', hitQueue: [], reward: 'combat' }; advanceBattleMagic(s, 0, ctx); }
export function beginMovement(s, unitId, path, ship, ctx) {
    const wave = s.advanced.effects.some(e => stackIds(s, unitId).includes(e.target) && e.extra?.waveStrider);
    continueMovement(s, { unitId, path, ship, finish: ship && !wave && s.units.find(u => u.id === unitId)?.kingdom !== 'fjordland' }, ctx);
}
function continueMovement(s, event, ctx) {
    const unit = s.units.find(u => u.id === event.unitId) ?? s.units.find(u => u.id === s.activeUnitId);
    if (!unit || !s.activeUnitId)
        return;
    event.unitId = unit.id;
    const [to, ...path] = event.path;
    if (!to) {
        if (event.finish)
            ctx.finish(s);
        return;
    }
    const from = unit.hexId, sea = ctx.seaEdge(s, from, to);
    if (!ctx.moveStep(s, unit.id, to, !!event.ship, !path.length)) {
        ctx.log(s, 'Movement stops after the map changed.');
        return;
    }
    // §14.6.5 Army entry eliminates a lone enemy Hero, regardless of which
    // member leads the moving stack. A Hero in another Army's stack survives
    // legal Flying transit; a Hero moving alone can pass another lone Hero.
    if (stackIds(s, unit.id).some(id => !isHero(s, ctx.unit(s, id))))
        for (const hero of s.units.filter(v => v.hexId === to && !ctx.sameSide(s, v.kingdom, unit.kingdom) && isHero(s, v)))
            if (!stackIds(s, hero.id).some(id => !isHero(s, ctx.unit(s, id))))
                ctx.hit(s, hero.id, 1);
    openWindow(s, 'movement', { ...event, path, fromHex: from, enteredHex: to, sea }, null, ctx);
}
export function consumeTableHit(s, ctx) {
    const a = s.advanced, p = a.pending;
    if (p?.kind !== 'hit')
        throw new Error('No hit is waiting for allocation.');
    p.count--;
    const remaining = (p.members ?? stackIds(s, p.target)).filter(id => s.units.some(u => u.id === id));
    if (p.count > 0 && remaining.length)
        openWindow(s, 'hits', { target: remaining[0], count: p.count, members: remaining }, p.resume, ctx);
    else {
        a.pending = p.resume;
        if (a.battle)
            continueHits(s, ctx);
    }
}
export function advancedMoveEvent(s, unitId, ship, finish, ctx) {
    openWindow(s, 'movement', { unitId, ship, finish, path: [], enteredHex: s.units.find(u => u.id === unitId)?.hexId }, null, ctx);
}
export function advancedDescription(s) {
    const a = s.advanced, p = a?.pending;
    if (!a)
        return null;
    if (p?.kind === 'study') {
        const player = a.players[p.playerIndex];
        return { title: `${player.name} · Arcane Study`, text: `${p.marker === 'glyph' ? 'Glyph' : 'Churn'}: ${Math.max(0, p.allowance - p.disciplines.length)} ${p.allowance - p.disciplines.length === 1 ? 'discipline' : 'disciplines'} remaining. Study or continue.` };
    }
    if (p?.kind === 'satchel')
        return { title: 'Endless Satchel', text: 'Keep and play the Satchel now, or sell it for 2 gold to a kingdom you command.' };
    if (p?.kind === 'winter') {
        const player = a.players[p.playerIndex], total = [...a.hands[player.id].filter(id => cardById(id)?.kind === 'treasure'), ...a.owned[player.id]].length, limit = a.owned[player.id].includes('treasure-02') ? 4 : 2;
        return { title: 'Winter · Treasure limit', text: `${player.name} holds ${total} Treasures and may keep ${limit}. ${total > limit ? `Sell ${total - limit} before continuing.` : 'Your collection is within the limit; continue when ready.'}` };
    }
    if (p?.kind === 'window')
        return { title: p.window === 'battle' ? ['Attacker Magic', 'Defender Cantrips', 'Attacker Cantrips'][p.step] : p.window === 'reaction' ? 'Respond to Magic' : p.window === 'roll' ? 'Dice response' : p.window === 'critical' ? 'Critical confirmation' : p.window === 'hits' ? 'Protect against hits' : p.window === 'interject' ? 'Cantrip interjection' : p.window === 'movement' ? 'Movement response' : 'Strike response', text: 'Play an eligible card or continue. Empty windows resolve automatically.' };
    if (p?.kind === 'hit')
        return { title: `Allocate ${p.count} ${p.count === 1 ? 'hit' : 'hits'}`, text: 'Choose the Army or Hero to take the next hit. Recovery can be played between hits.' };
    if (p?.kind === 'command')
        return a.monsters.find(m => m.id === p.monsterId)?.lair
            ? { title: 'Command the revealed Monster', text: 'Choose an opposing kingdom to command this Monster. A kingdom at its three-command limit must let an old Monster Slink Away first.' }
            : { title: 'Make room for the wandering Monster', text: 'Your active kingdom already commands three Monsters. Choose one to Slink Away, then command the newly revealed Monster.' };
    if (p?.kind === 'choice')
        return { title: p.title ?? 'Resolve Magic', text: 'Choose an outcome below. The game waits for the indicated player and saves this decision.' };
    return null;
}
/** Check imported JSON before any engine helper follows pointers or iterates zones. */
export function validateAdvancedShape(value) {
    if (value === undefined)
        return [];
    const object = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
    const text = (v) => typeof v === 'string' && v.length > 0 && v.length <= 160;
    const strings = (v) => Array.isArray(v) && v.length <= 500 && v.every(text);
    const integer = (v, min = 0, max = 10000000) => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
    const record = (v, check) => object(v) && Object.keys(v).length <= 500 && Object.entries(v).every(([key, val]) => text(key) && !['__proto__', 'constructor', 'prototype'].includes(key) && check(val));
    const json = (v, depth = 0) => depth <= 15 && (v === null || typeof v === 'boolean' || typeof v === 'string' && v.length <= 2000 || typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 10000000 || Array.isArray(v) && v.length <= 500 && v.every(x => json(x, depth + 1)) || object(v) && Object.keys(v).length <= 100 && Object.entries(v).every(([k, x]) => !['__proto__', 'constructor', 'prototype'].includes(k) && json(x, depth + 1)));
    if (!object(value) || value.version !== 1)
        return ['Invalid Advanced rules state.'];
    const a = value;
    if (!Array.isArray(a.players) || a.players.length < 1 || a.players.length > 6 || !a.players.every(p => object(p) && text(p.id) && text(p.name) && strings(p.kingdoms) && p.kingdoms.length > 0 && p.kingdoms.length <= 6))
        return ['Invalid Advanced players.'];
    for (const key of ['hands', 'owned', 'decks', 'discards', 'heroPools'])
        if (!record(a[key], strings))
            return [`Invalid Advanced ${key}.`];
    for (const key of ['eliminatedTreasures', 'removedCards', 'eliminatedHeroes', 'locked', 'activationIds', 'explored', 'defeatedMonsters'])
        if (!strings(a[key]))
            return [`Invalid Advanced ${key}.`];
    if (!record(a.stacks, text) || !record(a.movement, v => integer(v, -100, 100)) || !record(a.playedTreasures, v => integer(v)) || !record(a.studyMarkers, v => v === 'glyph' || v === 'churn') || typeof a.extraChurn !== 'boolean' || !integer(a.eventSerial))
        return ['Invalid Advanced counters.'];
    if (!object(a.monsterPools) || !strings(a.monsterPools.land) || !strings(a.monsterPools.sea))
        return ['Invalid Monster pools.'];
    if (a.tableRulings !== undefined && (!Array.isArray(a.tableRulings) || a.tableRulings.length > 250 || a.tableRulings.some((v) => typeof v !== 'string' || v.length > 2000)))
        return ['Invalid table rulings.'];
    if (a.eventQueue !== undefined && (!Array.isArray(a.eventQueue) || a.eventQueue.length > 2000 || !a.eventQueue.every((v) => json(v))))
        return ['Invalid rules event queue.'];
    if (a.shipsThisTurn !== undefined && !strings(a.shipsThisTurn))
        return ['Invalid Ship Movement history.'];
    if (a.khazud !== undefined && !text(a.khazud))
        return ['Invalid Khazud location.'];
    if (!Array.isArray(a.monsters) || a.monsters.length > 36 || !a.monsters.every(m => object(m) && text(m.id) && text(m.defId) && text(m.hexId) && (m.kingdom === null || text(m.kingdom)) && typeof m.weakened === 'boolean' && typeof m.activated === 'boolean' && typeof m.lair === 'boolean'))
        return ['Invalid Monster state.'];
    if (!Array.isArray(a.effects) || a.effects.length > 300 || !a.effects.every(e => object(e) && text(e.cardId) && text(e.target) && (e.activation === null || text(e.activation)) && integer(e.expires) && ['light', 'heavy', 'movement', 'fortification', 'convertLightToHeavy', 'multiplyLight'].every(k => e[k] === undefined || integer(e[k], -20, 20)) && (e.abilities === undefined || strings(e.abilities)) && (e.extra === undefined || json(e.extra))))
        return ['Invalid Magic effects.'];
    const play = (p) => object(p) && !!cardById(p.cardId) && text(p.playerId) && ['casterId', 'casterKingdom', 'targetId', 'targetHex', 'choice', 'tomeId', 'costCardId'].every(k => p[k] === undefined || text(p[k])) && (p.canceled === undefined || typeof p.canceled === 'boolean');
    const pending = (p, depth = 0) => {
        if (p === null)
            return true;
        if (depth > 15 || !object(p))
            return false;
        if (p.kind === 'study')
            return (p.immediate === undefined || typeof p.immediate === 'boolean') && (p.immediateResume === undefined || pending(p.immediateResume, depth + 1)) && integer(p.playerIndex, 0, a.players.length - 1) && integer(p.allowance, 1, 3) && strings(p.disciplines) && p.disciplines.every((x) => ['spells', 'blessings', 'treasures'].includes(x)) && new Set(p.disciplines).size === p.disciplines.length && p.disciplines.length <= p.allowance && ['glyph', 'churn'].includes(p.marker);
        if (p.kind === 'winter')
            return integer(p.playerIndex, 0, a.players.length - 1);
        if (p.kind === 'window')
            return ['battle', 'reaction', 'strike', 'roll', 'critical', 'hits', 'movement', 'elimination', 'interject'].includes(p.window) && strings(p.players) && p.players.length > 0 && integer(p.index, 0, p.players.length - 1) && integer(p.step, 0, 3) && (p.play === undefined || play(p.play)) && (p.event === undefined || json(p.event)) && pending(p.resume ?? null, depth + 1);
        if (p.kind === 'hit')
            return text(p.target) && integer(p.count, 1, 500) && (p.members === undefined || strings(p.members)) && pending(p.resume, depth + 1);
        if (p.kind === 'command')
            return text(p.monsterId) && strings(p.choices) && p.choices.length > 0 && (p.attackerId === undefined || text(p.attackerId)) && pending(p.resume, depth + 1);
        if (p.kind === 'satchel')
            return text(p.playerId) && pending(p.resume, depth + 1);
        if (p.kind === 'choice') {
            const flows = ['repeat-strike', 'return-card', 'recover', 'book-target', 'book-discard', 'copy-monster', 'pestilence', 'discard', 'build', 'hero', 'blessing', 'forced-move'], data = p.data ?? {};
            if (p.flow !== undefined && !flows.includes(p.flow))
                return false;
            if (['build', 'hero', 'blessing', 'discard'].includes(p.flow) && !integer(data.count, 1, 20))
                return false;
            if (p.flow === 'build' && (!text(data.defId) || (data.near !== undefined && !text(data.near)) || typeof data.ready !== 'boolean'))
                return false;
            if (p.flow === 'hero' && !text(data.kid) || p.flow === 'discard' && !['spell', 'blessing', 'either'].includes(data.kind) || ['repeat-strike', 'pestilence'].includes(p.flow) && !text(data.target) || p.flow === 'forced-move' && !text(data.unitId))
                return false;
            return text(p.playerId) && Array.isArray(p.choices) && p.choices.length > 0 && p.choices.length <= 500 && p.choices.every((c) => object(c) && text(c.label) && text(c.value)) && (p.title === undefined || text(p.title)) && (p.data === undefined || json(p.data)) && play(p.play) && pending(p.resume, depth + 1);
        }
        return false;
    };
    const rolls = (pool) => Array.isArray(pool) && pool.length <= 150 && pool.every(d => object(d) && [6, 8].includes(d.sides) && integer(d.raw, 1, d.sides) && integer(d.modified, -100, 100) && typeof d.success === 'boolean' && typeof d.critical === 'boolean' && (d.confirmation === undefined || integer(d.confirmation, 1, 8)) && (d.confirmations === undefined || Array.isArray(d.confirmations) && d.confirmations.length <= 32 && d.confirmations.every((c) => object(c) && [6, 8].includes(c.sides) && integer(c.raw, 1, c.sides))) && (d.bonus === undefined || integer(d.bonus, 0, 100)));
    const battle = (b, depth = 0) => b === null || depth < 10 && object(b) && ['battle', 'strike', 'ambush'].includes(b.kind) && text(b.attacker) && text(b.targetHex) && text(b.attackerKingdom) && text(b.defenderKingdom) && integer(b.step, 0, 3) && typeof b.magicLifted === 'boolean' && rolls(b.attackerRolls) && rolls(b.defenderRolls) && ['attackerSuccesses', 'defenderSuccesses', 'attackerHits', 'defenderHits'].every(k => integer(b[k], 0, 500)) && ['attacker', 'defender', 'draw', 'tie', 'ambush'].includes(b.result) && Array.isArray(b.hitQueue) && b.hitQueue.length <= 4 && b.hitQueue.every((h) => object(h) && text(h.target) && integer(h.count, 1, 500)) && (b.parent === undefined || battle(b.parent, depth + 1)) && (b.resume === undefined || pending(b.resume)) && (b.remaining === undefined || strings(b.remaining)) && (b.sourcePlay === undefined || play(b.sourcePlay)) && (b.repeat === undefined || typeof b.repeat === 'boolean') && (b.continuation === undefined || play(b.continuation));
    if (!pending(a.pending) || !battle(a.battle) || (a.lastPlay !== null && !play(a.lastPlay)))
        return ['Invalid Advanced pending decision.'];
    return [];
}
export function validateAdvanced(s) {
    const a = s.advanced, issues = [];
    if (!a)
        return issues;
    if (a.version !== 1 || !Array.isArray(a.players) || !a.hands || !a.decks || !Array.isArray(a.effects) || !Array.isArray(a.monsters))
        return ['Invalid Advanced rules state.'];
    if (a.players.length < 1 || a.players.length > 6 || new Set(a.players.map(p => p.id)).size !== a.players.length)
        issues.push('Invalid Advanced players.');
    const controlled = a.players.flatMap(p => p.kingdoms);
    if (new Set(controlled).size !== controlled.length || s.kingdoms.some(k => !controlled.includes(k.id)))
        issues.push('Each kingdom must belong to exactly one player.');
    for (const p of a.players) {
        if (!Array.isArray(a.hands[p.id]) || !Array.isArray(a.owned[p.id]) || p.kingdoms.some(k => !s.kingdoms.some(x => x.id === k)))
            issues.push('Invalid player hand or kingdoms.');
    }
    const inventory = [...Object.values(a.hands).flat(), ...Object.values(a.owned).flat(), ...Object.values(a.decks).flat(), ...Object.values(a.discards).flat(), ...a.eliminatedTreasures, ...a.removedCards];
    if (inventory.some(id => !cardById(id) || cardById(id)?.kind === 'hero') || new Set(inventory).size !== inventory.length)
        issues.push('Invalid or duplicated Magic card inventory.');
    const heroInventory = [...Object.values(a.heroPools).flat(), ...a.eliminatedHeroes, ...s.units.filter(u => isHero(s, u)).map(u => u.defId)];
    const expectedHeroes = cards.filter(c => c.kind === 'hero' && s.kingdoms.some(k => k.id === c.kingdom)).map(c => c.id);
    if (heroInventory.length !== expectedHeroes.length || new Set(heroInventory).size !== heroInventory.length || expectedHeroes.some(id => !heroInventory.includes(id)))
        issues.push('Invalid or duplicated Hero inventory.');
    const monsterInventory = [...a.monsterPools.land, ...a.monsterPools.sea, ...a.defeatedMonsters, ...a.monsters.map(m => m.defId)];
    for (const m of monsters)
        if (monsterInventory.filter(id => id === m.id).length !== (m.count ?? 1))
            issues.push('Invalid Monster inventory.');
    if (monsterInventory.some(id => !monsterById(id)) || new Set(a.monsters.map(m => m.id)).size !== a.monsters.length || a.monsters.some(m => m.weakened))
        issues.push('Invalid Monster identity or damage.');
    const playerIds = new Set(a.players.map(p => p.id));
    const checkPending = (p) => { if (!p)
        return; if (p.kind === 'window') {
        if (p.players.some(id => !playerIds.has(id)))
            issues.push('Unknown Magic decision player.');
        checkPending(p.resume ?? null);
    }
    else if (p.kind === 'choice' || p.kind === 'satchel') {
        if (!playerIds.has(p.playerId))
            issues.push('Unknown Magic decision player.');
        checkPending(p.resume);
    }
    else if (p.kind === 'command' || p.kind === 'hit')
        checkPending(p.resume); };
    checkPending(a.pending);
    for (const [hero, army] of Object.entries(a.stacks)) {
        const h = s.units.find(u => u.id === hero), ar = s.units.find(u => u.id === army);
        if (!h || !ar || !isHero(s, h) || isHero(s, ar) || h.kingdom !== ar.kingdom || h.hexId !== ar.hexId)
            issues.push('Invalid Hero stack.');
    }
    if (new Set(Object.values(a.stacks)).size !== Object.values(a.stacks).length)
        issues.push('An Army cannot stack with two Heroes.');
    if (a.monsters.some(m => !monsterById(m.defId) || !s.hexes.some(h => h.id === m.hexId) || (m.kingdom !== null && !s.kingdoms.some(k => k.id === m.kingdom))))
        issues.push('Invalid Monster.');
    for (const k of s.kingdoms)
        if (a.monsters.filter(m => m.kingdom === k.id).length > 3)
            issues.push('Monster command supply exceeded.');
    return issues;
}
