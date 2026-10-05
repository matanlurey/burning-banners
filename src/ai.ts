import type { Action, GameState, Hex, Unit, UnitDefinition } from './engine.js';
import { adjacentHexes, combatForecast, isBesieged, isWelcoming, legalActions, settlementController } from './engine.js';
import { visibleMessages } from './async-play.js';
import type { CampaignMessage } from './async-play.js';
import type { CampaignCondition } from './campaign-runtime.js';
import { advancedActor, adjustedDice, cardById, effectiveDefinition, isHero, monsterById, playerFor, stackIds, magicUnit } from './advanced.js';
export type AIDifficulty = 'easy' | 'normal' | 'hard';
export const AI_DIFFICULTIES = [
    { id: 'easy' as const, name: 'Easy', description: 'A forgiving commander: conservative attacks, little Magic, simple expansion.' },
    { id: 'normal' as const, name: 'Normal', description: 'The original balanced commander: builds, recovers, advances and uses straightforward Powers.' },
    { id: 'hard' as const, name: 'Hard', description: 'Objective-focused tactics, threat-aware movement, economy planning and target-aware Magic. No hidden-hand or dice foreknowledge.' },
];
export const aiDecisionSummary = (_state: GameState, difficulty: AIDifficulty) => AI_DIFFICULTIES.find(d => d.id === difficulty)?.description ?? AI_DIFFICULTIES[1].description;
let decisionCache: {
    state: GameState;
    goals: Map<string, {
        hex: Hex;
        weight: number;
    }[]>;
    potential: Map<string, number>;
    exposure: Map<string, number>;
    sourceGoals: Map<string, SourceGoal[]>;
    hexById: Map<string,Hex>;
} | null = null;
const distance = (a: Hex, b: Hex) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
const ownSide = (s: GameState, kingdom: string) => s.kingdoms.find(k => k.id === kingdom)?.side;
const allied = (s: GameState, a: string, b: string) => a === b || !!ownSide(s, a) && ownSide(s, a) === ownSide(s, b);
const hBy = (s: GameState, id: string) => decisionCache?.state===s?decisionCache.hexById.get(id):s.hexes.find(h => h.id === id);
const uBy = (s: GameState, id: string | undefined) => s.units.find(u => u.id === id);
const raw = (s: GameState, u: Unit) => s.unitDefinitions.find(d => d.id === u.defId)!;
const def = (s: GameState, u: Unit) => effectiveDefinition(s, u, raw(s, u));
const army = (s: GameState, u: Unit) => !isHero(s, u);
const diceValue = (light: number, heavy: number) => light / 3 + heavy * (7 / 12);
function ownPool(s: GameState, u: Unit) { const d = def(s, u); return adjustedDice(s, u.id, { light: u.weakened ? d.weakenedLight ?? d.light : d.light, heavy: u.weakened ? d.weakenedHeavy ?? d.heavy : d.heavy }, false); }
function material(s: GameState, u: Unit): number { const d = def(s, u), p = ownPool(s, u); return isHero(s, u) ? 2.7 + d.heavy * 1.5 + (d.abilities.includes('mage') ? 0.5 : 0) : d.cost * 0.6 + diceValue(p.light, p.heavy) * 3 + (u.weakened ? 0 : 1.2); }
function seasonsLeft(s: GameState): number { return Math.max(0, (s.scenario.endYear - s.year) * 3 + s.scenario.endSeason - s.season); }
type SourceGoal = {hex:Hex;weight:number;metric:string;eligible:string[];achieved:boolean;pursue:boolean};
function eligibleKingdoms(s:GameState,c:{kingdoms?:string[];side?:'invader'|'resistance'}):string[]{return c.kingdoms??s.kingdoms.filter(k=>!c.side||k.side===c.side).map(k=>k.id);}
function conditionHexes(s:GameState,c:Extract<CampaignCondition,{type:'count'}>):Hex[]{return s.hexes.filter(h=>h.settlement&&(!c.hexIds||c.hexIds.includes(h.id))&&(!c.loyalties||c.loyalties.includes(h.settlement.loyalty??null)));}
/** Public campaign objectives, including occupation and denial. A kingdom may
 * reinforce an allied claimant, but capturing under its own banner cannot meet
 * a condition that explicitly requires the ally's markers. */
