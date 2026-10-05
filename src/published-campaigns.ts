import {publishedCampaignCatalog} from './published-campaign-data.js';
import {joinReviewedBoards,sourceCellId,reviewedBoards} from './official-maps.js';
import type {BoardId} from './official-maps.js';
import {unitDefinitions} from './content.js';
import {cards,monsters} from './advanced.js';
import type {GameConfig,Hex,ScenarioDefinition,Side} from './engine.js';
import type {CampaignCondition,CampaignVictory,PublishedCampaignRules,OpeningKingdom,CampaignSpecialRule} from './campaign-runtime.js';

export const campaignBookURL='https://edicionesmasqueoca.com/diarios/2025/06/12/a-punto-para-pre-produccion/';
export const publishedCampaigns=publishedCampaignCatalog.entries as any[];
const boardNames:Record<string,BoardId>={'Broken Coast':'broken-coast','Wildlands':'wildlands','Imperial Heartland':'imperial-heartland','Fields of Ash':'fields-of-ash'};
const names:Record<string,string>={empire:'Eastern Empire',fjordland:'Fjordland',oathborn:'Oathborn',goblins:'Goblins',orcs:'Orcs',night:'Army of the Night'};
const kingdomAliases:Record<string,string>={'Eastern Empire':'empire','Army of the Night':'night','Army of Night':'night','army-of-night':'night','Oathborn':'oathborn','Fjordland':'fjordland','Orcs':'orcs','Goblins':'goblins','Neutral':'neutral','Assassins Guild':'assassins-guild','Mara Mitai':'mara-mitai'};
export const campaignKingdom=(name:string)=>kingdomAliases[name]??name.toLowerCase();
const key=(s:string)=>s.toLowerCase().replace(/^the /,'').replace(/[^a-z0-9]/g,'');
const sourceAliases:Record<string,string>={...publishedCampaignCatalog.settlementAliases,
  Skegheld:'Skegkeld',Skegkeld:'Skegkeld','Katurkas':'Katurkhas','Cañada Sombría':'Shadowglen','Cataratas Plateadas':'Pewter Falls','Puente del Sur':'Southbridge','Puerto Gilder':'Port Gilder','Puerto Lark':'Port Lark','Fiordo Astrid':'Astridfjord','Adakirk':'Adakirk','Fortaleza Negra':'Blackstone Fortress','Martillosol':'Sunehammer','Casa del Norte':'Nordhome','Altojardin':'Highgarden','Fortaleza del Escaldo':'Vilkensinger Fortress','Bastión Rjukken':'Rjukkenheld','Sofia':'Princess Sofia','Kali, the Hooded Reaper':'Kali, Shrouded Reaper','Luna, the Mist Hunter':'Luna, Mist Hunter'};
