import type {GameState, Side,ScenarioKingdom} from './engine.js';

export interface OpeningKingdom {
  kingdom:string; gold:number; heroes?:number; covens?:number;
  freeUnits?:{defId:string;count:number;weakened?:boolean;hexIds?:string[];optional?:boolean}[];
  extraHeroes?:{kingdom:string;count:number;hexIds?:string[]}[];
  heroIds?:string[]; unavailableHeroIds?:string[];
  deploymentHexIds?:string[]; minerHexIds?:string[];
  discardUnspent?:boolean; spendLimits?:{hexIds:string[];max:number}[];
  exchangeControlForCoven?:boolean;
}
export type CampaignCondition =
  | {type:'all';conditions:CampaignCondition[]}
  | {type:'any';conditions:CampaignCondition[]}
  | {type:'count';metric:'controlled'|'markers'|'controlled-or-razed'|'occupied'|'presence';kingdoms?:string[];side?:Side;hexIds?:string[];loyalties?:(string|null)[];atLeast:number}
  | {type:'collapse';kingdoms:string[];any?:boolean}
  | {type:'income';kingdom:string;atMost:number;deductRevolts?:boolean}
  | {type:'enemy-city-occupied';side:Side};
export interface CampaignVictory {
  immediate?:{winner:Side;condition:CampaignCondition;check?:'action'|'turn-end'|'season-end';afterKingdom?:string;fromYear?:number;fromSeason?:0|1|2;reason?:string}[];
  deadline:{type:'condition';condition:CampaignCondition;winner:Side;otherwise:Side}|{type:'score';metric:'settlements'|'markers'|'income';tieWinner:Side;treasureMajorityPoint?:boolean;deductRevolts?:boolean;hexIds?:string[]};
  collapseWins?:boolean;
}
export type CampaignSpecialRule =
  | {type:'no-collapse';kingdoms:string[]}
  | {type:'raze-repair-cost';kingdom:string;cost:number}
  | {type:'no-gold-transfer';fromKingdom:string;toKingdom:string}
  | {type:'allied-contingent';kingdom:string;activatedBy:string;noRebuild?:boolean;disableBlessings?:boolean}
  | {type:'fixed-defender';defId:string;hexId:string;actingKingdom?:string;covenCheckTurn?:string}
  | {type:'restore-loyalty';hexId:string;kingdom:string;controller:string}
  | {type:'revolt-modifier';modifier:number;fromYear?:number;fromSeason?:0|1|2}
  | {type:'withdraw';kingdom:string;year:number;season:0|1|2;razeControls?:boolean}
  | {type:'fragile-defender';defId:string;hexId:string;kingdom:string;readyAdjacentBuilds?:boolean};
