import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compilePublishedCampaign,publishedCampaigns,campaignKingdom} from '../dist/js/published-campaigns.js';
import {createGame,applyAction,legalActions,validateState,exportGame,importGame,botAction,isWelcoming} from '../dist/js/engine.js';
import {campaignVictory,campaignCondition,campaignRevoltModifier} from '../dist/js/campaign-runtime.js';

const source=JSON.parse(fs.readFileSync(new URL('../content/published-campaigns.json',import.meta.url)));
const fresh=(id,profile='basic',options={})=>createGame({...compilePublishedCampaign(id,options),profile,seed:314159});
const byName=(s,name)=>{const h=s.hexes.find(h=>h.settlement?.name===name);assert.ok(h,`Missing ${name}`);return h;};
const settlements=(s,loyalties)=>s.hexes.filter(h=>h.settlement&&(!loyalties||loyalties.includes(h.settlement.loyalty)));
const cleanScore=s=>{s.controls={};s.razed=[];s.covens=[];for(const h of settlements(s))h.settlement.loyalty=null;return s;};
const mark=(s,hexes,owner)=>{for(const h of hexes)s.controls[h.id]=owner;};
const occupy=(s,h,kingdom,hero=false)=>{const d=s.unitDefinitions.find(d=>d.kingdom===kingdom&&(d.kind==='hero')===hero);assert.ok(d);const u={id:`unit-${s.serial++}`,defId:d.id,kingdom,hexId:h.id,weakened:false,activated:false};s.units.push(u);return u;};

// A reproducible human setup pass: resolve explicit table choices, satisfy each
// required free placement, buy one Army per kingdom, retain the remaining gold.
export function finishOpening(initial,{purchase=true}={}){
  let s=initial,steps=0;const bought=new Set();
  while(s.phase==='opening'&&steps++<180){
    const actions=legalActions(s),o=s.opening;
    const a=actions.find(a=>a.type==='opening-choice')??actions.find(a=>a.type==='opening-control')??actions.find(a=>a.type==='opening-build'&&o.remainingFreeUnits.some(u=>u.defId===a.defId))??actions.find(a=>a.type==='opening-coven')??actions.find(a=>a.type==='opening-hero')??(purchase&&!bought.has(s.currentKingdom)?actions.find(a=>a.type==='opening-build'):undefined)??actions.find(a=>a.type==='opening-done');
    assert.ok(a,`Setup stuck at ${s.scenario.id}/${s.currentKingdom}: ${JSON.stringify(actions.slice(0,4))}`);
    const free=a.type==='opening-build'&&o.remainingFreeUnits.some(u=>u.defId===a.defId);
    if(a.type==='opening-build'&&!free)bought.add(s.currentKingdom);
    const before=exportGame(s);const replay=applyAction(importGame(before),a);s=applyAction(s,a);
    assert.equal(exportGame(s),exportGame(replay),'Saved opening must replay deterministically');
    assert.deepEqual(validateState(s),[],`${s.scenario.id} after ${JSON.stringify(a)}`);
  }
  assert.notEqual(s.phase,'opening','Opening must finish within the placement bound');
  assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));
  return s;
}

test('the published library covers every named book start exactly once',()=>{
  assert.equal(publishedCampaigns.length,28);
  assert.equal(new Set(publishedCampaigns.map(s=>s.id)).size,28);
  assert.equal(publishedCampaigns.filter(s=>s.series==='scroll').length,17);
  assert.equal(publishedCampaigns.filter(s=>s.series==='chronicle').length,10);
  assert.equal(source.sources.spanishPublisherCampaignBook.pages,60);
});

for(const fact of source.entries)for(const profile of ['basic','advanced'])test(`${fact.id}: ${profile} source setup, supply, saved continuation`,()=>{
  const s=fresh(fact.id,profile);
  assert.equal(s.phase,'opening');assert.equal(s.units.filter(u=>!u.activated).length,0,'Opening purchasing allowances must not become invented fixed rosters');
  assert.deepEqual(s.scenario.turnOrder,fact.turnOrder.map(campaignKingdom));
  for(const [name,k]of Object.entries(fact.kingdoms)){
    const actual=s.kingdoms.find(k=>k.id===campaignKingdom(name));assert.ok(actual);
    const revolt=k.revolt??fact.specialRules?.find(r=>r?.type==='empire-revolt'&&name==='Eastern Empire')?.start??0;
    assert.equal(actual.gold,k.gold,`${name} opening gold`);assert.equal(actual.income,k.income??0,`${name} opening income`);assert.equal(actual.revolt??0,revolt,`${name} opening revolt`);
    const printedControls=[...(Array.isArray(k.controls)?k.controls:[]),...(k.controlsSpanish??[])].filter(n=>!/^one\s+(?:selected|chosen)/i.test(n));
    if(!s.scenario.sourceCampaign.preChoices?.length)assert.equal(Object.values(s.controls).filter(id=>id===actual.id).length,printedControls.length,`${name} listed opening control-marker count`);
  }
  assert.deepEqual(validateState(s),[]);
  const end=finishOpening(s);
  for(const d of end.unitDefinitions)assert.ok(end.units.filter(u=>u.defId===d.id).length<=d.count,`${d.name} physical supply`);
  if(profile==='basic')assert.ok(end.units.every(u=>end.unitDefinitions.find(d=>d.id===u.defId).kind!=='hero'));
  else for(const opening of end.scenario.sourceCampaign.opening){
    const fixed=opening.heroIds?.length??0,extra=opening.extraHeroes?.reduce((n,x)=>n+x.count,0)??0;
    assert.equal(end.units.filter(u=>u.kingdom===opening.kingdom&&end.unitDefinitions.find(d=>d.id===u.defId).kind==='hero').length,fixed+(opening.heroes??0)+extra,`${opening.kingdom} free Hero count`);
    for(const id of opening.unavailableHeroIds??[])assert.ok(!end.units.some(u=>u.defId===id));
  }
});

