import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions,validateState,exportGame,importGame} from '../dist/js/engine.js';
import {tabletopConfig,applyTableOperation,enableFullTabletop} from '../dist/js/tabletop.js';
import {cards,monsters,runtimeLimitations,runtimePlayable} from '../dist/js/advanced.js';
import {createCompanion,recordCampaignEvent,getReplayEvents} from '../dist/js/async-play.js';
import {fixture,give,placeHero,battle} from './fixtures/advanced.mjs';
const fj='player-fjordland',orc='player-orcs';
const table=()=>createGame({...fixture(),tabletop:true});
const op=(s,operation)=>applyTableOperation(s,operation,'Printed rule / diagnostic table ruling').state;
test('full tabletop includes every Magic card, named Hero and Monster with a portable save',()=>{
  const s=createGame(tabletopConfig(['broken-coast','wildlands','imperial-heartland','fields-of-ash'],'Four-board diagnostic'));
  assert.equal(s.kingdoms.length,6);assert.ok(s.hexes.length>=630);assert.equal(s.scenario.official,false);
  assert.ok(s.hexes.filter(h=>h.settlement).every(h=>!h.prohibited&&h.terrain!=='sea'&&h.terrain!=='lair'),'Calibration templates must not mix incompatible map origins');
  const a=s.advanced,inventory=[...Object.values(a.decks).flat(),...Object.values(a.hands).flat()];
  assert.equal(inventory.length,148);assert.equal(new Set(inventory).size,148);assert.ok(Object.keys(runtimeLimitations).filter(id=>cards.find(c=>c.id===id).kind!=='hero').every(id=>inventory.includes(id)));
  assert.equal(Object.values(a.heroPools).flat().length,38);assert.equal(a.monsterPools.land.length+a.monsterPools.sea.length,36);
  assert.deepEqual(importGame(exportGame(s)),s);assert.deepEqual(validateState(s),[]);
});
test('enabling Full tabletop preserves an Advanced position and existing deck order while inserting the finite missing manual cards',()=>{
  const config=fixture();config.scenario.kingdoms.push({id:'night',name:'Night',side:'invader',gold:0,income:0});config.scenario.turnOrder.push('night');
  const s=createGame(config),before=structuredClone(s),reason='Players agree to review an interrupted movement at the table';
  // A card already assigned to a physical zone must never re-enter its deck.
  s.advanced.removedCards.push('blessing-night-02');
  const result=enableFullTabletop(s,reason,orc),after=result.state;
  assert.equal(result.playerId,orc);assert.equal(result.private,false);assert.equal(before.tabletop,undefined);assert.equal(s.tabletop,undefined);
  assert.deepEqual(after.units,s.units);assert.deepEqual(after.hexes,s.hexes);assert.deepEqual(after.kingdoms,s.kingdoms);assert.deepEqual(after.advanced.hands,s.advanced.hands);assert.deepEqual(after.advanced.owned,s.advanced.owned);
  for(const key of ['activeUnitId','remainingMP','moved','shipUsed','allRoad','phase','year','season','turnSerial'])assert.deepEqual(after[key],s[key]);
  for(const [key,deck] of Object.entries(s.advanced.decks))assert.deepEqual(after.advanced.decks[key].filter(id=>deck.includes(id)),deck,'Existing cards retain their relative deck order');
  const inventory=[...Object.values(after.advanced.hands).flat(),...Object.values(after.advanced.owned).flat(),...Object.values(after.advanced.decks).flat(),...Object.values(after.advanced.discards).flat(),...after.advanced.eliminatedTreasures,...after.advanced.removedCards];
  for(const c of cards.filter(c=>c.verified&&c.kind!=='hero'&&(!c.kingdom||s.kingdoms.some(k=>k.id===c.kingdom))))assert.equal(inventory.filter(id=>id===c.id).length,1,c.id);
  assert.equal(after.advanced.decks['blessings-night'].includes('blessing-night-02'),false);assert.equal(cards.filter(c=>c.kind!=='hero'&&!runtimePlayable(c)).length,4);
  assert.notEqual(after.rng,s.rng);assert.deepEqual(enableFullTabletop(importGame(exportGame(s)),reason,orc),result);assert.match(after.tabletop.rulings[0],/Players agree/);
  assert.deepEqual(validateState(after),[]);assert.deepEqual(importGame(exportGame(after)),after);
  assert.throws(()=>enableFullTabletop(after,reason),/already/);assert.throws(()=>enableFullTabletop(s,'x'),/Describe/);assert.throws(()=>enableFullTabletop(s,reason,'unknown-seat'),/player/);
  const corrupt=structuredClone(s);corrupt.advanced.hands[fj].push(corrupt.advanced.hands[fj][0]);assert.throws(()=>enableFullTabletop(corrupt,reason),/duplicated/);
  assert.throws(()=>enableFullTabletop(createGame({...fixture(),profile:'basic'}),reason),/Advanced/);
});
test('enabling recorded table rulings retains automated published victory conditions',()=>{
  const config=fixture();config.scenario.sourceCampaign={series:'intro',deploymentOrder:[['fjordland'],['orcs']],opening:[{kingdom:'fjordland',gold:0},{kingdom:'orcs',gold:0}],specialRules:[],victory:{immediate:[{winner:'resistance',condition:{type:'count',metric:'markers',kingdoms:['fjordland'],hexIds:['C'],atLeast:1}}],deadline:{type:'score',metric:'settlements',tieWinner:'invader'}}};
  let s=createGame(config);s=enableFullTabletop(s,'Record a human interpretation of an interrupted move').state;
  assert.equal(s.tabletop.manualVictory,false);assert.deepEqual(s.scenario.sourceCampaign,config.scenario.sourceCampaign);
  while(s.phase==='opening')s=applyAction(s,legalActions(s).find(a=>a.type==='opening-done'));
  s.controls.C='fjordland';s=applyAction(s,{type:'collect-income'});assert.equal(s.winner,'resistance');assert.equal(s.phase,'game-over');assert.deepEqual(importGame(exportGame(s)),s);
});
test('a recorded relocation recovers a blocked Huge position without inventing movement allowance or counter readiness',()=>{
  const config=fixture();config.unitDefinitions[0].characteristics=['huge'];delete config.hexes[0].settlement;config.hexes[0].terrain='forest';config.hexes[1].settlement={name:'Welcoming crossing',loyalty:'fjordland',city:false,fortified:0,port:false};config.scenario.objective.hexIds=['B'];
  let s=applyAction(createGame(config),{type:'collect-income'});s=applyAction(s,{type:'activate',unitId:'unit-1'});
  s.units.find(u=>u.id==='unit-1').hexId='B';s.remainingMP=1;s.advanced.movement['unit-1']=1;s.moved=true;s.kingdoms.find(k=>k.id==='fjordland').gold=0;
  for(const p of s.advanced.players){for(const id of s.advanced.hands[p.id])s.advanced.discards[cards.find(c=>c.id===id).kind==='spell'?'spells':'blessings'].push(id);s.advanced.hands[p.id]=[];}
  assert.deepEqual(validateState(s),[]);assert.deepEqual(legalActions(s),[],'The legal state has no printed continuation after the interruption');
  s=enableFullTabletop(s,'Horn interruption: players will adjudicate the stranded Huge Army').state;
  const mp=s.remainingMP,activated=s.units.find(u=>u.id==='unit-1').activated;
  s=applyTableOperation(s,{kind:'move',unitId:'unit-1',hexId:'D',wholeStack:true},'Players agree to relocate the stranded Giant to the adjacent forest').state;
  assert.equal(s.remainingMP,mp);assert.equal(s.units.find(u=>u.id==='unit-1').activated,activated);assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'D');assert.ok(legalActions(s).some(a=>a.type==='pass'&&a.unitId==='unit-1'));
  assert.match(s.tabletop.rulings.at(-1),/Players agree to relocate/);assert.deepEqual(validateState(s),[]);assert.deepEqual(importGame(exportGame(s)),s);
});
test('Army and Hero placement preserve finite supply and allow a legal stack',()=>{
  let s=table();s=op(s,{kind:'place',defId:'hero-fjordland-17',hexId:'A',weakened:false,finished:false});
  assert.equal(Object.keys(s.advanced.stacks).length,1);assert.equal(s.advanced.heroPools.fjordland.includes('hero-fjordland-17'),false);
  assert.throws(()=>op(s,{kind:'place',defId:'hero-fjordland-17',hexId:'D',weakened:false,finished:false}),/copies|pool/);
  assert.throws(()=>op(s,{kind:'place',defId:'army-b',hexId:'A',weakened:false,finished:false}),/incompatible/);
  assert.deepEqual(validateState(s),[]);
});
test('table card resolutions pause normal play, nest opposing responses, and resume without moving RNG',()=>{
  let s=table();give(s,fj,'treasure-05');give(s,orc,'spell-06');const rng=s.rng;
  s=op(s,{kind:'play',playerId:fj,cardId:'treasure-05'});assert.equal(legalActions(s).length,0);
  s=op(s,{kind:'play',playerId:orc,cardId:'spell-06'});assert.equal(s.tabletop.review.playerId,orc);
  assert.deepEqual(importGame(exportGame(s)),s);
  s=op(s,{kind:'complete'});assert.equal(s.tabletop.review.cardId,'treasure-05');
  s=op(s,{kind:'complete'});assert.equal(s.tabletop.review,null);assert.ok(legalActions(s).length);assert.equal(s.rng,rng);
});
test('table dice are deterministic across save/resume and actually advance the random stream',()=>{
  const s=table(),action={kind:'roll',sides:8,count:8};
  const a=applyTableOperation(s,action,'Printed Strike'),b=applyTableOperation(importGame(exportGame(s)),action,'Printed Strike');
  assert.deepEqual(a,b);assert.notEqual(a.state.rng,s.rng);assert.match(a.summary,/8d8/);
});
test('private draws have owner receipts without public table ruling or opponent replay leakage',()=>{
  let s=table();s.companion=createCompanion(s);const result=applyTableOperation(s,{kind:'draw',playerId:fj,deck:'spells',count:1},'Private hand preparation');
  const after=recordCampaignEvent(s,result.state,{type:'table-ruling',playerId:fj,summary:result.summary,private:result.private});
  const gained=after.advanced.hands[fj].filter(id=>!s.advanced.hands[fj].includes(id));assert.equal(gained.length,1);
  const name=cards.find(c=>c.id===gained[0]).name;assert.ok(JSON.stringify(getReplayEvents(after,'fjordland')).includes(name));assert.ok(!JSON.stringify(getReplayEvents(after,'orcs')).includes(name));
  assert.equal(after.tabletop.rulings.length,0);assert.equal(after.tabletop.privateRulings[fj].length,1);
});
test('table relocation can leave a Hero behind and map calibration is reciprocal and validated',()=>{
  let s=table();const h=placeHero(s,'hero-fjordland-17','A','unit-1');
  s=op(s,{kind:'move',unitId:'unit-1',hexId:'B',wholeStack:false});assert.equal(s.units.find(u=>u.id===h.id).hexId,'A');assert.equal(s.advanced.stacks[h.id],undefined);
  s=op(s,{kind:'edge',from:'A',to:'B',edge:{road:true,river:2}});assert.deepEqual(s.hexes[0].edges.B,s.hexes[1].edges.A);
  assert.throws(()=>op(s,{kind:'edge',from:'A',to:'C',edge:{road:true}}),/adjacent/);
  assert.throws(()=>op(s,{kind:'hex',hex:{...s.hexes[1],terrain:'lava'}}),/Expected one/);
  assert.deepEqual(importGame(exportGame(s)),s);
});
test('four Enslaved Hero markers retain printed Army identity and release without inventing a named Hero',()=>{
  const cfg=fixture();cfg.scenario.kingdoms.find(k=>k.id==='orcs').side='resistance';cfg.scenario.kingdoms.push({id:'night',name:'Night',side:'invader',gold:10,income:3});cfg.scenario.turnOrder.push('night');let s=createGame({...cfg,tabletop:true});s=op(s,{kind:'move',unitId:'unit-2',hexId:'B',wholeStack:true});
  s=op(s,{kind:'enslave',armyId:'unit-2',release:false});assert.equal(s.units.find(u=>u.id==='unit-2').kingdom,'orcs');assert.equal(s.tabletop.enslaved.length,1);
  assert.throws(()=>op(s,{kind:'enslave',armyId:'unit-2',release:false}),/requires/);
  s=op(s,{kind:'enslave',armyId:'unit-2',release:true});assert.equal(s.tabletop.enslaved.length,0);assert.deepEqual(validateState(s),[]);
});
test('a manually prevented hit is consumed exactly once and remaining hits still wait for their owner',()=>{
  let s=applyAction(table(),{type:'collect-income'});battle(s,{hits:2});
  s=op(s,{kind:'consume-hit'});assert.equal(s.advanced.pending.kind,'hit');assert.equal(s.advanced.pending.count,1);assert.equal(s.units.find(u=>u.id==='unit-1').weakened,false);
  s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});assert.equal(s.units.find(u=>u.id==='unit-1').weakened,true);assert.deepEqual(validateState(s),[]);
});
test('custom campaign alliances, turn order and objective survive export; explicit victory records the printed condition',()=>{
  let s=table();s=op(s,{kind:'campaign',name:'Book-entered campaign',source:'Printed campaign victory: protect the frontier.',turnOrder:['orcs','fjordland'],alliances:{orcs:'resistance',fjordland:'invader'},manualVictory:true,objective:{type:'survival',hexIds:[],count:0}});
  assert.equal(s.turnIndex,1);assert.equal(s.kingdoms.find(k=>k.id==='orcs').side,'resistance');
  s=op(s,{kind:'victory',side:'resistance',reason:'Printed frontier victory condition achieved.'});assert.equal(s.phase,'game-over');assert.match(s.victoryReason,/frontier/);assert.deepEqual(importGame(exportGame(s)),s);
});
test('the selected tabletop seat owns ruling receipts and another seat cannot finish its card',()=>{
  let s=table();give(s,orc,'spell-47');s=op(s,{kind:'play',playerId:orc,cardId:'spell-47'});
  assert.throws(()=>applyTableOperation(s,{kind:'complete'},'Printed response resolved',fj),/Pass table controls/);
  const result=applyTableOperation(s,{kind:'note',text:'Reviewed the table.'},'Seat test',orc);assert.equal(result.playerId,orc);
});
test('a current-activation movement ruling updates the active member budget and requires an activation',()=>{
  let s=applyAction(table(),{type:'collect-income'});const effect={kind:'effect',cardId:'spell-38',target:'unit-1',light:0,heavy:0,movement:2,fortification:0,abilities:[],duration:'activation'};
  assert.throws(()=>op(s,effect),/Activate/);s=applyAction(s,{type:'activate',unitId:'unit-1'});const old=s.remainingMP;s=op(s,effect);assert.equal(s.remainingMP,old+2);assert.equal(s.advanced.movement['unit-1'],old+2);assert.deepEqual(importGame(exportGame(s)),s);
});
test('all 148 Magic cards, 38 named Heroes and 36 Monsters can traverse the physical table with finite inventories',()=>{
  let s=createGame(tabletopConfig(['wildlands','broken-coast','imperial-heartland','fields-of-ash'],'Complete component traversal'));
  for(const c of cards.filter(c=>c.kind!=='hero')){
    const p=s.advanced.players.find(p=>!c.kingdom||p.kingdoms.includes(c.kingdom));give(s,p.id,c.id);
    s=op(s,{kind:'play',playerId:p.id,cardId:c.id});assert.equal(s.tabletop.review.cardId,c.id);s=op(s,{kind:'complete'});
  }
  const clear=s.hexes.find(h=>!h.prohibited&&!h.settlement&&!h.mine&&h.terrain==='clear').id;
  for(const c of cards.filter(c=>c.kind==='hero')){
    s=op(s,{kind:'place',defId:c.id,hexId:clear,weakened:false,finished:false});const u=s.units.find(u=>u.defId===c.id),p=s.advanced.players.find(p=>p.kingdoms.includes(u.kingdom));
    s=op(s,{kind:'hero-power',playerId:p.id,cardId:c.id});s=op(s,{kind:'complete'});s=op(s,{kind:'unit',unitId:u.id,status:'eliminate'});
  }
  for(const m of monsters){s=op(s,{kind:'monster',defId:m.id,hexId:clear,kingdomId:null,lair:true});const placed=s.advanced.monsters.find(x=>x.defId===m.id);assert.equal(Number(placed.id.slice(8)),s.advanced.eventSerial);s=op(s,{kind:'remove-monster',monsterId:placed.id,recycle:false});}
  assert.equal(s.advanced.eliminatedHeroes.length,38);assert.equal(s.advanced.defeatedMonsters.length,36);assert.deepEqual(validateState(s),[]);assert.deepEqual(importGame(exportGame(s)),s);
});
