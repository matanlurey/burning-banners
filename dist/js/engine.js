import * as Advanced from './advanced.js';
import { validateContentPack } from './content-validation.js';
import { validateTabletop } from './tabletop.js';
import { validateCompanionShape } from './async-play.js';
import { actingKingdom, canCollapse, campaignRules, campaignVictory, campaignRevoltModifier, fixedUnit, repairCost, validatePublishedCampaignRules } from './campaign-runtime.js';
const DIRECTIONS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const BOARD_CACHE = new WeakMap();
function boardIndex(s) { let index = BOARD_CACHE.get(s); if (!index) {
    index = { hexes: new Map(s.hexes.map(h => [h.id, h])), coordinates: new Map(s.hexes.map(h => [`${h.q},${h.r}`, h])), definitions: new Map(s.unitDefinitions.map(d => [d.id, d])) };
    BOARD_CACHE.set(s, index);
} return index; }
const isShashka = (id) => id === 'goblins' || id === 'orcs';
const sameSide = (s, a, b) => a === b || (!!s.kingdoms.find(k => k.id === a) && s.kingdoms.find(k => k.id === a)?.side === s.kingdoms.find(k => k.id === b)?.side);
const hexById = (s, id) => { const h = boardIndex(s).hexes.get(id); if (!h)
    throw new Error(`Unknown hex ${id}`); return h; };
const unitById = (s, id) => { const u = s.units.find(u => u.id === id); if (!u)
    throw new Error(`Unknown Army ${id}`); return u; };
const rawDef = (s, u) => { const d = boardIndex(s).definitions.get(u.defId); if (!d)
    throw new Error(`Unknown Army definition ${u.defId}`); return d; };
const defOf = (s, u) => Advanced.effectiveDefinition(s, u, rawDef(s, u));
const kingdomOf = (s, id) => { const k = s.kingdoms.find(k => k.id === id); if (!k)
    throw new Error(`Unknown Kingdom ${id}`); return k; };