export interface PublishedCampaignRules {
  number?:number;series:'intro'|'scroll'|'chronicle';
  study?:{glyphs:number;churns:number};
  deploymentOrder:string[][];opening:OpeningKingdom[];
  preControls?:{kingdom:string;count:number;hexIds:string[];excludeOtherControls?:boolean}[];
  preChoices?:{id:string;label:string;options:{value:string;label:string;controls?:Record<string,string>;razed?:string[];entries?:Record<string,string>}[]}[];
  nonplayerControls?:Record<string,string>;
  nonplayerAllies?:Record<string,string[]>;
  competitiveInvaders?:{leadKingdom:string;otherKingdom:string;requiredMarkerLead:number};
  abandonedLairs?:string[];
  specialRules:CampaignSpecialRule[];victory:CampaignVictory;
  chronicle?:{book:number;chapter:number;endingChapter?:number;nextScenarioId?:string;historicalStartYear?:number;treatyYear?:number;abandonFromYear?:number;returnFjord?:{kingdom:ScenarioKingdom;opening:OpeningKingdom;turnOrder:string[];year:number;afterCollapseYears:number};bitterDefender?:{defId:string;hexId:string;kingdom:string;winterYear:number}};
}
export interface OpeningDeploymentState {
  remainingHeroes:string[];remainingCovens:number;remainingFreeUnits:{defId:string;weakened?:boolean;hexIds?:string[];optional?:boolean}[];heroLocations:Record<string,string[]>;spentByHex:Record<string,number>;
}
export interface OpeningState {
  order:string[];index:number;remainingHeroes:string[];remainingCovens:number;
  remainingFreeUnits:{defId:string;weakened?:boolean;hexIds?:string[];optional?:boolean}[];
  heroLocations:Record<string,string[]>;
  preControlsIndex:number;preControlsPlaced:number;spentByHex:Record<string,number>;
  preChoicesIndex:number;choices:Record<string,string>;
  exchanged:string[];
  groupIndex:number;done:string[];deployments:Record<string,OpeningDeploymentState>;
}
export interface CampaignRuntimeState {withdrawn:string[];nextScenarioId?:string;history?:{scenarioId:string;winner:Side|null;reason:string}[];abandonedLairs?:string[];reservedMonsters?:string[];fjordCollapsedAt?:{year:number;season:0|1|2};fjordReturned?:boolean;winterAbandonYear?:number;pendingAbandon?:Side[];bitterPlaced?:boolean;pendingBitterDisplacement?:string;resumeOpeningTurn?:{kingdom:string;turnIndex:number};resumeEventTurn?:{kingdom:string;turnIndex:number};beginTurnAfterEvent?:boolean;}
export type CampaignAction={type:'campaign-abandon';hexId:string}|{type:'campaign-displace';toHex:string};
export type OpeningAction = {type:'opening-switch';kingdom:string}|{type:'opening-choice';choiceId:string;value:string}|{type:'opening-control';hexId:string}|{type:'opening-build';defId:string;hexId:string}|{type:'opening-hero';defId:string;hexId:string}|{type:'opening-coven';hexId:string}|{type:'opening-exchange-coven';hexId:string}|{type:'opening-done'};

export function campaignRules(s:GameState):CampaignSpecialRule[]{return s.scenario.sourceCampaign?.specialRules??[];}
export function actingKingdom(s:GameState,printed:string):string {return campaignRules(s).find((r):r is Extract<CampaignSpecialRule,{type:'allied-contingent'}>=>r.type==='allied-contingent'&&r.kingdom===printed)?.activatedBy??printed;}
export function canCollapse(s:GameState,kingdom:string):boolean {return !campaignRules(s).some(r=>r.type==='no-collapse'&&r.kingdoms.includes(kingdom));}
export function repairCost(s:GameState,kingdom:string):number{return campaignRules(s).find((r):r is Extract<CampaignSpecialRule,{type:'raze-repair-cost'}>=>r.type==='raze-repair-cost'&&r.kingdom===kingdom)?.cost??2;}
export function fixedUnit(s:GameState,defId:string,hexId:string):boolean{return campaignRules(s).some(r=>r.type==='fixed-defender'&&r.defId===defId&&r.hexId===hexId);}
export function campaignRevoltModifier(s:GameState):number {let value=s.scenario.empireRevoltModifier??0;for(const r of campaignRules(s))if(r.type==='revolt-modifier'&&(r.fromYear===undefined||s.year*3+s.season>=r.fromYear*3+(r.fromSeason??0)))value=r.modifier;return value;}