function sourceGoals(s:GameState,actor:string):SourceGoal[]{
    const cache=decisionCache?.state===s?decisionCache.sourceGoals:undefined,cached=cache?.get(actor);if(cached)return cached;
    const victory=s.scenario.sourceCampaign?.victory;if(!victory)return [];
    const side=ownSide(s,actor),urgency=18+20/(seasonsLeft(s)+1),out:SourceGoal[]=[];
    const push=(hex:Hex,weight:number,metric:string,eligible:string[],achieved:boolean,pursue:boolean)=>{if(!hex.prohibited&&!hex.prohibitedFor?.includes(actor))out.push({hex,weight,metric,eligible,achieved,pursue});};
    const visit=(c:CampaignCondition,winner:'invader'|'resistance',weight=urgency):void=>{
        if(c.type==='all'||c.type==='any'){for(const part of c.conditions)visit(part,winner,weight);return;}
        if(c.type==='count'){
            if(c.atLeast> s.hexes.filter(h=>h.settlement).length)return; // A prevention-only deadline has no capture target.
            const eligible=eligibleKingdoms(s,c),pursue=winner===side,claimant=eligible.includes(actor);
            for(const h of conditionHexes(s,c)){
                const owner=s.razed.includes(h.id)?undefined:settlementController(s,h),marker=!!s.controls[h.id]&&eligible.includes(s.controls[h.id]);
                const occupied=s.units.some(u=>u.hexId===h.id&&eligible.includes(u.kingdom)&&(c.metric==='presence'||army(s,u)));
                const achieved=c.metric==='controlled'?!!owner&&eligible.includes(owner):c.metric==='markers'?marker:c.metric==='controlled-or-razed'?s.razed.includes(h.id)||!!owner&&eligible.includes(owner):c.metric==='occupied'?occupied:marker||occupied;
                // Razing is irreversible in some scenarios; those already razed
                // targets do not offer an opposing side a useful denial route.
                if(s.razed.includes(h.id)&&c.metric==='controlled-or-razed'&&!pursue)continue;
                push(h,weight*(pursue&&!claimant?0.45:1),c.metric,eligible,achieved,pursue);
            }
            return;
        }
        if(c.type==='collapse'){
            for(const k of c.kingdoms)for(const h of s.hexes.filter(h=>!s.razed.includes(h.id)&&h.settlement&&(h.settlement.city&&h.settlement.loyalty===k||['orcs','goblins'].includes(k)&&s.controls[h.id]===k))){
                const enemy=ownSide(s,k)!==side,owner=settlementController(s,h),eligible=s.kingdoms.filter(k=>k.side===(enemy?side:side==='invader'?'resistance':'invader')).map(k=>k.id);
                push(h,weight+8+Number(['orcs','goblins'].includes(k)&&Object.values(s.controls).filter(v=>v===k).length===1)*14,'collapse',eligible,!!owner&&eligible.includes(owner),enemy);
            }
            return;
        }
        if(c.type==='income'){
            const enemy=ownSide(s,c.kingdom)!==side,eligible=s.kingdoms.filter(k=>k.side===(enemy?side:side==='invader'?'resistance':'invader')).map(k=>k.id);
            for(const h of s.hexes.filter(h=>h.settlement&&!s.razed.includes(h.id)&&(settlementController(s,h)===c.kingdom||h.settlement.loyalty===c.kingdom)))push(h,weight,'income',eligible,eligible.includes(settlementController(s,h)??''),enemy);
            return;
        }
        const claimant=s.kingdoms.find(k=>k.side===c.side)?.id;
        for(const h of s.hexes.filter(h=>h.settlement?.city&&!s.razed.includes(h.id)&&claimant&&!isWelcoming(s,h,claimant,true)))push(h,weight+12,'occupied',eligibleKingdoms(s,c),s.units.some(u=>u.hexId===h.id&&army(s,u)&&ownSide(s,u.kingdom)===c.side),winner===side);
    };
    for(const r of victory.immediate??[])visit(r.condition,r.winner,urgency+(r.check==='action'?8:3));
    const d=victory.deadline;
    if(d.type==='condition')visit(d.condition,d.winner);
    else {
        const eligible=s.kingdoms.filter(k=>k.side===side).map(k=>k.id);
        for(const h of s.hexes.filter(h=>h.settlement&&!s.razed.includes(h.id)&&(!d.hexIds||d.hexIds.includes(h.id)))){
            const achieved=d.metric==='markers'?!!s.controls[h.id]&&eligible.includes(s.controls[h.id]):eligible.includes(settlementController(s,h)??'');
            // A printed loyal settlement already welcoming to its own kingdom
            // cannot earn another marker merely by stationing an army there.
            if(d.metric==='markers'&&eligible.includes(h.settlement!.loyalty??'')&&!s.controls[h.id])continue;
            push(h,urgency,d.metric,eligible,achieved,true);
        }
    }
    cache?.set(actor,out);return out;
}
function objectiveWeight(s: GameState, h: Hex, actor=advancedActor(s)): number {
    if(s.scenario.sourceCampaign)return Math.max(0,...sourceGoals(s,actor).filter(g=>g.hex.id===h.id).map(g=>g.weight));
    return s.scenario.objective.hexIds.includes(h.id) ? 14 + 18 / (seasonsLeft(s) + 1) : 0;
}
function requiresControl(s:GameState,h:Hex,actor:string):boolean{
    if(!s.scenario.sourceCampaign)return s.scenario.objective.type==='control'&&!!objectiveWeight(s,h,actor);
    return sourceGoals(s,actor).some(g=>g.hex.id===h.id&&g.pursue&&g.eligible.includes(actor)&&['controlled','markers','presence','settlements','income'].includes(g.metric));
}
function alliedClaim(s:GameState,h:Hex,actor:string):boolean{return sourceGoals(s,actor).some(g=>g.hex.id===h.id&&g.pursue&&!g.eligible.includes(actor)&&g.eligible.some(k=>allied(s,k,actor))&&['controlled','markers'].includes(g.metric));}
function settlementValue(s: GameState, h: Hex, k: string): number {
    if (!h.settlement || s.razed.includes(h.id))
        return 0;
    const shashka = k === 'orcs' || k === 'goblins', owner = settlementController(s, h);
    let value = 4 + Number(h.settlement.city) * 3 + objectiveWeight(s, h) + (shashka ? 0 : Math.min(6, seasonsLeft(s) * 1.2));
    const rivalry=s.scenario.sourceCampaign?.competitiveInvaders;
    if(rivalry&&ownSide(s,k)==='invader'){
        const markers=(id:string)=>Object.values(s.controls).filter(owner=>owner===id).length;
        const lead=markers(rivalry.leadKingdom)-markers(rivalry.otherKingdom);
        // A bounded personal-race bonus follows the shared campaign reward.
        if(k===rivalry.leadKingdom&&lead<rivalry.requiredMarkerLead||k===rivalry.otherKingdom&&lead>=rivalry.requiredMarkerLead-1)value+=5;
    }
    const original = s.hexes.filter(t => t.settlement?.city && t.settlement.loyalty === owner && (s.advanced as {
        khazud?: string;
    })?.khazud !== t.id);
    if (owner && !allied(s, owner, k) && h.settlement.city && original.length) {
        const remaining = original.filter(t => !s.razed.includes(t.id) && isWelcoming(s, t, owner));
        if (remaining.length === 1 && remaining[0].id === h.id)
            value += 22;
    }
    return value;
}
function targetGoals(s: GameState, k: string): {
    hex: Hex;
    weight: number;
}[] {
    const cached = decisionCache?.state === s ? decisionCache.goals.get(k) : undefined;
    if (cached)
        return cached;
    const objective = s.scenario.objective;
    const invader = ownSide(s, k) === 'invader';
    const out: {
        hex: Hex;
        weight: number;
    }[] = [];
    if(s.scenario.sourceCampaign){
        const enemies=s.units.filter(u=>army(s,u)&&!allied(s,k,u.kingdom));
        for(const g of sourceGoals(s,k)){
            const desired=g.pursue?g.achieved:!g.achieved;
            if(!desired)out.push({hex:g.hex,weight:g.weight});
            else {
                const threat=Math.min(...enemies.map(u=>distance(g.hex,hBy(s,u.hexId)!)),99);
                if(threat<=5)out.push({hex:g.hex,weight:g.weight*(6-threat)/6});
            }
        }
    }
    else if (objective.type === 'control')
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
                const threat = Math.min(...enemies.map(u => distance(h, hBy(s, u.hexId)!)), 99);
                if (threat <= 5)
                    out.push({ hex: h, weight: objectiveWeight(s, h) * (6 - threat) / 6 });
            }
        }
    if (!s.scenario.sourceCampaign&&objective.type === 'survival' && invader) {
        const survivor = objective.kingdom ?? k;
        for (const h of s.hexes.filter(h => h.settlement?.city && h.settlement.loyalty === survivor && !s.razed.includes(h.id)))
            out.push({ hex: h, weight: 24 });
    }
    for (const h of s.hexes)
        if (h.settlement && !s.razed.includes(h.id) && !isWelcoming(s, h, k))
            out.push({ hex: h, weight: settlementValue(s, h, k) * 0.6 });
    if (!out.length)
        for (const u of s.units.filter(u => army(s, u) && !allied(s, k, u.kingdom)))
            out.push({ hex: hBy(s, u.hexId)!, weight: 5 });
    if (decisionCache?.state === s)
        decisionCache.goals.set(k, out);
    return out;
}
function potential(s: GameState, h: Hex, k: string): number {
    const key = k + ':' + h.id, cache = decisionCache?.state === s ? decisionCache.potential : undefined, cached = cache?.get(key);
    if (cached !== undefined)
        return cached;
    const goals = targetGoals(s, k), value = goals.length ? Math.max(...goals.map(g => g.weight / (distance(h, g.hex) + 1))) : 0;
    cache?.set(key, value);
    return value;
}
function exposedValue(s: GameState, u: Unit, at: Hex): number {
    // A public-state one-turn threat estimate, with no enemy hand inspection.
    const key = u.id + ':' + at.id, cache = decisionCache?.state === s ? decisionCache.exposure : undefined, cached = cache?.get(key);
    if (cached !== undefined)
        return cached;
    let risk = 0;
    const clone = { ...s, units: s.units.map(v => stackIds(s, u.id).includes(v.id) ? { ...v, hexId: at.id } : v) };
    for (const enemy of s.units.filter(v => army(s, v) && !allied(s, u.kingdom, v.kingdom) && distance(hBy(s, v.hexId)!, at) === 1)) {
        const f = combatForecast(clone, enemy.id, at.id);
        risk = Math.max(risk, Math.max(0, f.attackerExpected - f.defenderExpected) * 2 + Number(u.weakened) * f.attackerExpected);
    }
    cache?.set(key, risk);
    return risk;
}
function tacticalFollowup(s: GameState, u: Unit, to: Hex, pathCost: number): number {
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
const poolCache = new Map<string, number[]>();
function successDistribution(light: number, heavy: number, penalty: number): number[] {
    const key = light + ':' + heavy + ':' + penalty, cached = poolCache.get(key);
    if (cached)
        return cached;
    let distribution = [1];
    const lp = Math.max(0, 7 - (5 + penalty)) / 6, hp = Math.max(0, 9 - (5 + penalty)) / 8, critical = Math.max(0, 9 - (7 + penalty)) / 8 / 3;
    for (const [count, die] of [[light, [1 - lp, lp]], [heavy, [1 - hp, hp - critical, critical]]] as [
        number,
        number[]
    ][]) {
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
function battleProbabilities(s: GameState, attacker: Unit, target: Unit | undefined, f: ReturnType<typeof combatForecast>) {
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
function cardReserve(id: string): number {
    const c = cardById(id);
    if (!c)
        return 1;
    const e = c.effect;
    return 1.5 + (e.strike ? diceValue(e.strike.light ?? 0, e.strike.heavy ?? 0) * 2 : 0) + Number(!!e.cancelCardTypes || !!e.cancelCard) * 2 + Number(!!e.recoverArmy || !!e.negateHits) * 1.5 + (Math.max(0, e.light ?? 0) + Math.max(0, e.heavy ?? 0) * 1.5) * 0.5 + Number(!!e.gainTreasures) * 2 + Number(id === 'treasure-02') * 5;
}
function publicTargetKingdom(s: GameState, id: string | undefined): string | undefined {
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
function cardScore(s: GameState, a: Extract<Action, {
    type: 'play-card' | 'hero-power';
}>, actor: string): number {
    const c = cardById(a.cardId)!;
    if (!c)
        return -80;
    const e = { ...c.effect, ...c.effect.choices?.[Number(a.choice ?? 0)] }, target = a.targetId ?? a.casterId, unit = magicUnit(s, target), caster = magicUnit(s, a.casterId), owner = magicUnit(s,target)?.kingdom??publicTargetKingdom(s, target), friendly = !!owner && allied(s, actor, owner), sign = friendly ? 1 : -1;
    const b = s.advanced?.battle, p = s.advanced?.pending, inBattle = !!b, buffTime = inBattle || !!s.activeUnitId;
    let value = 0;
    if(e.cancelCasterHit||e.saveCasterHero||e.saveTargetHero)value+=unit&&friendly?20+material(s,unit):-20;
    if(e.type==='prince-of-deception'&&unit){const victim=uBy(s,a.choice),d=def(s,unit),pool=adjustedDice(s,unit.id,{light:unit.weakened?d.weakenedLight??d.light:d.light,heavy:unit.weakened?d.weakenedHeavy??d.heavy:d.heavy});if(victim)value+=Math.min(.99,1-Math.pow(2/3,pool.light)*Math.pow(.5,pool.heavy))*(material(s,victim)+4);}
    if(e.type==='fury-of-the-ancestors')value+=friendly?5:0;
    if(e.type==='your-true-rulers')value+=s.covens.filter(id=>s.units.some(u=>!allied(s,actor,u.kingdom)&&distance(hBy(s,id)!,hBy(s,u.hexId)!)<=3)).length*3;
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
            value += buffTime && friendly ? ({ stealth: 3, ranged: 2, flying: 1.5, regenerate: unit?.weakened ? 4 : 0 } as Record<string, number>)[ability] ?? 0 : 0;
        }
    }
    if (e.opponentSuccessThreshold)
        value += friendly && inBattle ? 4 : 0;
    if (e.recoverArmy)
        value += unit?.weakened && friendly ? material(s, unit) * 0.65 + 4 : -5;
    if (e.recoverAll)
        value += s.units.filter(u => u.kingdom === (c.kingdom ?? actor) && u.weakened).reduce((n, u) => n + material(s, u) * 0.6 + 2, 0);
    if (e.readyStack)
        value += unit && friendly && stackIds(s, unit.id).some(id => uBy(s, id)?.activated) ? 4 + potential(s, hBy(s, unit.hexId)!, actor) * 0.4 : -5;
    if (e.drawSpells)
        value += e.drawSpells * 2;
    if (e.drawBlessings)
        value += e.drawBlessings * 1.8;
    if (e.drawSpellsTo) {
        const count = s.advanced!.hands[a.playerId].filter(id => id !== a.cardId && cardById(id)?.kind === 'spell').length;
        value += Math.max(0, e.drawSpellsTo - count) * 2;
    }
    if (e.gold)
        value += e.gold * (s.kingdoms.find(k => k.id === (c.kingdom ?? caster?.kingdom ?? actor))!.gold < 4 ? 1.8 : 0.9);
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
        const k = s.kingdoms.find(k => k.id === 'empire')!, n = Number(a.choice);
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
        value += !friendly && unit ? 3 + objectiveWeight(s, hBy(s, unit.hexId)!) * 0.1 : -6;
    if (e.eliminateTargetHero)
        value += unit && !friendly ? material(s, unit) + 1 : -8;
    if (e.placeWanderingMonster) {
        const at = hBy(s, target ?? '');
        value += at ? Math.max(...s.units.filter(u => !allied(s, actor, u.kingdom)).map(u => 6 / (distance(at, hBy(s, u.hexId)!) + 1)), 0) : 0;
    }
    if (e.placeMagicallyFortifiedLoyalCity)
        value += 6;
    if (e.allowBuildAndRecoveryInOrAdjacentToBesiegedOathbornSettlements)
        value += s.hexes.filter(h => h.settlement?.loyalty === 'oathborn' && isBesieged(s, h.id)).length * 4;
    if (e.providedDieIgnoresAllFortification && b && uBy(s, b.attacker))
        value += combatForecast(s, b.attacker, b.targetHex).fortificationPenalty * 1.5;
    if (e.razeOccupiedSettlement && caster) {
        const at = hBy(s, caster.hexId)!;
        value -= isWelcoming(s, at, actor) ? settlementValue(s, at, actor) : 0;
    }
    if (a.targetHex && unit && friendly) {
        const from = hBy(s, unit.hexId)!, to = hBy(s, a.targetHex)!;
        value += Math.max(-5, (potential(s, to, actor) - potential(s, from, actor)) * 1.4) + exposedValue(s, unit, from) - exposedValue(s, unit, to);
    }
    if (e.eliminateCaster || e.eliminateSourceHero) {
        value -= caster ? material(s, caster) : 4;
    }
    if (e.eliminateCasterAndStackedReaversAfterCombat) {
        value -= caster ? stackIds(s, caster.id).reduce((n, id) => n + material(s, uBy(s, id)!), 0) : 8;
    }
    if (e.armyTakesHitsAfterCombat) {
        const member = unit && stackIds(s, unit.id).map(id => uBy(s, id)!).find(u => army(s, u));
        value -= member?.weakened ? material(s, member) * 0.9 : 2.5;
    }
    if (e.lockSource)
        value -= 0.25;
    if (a.costCardId)
        value -= a.costCardId.split(',').reduce((n, id) => n + cardReserve(id) * 0.8, 0);
    if (e.discardRandomSpells)
        value -= e.discardRandomSpells * 2;
    if (a.type === 'play-card' && a.tomeId) {
        const t = cardById(a.tomeId)!;
        value += (t.effect.drawSpells ?? 0) * 1.8 + (t.effect.drawBlessings ?? 0) * 1.6 + (t.effect.light ?? 0) * (inBattle ? 2 : 0) + (t.effect.discardCount ?? 0) * 1.2 - cardReserve(t.id) * 0.2;
    }
    // Save actual cards when the projected gain does not justify consuming them.
    return value - (a.type === 'hero-power' ? 0.2 : 1.5);
}
function constrainedOpeningPriority(s:GameState,kingdom:string):number{
    const spec=s.scenario.sourceCampaign!.opening.find(v=>v.kingdom===kingdom)!;
    const saved=kingdom===s.currentKingdom?s.opening:s.opening?.deployments[kingdom];
    const free=saved?saved.remainingFreeUnits:(spec.freeUnits??[]).flatMap(v=>Array.from({length:v.count},()=>v));
    let priority=free.filter(v=>!v.optional&&v.hexIds?.length).reduce((n,v)=>n+1/v.hexIds!.length,0);
    if(saved)for(const id of saved.remainingHeroes){const locations=saved.heroLocations[id];if(locations?.length)priority+=.5/locations.length;}
    else for(const hero of spec.extraHeroes??[])if(hero.hexIds?.length)priority+=hero.count*.5/hero.hexIds.length;
    return priority;
}
function openingScore(s:GameState,a:Action,actor:string,difficulty:AIDifficulty):number{
    const k=s.kingdoms.find(k=>k.id===actor)!,at='hexId' in a?hBy(s,a.hexId):undefined;
    const spec=s.scenario.sourceCampaign!.opening.find(v=>v.kingdom===actor)!;
    const location=at?potential(s,at,actor)*0.16:0;
    if(a.type==='opening-choice')return -1000;
    if(a.type==='opening-switch'){
        const priority=constrainedOpeningPriority(s,a.kingdom);
        // Allied setup is simultaneous. Place restricted free contingents before
        // another ally fills their few legal hexes with ordinary recruitment.
        return priority>constrainedOpeningPriority(s,actor)+.00001?200+priority:-100;
    }
    if(a.type==='opening-done')return 0;
    if(a.type==='opening-control'){
        const opponents=s.kingdoms.filter(enemy=>!allied(s,actor,enemy.id));
        // These markers precede the opponent's recruitment. An enemy can deploy
        // next to another welcoming town and besiege this one before our free
        // Heroes are placed. Keep the opening anchor beyond that build reach.
        const recruitThreat=at?s.hexes.filter(h=>h.id!==at.id&&h.settlement&&opponents.some(enemy=>isWelcoming(s,h,enemy.id))&&distance(at,h)<=2).reduce((n,h)=>n+20-distance(at!,h)*4,0):0;
        const occupied=at?s.units.some(u=>u.hexId===at.id):false;
        return 25+location+Number(at?.settlement?.fortified)*1.5-recruitThreat-Number(occupied)*20;
    }
    if(a.type==='opening-exchange-coven')return sourceGoals(s,actor).some(g=>g.pursue&&g.metric==='markers')?-10:s.covens.length===0?1:-10;
    if(a.type==='opening-coven')return 90+location+Number(at&&['forest','mountain','swamp'].includes(at.terrain))*2-Number(at?.settlement?.fortified)*2;
    if(a.type==='opening-hero'){
        const companion=s.units.find(u=>u.hexId===a.hexId&&army(s,u)),d=s.unitDefinitions.find(d=>d.id===a.defId)!;
        return 70+location+(companion?5+material(s,companion)*.25:0)+Number(d.abilities.includes('mage'))*.5;
    }
    if(a.type==='suppress')return (k.revolt??0)>=10?100:(k.revolt??0)>2&&k.gold>4?4:-1;
    if(a.type!=='opening-build')return -100;
    const d=s.unitDefinitions.find(d=>d.id===a.defId)!,free=s.opening?.remainingFreeUnits.find(u=>u.defId===d.id),count=s.units.filter(u=>u.kingdom===actor&&army(s,u)).length;
    const due=['orcs','goblins'].includes(actor)?Object.values(s.controls).filter(id=>id===actor).length:0;
    const reserve=spec.discardUnspent?0:due;
    if(!free&&k.gold-d.cost<reserve&&count>0)return -25;
    const controlNeeded=sourceGoals(s,actor).some(g=>g.pursue&&g.eligible.includes(actor)&&['controlled','markers','presence','settlements','income'].includes(g.metric));
    const cannotClaim=d.characteristics.some(c=>c==='feral'||c==='huge');
    const siege=d.characteristics.some(c=>c==='siege'||c==='siege-engine');
    const forts=targetGoals(s,actor).filter(g=>g.hex.settlement?.fortified&&!isWelcoming(s,g.hex,actor));
    const hasSiege=s.units.some(u=>u.kingdom===actor&&def(s,u).characteristics.some(c=>c==='siege'||c==='siege-engine'));
    const efficiency=(diceValue(d.light,d.heavy)*3+d.movement*.3)/Math.max(1,d.cost);
    let value=(free&&!free.optional?110:9)+location+efficiency-(difficulty==='easy'?d.cost*.4:d.cost*.12)-count*.35;
    if(difficulty==='hard'){
        // Pure hits-per-gold buys only Miners/fragile scouts. A viable opening
        // also needs units that can survive an exchange and take fortified towns.
        value+=diceValue(d.light,d.heavy)*1.8-Number(d.characteristics.includes('fragile'))*.8;
        const copies=s.units.filter(u=>u.kingdom===actor&&u.defId===d.id).length;
        value-=copies*.7;
        if(d.abilities.includes('ranged'))value+=.7;
        if(d.abilities.includes('flying'))value+=.6;
        if(d.abilities.includes('regenerate'))value+=.6;
        if(d.abilities.includes('mining')&&s.units.filter(u=>u.kingdom===actor&&def(s,u).abilities.includes('mining')).length>=2)value-=3;
    }
    if(controlNeeded&&cannotClaim)value-=difficulty==='hard'?4:2;
    if(siege)value+=difficulty==='hard'&&forts.some(g=>at&&distance(at,g.hex)<=6)&&!hasSiege?4:-5;
    if(d.abilities.includes('mining')&&at?.mine)value+=difficulty==='hard'?4:2;
    if(at&&s.units.some(u=>u.hexId===at.id&&isHero(s,u)))value+=3;
    if(difficulty==='hard'&&count>=2&&k.gold-d.cost<reserve+2&&!spec.discardUnspent)value-=4;
    return value;
}
function hardScore(s: GameState, a: Action, actor: string): number {
    if(s.phase==='opening')return openingScore(s,a,actor,'hard');
    const k = s.kingdoms.find(k => k.id === actor)!;
    switch (a.type) {
        case 'campaign-abandon': {
            const at=hBy(s,a.hexId)!,friendly=s.units.filter(u=>allied(s,actor,u.kingdom)),enemy=s.units.filter(u=>!allied(s,actor,u.kingdom));
            const ownDistance=Math.min(...friendly.map(u=>distance(at,hBy(s,u.hexId)!)),30),enemyDistance=Math.min(...enemy.map(u=>distance(at,hBy(s,u.hexId)!)),30);
            return (ownDistance-enemyDistance)*.7-potential(s,at,actor)*.1;
        }
        case 'campaign-displace': {
            const u=uBy(s,s.campaignRuntime?.pendingBitterDisplacement),to=hBy(s,a.toHex)!;
            return u?potential(s,to,actor)-exposedValue(s,u,to):0;
        }
        case 'opening-choice': return -1000;
        case 'opening-switch': return -1;
        case 'opening-control': return settlementValue(s,hBy(s,a.hexId)!,actor);
        case 'opening-exchange-coven': return 2;
        case 'opening-coven': return 30;
        case 'opening-hero': return 100;
        case 'opening-build': {const d=s.unitDefinitions.find(d=>d.id===a.defId)!;const required=s.opening?.remainingFreeUnits.some(u=>u.defId===d.id);return (required?100:8)+(d.light+d.heavy*1.3)/Math.max(1,d.cost)+d.movement*.3-Number(d.characteristics.includes('siege'))*2;}
        case 'opening-done': return 0;
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
            const u = uBy(s, a.unitId)!;
            if (isHero(s, u))
                return -material(s, u);
            if (u.weakened || def(s, u).characteristics.includes('fragile'))
                return -material(s, u);
            const pool = ownPool(s, u), d = def(s, u), weakened = adjustedDice(s, u.id, { light: d.weakenedLight ?? d.light, heavy: d.weakenedHeavy ?? d.heavy }, false);
            return -(1.2 + 3 * (diceValue(pool.light, pool.heavy) - diceValue(weakened.light, weakened.heavy)));
        }
        case 'study': {
            const hand = s.advanced!.hands[a.playerId].filter(id=>id!==a.discardId),spells=hand.filter(id=>cardById(id)?.kind==='spell').length;
            const drawCount=a.discipline==='spells'?Math.max(0,3-spells):a.discipline==='blessings'?s.advanced!.players.find(p=>p.id===a.playerId)!.kingdoms.filter(k=>!s.kingdoms.find(x=>x.id===k)?.collapsed&&!hand.some(id=>cardById(id)?.kind==='blessing'&&cardById(id)?.kingdom===k)).length:0;
            let n=drawCount*(a.discipline==='spells'?2.5:2.2);
            if(a.discardId)n-=cardReserve(a.discardId)*0.5;
            if(!drawCount&&a.discipline!=='treasures')return -1;
            if (a.treasureId)
                n = cardReserve(a.treasureId) * 1.6 + (a.secondTreasureId ? cardReserve(a.secondTreasureId) * 1.5 : 0);
            if(a.treasureId&&s.scenario.sourceCampaign?.victory.deadline.type==='score'&&s.scenario.sourceCampaign.victory.deadline.treasureMajorityPoint)n+=3/(seasonsLeft(s)+1);
            if (a.payKingdomId)
                n -= 1;
            return n;
        }
        case 'sell-treasure': {
            const p = s.advanced!.pending;
            const point=s.scenario.sourceCampaign?.victory.deadline.type==='score'&&s.scenario.sourceCampaign.victory.deadline.treasureMajorityPoint?3/(seasonsLeft(s)+1):0;
            return p?.kind === 'winter' ? 9 - cardReserve(a.cardId) + (a.cardId === 'treasure-02' ? -12 : 0) : p?.kind === 'satchel' ? -5 : k.gold < 2 ? 2 - cardReserve(a.cardId)-point : -20;
        }
        case 'remove-curse': return k.gold > 5 ? 3 : -5;
        case 'command-monster': return s.kingdoms.find(k => k.id === a.kingdomId)?.collapsed ? -90 : 8 - s.advanced!.monsters.filter(m => m.kingdom === a.kingdomId).length;
        case 'slink-away': {
            const m = s.advanced!.monsters.find(m => m.id === a.monsterId)!;
            const d = monsterById(m.defId)!;
            return s.advanced?.pending?.kind === 'command' ? -(d.light + d.heavy * 1.6) : -60;
        }
        case 'monster-pass': return -1;
        case 'monster-strike': {
            const target = uBy(s, a.targetId), m = s.advanced!.monsters.find(m => m.id === a.monsterId)!, d = monsterById(m.defId)!;
            return 4 + diceValue(d.light, d.heavy) + (target ? material(s, target) * (target.weakened ? 0.7 : 0.2) : objectiveWeight(s, hBy(s, a.targetId)!) * 0.2);
        }
        case 'magic-choice': {
            const p=s.advanced?.pending;if(p?.kind!=='choice')return 2;
            if(p.flow==='discard'||p.flow==='book-discard')return -cardReserve(a.value);
            if(p.flow==='return-card'||p.flow==='spy-return')return a.value==='keep'?8:0;
            if(p.flow==='assassin-failure')return a.value==='discard'?8:-20;
            const grant=s.advanced?.grant;
            if(grant&&p.flow==='grant-attack')return a.value==='finish'?0:hardScore(s,{type:'attack',unitId:grant.unitId,targetHex:a.value},actor);
            if(grant&&(p.flow==='grant-move'||p.flow==='grant-advance')){const u=uBy(s,grant.unitId);if(!u||a.value==='finish')return 0;if(a.value==='stay')return 1;const h=hBy(s,a.value==='advance'?grant.advanceHex!:a.value);return h?3+potential(s,h,actor)-potential(s,hBy(s,u.hexId)!,actor)-exposedValue(s,u,h)*.5:0;}
            if(p.flow==='recover'){const u=uBy(s,a.value);return u?material(s,u):0;}
            if(p.flow==='hero'||p.flow==='build'){
                const h=hBy(s,a.value),u=s.units.find(u=>u.hexId===a.value&&!isHero(s,u));return h?potential(s,h,actor)+(u?material(s,u)*.4:0):0;
            }
            if(p.flow==='forced-move'){
                const u=uBy(s,p.data?.unitId??'');if(!u)return 0;
                if(a.value==='hit')return u.weakened?-material(s,u):-2.5;
                const id=a.value.slice(a.value.indexOf(':')+1),h=hBy(s,id);return h?potential(s,h,actor)-potential(s,hBy(s,u.hexId)!,actor)-exposedValue(s,u,h)*.4+(a.value.startsWith('army:')?-2:0):0;
            }
            if(p.flow==='repeat-strike'){const u=uBy(s,p.data?.target??'');return a.value==='skip'?0:(u?material(s,u)*.8:2)-cardReserve(a.value)*.7;}
            if(p.flow==='blessing')return 4-s.advanced!.hands[p.playerId].filter(id=>cardById(id)?.kind==='blessing'&&cardById(id)?.kingdom===a.value).length;
            if(p.flow==='book-target')return 3;
            if(p.flow==='copy-monster'){const m=s.advanced!.monsters.find(m=>m.id===a.value),abilities=monsterById(m?.defId??'')?.abilities??[];return abilities.reduce((n,x)=>n+(x==='flying'?3:x==='stealth'?2.5:x==='ranged'?2:1),0);}
            return 2;
        }
        case 'settlement': {
            const h = hBy(s, s.pendingCombat!.targetHex)!;
            const shashka = actor === 'orcs' || actor === 'goblins';
            if (a.choice === 'control')
                return settlementValue(s, h, actor) + (shashka && k.hasEverControlled && !Object.values(s.controls).includes(actor) ? 40 : 0);
            if(shashka&&!requiresControl(s,h,actor)&&sourceGoals(s,actor).some(g=>g.hex.id===h.id&&g.pursue&&g.eligible.includes(actor)&&g.metric==='controlled-or-razed'))return settlementValue(s,h,actor)+(k.gold<3?4:-4);
            return requiresControl(s,h,actor) ? -25 : shashka && k.gold < 3 ? 6 : -10;
        }
        case 'advance': {
            if (!a.accept)
                return 0;
            const p = s.pendingCombat!, u = uBy(s, p.attackerId);
            if (!u)
                return -5;
            const at = hBy(s, p.targetHex)!;
            return 3 + potential(s, at, actor) - potential(s, hBy(s, u.hexId)!, actor) - exposedValue(s, u, at) * 0.6;
        }
        case 'resolve-combat': {
            const p = s.pendingCombat!, f = combatForecast(s, p.attackerId, p.targetHex);
            return a.ambush === 'defender' ? 8 : a.ambush === 'attacker' ? 4 + Math.max(0, f.defenderExpected - f.attackerExpected) * 2 : 0;
        }
        case 'regenerate':
        case 'recover': {
            const u = uBy(s, a.unitId)!;
            if (!allied(s, actor, u.kingdom))
                return -80;
            const d = def(s, u), urgent = objectiveWeight(s, hBy(s, u.hexId)!) > 0;
            return 4 + material(s, u) * 0.5 + (urgent ? 2 : 0) - d.recoveryCost * 0.8;
        }
        case 'suppress': {
            const revolt = k.revolt ?? 0;
            const score=s.scenario.sourceCampaign?.victory.deadline;
            if(revolt&&score?.type==='score'&&score.metric==='income'&&score.deductRevolts)return 10+8/(seasonsLeft(s)+1);
            return revolt >= 16 ? 35 : revolt >= 10 ? 12 : revolt > 2 ? 3 : -2;
        }
        case 'mine': return k.gold < 8 ? 8 : 4;
        case 'coven': {
            const h = hBy(s, a.hexId)!, used = s.covens.length + Object.values(s.controls).filter(k => k === 'night').length;
            if (used >= (k.controlLimit ?? 5) - 1)
                return -2;
            const nearest = Math.min(...s.units.filter(u => u.kingdom === 'night').map(u => distance(h, hBy(s, u.hexId)!)), 99);
            return 10 + objectiveWeight(s, h) * 0.3 + Number(['forest', 'mountain', 'swamp'].includes(h.terrain)) * 2 - nearest * 0.4 - Number(s.units.some(u => u.hexId === h.id)) * 3;
        }
        case 'lay-waste': {
            const controlled = Object.values(s.controls).filter(v => v === actor).length;
            // Unpaid upkeep collapses immediately. Razing may be the only way to
            // reach an activation and capture a replacement before its end.
            if (k.gold < controlled)
                return 24 - objectiveWeight(s, hBy(s, a.hexId)!) * 0.1;
            if (controlled <= 1 && k.hasEverControlled)
                return -70;
            return objectiveWeight(s, hBy(s, a.hexId)!) ? -70 : k.gold < controlled + 2 ? 16 : -15;
        }
        case 'remove-control': return -70;
        case 'remove-coven': {
            const h = hBy(s, a.hexId)!, p = s.pendingCombat;
            return p?.stage === 'settlement' ? 2 - objectiveWeight(s, h) * 0.1 : -50;
        }
        case 'disband-siege': return -40;
        case 'transfer-gold': {
            const ally = s.kingdoms.find(k => k.id === a.toKingdom)!;
            return k.gold > 8 && ally.gold < 2 && !s.activeUnitId ? 1 : -20;
        }
        case 'recolonize': return 3 + objectiveWeight(s, hBy(s, a.hexId)!) * 0.3;
        case 'build': {
            const d = s.unitDefinitions.find(d => d.id === a.defId)!, at = hBy(s, a.hexId)!, count = s.units.filter(u => u.kingdom === actor && army(s, u)).length, reserve = actor === 'orcs' || actor === 'goblins' ? Object.values(s.controls).filter(v => v === actor).length : actor === 'empire' ? Math.max(1, (k.revolt ?? 0)) : 1;
            if (k.gold - d.cost < reserve && count >= 2)
                return -15;
            let value = 3 + diceValue(d.light, d.heavy) * 2.8 + (d.movement ?? 0) * 0.3 - d.cost * 0.55 + potential(s, at, actor) * 0.2 - count * 0.55;
            if (isWelcoming(s, at, actor))
                value += 1;
            if (d.characteristics.includes('fragile'))
                value -= 1;
            if (d.characteristics.includes('feral') || d.characteristics.includes('huge'))
                value -= s.scenario.objective.type === 'control' ? 1.5 : 0;
            if (d.abilities.includes('siege') || d.characteristics.some(c=>c==='siege'||c==='siege-engine')) {
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
            const u = uBy(s, a.unitId)!, v = uBy(s, a.armyId)!;
            return u.activated !== v.activated ? -80 : u.activated ? -80 : 5;
        }
        case 'drop-hero':
        case 'drop-army': {
            const hero = uBy(s, a.unitId)!, member = uBy(s, s.advanced!.stacks[hero.id])!;
            if (!member)
                return -80;
            if (a.type === 'drop-hero')
                return hero.activated && !member.activated && (!s.activeUnitId || s.remainingMP > 0) ? 7 : s.activeUnitId?-20:-35;
            return !hero.activated && member.activated ? 7 : -20;
        }
        case 'attack':
        case 'attack-monster': {
            if (a.type === 'attack' && s.scenario.objective.kingdom && s.scenario.objective.kingdom !== actor && ownSide(s, actor) === 'invader' && s.scenario.objective.hexIds.includes(a.targetHex))
                return -60;
            const f = combatForecast(s, a.unitId, a.targetHex), u = uBy(s, a.unitId)!, target = uBy(s, f.defenderUnitId), h = hBy(s, a.targetHex)!, monster = a.type === 'attack-monster';
            const margin = f.attackerExpected - f.defenderExpected;
            if(alliedClaim(s,h,actor))return -60;
            if (requiresControl(s,h,actor) && def(s, u).characteristics.some(c => c === 'feral' || c === 'huge'))
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
            const u = uBy(s, a.unitId)!;
            return u.weakened ? -6 : 5 + Math.min(2, diceValue(ownPool(s, u).light, ownPool(s, u).heavy)) - Number(def(s, u).characteristics.includes('feral')) * 6;
        }
        case 'move':
        case 'ship': {
            const u = uBy(s, a.unitId)!, from = hBy(s, u.hexId)!, to = hBy(s, a.toHex)!, progress = potential(s, to, actor) - potential(s, from, actor), cost = a.path?.length ?? distance(from, to);
            let value = progress * 2.2 + tacticalFollowup(s, u, to, cost) + exposedValue(s, u, from) * 0.5 - exposedValue(s, u, to) * 0.8 - 0.2;
            if (objectiveWeight(s, from) && isWelcoming(s, from, actor) && s.units.some(v => !allied(s, actor, v.kingdom) && distance(hBy(s, v.hexId)!, from) <= 3))
                value -= objectiveWeight(s, from) * 0.35;
            if(s.scenario.sourceCampaign&&sourceGoals(s,actor).some(g=>g.hex.id===from.id&&g.pursue&&g.achieved&&['occupied','presence'].includes(g.metric))&&!s.units.some(v=>v.id!==u.id&&v.hexId===from.id&&army(s,v)&&allied(s,v.kingdom,actor)))value-=objectiveWeight(s,from,actor)*.75;
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
function coordinationBonus(s: GameState, action: Action, actor: string, ping: CampaignMessage | undefined): number {
    if (!ping)
        return 0;
    if (ping.template === 'need-gold' && action.type === 'transfer-gold' && action.toKingdom === ping.author)
        return s.kingdoms.find(k => k.id === actor)!.gold > 6 ? 2 : 0;
    const target = ping.hexId ? hBy(s, ping.hexId) : undefined;
    if (!target)
        return 0;
    if (action.type === 'attack' || action.type === 'attack-monster')
        return action.targetHex === target.id && (ping.template === 'attack' || ping.template === 'support') ? 2 : 0;
    if (action.type === 'move' || action.type === 'ship') {
        const from = hBy(s, uBy(s, action.unitId)!.hexId)!, to = hBy(s, action.toHex)!;
        return Math.max(-1, Math.min(2, (distance(from, target) - distance(to, target)) * 0.55));
    }
    if ((action.type === 'build' || action.type === 'recruit-hero') && ping.template === 'defend')
        return distance(hBy(s, action.hexId)!, target) <= 1 ? 1.5 : 0;
    return 0;
}
function easyAction(s: GameState, actions: Action[], fallback: Action | null): Action {
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
    const heal = actions.find(a => (a.type === 'recover' || a.type === 'regenerate') && allied(s, s.currentKingdom, uBy(s, a.unitId)!.kingdom));
    if (heal)
        return heal;
    const safe = actions.filter((a): a is Extract<Action, {
        type: 'attack';
    }> => a.type === 'attack').find(a => { const f = combatForecast(s, a.unitId, a.targetHex); return f.attackerExpected > f.defenderExpected * 1.5; });
    if (safe)
        return safe;
    const k = s.kingdoms.find(k => k.id === s.currentKingdom)!;
    const moves = actions.filter((a): a is Extract<Action, {
        type: 'move' | 'ship';
    }> => a.type === 'move' || a.type === 'ship').filter(a => potential(s, hBy(s, a.toHex)!, k.id) > potential(s, hBy(s, uBy(s, a.unitId)!.hexId)!, k.id) + 0.5);
    if (moves.length)
        return moves[Math.abs((s.turnSerial * 13 + s.serial * 7 + s.remainingMP * 3) % moves.length)];
    if (s.activeUnitId)
        return actions.find(a => a.type === 'pass') ?? actions[0];
    const build = actions.filter((a): a is Extract<Action, {
        type: 'build';
    }> => a.type === 'build').sort((a, b) => s.unitDefinitions.find(d => d.id === a.defId)!.cost - s.unitDefinitions.find(d => d.id === b.defId)!.cost);
    if (s.units.filter(u => u.kingdom === k.id).length < 4 && build.length)
        return build[0];
    return actions.find(a => a.type === 'end-turn') ?? actions[0];
}
function normalCampaignScore(s:GameState,a:Action,actor:string,fallback:Action|null):number{
    if(a.type==='collect-income')return 20;
    if(a.type==='end-turn'||a.type==='pass')return 0;
    if(a.type==='move'||a.type==='ship'){
        const u=uBy(s,a.unitId)!,from=hBy(s,u.hexId)!,to=hBy(s,a.toHex)!;
        let value=(potential(s,to,actor)-potential(s,from,actor))*1.8-.1;
        if(sourceGoals(s,actor).some(g=>g.hex.id===from.id&&g.pursue&&g.achieved&&['occupied','presence'].includes(g.metric)))value-=objectiveWeight(s,from,actor)*.5;
        return value;
    }
    if(a.type==='attack'){
        const h=hBy(s,a.targetHex)!,u=uBy(s,a.unitId)!;
        if(alliedClaim(s,h,actor)||requiresControl(s,h,actor)&&def(s,u).characteristics.some(c=>c==='feral'||c==='huge'))return -60;
        const f=combatForecast(s,a.unitId,a.targetHex),margin=f.attackerExpected-f.defenderExpected;
        return margin>=0?2+settlementValue(s,h,actor)*.2+margin:margin*3;
    }
    return fallback&&JSON.stringify(fallback)===JSON.stringify(a)?3:-1;
}
/** Chooses among engine-enumerated legal actions. The current rng value, decks and
 * opposing hand contents are deliberately absent from every scoring function.
 * Normal keeps the pre-existing policy. Hard uses expected values, not actual rolls. */
export function chooseDifficultyAction(s: GameState, difficulty: AIDifficulty, fallbackAction: Action | null): Action | null {
    decisionCache = { state: s, goals: new Map(), potential: new Map(), exposure: new Map(), sourceGoals: new Map(), hexById: new Map(s.hexes.map(h=>[h.id,h])) };
    const all = legalActions(s);
    if (!all.length||all.some(a=>a.type==='winter-ruling'||a.type==='table-ruling'||a.type==='opening-choice'))
        return null; // Unverified printed-rule exceptions require a human table ruling.
    const fallback = fallbackAction ? all.find(a => a.type === fallbackAction.type && Object.entries(fallbackAction).filter(([key]) => key !== 'path').every(([key, value]) => (a as any)[key] === value)) ?? null : null;
    if (difficulty === 'normal'&&!s.scenario.sourceCampaign)
        return fallback ?? all[0];
    const actor = advancedActor(s), player = playerFor(s, actor);
    const actions = all.filter(a => !('playerId' in a) || !player || a.playerId === player.id);
    if (!actions.length)
        return fallback ?? all[0];
    const ping = visibleMessages(s, actor).filter(message => message.author !== actor && allied(s, actor, message.author) && s.turnSerial - message.turn >= 0 && s.turnSerial - message.turn <= s.kingdoms.length && ['attack', 'defend', 'support', 'need-gold'].includes(message.template ?? '')).at(-1);
    const planning: GameState = { ...s, rng: 1, companion: undefined, covens: actor === 'night' || player?.kingdoms.includes('night') ? s.covens : [], advanced: s.advanced ? { ...s.advanced, hands: player ? { [player.id]: s.advanced.hands[player.id] } : {}, owned: player ? { [player.id]: s.advanced.owned[player.id] } : {}, decks: {} } : undefined };
    decisionCache = { state: planning, goals: new Map(), potential: new Map(), exposure: new Map(), sourceGoals: new Map(), hexById: new Map(planning.hexes.map(h=>[h.id,h])) };
    if(s.phase==='opening'){
        let best=actions[0],score=-Infinity;for(const a of actions){const v=openingScore(planning,a,actor,difficulty);if(v>score){score=v;best=a;}}return best;
    }
    if(difficulty==='normal'){
        if(s.advanced?.pending||s.pendingCombat)return fallback??actions[0];
        let best=actions[0],score=-Infinity;for(const a of actions){const v=normalCampaignScore(planning,a,actor,fallback);if(v>score){score=v;best=a;}}return best;
    }
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