test('Intro allows wilderness movement but restricts settlement operations to six named locations',()=>{
  const s=fresh('intro'),allowed=new Set(source.entries.find(x=>x.id==='intro').allowedSettlements);
  assert.equal(settlements(s).filter(h=>!h.prohibitedFor?.includes('fjordland')).length,6);
  assert.ok(s.hexes.some(h=>!h.settlement&&!h.prohibited),'Wilderness stays playable');
  for(const h of settlements(s))if(!allowed.has(h.settlement.name))assert.ok(h.prohibitedFor?.includes('oathborn'));
});

test('Intro settlement ties favor Oathborn; Fight to the Death ties favor Orcs',()=>{
  for(const [id,winner]of [['intro','resistance'],['campaign-1','invader']]){
    const s=cleanScore(fresh(id)),hexes=id==='intro'?s.scenario.sourceCampaign.victory.deadline.hexIds.map(id=>s.hexes.find(h=>h.id===id)):settlements(s);
    mark(s,[hexes[0]],s.kingdoms.find(k=>k.side==='invader').id);mark(s,[hexes[1]],s.kingdoms.find(k=>k.side==='resistance').id);
    assert.equal(campaignVictory(s,'deadline').winner,winner);
  }
});

test('Jarl income victories wait for the named kingdom turn, ignore Imperial revolts, and tie favors Fjordland',()=>{
  const s=fresh('campaign-2'),fjord=s.kingdoms.find(k=>k.id==='fjordland'),empire=s.kingdoms.find(k=>k.id==='empire');
  fjord.income=4;assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'turn-end','empire'),null);assert.equal(campaignVictory(s,'turn-end','fjordland').winner,'invader');
  fjord.income=5;empire.income=8;empire.revolt=6;assert.equal(campaignVictory(s,'turn-end','empire'),null);
  empire.income=7;assert.equal(campaignVictory(s,'turn-end','empire').winner,'resistance');
  s.controls={};assert.equal(campaignVictory(s,'deadline').winner,'resistance');
});

test('Jarl Advanced treasure majority counts owned treasures and treasures still in hand',()=>{
  const s=fresh('campaign-2','advanced');s.controls={};const empire=s.advanced.players.find(p=>p.kingdoms.includes('empire')).id,fjord=s.advanced.players.find(p=>p.kingdoms.includes('fjordland')).id;
  const treasure=s.advanced.decks.treasures.slice(0,3);assert.equal(treasure.length,3);s.advanced.owned[fjord]=[treasure[0]];s.advanced.hands[empire].push(treasure[1],treasure[2]);assert.equal(campaignVictory(s,'deadline').winner,'invader');
  s.advanced.hands[empire]=s.advanced.hands[empire].filter(id=>!id.startsWith('treasure-'));assert.equal(campaignVictory(s,'deadline').winner,'resistance');
});

test('Jarl Long War preserves victory conditions and changes the Imperial revolt modifier at Autumn year two',()=>{
  const s=fresh('campaign-2','basic',{longWar:true});assert.equal(s.scenario.endYear,3);assert.equal(s.scenario.endSeason,2);assert.deepEqual(s.scenario.sourceCampaign.victory,compilePublishedCampaign('campaign-2').scenario.sourceCampaign.victory);
  assert.equal(campaignRevoltModifier(s),1);s.year=2;s.season=1;assert.equal(campaignRevoltModifier(s),1);s.season=2;assert.equal(campaignRevoltModifier(s),-1);
});

test('Great Goblin Raid counts Fjordland control at season end, never on the attack action',()=>{
  const s=fresh('campaign-3');s.controls={};mark(s,settlements(s,['fjordland']).slice(0,2),'goblins');
  assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'turn-end','goblins'),null);assert.equal(campaignVictory(s,'season-end').winner,'invader');
});