function kingdomsFor(s:GameState,c:{kingdoms?:string[];side?:Side}):string[]{return c.kingdoms??s.kingdoms.filter(k=>!c.side||k.side===c.side).map(k=>k.id);}
export function campaignCondition(s:GameState,c:CampaignCondition):boolean {
  if(c.type==='all')return c.conditions.every(x=>campaignCondition(s,x));
  if(c.type==='any')return c.conditions.some(x=>campaignCondition(s,x));
  if(c.type==='collapse'){const result=c.kingdoms.map(id=>s.kingdoms.find(k=>k.id===id)?.collapsed??false);return c.any?result.some(Boolean):result.every(Boolean);}
  if(c.type==='income'){const k=s.kingdoms.find(k=>k.id===c.kingdom);return !!k&&k.income-(c.deductRevolts?(k.revolt??0):0)<=c.atMost;}
  if(c.type==='enemy-city-occupied')return s.hexes.some(h=>{
    if(!h.settlement?.city||s.razed.includes(h.id)||!s.units.some(u=>u.hexId===h.id&&s.unitDefinitions.find(d=>d.id===u.defId)?.kind!=='hero'&&s.kingdoms.find(k=>k.id===u.kingdom)?.side===c.side))return false;
    // The conquering Army's new Control must not erase the victory trigger.
    // Resolve hostility from the source's underlying Loyalty/Posture instead.
    const loyal=s.kingdoms.find(k=>k.id===h.settlement?.loyalty);
    const allies=h.settlement.loyalty?s.scenario.sourceCampaign?.nonplayerAllies?.[h.settlement.loyalty]:undefined;
    const welcoming=loyal?loyal.side===c.side:(allies??h.settlement.neutralFriendlyTo??[]).some(id=>s.kingdoms.find(k=>k.id===id)?.side===c.side);
    return !welcoming;
  });
  const eligible=kingdomsFor(s,c),hexes=s.hexes.filter(h=>!!h.settlement&&(!c.hexIds||c.hexIds.includes(h.id))&&(!c.loyalties||c.loyalties.includes(h.settlement?.loyalty??null)));
  const count=hexes.filter(h=>{
    const marker=!!s.controls[h.id]&&eligible.includes(s.controls[h.id]);
    const owner=s.razed.includes(h.id)?null:s.controls[h.id]??h.settlement?.loyalty;
    const occupied=s.units.some(u=>u.hexId===h.id&&eligible.includes(u.kingdom)&&(c.metric==='presence'||s.unitDefinitions.find(d=>d.id===u.defId)?.kind!=='hero'));
    if(c.metric==='markers')return marker;
    if(c.metric==='controlled')return !!owner&&eligible.includes(owner);
    if(c.metric==='controlled-or-razed')return s.razed.includes(h.id)||!!owner&&eligible.includes(owner);
    if(c.metric==='occupied')return occupied;
    return marker||occupied;
  }).length;
  return count>=c.atLeast;
}
export function campaignVictory(s:GameState,check:'action'|'turn-end'|'season-end'|'deadline',afterKingdom?:string):{winner:Side;reason:string}|null {
  const v=s.scenario.sourceCampaign?.victory;if(!v)return null;
  const result=(winner:Side,reason:string)=>{const rivalry=s.scenario.sourceCampaign?.competitiveInvaders;if(winner==='invader'&&rivalry){const markers=(kingdom:string)=>Object.values(s.controls).filter(id=>id===kingdom).length,individual=markers(rivalry.leadKingdom)-markers(rivalry.otherKingdom)>=rivalry.requiredMarkerLead?rivalry.leadKingdom:rivalry.otherKingdom;reason+=` First Among Equals: ${s.kingdoms.find(k=>k.id===individual)?.name??individual} wins individually.`;}return {winner,reason};};
  if(v.collapseWins){for(const side of ['invader','resistance'] as const)if(s.kingdoms.filter(k=>k.side===side).every(k=>k.collapsed))return result(side==='invader'?'resistance':'invader','All opposing Kingdoms collapsed.');}
  for(const r of v.immediate??[]){if((r.check??'action')!==check&&!(check==='deadline'&&r.check==='season-end'))continue;if(r.afterKingdom&&r.afterKingdom!==afterKingdom)continue;if(r.fromYear!==undefined&&s.year*3+s.season<r.fromYear*3+(r.fromSeason??0))continue;if(campaignCondition(s,r.condition))return result(r.winner,r.reason??'The published campaign victory condition was met.');}
  if(check!=='deadline')return null;
  const d=v.deadline;
  if(d.type==='condition'){const met=campaignCondition(s,d.condition);return result(met?d.winner:d.otherwise,met?'The published campaign objective was met at the deadline.':'The opposing side prevented the published campaign objective.');}
  const score=(side:Side)=>{
    const kingdoms=s.kingdoms.filter(k=>k.side===side),ids=kingdoms.map(k=>k.id);
    if(d.metric==='income')return kingdoms.reduce((n,k)=>n+k.income-(d.deductRevolts?(k.revolt??0):0),0);
    if(d.metric==='markers')return Object.entries(s.controls).filter(([h,k])=>ids.includes(k)&&(!d.hexIds||d.hexIds.includes(h))).length;
    return s.hexes.filter(h=>h.settlement&&(!d.hexIds||d.hexIds.includes(h.id))&&!s.razed.includes(h.id)&&ids.includes(s.controls[h.id]??h.settlement.loyalty??'')).length;
  };
  let a=score('invader'),b=score('resistance');
  if(d.treasureMajorityPoint&&s.advanced){const treasure=(side:Side)=>s.advanced!.players.filter(p=>p.kingdoms.some(id=>s.kingdoms.find(k=>k.id===id)?.side===side)).reduce((n,p)=>n+(s.advanced!.owned[p.id]?.length??0)+(s.advanced!.hands[p.id]?.filter(id=>id.startsWith('treasure-')).length??0),0);const at=treasure('invader'),bt=treasure('resistance');if(at>bt)a++;else if(bt>at)b++;}
  return result(a===b?d.tieWinner:a>b?'invader':'resistance',`Campaign deadline score: Invader ${a}, Resistance ${b}${a===b?'; printed tie breaker applies':''}.`);
}

