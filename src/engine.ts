import * as Advanced from './advanced.js';
import type {AdvancedState, AdvancedAction, Player, AdvancedContext} from './advanced.js';
import { validateContentPack } from './content-validation.js';
import { validateTabletop } from './tabletop.js';
import type {TabletopState} from './tabletop.js';
import { validateCompanionShape } from './async-play.js';
import type { CampaignCompanion } from './async-play.js';
/** Burning Banners, Basic Game: source-grounded rules engine.
 * Reference: Compass Games Undying Rules v1.1 (September 2024), §§3–12.
 */
export type Terrain = 'clear' | 'forest' | 'mountain' | 'swamp' | 'sea' | 'coastal' | 'major-river' | 'lair';
export type Side = 'invader' | 'resistance';
export type Controller = 'human' | 'ai';
export interface HexEdge { road?: boolean; river?: 1 | 2; sea?: boolean; coastal?: boolean; }
export interface Settlement { name: string; loyalty: string | null; city: boolean; fortified: 0 | 1 | 2; port: boolean; wilderness?: 'forest' | 'mountain'; neutralFriendlyTo?: string[]; }
export interface Hex { id: string; q: number; r: number; terrain: Terrain; coastal?: boolean; settlement?: Settlement; mine?: boolean; entry?: string; edges?: Record<string, HexEdge>; prohibited?: boolean; }
export interface UnitDefinition { kind?:'army'|'hero';heroCardId?:string; id: string; name: string; kingdom: string; cost: number; recoveryCost: number; movement: number; light: number; heavy: number; weakenedLight?: number; weakenedHeavy?: number; abilities: string[]; characteristics: string[]; count: number; art?: string; }
export interface ScenarioKingdom { id: string; name: string; side: Side; gold: number; income: number; revolt?: number; controlLimit?: number; cityCollapseThreshold?: number; }
export interface ScenarioDefinition { id: string; name: string; official: boolean; source: string; startYear: number; startSeason: 0 | 1 | 2; endYear: number; endSeason: 0 | 1 | 2; turnOrder: string[]; kingdoms: ScenarioKingdom[]; initialUnits: {defId: string; hexId: string; weakened?: boolean}[]; initialControls?: Record<string,string>; initialRazed?: string[]; initialCovens?: string[]; objective: {type: 'control' | 'survival'; kingdom?: string; hexIds: string[]; count: number; deadlineOnly?: boolean}; notes?: string[]; empireRevoltModifier?: number; }
export interface GameConfig { tabletop?:boolean; hexes: Hex[]; unitDefinitions: UnitDefinition[]; scenario: ScenarioDefinition; controllers?: Record<string, Controller>; seed?: number; profile?:'basic'|'advanced';players?:Player[]; }
export interface Unit { id: string; defId: string; kingdom: string; hexId: string; weakened: boolean; activated: boolean; }
export interface Kingdom extends ScenarioKingdom { controller: Controller; collapsed: boolean; hasEverControlled: boolean; }
export interface DiceRoll { sides: 6 | 8; raw: number; modified: number; success: boolean; critical: boolean; confirmation?: number; confirmations?:{sides:6|8;raw:number}[]; }
export interface CombatForecast { attackerId: string; targetHex: string; attackerLight: number; attackerHeavy: number; defenderLight: number; defenderHeavy: number; fortificationPenalty: number; attackerExpected: number; defenderExpected: number; attackerCanAmbush: boolean; defenderCanAmbush: boolean; defenderUnitId?: string; explanation: string[]; }
export interface CombatResult { attackerId: string; targetHex: string; attackerRolls: DiceRoll[]; defenderRolls: DiceRoll[]; attackerSuccesses: number; defenderSuccesses: number; attackerHits: number; defenderHits: number; result: 'attacker'|'defender'|'tie'|'draw'|'ambush'; ambush?: 'attacker'|'defender'; }
export interface PendingCombat { attackerId: string; targetHex: string; stage: 'ambush'|'advance'|'settlement'; decisionKingdom: string; defenderUnitId?: string; result?: CombatResult; mandatoryAdvance?: boolean; }
export interface GameState { tabletop?:TabletopState; companion?:CampaignCompanion; advanced?:AdvancedState; version: 1; hexes: Hex[]; unitDefinitions: UnitDefinition[]; scenario: ScenarioDefinition; kingdoms: Kingdom[]; units: Unit[]; controls: Record<string,string>; razed: string[]; covens: string[]; covenProtected: string[]; year: number; season: 0|1|2; phase: 'income-actions'|'activation'|'game-over'; turnIndex: number; currentKingdom: string; activeUnitId: string|null; remainingMP: number; allRoad: boolean; moved: boolean; shipUsed: boolean; pendingCombat: PendingCombat|null; lastCombat: CombatResult|null; rng: number; serial: number; turnSerial: number; newlyFriendly: string[]; incomeActionsUsed: string[]; winner: Side|null; victoryReason: string; log: string[]; }
export type Action = {type:'table-ruling';playerId:string;summary:string;private?:boolean} | AdvancedAction
  | {type:'activate';unitId:string}
  | {type:'move';unitId:string;toHex:string;path?:string[]}
  | {type:'ship';unitId:string;toHex:string;path?:string[]}
  | {type:'attack';unitId:string;targetHex:string}
  | {type:'resolve-combat';ambush?:'attacker'|'defender'|null}
  | {type:'advance';accept:boolean}
  | {type:'settlement';choice:'control'|'raze'}
  | {type:'recover';unitId:string}
  | {type:'regenerate';unitId:string}
  | {type:'mine';unitId:string}
  | {type:'pass';unitId:string}
  | {type:'build';defId:string;hexId:string}
  | {type:'coven';hexId:string}
  | {type:'lay-waste';hexId:string}
  | {type:'remove-control';hexId:string}
  | {type:'remove-coven';hexId:string}
  | {type:'recolonize';hexId:string}
  | {type:'disband-siege';unitId:string}
  | {type:'suppress';amount?:number}
  | {type:'transfer-gold';toKingdom:string;amount:2}
  | {type:'collect-income'}
  | {type:'end-turn'};
export interface MoveOption { hexId: string; cost: number; path: string[]; roadOnly: boolean; }