test('Deepwater and Approaching Thunder count razed neutral/Oathborn settlements, exclude Imperial loyalty',()=>{
  for(const [id,threshold]of [['campaign-4',6],['campaign-5',10]]){
    const s=fresh(id);s.controls={};s.razed=[];const valid=settlements(s,[null,'oathborn']).slice(0,threshold);assert.equal(valid.length,threshold);
    mark(s,valid.slice(0,-1),'orcs');s.razed=[valid.at(-1).id];assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'season-end').winner,'invader');
    delete s.controls[valid[0].id];for(const h of settlements(s,['empire']))s.razed.push(h.id);assert.equal(campaignVictory(s,'season-end'),null);
  }
});

test('Spire objective counts five Control markers with two Oathborn sites; Covens do not substitute',()=>{
  const s=fresh('campaign-6');s.controls={};s.razed=[];const oath=settlements(s,['oathborn']).slice(0,2),other=settlements(s).filter(h=>!oath.includes(h)).slice(0,3);
  mark(s,oath,'night');s.covens=other.map(h=>h.id);assert.equal(campaignVictory(s,'season-end'),null);mark(s,other,'night');assert.equal(campaignVictory(s,'season-end').winner,'invader');
});

test('Fire in Ash combines Orc and Night markers and checks only season end',()=>{
  const s=fresh('campaign-7');s.controls={};const hexes=settlements(s).slice(0,11);mark(s,hexes.slice(0,6),'orcs');mark(s,hexes.slice(6),'night');
  assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'season-end').winner,'invader');delete s.controls[hexes[0].id];assert.equal(campaignVictory(s,'season-end'),null);
});

test('Apocalypse city occupation requires an Army and the opposing named turn end',()=>{
  const s=fresh('campaign-8','advanced'),dwelf=byName(s,'Dwelfholm');occupy(s,dwelf,'goblins',true);
  assert.equal(campaignVictory(s,'turn-end','oathborn'),null);s.units=[];occupy(s,dwelf,'goblins');
  assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'turn-end','goblins'),null);assert.equal(campaignVictory(s,'turn-end','oathborn').winner,'invader');
  s.units=[];occupy(s,byName(s,'Spire of the Moon'),'oathborn');assert.equal(campaignVictory(s,'turn-end','night').winner,'resistance');
});

test('Marauders victory counts all Imperial loyal settlements; the deadline is Aureliana control',()=>{
  const s=fresh('campaign-9');s.controls={};s.razed=[];const empire=settlements(s,['empire']);mark(s,empire.slice(0,-1),'goblins');s.razed=[empire.at(-1).id];
  assert.equal(campaignVictory(s,'action').winner,'invader');s.controls={};s.razed=[];assert.equal(campaignVictory(s,'deadline').winner,'resistance');s.controls[byName(s,'Aureliana').id]='goblins';assert.equal(campaignVictory(s,'deadline').winner,'invader');
});

test('Marauders retains the nonparticipating Night Control at Megas',()=>{
  const s=fresh('campaign-9'),megas=byName(s,'Megas');assert.ok(!s.kingdoms.some(k=>k.id==='night'));assert.equal(s.controls[megas.id],'night');assert.equal(isWelcoming(s,megas,'goblins'),true);assert.equal(isWelcoming(s,megas,'empire'),false);assert.equal(isWelcoming(s,megas,'empire',true),true,'Underlying Neutral welcoming posture remains available for rebuilding');assert.deepEqual(importGame(exportGame(s)),s);
});

test('Last Stand wins immediately on all three cities, needs two at deadline, and Goblin presence is irrelevant',()=>{
  const s=fresh('campaign-10');s.controls={};s.razed=[];const cities=settlements(s).filter(h=>h.settlement.city);assert.equal(cities.length,3);
  mark(s,cities.slice(0,2),'orcs');assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'deadline').winner,'invader');s.razed=[cities[2].id];assert.equal(campaignVictory(s,'action').winner,'invader');
});

test('Across Oskolton accepts Oathborn Hero presence or control at three settlements, but not another Resistance kingdom',()=>{
  const s=fresh('campaign-11','advanced');s.controls={};s.units=[];const places=settlements(s).slice(0,3);mark(s,places.slice(0,2),'oathborn');occupy(s,places[2],'oathborn',true);
  assert.equal(campaignVictory(s,'deadline').winner,'resistance');s.units=[];assert.equal(campaignVictory(s,'deadline').winner,'invader');
});

test('Goblin High Tide five markers cannot win until Spring of year two',()=>{
  const s=fresh('campaign-12');s.controls={};mark(s,settlements(s).slice(0,5),'goblins');
  assert.equal(campaignVictory(s,'season-end'),null);s.year=2;s.season=0;assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'season-end').winner,'invader');
});

