import { adjustedDice, effectiveDefinition, isHero, monsterById, stackIds } from './advanced.js';
const add = (d, i, p) => { d[i] = (d[i] ?? 0) + p; };
const average = (d) => d.reduce((n, p, i) => n + p * i, 0);
function convolve(a, b) {
    const out = [];
    a.forEach((p, i) => { if (p)
        b.forEach((q, j) => { if (q)
            add(out, i + j, p * q); }); });
    return Array.from({ length: out.length }, (_, i) => out[i] ?? 0);
}
function normalized(d) {
    while (d.length > 1 && (d[d.length - 1] ?? 0) < 1e-15)
        d.pop();
    const sum = d.reduce((n, p) => n + (p ?? 0), 0);
    return Array.from({ length: d.length }, (_, i) => (d[i] ?? 0) / (sum || 1));
}
function effects(s, id) { const ids = stackIds(s, id); return s.advanced?.effects.filter(e => ids.includes(e.target)) ?? []; }
function abilities(s, id) {
    const u = s.units.find(u => u.id === id), m = s.advanced?.monsters.find(m => m.id === id);
    return u ? effectiveDefinition(s, u, s.unitDefinitions.find(d => d.id === u.defId)).abilities :
        [...(monsterById(m?.defId ?? '')?.abilities ?? []), ...effects(s, id).flatMap(e => e.abilities ?? [])];
}
function unitPool(s, id) {
    const u = s.units.find(u => u.id === id), m = s.advanced?.monsters.find(m => m.id === id);
    if (u) {
        const d = s.unitDefinitions.find(d => d.id === u.defId);
        return adjustedDice(s, id, u.weakened ? { light: d.weakenedLight ?? d.light, heavy: d.weakenedHeavy ?? d.heavy } : { light: d.light, heavy: d.heavy });
    }
    if (m) {
        const d = monsterById(m.defId);
        return adjustedDice(s, id, { light: d.light, heavy: d.heavy });
    }
    const h = s.hexes.find(h => h.id === id);
    return adjustedDice(s, id, { light: h?.settlement ? (h.settlement.city ? 3 : 1) : 0, heavy: 0 });
}
function confirmations(black, festering) {
    if (festering)
        return convolve(convolve([2 / 3, 1 / 3], [2 / 3, 1 / 3]), [2 / 3, 1 / 3]);
    if (!black)
        return [2 / 3, 1 / 3];
    // The resolution engine bounds Black Diamond at the first roll + 30 repeats.
    let d = [.5, .5];
    for (let depth = 0; depth < 30; depth++) {
        const out = [.5, .25];
        d.forEach((p, i) => add(out, i + 1, p * .25));
        d = out;
    }
    return d;
}
function diceDistribution(s, id, opponent, pool, penalty) {
    const own = effects(s, id), other = effects(s, opponent);
    const threshold = other.some(e => e.extra?.successThreshold === 6) ? 6 : 5;
    const critical = own.some(e => e.extra?.criticalThreshold === 6) ? 6 : 7;
    const black = own.some(e => e.cardId === 'treasure-20');
    const festering = own.find(e => e.cardId === 'spell-44');
    const ignore = own.reduce((n, e) => n + (e.extra?.ignoreFortHeavy ?? 0), 0);
    let normal = [1], joint = [[1], []], index = 0;
    for (const [sides, count] of [[6, pool.light], [8, pool.heavy]])
        for (let die = 0; die < count; die++, index++) {
            const modifier = sides === 8 && die >= count - ignore ? 0 : penalty;
            const special = !!festering && index === (festering.extra?.criticalIndex ?? 0);
            const confirmed = confirmations(black, special), single = [], pairs = [[], []];
            for (let face = 1; face <= sides; face++) {
                const success = Number(face - modifier >= threshold), crit = face - modifier >= critical;
                (crit ? confirmed : [1]).forEach((p, bonus) => { add(single, success + bonus, p / sides); add(pairs[success], bonus, p / sides); });
            }
            normal = convolve(normal, single);
            const next = [[], []];
            for (let flag = 0; flag < 2; flag++)
                for (let sf = 0; sf < 2; sf++) {
                    const c = convolve(joint[flag], pairs[sf]);
                    c.forEach((p, i) => add(next[flag || sf], i, p));
                }
            joint = next;
        }
    const strike = [];
    joint[0].forEach((p, i) => add(strike, i, p));
    joint[1].forEach((p, i) => add(strike, i + 1, p));
    // Szark's Axes explicitly remove the ordinary Strike's one-hit success cap.
    return { normal: normalized(normal), strike: normalized(own.some(e => e.extra?.axes) ? normal : strike) };
}
function capacity(s, u) {
    const d = s.unitDefinitions.find(d => d.id === u.defId);
    return isHero(s, u) || u.weakened || d.characteristics.includes('fragile') ? 1 : 2;
}
function members(s, id, allocation) {
    return stackIds(s, id).map(id => s.units.find(u => u.id === id)).filter((u) => !!u)
        .sort((a, b) => (Number(isHero(s, a)) - Number(isHero(s, b))) * (allocation === 'hero-first' ? -1 : 1));
}
function woundOdds(s, id, hits, allocation) {
    const group = members(s, id, allocation), monster = s.advanced?.monsters.find(m => m.id === id), h = s.hexes.find(h => h.id === id);
    const count = group.reduce((n, u) => n + capacity(s, u), 0) || (monster || h?.settlement ? 1 : 0);
    const names = group.map(u => s.unitDefinitions.find(d => d.id === u.defId).name);
    const result = { name: names.join(' + ') || monsterById(monster?.defId ?? '')?.name || 'Garrison', capacity: count, expectedWounds: hits.reduce((n, p, i) => n + p * Math.min(i, count), 0), eliminatedChance: count ? hits.reduce((n, p, i) => n + (i >= count ? p : 0), 0) : 0 };
    let prior = 0;
    for (const u of group) {
        const d = s.unitDefinitions.find(d => d.id === u.defId), hp = capacity(s, u), dead = hits.reduce((n, p, i) => n + (i >= prior + hp ? p : 0), 0);
        if (isHero(s, u))
            result.hero = { name: d.name, eliminatedChance: dead };
        else
            result.army = { name: d.name, wasWeakened: u.weakened, fragile: d.characteristics.includes('fragile'), eliminatedChance: dead, weakenedChance: hp === 2 ? (hits[prior + 1] ?? 0) : 0 };
        prior += hp;
    }
    return result;
}
function projected(s, id, hits, allocation) {
    const group = members(s, id, allocation);
    if (!group.length)
        return { state: s, alive: hits === 0 };
    const next = { ...s, units: s.units.map(u => ({ ...u })), ...(s.advanced ? { advanced: { ...s.advanced, stacks: { ...s.advanced.stacks } } } : {}) };
    for (const member of group) {
        if (!hits)
            break;
        const hp = capacity(s, member), damage = Math.min(hits, hp);
        hits -= damage;
        if (damage >= hp) {
            next.units = next.units.filter(u => u.id !== member.id);
            if (next.advanced) {
                delete next.advanced.stacks[member.id];
                for (const hero of Object.keys(next.advanced.stacks))
                    if (next.advanced.stacks[hero] === member.id)
                        delete next.advanced.stacks[hero];
            }
        }
        else
            next.units.find(u => u.id === member.id).weakened = true;
    }
    const survivor = group.find(u => next.units.some(v => v.id === u.id))?.id;
    return { state: next, alive: !!survivor, ...(survivor ? { survivor } : {}) };
}
const hitOdds = (d) => { d = normalized(d); return { distribution: d, expectedHits: average(d), hitChance: 1 - (d[0] ?? 0), twoHitChance: 1 - (d[0] ?? 0) - (d[1] ?? 0) }; };
function ignoredHit(s, id) {
    const group = members(s, id, 'army-first');
    return Number(group.some(u => u.defId === 'hero-goblins-11') && group.some(u => !isHero(s, u) && s.unitDefinitions.find(d => d.id === u.defId)?.characteristics.includes('fragile')));
}
const murga = (s, id) => stackIds(s, id).some(id => s.units.find(u => u.id === id)?.defId === 'hero-goblins-12');
export function combatOdds(s, f, mode = 'combat', allocation = 'army-first') {
    const attacker = f.attackerId, defender = f.defenderUnitId ?? f.targetHex;
    let aHits = [], dHits = [], noHitChance = 0;
    let a = diceDistribution(s, attacker, defender, { light: f.attackerLight, heavy: f.attackerHeavy }, f.fortificationPenalty);
    let d = diceDistribution(s, defender, attacker, { light: f.defenderLight, heavy: f.defenderHeavy }, 0);
    const notes = ['Uses current dice and resolved effects. Future Magic and owner decisions can change the outcome.'];
    if (mode === 'combat') {
        const successes = effects(s, attacker).reduce((n, e) => n + (e.extra?.addSuccesses ?? 0), 0), ar = abilities(s, attacker).includes('ranged'), dr = abilities(s, defender).includes('ranged'), ignoreA = ignoredHit(s, attacker), ignoreD = ignoredHit(s, defender);
        a.normal.forEach((ap, ai) => d.normal.forEach((dp, di) => {
            const av = ai + successes, p = ap * dp;
            let outgoing = Math.max(0, av - di), incoming = Math.max(0, di - av);
            if (av === di && av > 0) {
                if (ar && !dr)
                    outgoing = 1;
                if (dr && !ar)
                    incoming = 1;
            }
            if (!av && !di) {
                if (murga(s, attacker))
                    outgoing = 1;
                else if (murga(s, defender))
                    incoming = 1;
            }
            outgoing = Math.max(0, outgoing - ignoreD);
            incoming = Math.max(0, incoming - ignoreA);
            add(aHits, outgoing, p);
            add(dHits, incoming, p);
            if (!outgoing && !incoming)
                noHitChance += p;
        }));
    }
    else {
        const attackerFirst = mode === 'attacker-ambush', first = attackerFirst ? attacker : defender, second = attackerFirst ? defender : attacker;
        const firstRoll = diceDistribution(s, first, second, unitPool(s, first), 0);
        const outgoing = [], incoming = [];
        firstRoll.strike.forEach((fp, hits) => {
            add(outgoing, hits, fp);
            const after = projected(s, second, hits, allocation);
            const surviving = after.survivor ?? second;
            const reply = after.alive ? diceDistribution(after.state, surviving, first, unitPool(after.state, surviving), 0).strike : [1];
            reply.forEach((rp, back) => { add(incoming, back, fp * rp); if (!hits && !back)
                noHitChance += fp * rp; });
        });
        aHits = attackerFirst ? outgoing : incoming;
        dHits = attackerFirst ? incoming : outgoing;
        a = diceDistribution(s, attacker, defender, unitPool(s, attacker), 0);
        d = diceDistribution(s, defender, attacker, unitPool(s, defender), 0);
        notes.push('Ambush uses an opening Strike; only surviving defenders Strike back, with weakened dice if wounded. Terrain dice and fortification are ignored.');
    }
    if (members(s, attacker, allocation).length > 1 || members(s, defender, allocation).length > 1)
        notes.push(`Stack outcomes assume ${allocation === 'army-first' ? 'Army' : 'Hero'} takes hits first. The owner still chooses each actual hit.`);
    const outA = hitOdds(aHits), outD = hitOdds(dHits);
    return { mode, attacker: outA, defender: outD, attackerPool: mode === 'combat' ? { light: f.attackerLight, heavy: f.attackerHeavy } : unitPool(s, attacker), defenderPool: mode === 'combat' ? { light: f.defenderLight, heavy: f.defenderHeavy } : unitPool(s, defender), attackerWounds: woundOdds(s, attacker, outD.distribution, allocation), defenderWounds: woundOdds(s, defender, outA.distribution, allocation), attackerSuccesses: average(a.normal) + (mode === 'combat' ? effects(s, attacker).reduce((n, e) => n + (e.extra?.addSuccesses ?? 0), 0) : 0), defenderSuccesses: average(d.normal), noHitChance, notes };
}