const DIRECTIONS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]] as const;
const BOARD_CACHE = new WeakMap<GameState,{hexes:Map<string,Hex>;coordinates:Map<string,Hex>;definitions:Map<string,UnitDefinition>}>();
function boardIndex(s:GameState){let index=BOARD_CACHE.get(s);if(!index){index={hexes:new Map(s.hexes.map(h=>[h.id,h])),coordinates:new Map(s.hexes.map(h=>[`${h.q},${h.r}`,h])),definitions:new Map(s.unitDefinitions.map(d=>[d.id,d]))};BOARD_CACHE.set(s,index);}return index;}
const isShashka = (id:string) => id === 'goblins' || id === 'orcs';
const sameSide = (s:GameState,a:string,b:string) => a===b || (!!s.kingdoms.find(k=>k.id===a) && s.kingdoms.find(k=>k.id===a)?.side===s.kingdoms.find(k=>k.id===b)?.side);
const hexById = (s:GameState,id:string):Hex => {const h=boardIndex(s).hexes.get(id);if(!h)throw new Error(`Unknown hex ${id}`);return h;};
const unitById = (s:GameState,id:string):Unit => {const u=s.units.find(u=>u.id===id);if(!u)throw new Error(`Unknown Army ${id}`);return u;};
const rawDef = (s:GameState,u:Unit):UnitDefinition => {const d=boardIndex(s).definitions.get(u.defId);if(!d)throw new Error(`Unknown Army definition ${u.defId}`);return d;};
const defOf=(s:GameState,u:Unit)=>Advanced.effectiveDefinition(s,u,rawDef(s,u));
const kingdomOf = (s:GameState,id:string):Kingdom => {const k=s.kingdoms.find(k=>k.id===id);if(!k)throw new Error(`Unknown Kingdom ${id}`);return k;};
const controlCapacity=(k:Kingdom)=>k.controlLimit??(k.id==='night'?5:100);
const ability = (d:UnitDefinition,name:string) => d.abilities.some(a=>a.toLowerCase()===name.toLowerCase());
const characteristic = (d:UnitDefinition,name:string) => d.characteristics.some(a=>a.toLowerCase()===name.toLowerCase());
const siege = (d:UnitDefinition) => ability(d,'siege') || characteristic(d,'siege') || characteristic(d,'siege-engine') || /siege engine/i.test(d.name);
const ranger = (d:UnitDefinition) => d.kingdom==='fjordland' && /ranger/i.test(d.name);
const wilderness = (h:Hex) => h.settlement?.wilderness ?? (h.terrain==='forest'||h.terrain==='mountain'||h.terrain==='swamp'?h.terrain:null);
const aliveSettlement = (s:GameState,h:Hex) => !!h.settlement && !s.razed.includes(h.id);
export const settlementController = (s:GameState,h:Hex):string|null => aliveSettlement(s,h) ? s.controls[h.id] ?? h.settlement?.loyalty ?? null : null;
export function isWelcoming(s:GameState,h:Hex,kingdom:string,underlying=false):boolean {
  if(!h.settlement || (!underlying && !aliveSettlement(s,h)))return false;
  const controller=underlying?h.settlement.loyalty:settlementController(s,h);
  if(controller&&s.kingdoms.some(k=>k.id===controller))return sameSide(s,controller,kingdom);
  return (h.settlement.neutralFriendlyTo??[]).some(k=>sameSide(s,k,kingdom));
}
export function adjacentHexes(s:GameState,hexId:string):Hex[] {
  const h=hexById(s,hexId),coordinates=boardIndex(s).coordinates;
  return DIRECTIONS.map(([q,r])=>coordinates.get(`${h.q+q},${h.r+r}`)).filter((h):h is Hex=>!!h);
}
const adjacent = (s:GameState,a:string,b:string) => adjacentHexes(s,a).some(h=>h.id===b);
const edge = (s:GameState,a:string,b:string):HexEdge => {
  const ah=hexById(s,a),bh=hexById(s,b);
  return {...(ah.terrain==='sea'||bh.terrain==='sea'?{sea:true}:{}),...bh.edges?.[a],...ah.edges?.[b]};
};
function canCross(s:GameState,u:Unit,a:string,b:string,ship=false):boolean {
  const e=edge(s,a,b),d=defOf(s,u);
  if(e.sea&&!ship&&!ability(d,'flying'))return false;
  return true;
}
function canPass(s:GameState,u:Unit,h:Hex,ship=false):boolean {
  if(h.prohibited||s.advanced?.monsters.some(m=>m.hexId===h.id))return false;
  const deep=s.advanced?.effects.some(e=>Advanced.stackIds(s,u.id).includes(e.target)&&e.extra?.deepPaths);
  if(h.terrain==='lair'&&!deep)return false;
  if(deep&&h.terrain!=='sea')return true;
  const d=defOf(s,u),enemy=s.units.find(v=>v.hexId===h.id&&!sameSide(s,v.kingdom,u.kingdom)&&!Advanced.isHero(s,v));
  const hostile=aliveSettlement(s,h)&&!isWelcoming(s,h,u.kingdom);
  if(enemy||hostile){
    if(ship||!ability(d,'flying'))return false;
    if(enemy&&(ability(defOf(s,enemy),'flying')||ability(defOf(s,enemy),'ranged')))return false;
  }
  if(h.terrain==='sea'&&!ship&&!ability(d,'flying'))return false;
  return true;
}
function canEnd(s:GameState,u:Unit,h:Hex):boolean {
  if(!canPass(s,u,h)||h.terrain==='sea'||h.terrain==='lair')return false;
  const group=Advanced.stackIds(s,u.id),movingArmy=group.some(id=>!Advanced.isHero(s,unitById(s,id))),others=s.units.filter(v=>!group.includes(v.id)&&v.hexId===h.id&&!(s.advanced&&movingArmy&&Advanced.isHero(s,v)&&!sameSide(s,v.kingdom,u.kingdom)));
  if(s.advanced){if(others.some(v=>v.kingdom!==u.kingdom))return false;const moving=group.map(id=>unitById(s,id));if(others.some(v=>moving.some(m=>Advanced.isHero(s,m)===Advanced.isHero(s,v))))return false;if(others.length+moving.length>2)return false;}
  else {const other=others[0];if(other&&(other.kingdom!==u.kingdom||other.activated))return false;}
  if(h.entry&&h.entry!==u.kingdom)return false;
  if(aliveSettlement(s,h)&&!isWelcoming(s,h,u.kingdom))return false;
  if(characteristic(defOf(s,u),'huge')&&isWelcoming(s,h,u.kingdom))return false;
  return true;
}
function movementCost(s:GameState,u:Unit,from:string,to:Hex):number {
  const d=defOf(s,u),e=edge(s,from,to.id);
  if(ability(d,'flying')||e.road||s.advanced?.effects.some(e=>Advanced.stackIds(s,u.id).includes(e.target)&&e.extra?.deepPaths))return 1;
  let cost=aliveSettlement(s,to)?1:(wilderness(to)?2:1);
  if(!aliveSettlement(s,to)&&to.terrain==='mountain'&&!siege(d)&&(u.kingdom==='oathborn'||u.kingdom==='goblins'))cost=1;
  if(!aliveSettlement(s,to)&&to.terrain==='forest'&&ranger(d))cost=1;
  return cost+(e.river??0);
}
export function isBesieged(s:GameState,hexId:string):boolean {
  const h=hexById(s,hexId);if(!aliveSettlement(s,h))return false;
  const owner=settlementController(s,h);
  if(!owner)return false;
  const besiegers=s.units.filter(u=>!Advanced.isHero(s,u)&&!isWelcoming(s,h,u.kingdom)&&adjacent(s,u.hexId,h.id)&&canCross(s,u,u.hexId,h.id));
  const horne=s.units.some(u=>u.hexId===h.id&&u.defId==='hero-oathborn-14');return besiegers.length >= (horne?3:h.settlement?.port?2:1);
}
function unitMayAct(s:GameState,u:Unit):boolean {
  if(s.tabletop?.enslaved?.some(x=>x.armyId===u.id))return false;
  return s.phase==='activation'&&!s.pendingCombat&&u.kingdom===s.currentKingdom&&!u.activated&&!Advanced.stackIds(s,u.id).some(id=>s.units.find(v=>v.id===id)?.activated)&&!s.advanced?.pending&&(!s.activeUnitId||Advanced.stackIds(s,s.activeUnitId).includes(u.id));
}
export function moveOptions(s:GameState,unitId:string):MoveOption[] {
  const u=unitById(s,unitId); if(!unitMayAct(s,u)) return [];
  const d=defOf(s,u),group=Advanced.stackIds(s,u.id),active=!!s.activeUnitId&&group.includes(s.activeUnitId);
  const budgets=group.map(id=>active&&s.advanced?s.advanced.movement[id]??defOf(s,unitById(s,id)).movement:active?s.remainingMP:defOf(s,unitById(s,id)).movement);
  const records=new Map<string,MoveOption>();
  const visited=new Map<string,number[][]>();
  const queue:{id:string;costs:number[];roadOnly:boolean;path:string[]}[]=[{id:u.hexId,costs:group.map(()=>0),roadOnly:active?s.allRoad:true,path:[]}];
  while(queue.length) {
    queue.sort((a,b)=>Math.max(...a.costs)-Math.max(...b.costs)); const node=queue.shift()!;
    const key=`${node.id}:${node.roadOnly}`,previous=visited.get(key)??[];
    if(previous.some(costs=>costs.every((cost,i)=>cost<=node.costs[i]))) continue;
    visited.set(key,[...previous.filter(costs=>!node.costs.every((cost,i)=>cost<=costs[i])),node.costs]);
    for(const to of adjacentHexes(s,node.id)) {
      if(!canCross(s,u,node.id,to.id)||!canPass(s,u,to)) continue;
      const roadOnly=node.roadOnly&&!!edge(s,node.id,to.id).road&&!ability(d,'flying');
      const costs=node.costs.map((cost,i)=>cost+movementCost(s,unitById(s,group[i]),node.id,to));
      const inBudget=costs.every((cost,i)=>cost<=budgets[i]+(roadOnly?1:0));
      const minimum=!(active&&s.moved)&&!node.path.length;
      if(!inBudget&&!minimum) continue;
      const path=[...node.path,to.id],cost=Math.max(...costs),record={hexId:to.id,cost,path,roadOnly};
      const deep=s.advanced?.effects.some(e=>group.includes(e.target)&&e.extra?.deepPaths);
      if(to.id!==u.hexId&&canEnd(s,u,to)&&(!deep||to.terrain==='mountain')&&(!records.has(to.id)||records.get(to.id)!.cost>cost)) records.set(to.id,record);
      if(inBudget) queue.push({id:to.id,costs,roadOnly,path});
    }
  }
  return [...records.values()].sort((a,b)=>a.cost-b.cost||a.hexId.localeCompare(b.hexId));
}
export function movementPreview(s:GameState,unitId:string,option:MoveOption,ship=false) {
  const u=unitById(s,unitId),group=Advanced.stackIds(s,unitId),active=!!s.activeUnitId&&group.includes(s.activeUnitId);
  const spent=group.map(()=>0);let from=u.hexId;
  const steps=option.path.map(id=>{const h=hexById(s,id),costs=group.map((member,i)=>{const cost=ship?1:movementCost(s,unitById(s,member),from,h);spent[i]+=cost;return cost;});from=id;return {hexId:id,name:h.settlement?.name??id,terrain:h.terrain,costs};});
  const units=group.map((id,i)=>{const v=unitById(s,id),d=defOf(s,v),budget=active?(s.advanced?s.advanced.movement[id]??d.movement:s.remainingMP):d.movement,bonus=!ship&&option.roadOnly?1:0;return {unitId:id,name:rawDef(s,v).name,spent:spent[i],remaining:Math.max(0,budget+bonus-spent[i]),roadBonus:bonus,minimumMove:!ship&&spent[i]>budget+bonus};});
  return {steps,units,ship};
}
export function shipOptions(s:GameState,unitId:string):MoveOption[] {
  const u=unitById(s,unitId);if(!unitMayAct(s,u)||s.advanced?.shipsThisTurn?.some(id=>Advanced.stackIds(s,u.id).includes(id))||(s.activeUnitId!==null&&Advanced.stackIds(s,u.id).includes(s.activeUnitId)&&s.shipUsed))return [];
  const d=defOf(s,u),wave=s.advanced?.effects.some(e=>Advanced.stackIds(s,u.id).includes(e.target)&&e.extra?.waveStrider);if(!wave&&Advanced.stackIds(s,u.id).some(id=>{const d=defOf(s,unitById(s,id));return characteristic(d,'feral')||characteristic(d,'huge');}))return [];
  const start=hexById(s,u.hexId),port=aliveSettlement(s,start)&&start.settlement?.port&&isWelcoming(s,start,u.kingdom);
  const budget=(port||start.entry===u.kingdom?6:3)+(u.kingdom==='fjordland'?2:0);
  const records=new Map<string,MoveOption>(),seen=new Set<string>();
  const queue:{id:string;path:string[]}[]=[{id:u.hexId,path:[]}];
  while(queue.length){const node=queue.shift()!;if(seen.has(node.id))continue;seen.add(node.id);
    if(node.path.length>=budget)continue;
    for(const to of adjacentHexes(s,node.id)){
      const e=edge(s,node.id,to.id),from=hexById(s,node.id);
      const channel=to.terrain==='sea'||to.terrain==='coastal'||to.coastal||to.terrain==='major-river';
      const riverCross=!!e.river;
      if(!e.sea&&!e.coastal&&!riverCross&&!(from.terrain==='major-river'&&to.terrain==='major-river'))continue;
      if(!channel&&!riverCross)continue;
      if(!canPass(s,u,to,true))continue;
      const path=[...node.path,to.id];
      if(to.id!==u.hexId&&to.terrain!=='sea'&&canEnd(s,u,to)&&(!records.has(to.id)||records.get(to.id)!.cost>path.length))records.set(to.id,{hexId:to.id,cost:path.length,path,roadOnly:false});
      if(channel)queue.push({id:to.id,path});
    }
  }
  return [...records.values()];
}
function diceFor(s:GameState,u:Unit|undefined):{light:number;heavy:number} {
  if(!u)return {light:0,heavy:0};const d=defOf(s,u);
  return Advanced.adjustedDice(s,u.id,u.weakened?{light:d.weakenedLight??d.light,heavy:d.weakenedHeavy??d.heavy}:{light:d.light,heavy:d.heavy});
}
const diceExpected=(light:number,heavy:number,penalty:number)=>light*(Math.max(0,7-(5+penalty))/6)+heavy*(Math.max(0,9-(5+penalty))/8+Math.max(0,9-(7+penalty))/24);
function canAttack(s:GameState,u:Unit,target:Hex):boolean {
  if(Advanced.isHero(s,u))return false;
  if(!unitMayAct(s,u)||!adjacent(s,u.hexId,target.id)||target.prohibited||target.terrain==='sea'||target.terrain==='lair'||!canCross(s,u,u.hexId,target.id))return false;
  const enemy=s.units.find(v=>v.hexId===target.id&&!sameSide(s,v.kingdom,u.kingdom)&&!Advanced.isHero(s,v));
  if(siege(defOf(s,u))&&!aliveSettlement(s,target))return false;
  return !!enemy||(aliveSettlement(s,target)&&!isWelcoming(s,target,u.kingdom));
}
export function combatForecast(s:GameState,attackerId:string,targetHex:string):CombatForecast {
  const a=unitById(s,attackerId),ad=defOf(s,a),h=hexById(s,targetHex),d=s.units.find(u=>u.hexId===targetHex&&!Advanced.isHero(s,u))??s.units.find(u=>u.hexId===targetHex),dd=d?defOf(s,d):undefined;
  const ac=diceFor(s,a),dc=diceFor(s,d),explanation:string[]=[];
  const monster=s.advanced?.monsters.find(m=>m.hexId===targetHex);
  if(monster){const md=Advanced.monsterById(monster.defId)!,mp=Advanced.adjustedDice(s,monster.id,{light:md.light,heavy:md.heavy}),as=ability(ad,'stealth'),ds=md.abilities.includes('stealth');return {attackerId,targetHex,attackerLight:ac.light,attackerHeavy:ac.heavy,defenderLight:mp.light,defenderHeavy:mp.heavy,fortificationPenalty:0,attackerExpected:diceExpected(ac.light,ac.heavy,0),defenderExpected:diceExpected(mp.light,mp.heavy,0),attackerCanAmbush:as&&!ds,defenderCanAmbush:ds&&!as,defenderUnitId:monster.id,explanation:['Monster combat ignores terrain. One hit defeats the Monster.']};}
  if(aliveSettlement(s,h)){const g=h.settlement?.city?3:(!d||Advanced.isHero(s,d)?1:0);const gp=s.advanced?Advanced.adjustedDice(s,h.id,{light:g,heavy:0},false):{light:g,heavy:0};dc.light+=gp.light;dc.heavy+=gp.heavy;if(g)explanation.push(`Garrison +${g} light dice`);}
  if(wilderness(h)){dc.light++;explanation.push(`${wilderness(h)} defense +1 light die`);}
  const river=edge(s,a.hexId,h.id).river??0;
  if(river&&!ability(ad,'flying')){dc.light+=river;explanation.push(`River defense +${river} light dice`);}
  if(ranger(ad)&&wilderness(h)==='forest'){ac.light++;explanation.push('Attacking Rangers: forest woodcraft +1 light die');}
  if(dd&&ranger(dd)&&wilderness(h)==='forest'){dc.light++;explanation.push('Defending Rangers: forest woodcraft +1 light die');}
  if(a.kingdom==='night'&&s.covens.includes(h.id)){ac.light++;explanation.push('Hidden Coven agents +1 light die');}
  let penalty:number=aliveSettlement(s,h)?h.settlement?.fortified??0:0;
  const engines=s.units.filter(u=>sameSide(s,a.kingdom,u.kingdom)&&siege(defOf(s,u))&&adjacent(s,u.hexId,h.id)).length;
  penalty=Math.max(0,penalty-engines);
  if(penalty)explanation.push(`Fortification −${penalty} to each attacking die`);
  if(s.advanced){const magical=s.advanced.effects.filter(e=>e.target===targetHex||e.target===d?.id).reduce((n,e)=>n+(e.fortification??0),0);penalty+=magical;if(magical)explanation.push(`Magical fortification −${magical} to each attacking die`);}
  const as=ability(ad,'stealth'),ds=!!dd&&ability(dd,'stealth');
  return {attackerId,targetHex,attackerLight:ac.light,attackerHeavy:ac.heavy,defenderLight:dc.light,defenderHeavy:dc.heavy,fortificationPenalty:penalty,attackerExpected:diceExpected(ac.light,ac.heavy,penalty),defenderExpected:diceExpected(dc.light,dc.heavy,0),attackerCanAmbush:as&&!ds&&(!aliveSettlement(s,h)||!h.settlement?.fortified),defenderCanAmbush:ds&&!as,defenderUnitId:d?.id,explanation};
}
function recoverable(s:GameState,u:Unit):boolean {
  if(!u.weakened||characteristic(defOf(s,u),'fragile'))return false;
  const h=hexById(s,u.hexId);
  if(h.entry===u.kingdom)return true;
  if(s.hexes.some(t=>aliveSettlement(s,t)&&isWelcoming(s,t,u.kingdom)&&(!isBesieged(s,t.id)||s.advanced?.effects.some(e=>e.extra?.secretWays&&u.kingdom==='oathborn'))&&(t.id===h.id||adjacent(s,t.id,h.id))))return true;
  return u.kingdom==='night'&&characteristic(defOf(s,u),'feral')&&!!wilderness(h)&&adjacentHexes(s,h.id).some(t=>(aliveSettlement(s,t)&&settlementController(s,t)==='night')||s.covens.includes(t.id));
}
function buildLocations(s:GameState,d:UnitDefinition):Hex[] {
  const friendly=s.hexes.filter(h=>aliveSettlement(s,h)&&settlementController(s,h)===d.kingdom&&(!isBesieged(s,h.id)||s.advanced?.effects.some(e=>e.extra?.secretWays&&d.kingdom==='oathborn')||d.id==='hero-oathborn-14'));
  return s.hexes.filter(h=>{
    if(h.prohibited||h.terrain==='lair'||!Advanced.advancedCanBuild(s,d,h)||(h.terrain==='sea'&&h.entry!==d.kingdom))return false;
    if(h.entry&&h.entry!==d.kingdom)return false;
    if(!sameSide(s,d.kingdom,'night')&&s.hexes.some(t=>t.settlement?.name==='Spire of the Moon'&&adjacent(s,h.id,t.id)))return false;
    if(h.entry===d.kingdom)return true;
    if(!canPass(s,{id:'build',defId:d.id,kingdom:d.kingdom,hexId:h.id,weakened:false,activated:false},h))return false;
    if(friendly.some(t=>(t.id===h.id&&!s.newlyFriendly.includes(h.id))||adjacent(s,t.id,h.id)))return true;
    return d.kingdom==='night'&&characteristic(d,'feral')&&!!wilderness(h)&&adjacentHexes(s,h.id).some(t=>(aliveSettlement(s,t)&&settlementController(s,t)==='night')||s.covens.includes(t.id));
  });
}
export function legalActions(s:GameState):Action[] {
  if(s.phase==='game-over'||s.tabletop?.review)return [];
  const extra=s.advanced?Advanced.advancedLegalActions(s,advancedContext()):{actions:[],exclusive:false};if(extra.exclusive)return extra.actions;
  if(s.pendingCombat){const p=s.pendingCombat;
    if(p.stage==='ambush'){const f=combatForecast(s,p.attackerId,p.targetHex);const a:Action[]=[{type:'resolve-combat',ambush:null}];if(f.attackerCanAmbush)a.push({type:'resolve-combat',ambush:'attacker'});if(f.defenderCanAmbush)a.push({type:'resolve-combat',ambush:'defender'});return a;}
    if(p.stage==='advance')return [{type:'advance',accept:true},{type:'advance',accept:false}];
    const k=kingdomOf(s,s.currentKingdom),controls=Object.values(s.controls).filter(id=>id===k.id).length+(k.id==='night'?s.covens.filter(id=>id!==p.targetHex).length:0);
    const choices:Action[]=controls<controlCapacity(k)?[{type:'settlement',choice:'control'},{type:'settlement',choice:'raze'}]:[{type:'settlement',choice:'raze'}];
    for(const [id,owner]of Object.entries(s.controls))if(owner===k.id)choices.push({type:'remove-control',hexId:id});
    if(k.id==='night')for(const id of s.covens)choices.push({type:'remove-coven',hexId:id});
    return choices;
  }
  const k=kingdomOf(s,s.currentKingdom),actions:Action[]=[...extra.actions];
  for(const u of s.units){const d=defOf(s,u),owner=kingdomOf(s,u.kingdom);if(u.weakened&&ability(d,'regenerate')&&d.recoveryCost<=owner.gold&&!(aliveSettlement(s,hexById(s,u.hexId))&&isBesieged(s,u.hexId)))actions.push({type:'regenerate',unitId:u.id});}
  if(k.gold>=2)for(const ally of s.kingdoms)if(ally.id!==k.id&&!ally.collapsed&&ally.side===k.side)actions.push({type:'transfer-gold',toKingdom:ally.id,amount:2});
  if(s.phase==='income-actions'){
    actions.push({type:'collect-income'});
    if(k.id==='night'&&!s.incomeActionsUsed.includes('coven')&&Object.values(s.controls).filter(id=>id==='night').length+s.covens.length<(k.controlLimit??5))for(const h of s.hexes)if(aliveSettlement(s,h)&&!isWelcoming(s,h,k.id)&&!s.covens.includes(h.id))actions.push({type:'coven',hexId:h.id});
    if(isShashka(k.id))for(const h of s.hexes)if(s.controls[h.id]===k.id)actions.push({type:'lay-waste',hexId:h.id});
    for(const u of s.units)if(u.kingdom===k.id&&siege(defOf(s,u)))actions.push({type:'disband-siege',unitId:u.id});
    if(k.id==='night')for(const id of s.covens)actions.push({type:'remove-coven',hexId:id});
    return actions;
  }
  if(!s.activeUnitId){
    for(const d of s.unitDefinitions)if(d.kind!=='hero'&&d.kingdom===k.id&&d.cost<=k.gold&&s.units.filter(u=>u.defId===d.id).length<d.count)for(const h of buildLocations(s,d))actions.push({type:'build',defId:d.id,hexId:h.id});
    for(const u of s.units)if(unitMayAct(s,u))actions.push({type:'activate',unitId:u.id});
  }
  for(const u of s.units){const d=defOf(s,u);
    if(unitMayAct(s,u)){
      for(const m of moveOptions(s,u.id))actions.push({type:'move',unitId:u.id,toHex:m.hexId,path:m.path});
      for(const m of shipOptions(s,u.id))actions.push({type:'ship',unitId:u.id,toHex:m.hexId,path:m.path});
      if(!s.units.some(v=>v.id!==u.id&&v.hexId===u.hexId&&!Advanced.stackIds(s,u.id).includes(v.id))){
        for(const h of adjacentHexes(s,u.hexId))if(canAttack(s,u,h))actions.push({type:'attack',unitId:u.id,targetHex:h.id});
        if(d.recoveryCost<=k.gold&&recoverable(s,u))actions.push({type:'recover',unitId:u.id});
        if(u.kingdom==='oathborn'&&/miner/i.test(d.name)&&hexById(s,u.hexId).mine)actions.push({type:'mine',unitId:u.id});
        if(!(characteristic(d,'huge')&&isWelcoming(s,hexById(s,u.hexId),u.kingdom)))actions.push({type:'pass',unitId:u.id});
      }
    }
    if(u.kingdom===k.id&&s.razed.includes(u.hexId)&&isWelcoming(s,hexById(s,u.hexId),u.kingdom,true)&&!characteristic(d,'huge')&&k.gold>=2&&(hexById(s,u.hexId).settlement?.loyalty||Object.values(s.controls).filter(id=>id===k.id).length+(k.id==='night'?s.covens.length:0)<controlCapacity(k)))actions.push({type:'recolonize',hexId:u.hexId});
  }
  // An already-active valid stack may always finish, including legacy saves
  // where a newly gained finished Hero blocks further movement/actions.
  if(s.activeUnitId){const u=unitById(s,s.activeUnitId),d=defOf(s,u);if(u.kingdom===k.id&&!u.activated&&!s.units.some(v=>v.id!==u.id&&v.hexId===u.hexId&&!Advanced.stackIds(s,u.id).includes(v.id))&&!(characteristic(d,'huge')&&isWelcoming(s,hexById(s,u.hexId),u.kingdom))&&!actions.some(a=>a.type==='pass'&&a.unitId===u.id))actions.push({type:'pass',unitId:u.id});}
  for(const h of s.hexes)if(s.controls[h.id]===k.id)actions.push({type:'remove-control',hexId:h.id});
  if(k.id==='night')for(const id of s.covens)actions.push({type:'remove-coven',hexId:id});
  if(k.id==='empire'&&(k.revolt??0)>0&&k.gold>0&&!s.advanced?.effects.some(e=>e.extra?.noSuppression))actions.push({type:'suppress',amount:1});
  if(!s.units.some(u=>u.kingdom===k.id&&(s.units.some(v=>v.id!==u.id&&v.hexId===u.hexId&&!Advanced.stackIds(s,u.id).includes(v.id))||hexById(s,u.hexId).terrain==='sea'||(characteristic(defOf(s,u),'huge')&&isWelcoming(s,hexById(s,u.hexId),u.kingdom)))))actions.push({type:'end-turn'});
  return actions;
}