test('Orcs at Gate wins immediately with both named Imperial cities controlled or razed',()=>{
  const s=fresh('campaign-13');s.controls={};s.razed=[];s.controls[byName(s,'Aureliana').id]='orcs';s.razed.push(byName(s,'Placidia').id);assert.equal(campaignVictory(s,'action').winner,'invader');s.razed=[];assert.equal(campaignVictory(s,'deadline').winner,'resistance');
});

test('Return Long Ships excludes Fjordland loyalties controlled by Oathborn',()=>{
  const s=fresh('campaign-14');s.controls={};s.razed=[];const fjord=settlements(s,['fjordland']);mark(s,fjord,'oathborn');
  assert.equal(campaignVictory(s,'deadline').winner,'invader');mark(s,settlements(s).slice(0,6),'fjordland');assert.equal(campaignVictory(s,'deadline').winner,'resistance');
});

test('Return Long Ships permits peaceful entry into Oathborn-controlled Belgunot and restores printed Fjordland loyalty without Loot',()=>{
  let s=setupWithoutPurchases(fresh('campaign-14','basic'));const belgunot=byName(s,'Belgunot');assert.equal(s.controls[belgunot.id],'oathborn');assert.equal(isWelcoming(s,belgunot,'fjordland'),true);
  const near=s.hexes.find(h=>Math.max(Math.abs(h.q-belgunot.q),Math.abs(h.r-belgunot.r),Math.abs(h.q+h.r-belgunot.q-belgunot.r))===1&&!h.prohibited&&h.terrain!=='sea'&&h.terrain!=='lair'&&!belgunot.edges?.[h.id]?.sea&&!h.settlement);assert.ok(near);const army=occupy(s,near,'fjordland');s.phase='activation';s.currentKingdom='fjordland';s.turnIndex=s.scenario.turnOrder.indexOf('fjordland');const gold=s.kingdoms.find(k=>k.id==='fjordland').gold;
  const enter=legalActions(s).find(a=>a.type==='move'&&a.unitId===army.id&&a.toHex===belgunot.id);assert.ok(enter);s=applyAction(s,enter);assert.equal(s.controls[belgunot.id],undefined);assert.equal(s.kingdoms.find(k=>k.id==='fjordland').gold,gold);assert.equal(s.units.find(u=>u.id===army.id).hexId,belgunot.id);assert.ok(s.log.some(l=>l.includes('peacefully')));assert.deepEqual(validateState(s),[]);
});

test('Against Spire and Assault North require Resistance Army occupation, not a Hero or control marker',()=>{
  for(const id of ['campaign-15','campaign-16']){
    const s=fresh(id,'advanced'),moon=byName(s,'Spire of the Moon');s.units=[];s.controls[moon.id]='fjordland';occupy(s,moon,'fjordland',true);assert.equal(campaignVictory(s,'action'),null);
    s.units=[];occupy(s,moon,'fjordland');assert.equal(campaignVictory(s,'action').winner,'resistance');
  }
});

test('Undead Empress compares income after revolts at deadline; income ties favor Invader',()=>{
  const s=fresh('campaign-17');for(const k of s.kingdoms){k.income=0;k.revolt=0;}assert.equal(campaignVictory(s,'deadline').winner,'invader');
  s.kingdoms.find(k=>k.id==='empire').income=6;s.kingdoms.find(k=>k.id==='empire').revolt=4;s.kingdoms.find(k=>k.id==='night').income=3;s.kingdoms.find(k=>k.id==='fjordland').income=6;assert.equal(campaignVictory(s,'deadline').winner,'resistance');
  s.kingdoms.find(k=>k.id==='empire').revolt=2;assert.equal(campaignVictory(s,'deadline').winner,'invader');
});

test('Chronicle two/three city conditions are season-end checks; later both/either collapse predicates differ',()=>{
  for(const [id,count]of [['chronicle-1',2],['chronicle-4',3]]){
    const s=fresh(id);s.controls={};mark(s,settlements(s,['oathborn','empire','fjordland']).filter(h=>h.settlement.city).slice(0,count),'night');
    assert.equal(campaignVictory(s,'action'),null);assert.equal(campaignVictory(s,'season-end').winner,'invader');
  }
  for(const [id,firstWins]of [['chronicle-5',false],['chronicle-9',true]]){
    const s=fresh(id);s.kingdoms.find(k=>k.id==='oathborn').collapsed=true;assert.equal(campaignVictory(s,'action')?.winner??null,firstWins?'invader':null);s.kingdoms.find(k=>k.id==='empire').collapsed=true;assert.equal(campaignVictory(s,'action').winner,'invader');
  }
});

test('Chronicle final start requires three Night Control markers, not Coven markers',()=>{
  const s=fresh('chronicle-10');s.controls={};mark(s,settlements(s).slice(0,2),'night');s.covens=[settlements(s)[2].id];assert.equal(campaignVictory(s,'deadline').winner,'resistance');mark(s,[settlements(s)[2]],'night');assert.equal(campaignVictory(s,'deadline').winner,'invader');
});