const controlCapacity = (k) => k.controlLimit ?? (isShashka(k.id) ? 12 : 10);
const ability = (d, name) => d.abilities.some(a => a.toLowerCase() === name.toLowerCase());
const characteristic = (d, name) => d.characteristics.some(a => a.toLowerCase() === name.toLowerCase());
const siege = (d) => ability(d, 'siege') || characteristic(d, 'siege') || characteristic(d, 'siege-engine') || /siege engine/i.test(d.name);
const ranger = (d) => d.kingdom === 'fjordland' && /ranger/i.test(d.name);
const wilderness = (h) => h.settlement?.wilderness ?? (h.terrain === 'forest' || h.terrain === 'mountain' || h.terrain === 'swamp' ? h.terrain : null);
const aliveSettlement = (s, h) => !!h.settlement && !s.razed.includes(h.id);
const anchoredDefender = (s, u) => campaignRules(s).some(r => (r.type === 'fixed-defender' || r.type === 'fragile-defender') && r.defId === u.defId && r.hexId === u.hexId);
export const settlementController = (s, h) => aliveSettlement(s, h) ? s.controls[h.id] ?? h.settlement?.loyalty ?? null : null;
export function isWelcoming(s, h, kingdom, underlying = false) {
    if (!h.settlement || (!underlying && !aliveSettlement(s, h)))
        return false;
    const controller = underlying ? h.settlement.loyalty : settlementController(s, h);
    if (controller && s.kingdoms.some(k => k.id === controller))
        return sameSide(s, controller, kingdom);
    const allies = controller ? s.scenario.sourceCampaign?.nonplayerAllies?.[controller] : undefined;
    if (allies)
        return allies.some(k => sameSide(s, k, kingdom));
    if (!underlying && s.controls[h.id])
        return false;
    return (h.settlement.neutralFriendlyTo ?? []).some(k => sameSide(s, k, kingdom));
}
export function adjacentHexes(s, hexId) {
    const h = hexById(s, hexId), coordinates = boardIndex(s).coordinates;
    return DIRECTIONS.map(([q, r]) => coordinates.get(`${h.q + q},${h.r + r}`)).filter((h) => !!h);
}
const adjacent = (s, a, b) => adjacentHexes(s, a).some(h => h.id === b);
const edge = (s, a, b) => {
    const ah = hexById(s, a), bh = hexById(s, b);
    return { ...(ah.terrain === 'sea' || bh.terrain === 'sea' ? { sea: true } : {}), ...bh.edges?.[a], ...ah.edges?.[b] };
};
function canCross(s, u, a, b, ship = false) {
    const e = edge(s, a, b), d = defOf(s, u);
    if (e.sea && !ship && !ability(d, 'flying'))
        return false;
    return true;
}
function canPass(s, u, h, ship = false) {
    if (h.prohibited || h.prohibitedFor?.includes(u.kingdom) || s.advanced?.monsters.some(m => m.hexId === h.id))
        return false;
    const deep = s.advanced?.effects.some(e => Advanced.stackIds(s, u.id).includes(e.target) && e.extra?.deepPaths);
    if (h.terrain === 'lair' && !deep)
        return false;
    if (deep && h.terrain !== 'sea')
        return true;
    const d = defOf(s, u), enemy = s.units.find(v => v.hexId === h.id && !sameSide(s, v.kingdom, u.kingdom) && !Advanced.isHero(s, v));
    const hostile = aliveSettlement(s, h) && !isWelcoming(s, h, u.kingdom);
    if (enemy || hostile) {
        if (ship || !ability(d, 'flying'))
            return false;
        if (enemy && (ability(defOf(s, enemy), 'flying') || ability(defOf(s, enemy), 'ranged')))
            return false;
    }
    if (h.terrain === 'sea' && !ship && !ability(d, 'flying'))
        return false;
    return true;
}
function canEnd(s, u, h) {
    if (h.id !== u.hexId && campaignRules(s).some(r => (r.type === 'fixed-defender' || r.type === 'fragile-defender') && r.defId === u.defId && r.hexId === u.hexId))
        return false;
    if (!canPass(s, u, h) || h.terrain === 'sea' || h.terrain === 'lair')
        return false;
    const group = Advanced.stackIds(s, u.id), movingArmy = group.some(id => !Advanced.isHero(s, unitById(s, id))), others = s.units.filter(v => !group.includes(v.id) && v.hexId === h.id && !(s.advanced && movingArmy && Advanced.isHero(s, v) && !sameSide(s, v.kingdom, u.kingdom)));
    if (s.advanced) {
        if (others.some(v => v.kingdom !== u.kingdom))
            return false;
        const moving = group.map(id => unitById(s, id));
        if (others.some(v => moving.some(m => Advanced.isHero(s, m) === Advanced.isHero(s, v) || !!s.scenario.sourceCampaign && rawDef(s, m).kingdom !== rawDef(s, v).kingdom && !s.advanced?.enslaved?.[m.id] && !s.advanced?.enslaved?.[v.id])))
            return false;
        if (others.length + moving.length > 2)
            return false;
    }
    else {
        const other = others[0];
        if (other && (other.kingdom !== u.kingdom || other.activated))
            return false;
    }
    if (h.entry && h.entry !== u.kingdom)
        return false;
    if (aliveSettlement(s, h) && !isWelcoming(s, h, u.kingdom))
        return false;
    if (group.some(id => characteristic(defOf(s, unitById(s, id)), 'huge')) && isWelcoming(s, h, u.kingdom))
        return false;
    const joining = [...group.map(id => unitById(s, id)), ...others];
    if (isWelcoming(s, h, u.kingdom) && joining.some(v => v.activated) && joining.some(v => characteristic(defOf(s, v), 'huge')))
        return false;
    return true;
}
function movementCost(s, u, from, to) {
    const d = defOf(s, u), e = edge(s, from, to.id);
    if (ability(d, 'flying') || e.road || s.advanced?.effects.some(e => Advanced.stackIds(s, u.id).includes(e.target) && e.extra?.deepPaths))
        return 1;
    let cost = aliveSettlement(s, to) ? 1 : (wilderness(to) ? 2 : 1);
    if (!aliveSettlement(s, to) && to.terrain === 'mountain' && !siege(d) && (u.kingdom === 'oathborn' || u.kingdom === 'goblins'))
        cost = 1;
    if (!aliveSettlement(s, to) && to.terrain === 'forest' && ranger(d))
        cost = 1;
    return cost + (e.river ?? 0);
}
export function isBesieged(s, hexId) {
    const h = hexById(s, hexId);
    if (!aliveSettlement(s, h))
        return false;
    const owner = settlementController(s, h);
    if (!owner)
        return false;
    const besiegers = s.units.filter(u => !Advanced.isHero(s, u) && !isWelcoming(s, h, u.kingdom) && adjacent(s, u.hexId, h.id) && canCross(s, u, u.hexId, h.id));
    const horne = s.units.some(u => u.hexId === h.id && u.defId === 'hero-oathborn-14');
    return besiegers.length >= (horne ? 3 : h.settlement?.port ? 2 : 1);
}
function unitMayAct(s, u) {
    if (fixedUnit(s, u.defId, u.hexId) || s.campaignRuntime?.withdrawn.includes(u.kingdom))
        return false;
    if (s.tabletop?.enslaved?.some(x => x.armyId === u.id))
        return false;
    return s.phase === 'activation' && !s.pendingCombat && u.kingdom === s.currentKingdom && !u.activated && !Advanced.stackIds(s, u.id).some(id => s.units.find(v => v.id === id)?.activated) && !s.advanced?.pending && (!s.activeUnitId || Advanced.stackIds(s, s.activeUnitId).includes(u.id));
}
function stackMustLeave(s, u) { return Advanced.stackIds(s, u.id).some(id => { const member = unitById(s, id); return characteristic(defOf(s, member), 'huge') && isWelcoming(s, hexById(s, member.hexId), member.kingdom); }); }
export function moveOptions(s, unitId) {
    const u = unitById(s, unitId);
    if (!unitMayAct(s, u))
        return [];
    if (campaignRules(s).some(r => r.type === 'fragile-defender' && r.defId === u.defId && r.hexId === u.hexId))
        return [];
    const d = defOf(s, u), group = Advanced.stackIds(s, u.id), active = !!s.activeUnitId && group.includes(s.activeUnitId);
    const budgets = group.map(id => active && s.advanced ? s.advanced.movement[id] ?? defOf(s, unitById(s, id)).movement : active ? s.remainingMP : defOf(s, unitById(s, id)).movement);
    const records = new Map();
    const visited = new Map();
    const queue = [{ id: u.hexId, costs: group.map(() => 0), roadOnly: active ? s.allRoad : true, path: [] }];
    while (queue.length) {
        queue.sort((a, b) => Math.max(...a.costs) - Math.max(...b.costs));
        const node = queue.shift();
        const key = `${node.id}:${node.roadOnly}`, previous = visited.get(key) ?? [];
        if (previous.some(costs => costs.every((cost, i) => cost <= node.costs[i])))
            continue;
        visited.set(key, [...previous.filter(costs => !node.costs.every((cost, i) => cost <= costs[i])), node.costs]);
        for (const to of adjacentHexes(s, node.id)) {
            if (!canCross(s, u, node.id, to.id) || !canPass(s, u, to))
                continue;
            const roadOnly = node.roadOnly && !!edge(s, node.id, to.id).road && !ability(d, 'flying');
            const costs = node.costs.map((cost, i) => cost + movementCost(s, unitById(s, group[i]), node.id, to));
            const inBudget = costs.every((cost, i) => cost <= budgets[i] + (roadOnly ? 1 : 0));
            const minimum = !(active && s.moved) && !node.path.length;
            if (!inBudget && !minimum)
                continue;
            const path = [...node.path, to.id], cost = Math.max(...costs), record = { hexId: to.id, cost, path, roadOnly };
            const deep = s.advanced?.effects.some(e => group.includes(e.target) && e.extra?.deepPaths);
            if (to.id !== u.hexId && canEnd(s, u, to) && (!deep || to.terrain === 'mountain') && (!records.has(to.id) || records.get(to.id).cost > cost))
                records.set(to.id, record);
            if (inBudget)
                queue.push({ id: to.id, costs, roadOnly, path });
        }
    }
    return [...records.values()].sort((a, b) => a.cost - b.cost || a.hexId.localeCompare(b.hexId));
}
export function movementPreview(s, unitId, option, ship = false) {
    const u = unitById(s, unitId), group = Advanced.stackIds(s, unitId), active = !!s.activeUnitId && group.includes(s.activeUnitId);
    const spent = group.map(() => 0);
    let from = u.hexId;
    const steps = option.path.map(id => { const h = hexById(s, id), costs = group.map((member, i) => { const cost = ship ? 1 : movementCost(s, unitById(s, member), from, h); spent[i] += cost; return cost; }); from = id; return { hexId: id, name: h.settlement?.name ?? id, terrain: h.terrain, costs }; });
    const units = group.map((id, i) => { const v = unitById(s, id), d = defOf(s, v), budget = active ? (s.advanced ? s.advanced.movement[id] ?? d.movement : s.remainingMP) : d.movement, bonus = !ship && option.roadOnly ? 1 : 0; return { unitId: id, name: rawDef(s, v).name, spent: spent[i], remaining: Math.max(0, budget + bonus - spent[i]), roadBonus: bonus, minimumMove: !ship && spent[i] > budget + bonus }; });
    return { steps, units, ship };
}
export function shipOptions(s, unitId) {
    const u = unitById(s, unitId);
    if (!unitMayAct(s, u) || s.advanced?.shipsThisTurn?.some(id => Advanced.stackIds(s, u.id).includes(id)) || (s.activeUnitId !== null && Advanced.stackIds(s, u.id).includes(s.activeUnitId) && s.shipUsed))
        return [];
    if (campaignRules(s).some(r => r.type === 'fragile-defender' && r.defId === u.defId && r.hexId === u.hexId))
        return [];
    const d = defOf(s, u), wave = s.advanced?.effects.some(e => Advanced.stackIds(s, u.id).includes(e.target) && e.extra?.waveStrider);
    if (!wave && Advanced.stackIds(s, u.id).some(id => { const d = defOf(s, unitById(s, id)); return characteristic(d, 'feral') || characteristic(d, 'huge'); }))
        return [];
    const start = hexById(s, u.hexId), port = aliveSettlement(s, start) && start.settlement?.port && isWelcoming(s, start, u.kingdom);
    const budget = (port || start.entry === u.kingdom ? 6 : 3) + (rawDef(s, u).kingdom === 'fjordland' ? 2 : 0);
    const records = new Map(), seen = new Set();
    const queue = [{ id: u.hexId, path: [] }];
    while (queue.length) {
        const node = queue.shift();
        if (seen.has(node.id))
            continue;
        seen.add(node.id);
        if (node.path.length >= budget)
            continue;
        for (const to of adjacentHexes(s, node.id)) {
            const e = edge(s, node.id, to.id), from = hexById(s, node.id);
            const channel = to.terrain === 'sea' || to.terrain === 'coastal' || to.coastal || to.majorRiver || to.terrain === 'major-river';
            // §8.1.2: crossing a River or Major River side ends this Ship Move,
            // even when the landing hex is Coastal or a Major River. A Sea side
            // is sailed across rather than used as a river-crossing landing.
            const riverCross = !!e.river && !e.sea && !e.waterway;
            // §8.1.5: source-traced waterways follow the river's course while
            // preserving the land terrain in the hex. Legacy Major River terrain
            // remains supported for existing saved games and calibrated packs.
            const riverCourse = !!e.waterway || (from.terrain === 'major-river' && to.terrain === 'major-river');
            if (!e.sea && !e.coastal && !riverCross && !riverCourse)
                continue;
            if (!channel && !riverCross)
                continue;
            if (!canPass(s, u, to, true))
                continue;
            const path = [...node.path, to.id];
            if (to.id !== u.hexId && to.terrain !== 'sea' && canEnd(s, u, to) && (!records.has(to.id) || records.get(to.id).cost > path.length))
                records.set(to.id, { hexId: to.id, cost: path.length, path, roadOnly: false });
            if (channel && !riverCross)
                queue.push({ id: to.id, path });
        }
    }
    return [...records.values()];
}
function diceFor(s, u) {
    if (!u)
        return { light: 0, heavy: 0 };
    const d = defOf(s, u);
    return Advanced.adjustedDice(s, u.id, u.weakened ? { light: d.weakenedLight ?? d.light, heavy: d.weakenedHeavy ?? d.heavy } : { light: d.light, heavy: d.heavy });
}
const diceExpected = (light, heavy, penalty) => light * (Math.max(0, 7 - (5 + penalty)) / 6) + heavy * (Math.max(0, 9 - (5 + penalty)) / 8 + Math.max(0, 9 - (7 + penalty)) / 24);
function canAttack(s, u, target, granted = false) {
    if (Advanced.isHero(s, u))
        return false;
    if (stackMustLeave(s, u))
        return false;
    if (!granted && !unitMayAct(s, u) || !adjacent(s, u.hexId, target.id) || target.prohibited || target.prohibitedFor?.includes(u.kingdom) || target.terrain === 'sea' || target.terrain === 'lair' || !canCross(s, u, u.hexId, target.id))
        return false;
    const enemy = s.units.find(v => v.hexId === target.id && !sameSide(s, v.kingdom, u.kingdom) && !Advanced.isHero(s, v));
    // A hostile Settlement requires advancing after victory; an anchored source
    // defender cannot choose an attack that would force it to leave its station.
    if (anchoredDefender(s, u) && aliveSettlement(s, target) && !isWelcoming(s, target, u.kingdom))
        return false;
    if (siege(defOf(s, u)) && !aliveSettlement(s, target))
        return false;
    return !!enemy || (aliveSettlement(s, target) && !isWelcoming(s, target, u.kingdom));
}
export function combatForecast(s, attackerId, targetHex) {
    const a = unitById(s, attackerId), ad = defOf(s, a), h = hexById(s, targetHex), d = s.units.find(u => u.hexId === targetHex && !Advanced.isHero(s, u)) ?? s.units.find(u => u.hexId === targetHex), dd = d ? defOf(s, d) : undefined;
    const ac = diceFor(s, a), dc = diceFor(s, d), explanation = [];
    const monster = s.advanced?.monsters.find(m => m.hexId === targetHex);
    if (monster) {
        const md = Advanced.monsterById(monster.defId), mp = Advanced.adjustedDice(s, monster.id, { light: md.light, heavy: md.heavy }), as = ability(ad, 'stealth'), ds = md.abilities.includes('stealth');
        return { attackerId, targetHex, attackerLight: ac.light, attackerHeavy: ac.heavy, defenderLight: mp.light, defenderHeavy: mp.heavy, fortificationPenalty: 0, attackerExpected: diceExpected(ac.light, ac.heavy, 0), defenderExpected: diceExpected(mp.light, mp.heavy, 0), attackerCanAmbush: as && !ds, defenderCanAmbush: ds && !as, defenderUnitId: monster.id, explanation: ['Monster combat ignores terrain. One hit defeats the Monster.'] };
    }
    if (aliveSettlement(s, h)) {
        const g = h.settlement?.city ? 3 : (!d || Advanced.isHero(s, d) ? 1 : 0);
        const gp = s.advanced ? Advanced.adjustedDice(s, h.id, { light: g, heavy: 0 }, false) : { light: g, heavy: 0 };
        dc.light += gp.light;
        dc.heavy += gp.heavy;
        if (g)
            explanation.push(`Garrison +${g} light dice`);
    }
    if (wilderness(h)) {
        dc.light++;
        explanation.push(`${wilderness(h)} defense +1 light die`);
    }
    const river = edge(s, a.hexId, h.id).river ?? 0;
    if (river && !ability(ad, 'flying')) {
        dc.light += river;
        explanation.push(`River defense +${river} light dice`);
    }
    if (ranger(ad) && wilderness(h) === 'forest') {
        ac.light++;
        explanation.push('Attacking Rangers: forest woodcraft +1 light die');
    }
    if (dd && ranger(dd) && wilderness(h) === 'forest') {
        dc.light++;
        explanation.push('Defending Rangers: forest woodcraft +1 light die');
    }
    if (a.kingdom === 'night' && s.covens.includes(h.id)) {
        ac.light++;
        explanation.push('Hidden Coven agents +1 light die');
    }
    let penalty = aliveSettlement(s, h) ? h.settlement?.fortified ?? 0 : 0;
    const engines = s.units.filter(u => sameSide(s, a.kingdom, u.kingdom) && siege(defOf(s, u)) && adjacent(s, u.hexId, h.id)).length;
    penalty = Math.max(0, penalty - engines);
    if (penalty)
        explanation.push(`Fortification −${penalty} to each attacking die`);
    if (s.advanced) {
        const magical = s.advanced.effects.filter(e => e.target === targetHex || e.target === d?.id).reduce((n, e) => n + (e.fortification ?? 0), 0);
        penalty += magical;
        if (magical)
            explanation.push(`Magical fortification −${magical} to each attacking die`);
    }
    const as = ability(ad, 'stealth'), ds = !!dd && ability(dd, 'stealth');
    return { attackerId, targetHex, attackerLight: ac.light, attackerHeavy: ac.heavy, defenderLight: dc.light, defenderHeavy: dc.heavy, fortificationPenalty: penalty, attackerExpected: diceExpected(ac.light, ac.heavy, penalty), defenderExpected: diceExpected(dc.light, dc.heavy, 0), attackerCanAmbush: as && !ds && (!aliveSettlement(s, h) || !h.settlement?.fortified), defenderCanAmbush: ds && !as, defenderUnitId: d?.id, explanation };
}
function recoverable(s, u) {
    if (!u.weakened || characteristic(defOf(s, u), 'fragile'))
        return false;
    const h = hexById(s, u.hexId);
    if (h.entry === u.kingdom)
        return true;
    if (s.hexes.some(t => aliveSettlement(s, t) && isWelcoming(s, t, u.kingdom) && (!isBesieged(s, t.id) || s.advanced?.effects.some(e => e.extra?.secretWays && u.kingdom === 'oathborn')) && (t.id === h.id || adjacent(s, t.id, h.id))))
        return true;
    return u.kingdom === 'night' && characteristic(defOf(s, u), 'feral') && !!wilderness(h) && adjacentHexes(s, h.id).some(t => (aliveSettlement(s, t) && settlementController(s, t) === 'night') || s.covens.includes(t.id));
}
function buildLocations(s, d) {
    if (s.campaignRuntime?.withdrawn.includes(d.kingdom) || campaignRules(s).some(r => r.type === 'allied-contingent' && r.kingdom === d.kingdom && r.noRebuild && !s.kingdoms.some(k => k.id === r.kingdom)) || campaignRules(s).some(r => r.type === 'fragile-defender' && r.defId === d.id) || s.scenario.sourceCampaign?.chronicle?.bitterDefender?.defId === d.id)
        return [];
    const friendly = s.hexes.filter(h => aliveSettlement(s, h) && settlementController(s, h) === d.kingdom && (!isBesieged(s, h.id) || s.advanced?.effects.some(e => e.extra?.secretWays && d.kingdom === 'oathborn') || d.id === 'hero-oathborn-14'));
    return s.hexes.filter(h => {
        if (h.prohibited || h.prohibitedFor?.includes(d.kingdom) || h.terrain === 'lair' || !Advanced.advancedCanBuild(s, d, h) || (h.terrain === 'sea' && h.entry !== d.kingdom))
            return false;
        if (d.kind === 'hero' && s.phase !== 'opening' && isWelcoming(s, h, d.kingdom) && buildWouldFinish(s, d, h) && s.units.some(u => u.hexId === h.id && characteristic(defOf(s, u), 'huge')))
            return false;
        if (h.entry && h.entry !== d.kingdom)
            return false;
        if (!sameSide(s, d.kingdom, 'night') && s.hexes.some(t => t.settlement?.name === 'Spire of the Moon' && adjacent(s, h.id, t.id)))
            return false;
        if (h.entry === d.kingdom)
            return true;
        if (!canPass(s, { id: 'build', defId: d.id, kingdom: d.kingdom, hexId: h.id, weakened: false, activated: false }, h))
            return false;
        if (friendly.some(t => (t.id === h.id && !s.newlyFriendly.includes(h.id)) || adjacent(s, t.id, h.id)))
            return true;
        return d.kingdom === 'night' && characteristic(d, 'feral') && !!wilderness(h) && adjacentHexes(s, h.id).some(t => (aliveSettlement(s, t) && settlementController(s, t) === 'night') || s.covens.includes(t.id));
    });
}
function buildReady(s, d, h) { return h.entry === d.kingdom || (aliveSettlement(s, h) && settlementController(s, h) === d.kingdom) || campaignRules(s).some(r => r.type === 'fragile-defender' && r.readyAdjacentBuilds && r.kingdom === d.kingdom && adjacent(s, h.id, r.hexId) && s.units.some(u => u.defId === r.defId && u.hexId === r.hexId)); }
function buildWouldFinish(s, d, h) { return !buildReady(s, d, h) || Advanced.builtFinishedByCoven(s, h.id) || !!s.units.find(u => u.hexId === h.id && Advanced.isHero(s, u))?.activated; }
function openingDefinition(s) { return s.scenario.sourceCampaign.opening.find(k => k.kingdom === s.currentKingdom); }
function openingPlacement(s, d, explicit) {
    const k = s.currentKingdom, o = openingDefinition(s), acting = { ...d, kingdom: k };
    const normal = buildLocations(s, acting), allowed = new Set(normal.map(h => h.id));
    if (d.kind !== 'hero' && d.kingdom === 'oathborn' && /miner/i.test(d.name))
        for (const id of o.minerHexIds ?? [])
            allowed.add(id);
    if (explicit)
        for (const id of explicit)
            allowed.add(id);
    return s.hexes.filter(h => allowed.has(h.id) && (!explicit || explicit.includes(h.id)) && (!o.deploymentHexIds || o.deploymentHexIds.includes(h.id)) && !h.prohibited && !h.prohibitedFor?.includes(k) && h.terrain !== 'lair' && (h.terrain !== 'sea' || h.entry === k) && (!h.entry || h.entry === k)).filter(h => {
        const occupants = s.units.filter(u => u.hexId === h.id);
        if (h.terrain !== 'sea' && !canPass(s, { id: 'opening', defId: d.id, kingdom: k, hexId: h.id, weakened: false, activated: false }, h))
            return false;
        if (!occupants.length)
            return true;
        return !!s.advanced && occupants.length === 1 && occupants[0].kingdom === k && (d.kind === 'hero') !== Advanced.isHero(s, occupants[0]) && (!s.scenario.sourceCampaign || d.kingdom === rawDef(s, occupants[0]).kingdom);
    });
}
function prepareOpeningKingdom(s) {
    const o = s.opening, rules = s.scenario.sourceCampaign, id = o.order[o.index];
    s.currentKingdom = id;
    s.turnIndex = s.scenario.turnOrder.indexOf(id);
    const saved = o.deployments[id];
    if (saved) {
        Object.assign(o, structuredClone(saved));
        return;
    }
    const spec = rules.opening.find(v => v.kingdom === id);
    o.remainingFreeUnits = (spec.freeUnits ?? []).flatMap(v => Array.from({ length: v.count }, () => ({ defId: v.defId, ...(v.weakened === undefined ? {} : { weakened: v.weakened }), ...(v.hexIds ? { hexIds: [...v.hexIds] } : {}), ...(v.optional === undefined ? {} : { optional: v.optional }) })));
    o.remainingHeroes = [];
    o.heroLocations = {};
    o.remainingCovens = spec.covens ?? 0;
    o.spentByHex = {};
    if (s.advanced) {
        const excluded = new Set(spec.unavailableHeroIds ?? []), selected = new Set(Object.entries(o.deployments).filter(([k]) => k !== id).flatMap(([, v]) => v.remainingHeroes));
        const add = (hero, hexIds) => { if (!hero || selected.has(hero))
            return; selected.add(hero); o.remainingHeroes.push(hero); if (hexIds)
            o.heroLocations[hero] = [...hexIds]; };
        for (const hero of spec.heroIds ?? [])
            add(hero);
        for (const hero of (s.advanced.heroPools[id] ?? []).filter(h => !excluded.has(h) && !selected.has(h)).slice(0, spec.heroes ?? 0))
            add(hero);
        for (const extra of spec.extraHeroes ?? [])
            for (const hero of (s.advanced.heroPools[extra.kingdom] ?? []).filter(h => !selected.has(h)).slice(0, extra.count))
                add(hero, extra.hexIds);
    }
    log(s, `${kingdomOf(s, id).name} opening deployment: ${kingdomOf(s, id).gold} gold; place listed free units${s.advanced ? ', Heroes and Covens' : ''}, then finish setup.`);
}
function initializeOpening(s) {
    const rules = s.scenario.sourceCampaign;
    s.campaignRuntime = { withdrawn: [] };
    s.phase = 'opening';
    Object.assign(s.controls, rules.nonplayerControls ?? {});
    s.opening = { order: rules.deploymentOrder.flat(), index: 0, remainingHeroes: [], remainingCovens: 0, remainingFreeUnits: [], heroLocations: {}, preControlsIndex: 0, preControlsPlaced: 0, preChoicesIndex: 0, choices: {}, spentByHex: {}, exchanged: [], groupIndex: 0, done: [], deployments: {} };
    for (const spec of rules.opening)
        kingdomOf(s, spec.kingdom).gold = spec.gold;
    for (const rule of campaignRules(s))
        if (rule.type === 'fixed-defender' || rule.type === 'fragile-defender') {
            const d = s.unitDefinitions.find(d => d.id === rule.defId);
            if (!d)
                throw new Error(`Unknown campaign defender ${rule.defId}`);
            const kingdom = rule.type === 'fragile-defender' ? rule.kingdom : rule.actingKingdom ?? actingKingdom(s, d.kingdom);
            const owner = s.kingdoms.some(k => k.id === kingdom) ? kingdom : s.kingdoms.find(k => k.side === 'resistance').id;
            if (!s.units.some(u => u.defId === d.id && u.hexId === rule.hexId))
                s.units.push({ id: `unit-${s.serial++}`, defId: d.id, kingdom: owner, hexId: rule.hexId, weakened: false, activated: true });
            if (rule.type === 'fragile-defender')
                reserveOsterlich(s);
        }
    s.campaignRuntime.abandonedLairs = [...rules.abandonedLairs ?? []];
    if (rules.chronicle?.bitterDefender)
        reserveOsterlich(s);
    prepareOpeningKingdom(s);
    const first = rules.preControls?.[0];
    if (!(rules.preChoices?.length) && first) {
        s.currentKingdom = first.kingdom;
        s.turnIndex = s.scenario.turnOrder.indexOf(first.kingdom);
    }
}
function openingActions(s) {
    const o = s.opening, rules = s.scenario.sourceCampaign, choice = rules.preChoices?.[o.preChoicesIndex];
    if (choice)
        return choice.options.map(v => ({ type: 'opening-choice', choiceId: choice.id, value: v.value }));
    const pre = rules.preControls?.[o.preControlsIndex];
    if (pre)
        return pre.hexIds.filter(id => !s.razed.includes(id) && s.controls[id] !== pre.kingdom && (!pre.excludeOtherControls || !s.controls[id]) && hexById(s, id).settlement).map(hexId => ({ type: 'opening-control', hexId }));
    const spec = openingDefinition(s), k = kingdomOf(s, s.currentKingdom), actions = [];
    for (const kingdom of rules.deploymentOrder[o.groupIndex])
        if (kingdom !== k.id && !o.done.includes(kingdom))
            actions.push({ type: 'opening-switch', kingdom });
    for (const free of o.remainingFreeUnits) {
        const d = s.unitDefinitions.find(d => d.id === free.defId);
        if (s.units.filter(u => u.defId === d.id).length >= d.count)
            continue;
        for (const h of openingPlacement(s, d, free.hexIds))
            if (!actions.some(a => a.type === 'opening-build' && a.defId === d.id && a.hexId === h.id))
                actions.push({ type: 'opening-build', defId: d.id, hexId: h.id });
    }
    for (const d of s.unitDefinitions)
        if (d.kind !== 'hero' && d.kingdom === k.id && !campaignRules(s).some(r => r.type === 'fragile-defender' && r.defId === d.id) && s.scenario.sourceCampaign?.chronicle?.bitterDefender?.defId !== d.id && d.cost <= k.gold && s.units.filter(u => u.defId === d.id).length < d.count) {
            for (const h of openingPlacement(s, d))
                if ((spec.spendLimits ?? []).every(limit => !limit.hexIds.includes(h.id) || limit.hexIds.reduce((n, id) => n + (o.spentByHex[id] ?? 0), 0) + d.cost <= limit.max) && !actions.some(a => a.type === 'opening-build' && a.defId === d.id && a.hexId === h.id))
                    actions.push({ type: 'opening-build', defId: d.id, hexId: h.id });
        }
    for (const defId of o.remainingHeroes) {
        const d = s.unitDefinitions.find(d => d.id === defId);
        for (const h of openingPlacement(s, d, o.heroLocations[defId]))
            actions.push({ type: 'opening-hero', defId, hexId: h.id });
    }
    if (o.remainingCovens > 0 && Object.values(s.controls).filter(id => id === 'night').length + s.covens.length < controlCapacity(k))
        for (const h of s.hexes)
            if (aliveSettlement(s, h) && !h.prohibited && !h.prohibitedFor?.includes(k.id) && !isWelcoming(s, h, k.id) && !s.covens.includes(h.id))
                actions.push({ type: 'opening-coven', hexId: h.id });
    if (s.advanced && spec.exchangeControlForCoven && !o.exchanged.includes(k.id))
        for (const [hexId, owner] of Object.entries(s.controls))
            if (owner === k.id)
                actions.push({ type: 'opening-exchange-coven', hexId });
    if (k.id === 'empire' && (k.revolt ?? 0) > 0 && k.gold > 0)
        actions.push({ type: 'suppress', amount: 1 });
    if (!o.remainingHeroes.length && !o.remainingCovens && o.remainingFreeUnits.every(v => v.optional))
        actions.push({ type: 'opening-done' });
    return actions;
}
function applyOpening(s, action) {
    const o = s.opening, rules = s.scenario.sourceCampaign, k = kingdomOf(s, s.currentKingdom);
    const save = () => { o.deployments[k.id] = structuredClone({ remainingHeroes: o.remainingHeroes, remainingCovens: o.remainingCovens, remainingFreeUnits: o.remainingFreeUnits, heroLocations: o.heroLocations, spentByHex: o.spentByHex }); };
    if (action.type === 'opening-switch') {
        save();
        o.index = o.order.indexOf(action.kingdom);
        prepareOpeningKingdom(s);
        return;
    }
    if (action.type === 'opening-choice') {
        const choice = rules.preChoices[o.preChoicesIndex], option = choice.options.find(v => v.value === action.value);
        for (const [hex, owner] of Object.entries(option.controls ?? {})) {
            s.controls[hex] = owner;
            s.razed = s.razed.filter(id => id !== hex);
        }
        for (const id of option.razed ?? []) {
            delete s.controls[id];
            if (!s.razed.includes(id))
                s.razed.push(id);
        }
        for (const [id, kingdom] of Object.entries(option.entries ?? {}))
            hexById(s, id).entry = kingdom;
        o.choices[choice.id] = option.value;
        o.preChoicesIndex++;
        log(s, `Source ruling: ${choice.label} ${option.label}`);
        if (!rules.preChoices?.[o.preChoicesIndex] && rules.preControls?.[0]) {
            s.currentKingdom = rules.preControls[0].kingdom;
            s.turnIndex = s.scenario.turnOrder.indexOf(s.currentKingdom);
        }
        return;
    }
    if (action.type === 'opening-control') {
        const pre = rules.preControls[o.preControlsIndex], previous = settlementController(s, hexById(s, action.hexId));
        if (previous && previous !== pre.kingdom)
            loseIncome(s, previous);
        s.controls[action.hexId] = pre.kingdom;
        k.hasEverControlled = true;
        o.preControlsPlaced++;
        log(s, `${k.name} places its opening Control at ${hexById(s, action.hexId).settlement.name}.`);
        if (o.preControlsPlaced === pre.count) {
            o.preControlsPlaced = 0;
            o.preControlsIndex++;
            const next = rules.preControls?.[o.preControlsIndex];
            if (next) {
                s.currentKingdom = next.kingdom;
                s.turnIndex = s.scenario.turnOrder.indexOf(next.kingdom);
            }
            else
                prepareOpeningKingdom(s);
        }
        return;
    }
    if (action.type === 'opening-coven') {
        s.covens.push(action.hexId);
        o.remainingCovens--;
        log(s, `Opening Coven placed at ${hexById(s, action.hexId).settlement.name}; no roll required.`);
        return;
    }
    if (action.type === 'opening-exchange-coven') {
        delete s.controls[action.hexId];
        s.razed.push(action.hexId);
        loseIncome(s, k.id);
        o.remainingCovens++;
        o.exchanged.push(k.id);
        log(s, `${k.name} replaces an opening Control with Razed to receive a Coven.`);
        return;
    }
    if (action.type === 'opening-done') {
        if (openingDefinition(s).discardUnspent) {
            log(s, `${k.name} discards ${k.gold} unspent opening gold.`);
            k.gold = 0;
        }
        if (s.campaignRuntime?.resumeOpeningTurn) {
            const resume = s.campaignRuntime.resumeOpeningTurn;
            delete s.campaignRuntime.resumeOpeningTurn;
            delete s.opening;
            s.turnIndex = s.scenario.turnOrder.indexOf(resume.kingdom);
            beginTurn(s);
            return;
        }
        save();
        o.done.push(k.id);
        let next = rules.deploymentOrder[o.groupIndex].find(id => !o.done.includes(id));
        if (!next) {
            o.groupIndex++;
            next = rules.deploymentOrder[o.groupIndex]?.[0];
        }
        if (next) {
            o.index = o.order.indexOf(next);
            prepareOpeningKingdom(s);
        }
        else {
            delete s.opening;
            const resume = s.campaignRuntime?.resumeOpeningTurn;
            if (resume) {
                s.turnIndex = s.scenario.turnOrder.indexOf(resume.kingdom);
                delete s.campaignRuntime.resumeOpeningTurn;
            }
            else
                s.turnIndex = 0;
            beginTurn(s);
        }
        return;
    }
    const d = s.unitDefinitions.find(d => d.id === action.defId), freeIndex = action.type === 'opening-build' ? o.remainingFreeUnits.findIndex(v => v.defId === d.id) : -1, free = freeIndex >= 0 ? o.remainingFreeUnits[freeIndex] : undefined;
    const built = { id: `unit-${s.serial++}`, defId: d.id, kingdom: k.id, hexId: action.hexId, weakened: free?.weakened ?? false, activated: false };
    s.units.push(built);
    if (action.type === 'opening-hero') {
        o.remainingHeroes = o.remainingHeroes.filter(id => id !== d.id);
        if (s.advanced)
            s.advanced.heroPools[d.kingdom] = (s.advanced.heroPools[d.kingdom] ?? []).filter(id => id !== d.id);
    }
    else if (free)
        o.remainingFreeUnits.splice(freeIndex, 1);
    else {
        k.gold -= d.cost;
        o.spentByHex[action.hexId] = (o.spentByHex[action.hexId] ?? 0) + d.cost;
    }
    if (s.advanced) {
        const other = s.units.find(u => u.id !== built.id && u.hexId === built.hexId && Advanced.isHero(s, u) !== Advanced.isHero(s, built));
        if (other)
            s.advanced.stacks[Advanced.isHero(s, built) ? built.id : other.id] = Advanced.isHero(s, built) ? other.id : built.id;
    }
    log(s, `${k.name} deploys ${d.name}${built.weakened ? ' weakened' : ''}${action.type === 'opening-hero' || free ? ' at no gold cost' : ` (${d.cost} gold)`}.`);
}
function reserveOsterlich(s) {
    if (!s.advanced)
        return;
    const m = Advanced.monsterById('monster-osterlich');
    if (!m)
        return;
    s.campaignRuntime ??= { withdrawn: [] };
    s.campaignRuntime.reservedMonsters ??= [];
    if (s.campaignRuntime.reservedMonsters.includes(m.id))
        return;
    const pool = s.advanced.monsterPools[m.pool], index = pool.indexOf(m.id);
    if (index >= 0) {
        pool.splice(index, 1);
        s.campaignRuntime.reservedMonsters.push(m.id);
    }
}
function historicalYear(s) { return (s.scenario.sourceCampaign?.chronicle?.historicalStartYear ?? s.scenario.startYear) + (s.year - s.scenario.startYear); }
function setCampaignActor(s, side) {
    const id = s.scenario.turnOrder.find(id => s.kingdoms.find(k => k.id === id)?.side === side && !s.kingdoms.find(k => k.id === id)?.collapsed);
    if (id) {
        s.currentKingdom = id;
        s.turnIndex = s.scenario.turnOrder.indexOf(id);
    }
}
function restoreEventTurn(s) { const r = s.campaignRuntime?.resumeEventTurn; if (r) {
    s.currentKingdom = r.kingdom;
    s.turnIndex = s.scenario.turnOrder.indexOf(r.kingdom);
    delete s.campaignRuntime.resumeEventTurn;
} if (s.campaignRuntime?.beginTurnAfterEvent) {
    delete s.campaignRuntime.beginTurnAfterEvent;
    beginTurn(s);
} }
function campaignActions(s) {
    const r = s.campaignRuntime;
    if (!r)
        return null;
    if (r.pendingBitterDisplacement) {
        const u = s.units.find(u => u.id === r.pendingBitterDisplacement);
        if (u)
            return adjacentHexes(s, u.hexId).filter(h => canEnd(s, u, h)).map(h => ({ type: 'campaign-displace', toHex: h.id }));
        delete r.pendingBitterDisplacement;
    }
    if (r.pendingAbandon?.length) {
        const eligible = s.hexes.filter(h => h.terrain === 'lair' && !r.abandonedLairs?.includes(h.id) && !s.advanced?.monsters.some(m => m.hexId === h.id && m.kingdom !== null));
        if (eligible.length)
            return eligible.map(h => ({ type: 'campaign-abandon', hexId: h.id }));
        r.pendingAbandon = [];
        restoreEventTurn(s);
        log(s, 'All eligible lairs are already abandoned.');
    }
    return null;
}
function placeBitterDefender(s) {
    const rule = s.scenario.sourceCampaign?.chronicle?.bitterDefender;
    if (!rule || s.campaignRuntime?.bitterPlaced)
        return;
    const occupant = s.units.find(u => u.hexId === rule.hexId && !Advanced.isHero(s, u)) ?? s.units.find(u => u.hexId === rule.hexId);
    if (occupant) {
        s.campaignRuntime.pendingBitterDisplacement = occupant.id;
        s.currentKingdom = occupant.kingdom;
        s.turnIndex = s.scenario.turnOrder.indexOf(occupant.kingdom);
        log(s, 'Make room at the Spire for the Bitter End defender. Choose an adjacent legal hex.');
        return;
    }
    const d = s.unitDefinitions.find(d => d.id === rule.defId);
    if (!d)
        throw new Error('Missing Bitter End defender definition.');
    s.units.push({ id: `unit-${s.serial++}`, defId: d.id, kingdom: rule.kingdom, hexId: rule.hexId, weakened: false, activated: false });
    s.scenario.sourceCampaign.specialRules.push({ type: 'fragile-defender', defId: d.id, hexId: rule.hexId, kingdom: rule.kingdom, readyAdjacentBuilds: true });
    s.campaignRuntime.bitterPlaced = true;
    log(s, 'Osterlich guards the Spire for the Bitter End.');
}
function chronicleWinter(s) {
    const c = s.scenario.sourceCampaign?.chronicle;
    if (!c)
        return;
    const winter = historicalYear(s) - 1, r = s.campaignRuntime;
    if (c.bitterDefender && winter >= c.bitterDefender.winterYear && !r.bitterPlaced) {
        r.resumeEventTurn ??= { kingdom: s.currentKingdom, turnIndex: s.turnIndex };
        placeBitterDefender(s);
    }
    if (s.advanced && c.abandonFromYear !== undefined && winter >= c.abandonFromYear && r.winterAbandonYear !== winter) {
        r.winterAbandonYear = winter;
        r.abandonedLairs ??= [];
        r.pendingAbandon = ['invader', 'resistance'];
        r.resumeEventTurn ??= { kingdom: s.currentKingdom, turnIndex: s.turnIndex };
        if (!r.pendingBitterDisplacement)
            setCampaignActor(s, 'invader');
        log(s, `Winter ${winter}: each side chooses one lair to abandon.`);
    }
}
function chronicleBeginTurn(s) {
    const c = s.scenario.sourceCampaign?.chronicle;
    if (!c)
        return false;
    const year = historicalYear(s), r = s.campaignRuntime;
    if (c.treatyYear !== undefined && year >= c.treatyYear)
        for (const h of s.hexes)
            if (h.settlement?.loyalty === 'mara-mitai')
                h.settlement.neutralFriendlyTo = s.kingdoms.filter(k => k.side === 'resistance').map(k => k.id);
    const returning = c.returnFjord, firstLive = s.scenario.turnOrder.findIndex(id => !s.kingdoms.find(k => k.id === id)?.collapsed);
    if (!returning || r.fjordReturned || s.turnIndex !== firstLive)
        return false;
    const fj = s.kingdoms.find(k => k.id === returning.kingdom.id), due = r.fjordCollapsedAt ? { year: r.fjordCollapsedAt.year + returning.afterCollapseYears, season: r.fjordCollapsedAt.season } : { year: returning.year, season: 0 };
    if (fj && !fj.collapsed || year * 3 + s.season < due.year * 3 + due.season)
        return false;
    const id = returning.kingdom.id;
    r.fjordReturned = true;
    if (fj)
        Object.assign(fj, returning.kingdom, { collapsed: false, hasEverControlled: false });
    else {
        s.kingdoms.push({ ...returning.kingdom, controller: 'human', collapsed: false, hasEverControlled: false });
        s.scenario.kingdoms.push(structuredClone(returning.kingdom));
        s.scenario.sourceCampaign.opening.push(structuredClone(returning.opening));
        s.scenario.sourceCampaign.deploymentOrder.push([id]);
    }
    const kingdom = kingdomOf(s, id);
    kingdom.gold = returning.opening.gold;
    const order = returning.turnOrder.filter(k => s.kingdoms.some(v => v.id === k));
    for (const k of s.scenario.turnOrder)
        if (!order.includes(k))
            order.push(k);
    s.scenario.turnOrder = order;
    s.scenario.sourceCampaign.specialRules.push({ type: 'no-collapse', kingdoms: [id] });
    const previous = s.scenario.sourceCampaign.opening.find(o => o.kingdom === id);
    Object.assign(previous, structuredClone(returning.opening));
    for (const d of Advanced.heroDefinitions().filter(d => d.kingdom === id))
        if (!s.unitDefinitions.some(v => v.id === d.id))
            s.unitDefinitions.push(d);
    BOARD_CACHE.delete(s);
    if (s.advanced) {
        const a = s.advanced;
        if (!a.players.some(p => p.kingdoms.includes(id))) {
            const player = { id: `player-${id}`, name: kingdom.name, kingdoms: [id] };
            a.players.push(player);
            a.hands[player.id] = [];
            a.owned[player.id] = [];
        }
        a.heroPools[id] ??= Advanced.heroDefinitions().filter(d => d.kingdom === id && !s.units.some(u => u.defId === d.id)).map(d => d.id);
        a.decks[`blessings-${id}`] ??= Advanced.cards.filter(card => card.kind === 'blessing' && card.kingdom === id && card.verified).map(card => card.id);
        Advanced.assignStudyMarkers(s, advancedContext());
    }
    r.resumeOpeningTurn = { kingdom: order[0], turnIndex: 0 };
    s.phase = 'opening';
    s.currentKingdom = id;
    s.turnIndex = order.indexOf(id);
    s.opening = { order: [id], index: 0, remainingHeroes: [], remainingCovens: 0, remainingFreeUnits: [], heroLocations: {}, preControlsIndex: s.scenario.sourceCampaign.preControls?.length ?? 0, preControlsPlaced: 0, preChoicesIndex: s.scenario.sourceCampaign.preChoices?.length ?? 0, choices: {}, spentByHex: {}, exchanged: [], groupIndex: s.scenario.sourceCampaign.deploymentOrder.findIndex(group => group.includes(id)), done: [], deployments: {} };
    // A return is an opening for one kingdom; the original groups stay in the
    // campaign definition for audit/import. Mark their other kingdoms complete.
    s.opening.done = s.kingdoms.filter(k => k.id !== id).map(k => k.id);
    prepareOpeningKingdom(s);
    log(s, `${kingdom.name} returns in ${['Spring', 'Summer', 'Autumn'][s.season]} ${year}; deploy its returning forces.`);
    return true;
}
function applyCampaign(s, a) {
    const r = s.campaignRuntime;
    if (a.type === 'campaign-abandon') {
        r.abandonedLairs ??= [];
        r.abandonedLairs.push(a.hexId);
        log(s, `${r.pendingAbandon[0]} abandons the lair at ${a.hexId}.`);
        r.pendingAbandon.shift();
        if (r.pendingAbandon.length)
            setCampaignActor(s, r.pendingAbandon[0]);
        else
            restoreEventTurn(s);
        return;
    }
    const u = unitById(s, r.pendingBitterDisplacement);
    for (const id of Advanced.stackIds(s, u.id))
        unitById(s, id).hexId = a.toHex;
    delete r.pendingBitterDisplacement;
    placeBitterDefender(s);
    if (!r.pendingBitterDisplacement) {
        if (r.pendingAbandon?.length)
            setCampaignActor(s, r.pendingAbandon[0]);
        else
            restoreEventTurn(s);
    }
}
export function legalActions(s) {
    if (s.phase === 'game-over' || s.tabletop?.review)
        return [];
    const pendingCampaign = campaignActions(s);
    if (pendingCampaign)
        return pendingCampaign;
    if (s.phase === 'opening')
        return openingActions(s);
    const extra = s.advanced ? Advanced.advancedLegalActions(s, advancedContext()) : { actions: [], exclusive: false };
    if (extra.exclusive)
        return extra.actions;
    if (s.pendingCombat) {
        const p = s.pendingCombat;
        if (p.stage === 'ambush') {
            const f = combatForecast(s, p.attackerId, p.targetHex);
            const a = [{ type: 'resolve-combat', ambush: null }];
            if (f.attackerCanAmbush)
                a.push({ type: 'resolve-combat', ambush: 'attacker' });
            if (f.defenderCanAmbush)
                a.push({ type: 'resolve-combat', ambush: 'defender' });
            return a;
        }
        if (p.stage === 'advance')
            return [{ type: 'advance', accept: true }, { type: 'advance', accept: false }];
        const k = kingdomOf(s, p.decisionKingdom), controls = Object.values(s.controls).filter(id => id === k.id).length + (k.id === 'night' ? s.covens.filter(id => id !== p.targetHex).length : 0);
        const choices = controls < controlCapacity(k) ? [{ type: 'settlement', choice: 'control' }, { type: 'settlement', choice: 'raze' }] : [{ type: 'settlement', choice: 'raze' }];
        for (const [id, owner] of Object.entries(s.controls))
            if (owner === k.id)
                choices.push({ type: 'remove-control', hexId: id });
        if (k.id === 'night' && !Advanced.covensProtected(s))
            for (const id of s.covens)
                choices.push({ type: 'remove-coven', hexId: id });
        return choices;
    }
    const k = kingdomOf(s, s.currentKingdom), actions = [...extra.actions];
    for (const u of s.units) {
        const d = defOf(s, u), owner = kingdomOf(s, u.kingdom);
        if (!fixedUnit(s, u.defId, u.hexId) && u.weakened && ability(d, 'regenerate') && d.recoveryCost <= owner.gold && !(aliveSettlement(s, hexById(s, u.hexId)) && isBesieged(s, u.hexId)))
            actions.push({ type: 'regenerate', unitId: u.id });
    }
    if (k.gold >= 2)
        for (const ally of s.kingdoms)
            if (ally.id !== k.id && !ally.collapsed && ally.side === k.side && !campaignRules(s).some(r => r.type === 'no-gold-transfer' && r.fromKingdom === k.id && r.toKingdom === ally.id))
                actions.push({ type: 'transfer-gold', toKingdom: ally.id, amount: 2 });
    if (s.phase === 'income-actions') {
        actions.push({ type: 'collect-income' });
        for (const [id, owner] of Object.entries(s.controls))
            if (owner === k.id)
                actions.push({ type: 'remove-control', hexId: id });
        if (k.id === 'night' && !s.incomeActionsUsed.includes('coven') && Object.values(s.controls).filter(id => id === 'night').length + s.covens.length < controlCapacity(k))
            for (const h of s.hexes)
                if (aliveSettlement(s, h) && !h.prohibited && !h.prohibitedFor?.includes(k.id) && !isWelcoming(s, h, k.id) && !s.covens.includes(h.id))
                    actions.push({ type: 'coven', hexId: h.id });
        if (isShashka(k.id))
            for (const h of s.hexes)
                if (s.controls[h.id] === k.id)
                    actions.push({ type: 'lay-waste', hexId: h.id });
        for (const u of s.units)
            if (u.kingdom === k.id && siege(defOf(s, u)))
                actions.push({ type: 'disband-siege', unitId: u.id });
        if (k.id === 'night' && !Advanced.covensProtected(s))
            for (const id of s.covens)
                actions.push({ type: 'remove-coven', hexId: id });
        return actions;
    }
    if (!s.activeUnitId) {
        for (const d of s.unitDefinitions)
            if (d.kind !== 'hero' && d.kingdom === k.id && d.cost <= k.gold && s.units.filter(u => u.defId === d.id).length < d.count)
                for (const h of buildLocations(s, d))
                    if (!(characteristic(d, 'huge') && isWelcoming(s, h, k.id) && buildWouldFinish(s, d, h)))
                        actions.push({ type: 'build', defId: d.id, hexId: h.id });
        for (const u of s.units)
            if (unitMayAct(s, u))
                actions.push({ type: 'activate', unitId: u.id });
    }
    for (const u of s.units) {
        const d = defOf(s, u);
        if (unitMayAct(s, u)) {
            for (const m of moveOptions(s, u.id))
                actions.push({ type: 'move', unitId: u.id, toHex: m.hexId, path: m.path });
            for (const m of shipOptions(s, u.id))
                actions.push({ type: 'ship', unitId: u.id, toHex: m.hexId, path: m.path });
            if (!stackMustLeave(s, u) && !s.units.some(v => v.id !== u.id && v.hexId === u.hexId && !Advanced.stackIds(s, u.id).includes(v.id))) {
                for (const h of adjacentHexes(s, u.hexId))
                    if (canAttack(s, u, h))
                        actions.push({ type: 'attack', unitId: u.id, targetHex: h.id });
                if (d.recoveryCost <= k.gold && recoverable(s, u))
                    actions.push({ type: 'recover', unitId: u.id });
                if (u.kingdom === 'oathborn' && /miner/i.test(d.name) && hexById(s, u.hexId).mine)
                    actions.push({ type: 'mine', unitId: u.id });
                actions.push({ type: 'pass', unitId: u.id });
            }
        }
        if (u.kingdom === k.id && s.razed.includes(u.hexId) && isWelcoming(s, hexById(s, u.hexId), u.kingdom, true) && !s.units.some(v => v.hexId === u.hexId && characteristic(defOf(s, v), 'huge')) && k.gold >= repairCost(s, k.id) && (hexById(s, u.hexId).settlement?.loyalty || Object.values(s.controls).filter(id => id === k.id).length + (k.id === 'night' ? s.covens.length : 0) < controlCapacity(k)))
            actions.push({ type: 'recolonize', hexId: u.hexId });
    }
    // An already-active valid stack may always finish, including legacy saves
    // where a newly gained finished Hero blocks further movement/actions.
    if (s.activeUnitId) {
        const u = unitById(s, s.activeUnitId);
        if (u.kingdom === k.id && !u.activated && !stackMustLeave(s, u) && !s.units.some(v => v.id !== u.id && v.hexId === u.hexId && !Advanced.stackIds(s, u.id).includes(v.id)) && !actions.some(a => a.type === 'pass' && a.unitId === u.id))
            actions.push({ type: 'pass', unitId: u.id });
    }
    for (const h of s.hexes)
        if (s.controls[h.id] === k.id)
            actions.push({ type: 'remove-control', hexId: h.id });
    if (k.id === 'night' && !Advanced.covensProtected(s))
        for (const id of s.covens)
            actions.push({ type: 'remove-coven', hexId: id });
    if (k.id === 'empire' && (k.revolt ?? 0) > 0 && k.gold > 0 && !s.advanced?.effects.some(e => e.extra?.noSuppression))
        actions.push({ type: 'suppress', amount: 1 });
    if (!s.units.some(u => u.kingdom === k.id && (s.units.some(v => v.id !== u.id && v.hexId === u.hexId && !Advanced.stackIds(s, u.id).includes(v.id)) || hexById(s, u.hexId).terrain === 'sea' || (characteristic(defOf(s, u), 'huge') && isWelcoming(s, hexById(s, u.hexId), u.kingdom)))))
        actions.push({ type: 'end-turn' });
    return actions;
}
function log(s, message) { s.log.push(message); if (s.log.length > 250)
    s.log.shift(); }
