import { adjacentHexes, combatForecast, isBesieged, isWelcoming, legalActions, settlementController } from './engine.js';
import { visibleMessages } from './async-play.js';
import { advancedActor, adjustedDice, cardById, effectiveDefinition, isHero, monsterById, playerFor, stackIds } from './advanced.js';
export const AI_DIFFICULTIES = [
    { id: 'easy', name: 'Easy', description: 'A forgiving commander: conservative attacks, little Magic, simple expansion.' },
    { id: 'normal', name: 'Normal', description: 'The original balanced commander: builds, recovers, advances and uses straightforward Powers.' },
    { id: 'hard', name: 'Hard', description: 'Objective-focused tactics, threat-aware movement, economy planning and target-aware Magic. No hidden-hand or dice foreknowledge.' },
];
export const aiDecisionSummary = (_state, difficulty) => AI_DIFFICULTIES.find(d => d.id === difficulty)?.description ?? AI_DIFFICULTIES[1].description;
let decisionCache = null;
const distance = (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
const ownSide = (s, kingdom) => s.kingdoms.find(k => k.id === kingdom)?.side;
const allied = (s, a, b) => a === b || !!ownSide(s, a) && ownSide(s, a) === ownSide(s, b);
const hBy = (s, id) => s.hexes.find(h => h.id === id);
const uBy = (s, id) => s.units.find(u => u.id === id);
const raw = (s, u) => s.unitDefinitions.find(d => d.id === u.defId);
const def = (s, u) => effectiveDefinition(s, u, raw(s, u));
const army = (s, u) => !isHero(s, u);
const diceValue = (light, heavy) => light / 3 + heavy * (7 / 12);
function ownPool(s, u) { const d = def(s, u); return adjustedDice(s, u.id, { light: u.weakened ? d.weakenedLight ?? d.light : d.light, heavy: u.weakened ? d.weakenedHeavy ?? d.heavy : d.heavy }, false); }
function material(s, u) { const d = def(s, u), p = ownPool(s, u); return isHero(s, u) ? 2.7 + d.heavy * 1.5 + (d.abilities.includes('mage') ? 0.5 : 0) : d.cost * 0.6 + diceValue(p.light, p.heavy) * 3 + (u.weakened ? 0 : 1.2); }
function seasonsLeft(s) { return Math.max(0, (s.scenario.endYear - s.year) * 3 + s.scenario.endSeason - s.season); }
function objectiveWeight(s, h) { return s.scenario.objective.hexIds.includes(h.id) ? 14 + 18 / (seasonsLeft(s) + 1) : 0; }
function settlementValue(s, h, k) {
    if (!h.settlement || s.razed.includes(h.id))
        return 0;
    const shashka = k === 'orcs' || k === 'goblins', owner = settlementController(s, h);
    let value = 4 + Number(h.settlement.city) * 3 + objectiveWeight(s, h) + (shashka ? 0 : Math.min(6, seasonsLeft(s) * 1.2));
    const original = s.hexes.filter(t => t.settlement?.city && t.settlement.loyalty === owner && s.advanced?.khazud !== t.id);
    if (owner && !allied(s, owner, k) && h.settlement.city && original.length) {
        const remaining = original.filter(t => !s.razed.includes(t.id) && isWelcoming(s, t, owner));
        if (remaining.length === 1 && remaining[0].id === h.id)
            value += 22;
    }
    return value;
}
function targetGoals(s, k) {
    const cached = decisionCache?.state === s ? decisionCache.goals.get(k) : undefined;
    if (cached)
        return cached;
    const objective = s.scenario.objective;
    const invader = ownSide(s, k) === 'invader';
    const out = [];
    if (objective.type === 'control')
        for (const id of objective.hexIds) {
            const h = hBy(s, id);
            if (!h || s.razed.includes(id))
                continue;
            const owner = settlementController(s, h);
            const achieved = !!owner && (objective.kingdom ? owner === objective.kingdom : ownSide(s, owner) === 'invader');
            if (invader && !achieved || !invader && achieved)
                out.push({ hex: h, weight: objectiveWeight(s, h) });
            else if ((!invader && !achieved) || (invader && achieved)) {
                const enemies = s.units.filter(u => army(s, u) && !allied(s, k, u.kingdom));
                const threat = Math.min(...enemies.map(u => distance(h, hBy(s, u.hexId))), 99);
                if (threat <= 5)
                    out.push({ hex: h, weight: objectiveWeight(s, h) * (6 - threat) / 6 });
            }
        }
    if (objective.type === 'survival' && invader) {
        const survivor = objective.kingdom ?? k;
        for (const h of s.hexes.filter(h => h.settlement?.city && h.settlement.loyalty === survivor && !s.razed.includes(h.id)))
            out.push({ hex: h, weight: 24 });
    }
    for (const h of s.hexes)
        if (h.settlement && !s.razed.includes(h.id) && !isWelcoming(s, h, k))
            out.push({ hex: h, weight: settlementValue(s, h, k) * 0.6 });
    if (!out.length)
        for (const u of s.units.filter(u => army(s, u) && !allied(s, k, u.kingdom)))
            out.push({ hex: hBy(s, u.hexId), weight: 5 });
    if (decisionCache?.state === s)
        decisionCache.goals.set(k, out);
    return out;
}
function potential(s, h, k) {
    const key = k + ':' + h.id, cache = decisionCache?.state === s ? decisionCache.potential : undefined, cached = cache?.get(key);
    if (cached !== undefined)
        return cached;
    const goals = targetGoals(s, k), value = goals.length ? Math.max(...goals.map(g => g.weight / (distance(h, g.hex) + 1))) : 0;
    cache?.set(key, value);
    return value;
}
function exposedValue(s, u, at) {
    // A public-state one-turn threat estimate, with no enemy hand inspection.
    const key = u.id + ':' + at.id, cache = decisionCache?.state === s ? decisionCache.exposure : undefined, cached = cache?.get(key);
    if (cached !== undefined)
        return cached;
    let risk = 0;
    const clone = { ...s, units: s.units.map(v => stackIds(s, u.id).includes(v.id) ? { ...v, hexId: at.id } : v) };
    for (const enemy of s.units.filter(v => army(s, v) && !allied(s, u.kingdom, v.kingdom) && distance(hBy(s, v.hexId), at) === 1)) {
        const f = combatForecast(clone, enemy.id, at.id);
        risk = Math.max(risk, Math.max(0, f.attackerExpected - f.defenderExpected) * 2 + Number(u.weakened) * f.attackerExpected);
    }
    cache?.set(key, risk);
    return risk;
}
function tacticalFollowup(s, u, to, pathCost) {
    const budget = s.activeUnitId ? (s.advanced?.movement[u.id] ?? s.remainingMP) : def(s, u).movement;
    if (pathCost > budget || isHero(s, u))
        return 0;
    const group = stackIds(s, u.id), clone = { ...s, units: s.units.map(v => group.includes(v.id) ? { ...v, hexId: to.id } : v) };
    let best = 0;
    for (const h of adjacentHexes(s, to.id)) {
        if (h.terrain === 'sea' || h.terrain === 'lair' || h.prohibited)
            continue;
        const enemy = s.units.find(v => v.hexId === h.id && army(s, v) && !allied(s, u.kingdom, v.kingdom));
        if (!enemy && (!h.settlement || s.razed.includes(h.id) || isWelcoming(s, h, u.kingdom)))
            continue;
        const f = combatForecast(clone, u.id, h.id), margin = f.attackerExpected - f.defenderExpected;
        const value = enemy ? material(s, enemy) * 0.7 : 0;
        best = Math.max(best, (value + settlementValue(s, h, u.kingdom)) * Math.max(0, Math.min(1, (margin + 1) / 3)));
    }
    return best * 0.34;
}
const poolCache = new Map();
function successDistribution(light, heavy, penalty) {
    const key = light + ':' + heavy + ':' + penalty, cached = poolCache.get(key);
    if (cached)
        return cached;
    let distribution = [1];
    const lp = Math.max(0, 7 - (5 + penalty)) / 6, hp = Math.max(0, 9 - (5 + penalty)) / 8, critical = Math.max(0, 9 - (7 + penalty)) / 8 / 3;
    for (const [count, die] of [[light, [1 - lp, lp]], [heavy, [1 - hp, hp - critical, critical]]]) {
        for (let n = 0; n < count; n++) {
            const next = Array(distribution.length + die.length - 1).fill(0);
            for (let i = 0; i < distribution.length; i++)
                for (let j = 0; j < die.length; j++)
                    next[i + j] += distribution[i] * die[j];
            distribution = next;
        }
    }
    if (poolCache.size > 2000)
        poolCache.clear();
    poolCache.set(key, distribution);
    return distribution;
}
function battleProbabilities(s, attacker, target, f) {
    const a = successDistribution(f.attackerLight, f.attackerHeavy, f.fortificationPenalty), d = successDistribution(f.defenderLight, f.defenderHeavy, 0), ad = def(s, attacker), dd = target ? def(s, target) : undefined;
    const aCapacity = attacker.weakened || ad.characteristics.includes('fragile') ? 1 : 2, dCapacity = target ? (target.weakened || dd?.characteristics.includes('fragile') ? 1 : 2) : 1;
    let win = 0, kill = 0, lose = 0, ownLoss = 0, enemyDamage = 0;
    for (let i = 0; i < a.length; i++)
        for (let j = 0; j < d.length; j++) {
            const chance = a[i] * d[j];
            let difference = i - j;
            if (!difference && i > 0) {
                if (ad.abilities.includes('ranged') && !dd?.abilities.includes('ranged'))
                    difference = 1;
                else if (dd?.abilities.includes('ranged') && !ad.abilities.includes('ranged'))
                    difference = -1;
            }
            if (difference > 0) {
                win += chance;
                if (difference >= dCapacity)
                    kill += chance;
                enemyDamage += chance * (target ? difference >= dCapacity ? material(s, target) : 2.5 : 0);
            }
            else if (difference < 0) {
                if (-difference >= aCapacity)
                    lose += chance;
                ownLoss += chance * (-difference >= aCapacity ? material(s, attacker) : 2.5);
            }
        }
    return { win, kill, lose, ownLoss, enemyDamage };
}
function cardReserve(id) {
    const c = cardById(id);
    if (!c)
        return 1;
    const e = c.effect;
    return 1.5 + (e.strike ? diceValue(e.strike.light ?? 0, e.strike.heavy ?? 0) * 2 : 0) + Number(!!e.cancelCardTypes || !!e.cancelCard) * 2 + Number(!!e.recoverArmy || !!e.negateHits) * 1.5 + (Math.max(0, e.light ?? 0) + Math.max(0, e.heavy ?? 0) * 1.5) * 0.5 + Number(!!e.gainTreasures) * 2 + Number(id === 'treasure-02') * 5;
}
function publicTargetKingdom(s, id) {
    const u = uBy(s, id);
    if (u)
        return u.kingdom;
    const m = s.advanced?.monsters.find(m => m.id === id);
    if (m)
        return m.kingdom ?? undefined;
    const h = id ? hBy(s, id) : undefined;
    if (h)
        return settlementController(s, h) ?? undefined;
    return s.advanced?.players.find(p => p.id === id)?.kingdoms[0];
}
function cardScore(s, a, actor) {
    const c = cardById(a.cardId);
    if (!c)
        return -80;
    const e = { ...c.effect, ...c.effect.choices?.[Number(a.choice ?? 0)] }, target = a.targetId ?? a.casterId, unit = uBy(s, target), caster = uBy(s, a.casterId), owner = publicTargetKingdom(s, target), friendly = !!owner && allied(s, actor, owner), sign = friendly ? 1 : -1;
    const b = s.advanced?.battle, p = s.advanced?.pending, inBattle = !!b, buffTime = inBattle || !!s.activeUnitId;
    let value = 0;
    if (e.light || e.heavy || e.convertLightToHeavy || e.multiplyLight || e.multiplyCombatRating) {
        const pool = unit ? ownPool(s, unit) : { light: 1, heavy: 0 };
        const added = diceValue(e.light ?? 0, e.heavy ?? 0) + Math.min(pool.light, e.convertLightToHeavy ?? 0) * 0.25 + (Math.max(0, (e.multiplyLight ?? 1) - 1) * pool.light / 3) + (Math.max(0, (e.multiplyCombatRating ?? 1) - 1) * diceValue(pool.light, pool.heavy));
        value += buffTime ? sign * added * 7 : -5;
    }
    if (e.movement || e.armyMovement) {
        const to = unit ? hBy(s, unit.hexId) : undefined;
        value += to && friendly && s.activeUnitId && !inBattle && targetGoals(s, actor).some(g => distance(to, g.hex) > 0) ? (e.movement ?? e.armyMovement) * 1.8 : 0;
    }
    if (e.abilities) {
        for (const ability of e.abilities) {
            value += buffTime && friendly ? { stealth: 3, ranged: 2, flying: 1.5, regenerate: unit?.weakened ? 4 : 0 }[ability] ?? 0 : 0;
        }
    }
    if (e.opponentSuccessThreshold)
        value += friendly && inBattle ? 4 : 0;
    if (e.recoverArmy)
        value += unit?.weakened && friendly ? material(s, unit) * 0.65 + 4 : -5;
    if (e.recoverAll)
        value += s.units.filter(u => u.kingdom === (c.kingdom ?? actor) && u.weakened).reduce((n, u) => n + material(s, u) * 0.6 + 2, 0);
    if (e.readyStack)
        value += unit && friendly && stackIds(s, unit.id).some(id => uBy(s, id)?.activated) ? 4 + potential(s, hBy(s, unit.hexId), actor) * 0.4 : -5;
    if (e.drawSpells)
        value += e.drawSpells * 2;
    if (e.drawBlessings)
        value += e.drawBlessings * 1.8;
    if (e.drawSpellsTo) {
        const count = s.advanced.hands[a.playerId].filter(id => id !== a.cardId && cardById(id)?.kind === 'spell').length;
        value += Math.max(0, e.drawSpellsTo - count) * 2;
    }
    if (e.gold)
        value += e.gold * (s.kingdoms.find(k => k.id === (c.kingdom ?? caster?.kingdom ?? actor)).gold < 4 ? 1.8 : 0.9);
    if (e.gainGoldEquals)
        value += (Object.values(s.controls).filter(k => k === 'orcs').length + 2) * 1.2;
    if (e.gainTreasures)
        value += e.gainTreasures * 3.5;
    if (e.gainHeroes)
        value += s.units.filter(u => u.kingdom === (c.kingdom ?? actor) && isHero(s, u)).length < 2 ? 5 : 2;
    if (e.suppressRevolts || e.suppressRevoltsPerGold) {
        const revolt = s.kingdoms.find(k => k.id === (c.kingdom ?? actor))?.revolt ?? 0, n = e.suppressRevolts ?? Number(a.choice) * e.suppressRevoltsPerGold;
        value += Math.min(revolt, n) * (revolt >= 12 ? 5 : 1.6) - (e.suppressRevoltsPerGold ? Number(a.choice) * 0.9 : 0);
    }
    if (e.chooseRollD6Count) {
        const k = s.kingdoms.find(k => k.id === 'empire'), n = Number(a.choice);
        value += n * 3.5 * (k.gold < 8 ? 1.3 : 0.65) - n * ((k.revolt ?? 0) >= 10 ? 5 : 2);
    }
    if (e.chooseHeavyDice) {
        const revolt = s.kingdoms.find(k => k.id === 'empire')?.revolt ?? 0;
        value += friendly && inBattle ? Number(a.choice) * (4 - (revolt >= 14 ? 6 : 1.2)) : 0;
    }
    if (e.strike) {
        const pool = e.strike, success = Math.min(0.98, 1 - Math.pow(2 / 3, pool.light ?? 0) * Math.pow(1 / 2, pool.heavy ?? 0));
        value += !friendly && unit ? success * (unit.weakened || isHero(s, unit) ? material(s, unit) + 4 : material(s, unit) * 0.4 + 3) : !friendly && target ? success * 4 : -9;
        if (a.choice === 'boost')
            value += !friendly ? 1 : 0;
    }
    if (e.inflictHits)
        value += unit && !friendly ? (unit.weakened ? material(s, unit) + 4 : 4) : -8;
    if (e.negateHits || e.negateHitsPerSuccess) {
        const hit = p?.kind === 'window' && p.window === 'hits' ? Number(p.event?.hits ?? p.event?.count ?? 1) : 0;
        value += friendly && hit ? 5 + Number(unit?.weakened) * 4 : -4;
    }
    if (e.cancelCardTypes || e.cancelCard) {
        const incoming = p?.kind === 'window' ? p.play : undefined;
        if (incoming && incoming.playerId !== a.playerId) {
            const other = cardById(incoming.cardId);
            const threatened = uBy(s, incoming.targetId);
            value += 2 + cardReserve(incoming.cardId) * 1.8 + Number(!!incoming.tomeId) * 2 + Number(!!other?.effect.strike && !!threatened && allied(s, actor, threatened.kingdom)) * 4;
        }
        else
            value -= 8;
    }
    if (e.cancelCombat || e.cancelAttackOrStrike || e.cancelStrike) {
        if (b) {
            const attacker = uBy(s, b.attacker);
            let margin = 0;
            if (attacker) {
                const f = combatForecast(s, attacker.id, b.targetHex);
                margin = allied(s, actor, b.attackerKingdom) ? f.defenderExpected - f.attackerExpected : f.attackerExpected - f.defenderExpected;
            }
            value += Math.max(-6, margin * 4) + Number(p?.kind === 'window' && p.window === 'hits') * 4;
        }
    }
    if (e.turnSuccessIntoFailure)
        value += !friendly ? 5 : -8;
    if (e.rerollAllFailures || e.everySuccessBecomesCritical || e.oneCriticalConfirmationLightDice || e.criticalConfirmationUsesHeavy)
        value += friendly && inBattle ? 3.5 : -5;
    if (e.targetDiscardsSpells || e.discardCount)
        value += !friendly ? 1.2 : -5;
    if (e.finishStack && e.type === 'earth-to-mud')
        value += !friendly && unit ? 3 + objectiveWeight(s, hBy(s, unit.hexId)) * 0.1 : -6;
    if (e.eliminateTargetHero)
        value += unit && !friendly ? material(s, unit) + 1 : -8;
    if (e.placeWanderingMonster) {
        const at = hBy(s, target ?? '');
        value += at ? Math.max(...s.units.filter(u => !allied(s, actor, u.kingdom)).map(u => 6 / (distance(at, hBy(s, u.hexId)) + 1)), 0) : 0;
    }
    if (e.placeMagicallyFortifiedLoyalCity)
        value += 6;
    if (e.allowBuildAndRecoveryInOrAdjacentToBesiegedOathbornSettlements)
        value += s.hexes.filter(h => h.settlement?.loyalty === 'oathborn' && isBesieged(s, h.id)).length * 4;
    if (e.providedDieIgnoresAllFortification && b && uBy(s, b.attacker))
        value += combatForecast(s, b.attacker, b.targetHex).fortificationPenalty * 1.5;
    if (e.razeOccupiedSettlement && caster) {
        const at = hBy(s, caster.hexId);
        value -= isWelcoming(s, at, actor) ? settlementValue(s, at, actor) : 0;
    }
    if (a.targetHex && unit && friendly) {
        const from = hBy(s, unit.hexId), to = hBy(s, a.targetHex);
        value += Math.max(-5, (potential(s, to, actor) - potential(s, from, actor)) * 1.4) + exposedValue(s, unit, from) - exposedValue(s, unit, to);
    }
    if (e.eliminateCaster || e.eliminateSourceHero) {
        value -= caster ? material(s, caster) : 4;
    }
    if (e.eliminateCasterAndStackedReaversAfterCombat) {
        value -= caster ? stackIds(s, caster.id).reduce((n, id) => n + material(s, uBy(s, id)), 0) : 8;
    }
    if (e.armyTakesHitsAfterCombat) {
        const member = unit && stackIds(s, unit.id).map(id => uBy(s, id)).find(u => army(s, u));
        value -= member?.weakened ? material(s, member) * 0.9 : 2.5;
    }
    if (e.lockSource)
        value -= 0.25;
    if (a.costCardId)
        value -= a.costCardId.split(',').reduce((n, id) => n + cardReserve(id) * 0.8, 0);
    if (e.discardRandomSpells)
        value -= e.discardRandomSpells * 2;
    if (a.type === 'play-card' && a.tomeId) {
        const t = cardById(a.tomeId);
        value += (t.effect.drawSpells ?? 0) * 1.8 + (t.effect.drawBlessings ?? 0) * 1.6 + (t.effect.light ?? 0) * (inBattle ? 2 : 0) + (t.effect.discardCount ?? 0) * 1.2 - cardReserve(t.id) * 0.2;
    }
    // Save actual cards when the projected gain does not justify consuming them.
    return value - (a.type === 'hero-power' ? 0.2 : 1.5);
}
function hardScore(s, a, actor) {
    const k = s.kingdoms.find(k => k.id === actor);
    switch (a.type) {
        case 'collect-income': return 9;
        case 'end-turn': return 0;
        case 'magic-pass':
        case 'finish-study': return 0;
        case 'finish-winter': return 20;
        case 'winter-ruling': return 0;
        case 'table-ruling': return -100;
        case 'request-cantrip': return -90;
        case 'play-card':
        case 'hero-power': return cardScore(s, a, actor);
        case 'store-satchel': return 9;
        case 'accept-hit': return 1;
        case 'allocate-hit': {
            const u = uBy(s, a.unitId);
            if (isHero(s, u))
                return -material(s, u);
            if (u.weakened || def(s, u).characteristics.includes('fragile'))
                return -material(s, u);
            const pool = ownPool(s, u), d = def(s, u), weakened = adjustedDice(s, u.id, { light: d.weakenedLight ?? d.light, heavy: d.weakenedHeavy ?? d.heavy }, false);
            return -(1.2 + 3 * (diceValue(pool.light, pool.heavy) - diceValue(weakened.light, weakened.heavy)));
        }
        case 'study': {
            const hand = s.advanced.hands[a.playerId].filter(id => id !== a.discardId), spells = hand.filter(id => cardById(id)?.kind === 'spell').length;
            const drawCount = a.discipline === 'spells' ? Math.max(0, 3 - spells) : a.discipline === 'blessings' ? s.advanced.players.find(p => p.id === a.playerId).kingdoms.filter(k => !s.kingdoms.find(x => x.id === k)?.collapsed && !hand.some(id => cardById(id)?.kind === 'blessing' && cardById(id)?.kingdom === k)).length : 0;
            let n = drawCount * (a.discipline === 'spells' ? 2.5 : 2.2);
            if (a.discardId)
                n -= cardReserve(a.discardId) * 0.5;
            if (!drawCount && a.discipline !== 'treasures')
                return -1;
            if (a.treasureId)
                n = cardReserve(a.treasureId) * 1.6 + (a.secondTreasureId ? cardReserve(a.secondTreasureId) * 1.5 : 0);
            if (a.payKingdomId)
                n -= 1;
            return n;
        }
        case 'sell-treasure': {
            const p = s.advanced.pending;
            return p?.kind === 'winter' ? 9 - cardReserve(a.cardId) + (a.cardId === 'treasure-02' ? -12 : 0) : p?.kind === 'satchel' ? -5 : k.gold < 2 ? 2 - cardReserve(a.cardId) : -20;
        }
        case 'remove-curse': return k.gold > 5 ? 3 : -5;
        case 'command-monster': return s.kingdoms.find(k => k.id === a.kingdomId)?.collapsed ? -90 : 8 - s.advanced.monsters.filter(m => m.kingdom === a.kingdomId).length;
        case 'slink-away': {
            const m = s.advanced.monsters.find(m => m.id === a.monsterId);
            const d = monsterById(m.defId);
            return s.advanced?.pending?.kind === 'command' ? -(d.light + d.heavy * 1.6) : -60;
        }
        case 'monster-pass': return -1;
        case 'monster-strike': {
            const target = uBy(s, a.targetId), m = s.advanced.monsters.find(m => m.id === a.monsterId), d = monsterById(m.defId);
            return 4 + diceValue(d.light, d.heavy) + (target ? material(s, target) * (target.weakened ? 0.7 : 0.2) : objectiveWeight(s, hBy(s, a.targetId)) * 0.2);
        }
        case 'magic-choice': {
            const p = s.advanced?.pending;
            if (p?.kind !== 'choice')
                return 2;
            if (p.flow === 'discard' || p.flow === 'book-discard')
                return -cardReserve(a.value);
            if (p.flow === 'return-card')
                return a.value === 'keep' ? 8 : 0;
            if (p.flow === 'recover') {
                const u = uBy(s, a.value);
                return u ? material(s, u) : 0;
            }
            if (p.flow === 'hero' || p.flow === 'build') {
                const h = hBy(s, a.value), u = s.units.find(u => u.hexId === a.value && !isHero(s, u));
                return h ? potential(s, h, actor) + (u ? material(s, u) * .4 : 0) : 0;
            }
            if (p.flow === 'forced-move') {
                const u = uBy(s, p.data?.unitId ?? '');
                if (!u)
                    return 0;
                if (a.value === 'hit')
                    return u.weakened ? -material(s, u) : -2.5;
                const id = a.value.slice(a.value.indexOf(':') + 1), h = hBy(s, id);
                return h ? potential(s, h, actor) - potential(s, hBy(s, u.hexId), actor) - exposedValue(s, u, h) * .4 + (a.value.startsWith('army:') ? -2 : 0) : 0;
            }
            if (p.flow === 'repeat-strike') {
                const u = uBy(s, p.data?.target ?? '');
                return a.value === 'skip' ? 0 : (u ? material(s, u) * .8 : 2) - cardReserve(a.value) * .7;
            }
            if (p.flow === 'blessing')
                return 4 - s.advanced.hands[p.playerId].filter(id => cardById(id)?.kind === 'blessing' && cardById(id)?.kingdom === a.value).length;
            if (p.flow === 'book-target')
                return 3;
            if (p.flow === 'copy-monster') {
                const m = s.advanced.monsters.find(m => m.id === a.value), abilities = monsterById(m?.defId ?? '')?.abilities ?? [];
                return abilities.reduce((n, x) => n + (x === 'flying' ? 3 : x === 'stealth' ? 2.5 : x === 'ranged' ? 2 : 1), 0);
            }
            return 2;
        }
        case 'settlement': {
            const h = hBy(s, s.pendingCombat.targetHex);
            const shashka = actor === 'orcs' || actor === 'goblins';
            if (a.choice === 'control')
                return settlementValue(s, h, actor) + (shashka && k.hasEverControlled && !Object.values(s.controls).includes(actor) ? 40 : 0);
            return objectiveWeight(s, h) ? -25 : shashka && k.gold < 3 ? 6 : -10;
        }
        case 'advance': {
            if (!a.accept)
                return 0;
            const p = s.pendingCombat, u = uBy(s, p.attackerId);
            if (!u)
                return -5;
            const at = hBy(s, p.targetHex);
            return 3 + potential(s, at, actor) - potential(s, hBy(s, u.hexId), actor) - exposedValue(s, u, at) * 0.6;
        }
        case 'resolve-combat': {
            const p = s.pendingCombat, f = combatForecast(s, p.attackerId, p.targetHex);
            return a.ambush === 'defender' ? 8 : a.ambush === 'attacker' ? 4 + Math.max(0, f.defenderExpected - f.attackerExpected) * 2 : 0;
        }
        case 'regenerate':
        case 'recover': {
            const u = uBy(s, a.unitId);
            if (!allied(s, actor, u.kingdom))
                return -80;
            const d = def(s, u), urgent = objectiveWeight(s, hBy(s, u.hexId)) > 0;
            return 4 + material(s, u) * 0.5 + (urgent ? 2 : 0) - d.recoveryCost * 0.8;
        }
        case 'suppress': {
            const revolt = k.revolt ?? 0;
            return revolt >= 16 ? 35 : revolt >= 10 ? 12 : revolt > 2 ? 3 : -2;
        }
        case 'mine': return k.gold < 8 ? 8 : 4;
        case 'coven': {
            const h = hBy(s, a.hexId), used = s.covens.length + Object.values(s.controls).filter(k => k === 'night').length;
            if (used >= (k.controlLimit ?? 5) - 1)
                return -2;
            const nearest = Math.min(...s.units.filter(u => u.kingdom === 'night').map(u => distance(h, hBy(s, u.hexId))), 99);
            return 10 + objectiveWeight(s, h) * 0.3 + Number(['forest', 'mountain', 'swamp'].includes(h.terrain)) * 2 - nearest * 0.4 - Number(s.units.some(u => u.hexId === h.id)) * 3;
        }
        case 'lay-waste': {
            const controlled = Object.values(s.controls).filter(v => v === actor).length;
            // Unpaid upkeep collapses immediately. Razing may be the only way to
            // reach an activation and capture a replacement before its end.
            if (k.gold < controlled)
                return 24 - objectiveWeight(s, hBy(s, a.hexId)) * 0.1;
            if (controlled <= 1 && k.hasEverControlled)
                return -70;
            return objectiveWeight(s, hBy(s, a.hexId)) ? -70 : k.gold < controlled + 2 ? 16 : -15;
        }
        case 'remove-control': return -70;
        case 'remove-coven': {
            const h = hBy(s, a.hexId), p = s.pendingCombat;
            return p?.stage === 'settlement' ? 2 - objectiveWeight(s, h) * 0.1 : -50;
        }
        case 'disband-siege': return -40;
        case 'transfer-gold': {
            const ally = s.kingdoms.find(k => k.id === a.toKingdom);
            return k.gold > 8 && ally.gold < 2 && !s.activeUnitId ? 1 : -20;
        }
        case 'recolonize': return 3 + objectiveWeight(s, hBy(s, a.hexId)) * 0.3;
        case 'build': {
            const d = s.unitDefinitions.find(d => d.id === a.defId), at = hBy(s, a.hexId), count = s.units.filter(u => u.kingdom === actor && army(s, u)).length, reserve = actor === 'orcs' || actor === 'goblins' ? Object.values(s.controls).filter(v => v === actor).length : actor === 'empire' ? Math.max(1, (k.revolt ?? 0)) : 1;
            if (k.gold - d.cost < reserve && count >= 2)
                return -15;
            let value = 3 + diceValue(d.light, d.heavy) * 2.8 + (d.movement ?? 0) * 0.3 - d.cost * 0.55 + potential(s, at, actor) * 0.2 - count * 0.55;
            if (isWelcoming(s, at, actor))
                value += 1;
            if (d.characteristics.includes('fragile'))
                value -= 1;
            if (d.characteristics.includes('feral') || d.characteristics.includes('huge'))
                value -= s.scenario.objective.type === 'control' ? 1.5 : 0;
            if (d.abilities.includes('siege') || d.characteristics.includes('siege-engine')) {
                const forts = s.hexes.filter(h => h.settlement?.fortified && !isWelcoming(s, h, actor));
                value += forts.some(h => distance(at, h) <= 3) ? 3 : -3;
            }
            return value;
        }
        case 'recruit-hero': {
            const count = s.units.filter(u => u.kingdom === actor && isHero(s, u)).length;
            const armies = s.units.filter(u => u.kingdom === actor && army(s, u)).length;
            return count < Math.min(2, armies) ? 4 : count < armies && k.gold > 7 ? 1 : -10;
        }
        case 'join-stack': {
            const u = uBy(s, a.unitId), v = uBy(s, a.armyId);
            return u.activated !== v.activated ? -80 : u.activated ? -80 : 5;
        }
        case 'drop-hero':
        case 'drop-army': {
            const hero = uBy(s, a.unitId), member = uBy(s, s.advanced.stacks[hero.id]);
            if (!member)
                return -80;
            if (a.type === 'drop-hero')
                return hero.activated && !member.activated && (!s.activeUnitId || s.remainingMP > 0) ? 7 : s.activeUnitId ? -20 : -35;
            return !hero.activated && member.activated ? 7 : -20;
        }
        case 'attack':
        case 'attack-monster': {
            if (a.type === 'attack' && s.scenario.objective.kingdom && s.scenario.objective.kingdom !== actor && ownSide(s, actor) === 'invader' && s.scenario.objective.hexIds.includes(a.targetHex))
                return -60;
            const f = combatForecast(s, a.unitId, a.targetHex), u = uBy(s, a.unitId), target = uBy(s, f.defenderUnitId), h = hBy(s, a.targetHex), monster = a.type === 'attack-monster';
            const margin = f.attackerExpected - f.defenderExpected;
            if (objectiveWeight(s, h) && def(s, u).characteristics.some(c => c === 'feral' || c === 'huge'))
                return -60;
            if (monster) {
                const success = Math.min(0.9, 1 - Math.pow(2 / 3, f.attackerLight) * Math.pow(1 / 2, f.attackerHeavy));
                return success * 6 - Math.max(0, f.defenderExpected - f.attackerExpected) * (u.weakened ? 4 : 2) + 0.5;
            }
            const probabilities = battleProbabilities(s, u, target, f), objective = settlementValue(s, h, actor), capture = target ? probabilities.kill : probabilities.win;
            const urgency = seasonsLeft(s) === 0 && objectiveWeight(s, h) > 0 ? 1.5 : 1;
            const value = probabilities.enemyDamage * 0.8 + capture * objective * 0.85 * urgency - probabilities.ownLoss * 1.05;
            if (probabilities.lose > 0.6 && !objectiveWeight(s, h))
                return -12;
            return value + probabilities.win * 1.5 - 0.3;
        }
        case 'explore-lair': {
            const u = uBy(s, a.unitId);
            return u.weakened ? -6 : 5 + Math.min(2, diceValue(ownPool(s, u).light, ownPool(s, u).heavy)) - Number(def(s, u).characteristics.includes('feral')) * 6;
        }
        case 'move':
        case 'ship': {
            const u = uBy(s, a.unitId), from = hBy(s, u.hexId), to = hBy(s, a.toHex), progress = potential(s, to, actor) - potential(s, from, actor), cost = a.path?.length ?? distance(from, to);
            let value = progress * 2.2 + tacticalFollowup(s, u, to, cost) + exposedValue(s, u, from) * 0.5 - exposedValue(s, u, to) * 0.8 - 0.2;
            if (objectiveWeight(s, from) && isWelcoming(s, from, actor) && s.units.some(v => !allied(s, actor, v.kingdom) && distance(hBy(s, v.hexId), from) <= 3))
                value -= objectiveWeight(s, from) * 0.35;
            if (to.mine && actor === 'oathborn' && /miner/i.test(def(s, u).name))
                value += k.gold < 8 ? 5 : 2;
            if (a.type === 'ship' && actor !== 'fjordland')
                value -= 1.5;
            if (isHero(s, u) && !s.advanced?.stacks[u.id])
                value -= exposedValue(s, u, to) * 2;
            return value;
        }
        case 'activate': return -10;
        case 'pass': return -0.5;
    }
}
/** Coordination is a small tie-breaker after the scenario/risk evaluation. */
function coordinationBonus(s, action, actor, ping) {
    if (!ping)
        return 0;
    if (ping.template === 'need-gold' && action.type === 'transfer-gold' && action.toKingdom === ping.author)
        return s.kingdoms.find(k => k.id === actor).gold > 6 ? 2 : 0;
    const target = ping.hexId ? hBy(s, ping.hexId) : undefined;
    if (!target)
        return 0;
    if (action.type === 'attack' || action.type === 'attack-monster')
        return action.targetHex === target.id && (ping.template === 'attack' || ping.template === 'support') ? 2 : 0;
    if (action.type === 'move' || action.type === 'ship') {
        const from = hBy(s, uBy(s, action.unitId).hexId), to = hBy(s, action.toHex);
        return Math.max(-1, Math.min(2, (distance(from, target) - distance(to, target)) * 0.55));
    }
    if ((action.type === 'build' || action.type === 'recruit-hero') && ping.template === 'defend')
        return distance(hBy(s, action.hexId), target) <= 1 ? 1.5 : 0;
    return 0;
}
function easyAction(s, actions, fallback) {
    const p = s.advanced?.pending;
    if (p?.kind === 'window')
        return actions.find(a => a.type === 'magic-pass') ?? actions[0];
    if (p?.kind === 'study')
        return actions.find(a => a.type === 'study' && a.discipline === 'spells' && !a.discardId) ?? actions.find(a => a.type === 'finish-study') ?? actions[0];
    if (p?.kind === 'winter')
        return actions.find(a => a.type === 'finish-winter') ?? actions.find(a => a.type === 'sell-treasure' && a.cardId !== 'treasure-02') ?? actions[0];
    if (p)
        return fallback && actions.some(a => JSON.stringify(a) === JSON.stringify(fallback)) ? fallback : actions[0];
    if (s.pendingCombat)
        return fallback ?? actions[0];
    const income = actions.find(a => a.type === 'collect-income');
    if (income)
        return income;
    const heal = actions.find(a => (a.type === 'recover' || a.type === 'regenerate') && allied(s, s.currentKingdom, uBy(s, a.unitId).kingdom));
    if (heal)
        return heal;
    const safe = actions.filter((a) => a.type === 'attack').find(a => { const f = combatForecast(s, a.unitId, a.targetHex); return f.attackerExpected > f.defenderExpected * 1.5; });
    if (safe)
        return safe;
    const k = s.kingdoms.find(k => k.id === s.currentKingdom);
    const moves = actions.filter((a) => a.type === 'move' || a.type === 'ship').filter(a => potential(s, hBy(s, a.toHex), k.id) > potential(s, hBy(s, uBy(s, a.unitId).hexId), k.id) + 0.5);
    if (moves.length)
        return moves[Math.abs((s.turnSerial * 13 + s.serial * 7 + s.remainingMP * 3) % moves.length)];
    if (s.activeUnitId)
        return actions.find(a => a.type === 'pass') ?? actions[0];
    const build = actions.filter((a) => a.type === 'build').sort((a, b) => s.unitDefinitions.find(d => d.id === a.defId).cost - s.unitDefinitions.find(d => d.id === b.defId).cost);
    if (s.units.filter(u => u.kingdom === k.id).length < 4 && build.length)
        return build[0];
    return actions.find(a => a.type === 'end-turn') ?? actions[0];
}
/** Chooses among engine-enumerated legal actions. The current rng value, decks and
 * opposing hand contents are deliberately absent from every scoring function.
 * Normal keeps the pre-existing policy. Hard uses expected values, not actual rolls. */
export function chooseDifficultyAction(s, difficulty, fallbackAction) {
    decisionCache = { state: s, goals: new Map(), potential: new Map(), exposure: new Map() };
    const all = legalActions(s);
    if (!all.length || all.some(a => a.type === 'winter-ruling'))
        return null; // Unverified printed-rule exceptions require a human table ruling.
    const fallback = fallbackAction ? all.find(a => a.type === fallbackAction.type && Object.entries(fallbackAction).filter(([key]) => key !== 'path').every(([key, value]) => a[key] === value)) ?? null : null;
    if (difficulty === 'normal')
        return fallback ?? all[0];
    const actor = advancedActor(s), player = playerFor(s, actor);
    const actions = all.filter(a => !('playerId' in a) || !player || a.playerId === player.id);
    if (!actions.length)
        return fallback ?? all[0];
    const ping = visibleMessages(s, actor).filter(message => message.author !== actor && allied(s, actor, message.author) && s.turnSerial - message.turn >= 0 && s.turnSerial - message.turn <= s.kingdoms.length && ['attack', 'defend', 'support', 'need-gold'].includes(message.template ?? '')).at(-1);
    const planning = { ...s, rng: 1, companion: undefined, covens: actor === 'night' || player?.kingdoms.includes('night') ? s.covens : [], advanced: s.advanced ? { ...s.advanced, hands: player ? { [player.id]: s.advanced.hands[player.id] } : {}, owned: player ? { [player.id]: s.advanced.owned[player.id] } : {}, decks: {} } : undefined };
    decisionCache = { state: planning, goals: new Map(), potential: new Map(), exposure: new Map() };
    if (difficulty === 'easy')
        return easyAction(planning, actions, fallback);
    let best = actions[0], bestScore = -Infinity;
    for (const a of actions) {
        const base = hardScore(planning, a, actor), score = base + (base > -3 ? coordinationBonus(planning, a, actor, ping) : 0);
        if (Number.isFinite(score) && score > bestScore + 0.00001) {
            best = a;
            bestScore = score;
        }
    }
    return best;
}