test('Chronicle opening chapter needs twenty controlled settlements including seven Resistance-loyal settlements',()=>{
  const s=fresh('chronicle-1');s.controls={};s.razed=[];
  const loyal=settlements(s,['oathborn','empire','fjordland']).slice(0,7),other=settlements(s).filter(h=>!loyal.includes(h)&&!['oathborn','empire','fjordland'].includes(h.settlement.loyalty)).slice(0,13);
  for(const h of settlements(s))if(!['oathborn','empire','fjordland'].includes(h.settlement.loyalty))h.settlement.loyalty=null;
  assert.equal(loyal.length,7);assert.equal(other.length,13);mark(s,[...loyal,...other],'night');
  // Do not accidentally satisfy the separate season-end City shortcut.
  assert.equal(campaignVictory(s,'deadline').winner,'invader');delete s.controls[other[0].id];
  assert.equal(campaignCondition(s,s.scenario.sourceCampaign.victory.deadline.condition),false);
  mark(s,[other[0]],'night');delete s.controls[loyal[0].id];const spare=settlements(s).find(h=>!loyal.includes(h)&&!other.includes(h)&&!['oathborn','empire','fjordland'].includes(h.settlement.loyalty));assert.ok(spare);mark(s,[spare],'night');
  assert.equal(campaignCondition(s,s.scenario.sourceCampaign.victory.deadline.condition),false,'Twenty overall is insufficient with only six Resistance-loyal settlements');
});

test('Chronicle chapters five and six count four/five Resistance-loyal Cities; chapter nine requires Orc collapse',()=>{
  for(const [id,threshold]of [['chronicle-5',4],['chronicle-6',5]]){
    const s=fresh(id);s.controls={};const cities=settlements(s,['oathborn','empire','fjordland']).filter(h=>h.settlement.city).slice(0,threshold);assert.equal(cities.length,threshold);mark(s,cities,'night');assert.equal(campaignVictory(s,'deadline').winner,'invader');delete s.controls[cities[0].id];assert.equal(campaignVictory(s,'deadline').winner,'resistance');
  }
  const s=fresh('chronicle-9');assert.equal(campaignVictory(s,'deadline').winner,'invader');s.kingdoms.find(k=>k.id==='orcs').collapsed=true;assert.equal(campaignVictory(s,'deadline').winner,'resistance');
});

test('all named compound victory conditions treat empty conditions and missing controllers consistently',()=>{
  const s=fresh('intro');assert.equal(campaignCondition(s,{type:'all',conditions:[{type:'count',metric:'markers',kingdoms:['fjordland'],atLeast:2},{type:'count',metric:'markers',kingdoms:['oathborn'],atLeast:1}]}),true);
  assert.equal(campaignCondition(s,{type:'income',kingdom:'unavailable',atMost:4}),false);
});

const mandatoryOpeningAction=s=>{
  const actions=legalActions(s),o=s.opening;
  return actions.find(a=>a.type==='opening-choice')??actions.find(a=>a.type==='opening-control')??actions.find(a=>a.type==='opening-build'&&o.remainingFreeUnits.some(u=>u.defId===a.defId))??actions.find(a=>a.type==='opening-coven')??actions.find(a=>a.type==='opening-hero')??actions.find(a=>a.type==='opening-done');
};
function openingAt(id,kingdom,profile='advanced'){
  let s=fresh(id,profile),steps=0;
  while(s.phase==='opening'&&s.currentKingdom!==kingdom&&steps++<80){const a=mandatoryOpeningAction(s);assert.ok(a);s=applyAction(s,a);}
  assert.equal(s.phase,'opening');assert.equal(s.currentKingdom,kingdom);return s;
}

test('Marauders free Fjord armies are weakened, cost no gold, stack only with a Fjord Hero, and activate on Imperial turns',()=>{
  let s=openingAt('campaign-9','empire');const before=s.kingdoms.find(k=>k.id==='empire').gold;
  const foreign=legalActions(s).find(a=>a.type==='opening-build'&&s.unitDefinitions.find(d=>d.id===a.defId).kingdom==='fjordland');assert.ok(foreign);s=applyAction(s,foreign);
  const army=s.units.at(-1);assert.equal(army.weakened,true);assert.equal(army.kingdom,'empire');assert.equal(s.kingdoms.find(k=>k.id==='empire').gold,before);
  const armyHex=army.hexId,heroes=legalActions(s).filter(a=>a.type==='opening-hero'&&a.hexId===armyHex);
  assert.ok(heroes.some(a=>s.unitDefinitions.find(d=>d.id===a.defId).kingdom==='fjordland'));
  assert.ok(!heroes.some(a=>s.unitDefinitions.find(d=>d.id===a.defId).kingdom==='empire'),'Imperial Hero cannot stack with foreign Fjord Army');
  s=applyAction(s,heroes.find(a=>s.unitDefinitions.find(d=>d.id===a.defId).kingdom==='fjordland'));
  assert.deepEqual(validateState(s),[]);assert.deepEqual(importGame(exportGame(s)),s);
});