function log(s:GameState,message:string):void {s.log.push(message);if(s.log.length>250)s.log.shift();}
function randomDie(s:GameState,sides:6|8):number {
  // xorshift32 has 2^32−1 nonzero outputs. Reject the incomplete final bucket.
  const limit=Math.floor(0xffffffff/sides)*sides;
  for(;;){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;const value=s.rng-1;if(value<limit)return 1+(value%sides);}
}
function rollPool(s:GameState,light:number,heavy:number,penalty=0):{rolls:DiceRoll[];successes:number;confirmed:number} {
  const rolls:DiceRoll[]=[];let successes=0,confirmed=0;
  for(const [sides,count] of [[6,light],[8,heavy]] as const)for(let i=0;i<count;i++){
    const raw=randomDie(s,sides),modified=raw-penalty,success=modified>=5,critical=modified>=7;
    const die:DiceRoll={sides,raw,modified,success,critical};
    if(success)successes++;
    if(critical){die.confirmation=randomDie(s,6);if(die.confirmation>=5){successes++;confirmed++;}}
    rolls.push(die);
  }
  return {rolls,successes,confirmed};
}
function loseIncome(s:GameState,owner:string|null,amount=1):void {if(owner&&!isShashka(owner)){const k=s.kingdoms.find(k=>k.id===owner);if(k&&!k.collapsed)k.income=Math.max(0,k.income-amount);}}
function gainIncome(s:GameState,owner:string|null,amount=1):void {if(owner&&!isShashka(owner)){const k=s.kingdoms.find(k=>k.id===owner);if(k&&!k.collapsed)k.income+=amount;}}
function raze(s:GameState,h:Hex,loot=false):void {
  const owner=settlementController(s,h);if(loot&&owner){if(s.advanced)Advanced.queueAdvancedEvent(s,{type:'settlement-looted',kingdom:owner,hexId:h.id});const k=kingdomOf(s,owner);k.gold+=(isShashka(owner)?3:2)*(h.settlement?.city?2:1);}
  loseIncome(s,owner);delete s.controls[h.id];if(!s.razed.includes(h.id))s.razed.push(h.id);s.covens=s.covens.filter(id=>id!==h.id);
  log(s,`${h.settlement?.name??h.id} was razed${loot?' and looted':''}.`);
}
function encounterCoven(s:GameState,u:Unit):void {
  if(u.kingdom==='night'||sameSide(s,u.kingdom,'night')||!s.covens.includes(u.hexId)||s.covenProtected.includes(u.hexId))return;
  const result=randomDie(s,6);if(result>=5){s.covenProtected.push(u.hexId);log(s,`Coven hides in shadows (${result}); protected for this Kingdom's turn.`);}else{s.covens=s.covens.filter(id=>id!==u.hexId);log(s,`Coven discovered (${result}) and removed.`);}
}
function startActivation(s:GameState,u:Unit):void {
  if(s.activeUnitId&&Advanced.stackIds(s,s.activeUnitId).includes(u.id))return;
  if(s.advanced){s.advanced.activationIds=Advanced.stackIds(s,u.id);for(const id of s.advanced.activationIds)s.advanced.movement[id]??=defOf(s,unitById(s,id)).movement;}
  s.activeUnitId=u.id;s.remainingMP=defOf(s,u).movement;s.allRoad=true;s.moved=false;s.shipUsed=false;
}
function finishActivation(s:GameState):void {
  if(s.advanced)Advanced.finishAdvancedActivation(s,advancedContext());
  const u=s.units.find(u=>u.id===s.activeUnitId);
  if(u){encounterCoven(s,u);u.activated=true;
    const h=hexById(s,u.hexId);
    if(aliveSettlement(s,h)&&!s.controls[h.id]&&!h.settlement?.loyalty){
      const d=defOf(s,u),count=Object.values(s.controls).filter(k=>k===u.kingdom).length+(u.kingdom==='night'?s.covens.length:0);
      if(!characteristic(d,'huge')&&!characteristic(d,'feral')&&count<controlCapacity(kingdomOf(s,u.kingdom))){s.controls[h.id]=u.kingdom;gainIncome(s,u.kingdom);kingdomOf(s,u.kingdom).hasEverControlled=true;s.newlyFriendly.push(h.id);log(s,`${kingdomOf(s,u.kingdom).name} establishes control in ${h.settlement?.name}.`);}
    }
  }
  s.activeUnitId=null;s.remainingMP=0;s.moved=false;s.allRoad=true;s.shipUsed=false;
}
function hitArmy(s:GameState,id:string|undefined,hits:number):void {
  if(!id||hits<=0)return;const u=s.units.find(u=>u.id===id);if(!u)return;
  if(Advanced.isHero(s,u)||characteristic(defOf(s,u),'fragile')||u.weakened||hits>=2){
    if(s.advanced)Advanced.recordElimination(s,u,advancedContext());s.units=s.units.filter(v=>v.id!==id);if(s.activeUnitId===id){s.activeUnitId=s.advanced?.activationIds.find(x=>s.units.some(v=>v.id===x&&!v.activated))??null;}log(s,`${defOf(s,u).name} eliminated; available to rebuild.`);}else {u.weakened=true;log(s,`${defOf(s,u).name} weakened.`);}
}
function strikeDice(s:GameState,u:Unit|undefined,target:Hex):{light:number;heavy:number} {
  return u?diceFor(s,u):{light:target.settlement?.city?3:target.settlement?1:0,heavy:0};
}
function advanceInto(s:GameState,attackerId:string,targetHex:string):void {
  const a=unitById(s,attackerId),h=hexById(s,targetHex),d=defOf(s,a);
  if(s.advanced)for(const hero of s.units.filter(u=>u.hexId===targetHex&&!sameSide(s,u.kingdom,a.kingdom)&&Advanced.isHero(s,u)))hitArmy(s,hero.id,1);
  if(!aliveSettlement(s,h)){for(const id of Advanced.stackIds(s,a.id))unitById(s,id).hexId=h.id;s.pendingCombat=null;finishActivation(s);return;}
  const wasWelcoming=isWelcoming(s,h,a.kingdom),former=settlementController(s,h);
  if(!wasWelcoming){
    if(!characteristic(d,'huge')&&!characteristic(d,'feral')){
      const loot=(isShashka(a.kingdom)?3:2)*(h.settlement?.city?2:1);kingdomOf(s,a.kingdom).gold+=loot;log(s,`${defOf(s,a).name} loots ${h.settlement?.name}: +${loot} gold.`);if(s.advanced)Advanced.queueAdvancedEvent(s,{type:'settlement-looted',unitId:a.id,kingdom:a.kingdom,hexId:h.id});
    }
    loseIncome(s,former);delete s.controls[h.id];
  }
  const welcoming=isWelcoming(s,h,a.kingdom);
  if(welcoming){
    if(!wasWelcoming)gainIncome(s,h.settlement?.loyalty??null);
    if(!characteristic(d,'huge'))for(const id of Advanced.stackIds(s,a.id))unitById(s,id).hexId=h.id;
    s.covens=s.covens.filter(id=>id!==h.id);s.newlyFriendly.push(h.id);s.pendingCombat=null;finishActivation(s);return;
  }
  for(const id of Advanced.stackIds(s,a.id))unitById(s,id).hexId=h.id;
  if(characteristic(d,'feral')||characteristic(d,'huge')){if(!s.razed.includes(h.id))s.razed.push(h.id);s.covens=s.covens.filter(id=>id!==h.id);log(s,`${h.settlement?.name} razed by ${d.name}.`);s.pendingCombat=null;finishActivation(s);return;}
  s.pendingCombat={attackerId,targetHex,stage:'settlement',decisionKingdom:a.kingdom,result:s.lastCombat??undefined};
}
function completeCombat(s:GameState,result:CombatResult):void {
  const p=s.pendingCombat!,a=s.units.find(u=>u.id===p.attackerId),h=hexById(s,p.targetHex);
  s.lastCombat=result;log(s,`Battle at ${h.settlement?.name??h.id}: ${result.attackerSuccesses} attacker / ${result.defenderSuccesses} defender successes; ${result.result}.`);
  const occupied=s.units.some(u=>u.hexId===p.targetHex&&!Advanced.isHero(s,u));
  if(a&&result.defenderHits>0&&!occupied){
    if(aliveSettlement(s,h)&&!isWelcoming(s,h,a.kingdom)){advanceInto(s,a.id,h.id);return;}
    if(canEnd(s,a,h)){s.pendingCombat={...p,stage:'advance',decisionKingdom:a.kingdom,result};return;}
  }
  s.pendingCombat=null;finishActivation(s);
}
function resolveCombat(s:GameState,ambush:'attacker'|'defender'|null):void {
  const p=s.pendingCombat!,a=unitById(s,p.attackerId),h=hexById(s,p.targetHex),d=s.units.find(u=>u.hexId===h.id),f=combatForecast(s,a.id,h.id);
  let ar:{rolls:DiceRoll[];successes:number;confirmed:number},dr:{rolls:DiceRoll[];successes:number;confirmed:number};
  let attackerHits=0,defenderHits=0,result:CombatResult['result']='draw';
  if(ambush){
    const first=ambush==='attacker'?a:d,second=ambush==='attacker'?d:a;
    const firstTarget=ambush==='attacker'?h:hexById(s,a.hexId),secondTarget=ambush==='attacker'?hexById(s,a.hexId):h;
    const fp=strikeDice(s,first,first?hexById(s,first.hexId):h),fr=rollPool(s,fp.light,fp.heavy);const hits=(fr.successes>0?1:0)+fr.confirmed;
    if(ambush==='attacker'){defenderHits=hits;hitArmy(s,d?.id,hits);}else{attackerHits=hits;hitArmy(s,a.id,hits);}
    const secondSurvives=second ? s.units.some(u=>u.id===second.id) : hits===0;
    let sr={rolls:[] as DiceRoll[],successes:0,confirmed:0};
    if(secondSurvives){const sp=strikeDice(s,second,second?hexById(s,second.hexId):h);sr=rollPool(s,sp.light,sp.heavy);const backHits=(sr.successes>0?1:0)+sr.confirmed;
      if(ambush==='attacker'){attackerHits=backHits;hitArmy(s,a.id,backHits);}else{defenderHits=backHits;hitArmy(s,d?.id,backHits);}}
    ar=ambush==='attacker'?fr:sr;dr=ambush==='attacker'?sr:fr;result='ambush';
  }else{
    ar=rollPool(s,f.attackerLight,f.attackerHeavy,f.fortificationPenalty);dr=rollPool(s,f.defenderLight,f.defenderHeavy);
    if(ar.successes>dr.successes){result='attacker';defenderHits=ar.successes-dr.successes;}
    else if(dr.successes>ar.successes){result='defender';attackerHits=dr.successes-ar.successes;}
    else if(ar.successes>0){result='tie';const aR=ability(defOf(s,a),'ranged'),dR=!!d&&ability(defOf(s,d),'ranged');if(aR&&!dR){result='attacker';defenderHits=1;}else if(dR&&!aR){result='defender';attackerHits=1;}}
    hitArmy(s,a.id,attackerHits);hitArmy(s,d?.id,defenderHits);
  }
  completeCombat(s,{attackerId:a.id,targetHex:h.id,attackerRolls:ar.rolls,defenderRolls:dr.rolls,attackerSuccesses:ar.successes,defenderSuccesses:dr.successes,attackerHits,defenderHits,result,...(ambush?{ambush}:{})});
}
function collapse(s:GameState,k:Kingdom,reason:string):void {
  if(k.collapsed)return;k.collapsed=true;if(s.advanced){for(const u of s.units.filter(u=>u.kingdom===k.id))Advanced.recordElimination(s,u,advancedContext());for(const m of s.advanced.monsters.filter(m=>m.kingdom===k.id))s.advanced.monsterPools[Advanced.monsterById(m.defId)!.pool].push(m.defId);s.advanced.monsters=s.advanced.monsters.filter(m=>m.kingdom!==k.id);}s.units=s.units.filter(u=>u.kingdom!==k.id);
  for(const id of Object.keys(s.controls))if(s.controls[id]===k.id)delete s.controls[id];
  if(k.id==='night')s.covens=[];
  log(s,`${k.name} collapses: ${reason}.`);
}
function evaluateVictory(s:GameState,atDeadline=false):void {
  if(s.phase==='game-over'||s.tabletop?.manualVictory)return;
  const invaderAlive=s.kingdoms.some(k=>k.side==='invader'&&!k.collapsed),resistanceAlive=s.kingdoms.some(k=>k.side==='resistance'&&!k.collapsed);
  if(!invaderAlive||!resistanceAlive){s.winner=invaderAlive?'invader':'resistance';s.victoryReason='All opposing Kingdoms have collapsed.';}
  else {
    const o=s.scenario.objective;
    if(o.type==='survival'){
      if(!atDeadline)return;
      const survived=o.kingdom?!kingdomOf(s,o.kingdom).collapsed:invaderAlive;
      s.winner=survived?'invader':'resistance';s.victoryReason=survived?'The invading Kingdom survives at the campaign deadline.':'The invading Kingdom did not survive.';
      s.phase='game-over';s.pendingCombat=null;s.activeUnitId=null;log(s,`${s.winner} victory. ${s.victoryReason}`);return;
    }
    if(!atDeadline&&(o.deadlineOnly??true))return;
    const count=o.hexIds.filter(id=>{const h=hexById(s,id),owner=settlementController(s,h);return !!owner&&(o.kingdom?owner===o.kingdom:kingdomOf(s,owner).side==='invader');}).length;
    const achieved=count>=o.count;
    if(atDeadline||achieved){s.winner=achieved?'invader':'resistance';s.victoryReason=`${count}/${o.count} objective settlements controlled${atDeadline?' at the campaign deadline':''}.`;}
  }
  if(s.winner){s.phase='game-over';s.pendingCombat=null;s.activeUnitId=null;log(s,`${s.winner==='invader'?'Invader':'Resistance'} victory. ${s.victoryReason}`);}
}
function beginTurn(s:GameState):void {
  s.currentKingdom=s.scenario.turnOrder[s.turnIndex]!;s.turnSerial++;s.phase='income-actions';s.newlyFriendly=[];s.incomeActionsUsed=[];s.covenProtected=[];s.activeUnitId=null;s.pendingCombat=null;s.remainingMP=0;s.moved=false;s.shipUsed=false;s.allRoad=true;
  const k=kingdomOf(s,s.currentKingdom);log(s,`${['Spring','Summer','Autumn'][s.season]}, Year ${s.year}: ${k.name} Income Actions.`);
  if(k.id==='empire'){
    if(s.advanced)s.advanced.effects=s.advanced.effects.filter(e=>!e.extra?.noSuppression);
    const die=randomDie(s,6)+(s.scenario.empireRevoltModifier??0),revolts=die>=6?0:die>=4?1:5-die;
    k.revolt=(k.revolt??0)+revolts;log(s,`Imperial revolt roll ${die}: +${revolts} revolts (${k.revolt} total).`);
    if(k.revolt>=20){collapse(s,k,'twentieth revolt');advanceTurn(s);}
  }
}
function advanceTurn(s:GameState):void {
  if(s.advanced&&(s.advanced as any).winterStart){delete (s.advanced as any).winterStart;beginTurn(s);return;}
  evaluateVictory(s);if(s.phase==='game-over')return;
  for(let guard=0;guard<20;guard++){
    s.turnIndex++;
    if(s.turnIndex>=s.scenario.turnOrder.length){
      if(s.year===s.scenario.endYear&&s.season===s.scenario.endSeason){s.turnIndex=s.scenario.turnOrder.indexOf(s.currentKingdom);evaluateVictory(s,true);return;}
      s.turnIndex=0;
      if(s.season===2){s.year++;s.season=0;if(s.advanced){s.turnIndex=s.scenario.turnOrder.findIndex(id=>!kingdomOf(s,id).collapsed);s.currentKingdom=s.scenario.turnOrder[s.turnIndex];(s.advanced as any).winterStart=true;Advanced.beginWinter(s,advancedContext());return;}log(s,'Winter is skipped in the Basic Game.');}else {s.season=(s.season+1) as 0|1|2;if(s.advanced){if(s.season===2)s.advanced.extraChurn=true;Advanced.assignStudyMarkers(s,advancedContext());}}
    }
    if(!kingdomOf(s,s.scenario.turnOrder[s.turnIndex]!).collapsed){beginTurn(s);return;}
  }
  throw new Error('No active Kingdom can take a turn.');
}
export function createGame(config:GameConfig):GameState {
  const c=structuredClone(config),scenario=c.scenario;if(c.profile==='advanced')for(const d of Advanced.heroDefinitions().filter(d=>scenario.kingdoms.some(k=>k.id===d.kingdom)))if(!c.unitDefinitions.some(x=>x.id===d.id))c.unitDefinitions.push(d);
  const s:GameState={version:1,hexes:c.hexes,unitDefinitions:c.unitDefinitions,scenario,kingdoms:scenario.kingdoms.map(k=>({...k,controller:c.controllers?.[k.id]??'human',collapsed:false,hasEverControlled:Object.values(scenario.initialControls??{}).includes(k.id)})),units:scenario.initialUnits.map((u,i)=>{const d=c.unitDefinitions.find(d=>d.id===u.defId);if(!d)throw new Error(`Unknown opening Army ${u.defId}`);return {...u,id:`unit-${i+1}`,kingdom:d.kingdom,weakened:u.weakened??false,activated:false};}),controls:{...scenario.initialControls},razed:[...scenario.initialRazed??[]],covens:[...scenario.initialCovens??[]],covenProtected:[],year:scenario.startYear,season:scenario.startSeason,phase:'income-actions',turnIndex:0,currentKingdom:scenario.turnOrder[0]!,activeUnitId:null,remainingMP:0,allRoad:true,moved:false,shipUsed:false,pendingCombat:null,lastCombat:null,rng:(c.seed??29051994)>>>0||1,serial:scenario.initialUnits.length+1,turnSerial:0,newlyFriendly:[],incomeActionsUsed:[],winner:null,victoryReason:'',log:[]};
  if(c.tabletop)s.tabletop={version:1,review:null,rulings:[],manualVictory:true,setupSource:c.scenario.source};
  if(c.profile==='advanced')Advanced.initializeAdvanced(s,c,advancedContext());
  const issues=validateState(s);if(issues.length)throw new Error(issues.join('; '));beginTurn(s);return s;
}
const sameAction=(a:Action,b:Action):boolean=>{
  if(a.type!==b.type)return false;
  const strip=(v:Action)=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='path'&&!(k==='ambush'&&(v as {ambush?:unknown}).ambush===undefined)).map(([k,val])=>[k,val]));
  const aa=strip(a),bb=strip(b);if(a.type==='resolve-combat'&&!('ambush'in aa))aa.ambush=null;if(b.type==='resolve-combat'&&!('ambush'in bb))bb.ambush=null;
  if(a.type==='suppress'&&!('amount'in aa))aa.amount=1;if(b.type==='suppress'&&!('amount'in bb))bb.amount=1;
  return Object.keys(aa).length===Object.keys(bb).length&&Object.keys(aa).every(k=>aa[k]===bb[k]);
};
export function applyAction(state:GameState,action:Action):GameState {
  const legal=legalActions(state).find(a=>sameAction(a,action));if(!legal)throw new Error(`Illegal action ${action.type} during ${state.phase}${state.pendingCombat?' / '+state.pendingCombat.stage:''}.`);
  const s=structuredClone(state),k=kingdomOf(s,s.currentKingdom);
  if(s.advanced&&ADVANCED_ACTIONS.has(legal.type)){Advanced.applyAdvancedAction(s,legal as AdvancedAction,advancedContext());const empire=s.kingdoms.find(k=>k.id==='empire');if(empire&&(empire.revolt??0)>=20&&!empire.collapsed){collapse(s,empire,'twentieth revolt');if(s.currentKingdom==='empire'){s.advanced.pending=null;s.advanced.battle=null;s.pendingCombat=null;advanceTurn(s);}else evaluateVictory(s);}Advanced.resolveImmediateTreasures(s);Advanced.flushAdvancedEvents(s,advancedContext());canonicalizeAdvanced(s);return s;}
  switch(legal.type){
    case 'activate':startActivation(s,unitById(s,legal.unitId));break;
    case 'move': {
      const u=unitById(s,legal.unitId); startActivation(s,u);
      const option=moveOptions(s,u.id).find(m=>m.hexId===legal.toHex)!;
      const from=hexById(s,u.hexId),to=hexById(s,legal.toHex);
      log(s,`${defOf(s,u).name}: ${from.settlement?.name??from.id} → ${to.settlement?.name??to.id} (${option.cost} MP${option.roadOnly?', all-road route':''}).`);
      if(s.advanced) {Advanced.beginMovement(s,u.id,option.path,false,advancedContext()); break;}
      u.hexId=legal.toHex; s.remainingMP-=option.cost; s.allRoad=option.roadOnly; s.moved=true;
      const swap=s.units.find(v=>v.id!==u.id&&v.hexId===u.hexId);
      if(swap) {u.activated=true;startActivation(s,swap);log(s,`${defOf(s,u).name} switches positions; ${defOf(s,swap).name} must leave next.`);}
      break;
    }
    case 'ship': {
      const u=unitById(s,legal.unitId); startActivation(s,u); s.shipUsed=true;if(s.advanced)s.advanced.shipsThisTurn=[...s.advanced.shipsThisTurn??[],...Advanced.stackIds(s,u.id)];
      const path=legal.path??[];
      if(s.advanced) Advanced.beginMovement(s,u.id,path,true,advancedContext());
      else {
        u.hexId=legal.toHex; encounterCoven(s,u); log(s,`${defOf(s,u).name} completes Ship Movement.`);
        const swap=s.units.find(v=>v.id!==u.id&&v.hexId===u.hexId);
        if(swap){u.activated=true;startActivation(s,swap);log(s,`${defOf(s,u).name} switches positions; ${defOf(s,swap).name} must leave next.`);}
        else if(u.kingdom!=='fjordland') finishActivation(s);
      }
      break;
    }
    case 'attack': {
      const u=unitById(s,legal.unitId);startActivation(s,u);encounterCoven(s,u);const f=combatForecast(s,u.id,legal.targetHex);
      s.pendingCombat={attackerId:u.id,targetHex:legal.targetHex,stage:'ambush',decisionKingdom:f.defenderCanAmbush?s.units.find(v=>v.id===f.defenderUnitId)!.kingdom:u.kingdom,...(f.defenderUnitId?{defenderUnitId:f.defenderUnitId}:{})};
      if(s.advanced)Advanced.startBattleMagic(s,advancedContext());else if(!f.attackerCanAmbush&&!f.defenderCanAmbush)resolveCombat(s,null);break;
    }
    case 'resolve-combat':if(s.advanced)Advanced.beginAdvancedRoll(s,legal.ambush??null,advancedContext());else resolveCombat(s,legal.ambush??null);break;
    case 'advance': {const p=s.pendingCombat!;if(legal.accept)advanceInto(s,p.attackerId,p.targetHex);else{s.pendingCombat=null;finishActivation(s);}break;}
    case 'settlement': {
      const p=s.pendingCombat!,h=hexById(s,p.targetHex);
      if(legal.choice==='control'){s.controls[h.id]=k.id;k.hasEverControlled=true;gainIncome(s,k.id);s.newlyFriendly.push(h.id);log(s,`${k.name} controls ${h.settlement?.name}.`);}else{if(!s.razed.includes(h.id))s.razed.push(h.id);log(s,`${h.settlement?.name} was razed.`);}
      s.covens=s.covens.filter(id=>id!==h.id);s.pendingCombat=null;finishActivation(s);break;
    }
    case 'recover': {const u=unitById(s,legal.unitId);startActivation(s,u);encounterCoven(s,u);k.gold-=defOf(s,u).recoveryCost;u.weakened=false;log(s,`${defOf(s,u).name} Recovers.`);finishActivation(s);break;}
    case 'regenerate': {const u=unitById(s,legal.unitId);kingdomOf(s,u.kingdom).gold-=defOf(s,u).recoveryCost;u.weakened=false;log(s,`${defOf(s,u).name} Regenerates.`);break;}
    case 'mine': {const u=unitById(s,legal.unitId);startActivation(s,u);k.gold++;log(s,'Oathborn Miners work a mine: +1 gold.');finishActivation(s);if(s.advanced)Advanced.queueAdvancedEvent(s,{type:'after-mining-action',unitId:u.id,kingdom:u.kingdom});break;}
    case 'pass':startActivation(s,unitById(s,legal.unitId));finishActivation(s);break;
    case 'build': {
      const d=s.unitDefinitions.find(d=>d.id===legal.defId)!,h=hexById(s,legal.hexId);k.gold-=d.cost;
      const ready=h.entry===k.id||(aliveSettlement(s,h)&&settlementController(s,h)===k.id);
      const built:Unit={id:`unit-${s.serial++}`,defId:d.id,kingdom:k.id,hexId:h.id,weakened:false,activated:!ready};s.units.push(built);if(s.advanced){const hero=s.units.find(u=>u.hexId===h.id&&Advanced.isHero(s,u));if(hero){s.advanced.stacks[hero.id]=built.id;if(hero.activated)built.activated=true;}}log(s,`${k.name} builds ${d.name} (${d.cost} gold), ${ready?'ready':'finished'}.`);break;
    }
    case 'coven': {
      const h=hexById(s,legal.hexId),dominia=s.advanced&&s.units.some(u=>u.defId==='hero-night-13'&&Math.max(Math.abs(h.q-hexById(s,u.hexId).q),Math.abs(h.r-hexById(s,u.hexId).r),Math.abs(h.q+h.r-hexById(s,u.hexId).q-hexById(s,u.hexId).r))<=5),raw=dominia?5:randomDie(s,6);let modifier=0;
      if(!s.units.some(u=>u.hexId===h.id))modifier++;if(!h.settlement?.fortified)modifier++;if(wilderness(h)||adjacentHexes(s,h.id).some(t=>wilderness(t)))modifier++;
      if(raw+modifier>=5)s.covens.push(h.id);s.incomeActionsUsed.push('coven');log(s,`Coven placement at ${h.settlement?.name}: ${dominia?'automatic near Dominia':raw+'+'+modifier} ${raw+modifier>=5?'succeeds':'fails'}.`);break;
    }
    case 'lay-waste':raze(s,hexById(s,legal.hexId),true);break;
    case 'remove-control': {
      const h=hexById(s,legal.hexId);loseIncome(s,k.id);delete s.controls[h.id];
      if(!isWelcoming(s,h,k.id)){if(!s.razed.includes(h.id))s.razed.push(h.id);s.covens=s.covens.filter(id=>id!==h.id);}else if(h.settlement?.loyalty)gainIncome(s,h.settlement.loyalty);
      log(s,`${k.name} removes its control marker from ${h.settlement?.name}.`);break;
    }
    case 'remove-coven':s.covens=s.covens.filter(id=>id!==legal.hexId);log(s,`Army of the Night removes its Coven from ${hexById(s,legal.hexId).settlement?.name}.`);break;
    case 'recolonize': {
      const h=hexById(s,legal.hexId);k.gold-=2;s.razed=s.razed.filter(id=>id!==h.id);gainIncome(s,h.settlement?.loyalty??k.id);
      if(!h.settlement?.loyalty){s.controls[h.id]=k.id;k.hasEverControlled=true;}s.newlyFriendly.push(h.id);log(s,`${h.settlement?.name} rebuilt for 2 gold.`);break;
    }
    case 'disband-siege':s.units=s.units.filter(u=>u.id!==legal.unitId);log(s,`${k.name} disbands its Siege Engine.`);break;
    case 'suppress':k.gold--;k.revolt=Math.max(0,(k.revolt??0)-1);log(s,`Imperial revolt suppressed; ${k.revolt} remain.`);break;
    case 'transfer-gold':k.gold-=2;kingdomOf(s,legal.toKingdom).gold++;log(s,`${k.name} transfers 2 gold; allied ${kingdomOf(s,legal.toKingdom).name} receives 1 gold.`);break;
    case 'collect-income': {
      if(isShashka(k.id)){
        const dues=Object.values(s.controls).filter(id=>id===k.id).length;
        if(k.gold<dues){collapse(s,k,'cannot pay 1 gold per controlled Settlement');advanceTurn(s);break;}k.gold-=dues;log(s,`Shashka maintenance: −${dues} gold; no ordinary income.`);
      }else {
        const income=k.income+(k.id==='night'?s.covens.length:0);k.gold+=income;log(s,`${k.name} collects ${income} gold.`);
        if(k.id==='empire'){const dues=k.revolt??0,paid=Math.min(dues,k.gold);k.gold-=paid;k.revolt=(k.revolt??0)+(dues-paid);log(s,`Empire pays ${paid} revolt gold${dues>paid?`, +${dues-paid} unpaid revolts`:''}.`);if((k.revolt??0)>=20){collapse(s,k,'twentieth revolt');advanceTurn(s);break;}}
      }
      s.phase='activation';if(s.advanced)Advanced.advancedTurnReady(s);for(const u of s.units)if(u.kingdom===k.id)u.activated=false;break;
    }
    case 'end-turn': {
      finishActivation(s);for(const u of s.units)if(u.kingdom===k.id)u.activated=true;
      if(isShashka(k.id)&&k.hasEverControlled&&!Object.values(s.controls).includes(k.id))collapse(s,k,'no controlled Settlements at the end of its Activation Phase');
      const cities=s.hexes.filter(h=>h.settlement?.city&&h.settlement.loyalty===k.id&&h.id!==(s.advanced as any)?.khazud),threshold=k.cityCollapseThreshold??(k.id==='empire'?2:k.id==='oathborn'?3:1);
      if(cities.length>=threshold&&cities.length>0&&cities.every(h=>s.razed.includes(h.id)||!isWelcoming(s,h,k.id)))collapse(s,k,'all Cities razed or enemy controlled');
      evaluateVictory(s);if(s.phase!=='game-over'){if(s.advanced)Advanced.beginStudy(s,advancedContext());else advanceTurn(s);}break;
    }
  }
  if(s.advanced){Advanced.resolveImmediateTreasures(s);Advanced.flushAdvancedEvents(s,advancedContext());}canonicalizeAdvanced(s);return s;
}
export function botAction(s:GameState):Action|null {
  const actions=legalActions(s);if(!actions.length)return null;
  if(s.advanced?.pending){const p=s.advanced.pending;if(p.kind==='study')return actions.find(a=>a.type==='study'&&a.discipline==='spells'&&!a.discardId)??actions.find(a=>a.type==='study'&&!('discardId' in a))??actions.find(a=>a.type==='finish-study')??actions[0]!;if(p.kind==='winter')return actions.find(a=>a.type==='finish-winter')??actions[0]!;if(p.kind==='hit')return actions.find(a=>a.type==='allocate-hit'&&!Advanced.isHero(s,unitById(s,a.unitId)))??actions[0]!;if(p.kind==='window')return actions.find(a=>a.type==='play-card'&&['blessing'].includes(Advanced.cardById(a.cardId)?.kind??'')&&a.targetId&&s.units.find(u=>u.id===a.targetId)?.kingdom===advancedActor(s))??actions.find(a=>a.type==='magic-pass')??actions[0]!;return actions[0]!;}
  if(s.pendingCombat){
    if(s.pendingCombat.stage==='settlement')return actions.find(a=>a.type==='settlement'&&a.choice==='control')??actions[0]!;
    if(s.pendingCombat.stage==='advance')return actions.find(a=>a.type==='advance'&&a.accept)??actions[0]!;
    const f=combatForecast(s,s.pendingCombat.attackerId,s.pendingCombat.targetHex);
    if(f.defenderCanAmbush)return actions.find(a=>a.type==='resolve-combat'&&a.ambush==='defender')!;
    if(f.attackerCanAmbush&&f.attackerExpected< f.defenderExpected)return actions.find(a=>a.type==='resolve-combat'&&a.ambush==='attacker')!;
    return actions[0]!;
  }
  const k=kingdomOf(s,s.currentKingdom);
  if(s.phase==='income-actions'){
    if(k.id==='night'){const covens=actions.filter((a):a is Extract<Action,{type:'coven'}>=>a.type==='coven');if(covens.length)return covens.sort((a,b)=>{const ha=hexById(s,a.hexId),hb=hexById(s,b.hexId);return (Number(!!wilderness(hb))+Number(!hb.settlement?.fortified)+Number(!s.units.some(u=>u.hexId===hb.id)))-(Number(!!wilderness(ha))+Number(!ha.settlement?.fortified)+Number(!s.units.some(u=>u.hexId===ha.id)));})[0]!;}
    if(isShashka(k.id)){const dues=Object.values(s.controls).filter(id=>id===k.id).length;if(k.gold<dues+2&&dues>1){const waste=actions.find(a=>a.type==='lay-waste');if(waste)return waste;}}
    return {type:'collect-income'};
  }
  if(s.advanced&&!s.activeUnitId&&s.units.filter(u=>u.kingdom===k.id&&Advanced.isHero(s,u)).length<2){const hero=actions.find(a=>a.type==='recruit-hero');if(hero)return hero;}
  if(s.advanced){const power=actions.find(a=>a.type==='hero-power'&&a.casterId&&s.units.find(u=>u.id===a.casterId)?.kingdom===k.id);if(power)return power;const explore=actions.find(a=>a.type==='explore-lair');if(explore)return explore;const ms=actions.find(a=>a.type==='monster-strike');if(ms)return ms;}
  const regen=actions.find(a=>a.type==='regenerate'&&unitById(s,a.unitId).kingdom===s.currentKingdom);if(regen)return regen;
  const recover=actions.find(a=>a.type==='recover');if(recover)return recover;
  const attacks=actions.filter((a):a is Extract<Action,{type:'attack'}>=>a.type==='attack').sort((a,b)=>{
    const fa=combatForecast(s,a.unitId,a.targetHex),fb=combatForecast(s,b.unitId,b.targetHex);
    return (fb.attackerExpected-fb.defenderExpected+Number(aliveSettlement(s,hexById(s,b.targetHex))))-(fa.attackerExpected-fa.defenderExpected+Number(aliveSettlement(s,hexById(s,a.targetHex))));
  });
  const good=attacks.find(a=>{const f=combatForecast(s,a.unitId,a.targetHex);return f.attackerExpected>=f.defenderExpected*0.65;});if(good)return good;
  const mine=actions.find(a=>a.type==='mine');if(mine)return mine;
  if(k.id==='empire'&&(k.revolt??0)>1){const suppress=actions.find(a=>a.type==='suppress');if(suppress)return suppress;}
  const objective=s.scenario.objective.hexIds;
  const threats=s.hexes.filter(h=>(aliveSettlement(s,h)&&!isWelcoming(s,h,k.id))||s.units.some(u=>u.hexId===h.id&&!sameSide(s,u.kingdom,k.id)));
  const distance=(a:Hex,b:Hex)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs((a.q+a.r)-(b.q+b.r)));
  const goalDistance=(h:Hex)=>Math.min(...threats.map(t=>distance(h,t)-(objective.includes(t.id)?0.4:0)),Infinity);
  const moves=actions.filter((a):a is Extract<Action,{type:'move'|'ship'}>=>a.type==='move'||a.type==='ship').filter(a=>goalDistance(hexById(s,a.toHex))<goalDistance(hexById(s,unitById(s,a.unitId).hexId)));
  moves.sort((a,b)=>goalDistance(hexById(s,a.toHex))-goalDistance(hexById(s,b.toHex)));
  if(moves.length)return moves[0]!;
  if(s.activeUnitId)return actions.find(a=>a.type==='pass')??actions.find(a=>a.type==='move'||a.type==='ship')??actions.find(a=>a.type==='end-turn')??actions[0]!;
  const builds=actions.filter((a):a is Extract<Action,{type:'build'}>=>a.type==='build');
  if(builds.length&&s.units.filter(u=>u.kingdom===k.id).length<12){builds.sort((a,b)=>{const da=s.unitDefinitions.find(d=>d.id===a.defId)!,db=s.unitDefinitions.find(d=>d.id===b.defId)!;return (goalDistance(hexById(s,a.hexId))-goalDistance(hexById(s,b.hexId)))+(da.cost-(da.light+da.heavy*1.8))-(db.cost-(db.light+db.heavy*1.8));});return builds[0]!;}
  if(attacks.length)return attacks[0]!;
  return actions.find(a=>a.type==='end-turn')??actions[0]!;
}
export function validateState(value:unknown):string[] {
  const issues:string[]=[];if(!value||typeof value!=='object')return ['Saved game must be an object.'];
  const s=value as GameState;
  const tableIssues=validateTabletop(s.tabletop);if(tableIssues.length)return tableIssues;
  const advancedIssues=Advanced.validateAdvancedShape(s.advanced);if(advancedIssues.length)return advancedIssues;
  if(s.version!==1)issues.push('Unsupported saved-game version.');
  if(!Array.isArray(s.hexes)||!Array.isArray(s.unitDefinitions)||!Array.isArray(s.units)||!Array.isArray(s.kingdoms))return [...issues,'Missing board, Army definitions, units, or Kingdoms.'];
  if(s.tabletop?.enslaved?.some(x=>!s.units.some(u=>u.id===x.armyId&&!Advanced.isHero(s,u))))return ['Unknown Enslaved Hero Army.'];
  if(s.tabletop?.review&&!s.advanced?.players.some(p=>p.id===s.tabletop!.review!.playerId))return ['Unknown table resolver.'];
  if(s.hexes.length>5000||s.units.length>2000||s.unitDefinitions.length>1000||s.kingdoms.length>6)return ['Saved game exceeds supported limits.'];
  if(!s.scenario||!Array.isArray(s.scenario.turnOrder)||!s.scenario.objective)return [...issues,'Missing campaign definition.'];
  const hexIds=new Set(s.hexes.map(h=>h.id)),defIds=new Set(s.unitDefinitions.map(d=>d.id)),kingdomIds=new Set(s.kingdoms.map(k=>k.id)),unitIds=new Set<string>();
  if(hexIds.size!==s.hexes.length)issues.push('Duplicate board hex IDs.');if(defIds.size!==s.unitDefinitions.length)issues.push('Duplicate Army definition IDs.');
  if(!kingdomIds.has(s.currentKingdom))issues.push('Unknown current Kingdom.');
  if(!['income-actions','activation','game-over'].includes(s.phase))issues.push('Unknown phase.');
  if(!Number.isInteger(s.year)||s.year<1||![0,1,2].includes(s.season)||s.year*3+s.season<s.scenario.startYear*3+s.scenario.startSeason||s.year*3+s.season>s.scenario.endYear*3+s.scenario.endSeason)issues.push('Invalid campaign date.');
  if(!Number.isInteger(s.rng)||s.rng<1||s.rng>0xffffffff)issues.push('Invalid deterministic random state.');
  const integer=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
  if(!integer(s.turnIndex,0,s.scenario.turnOrder.length-1)||s.currentKingdom!==s.scenario.turnOrder[s.turnIndex])issues.push('Current Kingdom and turn order disagree.');
  if(!integer(s.serial,1,10000000)||!integer(s.turnSerial,0,10000000)||!integer(s.remainingMP,-100,100))issues.push('Invalid activation counters.');
  for(const key of ['allRoad','moved','shipUsed'] as const)if(typeof s[key]!=='boolean')issues.push(`Invalid ${key} flag.`);
  if(!Array.isArray(s.log)||s.log.length>250||s.log.some(l=>typeof l!=='string'||l.length>2000))issues.push('Invalid game log.');
  for(const key of ['razed','covens','covenProtected','newlyFriendly','incomeActionsUsed'] as const)if(!Array.isArray(s[key])||s[key].length>5000||s[key].some(v=>typeof v!=='string'||v.length>100))issues.push(`Invalid ${key} list.`);
  if(issues.some(i=>i.startsWith('Invalid ')&&i.endsWith(' list.')))return issues;
  if(!s.controls||typeof s.controls!=='object'||Array.isArray(s.controls))return [...issues,'Invalid control markers.'];
  if(s.activeUnitId!==null&&typeof s.activeUnitId!=='string')issues.push('Invalid active Army pointer.');
  if(s.winner!==null&&!['invader','resistance'].includes(s.winner))issues.push('Invalid winning side.');
  if((s.phase==='game-over')!==(s.winner!==null)||typeof s.victoryReason!=='string'||s.victoryReason.length>2000)issues.push('Invalid terminal game result.');
  for(const h of s.hexes)if(!Number.isFinite(h.q)||!Number.isFinite(h.r)||typeof h.id!=='string')issues.push('Invalid board coordinates.');
  for(const k of s.kingdoms){
    if(!integer(k.gold,0,1000000)||!integer(k.income,0,10000)||!['human','ai'].includes(k.controller)||(k.revolt!==undefined&&!integer(k.revolt,0,k.collapsed?10000:19))||typeof k.collapsed!=='boolean'||typeof k.hasEverControlled!=='boolean')issues.push(`Invalid resources/controller for ${k.id}.`);
    const original=s.scenario.kingdoms.find(o=>o.id===k.id);if(!original||original.side!==k.side||original.name!==k.name||original.controlLimit!==k.controlLimit||original.cityCollapseThreshold!==k.cityCollapseThreshold)issues.push(`Kingdom ${k.id} disagrees with campaign definition.`);
    if(k.collapsed&&s.units.some(u=>u.kingdom===k.id))issues.push(`Collapsed Kingdom ${k.id} has Armies.`);
  }
  let transit:any=null;
  const findTransit=(p:any,depth=0):void=>{if(!p||depth>40)return;if(p.kind==='window'&&p.window==='movement'&&Array.isArray(p.event?.path)&&p.event.path.length)transit=p.event;findTransit(p.resume,depth+1);findTransit(p.immediateResume,depth+1);};
  findTransit(s.advanced?.pending);
  const movingIds=transit&&s.activeUnitId?Advanced.stackIds(s,s.activeUnitId):[];
  const inTransit=(u:Unit)=>!!transit&&movingIds.includes(u.id)&&u.hexId===transit.enteredHex;
  for(const u of s.units){
    if(unitIds.has(u.id))issues.push('Duplicate Army instance IDs.');unitIds.add(u.id);
    if(typeof u.id!=='string'||!/^unit-[1-9][0-9]*$/.test(u.id)||Number(u.id.slice(5))>=s.serial||typeof u.weakened!=='boolean'||typeof u.activated!=='boolean')issues.push(`Invalid Army flags/identity for ${u.id}.`);
    if(!hexIds.has(u.hexId)||!defIds.has(u.defId)||!kingdomIds.has(u.kingdom))issues.push(`Invalid Army ${u.id}.`);
    const definition=s.unitDefinitions.find(d=>d.id===u.defId);if(definition?.kingdom!==u.kingdom&&!(s.advanced as any)?.enslaved?.[u.id])issues.push(`Army ${u.id} belongs to the wrong Kingdom.`);
    if(definition&&characteristic(definition,'fragile')&&u.weakened)issues.push(`Fragile Army ${u.id} cannot be weakened.`);
    const h=s.hexes.find(h=>h.id===u.hexId),passing=!!h&&inTransit(u)&&canPass(s,u,h,!!transit.ship);if(h&&(h.prohibited||!passing&&(h.terrain==='lair'||(h.terrain==='sea'&&h.entry!==u.kingdom)||(h.entry&&h.entry!==u.kingdom))))issues.push(`Army ${u.id} occupies prohibited terrain.`);
    const occupants=s.units.filter(v=>v.hexId===u.hexId&&!(transit&&movingIds.includes(v.id)&&inTransit(v)));if(occupants.length>1&&!(s.advanced&&occupants.length===2&&occupants.filter(v=>Advanced.isHero(s,v)).length===1&&occupants.every(v=>v.kingdom===u.kingdom))){const active=occupants.find(v=>v.id===s.activeUnitId);if(occupants.length!==2||!active||active.activated||occupants.some(v=>v.kingdom!==active.kingdom)||!occupants.some(v=>v.id!==active.id&&v.activated))issues.push('Illegal Army stacking.');}
  }
  for(const d of s.unitDefinitions)if(s.units.filter(u=>u.defId===d.id).length>d.count)issues.push(`Army supply exceeded for ${d.name}.`);
  for(const [id,k] of Object.entries(s.controls??{}))if(!hexIds.has(id)||!kingdomIds.has(k)||!s.hexes.find(h=>h.id===id)?.settlement)issues.push('Invalid control marker.');
  for(const k of s.kingdoms)if(Object.values(s.controls).filter(id=>id===k.id).length+(k.id==='night'?s.covens.length:0)>controlCapacity(k))issues.push(`Control/Coven marker supply exceeded for ${k.name}.`);
  for(const id of [...s.razed??[],...s.covens??[]])if(!hexIds.has(id)||!s.hexes.find(h=>h.id===id)?.settlement)issues.push('Invalid razed/Coven marker.');
  if(s.activeUnitId&&!unitIds.has(s.activeUnitId))issues.push('Active Army does not exist.');
  if(s.pendingCombat){const p=s.pendingCombat;if((!unitIds.has(p.attackerId)&&!s.advanced?.battle)||!hexIds.has(p.targetHex)||!['ambush','advance','settlement'].includes(p.stage)||!kingdomIds.has(p.decisionKingdom)||s.phase!=='activation'||(!s.advanced?.battle&&(!s.activeUnitId||!Advanced.stackIds(s,s.activeUnitId).includes(p.attackerId))))issues.push('Invalid pending combat.');}
  if(s.activeUnitId&&(s.phase!=='activation'||s.units.find(u=>u.id===s.activeUnitId)?.kingdom!==s.currentKingdom||s.units.find(u=>u.id===s.activeUnitId)?.activated))issues.push('Invalid active Army status.');
  if(new Set(s.razed).size!==s.razed.length||new Set(s.covens).size!==s.covens.length)issues.push('Duplicate settlement markers.');
  for(const id of s.razed)if(s.controls[id]||s.covens.includes(id))issues.push('Razed settlement has conflicting markers.');
  const checkCombat=(r:CombatResult)=>{
    if(!r||typeof r!=='object'||!['attacker','defender','tie','draw','ambush'].includes(r.result)||!hexIds.has(r.targetHex)||!Array.isArray(r.attackerRolls)||!Array.isArray(r.defenderRolls))return false;
    for(const key of ['attackerSuccesses','defenderSuccesses','attackerHits','defenderHits'] as const)if(!integer(r[key],0,500))return false;
    for(const pool of [r.attackerRolls,r.defenderRolls]){if(pool.length>150)return false;for(const die of pool)if(![6,8].includes(die.sides)||!integer(die.raw,1,die.sides)||!integer(die.modified,-100,100)||typeof die.success!=='boolean'||typeof die.critical!=='boolean'||(die.confirmation!==undefined&&!integer(die.confirmation,1,s.advanced?8:6)))return false;}
    return true;
  };
  if(s.lastCombat!==null&&!checkCombat(s.lastCombat))issues.push('Invalid combat receipt.');
  if(s.pendingCombat?.result&&!checkCombat(s.pendingCombat.result))issues.push('Invalid pending combat receipt.');
  for(const id of s.scenario.turnOrder)if(!kingdomIds.has(id))issues.push('Campaign turn order references missing Kingdom.');
  for(const id of s.scenario.objective.hexIds)if(!hexIds.has(id))issues.push('Campaign objective references missing hex.');
  if(s.scenario.turnOrder.length<2||s.scenario.turnOrder.length>6)issues.push('Campaign requires 2–6 Kingdoms.');
  issues.push(...Advanced.validateAdvanced(s),...validateCompanionShape(s.companion,s));return issues;
}
export const exportGame=(s:GameState):string=>JSON.stringify(s,null,2);
export function importGame(json:string):GameState {
  if(typeof json!=='string'||json.length>20_000_000)throw new Error('Saved game exceeds 20 MB.');
  const value:unknown=JSON.parse(json),issues=validateState(value);if(issues.length)throw new Error(issues.join('; '));
  const s=value as GameState;
  validateContentPack({version:1,hexes:s.hexes,unitDefinitions:s.unitDefinitions,scenario:s.scenario});
  return s;
}