function randomDie(s, sides) {
    // xorshift32 has 2^32−1 nonzero outputs. Reject the incomplete final bucket.
    const limit = Math.floor(0xffffffff / sides) * sides;
    for (;;) {
        let x = s.rng | 0;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        s.rng = x >>> 0;
        const value = s.rng - 1;
        if (value < limit)
            return 1 + (value % sides);
    }
}
function rollPool(s, light, heavy, penalty = 0) {
    const rolls = [];
    let successes = 0, confirmed = 0;
    for (const [sides, count] of [[6, light], [8, heavy]])
        for (let i = 0; i < count; i++) {
            const raw = randomDie(s, sides), modified = raw - penalty, success = modified >= 5, critical = modified >= 7;
            const die = { sides, raw, modified, success, critical };
            if (success)
                successes++;
            if (critical) {
                die.confirmation = randomDie(s, 6);
                if (die.confirmation >= 5) {
                    successes++;
                    confirmed++;
                }
            }
            rolls.push(die);
        }
    return { rolls, successes, confirmed };
}
function loseIncome(s, owner, amount = 1) { if (owner && !isShashka(owner)) {
    const k = s.kingdoms.find(k => k.id === owner);
    if (k && !k.collapsed)
        k.income = Math.max(0, k.income - amount);
} }
function gainIncome(s, owner, amount = 1) { if (owner && !isShashka(owner)) {
    const k = s.kingdoms.find(k => k.id === owner);
    if (k && !k.collapsed)
        k.income += amount;
} }
function raze(s, h, loot = false) {
    const owner = settlementController(s, h);
    if (loot && owner) {
        if (s.advanced)
            Advanced.queueAdvancedEvent(s, { type: 'settlement-looted', kingdom: owner, hexId: h.id });
        const k = kingdomOf(s, owner);
        k.gold += (isShashka(owner) ? 3 : 2) * (h.settlement?.city ? 2 : 1);
    }
    loseIncome(s, owner);
    delete s.controls[h.id];
    if (!s.razed.includes(h.id))
        s.razed.push(h.id);
    if (!Advanced.covensProtected(s))
        s.covens = s.covens.filter(id => id !== h.id);
    log(s, `${h.settlement?.name ?? h.id} was razed${loot ? ' and looted' : ''}.`);
}
function razeMagicOccupancy(s, ids, hexId, incomeRemoved = false) {
    const h = hexById(s, hexId);
    if (!aliveSettlement(s, h) || !s.advanced?.effects.some(e => ids.includes(e.target) && e.expires >= s.turnSerial && Advanced.cardById(e.cardId)?.effect.razeOccupiedSettlement && s.units.some(u => u.id === e.target && u.hexId === hexId)))
        return false;
    if (incomeRemoved) {
        delete s.controls[h.id];
        s.razed.push(h.id);
        if (!Advanced.covensProtected(s))
            s.covens = s.covens.filter(id => id !== h.id);
        log(s, `${h.settlement.name} was razed by the Storm Giant's Amulet.`);
    }
    else
        raze(s, h);
    return true;
}
function encounterCoven(s, u) {
    if (u.kingdom === 'night' || sameSide(s, u.kingdom, 'night') || !s.covens.includes(u.hexId) || s.covenProtected.includes(u.hexId))
        return;
    if (Advanced.covensProtected(s)) {
        if (!s.covenProtected.includes(u.hexId))
            s.covenProtected.push(u.hexId);
        log(s, 'Your True Rulers protects this Coven.');
        return;
    }
    const result = randomDie(s, 6);
    if (result >= 5) {
        s.covenProtected.push(u.hexId);
        log(s, `Coven hides in shadows (${result}); protected for this Kingdom's turn.`);
    }
    else {
        s.covens = s.covens.filter(id => id !== u.hexId);
        log(s, `Coven discovered (${result}) and removed.`);
    }
}
function startActivation(s, u) {
    if (s.activeUnitId && Advanced.stackIds(s, s.activeUnitId).includes(u.id))
        return;
    if (s.advanced) {
        s.advanced.activationIds = Advanced.stackIds(s, u.id);
        for (const id of s.advanced.activationIds)
            s.advanced.movement[id] ??= defOf(s, unitById(s, id)).movement;
    }
    s.activeUnitId = u.id;
    s.remainingMP = defOf(s, u).movement;
    s.allRoad = true;
    s.moved = false;
    s.shipUsed = false;
}
function finishActivation(s) {
    if (s.advanced && Advanced.afterAdvanceChoices(s, advancedContext()))
        return;
    if (s.advanced)
        Advanced.finishAdvancedActivation(s, advancedContext());
    const u = s.units.find(u => u.id === s.activeUnitId);
    if (u) {
        if (!s.advanced)
            encounterCoven(s, u);
        u.activated = true;
        const h = hexById(s, u.hexId);
        if (aliveSettlement(s, h) && !s.controls[h.id] && !h.settlement?.loyalty) {
            const d = defOf(s, u), count = Object.values(s.controls).filter(k => k === u.kingdom).length + (u.kingdom === 'night' ? s.covens.length : 0);
            if (!characteristic(d, 'huge') && !characteristic(d, 'feral') && count < controlCapacity(kingdomOf(s, u.kingdom))) {
                s.controls[h.id] = u.kingdom;
                gainIncome(s, u.kingdom);
                kingdomOf(s, u.kingdom).hasEverControlled = true;
                s.newlyFriendly.push(h.id);
                log(s, `${kingdomOf(s, u.kingdom).name} establishes control in ${h.settlement?.name}.`);
            }
        }
    }
    s.activeUnitId = null;
    s.remainingMP = 0;
    s.moved = false;
    s.allRoad = true;
    s.shipUsed = false;
    if (s.advanced)
        Advanced.finishGrant(s, advancedContext());
}
function hitArmy(s, id, hits) {
    if (!id || hits <= 0)
        return;
    const u = s.units.find(u => u.id === id);
    if (!u)
        return;
    if (Advanced.isHero(s, u) || characteristic(defOf(s, u), 'fragile') || u.weakened || hits >= 2) {
        if (s.advanced)
            Advanced.recordElimination(s, u, advancedContext());
        s.units = s.units.filter(v => v.id !== id);
        if (s.activeUnitId === id) {
            s.activeUnitId = s.advanced?.activationIds.find(x => s.units.some(v => v.id === x && !v.activated)) ?? null;
        }
        log(s, `${defOf(s, u).name} eliminated; available to rebuild.`);
    }
    else {
        u.weakened = true;
        log(s, `${defOf(s, u).name} weakened.`);
    }
}
function strikeDice(s, u, target) {
    return u ? diceFor(s, u) : { light: target.settlement?.city ? 3 : target.settlement ? 1 : 0, heavy: 0 };
}
function advanceInto(s, attackerId, targetHex, entryCleared = false) {
    const sourceAttacker = unitById(s, attackerId);
    if (targetHex !== sourceAttacker.hexId && anchoredDefender(s, sourceAttacker)) {
        s.pendingCombat = null;
        finishActivation(s);
        return;
    }
    if (s.advanced && !entryCleared) {
        Advanced.beforeAdvance(s, attackerId, targetHex, advancedContext());
        return;
    }
    const a = unitById(s, attackerId), h = hexById(s, targetHex), d = defOf(s, a);
    if (s.advanced)
        for (const hero of s.units.filter(u => u.hexId === targetHex && !sameSide(s, u.kingdom, a.kingdom) && Advanced.isHero(s, u)))
            hitArmy(s, hero.id, 1);
    if (!aliveSettlement(s, h)) {
        for (const id of Advanced.stackIds(s, a.id))
            unitById(s, id).hexId = h.id;
        if (s.advanced)
            s.advanced.justAdvanced = a.id;
        s.pendingCombat = null;
        finishActivation(s);
        return;
    }
    const wasWelcoming = isWelcoming(s, h, a.kingdom), former = settlementController(s, h);
    if (!wasWelcoming) {
        if (!characteristic(d, 'huge') && !characteristic(d, 'feral')) {
            const loot = (isShashka(a.kingdom) ? 3 : 2) * (h.settlement?.city ? 2 : 1);
            kingdomOf(s, a.kingdom).gold += loot;
            log(s, `${defOf(s, a).name} loots ${h.settlement?.name}: +${loot} gold.`);
            if (s.advanced)
                Advanced.queueAdvancedEvent(s, { type: 'settlement-looted', unitId: a.id, kingdom: a.kingdom, hexId: h.id });
        }
        loseIncome(s, former);
        delete s.controls[h.id];
    }
    const welcoming = isWelcoming(s, h, a.kingdom);
    if (welcoming) {
        if (!wasWelcoming)
            gainIncome(s, h.settlement?.loyalty ?? null);
        if (!characteristic(d, 'huge')) {
            for (const id of Advanced.stackIds(s, a.id))
                unitById(s, id).hexId = h.id;
            if (s.advanced)
                s.advanced.justAdvanced = a.id;
        }
        if (freshCityOccupationVictory(s, h))
            return;
        razeMagicOccupancy(s, Advanced.stackIds(s, a.id), h.id);
        if (!Advanced.covensProtected(s))
            s.covens = s.covens.filter(id => id !== h.id);
        s.newlyFriendly.push(h.id);
        s.pendingCombat = null;
        finishActivation(s);
        return;
    }
    for (const id of Advanced.stackIds(s, a.id))
        unitById(s, id).hexId = h.id;
    if (s.advanced)
        s.advanced.justAdvanced = a.id;
    if (freshCityOccupationVictory(s, h))
        return;
    if (razeMagicOccupancy(s, Advanced.stackIds(s, a.id), h.id, true)) {
        s.pendingCombat = null;
        finishActivation(s);
        return;
    }
    if (characteristic(d, 'feral') || characteristic(d, 'huge')) {
        if (!s.razed.includes(h.id))
            s.razed.push(h.id);
        if (!Advanced.covensProtected(s))
            s.covens = s.covens.filter(id => id !== h.id);
        log(s, `${h.settlement?.name} razed by ${d.name}.`);
        s.pendingCombat = null;
        finishActivation(s);
        return;
    }
    s.pendingCombat = { attackerId, targetHex, stage: 'settlement', decisionKingdom: a.kingdom, result: s.lastCombat ?? undefined };
}
function freshCityOccupationVictory(s, h) {
    // Capture sequence §4.9.2: advance (step 3) precedes Control/Razed (step 4).
    // An instant hostile-City occupation goal therefore fires on live arrival;
    // §4.10.1 removes the City symbol from already-Razed former City hexes.
    const hasCityGoal = (c) => c.type === 'enemy-city-occupied' || (c.type === 'all' || c.type === 'any') && c.conditions.some(hasCityGoal);
    if (aliveSettlement(s, h) && h.settlement?.city && s.scenario.sourceCampaign?.victory.immediate?.some(r => (r.check ?? 'action') === 'action' && hasCityGoal(r.condition)))
        evaluateVictory(s);
    return s.phase === 'game-over';
}
function completeCombat(s, result) {
    const p = s.pendingCombat, a = s.units.find(u => u.id === p.attackerId), h = hexById(s, p.targetHex);
    s.lastCombat = result;
    log(s, `Battle at ${h.settlement?.name ?? h.id}: ${result.attackerSuccesses} attacker / ${result.defenderSuccesses} defender successes; ${result.result}.`);
    const occupied = s.units.some(u => u.hexId === p.targetHex && !Advanced.isHero(s, u));
    if (a && result.defenderHits > 0 && !occupied) {
        if (aliveSettlement(s, h) && !isWelcoming(s, h, a.kingdom)) {
            advanceInto(s, a.id, h.id);
            return;
        }
        if (canEnd(s, a, h)) {
            s.pendingCombat = { ...p, stage: 'advance', decisionKingdom: a.kingdom, result };
            return;
        }
    }
    s.pendingCombat = null;
    finishActivation(s);
}
function resolveCombat(s, ambush) {
    const p = s.pendingCombat, a = unitById(s, p.attackerId), h = hexById(s, p.targetHex), d = s.units.find(u => u.hexId === h.id), f = combatForecast(s, a.id, h.id);
    let ar, dr;
    let attackerHits = 0, defenderHits = 0, result = 'draw';
    if (ambush) {
        const first = ambush === 'attacker' ? a : d, second = ambush === 'attacker' ? d : a;
        const firstTarget = ambush === 'attacker' ? h : hexById(s, a.hexId), secondTarget = ambush === 'attacker' ? hexById(s, a.hexId) : h;
        const fp = strikeDice(s, first, first ? hexById(s, first.hexId) : h), fr = rollPool(s, fp.light, fp.heavy);
        const hits = (fr.successes > 0 ? 1 : 0) + fr.confirmed;
        if (ambush === 'attacker') {
            defenderHits = hits;
            hitArmy(s, d?.id, hits);
        }
        else {
            attackerHits = hits;
            hitArmy(s, a.id, hits);
        }
        const secondSurvives = second ? s.units.some(u => u.id === second.id) : hits === 0;
        let sr = { rolls: [], successes: 0, confirmed: 0 };
        if (secondSurvives) {
            const sp = strikeDice(s, second, second ? hexById(s, second.hexId) : h);
            sr = rollPool(s, sp.light, sp.heavy);
            const backHits = (sr.successes > 0 ? 1 : 0) + sr.confirmed;
            if (ambush === 'attacker') {
                attackerHits = backHits;
                hitArmy(s, a.id, backHits);
            }
            else {
                defenderHits = backHits;
                hitArmy(s, d?.id, backHits);
            }
        }
        ar = ambush === 'attacker' ? fr : sr;
        dr = ambush === 'attacker' ? sr : fr;
        result = 'ambush';
    }
    else {
        ar = rollPool(s, f.attackerLight, f.attackerHeavy, f.fortificationPenalty);
        dr = rollPool(s, f.defenderLight, f.defenderHeavy);
        if (ar.successes > dr.successes) {
            result = 'attacker';
            defenderHits = ar.successes - dr.successes;
        }
        else if (dr.successes > ar.successes) {
            result = 'defender';
            attackerHits = dr.successes - ar.successes;
        }
        else if (ar.successes > 0) {
            result = 'tie';
            const aR = ability(defOf(s, a), 'ranged'), dR = !!d && ability(defOf(s, d), 'ranged');
            if (aR && !dR) {
                result = 'attacker';
                defenderHits = 1;
            }
            else if (dR && !aR) {
                result = 'defender';
                attackerHits = 1;
            }
        }
        hitArmy(s, a.id, attackerHits);
        hitArmy(s, d?.id, defenderHits);
    }
    completeCombat(s, { attackerId: a.id, targetHex: h.id, attackerRolls: ar.rolls, defenderRolls: dr.rolls, attackerSuccesses: ar.successes, defenderSuccesses: dr.successes, attackerHits, defenderHits, result, ...(ambush ? { ambush } : {}) });
}
function collapse(s, k, reason) {
    if (!canCollapse(s, k.id)) {
        log(s, `${k.name} is protected from collapse by this campaign.`);
        return;
    }
    if (k.collapsed)
        return;
    k.collapsed = true;
    if (k.id === 'fjordland' && s.scenario.sourceCampaign?.chronicle?.returnFjord) {
        s.campaignRuntime ??= { withdrawn: [] };
        s.campaignRuntime.fjordCollapsedAt = { year: historicalYear(s), season: s.season };
    }
    if (s.advanced) {
        for (const u of s.units.filter(u => u.kingdom === k.id))
            Advanced.recordElimination(s, u, advancedContext());
        for (const m of s.advanced.monsters.filter(m => m.kingdom === k.id))
            s.advanced.monsterPools[Advanced.monsterById(m.defId).pool].push(m.defId);
        s.advanced.monsters = s.advanced.monsters.filter(m => m.kingdom !== k.id);
    }
    s.units = s.units.filter(u => u.kingdom !== k.id);
    for (const id of Object.keys(s.controls))
        if (s.controls[id] === k.id)
            delete s.controls[id];
    if (k.id === 'night')
        s.covens = [];
    log(s, `${k.name} collapses: ${reason}.`);
}
function evaluateVictory(s, atDeadline = false, check = 'action', afterKingdom) {
    if (s.phase === 'game-over' || s.tabletop?.manualVictory)
        return;
    if (s.scenario.sourceCampaign) {
        const result = campaignVictory(s, atDeadline ? 'deadline' : check, afterKingdom);
        if (!result)
            return;
        s.winner = result.winner;
        s.victoryReason = result.reason;
        s.phase = 'game-over';
        s.pendingCombat = null;
        s.activeUnitId = null;
        if (s.advanced) {
            s.advanced.pending = null;
            s.advanced.battle = null;
        }
        if (s.scenario.sourceCampaign.chronicle?.nextScenarioId) {
            s.campaignRuntime ??= { withdrawn: [] };
            s.campaignRuntime.nextScenarioId = s.scenario.sourceCampaign.chronicle.nextScenarioId;
        }
        log(s, `${s.winner === 'invader' ? 'Invader' : 'Resistance'} victory. ${s.victoryReason}`);
        return;
    }
    const invaderAlive = s.kingdoms.some(k => k.side === 'invader' && !k.collapsed), resistanceAlive = s.kingdoms.some(k => k.side === 'resistance' && !k.collapsed);
    if (!invaderAlive || !resistanceAlive) {
        s.winner = invaderAlive ? 'invader' : 'resistance';
        s.victoryReason = 'All opposing Kingdoms have collapsed.';
    }
    else {
        const o = s.scenario.objective;
        if (o.type === 'survival') {
            if (!atDeadline)
                return;
            const survived = o.kingdom ? !kingdomOf(s, o.kingdom).collapsed : invaderAlive;
            s.winner = survived ? 'invader' : 'resistance';
            s.victoryReason = survived ? 'The invading Kingdom survives at the campaign deadline.' : 'The invading Kingdom did not survive.';
            s.phase = 'game-over';
            s.pendingCombat = null;
            s.activeUnitId = null;
            log(s, `${s.winner} victory. ${s.victoryReason}`);
            return;
        }
        if (!atDeadline && (o.deadlineOnly ?? true))
            return;
        const count = o.hexIds.filter(id => { const h = hexById(s, id), owner = settlementController(s, h); return !!owner && (o.kingdom ? owner === o.kingdom : kingdomOf(s, owner).side === 'invader'); }).length;
        const achieved = count >= o.count;
        if (atDeadline || achieved) {
            s.winner = achieved ? 'invader' : 'resistance';
            s.victoryReason = `${count}/${o.count} objective settlements controlled${atDeadline ? ' at the campaign deadline' : ''}.`;
        }
    }
    if (s.winner) {
        s.phase = 'game-over';
        s.pendingCombat = null;
        s.activeUnitId = null;
        log(s, `${s.winner === 'invader' ? 'Invader' : 'Resistance'} victory. ${s.victoryReason}`);
    }
}
function beginTurn(s) {
    if (chronicleBeginTurn(s))
        return;
    s.currentKingdom = s.scenario.turnOrder[s.turnIndex];
    s.turnSerial++;
    s.phase = 'income-actions';
    s.newlyFriendly = [];
    s.incomeActionsUsed = [];
    s.covenProtected = [];
    s.activeUnitId = null;
    s.pendingCombat = null;
    s.remainingMP = 0;
    s.moved = false;
    s.shipUsed = false;
    s.allRoad = true;
    const k = kingdomOf(s, s.currentKingdom);
    log(s, `${['Spring', 'Summer', 'Autumn'][s.season]}, Year ${s.year}: ${k.name} Income Actions.`);
    for (const r of campaignRules(s))
        if (r.type === 'withdraw' && s.year * 3 + s.season >= r.year * 3 + r.season && !s.campaignRuntime?.withdrawn.includes(r.kingdom)) {
            s.campaignRuntime ??= { withdrawn: [] };
            s.campaignRuntime.withdrawn.push(r.kingdom);
            const departing = s.kingdoms.find(v => v.id === r.kingdom);
            if (departing) {
                departing.collapsed = true;
                departing.gold = 0;
                departing.income = 0;
            }
            for (const id of Object.keys(s.controls))
                if (s.controls[id] === r.kingdom) {
                    delete s.controls[id];
                    if (r.razeControls && !s.razed.includes(id))
                        s.razed.push(id);
                }
            if (r.kingdom === 'night')
                s.covens = [];
            for (const u of s.units.filter(u => u.kingdom === r.kingdom))
                if (s.advanced)
                    Advanced.recordElimination(s, u, advancedContext());
            s.units = s.units.filter(u => u.kingdom !== r.kingdom);
            log(s, `${departing?.name ?? r.kingdom} withdraws under the campaign rules.`);
        }
    for (const r of campaignRules(s))
        if (r.type === 'fixed-defender' && r.covenCheckTurn === k.id && s.covens.includes(r.hexId) && s.units.some(u => u.defId === r.defId && u.hexId === r.hexId)) {
            const die = randomDie(s, 6);
            if (die < 5)
                s.covens = s.covens.filter(id => id !== r.hexId);
            else
                s.covenProtected.push(r.hexId);
            log(s, `Coven at the fixed defender settlement ${die >= 5 ? 'hides' : 'is discovered'} (${die}).`);
        }
    if (k.id === 'empire') {
        if (s.advanced)
            s.advanced.effects = s.advanced.effects.filter(e => !e.extra?.noSuppression);
        const die = randomDie(s, 6) + campaignRevoltModifier(s), revolts = die >= 6 ? 0 : die >= 4 ? 1 : 5 - die;
        k.revolt = (k.revolt ?? 0) + revolts;
        log(s, `Imperial revolt roll ${die}: +${revolts} revolts (${k.revolt} total).`);
        if (k.revolt >= 20 && canCollapse(s, k.id)) {
            collapse(s, k, 'twentieth revolt');
            advanceTurn(s);
        }
    }
}
function advanceTurn(s) {
    if (s.advanced && s.advanced.winterStart) {
        delete s.advanced.winterStart;
        beginTurn(s);
        return;
    }
    evaluateVictory(s);
    if (s.phase === 'game-over')
        return;
    for (let guard = 0; guard < 20; guard++) {
        s.turnIndex++;
        if (s.turnIndex >= s.scenario.turnOrder.length) {
            evaluateVictory(s, false, 'season-end', s.currentKingdom);
            if (s.phase === 'game-over')
                return;
            if (s.year === s.scenario.endYear && s.season === s.scenario.endSeason) {
                s.turnIndex = s.scenario.turnOrder.indexOf(s.currentKingdom);
                evaluateVictory(s, true);
                return;
            }
            s.turnIndex = 0;
            if (s.season === 2) {
                s.year++;
                s.season = 0;
                if (s.advanced) {
                    s.turnIndex = s.scenario.turnOrder.findIndex(id => !kingdomOf(s, id).collapsed);
                    s.currentKingdom = s.scenario.turnOrder[s.turnIndex];
                    s.advanced.winterStart = true;
                    Advanced.beginWinter(s, advancedContext());
                    chronicleWinter(s);
                    return;
                }
                s.turnIndex = s.scenario.turnOrder.findIndex(id => !kingdomOf(s, id).collapsed);
                s.currentKingdom = s.scenario.turnOrder[s.turnIndex];
                chronicleWinter(s);
                if (s.campaignRuntime?.pendingBitterDisplacement) {
                    s.campaignRuntime.beginTurnAfterEvent = true;
                    return;
                }
                restoreEventTurn(s);
                log(s, 'Winter is skipped in the Basic Game.');
            }
            else {
                s.season = (s.season + 1);
                if (s.advanced) {
                    if (s.season === 2)
                        s.advanced.extraChurn = true;
                    Advanced.assignStudyMarkers(s, advancedContext());
                }
            }
        }
        if (!kingdomOf(s, s.scenario.turnOrder[s.turnIndex]).collapsed) {
            beginTurn(s);
            return;
        }
    }
    throw new Error('No active Kingdom can take a turn.');
}
export function createGame(config) {
    const c = structuredClone(config), scenario = c.scenario;
    if (c.profile === 'advanced' || scenario.sourceCampaign)
        for (const d of Advanced.heroDefinitions().filter(d => scenario.kingdoms.some(k => k.id === d.kingdom) || scenario.sourceCampaign?.opening.some(o => o.extraHeroes?.some(e => e.kingdom === d.kingdom))))
            if (!c.unitDefinitions.some(x => x.id === d.id))
                c.unitDefinitions.push(d);
    const s = { version: 1, hexes: c.hexes, unitDefinitions: c.unitDefinitions, scenario, kingdoms: scenario.kingdoms.map(k => ({ ...k, controller: c.controllers?.[k.id] ?? 'human', collapsed: false, hasEverControlled: Object.values(scenario.initialControls ?? {}).includes(k.id) })), units: scenario.initialUnits.map((u, i) => { const d = c.unitDefinitions.find(d => d.id === u.defId); if (!d)
            throw new Error(`Unknown opening Army ${u.defId}`); return { ...u, id: `unit-${i + 1}`, kingdom: d.kingdom, weakened: u.weakened ?? false, activated: false }; }), controls: { ...scenario.initialControls }, razed: [...scenario.initialRazed ?? []], covens: [...scenario.initialCovens ?? []], covenProtected: [], year: scenario.startYear, season: scenario.startSeason, phase: 'income-actions', turnIndex: 0, currentKingdom: scenario.turnOrder[0], activeUnitId: null, remainingMP: 0, allRoad: true, moved: false, shipUsed: false, pendingCombat: null, lastCombat: null, rng: (c.seed ?? 29051994) >>> 0 || 1, serial: scenario.initialUnits.length + 1, turnSerial: 0, newlyFriendly: [], incomeActionsUsed: [], winner: null, victoryReason: '', log: [] };
    if (c.tabletop)
        s.tabletop = { version: 1, review: null, rulings: [], manualVictory: !scenario.sourceCampaign, setupSource: c.scenario.source };
    if (c.profile === 'advanced')
        Advanced.initializeAdvanced(s, c, advancedContext());
    if (scenario.sourceCampaign)
        initializeOpening(s);
    const issues = validateState(s);
    if (issues.length)
        throw new Error(issues.join('; '));
    if (!scenario.sourceCampaign)
        beginTurn(s);
    return s;
}
const sameAction = (a, b) => {
    if (a.type !== b.type)
        return false;
    const strip = (v) => Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'path' && !(k === 'ambush' && v.ambush === undefined)).map(([k, val]) => [k, val]));
    const aa = strip(a), bb = strip(b);
    if (a.type === 'resolve-combat' && !('ambush' in aa))
        aa.ambush = null;
    if (b.type === 'resolve-combat' && !('ambush' in bb))
        bb.ambush = null;
    if (a.type === 'suppress' && !('amount' in aa))
        aa.amount = 1;
    if (b.type === 'suppress' && !('amount' in bb))
        bb.amount = 1;
    return Object.keys(aa).length === Object.keys(bb).length && Object.keys(aa).every(k => aa[k] === bb[k]);
};
export function applyAction(state, action) {
    const legal = legalActions(state).find(a => sameAction(a, action));
    if (!legal)
        throw new Error(`Illegal action ${action.type} during ${state.phase}${state.pendingCombat ? ' / ' + state.pendingCombat.stage : ''}.`);
    const s = structuredClone(state), k = kingdomOf(s, s.currentKingdom);
    if (legal.type.startsWith('campaign-')) {
        applyCampaign(s, legal);
        return s;
    }
    if (legal.type.startsWith('opening-')) {
        applyOpening(s, legal);
        return s;
    }
    if (s.advanced && ADVANCED_ACTIONS.has(legal.type)) {
        Advanced.applyAdvancedAction(s, legal, advancedContext());
        const empire = s.kingdoms.find(k => k.id === 'empire');
        if (empire && (empire.revolt ?? 0) >= 20 && !empire.collapsed && canCollapse(s, empire.id)) {
            collapse(s, empire, 'twentieth revolt');
            if (s.currentKingdom === 'empire') {
                s.advanced.pending = null;
                s.advanced.battle = null;
                s.pendingCombat = null;
                advanceTurn(s);
            }
            else
                evaluateVictory(s);
        }
        Advanced.resolveImmediateTreasures(s);
        Advanced.flushAdvancedEvents(s, advancedContext());
        evaluateVictory(s);
        canonicalizeAdvanced(s);
        return s;
    }
    switch (legal.type) {
        case 'activate':
            startActivation(s, unitById(s, legal.unitId));
            break;
        case 'move': {
            const u = unitById(s, legal.unitId);
            startActivation(s, u);
            const option = moveOptions(s, u.id).find(m => m.hexId === legal.toHex);
            const from = hexById(s, u.hexId), to = hexById(s, legal.toHex);
            log(s, `${defOf(s, u).name}: ${from.settlement?.name ?? from.id} → ${to.settlement?.name ?? to.id} (${option.cost} MP${option.roadOnly ? ', all-road route' : ''}).`);
            if (s.advanced) {
                Advanced.beginMovement(s, u.id, option.path, false, advancedContext());
                break;
            }
            restoreCampaignLoyalty(s, u, legal.toHex);
            u.hexId = legal.toHex;
            s.remainingMP -= option.cost;
            s.allRoad = option.roadOnly;
            s.moved = true;
            const swap = s.units.find(v => v.id !== u.id && v.hexId === u.hexId);
            if (swap) {
                u.activated = true;
                startActivation(s, swap);
                log(s, `${defOf(s, u).name} switches positions; ${defOf(s, swap).name} must leave next.`);
            }
            break;
        }
        case 'ship': {
            const u = unitById(s, legal.unitId);
            startActivation(s, u);
            s.shipUsed = true;
            if (s.advanced)
                s.advanced.shipsThisTurn = [...s.advanced.shipsThisTurn ?? [], ...Advanced.stackIds(s, u.id)];
            const path = legal.path ?? [];
            if (s.advanced)
                Advanced.beginMovement(s, u.id, path, true, advancedContext());
            else {
                restoreCampaignLoyalty(s, u, legal.toHex);
                u.hexId = legal.toHex;
                encounterCoven(s, u);
                log(s, `${defOf(s, u).name} completes Ship Movement.`);
                const swap = s.units.find(v => v.id !== u.id && v.hexId === u.hexId);
                if (swap) {
                    u.activated = true;
                    startActivation(s, swap);
                    log(s, `${defOf(s, u).name} switches positions; ${defOf(s, swap).name} must leave next.`);
                }
                else if (rawDef(s, u).kingdom !== 'fjordland')
                    finishActivation(s);
            }
            break;
        }
        case 'attack': {
            const u = unitById(s, legal.unitId);
            startActivation(s, u);
            if (!s.advanced)
                encounterCoven(s, u);
            const f = combatForecast(s, u.id, legal.targetHex);
            s.pendingCombat = { attackerId: u.id, targetHex: legal.targetHex, stage: 'ambush', decisionKingdom: f.defenderCanAmbush ? s.units.find(v => v.id === f.defenderUnitId).kingdom : u.kingdom, ...(f.defenderUnitId ? { defenderUnitId: f.defenderUnitId } : {}) };
            if (s.advanced)
                Advanced.startBattleMagic(s, advancedContext());
            else if (!f.attackerCanAmbush && !f.defenderCanAmbush)
                resolveCombat(s, null);
            break;
        }
        case 'resolve-combat':
            if (s.advanced)
                Advanced.beginAdvancedRoll(s, legal.ambush ?? null, advancedContext());
            else
                resolveCombat(s, legal.ambush ?? null);
            break;
        case 'advance': {
            const p = s.pendingCombat;
            if (legal.accept)
                advanceInto(s, p.attackerId, p.targetHex);
            else {
                s.pendingCombat = null;
                finishActivation(s);
            }
            break;
        }
        case 'settlement': {
            const p = s.pendingCombat, h = hexById(s, p.targetHex), owner = kingdomOf(s, p.decisionKingdom);
            if (legal.choice === 'control') {
                s.controls[h.id] = owner.id;
                owner.hasEverControlled = true;
                gainIncome(s, owner.id);
                s.newlyFriendly.push(h.id);
                log(s, `${owner.name} controls ${h.settlement?.name}.`);
            }
            else {
                if (!s.razed.includes(h.id))
                    s.razed.push(h.id);
                log(s, `${h.settlement?.name} was razed.`);
            }
            if (!Advanced.covensProtected(s))
                s.covens = s.covens.filter(id => id !== h.id);
            s.pendingCombat = null;
            finishActivation(s);
            break;
        }
        case 'recover': {
            const u = unitById(s, legal.unitId);
            startActivation(s, u);
            if (!s.advanced)
                encounterCoven(s, u);
            k.gold -= defOf(s, u).recoveryCost;
            u.weakened = false;
            log(s, `${defOf(s, u).name} Recovers.`);
            finishActivation(s);
            break;
        }
        case 'regenerate': {
            const u = unitById(s, legal.unitId);
            kingdomOf(s, u.kingdom).gold -= defOf(s, u).recoveryCost;
            u.weakened = false;
            log(s, `${defOf(s, u).name} Regenerates.`);
            break;
        }
        case 'mine': {
            const u = unitById(s, legal.unitId);
            startActivation(s, u);
            k.gold++;
            log(s, 'Oathborn Miners work a mine: +1 gold.');
            finishActivation(s);
            if (s.advanced)
                Advanced.queueAdvancedEvent(s, { type: 'after-mining-action', unitId: u.id, kingdom: u.kingdom });
            break;
        }
        case 'pass':
            startActivation(s, unitById(s, legal.unitId));
            finishActivation(s);
            break;
        case 'build': {
            const d = s.unitDefinitions.find(d => d.id === legal.defId), h = hexById(s, legal.hexId);
            k.gold -= d.cost;
            const finished = buildWouldFinish(s, d, h);
            const built = { id: `unit-${s.serial++}`, defId: d.id, kingdom: k.id, hexId: h.id, weakened: false, activated: finished };
            s.units.push(built);
            if (s.advanced) {
                const hero = s.units.find(u => u.hexId === h.id && Advanced.isHero(s, u));
                if (hero)
                    s.advanced.stacks[hero.id] = built.id;
            }
            log(s, `${k.name} builds ${d.name} (${d.cost} gold), ${!finished ? 'ready' : 'finished'}.`);
            break;
        }
        case 'coven': {
            const h = hexById(s, legal.hexId), dominia = s.advanced && s.units.some(u => u.defId === 'hero-night-13' && Math.max(Math.abs(h.q - hexById(s, u.hexId).q), Math.abs(h.r - hexById(s, u.hexId).r), Math.abs(h.q + h.r - hexById(s, u.hexId).q - hexById(s, u.hexId).r)) <= 5), raw = dominia ? 5 : randomDie(s, 6);
            let modifier = 0;
            if (!s.units.some(u => u.hexId === h.id))
                modifier++;
            if (!h.settlement?.fortified)
                modifier++;
            if (wilderness(h) || adjacentHexes(s, h.id).some(t => wilderness(t)))
                modifier++;
            if (raw + modifier >= 5)
                s.covens.push(h.id);
            s.incomeActionsUsed.push('coven');
            log(s, `Coven placement at ${h.settlement?.name}: ${dominia ? 'automatic near Dominia' : raw + '+' + modifier} ${raw + modifier >= 5 ? 'succeeds' : 'fails'}.`);
            break;
        }
        case 'lay-waste':
            raze(s, hexById(s, legal.hexId), true);
            break;
        case 'remove-control': {
            const h = hexById(s, legal.hexId);
            loseIncome(s, k.id);
            delete s.controls[h.id];
            if (!isWelcoming(s, h, k.id)) {
                if (!s.razed.includes(h.id))
                    s.razed.push(h.id);
                if (!Advanced.covensProtected(s))
                    s.covens = s.covens.filter(id => id !== h.id);
            }
            else if (h.settlement?.loyalty)
                gainIncome(s, h.settlement.loyalty);
            log(s, `${k.name} removes its control marker from ${h.settlement?.name}.`);
            break;
        }
        case 'remove-coven':
            s.covens = s.covens.filter(id => id !== legal.hexId);
            log(s, `Army of the Night removes its Coven from ${hexById(s, legal.hexId).settlement?.name}.`);
            break;
        case 'recolonize': {
            const h = hexById(s, legal.hexId), cost = repairCost(s, k.id);
            k.gold -= cost;
            s.razed = s.razed.filter(id => id !== h.id);
            gainIncome(s, h.settlement?.loyalty ?? k.id);
            if (!h.settlement?.loyalty) {
                s.controls[h.id] = k.id;
                k.hasEverControlled = true;
            }
            s.newlyFriendly.push(h.id);
            log(s, `${h.settlement?.name} rebuilt for ${cost} gold.`);
            break;
        }
        case 'disband-siege':
            s.units = s.units.filter(u => u.id !== legal.unitId);
            log(s, `${k.name} disbands its Siege Engine.`);
            break;
        case 'suppress':
            k.gold--;
            k.revolt = Math.max(0, (k.revolt ?? 0) - 1);
            log(s, `Imperial revolt suppressed; ${k.revolt} remain.`);
            break;
        case 'transfer-gold':
            k.gold -= 2;
            kingdomOf(s, legal.toKingdom).gold++;
            log(s, `${k.name} transfers 2 gold; allied ${kingdomOf(s, legal.toKingdom).name} receives 1 gold.`);
            break;
        case 'collect-income': {
            if (isShashka(k.id)) {
                const dues = Object.values(s.controls).filter(id => id === k.id).length;
                if (k.gold < dues && canCollapse(s, k.id)) {
                    collapse(s, k, 'cannot pay 1 gold per controlled Settlement');
                    advanceTurn(s);
                    break;
                }
                k.gold = Math.max(0, k.gold - dues);
                log(s, `Shashka maintenance: −${dues} gold; no ordinary income.`);
            }
            else {
                const income = k.income + (k.id === 'night' ? s.covens.length : 0);
                k.gold += income;
                log(s, `${k.name} collects ${income} gold.`);
                if (k.id === 'empire') {
                    const dues = k.revolt ?? 0, paid = Math.min(dues, k.gold);
                    k.gold -= paid;
                    k.revolt = (k.revolt ?? 0) + (dues - paid);
                    log(s, `Empire pays ${paid} revolt gold${dues > paid ? `, +${dues - paid} unpaid revolts` : ''}.`);
                    if ((k.revolt ?? 0) >= 20 && canCollapse(s, k.id)) {
                        collapse(s, k, 'twentieth revolt');
                        advanceTurn(s);
                        break;
                    }
                }
            }
            s.phase = 'activation';
            if (s.advanced)
                Advanced.advancedTurnReady(s);
            for (const u of s.units)
                if (u.kingdom === k.id)
                    u.activated = false;
            break;
        }
        case 'end-turn': {
            finishActivation(s);
            for (const u of s.units)
                if (u.kingdom === k.id)
                    u.activated = true;
            if (isShashka(k.id) && k.hasEverControlled && !Object.values(s.controls).includes(k.id))
                collapse(s, k, 'no controlled Settlements at the end of its Activation Phase');
            const cities = s.hexes.filter(h => h.settlement?.city && h.settlement.loyalty === k.id && h.id !== s.advanced?.khazud), threshold = k.cityCollapseThreshold ?? (k.id === 'empire' ? 2 : k.id === 'oathborn' ? 3 : 1);
            if (cities.length >= threshold && cities.length > 0 && cities.every(h => s.razed.includes(h.id) || !isWelcoming(s, h, k.id)))
                collapse(s, k, 'all Cities razed or enemy controlled');
            evaluateVictory(s, false, 'turn-end', k.id);
            if (s.phase !== 'game-over') {
                if (s.advanced)
                    Advanced.beginStudy(s, advancedContext());
                else
                    advanceTurn(s);
            }
            break;
        }
    }
    if (s.advanced) {
        Advanced.resolveImmediateTreasures(s);
        Advanced.flushAdvancedEvents(s, advancedContext());
    }
    if (s.phase !== 'opening')
        evaluateVictory(s);
    canonicalizeAdvanced(s);
    return s;
}
export function botAction(s) {
    const actions = legalActions(s);
    if (!actions.length)
        return null;
    if (s.phase === 'opening') {
        const o = s.opening;
        const free = actions.find(a => a.type === 'opening-build' && o.remainingFreeUnits.some(v => v.defId === a.defId));
        if (free)
            return free;
        const coven = actions.find(a => a.type === 'opening-coven');
        if (coven)
            return coven;
        const army = actions.filter((a) => a.type === 'opening-build').sort((a, b) => { const da = s.unitDefinitions.find(d => d.id === a.defId), db = s.unitDefinitions.find(d => d.id === b.defId); return (db.light + db.heavy * 1.6) / (db.cost || 1) - (da.light + da.heavy * 1.6) / (da.cost || 1); });
        if (army.length && s.units.filter(u => u.kingdom === s.currentKingdom).length < 8)
            return army[0];
        return actions.find(a => a.type === 'opening-hero') ?? actions.find(a => a.type === 'opening-done') ?? actions[0];
    }
    if (s.advanced?.pending) {
        const p = s.advanced.pending;
        if (p.kind === 'study')
            return actions.find(a => a.type === 'study' && a.discipline === 'spells' && !a.discardId) ?? actions.find(a => a.type === 'study' && !('discardId' in a)) ?? actions.find(a => a.type === 'finish-study') ?? actions[0];
        if (p.kind === 'winter')
            return actions.find(a => a.type === 'finish-winter') ?? actions[0];
        if (p.kind === 'hit')
            return actions.find(a => a.type === 'allocate-hit' && !Advanced.isHero(s, unitById(s, a.unitId))) ?? actions[0];
        if (p.kind === 'window')
            return actions.find(a => a.type === 'play-card' && ['blessing'].includes(Advanced.cardById(a.cardId)?.kind ?? '') && a.targetId && s.units.find(u => u.id === a.targetId)?.kingdom === advancedActor(s)) ?? actions.find(a => a.type === 'magic-pass') ?? actions[0];
        return actions[0];
    }
    if (s.pendingCombat) {
        if (s.pendingCombat.stage === 'settlement')
            return actions.find(a => a.type === 'settlement' && a.choice === 'control') ?? actions[0];
        if (s.pendingCombat.stage === 'advance')
            return actions.find(a => a.type === 'advance' && a.accept) ?? actions[0];
        const f = combatForecast(s, s.pendingCombat.attackerId, s.pendingCombat.targetHex);
        if (f.defenderCanAmbush)
            return actions.find(a => a.type === 'resolve-combat' && a.ambush === 'defender');
        if (f.attackerCanAmbush && f.attackerExpected < f.defenderExpected)
            return actions.find(a => a.type === 'resolve-combat' && a.ambush === 'attacker');
        return actions[0];
    }
    const k = kingdomOf(s, s.currentKingdom);
    if (s.phase === 'income-actions') {
        if (k.id === 'night') {
            const covens = actions.filter((a) => a.type === 'coven');
            if (covens.length)
                return covens.sort((a, b) => { const ha = hexById(s, a.hexId), hb = hexById(s, b.hexId); return (Number(!!wilderness(hb)) + Number(!hb.settlement?.fortified) + Number(!s.units.some(u => u.hexId === hb.id))) - (Number(!!wilderness(ha)) + Number(!ha.settlement?.fortified) + Number(!s.units.some(u => u.hexId === ha.id))); })[0];
        }
        if (isShashka(k.id)) {
            const dues = Object.values(s.controls).filter(id => id === k.id).length;
            if (k.gold < dues + 2 && dues > 1) {
                const waste = actions.find(a => a.type === 'lay-waste');
                if (waste)
                    return waste;
            }
        }
        return { type: 'collect-income' };
    }
    if (s.advanced && !s.activeUnitId && s.units.filter(u => u.kingdom === k.id && Advanced.isHero(s, u)).length < 2) {
        const hero = actions.find(a => a.type === 'recruit-hero');
        if (hero)
            return hero;
    }
    if (s.advanced) {
        const power = actions.find(a => a.type === 'hero-power' && a.casterId && s.units.find(u => u.id === a.casterId)?.kingdom === k.id);
        if (power)
            return power;
        const explore = actions.find(a => a.type === 'explore-lair');
        if (explore)
            return explore;
        const ms = actions.find(a => a.type === 'monster-strike');
        if (ms)
            return ms;
    }
    const regen = actions.find(a => a.type === 'regenerate' && unitById(s, a.unitId).kingdom === s.currentKingdom);
    if (regen)
        return regen;
    const recover = actions.find(a => a.type === 'recover');
    if (recover)
        return recover;
    const attacks = actions.filter((a) => a.type === 'attack').sort((a, b) => {
        const fa = combatForecast(s, a.unitId, a.targetHex), fb = combatForecast(s, b.unitId, b.targetHex);
        return (fb.attackerExpected - fb.defenderExpected + Number(aliveSettlement(s, hexById(s, b.targetHex)))) - (fa.attackerExpected - fa.defenderExpected + Number(aliveSettlement(s, hexById(s, a.targetHex))));
    });
    const good = attacks.find(a => { const f = combatForecast(s, a.unitId, a.targetHex); return f.attackerExpected >= f.defenderExpected * 0.65; });
    if (good)
        return good;
    const mine = actions.find(a => a.type === 'mine');
    if (mine)
        return mine;
    if (k.id === 'empire' && (k.revolt ?? 0) > 1) {
        const suppress = actions.find(a => a.type === 'suppress');
        if (suppress)
            return suppress;
    }
    const objective = s.scenario.objective.hexIds;
    const threats = s.hexes.filter(h => (aliveSettlement(s, h) && !isWelcoming(s, h, k.id)) || s.units.some(u => u.hexId === h.id && !sameSide(s, u.kingdom, k.id)));
    const distance = (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs((a.q + a.r) - (b.q + b.r)));
    const goalDistance = (h) => Math.min(...threats.map(t => distance(h, t) - (objective.includes(t.id) ? 0.4 : 0)), Infinity);
    const moves = actions.filter((a) => a.type === 'move' || a.type === 'ship').filter(a => goalDistance(hexById(s, a.toHex)) < goalDistance(hexById(s, unitById(s, a.unitId).hexId)));
    moves.sort((a, b) => goalDistance(hexById(s, a.toHex)) - goalDistance(hexById(s, b.toHex)));
    if (moves.length)
        return moves[0];
    if (s.activeUnitId)
        return actions.find(a => a.type === 'pass') ?? actions.find(a => a.type === 'move' || a.type === 'ship') ?? actions.find(a => a.type === 'end-turn') ?? actions[0];
    const builds = actions.filter((a) => a.type === 'build');
    if (builds.length && s.units.filter(u => u.kingdom === k.id).length < 12) {
        builds.sort((a, b) => { const da = s.unitDefinitions.find(d => d.id === a.defId), db = s.unitDefinitions.find(d => d.id === b.defId); return (goalDistance(hexById(s, a.hexId)) - goalDistance(hexById(s, b.hexId))) + (da.cost - (da.light + da.heavy * 1.8)) - (db.cost - (db.light + db.heavy * 1.8)); });
        return builds[0];
    }
    if (attacks.length)
        return attacks[0];
    return actions.find(a => a.type === 'end-turn') ?? actions[0];
}
export function validateState(value) {
    const issues = [];
    if (!value || typeof value !== 'object')
        return ['Saved game must be an object.'];
    const s = value;
    const tableIssues = validateTabletop(s.tabletop);
    if (tableIssues.length)
        return tableIssues;
    const advancedIssues = Advanced.validateAdvancedShape(s.advanced);
    if (advancedIssues.length)
        return advancedIssues;
    if (s.version !== 1)
        issues.push('Unsupported saved-game version.');
    if (!Array.isArray(s.hexes) || !Array.isArray(s.unitDefinitions) || !Array.isArray(s.units) || !Array.isArray(s.kingdoms))
        return [...issues, 'Missing board, Army definitions, units, or Kingdoms.'];
    if (s.tabletop?.enslaved?.some(x => !s.units.some(u => u.id === x.armyId && !Advanced.isHero(s, u))))
        return ['Unknown Enslaved Hero Army.'];
    if (s.tabletop?.review && !s.advanced?.players.some(p => p.id === s.tabletop.review.playerId))
        return ['Unknown table resolver.'];
    if (s.hexes.length > 5000 || s.units.length > 2000 || s.unitDefinitions.length > 1000 || s.kingdoms.length > 6)
        return ['Saved game exceeds supported limits.'];
    if (!s.scenario || !Array.isArray(s.scenario.turnOrder) || !s.scenario.objective)
        return [...issues, 'Missing campaign definition.'];
    const hexIds = new Set(s.hexes.map(h => h.id)), defIds = new Set(s.unitDefinitions.map(d => d.id)), kingdomIds = new Set(s.kingdoms.map(k => k.id)), unitIds = new Set();
    if (hexIds.size !== s.hexes.length)
        issues.push('Duplicate board hex IDs.');
    if (defIds.size !== s.unitDefinitions.length)
        issues.push('Duplicate Army definition IDs.');
    if (!kingdomIds.has(s.currentKingdom))
        issues.push('Unknown current Kingdom.');
    if (!['opening', 'income-actions', 'activation', 'game-over'].includes(s.phase))
        issues.push('Unknown phase.');
    if (!Number.isInteger(s.year) || s.year < 1 || ![0, 1, 2].includes(s.season) || s.year * 3 + s.season < s.scenario.startYear * 3 + s.scenario.startSeason || s.year * 3 + s.season > s.scenario.endYear * 3 + s.scenario.endSeason)
        issues.push('Invalid campaign date.');
    if (!Number.isInteger(s.rng) || s.rng < 1 || s.rng > 0xffffffff)
        issues.push('Invalid deterministic random state.');
    const integer = (v, min, max) => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
    if (s.scenario.sourceCampaign) {
        const sourceIssues = validatePublishedCampaignRules(s.scenario.sourceCampaign, { hexIds, defIds, kingdomIds });
        if (sourceIssues.length)
            return [...issues, ...sourceIssues];
    }
    if (s.phase === 'opening') {
        const o = s.opening;
        if (!o || !s.scenario.sourceCampaign || !Array.isArray(o.order) || o.order.some(id => !kingdomIds.has(id)) || !integer(o.index, 0, o.order.length - 1) || !integer(o.groupIndex, 0, s.scenario.sourceCampaign.deploymentOrder.length - 1) || !integer(o.preControlsIndex, 0, s.scenario.sourceCampaign.preControls?.length ?? 0) || !integer(o.preChoicesIndex, 0, s.scenario.sourceCampaign.preChoices?.length ?? 0) || !integer(o.preControlsPlaced, 0, 20) || !integer(o.remainingCovens, 0, 20) || !Array.isArray(o.remainingHeroes) || o.remainingHeroes.some(id => !defIds.has(id)) || !Array.isArray(o.remainingFreeUnits) || o.remainingFreeUnits.some(v => !v || !defIds.has(v.defId) || v.weakened !== undefined && typeof v.weakened !== 'boolean' || v.optional !== undefined && typeof v.optional !== 'boolean') || !Array.isArray(o.done) || !Array.isArray(o.exchanged) || !o.deployments || !o.choices || !o.heroLocations || !o.spentByHex)
            issues.push('Invalid opening deployment state.');
    }
    else if (s.opening)
        issues.push('Opening deployment state outside opening phase.');
    if (s.campaignRuntime && (!Array.isArray(s.campaignRuntime.withdrawn) || s.campaignRuntime.withdrawn.some(id => !kingdomIds.has(id)) || s.campaignRuntime.reservedMonsters !== undefined && (!Array.isArray(s.campaignRuntime.reservedMonsters) || s.campaignRuntime.reservedMonsters.some(id => !Advanced.monsterById(id))) || s.campaignRuntime.abandonedLairs !== undefined && (!Array.isArray(s.campaignRuntime.abandonedLairs) || s.campaignRuntime.abandonedLairs.some(id => !hexIds.has(id))) || s.campaignRuntime.pendingAbandon !== undefined && (!Array.isArray(s.campaignRuntime.pendingAbandon) || s.campaignRuntime.pendingAbandon.some(side => !['invader', 'resistance'].includes(side)))))
        return [...issues, 'Invalid campaign runtime state.'];
    if (!integer(s.turnIndex, 0, s.scenario.turnOrder.length - 1) || s.currentKingdom !== s.scenario.turnOrder[s.turnIndex])
        issues.push('Current Kingdom and turn order disagree.');
    if (!integer(s.serial, 1, 10000000) || !integer(s.turnSerial, 0, 10000000) || !integer(s.remainingMP, -100, 100))
        issues.push('Invalid activation counters.');
    for (const key of ['allRoad', 'moved', 'shipUsed'])
        if (typeof s[key] !== 'boolean')
            issues.push(`Invalid ${key} flag.`);
    if (!Array.isArray(s.log) || s.log.length > 250 || s.log.some(l => typeof l !== 'string' || l.length > 2000))
        issues.push('Invalid game log.');
    for (const key of ['razed', 'covens', 'covenProtected', 'newlyFriendly', 'incomeActionsUsed'])
        if (!Array.isArray(s[key]) || s[key].length > 5000 || s[key].some(v => typeof v !== 'string' || v.length > 100))
            issues.push(`Invalid ${key} list.`);
    if (issues.some(i => i.startsWith('Invalid ') && i.endsWith(' list.')))
        return issues;
    if (!s.controls || typeof s.controls !== 'object' || Array.isArray(s.controls))
        return [...issues, 'Invalid control markers.'];
    if (s.activeUnitId !== null && typeof s.activeUnitId !== 'string')
        issues.push('Invalid active Army pointer.');
    if (s.winner !== null && !['invader', 'resistance'].includes(s.winner))
        issues.push('Invalid winning side.');
    if ((s.phase === 'game-over') !== (s.winner !== null) || typeof s.victoryReason !== 'string' || s.victoryReason.length > 2000)
        issues.push('Invalid terminal game result.');
    for (const h of s.hexes)
        if (!Number.isFinite(h.q) || !Number.isFinite(h.r) || typeof h.id !== 'string')
            issues.push('Invalid board coordinates.');
    for (const k of s.kingdoms) {
        if (!integer(k.gold, 0, 1000000) || !integer(k.income, 0, 10000) || !['human', 'ai'].includes(k.controller) || (k.revolt !== undefined && !integer(k.revolt, 0, k.collapsed || !canCollapse(s, k.id) ? 10000 : 19)) || typeof k.collapsed !== 'boolean' || typeof k.hasEverControlled !== 'boolean')
            issues.push(`Invalid resources/controller for ${k.id}.`);
        const original = s.scenario.kingdoms.find(o => o.id === k.id);
        if (!original || original.side !== k.side || original.name !== k.name || original.controlLimit !== k.controlLimit || original.cityCollapseThreshold !== k.cityCollapseThreshold)
            issues.push(`Kingdom ${k.id} disagrees with campaign definition.`);
        if (k.collapsed && s.units.some(u => u.kingdom === k.id))
            issues.push(`Collapsed Kingdom ${k.id} has Armies.`);
    }
    let transit = null;
    const findTransit = (p, depth = 0) => { if (!p || depth > 40)
        return; if (p.kind === 'window' && ['movement', 'entry'].includes(p.window) && !p.event?.advance && !p.event?.bonus && Array.isArray(p.event?.path) && p.event.path.length)
        transit = p.event; findTransit(p.resume, depth + 1); findTransit(p.immediateResume, depth + 1); };
    findTransit(s.advanced?.pending);
    const movingIds = transit && s.activeUnitId ? Advanced.stackIds(s, s.activeUnitId) : [];
    const inTransit = (u) => !!transit && movingIds.includes(u.id) && u.hexId === transit.enteredHex;
    for (const u of s.units) {
        if (unitIds.has(u.id))
            issues.push('Duplicate Army instance IDs.');
        unitIds.add(u.id);
        if (typeof u.id !== 'string' || !/^unit-[1-9][0-9]*$/.test(u.id) || Number(u.id.slice(5)) >= s.serial || typeof u.weakened !== 'boolean' || typeof u.activated !== 'boolean')
            issues.push(`Invalid Army flags/identity for ${u.id}.`);
        if (!hexIds.has(u.hexId) || !defIds.has(u.defId) || !kingdomIds.has(u.kingdom))
            issues.push(`Invalid Army ${u.id}.`);
        const definition = s.unitDefinitions.find(d => d.id === u.defId);
        if (definition?.kingdom !== u.kingdom && !s.advanced?.enslaved?.[u.id] && !(s.scenario.sourceCampaign && (actingKingdom(s, definition?.kingdom ?? '') === u.kingdom || campaignRules(s).some(r => r.type === 'fixed-defender' && r.defId === u.defId && r.hexId === u.hexId))))
            issues.push(`Army ${u.id} belongs to the wrong Kingdom.`);
        if (campaignRules(s).some(r => r.type === 'fragile-defender' && r.defId === u.defId && r.hexId !== u.hexId))
            issues.push(`Anchored defender ${u.id} left its source location.`);
        if (definition && characteristic(definition, 'fragile') && u.weakened)
            issues.push(`Fragile Army ${u.id} cannot be weakened.`);
        const h = s.hexes.find(h => h.id === u.hexId), passing = !!h && inTransit(u) && canPass(s, u, h, !!transit.ship);
        if (h && (h.prohibited || !passing && (h.terrain === 'lair' || (h.terrain === 'sea' && h.entry !== u.kingdom) || (h.entry && h.entry !== u.kingdom))))
            issues.push(`Army ${u.id} occupies prohibited terrain.`);
        const occupants = s.units.filter(v => v.hexId === u.hexId && !(transit && movingIds.includes(v.id) && inTransit(v)));
        if (!passing && occupants.length > 1 && !(s.advanced && occupants.length === 2 && occupants.filter(v => Advanced.isHero(s, v)).length === 1 && occupants.every(v => v.kingdom === u.kingdom))) {
            const active = occupants.find(v => v.id === s.activeUnitId);
            if (occupants.length !== 2 || !active || active.activated || occupants.some(v => v.kingdom !== active.kingdom) || !occupants.some(v => v.id !== active.id && v.activated))
                issues.push('Illegal Army stacking.');
        }
    }
    for (const d of s.unitDefinitions)
        if (s.units.filter(u => u.defId === d.id).length > d.count)
            issues.push(`Army supply exceeded for ${d.name}.`);
    for (const [id, k] of Object.entries(s.controls ?? {}))
        if (!hexIds.has(id) || (!kingdomIds.has(k) && !(s.scenario.sourceCampaign && s.unitDefinitions.some(d => d.kingdom === k))) || !s.hexes.find(h => h.id === id)?.settlement)
            issues.push('Invalid control marker.');
    for (const k of s.kingdoms)
        if (Object.values(s.controls).filter(id => id === k.id).length + (k.id === 'night' ? s.covens.length : 0) > controlCapacity(k))
            issues.push(`Control/Coven marker supply exceeded for ${k.name}.`);
    for (const id of [...s.razed ?? [], ...s.covens ?? []])
        if (!hexIds.has(id) || !s.hexes.find(h => h.id === id)?.settlement)
            issues.push('Invalid razed/Coven marker.');
    if (s.activeUnitId && !unitIds.has(s.activeUnitId))
        issues.push('Active Army does not exist.');
    if (s.pendingCombat) {
        const p = s.pendingCombat;
        if ((!unitIds.has(p.attackerId) && !s.advanced?.battle) || !hexIds.has(p.targetHex) || !['ambush', 'advance', 'settlement'].includes(p.stage) || !kingdomIds.has(p.decisionKingdom) || s.phase !== 'activation' || (!s.advanced?.battle && (!s.activeUnitId || !Advanced.stackIds(s, s.activeUnitId).includes(p.attackerId))))
            issues.push('Invalid pending combat.');
    }
    if (s.activeUnitId && (s.phase !== 'activation' || s.units.find(u => u.id === s.activeUnitId)?.kingdom !== s.currentKingdom && s.advanced?.grant?.unitId !== s.activeUnitId || s.units.find(u => u.id === s.activeUnitId)?.activated))
        issues.push('Invalid active Army status.');
    if (new Set(s.razed).size !== s.razed.length || new Set(s.covens).size !== s.covens.length)
        issues.push('Duplicate settlement markers.');
    for (const id of s.razed)
        if (s.controls[id] || s.covens.includes(id) && !Advanced.covensProtected(s))
            issues.push('Razed settlement has conflicting markers.');
    const checkCombat = (r) => {
        if (!r || typeof r !== 'object' || !['attacker', 'defender', 'tie', 'draw', 'ambush'].includes(r.result) || !hexIds.has(r.targetHex) || !Array.isArray(r.attackerRolls) || !Array.isArray(r.defenderRolls))
            return false;
        for (const key of ['attackerSuccesses', 'defenderSuccesses', 'attackerHits', 'defenderHits'])
            if (!integer(r[key], 0, 500))
                return false;
        for (const pool of [r.attackerRolls, r.defenderRolls]) {
            if (pool.length > 150)
                return false;
            for (const die of pool)
                if (![6, 8].includes(die.sides) || !integer(die.raw, 1, die.sides) || !integer(die.modified, -100, 100) || typeof die.success !== 'boolean' || typeof die.critical !== 'boolean' || (die.confirmation !== undefined && !integer(die.confirmation, 1, s.advanced ? 8 : 6)))
                    return false;
        }
        return true;
    };
    if (s.lastCombat !== null && !checkCombat(s.lastCombat))
        issues.push('Invalid combat receipt.');
    if (s.pendingCombat?.result && !checkCombat(s.pendingCombat.result))
        issues.push('Invalid pending combat receipt.');
    for (const id of s.scenario.turnOrder)
        if (!kingdomIds.has(id))
            issues.push('Campaign turn order references missing Kingdom.');
    for (const id of s.scenario.objective.hexIds)
        if (!hexIds.has(id))
            issues.push('Campaign objective references missing hex.');
    if (s.scenario.turnOrder.length < 2 || s.scenario.turnOrder.length > 6)
        issues.push('Campaign requires 2–6 Kingdoms.');
    issues.push(...Advanced.validateAdvanced(s), ...validateCompanionShape(s.companion, s));
    return issues;
}
export const exportGame = (s) => JSON.stringify(s, null, 2);
export function importGame(json) {
    if (typeof json !== 'string' || json.length > 20_000_000)
        throw new Error('Saved game exceeds 20 MB.');
    const value = JSON.parse(json), issues = validateState(value);
    if (issues.length)
        throw new Error(issues.join('; '));
    const s = value;
    validateContentPack({ version: 1, hexes: s.hexes, unitDefinitions: s.unitDefinitions, scenario: s.scenario });
    return s;
}
export function consumeTableHit(s) { if (!s.tabletop)
    throw new Error('This is not a tabletop campaign.'); Advanced.consumeTableHit(s, advancedContext()); Advanced.flushAdvancedEvents(s, advancedContext()); canonicalizeAdvanced(s); }