test('Orcs at Gate optional Night exchange razes one control, grants one free Coven, and cannot repeat',()=>{
  let s=openingAt('campaign-13','night'),exchange=legalActions(s).find(a=>a.type==='opening-exchange-coven');assert.ok(exchange);
  const income=s.kingdoms.find(k=>k.id==='night').income;s=applyAction(s,exchange);
  assert.equal(s.controls[exchange.hexId],undefined);assert.ok(s.razed.includes(exchange.hexId));assert.equal(s.opening.remainingCovens,1);assert.equal(s.kingdoms.find(k=>k.id==='night').income,income-1);
  assert.ok(!legalActions(s).some(a=>a.type==='opening-exchange-coven'));const place=legalActions(s).find(a=>a.type==='opening-coven');assert.ok(place);s=applyAction(s,place);assert.ok(s.covens.includes(place.hexId));assert.equal(s.opening.remainingCovens,0);assert.deepEqual(validateState(s),[]);
});

test('same-side opening deployment can switch kingdoms and preserve each kingdom mandatory placements',()=>{
  let s=fresh('campaign-7','advanced');while(legalActions(s).some(a=>a.type==='opening-control'))s=applyAction(s,legalActions(s).find(a=>a.type==='opening-control'));
  const original=s.currentKingdom,heroes=[...s.opening.remainingHeroes],switchAction=legalActions(s).find(a=>a.type==='opening-switch');assert.ok(switchAction);
  s=applyAction(s,switchAction);assert.notEqual(s.currentKingdom,original);s=applyAction(s,{type:'opening-switch',kingdom:original});assert.deepEqual(s.opening.remainingHeroes,heroes);
  assert.deepEqual(importGame(exportGame(s)),s);
});

test('interleaved native Fjordland and Imperial foreign-contingent setup reserve different Fjord Heroes',()=>{
  let s=openingAt('chronicle-8','fjordland'),reserved=[...s.opening.remainingHeroes];assert.equal(reserved.length,2);s=applyAction(s,{type:'opening-switch',kingdom:'empire'});
  const foreign=s.opening.remainingHeroes.filter(id=>s.unitDefinitions.find(d=>d.id===id).kingdom==='fjordland');assert.equal(foreign.length,1);assert.ok(foreign.every(id=>!reserved.includes(id)),'An unplaced allied Hero cannot be drawn twice');s=applyAction(s,{type:'opening-switch',kingdom:'fjordland'});assert.deepEqual(s.opening.remainingHeroes,reserved);assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));
});

test('Autumn-start Empress uses the printed study pool plus the Autumn Churn',()=>{
  const s=fresh('campaign-17','advanced');assert.equal(s.season,2);assert.equal(s.advanced.extraChurn,true);assert.equal(Object.keys(s.advanced.studyMarkers).length,4);
});

for(const id of ['intro','campaign-3','campaign-6'])test(`${id}: bounded Basic AI play reaches the source campaign deadline or a legal early victory`,()=>{
  let s=finishOpening(fresh(id));let actions=0;
  while(s.phase!=='game-over'&&actions++<700){const a=botAction(s);assert.ok(a,`No AI action at ${s.phase}`);s=applyAction(s,a);assert.deepEqual(validateState(s),[],`${id} ${JSON.stringify(a)}`);}
  assert.equal(s.phase,'game-over');assert.ok(actions<700);assert.ok(['invader','resistance'].includes(s.winner));assert.deepEqual(importGame(exportGame(s)),s);
});

const setupWithoutPurchases=initial=>{
  let s=initial,steps=0;while(s.phase==='opening'&&steps++<150){const a=mandatoryOpeningAction(s);assert.ok(a);s=applyAction(s,a);}assert.notEqual(s.phase,'opening');return s;
};

test('High Tide corrected Night setup can release a Control during Income Actions to make room for a Coven',()=>{
  let s=setupWithoutPurchases(fresh('campaign-12','basic'));assert.equal(s.currentKingdom,'night');assert.equal(s.phase,'income-actions');assert.equal(s.covens.length,0);assert.equal(Object.values(s.controls).filter(k=>k==='night').length,5);
  assert.ok(!legalActions(s).some(a=>a.type==='coven'));assert.ok(!legalActions(s).some(a=>a.type==='transfer-gold'&&a.toKingdom==='goblins'));
  const remove=legalActions(s).find(a=>a.type==='remove-control');assert.ok(remove,'Official erratum allows initial Income Actions control removal');s=applyAction(s,remove);assert.ok(legalActions(s).some(a=>a.type==='coven'));assert.deepEqual(validateState(s),[]);
});