/** Validates declarative campaign data without executing imported expressions. */
export function validatePublishedCampaignRules(value:unknown,known:{hexIds:Set<string>;defIds:Set<string>;kingdomIds:Set<string>}):string[]{
  const issues:string[]=[];
  const bad=(p:string,m:string)=>{if(issues.length<60)issues.push(`${p}: ${m}`);};
  const object=(v:unknown,p:string,keys:string[]):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v)){bad(p,'Expected object');return {};}const o=v as Record<string,unknown>;for(const k of Object.keys(o))if(!keys.includes(k))bad(`${p}.${k}`,'Unknown field');return o;};
  const list=(v:unknown,p:string,max=5000):unknown[]=>{if(!Array.isArray(v)){bad(p,'Expected array');return [];}if(v.length>max)bad(p,'Too many entries');return v.slice(0,max);};
  const text=(v:unknown,p:string,max=2000)=>{if(typeof v!=='string'||!v.length||v.length>max)bad(p,'Expected bounded text');};
  const number=(v:unknown,p:string,min=0,max=10000)=>{if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max)bad(p,`Expected integer ${min}–${max}`);};
  const boolean=(v:unknown,p:string)=>{if(typeof v!=='boolean')bad(p,'Expected boolean');};
  const choice=(v:unknown,p:string,options:string[])=>{if(typeof v!=='string'||!options.includes(v))bad(p,`Expected ${options.join('/')}`);};
  const ref=(v:unknown,p:string,set:Set<string>)=>{if(typeof v!=='string'||!set.has(v))bad(p,'Unknown reference');};
  const strings=(v:unknown,p:string,set?:Set<string>,max=5000)=>{const items=list(v,p,max);for(const [i,x] of items.entries())set?ref(x,`${p}[${i}]`,set):text(x,`${p}[${i}]`,80);if(new Set(items).size!==items.length)bad(p,'Duplicate entries');};
  const optional=(o:Record<string,unknown>,key:string,p:string,fn:(v:unknown,p:string)=>void)=>{if(o[key]!==undefined)fn(o[key],`${p}.${key}`);};
  const side=(v:unknown,p:string)=>choice(v,p,['invader','resistance']);
  const kingdom=(v:unknown,p:string)=>ref(v,p,known.kingdomIds);
  const hexes=(v:unknown,p:string)=>strings(v,p,known.hexIds);
  const defs=(v:unknown,p:string)=>strings(v,p,known.defIds,40);
  const condition=(v:unknown,p:string,depth=0):void=>{
    if(depth>8){bad(p,'Condition nesting exceeds8');return;}
    const raw=v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
    const keys:Record<string,string[]>={all:['type','conditions'],any:['type','conditions'],count:['type','metric','kingdoms','side','hexIds','loyalties','atLeast'],collapse:['type','kingdoms','any'],income:['type','kingdom','atMost','deductRevolts'],'enemy-city-occupied':['type','side']};
    const t=String(raw.type),o=object(v,p,keys[t]??['type']);if(!keys[t]){bad(`${p}.type`,'Unknown condition');return;}
    if(t==='all'||t==='any'){const a=list(o.conditions,`${p}.conditions`,20);if(!a.length)bad(p,'Empty condition group');a.forEach((x,i)=>condition(x,`${p}.conditions[${i}]`,depth+1));}
    if(t==='count'){choice(o.metric,`${p}.metric`,['controlled','markers','controlled-or-razed','occupied','presence']);number(o.atLeast,`${p}.atLeast`,0,5000);optional(o,'kingdoms',p,(v,p)=>strings(v,p,known.kingdomIds,6));optional(o,'side',p,side);optional(o,'hexIds',p,hexes);optional(o,'loyalties',p,(v,p)=>list(v,p,20).forEach((x,i)=>{if(x!==null)text(x,`${p}[${i}]`,80);}));}
    if(t==='collapse'){strings(o.kingdoms,`${p}.kingdoms`,known.kingdomIds,6);optional(o,'any',p,boolean);}
    if(t==='income'){kingdom(o.kingdom,`${p}.kingdom`);number(o.atMost,`${p}.atMost`,-10000);optional(o,'deductRevolts',p,boolean);}
    if(t==='enemy-city-occupied')side(o.side,`${p}.side`);
  };
  const root=object(value,'sourceCampaign',['number','series','study','deploymentOrder','opening','preControls','preChoices','nonplayerControls','nonplayerAllies','competitiveInvaders','abandonedLairs','specialRules','victory','chronicle']);
  choice(root.series,'sourceCampaign.series',['intro','scroll','chronicle']);optional(root,'number','sourceCampaign',(v,p)=>number(v,p,1,17));
  optional(root,'study','sourceCampaign',(v,p)=>{const o=object(v,p,['glyphs','churns']);number(o.glyphs,`${p}.glyphs`,0,10);number(o.churns,`${p}.churns`,0,10);if(Number(o.glyphs)+Number(o.churns)<known.kingdomIds.size)bad(p,'Too few study markers');});
  const order=list(root.deploymentOrder,'sourceCampaign.deploymentOrder',6);order.forEach((v,i)=>strings(v,`sourceCampaign.deploymentOrder[${i}]`,known.kingdomIds,6));const flat=order.flat();if(new Set(flat).size!==flat.length||flat.length!==known.kingdomIds.size)bad('sourceCampaign.deploymentOrder','Must include each participating kingdom once');
  const openings=list(root.opening,'sourceCampaign.opening',6);openings.forEach((v,i)=>{
    const p=`sourceCampaign.opening[${i}]`,o=object(v,p,['kingdom','gold','heroes','covens','freeUnits','extraHeroes','heroIds','unavailableHeroIds','deploymentHexIds','minerHexIds','discardUnspent','spendLimits','exchangeControlForCoven']);kingdom(o.kingdom,`${p}.kingdom`);number(o.gold,`${p}.gold`);
    for(const k of ['heroes','covens'])optional(o,k,p,(v,p)=>number(v,p,0,20));for(const k of ['heroIds','unavailableHeroIds'])optional(o,k,p,defs);for(const k of ['deploymentHexIds','minerHexIds'])optional(o,k,p,hexes);for(const k of ['discardUnspent','exchangeControlForCoven'])optional(o,k,p,boolean);
    optional(o,'freeUnits',p,(v,p)=>list(v,p,100).forEach((v,i)=>{const q=`${p}[${i}]`,f=object(v,q,['defId','count','weakened','hexIds','optional']);ref(f.defId,`${q}.defId`,known.defIds);number(f.count,`${q}.count`,1,100);optional(f,'weakened',q,boolean);optional(f,'optional',q,boolean);optional(f,'hexIds',q,hexes);}));
    optional(o,'extraHeroes',p,(v,p)=>list(v,p,6).forEach((v,i)=>{const q=`${p}[${i}]`,f=object(v,q,['kingdom','count','hexIds']);text(f.kingdom,`${q}.kingdom`,80);number(f.count,`${q}.count`,1,10);optional(f,'hexIds',q,hexes);}));
    optional(o,'spendLimits',p,(v,p)=>list(v,p,20).forEach((v,i)=>{const q=`${p}[${i}]`,f=object(v,q,['hexIds','max']);hexes(f.hexIds,`${q}.hexIds`);number(f.max,`${q}.max`);}));
  });if(new Set(openings.map(v=>(v as Record<string,unknown>)?.kingdom)).size!==known.kingdomIds.size)bad('sourceCampaign.opening','Must include each participating kingdom once');
  optional(root,'preControls','sourceCampaign',(v,p)=>list(v,p,6).forEach((v,i)=>{const q=`${p}[${i}]`,o=object(v,q,['kingdom','count','hexIds','excludeOtherControls']);kingdom(o.kingdom,`${q}.kingdom`);number(o.count,`${q}.count`,1,20);hexes(o.hexIds,`${q}.hexIds`);optional(o,'excludeOtherControls',q,boolean);}));
  optional(root,'preChoices','sourceCampaign',(v,p)=>list(v,p,30).forEach((v,i)=>{const q=`${p}[${i}]`,o=object(v,q,['id','label','options']);text(o.id,`${q}.id`,80);text(o.label,`${q}.label`);const options=list(o.options,`${q}.options`,5000);if(!options.length)bad(q,'No choice options');options.forEach((v,j)=>{const z=`${q}.options[${j}]`,x=object(v,z,['value','label','controls','razed','entries']);text(x.value,`${z}.value`,80);text(x.label,`${z}.label`);optional(x,'razed',z,hexes);optional(x,'entries',z,(v,p)=>{const o=object(v,p,Object.keys(v as object??{}));for(const [h,k] of Object.entries(o)){ref(h,`${p} key`,known.hexIds);kingdom(k,`${p}.${h}`);}});optional(x,'controls',z,(v,p)=>{const o=object(v,p,Object.keys(v as object??{}));for(const [h,k] of Object.entries(o)){ref(h,`${p} key`,known.hexIds);text(k,`${p}.${h}`,80);}});});}));
  optional(root,'nonplayerControls','sourceCampaign',(v,p)=>{const o=object(v,p,Object.keys(v as object??{}));for(const [h,k] of Object.entries(o)){ref(h,`${p} key`,known.hexIds);text(k,`${p}.${h}`,80);}});
  optional(root,'nonplayerAllies','sourceCampaign',(v,p)=>{const o=object(v,p,Object.keys(v as object??{}));for(const [k,allies] of Object.entries(o)){text(k,`${p} key`,80);strings(allies,`${p}.${k}`,known.kingdomIds,6);}});
  optional(root,'competitiveInvaders','sourceCampaign',(v,p)=>{const o=object(v,p,['leadKingdom','otherKingdom','requiredMarkerLead']);kingdom(o.leadKingdom,`${p}.leadKingdom`);kingdom(o.otherKingdom,`${p}.otherKingdom`);number(o.requiredMarkerLead,`${p}.requiredMarkerLead`,1,100);if(o.leadKingdom===o.otherKingdom)bad(p,'Competitive kingdoms must differ');});
  optional(root,'abandonedLairs','sourceCampaign',hexes);
  const specials=list(root.specialRules,'sourceCampaign.specialRules',100);specials.forEach((v,i)=>{const p=`sourceCampaign.specialRules[${i}]`,raw=v as Record<string,unknown>,t=String(raw?.type),keys:Record<string,string[]>={'no-collapse':['kingdoms'],'raze-repair-cost':['kingdom','cost'],'no-gold-transfer':['fromKingdom','toKingdom'],'allied-contingent':['kingdom','activatedBy','noRebuild','disableBlessings'],'fixed-defender':['defId','hexId','actingKingdom','covenCheckTurn'],'restore-loyalty':['hexId','kingdom','controller'],'revolt-modifier':['modifier','fromYear','fromSeason'],withdraw:['kingdom','year','season','razeControls'],'fragile-defender':['defId','hexId','kingdom','readyAdjacentBuilds']};const o=object(v,p,['type',...keys[t]??[]]);if(!keys[t]){bad(p,'Unknown special rule');return;}
    for(const k of ['kingdom','fromKingdom','toKingdom','controller'])optional(o,k,p,(v,p)=>text(v,p,80));for(const k of ['actingKingdom','activatedBy','covenCheckTurn'])optional(o,k,p,kingdom);optional(o,'kingdoms',p,(v,p)=>strings(v,p,known.kingdomIds,6));optional(o,'defId',p,(v,p)=>ref(v,p,known.defIds));optional(o,'hexId',p,(v,p)=>ref(v,p,known.hexIds));for(const k of ['noRebuild','disableBlessings','razeControls','readyAdjacentBuilds'])optional(o,k,p,boolean);for(const k of ['year','fromYear'])optional(o,k,p,(v,p)=>number(v,p,1));for(const k of ['season','fromSeason'])optional(o,k,p,(v,p)=>number(v,p,0,2));optional(o,'modifier',p,(v,p)=>number(v,p,-6,6));optional(o,'cost',p,(v,p)=>number(v,p,0,100));
  });
  const victory=object(root.victory,'sourceCampaign.victory',['immediate','deadline','collapseWins']);optional(victory,'collapseWins','sourceCampaign.victory',boolean);
  optional(victory,'immediate','sourceCampaign.victory',(v,p)=>list(v,p,30).forEach((v,i)=>{const q=`${p}[${i}]`,o=object(v,q,['winner','condition','check','afterKingdom','fromYear','fromSeason','reason']);side(o.winner,`${q}.winner`);condition(o.condition,`${q}.condition`);optional(o,'check',q,(v,p)=>choice(v,p,['action','turn-end','season-end']));optional(o,'afterKingdom',q,kingdom);optional(o,'fromYear',q,(v,p)=>number(v,p,1));optional(o,'fromSeason',q,(v,p)=>number(v,p,0,2));optional(o,'reason',q,text);}));
  const dRaw=victory.deadline as Record<string,unknown>,d=object(victory.deadline,'sourceCampaign.victory.deadline',dRaw?.type==='score'?['type','metric','tieWinner','treasureMajorityPoint','deductRevolts','hexIds']:['type','condition','winner','otherwise']);choice(d.type,'sourceCampaign.victory.deadline.type',['condition','score']);if(d.type==='condition'){condition(d.condition,'sourceCampaign.victory.deadline.condition');side(d.winner,'sourceCampaign.victory.deadline.winner');side(d.otherwise,'sourceCampaign.victory.deadline.otherwise');}else{choice(d.metric,'sourceCampaign.victory.deadline.metric',['settlements','markers','income']);side(d.tieWinner,'sourceCampaign.victory.deadline.tieWinner');optional(d,'hexIds','sourceCampaign.victory.deadline',hexes);for(const k of ['treasureMajorityPoint','deductRevolts'])optional(d,k,'sourceCampaign.victory.deadline',boolean);}
  optional(root,'chronicle','sourceCampaign',(v,p)=>{
    const o=object(v,p,['book','chapter','endingChapter','nextScenarioId','historicalStartYear','treatyYear','abandonFromYear','returnFjord','bitterDefender']);number(o.book,`${p}.book`,1,3);number(o.chapter,`${p}.chapter`,1,10);optional(o,'endingChapter',p,(v,p)=>number(v,p,1,10));optional(o,'nextScenarioId',p,(v,p)=>text(v,p,80));for(const k of ['historicalStartYear','treatyYear','abandonFromYear'])optional(o,k,p,(v,p)=>number(v,p,1));
    optional(o,'bitterDefender',p,(v,p)=>{const d=object(v,p,['defId','hexId','kingdom','winterYear']);ref(d.defId,`${p}.defId`,known.defIds);ref(d.hexId,`${p}.hexId`,known.hexIds);kingdom(d.kingdom,`${p}.kingdom`);number(d.winterYear,`${p}.winterYear`,1);});
    optional(o,'returnFjord',p,(v,p)=>{const d=object(v,p,['kingdom','opening','turnOrder','year','afterCollapseYears']),k=object(d.kingdom,`${p}.kingdom`,['id','name','side','gold','income','revolt','controlLimit','cityCollapseThreshold']);text(k.id,`${p}.kingdom.id`,80);text(k.name,`${p}.kingdom.name`);side(k.side,`${p}.kingdom.side`);number(k.gold,`${p}.kingdom.gold`);number(k.income,`${p}.kingdom.income`);optional(k,'revolt',`${p}.kingdom`,(v,p)=>number(v,p,0,19));optional(k,'controlLimit',`${p}.kingdom`,number);optional(k,'cityCollapseThreshold',`${p}.kingdom`,(v,p)=>number(v,p,1,100));strings(d.turnOrder,`${p}.turnOrder`,undefined,6);number(d.year,`${p}.year`,1);number(d.afterCollapseYears,`${p}.afterCollapseYears`,1,100);if(typeof k.id==='string')for(const message of validatePublishedCampaignRules({series:'chronicle',deploymentOrder:[[k.id]],opening:[d.opening],specialRules:[],victory:{deadline:{type:'score',metric:'settlements',tieWinner:'resistance'}}},{...known,kingdomIds:new Set([k.id])}))bad(`${p}.opening`,message);});
  });
  return issues;
}