export interface CampaignCompileOptions {endingChapter?:number;bitterEnd?:boolean;longWar?:boolean;firstAmongEquals?:boolean;}
export function campaignDuration(s:any):number {const e=s.end??s.endPrinted;return e?3*(e.year-s.start.year)+['Spring','Summer','Autumn'].indexOf(e.season)-['Spring','Summer','Autumn'].indexOf(s.start.season)+1:s.turns;}
export function campaignSummary(s:any):string {
  const groups=Object.entries(s.sides).map(([side,k])=>`${side}: ${(k as string[]).join(', ')}`).join(' · ');
  return `${s.turns} seasons · ${s.maps.join(' + ')}. ${groups}.`;
}
export function campaignVictorySummary(s:any):string {
  if(s.series==='intro')return 'At the end of Autumn, control the most of the six allowed settlements. Oathborn wins a tie.';
  if(s.series==='chronicle')return [...(s.victory.instant??[]).map((r:any)=>`${r.side} wins: ${r.condition}${r.check==='season-end'?' (season end)':''}.`),`Deadline: ${s.victory.deadline.condition}; otherwise ${s.victory.deadline.otherwise} wins.`].join(' ').replace(/([a-zA-Z])(\d)/g,'$1 $2').replace(/(\d)([a-zA-Z])/g,'$1 $2');
  const summaries:Record<number,string>={
    1:'Win if the opponent collapses. Otherwise, control the most settlements at the deadline; Orcs wins a tie.',
    2:'Win by reducing enemy income to the printed threshold at the end of their turn. At the deadline, score Control markers and the Advanced Treasure majority bonus; Fjordland wins a tie.',
    3:'Goblins wins by controlling two Fjordland settlements at season end. Fjordland wins if it prevents this through the deadline.',
    4:'Orcs wins with six controlled or Razed Neutral/Oathborn settlements at season end. Imperial settlements do not count.',
    5:'Orcs wins with ten controlled or Razed Neutral/Oathborn settlements at season end. Imperial and Fjordland settlements do not count.',
    6:'At season end, Night needs five Control markers, including two on Oathborn settlements. Otherwise Oathborn wins at the deadline.',
    7:'The Invaders need eleven combined Control markers at season end. Resistance wins if it prevents this through the deadline.',
    8:'Invaders can occupy Dwelfholm at the end of the Oathborn turn; Resistance can occupy the Spire at the end of the Night turn. Otherwise Invaders needs seven controlled settlements of the printed loyalties at the deadline.',
    9:'Goblins wins by controlling or razing every Imperial settlement, or by controlling Aureliana at the deadline. Empire wins if Goblins collapses.',
    10:'Invaders wins with three controlled or Razed cities immediately, or two at the deadline. Resistance wins if Orcs collapses.',
    11:'Oathborn wins if Goblins collapses, or has a friendly unit or Control marker in three settlements at the deadline.',
    12:'From Spring Year 2, Invaders wins if five Goblin Control markers remain at season end. Resistance wins if Goblins collapses or time expires.',
    13:'Invaders wins when both Aureliana and Placidia are controlled or Razed. Empire wins if it prevents this through the deadline.',
    14:'Fjordland needs six controlled settlements at the deadline. Fjordland settlements under Oathborn Control do not count.',
    15:'Resistance wins as soon as one of its Armies occupies the Spire of the Moon. Night wins if time expires.',
    16:'Resistance wins as soon as one of its Armies occupies the Spire of the Moon. Night wins if time expires.',
    17:'The first side whose Army occupies a hostile City wins. Otherwise compare side income at the deadline, deducting Imperial revolts and excluding Coven gold; Invaders wins a tie.',
  };return summaries[s.number]??'';
}
/** Compile documented facts into engine IDs. No scanned artwork or narrative is copied. */
export function compilePublishedCampaign(id:string,options:CampaignCompileOptions={}):GameConfig {
  const source=publishedCampaigns.find(s=>s.id===id);if(!source)throw new Error('Unknown published campaign.');
  const s=structuredClone(source),boardIds=s.maps.map((n:string)=>boardNames[n]);
  const joined=joinReviewedBoards(boardIds),board=joined.hexes;
  const find=(name:string):Hex=>{
    const wanted=sourceAliases[name]??name,h=board.find(h=>h.settlement&&key(h.settlement.name)===key(wanted));
    if(!h)throw new Error(`Campaign ${s.id}: unresolved settlement ${name}.`);return h;
  };
  const coord=(b:BoardId,q:number,j:number)=>joined.aliases[sourceCellId(b,q,j)];
  const boardCells=(b:BoardId)=>!boardIds.includes(b)?[]:reviewedBoards.find(x=>x.boardId===b)!.hexes.map(c=>({c,h:board.find(h=>h.id===coord(b,c.q,c.j))!}));
  const sides:Record<string,Side>={};for(const [side,list] of Object.entries(s.sides))for(const k of list as string[])sides[campaignKingdom(k)]=side.toLowerCase() as Side;
  const participants=Object.keys(sides),controls:Record<string,string>={},razed=new Set<string>();
  const warnings:string[]=[...(s.sourceConflicts??[])];
  // Postures belong to this campaign. Printed loyalties stay intact.
  for(const h of board){
    if(!h.settlement)continue;
    const loyalty=h.settlement.loyalty??'neutral';
    const friendly:string[]=[],prohibited:string[]=[];
    for(const kid of participants){
      if(sides[loyalty]===sides[kid])continue;
      const posture=s.postures?.[sides[kid]==='invader'?'Invader':'Resistance'];
      if(posture){
        if([...(posture.welcoming??[]),...(posture.allied??[])].some((v:string)=>campaignKingdom(v)===loyalty))friendly.push(kid);
        if((posture.prohibited??[]).some((v:string)=>campaignKingdom(v)===loyalty))prohibited.push(kid);
      }
    }
    h.settlement.neutralFriendlyTo=friendly;
    if(prohibited.length)h.prohibitedFor=prohibited;
  }
  const unresolvedControls:{name:string;kingdom:string}[]=[],duplicateControls:{hexId:string;kingdoms:string[]}[]=[];
  for(const [name,data] of Object.entries(s.kingdoms) as [string,any][]){
    const kid=campaignKingdom(name);
    for(const place of [...(Array.isArray(data.controls)?data.controls:[]),...(data.controlsSpanish??[])]){
      if(/\bselect(?:ed)?\b|\bchosen\b|^one\b/i.test(place))continue;
      let h:Hex;try{h=find(place);}catch{unresolvedControls.push({name:place,kingdom:kid});continue;}
      if(controls[h.id]&&controls[h.id]!==kid){duplicateControls.push({hexId:h.id,kingdoms:[controls[h.id],kid]});delete controls[h.id];}
      else controls[h.id]=kid;
    }
  }
  const unresolvedRazed:string[]=[];
  const addRazed=(place:string)=>{try{razed.add(find(place).id);}catch{unresolvedRazed.push(place);warnings.push(`Unresolved source Razed marker: ${place}.`);}};
  for(const place of s.razed??[])addRazed(place);
  for(const [boardName,except] of Object.entries(s.razedBoardExcept??{}))for(const {h} of boardCells(boardNames[boardName]))if(h.settlement&&!(except as string[]).some(n=>find(n).id===h.id))razed.add(h.id);
  const special:CampaignSpecialRule[]=[],opening:OpeningKingdom[]=[];
  const definition:ScenarioDefinition={id:`published-${id}`,name:s.series==='scroll'?`${s.number}. ${s.name}`:s.series==='chronicle'?`Chronicle ${s.chapter}: ${s.name}`:s.name,official:true,source:`Campaign Book pp. ${s.pages.join(', ')}; official MQO review gallery, cross-checked with Compass living notes and August 2024 errata.`,startYear:s.start.year,startSeason:season(s.start.season),endYear:(s.end??s.endPrinted).year,endSeason:season((s.end??s.endPrinted).season),turnOrder:s.turnOrder.map(campaignKingdom),kingdoms:[],initialUnits:[],initialControls:controls,initialRazed:[...razed],objective:{type:'control',hexIds:[],count:1,deadlineOnly:true},notes:[campaignVictorySummary(s),campaignSummary(s),...warnings]};
  if(s.series==='intro'){
    const allowed=new Set(s.allowedSettlements.map((n:string)=>find(n).id));
    for(const h of board)if(h.settlement&&!allowed.has(h.id))h.prohibitedFor=[...participants];
    for(const [kid,places] of Object.entries(s.initialLoyalSettlementControl??{}) as [string,string[]][]){for(const name of places){find(name).settlement!.neutralFriendlyTo=[campaignKingdom(kid)];}}
  }
  const near=(h:Hex,t:Hex,n=1)=>Math.max(Math.abs(h.q-t.q),Math.abs(h.r-t.r),Math.abs(h.q+h.r-t.q-t.r))<=n;
  const coastEntries=(b:BoardId)=>boardCells(b).filter(({c,h})=>b==='broken-coast'?c.q===1&&[6,9,10,13,14].includes(c.j):c.q===0&&!h.prohibited&&h.terrain==='sea').map(({h})=>h.id);
  // Printed entry triangles are on fixed source centers rather than generated gaps.
  if(s.number===15&&s.series==='scroll')for(const [q,j] of [[0,4],[0,12]] as [number,number][])if(coord('wildlands',q,j))board.find(h=>h.id===coord('wildlands',q,j))!.entry='fjordland';
  for(const [kingdomName,data] of Object.entries(s.kingdoms) as [string,any][]){
    const kid=campaignKingdom(kingdomName),r:OpeningKingdom={kingdom:kid,gold:data.gold,heroes:data.randomHeroes??data.heroes??0,covens:data.covens??0};
    if(data.optionalSetup)r.exchangeControlForCoven=true;
    definition.kingdoms.push({id:kid,name:names[kid],side:sides[kid],gold:data.gold,income:data.income??0,revolt:data.revolt??0,controlLimit:data.controlMarkerCap??data.controlMarkersAvailable??(['orcs','goblins'].includes(kid)?12:10)});
    if(data.fixedHero){r.heroIds=[heroId(data.fixedHero)];r.heroes=data.randomHeroes??Math.max(0,(data.heroes??1)-1);}
    if(data.unavailableHeroes)r.unavailableHeroIds=data.unavailableHeroes.map(heroId);
    if(data.cannotCollapse)special.push({type:'no-collapse',kingdoms:[kid]});
    const setups=(data.setupRules??[]).join(' ');
    if(kid==='oathborn'&&/Miners/i.test(setups)||s.specialRules?.some((v:any)=>v.type==='oathborn-opening-miners')&&kid==='oathborn')r.minerHexIds=board.filter(h=>h.mine&&board.some(t=>(t.settlement?.loyalty==='oathborn'||controls[t.id]==='oathborn')&&near(h,t,2))).map(h=>h.id);
    if(data.extraUnits||data.freeUnits){
      const location=data.extraDeployment?.includes('Rjukken')?find('Rjukken Hold'):null;
      const freeHexes=board.filter(h=>location?near(h,location):board.some(t=>t.settlement?.loyalty==='empire'&&near(h,t))).filter(h=>!h.prohibited&&!['sea','lair'].includes(h.terrain)).map(h=>h.id);
      r.freeUnits=(data.extraUnits??data.freeUnits).filter((v:any)=>!v.advancedOnly&&!/hero/i.test(v.type??v.name)).map((v:any)=>({defId:armyId(v.type??v.name,v.kingdom??'fjordland'),count:v.count??1,weakened:v.weakened??v.weak??false,hexIds:freeHexes}));
      r.extraHeroes=(data.extraHeroes??(data.freeUnits??[]).filter((v:any)=>v.name==='Hero')).map((v:any)=>({kingdom:campaignKingdom(v.kingdom),count:v.count??1,hexIds:freeHexes}));
      special.push({type:'allied-contingent',kingdom:'fjordland',activatedBy:kid,noRebuild:true,disableBlessings:true});
    }
    if(data.optionalUnits)for(const n of data.optionalUnits)(r.freeUnits??=[]).push({defId:armyId(n,kingdomName),count:1,optional:true});
    if(/Spend all|discard unspent/i.test(setups))r.discardUnspent=true;
    if(/at most 8/i.test(setups))r.spendLimits=[{hexIds:boardCells('broken-coast').map(({h})=>h.id),max:8}];
    if(s.number===14&&s.series==='scroll'&&kid==='fjordland'){r.deploymentHexIds=board.filter(h=>!near(h,find('Hammersol'))).map(h=>h.id);}
    opening.push(r);
  }
  const rules:PublishedCampaignRules={...(s.series==='scroll'?{number:s.number}:{}),series:s.series,study:s.study,deploymentOrder:s.deploymentOrder.map((g:string[])=>g.map(campaignKingdom)),opening,specialRules:special,victory:compileVictory(s,board,find,participants,sides)};
  definition.sourceCampaign=rules;
  const preControls=[];
  if(s.series==='chronicle'&&s.chapter===1)preControls.push({kingdom:'night',count:1,hexIds:board.filter(h=>h.settlement?.loyalty==='empire'&&!h.settlement.city).map(h=>h.id)});
  if(s.series==='scroll'&&[7,10,17].includes(s.number)){const selected=s.number===7?boardCells('imperial-heartland').map(({h})=>h):board;preControls.push({kingdom:'night',count:s.number===17?2:1,hexIds:selected.filter(h=>h.settlement&&!h.settlement.city&&(s.number!==17||h.settlement.loyalty===null)).map(h=>h.id),excludeOtherControls:s.number!==10});}
  if(preControls.length)rules.preControls=preControls;
  // Source inconsistencies are explicit table choices before recruitment.
  if(duplicateControls.length||unresolvedControls.length||unresolvedRazed.length){rules.preChoices=[
    ...duplicateControls.map((c,i)=>({id:`ownership-${i}`,label:`The review copy gives ${board.find(h=>h.id===c.hexId)!.settlement!.name} to two kingdoms. Choose your printed-book ruling.`,options:c.kingdoms.map(k=>({value:k,label:names[k],controls:{[c.hexId]:k}}))})),
    ...unresolvedControls.map((c,i)=>({id:`unresolved-${i}`,label:`Source calls for ${c.kingdom} control at ${c.name}, absent from this board edition. Choose a table ruling.`,options:[{value:'omit',label:'Omit unresolved marker; record the source discrepancy'},...board.filter(h=>h.settlement&&!controls[h.id]).map(h=>({value:h.id,label:h.settlement!.name,controls:{[h.id]:c.kingdom}}))]})),
    ...unresolvedRazed.map((name,i)=>({id:`unresolved-raze-${i}`,label:`The source places a Razed marker at ${name}, absent from this board edition. Choose a table ruling.`,options:[{value:'omit',label:'Omit unresolved marker; record the source discrepancy'},...board.filter(h=>h.settlement&&!controls[h.id]).map(h=>({value:h.id,label:h.settlement!.name,razed:[h.id]}))]})),
  ];}
  if(s.number===15&&s.series==='scroll'){
    (rules.preChoices??=[]).push({id:'skegkeld-entry',label:'The third western Road entry near Skegkeld is obscured in the map source. Choose the crossing shown on your printed board.',options:[13,14].map(j=>({value:String(j),label:`Western edge hex 0,${j} · Skegkeld branch`,entries:{[coord('wildlands',0,j)]:'fjordland'}}))});
    definition.notes!.push('Qualified entry: the book specifies five western Sea hexes, but this Wildlands scan does not identify five complete western Sea centers. Only source-verified Sea entries are enabled; the obscured third Road entry needs a table ruling.');
  }
  for(const [name,description] of Object.entries(s.entry??{}) as [string,string][]){
    const kid=campaignKingdom(name);
    if(/western|sea-edge|east.*sea/i.test(description))for(const id of coastEntries(boardIds.includes('broken-coast')?'broken-coast':'wildlands'))board.find(h=>h.id===id)!.entry=kid;
    if(/southern/i.test(description))for(const {c,h} of boardCells(boardIds.includes('fields-of-ash')?'fields-of-ash':'wildlands'))if(c.j===(c.q%2?14:15)&&!h.prohibited)h.entry=kid;
    if(/Barzirak/i.test(description))for(const h of board)if(h.q>find('Barzirak').q&&near(h,find('Barzirak')))h.entry=kid;
  }
  for(const v of s.specialRules??[]){
    if(typeof v!=='object')continue;
    if(v.type==='empire-revolt'){definition.kingdoms.find(k=>k.id==='empire')!.revolt=v.start; if(v.rollModifier!==undefined)definition.empireRevoltModifier=v.rollModifier;}
    if(v.type==='initial-razed')for(const name of v.hexesSpanish??v.hexes??[])definition.initialRazed!.push(find(name).id);
    if(v.type==='collapse-eligibility')special.push({type:'no-collapse',kingdoms:participants.filter(k=>!v.eligibleKingdoms.map(campaignKingdom).includes(k))});
    if(v.type==='scenario-garrison')find(v.hex).prohibitedFor=[...participants];
    if(v.type==='nonplayer-control')(rules.nonplayerControls??={})[find(v.hex).id]=campaignKingdom(v.kingdom);
    if(v.type==='goblin-entry-override')for(const {c,h} of boardCells('imperial-heartland'))if(c.j===0&&!h.prohibited&&h.terrain==='sea')h.entry='goblins';
    if(v.type==='extra-entry'&&v.kingdom==='oathborn')for(const h of board)if(h.q>find('Barzirak').q&&near(h,find('Barzirak')))h.entry='oathborn';
    if(v.type==='extra-entry'&&v.kingdom==='empire'){const t=find('Placidia');const h=board.find(h=>h.q===t.q&&h.r===t.r+2);if(h)h.entry='empire';}
  }
  if(s.series==='scroll'){
    if([11,12].includes(s.number)){special.push({type:'raze-repair-cost',kingdom:'oathborn',cost:0},{type:'fixed-defender',defId:'fjord-berserkir',hexId:find('Hammersol').id,actingKingdom:'oathborn',covenCheckTurn:'oathborn'});}
    if(s.number===12)special.push({type:'no-gold-transfer',fromKingdom:'night',toKingdom:'goblins'});
    if(s.number===13)special.push({type:'withdraw',kingdom:'night',year:2,season:0,razeControls:true});
    if(s.number===14){controls[find('Belgunot').id]='oathborn';special.push({type:'restore-loyalty',hexId:find('Belgunot').id,kingdom:'fjordland',controller:'oathborn'});}
  }
  for(const controller of new Set([...Object.values(rules.nonplayerControls??{}),...Object.values(controls).filter(k=>!participants.includes(k))])){
    (rules.nonplayerAllies??={})[controller]=participants.filter(k=>{const posture=s.postures?.[sides[k]==='invader'?'Invader':'Resistance'];return [...(posture?.welcoming??[]),...(posture?.allied??[])].some((name:string)=>campaignKingdom(name)===controller);});
  }
  if(s.series==='chronicle'){
    rules.chronicle={book:s.book,chapter:s.chapter,historicalStartYear:s.historicalYear,treatyYear:593,abandonFromYear:594,nextScenarioId:s.chapter<10?`published-chronicle-${s.chapter+1}`:undefined};
    if([5,6].includes(s.chapter))special.push({type:'fixed-defender',defId:'fjord-berserkir',hexId:find('Hammersol').id,actingKingdom:'oathborn',covenCheckTurn:'oathborn'});
    if(s.abandonedLairs)rules.abandonedLairs=boardCells('fields-of-ash').filter(({h})=>h.terrain==='lair').map(({h})=>h.id);
  }
  const definitions=structuredClone(unitDefinitions);
  if(s.series==='scroll'&&[15,16].includes(s.number)||options.bitterEnd){
    const m=monsters.find(m=>/osterl[io]ch/i.test(m.name))!;const defId='campaign-osterlich';definitions.push({id:defId,name:'Osterlich · Moon Tower defender',kingdom:'night',kind:'army',count:1,cost:0,recoveryCost:0,light:m.light,heavy:m.heavy,movement:0,abilities:[...m.abilities],characteristics:['fragile'],weakenedLight:0,weakenedHeavy:0});special.push({type:'fragile-defender',defId,hexId:find('Moon Tower').id,kingdom:'night',readyAdjacentBuilds:true});
    if(options.bitterEnd){special.pop();rules.chronicle!.bitterDefender={defId,hexId:find('Moon Tower').id,kingdom:'night',winterYear:598};}
  }
  if(options.longWar&&s.number===2){definition.endYear=3;definition.endSeason=2;special.push({type:'revolt-modifier',modifier:-1,fromYear:2,fromSeason:2});}
  if(options.firstAmongEquals&&s.number===7){rules.competitiveInvaders={leadKingdom:'night',otherKingdom:'orcs',requiredMarkerLead:2};definition.name+=' · First Among Equals';definition.notes!.push('If the Invaders win, Night wins individually only with at least two more Control markers than Orcs. Otherwise Orcs wins. Alliance rules still apply.');}
  if(s.series==='chronicle'&&(options.endingChapter??s.chapter)>s.chapter){
    const last=publishedCampaigns.find(v=>v.series==='chronicle'&&v.chapter===options.endingChapter)!;
    definition.endYear=last.historicalYear;definition.endSeason=2;definition.startYear=s.historicalYear;
    rules.victory=compileVictory(last,board,find,participants,sides);rules.chronicle!.endingChapter=last.chapter;
    definition.name=`Chronicle ${s.chapter}–${last.chapter}: ${s.name}`;
    definition.notes![0]=campaignVictorySummary(last);
  }
  if(s.series==='chronicle'&&s.chapter<8&&(options.endingChapter??s.chapter)>s.chapter){
    const returnConfig=compilePublishedCampaign('chronicle-8');
    rules.chronicle!.returnFjord={kingdom:returnConfig.scenario.kingdoms.find(k=>k.id==='fjordland')!,opening:returnConfig.scenario.sourceCampaign!.opening.find(o=>o.kingdom==='fjordland')!,turnOrder:[...returnConfig.scenario.turnOrder,'goblins'].filter(k=>participants.includes(k)||k==='fjordland'),year:596,afterCollapseYears:3};
  }
  if(s.series==='chronicle'&&options.bitterEnd){
    definition.endYear=definition.startYear+(600-s.historicalYear);definition.endSeason=1;
    rules.chronicle!.endingChapter=10;rules.victory={immediate:[{winner:'resistance',condition:{type:'collapse',kingdoms:['night']}}],deadline:{type:'condition',condition:{type:'collapse',kingdoms:['night']},winner:'resistance',otherwise:'invader'}};
    definition.name+=' · Bitter End';definition.notes!.push('Bitter End follows the printed Spring 598–Summer 600 dates: eight seasons from Chapter 10, or 35 from Chapter 1. The review copy also prints nine turns; that discrepancy is retained in the source reference.');
    definition.notes![0]='Resistance wins if Army of the Night collapses. Otherwise Invaders wins at the end of Summer 600.';
  }
  const objectiveHexes=new Set<string>();
  const collectTargets=(value:unknown):void=>{if(!value||typeof value!=='object')return;for(const [key,valueAtKey] of Object.entries(value)){if(key==='hexIds'&&Array.isArray(valueAtKey))valueAtKey.forEach(id=>objectiveHexes.add(id));else collectTargets(valueAtKey);}};
  collectTargets(rules.victory);definition.objective.hexIds=[...objectiveHexes];
  // Older teaching saves retain their original board; new campaigns share the reviewed pack.
  return {hexes:board,unitDefinitions:definitions,scenario:definition,profile:s.series==='intro'?'basic':'advanced'};
}
const season=(v:string):0|1|2=>['spring','summer','autumn'].indexOf(v.toLowerCase()) as 0|1|2;
function heroId(n:string){const wanted=sourceAliases[n]??n,c=cards.find(c=>c.kind==='hero'&&(key(c.name)===key(wanted)||key(c.name).includes(key(wanted))));if(!c)throw new Error(`Unknown source Hero: ${n}`);return c.id;}
function armyId(n:string,k:string){if(/hero/i.test(n))return '';const kid=campaignKingdom(k);if(/raider/i.test(n)&&kid==='fjordland')return 'fjord-sea-reavers';if(/ranger/i.test(n)&&kid==='fjordland')return 'fjord-rangers';const d=unitDefinitions.find(d=>d.kingdom===kid&&key(d.name).includes(key(n)));if(!d)throw new Error(`Unknown source Army: ${n}`);return d.id;}
function compileVictory(s:any,board:Hex[],find:(name:string)=>Hex,participants:string[],sides:Record<string,Side>):CampaignVictory {
  const count=(atLeast:number,side:Side='invader',extra:Partial<CampaignCondition>={}):CampaignCondition=>({type:'count',metric:'controlled',side,atLeast,...extra} as CampaignCondition);
  const cities=board.filter(h=>h.settlement?.city).map(h=>h.id),loyal=board.filter(h=>h.settlement?.loyalty&&(s.series==='chronicle'?['oathborn','fjordland','empire'].includes(h.settlement.loyalty):sides[h.settlement.loyalty]==='resistance')).map(h=>h.id),loyalCities=loyal.filter(id=>cities.includes(id));
  const collapse=(kingdoms:string[],any=false):CampaignCondition=>({type:'collapse',kingdoms,any});
  const prevent=(condition:CampaignCondition,winner:Side='invader'):CampaignVictory=>({immediate:[{winner,condition,check:'season-end'}],deadline:{type:'condition',condition,winner,otherwise:winner==='invader'?'resistance':'invader'}});
  if(s.series==='intro')return {deadline:{type:'score',metric:'settlements',tieWinner:'resistance',hexIds:s.allowedSettlements.map((n:string)=>find(n).id)}};
  if(s.number===1&&s.series==='scroll')return {collapseWins:true,deadline:{type:'score',metric:'settlements',tieWinner:'invader'}};
  if(s.series==='chronicle'){
    const immediate:any[]=[{winner:'resistance',condition:collapse(['night'])}];
    if(s.chapter<=4)immediate.push({winner:'invader',check:'season-end',condition:count(s.chapter===4?3:2,'invader',{hexIds:loyalCities})});
    else if(s.chapter<=8)immediate.push({winner:'invader',condition:collapse(['oathborn','empire'])});
    else if(s.chapter===9)immediate.push({winner:'invader',condition:collapse(['oathborn','empire'],true)});
    let condition:CampaignCondition=count(999);
    if(s.chapter===1)condition={type:'all',conditions:[count(20),count(7,'invader',{hexIds:loyal})]};
    if(s.chapter===2)condition={type:'all',conditions:[count(10,'invader',{hexIds:loyal}),count(1,'invader',{hexIds:loyalCities})]};
    if([5,6].includes(s.chapter))condition=count(s.chapter===5?4:5,'invader',{hexIds:loyalCities});
    if(s.chapter===9)return {immediate,deadline:{type:'condition',condition:collapse(['orcs']),winner:'resistance',otherwise:'invader'}};
    if(s.chapter===10)condition=count(3,'invader',{metric:'markers',kingdoms:['night']});
    return {immediate,deadline:{type:'condition',condition,winner:'invader',otherwise:'resistance'}};
  }
  switch(s.number){
    case 2:return {immediate:[{winner:'invader',condition:{type:'income',kingdom:'fjordland',atMost:4},check:'turn-end',afterKingdom:'fjordland'},{winner:'resistance',condition:{type:'income',kingdom:'empire',atMost:7,deductRevolts:false},check:'turn-end',afterKingdom:'empire'}],deadline:{type:'score',metric:'markers',tieWinner:'resistance',treasureMajorityPoint:true}};
    case 3:return prevent(count(2,'invader',{loyalties:['fjordland']}));
    case 4:case 5:return prevent(count(s.number===4?6:10,'invader',{metric:'controlled-or-razed',loyalties:[null,'oathborn']}));
    case 6:return prevent({type:'all',conditions:[count(5,'invader',{metric:'markers',kingdoms:['night']}),count(2,'invader',{metric:'markers',kingdoms:['night'],loyalties:['oathborn']})]});
    case 7:return prevent(count(11,'invader',{metric:'markers'}));
    case 8:return {immediate:[{winner:'invader',condition:count(1,'invader',{metric:'occupied',hexIds:[find('Dwelfholm').id]}),check:'turn-end',afterKingdom:'oathborn'},{winner:'resistance',condition:count(1,'resistance',{metric:'occupied',hexIds:[find('Moon Tower').id]}),check:'turn-end',afterKingdom:'night'}],deadline:{type:'condition',condition:count(7,'invader',{loyalties:['oathborn','fjordland','assassins-guild']}),winner:'invader',otherwise:'resistance'}};
    case 9:return {immediate:[{winner:'invader',condition:count(board.filter(h=>h.settlement?.loyalty==='empire').length,'invader',{metric:'controlled-or-razed',loyalties:['empire']})},{winner:'resistance',condition:collapse(['goblins'])}],deadline:{type:'condition',condition:count(1,'invader',{hexIds:[find('Aureliana').id]}),winner:'invader',otherwise:'resistance'}};
    case 10:return {immediate:[{winner:'invader',condition:count(3,'invader',{metric:'controlled-or-razed',hexIds:cities})},{winner:'resistance',condition:collapse(['orcs'])}],deadline:{type:'condition',condition:count(2,'invader',{metric:'controlled-or-razed',hexIds:cities}),winner:'invader',otherwise:'resistance'}};
    case 11:return {immediate:[{winner:'resistance',condition:collapse(['goblins'])}],deadline:{type:'condition',condition:count(3,'resistance',{metric:'presence',kingdoms:['oathborn']}),winner:'resistance',otherwise:'invader'}};
    case 12:return {immediate:[{winner:'resistance',condition:collapse(['goblins'])},{winner:'invader',condition:count(5,'invader',{metric:'markers',kingdoms:['goblins']}),check:'season-end',fromYear:2,fromSeason:0}],deadline:{type:'condition',condition:count(999),winner:'invader',otherwise:'resistance'}};
    case 13:return {immediate:[{winner:'invader',condition:count(2,'invader',{metric:'controlled-or-razed',hexIds:[find('Aureliana').id,find('Placidia').id]})}],deadline:{type:'condition',condition:count(2,'invader',{metric:'controlled-or-razed',hexIds:[find('Aureliana').id,find('Placidia').id]}),winner:'invader',otherwise:'resistance'}};
    case 14:return {deadline:{type:'condition',condition:count(6,'resistance',{kingdoms:['fjordland']}),winner:'resistance',otherwise:'invader'}};
    case 15:case 16:return {immediate:[{winner:'resistance',condition:count(1,'resistance',{metric:'occupied',hexIds:[find('Moon Tower').id]})}],deadline:{type:'condition',condition:count(999),winner:'resistance',otherwise:'invader'}};
    case 17:return {immediate:[{winner:'invader',condition:{type:'enemy-city-occupied',side:'invader'}},{winner:'resistance',condition:{type:'enemy-city-occupied',side:'resistance'}}],deadline:{type:'score',metric:'income',tieWinner:'invader',deductRevolts:true}};
    default:throw new Error('Campaign victory source is missing.');
  }
}