test('Oskolton fixed Berserker cannot activate and Oathborn repair pays no gold',()=>{
  const s=setupWithoutPurchases(fresh('campaign-11','basic'));s.phase='activation';s.currentKingdom='oathborn';s.turnIndex=s.scenario.turnOrder.indexOf('oathborn');
  const fixed=s.units.find(u=>u.defId==='fjord-berserkir');assert.ok(fixed);fixed.weakened=true;
  assert.ok(!legalActions(s).some(a=>a.unitId===fixed.id));const home=settlements(s,['oathborn'])[0];assert.ok(home);if(!s.razed.includes(home.id))s.razed.push(home.id);delete s.controls[home.id];occupy(s,home,'oathborn');s.kingdoms.find(k=>k.id==='oathborn').gold=0;
  assert.ok(legalActions(s).some(a=>a.type==='recolonize'&&a.hexId===home.id));const repaired=applyAction(s,{type:'recolonize',hexId:home.id});assert.equal(repaired.kingdoms.find(k=>k.id==='oathborn').gold,0);assert.ok(!repaired.razed.includes(home.id));assert.deepEqual(validateState(repaired),[]);
});

test('Spire fragile defender stays at the Tower through every legal hostile-settlement attack',()=>{
  let s=setupWithoutPurchases(fresh('campaign-15','basic'));s.phase='activation';s.currentKingdom='night';s.turnIndex=s.scenario.turnOrder.indexOf('night');const defender=s.units.find(u=>u.defId==='campaign-osterlich');assert.ok(defender);defender.activated=false;
  const anchor=s.hexes.find(h=>h.id===defender.hexId),target=s.hexes.find(h=>Math.max(Math.abs(h.q-anchor.q),Math.abs(h.r-anchor.r),Math.abs(h.q+h.r-anchor.q-anchor.r))===1&&!h.prohibited&&h.terrain!=='sea'&&h.terrain!=='lair');assert.ok(target);
  target.settlement={name:'Anchored defender regression target',loyalty:null,city:false,fortified:0,port:false,neutralFriendlyTo:[]};delete s.controls[target.id];s.razed=s.razed.filter(id=>id!==target.id);s.unitDefinitions.find(d=>d.id===defender.defId).heavy=24;
  const attack=legalActions(s).find(a=>a.type==='attack'&&a.unitId===defender.id&&a.targetHex===target.id);if(attack)s=applyAction(s,attack);
  assert.equal(s.units.find(u=>u.id===defender.id).hexId,anchor.id,'Winning an adjacent settlement battle cannot bypass the source anchor rule');assert.ok(!legalActions(s).some(a=>['move','ship'].includes(a.type)&&a.unitId===defender.id));assert.deepEqual(validateState(s),[]);
});
function dryStep(s){
  const actions=legalActions(s);
  const a=actions.find(a=>a.type==='campaign-abandon')??actions.find(a=>a.type==='campaign-displace')??(s.phase==='opening'?mandatoryOpeningAction(s):undefined)??actions.find(a=>a.type==='finish-study')??actions.find(a=>a.type==='finish-winter')??actions.find(a=>a.type==='magic-pass')??actions.find(a=>a.type==='suppress')??actions.find(a=>a.type==='collect-income')??actions.find(a=>a.type==='end-turn');
  assert.ok(a,`No calendar action at ${s.year}/${s.season}/${s.currentKingdom}: ${JSON.stringify(actions.slice(0,3))}`);
  const next=applyAction(s,a);assert.deepEqual(validateState(next),[],JSON.stringify(a));return {next,action:a};
}

test('linked Chronicle keeps the start setup and final chapter victory; Bitter End has thirty-five seasons from chapter one',()=>{
  const linked=compilePublishedCampaign('chronicle-1',{endingChapter:10}),bitter=compilePublishedCampaign('chronicle-1',{endingChapter:10,bitterEnd:true});
  assert.equal(linked.scenario.startYear,589);assert.equal(linked.scenario.endYear,598);assert.equal(linked.scenario.endSeason,2);
  assert.equal(bitter.scenario.endYear,600);assert.equal(bitter.scenario.endSeason,1);assert.equal((bitter.scenario.endYear-bitter.scenario.startYear)*3+bitter.scenario.endSeason-bitter.scenario.startSeason+1,35);
  assert.equal(bitter.scenario.sourceCampaign.chronicle.bitterDefender.winterYear,598);
  assert.deepEqual(linked.scenario.sourceCampaign.victory,compilePublishedCampaign('chronicle-10').scenario.sourceCampaign.victory);
  assert.equal(linked.scenario.sourceCampaign.opening.find(k=>k.kingdom==='night').gold,16,'Linking retains Chapter One budget rather than resetting to Chapter Ten');
});