export const advancedActor = (s) => s.phase === 'opening' || s.campaignRuntime?.pendingAbandon?.length || s.campaignRuntime?.pendingBitterDisplacement ? s.currentKingdom : s.tabletop?.review ? Advanced.playerFor(s, s.currentKingdom)?.id === s.tabletop.review.playerId ? s.currentKingdom : s.advanced.players.find(p => p.id === s.tabletop.review.playerId).kingdoms[0] : Advanced.advancedActor(s);
const ADVANCED_ACTIONS = new Set(['winter-ruling', 'store-satchel', 'remove-curse', 'play-card', 'hero-power', 'magic-pass', 'study', 'finish-study', 'sell-treasure', 'finish-winter', 'recruit-hero', 'drop-hero', 'drop-army', 'request-cantrip', 'join-stack', 'allocate-hit', 'accept-hit', 'explore-lair', 'attack-monster', 'monster-strike', 'monster-pass', 'slink-away', 'command-monster', 'magic-choice']);
function moveAdvancedStep(s, id, toId, ship, join) {
    const u = s.units.find(v => v.id === id);
    if (!u)
        return false;
    const from = u.hexId, to = hexById(s, toId), group = Advanced.stackIds(s, id);
    if (toId !== from && group.some(id => anchoredDefender(s, unitById(s, id))))
        return false;
    if (!adjacent(s, from, toId) || !canCross(s, u, from, toId, ship) || !canPass(s, u, to, ship))
        return false;
    restoreCampaignLoyalty(s, u, toId);
    for (const member of group) {
        const v = unitById(s, member);
        if (!ship)
            s.advanced.movement[member] = (s.advanced.movement[member] ?? defOf(s, v).movement) - movementCost(s, v, from, to);
        v.hexId = toId;
    }
    razeMagicOccupancy(s, group, toId);
    if (!ship) {
        s.remainingMP = Math.min(...group.map(id => s.advanced.movement[id]));
        s.allRoad = s.allRoad && !!edge(s, from, toId).road && !ability(defOf(s, u), 'flying');
        s.moved = true;
    }
    const partner = join && group.length === 1 ? s.units.find(v => !group.includes(v.id) && v.hexId === toId && v.kingdom === u.kingdom && Advanced.isHero(s, v) !== Advanced.isHero(s, u)) : undefined;
    if (partner) {
        s.advanced.stacks[Advanced.isHero(s, u) ? u.id : partner.id] = Advanced.isHero(s, u) ? partner.id : u.id;
        s.advanced.activationIds = Advanced.stackIds(s, id);
        s.advanced.movement[partner.id] ??= defOf(s, partner).movement;
        if (partner.activated)
            finishActivation(s);
    }
    return true;
}
function restoreCampaignLoyalty(s, u, hexId) {
    for (const r of campaignRules(s))
        if (r.type === 'restore-loyalty' && r.hexId === hexId && r.kingdom === u.kingdom && s.controls[hexId] === r.controller) {
            delete s.controls[hexId];
            gainIncome(s, u.kingdom);
            loseIncome(s, r.controller);
            log(s, `${hexById(s, hexId).settlement.name} peacefully restores its loyalty; no Loot.`);
        }
}
function advancedContext() {
    return { log, die: randomDie, hex: hexById, unit: unitById, def: defOf, rawDef, sameSide, adjacent: adjacentHexes, welcoming: isWelcoming, controller: settlementController, besieged: isBesieged, canEnd, buildLocations, recoverable, finish: finishActivation, start: startActivation, hit: hitArmy, forecast: combatForecast, complete: completeCombat, advanceTurn, raze, entered: (s, ids, hex) => { razeMagicOccupancy(s, ids, hex); }, moveStep: moveAdvancedStep, advance: (s, id, to) => advanceInto(s, id, to, true),
        attackTargets: (s, id) => { const u = unitById(s, id); return adjacentHexes(s, u.hexId).filter(h => canAttack(s, u, h, true) || !siege(defOf(s, u)) && s.advanced.monsters.some(m => m.hexId === h.id && (!m.kingdom || !sameSide(s, m.kingdom, u.kingdom)))); },
        canAdvance: (s, id, to) => { const u = unitById(s, id), h = hexById(s, to), group = Advanced.stackIds(s, id); return !group.some(id => anchoredDefender(s, unitById(s, id))) && adjacent(s, u.hexId, to) && canCross(s, u, u.hexId, to) && !h.prohibited && h.terrain !== 'sea' && h.terrain !== 'lair' && (!h.entry || h.entry === u.kingdom) && !s.advanced?.monsters.some(m => m.hexId === to) && !s.units.some(v => v.hexId === to && !group.includes(v.id) && (!Advanced.isHero(s, v) || sameSide(s, v.kingdom, u.kingdom) && (v.kingdom !== u.kingdom || group.some(x => Advanced.isHero(s, unitById(s, x)))))) && !(characteristic(defOf(s, u), 'huge') && isWelcoming(s, h, u.kingdom)); },
        bonusSteps: (s, id) => { const u = unitById(s, id); return adjacentHexes(s, u.hexId).filter(h => canCross(s, u, u.hexId, h.id) && canEnd(s, u, h)); },
        bonusMove: (s, id, to) => { const moving = unitById(s, id); for (const hero of s.units.filter(v => v.hexId === to && !sameSide(s, v.kingdom, moving.kingdom) && Advanced.isHero(s, v)))
            hitArmy(s, hero.id, 1); for (const member of Advanced.stackIds(s, id))
            unitById(s, member).hexId = to; razeMagicOccupancy(s, Advanced.stackIds(s, id), to); log(s, `The Sacred Banner moves its stack one hex to ${hexById(s, to).settlement?.name ?? to}.`); },
        attack: (s, id, to) => { const u = unitById(s, id); startActivation(s, u); const f = combatForecast(s, id, to); s.pendingCombat = { attackerId: id, targetHex: to, stage: 'ambush', decisionKingdom: f.defenderCanAmbush ? s.units.find(v => v.id === f.defenderUnitId)?.kingdom ?? s.advanced.monsters.find(m => m.id === f.defenderUnitId)?.kingdom ?? u.kingdom : u.kingdom, ...(f.defenderUnitId ? { defenderUnitId: f.defenderUnitId } : {}) }; Advanced.startBattleMagic(s, advancedContext()); }, claimCoven: (s, id) => { const h = hexById(s, id), owner = settlementController(s, h); loseIncome(s, owner); s.covens = s.covens.filter(x => x !== id); s.controls[id] = 'night'; gainIncome(s, 'night'); kingdomOf(s, 'night').hasEverControlled = true; s.newlyFriendly.push(id); log(s, 'Knives in the Dark: all enemies eliminated; flip the Coven to Night control.'); }, seaEdge: (s, from, to) => !!edge(s, from, to).sea, seaCoastalEdge: (s, from, to) => !!(edge(s, from, to).sea || edge(s, from, to).coastal) };
}
function canonicalizeAdvanced(s) { if (s.advanced && s.activeUnitId)
    s.remainingMP = Math.min(...Advanced.stackIds(s, s.activeUnitId).map(id => s.advanced.movement[id] ?? defOf(s, unitById(s, id)).movement)); const clean = (v) => { if (!v || typeof v !== 'object')
    return; for (const key of Object.keys(v)) {
    if (v[key] === undefined)
        delete v[key];
    else
        clean(v[key]);
} }; clean(s.advanced); clean(s.pendingCombat); }