export function consumeTableHit(s:GameState):void{if(!s.tabletop)throw new Error('This is not a tabletop campaign.');Advanced.consumeTableHit(s,advancedContext());Advanced.flushAdvancedEvents(s,advancedContext());canonicalizeAdvanced(s);}
export const advancedActor=(s:GameState)=>s.tabletop?.review?Advanced.playerFor(s,s.currentKingdom)?.id===s.tabletop.review.playerId?s.currentKingdom:s.advanced!.players.find(p=>p.id===s.tabletop!.review!.playerId)!.kingdoms[0]:Advanced.advancedActor(s);
const ADVANCED_ACTIONS=new Set(['winter-ruling','store-satchel','remove-curse','play-card','hero-power','magic-pass','study','finish-study','sell-treasure','finish-winter','recruit-hero','drop-hero','drop-army','request-cantrip','join-stack','allocate-hit','accept-hit','explore-lair','attack-monster','monster-strike','monster-pass','slink-away','command-monster','magic-choice']);
function moveAdvancedStep(s:GameState,id:string,toId:string,ship:boolean,join:boolean):boolean {
  const u=s.units.find(v=>v.id===id);if(!u)return false;
  const from=u.hexId,to=hexById(s,toId),group=Advanced.stackIds(s,id);
  if(!adjacent(s,from,toId)||!canCross(s,u,from,toId,ship)||!canPass(s,u,to,ship))return false;
  for(const member of group) {
    const v=unitById(s,member);
    if(!ship)s.advanced!.movement[member]=(s.advanced!.movement[member]??defOf(s,v).movement)-movementCost(s,v,from,to);
    v.hexId=toId;
  }
  if(!ship){s.remainingMP=Math.min(...group.map(id=>s.advanced!.movement[id]));s.allRoad=s.allRoad&&!!edge(s,from,toId).road&&!ability(defOf(s,u),'flying');s.moved=true;}
  const partner=join&&group.length===1?s.units.find(v=>!group.includes(v.id)&&v.hexId===toId&&v.kingdom===u.kingdom&&Advanced.isHero(s,v)!==Advanced.isHero(s,u)):undefined;
  if(partner){
    s.advanced!.stacks[Advanced.isHero(s,u)?u.id:partner.id]=Advanced.isHero(s,u)?partner.id:u.id;
    s.advanced!.activationIds=Advanced.stackIds(s,id);
    s.advanced!.movement[partner.id]??=defOf(s,partner).movement;
    if(partner.activated)finishActivation(s);
  }
  return true;
}
function advancedContext():AdvancedContext{return {log,die:randomDie,hex:hexById,unit:unitById,def:defOf,rawDef,sameSide,adjacent:adjacentHexes,welcoming:isWelcoming,controller:settlementController,besieged:isBesieged,canEnd,buildLocations,recoverable,finish:finishActivation,start:startActivation,hit:hitArmy,forecast:combatForecast,complete:completeCombat,advanceTurn,raze,moveStep:moveAdvancedStep,seaEdge:(s,from,to)=>!!edge(s,from,to).sea,seaCoastalEdge:(s,from,to)=>!!(edge(s,from,to).sea||edge(s,from,to).coastal)};}

function canonicalizeAdvanced(s:GameState){if(s.advanced&&s.activeUnitId)s.remainingMP=Math.min(...Advanced.stackIds(s,s.activeUnitId).map(id=>s.advanced!.movement[id]??defOf(s,unitById(s,id)).movement));const clean=(v:any)=>{if(!v||typeof v!=='object')return;for(const key of Object.keys(v)){if(v[key]===undefined)delete v[key];else clean(v[key]);}};clean(s.advanced);clean(s.pendingCombat);}