test('linked Chronicle Treaty changes Mara Mitai posture in Spring 593',()=>{
  let s=setupWithoutPurchases(fresh('chronicle-4','basic',{endingChapter:5}));const mara=s.hexes.find(h=>h.settlement?.loyalty==='mara-mitai');assert.ok(mara);assert.equal(isWelcoming(s,mara,'oathborn'),false);
  for(const k of s.kingdoms)k.gold=1000;
  let steps=0;while(s.year<593&&s.phase!=='game-over'&&steps++<100)s=dryStep(s).next;
  assert.equal(s.year,593);assert.equal(s.season,0);assert.equal(isWelcoming(s,s.hexes.find(h=>h.id===mara.id),'oathborn'),true);assert.equal(isWelcoming(s,s.hexes.find(h=>h.id===mara.id),'night'),false);assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));
});

test('linked Chronicle beginning without Fjordland reintroduces it in Spring 596 and resumes chapter-eight turn order',()=>{
  let s=setupWithoutPurchases(fresh('chronicle-5','basic',{endingChapter:8}));assert.ok(!s.kingdoms.some(k=>k.id==='fjordland'));for(const k of s.kingdoms)k.gold=1000;
  let steps=0;while(!s.campaignRuntime.fjordReturned&&s.phase!=='game-over'&&steps++<300)s=dryStep(s).next;
  assert.equal(s.year,596);assert.equal(s.season,0);assert.equal(s.phase,'opening');assert.equal(s.currentKingdom,'fjordland');assert.equal(s.kingdoms.find(k=>k.id==='fjordland').gold,25);
  assert.ok(legalActions(s).some(a=>a.type==='opening-build'),'Returning kingdom can buy its own Armies');
  assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));
  s=applyAction(s,legalActions(s).find(a=>a.type==='opening-build'));s=setupWithoutPurchases(s);assert.equal(s.phase,'income-actions');assert.equal(s.currentKingdom,campaignKingdom(source.entries.find(x=>x.id==='chronicle-8').turnOrder[0]));assert.equal(s.scenario.turnOrder.at(-1),'goblins');assert.ok(s.scenario.sourceCampaign.specialRules.some(r=>r.type==='no-collapse'&&r.kingdoms.includes('fjordland')));assert.deepEqual(validateState(s),[]);
});

test('Chronicle Winter 594 gives both sides persistent abandoned-lair choices',()=>{
  let s=setupWithoutPurchases(fresh('chronicle-6','advanced',{endingChapter:7}));
  s.season=2;s.turnIndex=s.scenario.turnOrder.length-1;s.currentKingdom=s.scenario.turnOrder[s.turnIndex];s.phase='activation';s.advanced.pending=null;for(const k of s.kingdoms)k.gold=1000;
  s=applyAction(s,{type:'end-turn'});const abandoned=[];let steps=0;
  while(steps++<60){const {next,action}=dryStep(s);s=next;if(action.type==='campaign-abandon')abandoned.push(action.hexId);if(abandoned.length===2&&!s.campaignRuntime.pendingAbandon?.length&&!s.advanced.pending)break;}
  assert.equal(abandoned.length,2);assert.notEqual(abandoned[0],abandoned[1]);assert.equal(s.year,595);assert.ok(abandoned.every(id=>s.campaignRuntime.abandonedLairs.includes(id)));assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));
});

test('Bitter End reserves Osterlich, places him in Winter 598, and keeps the campaign running after that winter',()=>{
  let s=setupWithoutPurchases(fresh('chronicle-10','advanced',{bitterEnd:true}));assert.ok(s.campaignRuntime.reservedMonsters.includes('monster-osterlich'));assert.ok(!s.advanced.monsterPools.land.includes('monster-osterlich'));
  s.season=2;s.turnIndex=s.scenario.turnOrder.length-1;s.currentKingdom=s.scenario.turnOrder[s.turnIndex];s.phase='activation';s.advanced.pending=null;for(const k of s.kingdoms)k.gold=1000;
  s=applyAction(s,{type:'end-turn'});let steps=0;while(!s.campaignRuntime.bitterPlaced&&steps++<60)s=dryStep(s).next;
  assert.ok(s.campaignRuntime.bitterPlaced);assert.ok(s.units.some(u=>u.defId==='campaign-osterlich'&&u.hexId===byName(s,'Spire of the Moon').id));assert.notEqual(s.phase,'game-over');assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));
});

test('full Bitter End timeline visits all thirty-five seasons without a setup reset',()=>{
  let s=finishOpening(fresh('chronicle-1','basic',{endingChapter:10,bitterEnd:true}));for(const k of s.kingdoms)k.gold=1000;
  const seasons=new Set([`${s.year}/${s.season}`]),initialUnits=s.units.map(u=>u.id);let steps=0;
  while(s.phase!=='game-over'&&steps++<850){s=dryStep(s).next;seasons.add(`${s.year}/${s.season}`);}
  assert.equal(s.phase,'game-over');assert.ok(steps<850);assert.equal(seasons.size,35);assert.equal(s.year,600);assert.equal(s.season,1);assert.ok(initialUnits.every(id=>s.units.some(u=>u.id===id)),'Linked chapters preserve the evolving opening forces');assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));
});
