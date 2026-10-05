import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions,validateState,exportGame,importGame,moveOptions,shipOptions,botAction,combatForecast} from '../dist/js/engine.js';
import {cards,monsters,runtimeLimitations,stackIds,adjustedDice} from '../dist/js/advanced.js';
import {getScenarioOptions} from '../dist/js/scenarios.js';
import {fixture,active,give,own,heroFirst,placeHero,passWindows,battle} from './fixtures/advanced.mjs';
const fj='player-fjordland',orcs='player-orcs';
const choose=(s,match)=>{const action=legalActions(s).find(match);assert.ok(action,'Expected legal rule decision');return applyAction(s,action);};
const check=s=>assert.deepEqual(validateState(s),[]);

function fullMonsterCommand(kingdom='fjordland') {
  const cfg=fixture();
  cfg.hexes.push(...['G','H','I'].map((id,q)=>({id,q,r:2,terrain:'clear'})),{id:'S',q:-1,r:1,terrain:'sea'});
  cfg.hexes.find(h=>h.id==='D').coastal=true;
  const s=active(cfg);
  for(const hexId of ['G','H','I']) {
    const defId=s.advanced.monsterPools.land.shift();
    s.advanced.monsters.push({id:`monster-${++s.advanced.eventSerial}`,defId,hexId,kingdom,weakened:false,activated:true,lair:false});
  }
  check(s);return s;
}

for(const [cardId,targetId,pool]of [['spell-20','B','land'],['spell-29','S','sea']])
test(`${cardId} cannot exceed three Monster commands and resumes after a chosen Slink Away`,()=>{
  let s=fullMonsterCommand();give(s,fj,cardId);
  const old=s.advanced.monsters.map(m=>({id:m.id,defId:m.defId}));
  s=choose(s,a=>a.type==='play-card'&&a.cardId===cardId&&a.targetId===targetId&&!a.tomeId);
  s=passWindows(s);
  assert.equal(s.advanced.pending.kind,'command');
  assert.deepEqual(s.advanced.pending.choices,['fjordland']);
  assert.equal(s.advanced.monsters.filter(m=>m.kingdom==='fjordland').length,3);
  const incoming=s.advanced.monsters.find(m=>m.hexId===targetId);
  assert.equal(incoming.kingdom,null);assert.equal(incoming.activated,false);
  assert.equal(monsters.find(m=>m.id===incoming.defId).pool,pool);
  assert.equal(legalActions(s).some(a=>a.type==='command-monster'),false);
  assert.deepEqual(legalActions(s).map(a=>a.monsterId).sort(),old.map(m=>m.id).sort());
  check(s);assert.deepEqual(importGame(exportGame(s)),s);
  s=applyAction(importGame(exportGame(s)),{type:'slink-away',monsterId:old[1].id});
  assert.ok(s.advanced.monsterPools.land.includes(old[1].defId));
  assert.equal(s.advanced.monsters.some(m=>m.id===old[1].id),false);
  s=applyAction(s,{type:'command-monster',kingdomId:'fjordland'});
  assert.equal(s.advanced.monsters.find(m=>m.id===incoming.id).kingdom,'fjordland');
  assert.equal(s.advanced.monsters.filter(m=>m.kingdom==='fjordland').length,3);
  assert.equal(s.advanced.pending,null);assert.equal(s.advanced.battle,null);
  assert.equal(s.pendingCombat,null);check(s);
});

test('making room for a summoned Monster resumes the existing Battle Magic window',()=>{
  let s=fullMonsterCommand();give(s,fj,'spell-20');
  s=passWindows(applyAction(s,{type:'move',unitId:'unit-1',toHex:'B'}));
  s=applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'C'});
  const originalBattle=s.advanced.battle;
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='spell-20'&&a.targetId==='D'&&!a.tomeId);
  s=passWindows(s);assert.equal(s.advanced.pending.kind,'command');
  assert.equal(s.advanced.pending.resume.kind,'window');assert.equal(s.advanced.pending.resume.window,'battle');
  s=applyAction(s,{type:'slink-away',monsterId:'monster-1'});
  s=applyAction(s,{type:'command-monster',kingdomId:'fjordland'});
  assert.equal(s.advanced.battle.attacker,originalBattle.attacker);
  assert.equal(s.advanced.battle.targetHex,'C');
  assert.equal(s.pendingCombat.attackerId,'unit-1');
  assert.equal(s.advanced.pending.kind,'window');assert.equal(s.advanced.pending.window,'battle');
  assert.equal(s.advanced.pending.step,0);check(s);
});

test('a full opposing Monster commander still starts Lair combat after making room',()=>{
  let s=fullMonsterCommand('orcs');s.units.find(u=>u.id==='unit-1').hexId='E';
  s=applyAction(s,{type:'explore-lair',unitId:'unit-1',targetHex:'F'});
  assert.equal(s.advanced.pending.kind,'command');assert.equal(s.advanced.pending.attackerId,'unit-1');
  assert.equal(legalActions(s).some(a=>a.type==='command-monster'),false);
  s=applyAction(s,{type:'slink-away',monsterId:'monster-1'});
  s=applyAction(s,{type:'command-monster',kingdomId:'orcs'});
  assert.equal(s.pendingCombat?.attackerId??s.lastCombat?.attackerId,'unit-1');
  assert.equal(s.advanced.monsters.filter(m=>m.kingdom==='orcs').length,3);check(s);
});

test('summoning cannot spend a Spell when its Monster pool is empty',()=>{
  let s=active();give(s,fj,'spell-20');
  s.advanced.defeatedMonsters.push(...s.advanced.monsterPools.land.splice(0));
  assert.equal(legalActions(s).some(a=>a.type==='play-card'&&a.cardId==='spell-20'),false);check(s);
});

for(const lead of ['army','hero'])test(`${lead}-led Army stack eliminates a lone enemy Hero on entry`,()=>{
  let s=active();const ownHero=placeHero(s,'hero-fjordland-17','A','unit-1');
  const enemy=placeHero(s,'hero-orcs-13','B');
  const unitId=lead==='army'?'unit-1':ownHero.id;
  assert.ok(moveOptions(s,unitId).some(o=>o.hexId==='B'));
  s=passWindows(applyAction(s,{type:'move',unitId,toHex:'B'}));
  assert.equal(s.units.some(u=>u.id===enemy.id),false);
  assert.ok(s.advanced.eliminatedHeroes.includes('hero-orcs-13'));
  assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'B');
  assert.equal(s.units.find(u=>u.id===ownHero.id).hexId,'B');check(s);
});

test('a lone moving Hero passes an enemy lone Hero without eliminating it',()=>{
  let s=active();const ownHero=placeHero(s,'hero-fjordland-13','A');
  const enemy=placeHero(s,'hero-orcs-13','B');
  assert.equal(moveOptions(s,ownHero.id).some(o=>o.hexId==='B'),false);
  assert.ok(moveOptions(s,ownHero.id).find(o=>o.hexId==='E').path.includes('B'));
  s=passWindows(applyAction(s,{type:'move',unitId:ownHero.id,toHex:'E'}));
  assert.ok(s.units.some(u=>u.id===enemy.id));check(s);
});

test('Flying transit past an enemy Army stack preserves its Hero',()=>{
  const cfg=fixture();cfg.unitDefinitions[0].abilities=['flying'];
  cfg.hexes.push({id:'J',q:3,r:0,terrain:'clear'});
  let s=active(cfg);const ownHero=placeHero(s,'hero-fjordland-13','A','unit-1');
  const enemy=placeHero(s,'hero-orcs-13','C','unit-2');
  const move=moveOptions(s,ownHero.id).find(o=>o.hexId==='J');
  assert.ok(move);assert.ok(move.path.includes('C'));
  s=passWindows(applyAction(s,{type:'move',unitId:ownHero.id,toHex:'J'}));
  assert.ok(s.units.some(u=>u.id===enemy.id));
  assert.equal(s.advanced.stacks[enemy.id],'unit-2');
  assert.equal(s.units.find(u=>u.id===ownHero.id).hexId,'J');check(s);
});

for(const lead of ['army','hero'])test(`${lead}-led Fjordland stack cannot repeat Ship Movement after a saved Cantrip window`,()=>{
  const cfg=fixture();
  cfg.hexes.find(h=>h.id==='A').coastal=true;
  cfg.hexes.find(h=>h.id==='A').edges={B:{coastal:true}};
  cfg.hexes.find(h=>h.id==='B').coastal=true;
  cfg.hexes.find(h=>h.id==='B').edges={A:{coastal:true}};
  let s=active(cfg);const hero=placeHero(s,'hero-fjordland-17','A','unit-1');
  placeHero(s,'hero-orcs-13','C','unit-2');
  s.units.find(u=>u.id==='unit-2').weakened=true;give(s,orcs,'spell-17');
  const unitId=lead==='army'?'unit-1':hero.id;
  for(const id of ['unit-1',hero.id])assert.ok(shipOptions(s,id).some(o=>o.hexId==='B'));
  s=passWindows(applyAction(s,{type:'ship',unitId,toHex:'B'}));
  assert.equal(s.activeUnitId,unitId);assert.equal(s.shipUsed,true);
  assert.ok(s.units.filter(u=>u.id==='unit-1'||u.id===hero.id).every(u=>u.hexId==='B'&&!u.activated));
  assert.equal(s.remainingMP,3,'free Ship Movement leaves the Army movement budget available');
  s=applyAction(s,{type:'request-cantrip',playerId:orcs});
  assert.equal(s.advanced.pending.kind,'window');assert.equal(s.advanced.pending.window,'interject');
  assert.ok(legalActions(s).some(a=>a.type==='play-card'&&a.cardId==='spell-17'));
  const saved=importGame(exportGame(s));assert.deepEqual(saved,s);
  const pass=legalActions(saved).find(a=>a.type==='magic-pass');
  assert.deepEqual(applyAction(saved,pass),applyAction(s,pass));
  s=applyAction(saved,pass);assert.equal(s.advanced.pending,null);
  for(const id of ['unit-1',hero.id])assert.deepEqual(shipOptions(s,id),[]);
  assert.equal(legalActions(s).some(a=>a.type==='ship'),false);
  assert.ok(legalActions(s).some(a=>a.type==='pass'&&a.unitId===unitId));check(s);
});

test('a Hero gained by Magic inherits the active Army readiness after its movement is spent',()=>{
  let s=active();s=passWindows(applyAction(s,{type:'move',unitId:'unit-1',toHex:'E'}));
  assert.equal(s.remainingMP,0);assert.equal(s.units.find(u=>u.id==='unit-1').activated,false);
  give(s,fj,'blessing-fjordland-03');
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='blessing-fjordland-03');s=passWindows(s);
  const hero=s.units.find(u=>u.kingdom==='fjordland'&&u.id!=='unit-1');
  assert.ok(hero);assert.equal(hero.activated,false);assert.equal(s.advanced.stacks[hero.id],'unit-1');
  assert.equal(s.remainingMP,0);assert.deepEqual(moveOptions(s,'unit-1'),[]);
  const pass=legalActions(s).find(a=>a.type==='pass'&&a.unitId==='unit-1');assert.ok(pass);
  s=applyAction(importGame(exportGame(s)),pass);
  assert.equal(s.activeUnitId,null);assert.ok(s.units.filter(u=>u.id==='unit-1'||u.id===hero.id).every(u=>u.activated));check(s);
});

test('a Hero gained by Magic joins a finished wilderness Army finished',()=>{
  let s=active();s.units.find(u=>u.id==='unit-1').hexId='D';s.units.find(u=>u.id==='unit-1').activated=true;
  give(s,fj,'blessing-fjordland-03');
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='blessing-fjordland-03');s=passWindows(s);
  const hero=s.units.find(u=>u.kingdom==='fjordland'&&u.id!=='unit-1');
  assert.ok(hero);assert.equal(hero.activated,true);assert.equal(s.advanced.stacks[hero.id],'unit-1');check(s);
});

test('a shared player gains a Hero with its own kingdom Army rather than its first allied Army',()=>{
  const cfg=fixture();cfg.scenario.kingdoms.push({id:'oathborn',name:'Oathborn',side:'resistance',gold:20,income:1});
  cfg.scenario.turnOrder.splice(1,0,'oathborn');
  cfg.unitDefinitions.push({...structuredClone(cfg.unitDefinitions[0]),id:'army-c',name:'Iron Legion',kingdom:'oathborn'});
  cfg.hexes.push({id:'J',q:3,r:1,terrain:'clear',settlement:{name:'Oathborn town',loyalty:'oathborn',city:false,fortified:0,port:false}});
  cfg.scenario.initialUnits.push({defId:'army-c',hexId:'J'});
  cfg.players=[{id:'allies',name:'Allied player',kingdoms:['fjordland','oathborn']},{id:orcs,name:'Orcs',kingdoms:['orcs']}];
  let s=active(cfg);give(s,'allies','blessing-oathborn-07');
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='blessing-oathborn-07');s=passWindows(s);
  const hero=s.units.find(u=>u.kingdom==='oathborn'&&u.id!=='unit-3');
  assert.ok(hero);assert.equal(hero.hexId,'J');assert.equal(s.advanced.stacks[hero.id],'unit-3');
  assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'A');
  assert.deepEqual(importGame(exportGame(s)),s);check(s);
});

test('an imported active stack with a finished joined Hero can finish while another Army must leave a Sea entry',()=>{
  const cfg=fixture();cfg.hexes.find(h=>h.id==='A').coastal=true;cfg.hexes.find(h=>h.id==='A').edges={S:{sea:true}};
  cfg.hexes.push({id:'S',q:0,r:-1,terrain:'sea',entry:'fjordland',edges:{A:{sea:true}}});
  cfg.scenario.initialUnits.push({defId:'army-a',hexId:'D'});
  let s=active(cfg);s.units.find(u=>u.id==='unit-3').hexId='S';
  s=passWindows(applyAction(s,{type:'move',unitId:'unit-1',toHex:'E'}));
  const hero=placeHero(s,'hero-fjordland-17','E','unit-1');hero.activated=true;
  assert.deepEqual(moveOptions(s,'unit-1'),[]);assert.equal(legalActions(s).some(a=>a.type==='end-turn'),false);
  const pass=legalActions(s).find(a=>a.type==='pass'&&a.unitId==='unit-1');assert.ok(pass);
  s=applyAction(importGame(exportGame(s)),pass);
  assert.equal(s.activeUnitId,null);assert.equal(s.units.find(u=>u.id==='unit-1').activated,true);
  assert.ok(legalActions(s).some(a=>a.type==='ship'&&a.unitId==='unit-3'&&a.toHex==='A'));check(s);
});

test('reference-only effects never enter playable decks; every Hero front is still available',()=>{
  const s=active();
  assert.ok(Object.values(s.advanced.decks).flat().every(id=>!runtimeLimitations[id]));
  for(const kingdom of s.kingdoms)assert.equal(s.advanced.heroPools[kingdom.id].length,cards.filter(c=>c.kind==='hero'&&c.kingdom===kingdom.id).length);
});

test('Cure Wounds may recover an Army between two individually allocated hits',()=>{
  let s=active();placeHero(s,'hero-fjordland-17','A','unit-1');give(s,fj,'spell-17');battle(s);
  s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});
  assert.equal(s.units.find(u=>u.id==='unit-1').weakened,true);
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='spell-17'&&a.targetId==='unit-1');
  s=passWindows(s);
  assert.equal(s.units.find(u=>u.id==='unit-1').weakened,false);
  assert.equal(s.advanced.pending.kind,'hit');
  s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});
  assert.equal(s.units.find(u=>u.id==='unit-1').weakened,true);check(s);
});

test('remaining hits stay with the surviving Hero after its Army is eliminated',()=>{
  let s=active();const hero=placeHero(s,'hero-fjordland-17','A','unit-1');battle(s,{hits:3});
  s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});s=passWindows(s);
  s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});s=passWindows(s);
  assert.equal(s.units.some(u=>u.id==='unit-1'),false);
  assert.ok(legalActions(s).some(a=>a.type==='allocate-hit'&&a.unitId===hero.id));
  s=applyAction(s,{type:'allocate-hit',unitId:hero.id});
  assert.equal(s.units.some(u=>u.id===hero.id),false);check(s);
});

test('a canceled card still pays its chosen discard cost',()=>{
  let s=active();placeHero(s,'hero-fjordland-17','A','unit-1');placeHero(s,'hero-orcs-13','C','unit-2');
  give(s,fj,'blessing-fjordland-08');give(s,fj,'spell-51');give(s,fj,'treasure-31');give(s,orcs,'spell-15');
  s=passWindows(applyAction(s,{type:'move',unitId:'unit-1',toHex:'B'}));
  s=applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'C'});
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='blessing-fjordland-08'&&a.costCardId==='spell-51');
  assert.ok(s.advanced.discards.spells.includes('spell-51'));
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='spell-15');s=passWindows(s);
  assert.equal(s.advanced.effects.some(e=>e.cardId==='blessing-fjordland-08'),false);
  assert.ok(s.advanced.discards.blessings.includes('blessing-fjordland-08'));check(s);
});

test('two-Spell costs select and discard two different cards',()=>{
  let s=active();give(s,fj,'blessing-fjordland-04');give(s,fj,'spell-51');give(s,fj,'spell-52');
  const action=legalActions(s).find(a=>a.type==='play-card'&&a.cardId==='blessing-fjordland-04'&&a.costCardId?.split(',').includes('spell-51')&&a.costCardId?.split(',').includes('spell-52'));
  assert.ok(action);s=applyAction(s,action);s=passWindows(s);
  assert.ok(s.advanced.discards.spells.includes('spell-51'));assert.ok(s.advanced.discards.spells.includes('spell-52'));check(s);
});

test('sold Treasures are withheld until the deck empties or Winter ends',()=>{
  let s=active();give(s,fj,'treasure-17');
  s=applyAction(s,{type:'sell-treasure',playerId:fj,cardId:'treasure-17',kingdomId:'fjordland'});
  assert.equal(s.advanced.decks.treasures.includes('treasure-17'),false);
  assert.ok(s.advanced.eliminatedTreasures.includes('treasure-17'));check(s);
});

function winterFixture(withSatchel=false){
  let s=active();s.season=2;s.currentKingdom='orcs';s.turnIndex=1;
  for(const id of ['treasure-17','treasure-18','treasure-19',...(withSatchel?['treasure-02','treasure-23']:[])])own(s,fj,id);
  const def=monsters.find(m=>m.pool==='land');s.advanced.monsterPools.land.splice(s.advanced.monsterPools.land.indexOf(def.id),1);
  s.advanced.monsters.push({id:'monster-1',defId:def.id,hexId:'F',kingdom:'orcs',weakened:false,activated:true,lair:true});s.advanced.eventSerial=1;
  s=applyAction(s,{type:'end-turn'});
  s=applyAction(s,{type:'finish-study',playerId:fj});s=applyAction(s,{type:'finish-study',playerId:orcs});return s;
}
test('Winter preserves commanded Monsters, sells excess Treasures, then shuffles sales',()=>{
  let s=winterFixture();assert.equal(s.advanced.pending.kind,'winter');assert.equal(s.advanced.monsters.length,1);
  assert.equal(legalActions(s).some(a=>a.type==='finish-winter'),false);
  s=choose(s,a=>a.type==='sell-treasure');const sold=s.advanced.eliminatedTreasures[0];
  assert.equal(s.advanced.decks.treasures.includes(sold),false);
  s=applyAction(s,{type:'finish-winter',playerId:fj});s=applyAction(s,{type:'finish-winter',playerId:orcs});
  assert.equal(s.year,2);assert.equal(s.season,0);assert.equal(s.advanced.monsters.length,1);
  assert.ok(s.advanced.decks.treasures.includes(sold));check(s);
});
test('owned Endless Satchel permits four Treasures, including itself, in Winter',()=>{
  let s=winterFixture(true);assert.equal(s.advanced.owned[fj].length,5);assert.equal(legalActions(s).some(a=>a.type==='finish-winter'),false);
  s=choose(s,a=>a.type==='sell-treasure'&&a.cardId!=='treasure-02');
  assert.ok(legalActions(s).some(a=>a.type==='finish-winter'));check(s);
});

test('Lair defeat is one hit and awards gold plus a Treasure; Satchel prompts immediately',()=>{
  let s=active();const def=monsters.find(m=>m.pool==='land'&&m.rewardGold>1);
  s.advanced.monsterPools.land.splice(s.advanced.monsterPools.land.indexOf(def.id),1);
  s.advanced.monsters.push({id:'monster-1',defId:def.id,hexId:'F',kingdom:'orcs',weakened:false,activated:false,lair:true});s.advanced.eventSerial=1;
  const pile=s.advanced.decks.treasures;pile.splice(pile.indexOf('treasure-02'),1);pile.unshift('treasure-02');
  battle(s,{attacker:'unit-1',defender:'monster-1',targetHex:'F',hits:1,kind:'battle',reward:'combat'});
  const gold=s.kingdoms[0].gold;s=applyAction(s,{type:'accept-hit'});
  assert.equal(s.kingdoms[0].gold,gold+def.rewardGold);assert.equal(s.advanced.monsters.length,0);
  assert.ok(s.advanced.explored.includes('F'));assert.ok(s.advanced.defeatedMonsters.includes(def.id));
  assert.equal(s.advanced.pending.kind,'satchel');s=applyAction(s,{type:'store-satchel',playerId:fj});
  assert.ok(s.advanced.owned[fj].includes('treasure-02'));check(s);
});

test('a Feral Army without a Hero receives no Monster reward',()=>{
  const cfg=fixture();cfg.unitDefinitions[0].characteristics=['feral'];let s=active(cfg);
  const def=monsters.find(m=>m.pool==='land'&&m.rewardGold>1);s.advanced.monsterPools.land.splice(s.advanced.monsterPools.land.indexOf(def.id),1);
  s.advanced.monsters.push({id:'monster-1',defId:def.id,hexId:'F',kingdom:'orcs',weakened:false,activated:false,lair:true});s.advanced.eventSerial=1;
  battle(s,{attacker:'unit-1',defender:'monster-1',targetHex:'F',hits:1,kind:'battle',reward:'combat'});
  const gold=s.kingdoms[0].gold;s=applyAction(s,{type:'accept-hit'});assert.equal(s.kingdoms[0].gold,gold);check(s);
});

test('a Hero is unavailable to recruit after dying until the end of any Kingdom turn',()=>{
  let s=active();heroFirst(s,'hero-fjordland-17');s=applyAction(s,{type:'recruit-hero',hexId:'A'});
  const spells=s.advanced.hands[fj].filter(id=>id.startsWith('spell-'));for(const id of spells){s.advanced.hands[fj].splice(s.advanced.hands[fj].indexOf(id),1);s.advanced.discards.spells.push(id);}
  give(s,fj,'spell-23');s=choose(s,a=>a.type==='play-card'&&a.cardId==='spell-23');s=passWindows(s);
  assert.ok(s.advanced.eliminatedHeroes.includes('hero-fjordland-17'));assert.equal(s.advanced.heroPools.fjordland.includes('hero-fjordland-17'),false);
  s=applyAction(s,{type:'end-turn'});assert.ok(s.advanced.heroPools.fjordland.includes('hero-fjordland-17'));check(s);
});

test('a fast Hero picking up a fresh Army keeps independent movement budgets',()=>{
  const cfg=fixture();cfg.hexes=Array.from({length:10},(_,i)=>({id:'H'+i,q:i,r:0,terrain:'clear'}));cfg.scenario.initialUnits=[{defId:'army-a',hexId:'H5'},{defId:'army-b',hexId:'H9'}];cfg.scenario.objective.hexIds=['H0'];
  let s=active(cfg);const hero=placeHero(s,'hero-fjordland-13','H0');
  s=passWindows(applyAction(s,{type:'move',unitId:hero.id,toHex:'H5'}));
  assert.equal(s.advanced.movement[hero.id],3);assert.equal(s.advanced.movement['unit-1'],3);assert.equal(stackIds(s,hero.id).length,2);
  s=passWindows(applyAction(s,{type:'move',unitId:hero.id,toHex:'H8'}));
  assert.equal(s.advanced.movement[hero.id],0);assert.equal(s.advanced.movement['unit-1'],0);
  assert.equal(moveOptions(s,hero.id).length,0);check(s);
});

test('dropping off the Army finishes it while the Hero keeps its remaining movement',()=>{
  let s=active();const hero=placeHero(s,'hero-fjordland-13','A','unit-1');
  s=passWindows(applyAction(s,{type:'move',unitId:'unit-1',toHex:'B'}));
  s=applyAction(s,{type:'drop-army',unitId:hero.id});assert.equal(s.units.find(u=>u.id==='unit-1').activated,true);
  assert.equal(s.units.find(u=>u.id===hero.id).activated,false);assert.equal(s.activeUnitId,hero.id);assert.equal(s.remainingMP,7);check(s);
});

test('malformed hidden zones, recursive decisions and duplicate counter inventories are rejected',()=>{
  for(const corrupt of [s=>s.advanced.hands=null,s=>s.advanced.pending={kind:'window',players:['unknown'],index:5,step:0,window:'battle'},s=>s.advanced.effects=[null],s=>s.advanced.monsterPools.land.push(s.advanced.monsterPools.land[0])]){
    const s=active();corrupt(s);assert.throws(()=>importGame(exportGame(s)),/Invalid|Unknown/);
  }
});

test('canceling an accompanied Spell also cancels its Tome effect',()=>{
  let s=active();const caster=placeHero(s,'hero-fjordland-17','A','unit-1');placeHero(s,'hero-orcs-13','C','unit-2');
  for(const id of ['spell-28','treasure-31'])give(s,fj,id);give(s,orcs,'spell-15');
  s=passWindows(applyAction(s,{type:'move',unitId:'unit-1',toHex:'B'}));s=applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'C'});
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='spell-28'&&a.tomeId==='treasure-31'&&a.casterId===caster.id&&a.targetId==='unit-1');
  assert.ok(s.advanced.owned[fj].includes('treasure-31'));
  s=choose(s,a=>a.type==='play-card'&&a.cardId==='spell-15');s=passWindows(s);
  assert.equal(s.advanced.effects.some(e=>['spell-28','treasure-31'].includes(e.cardId)),false);check(s);
});

test('movement bonuses update the active stack allowance immediately',()=>{
  const cfg=getScenarioOptions()[0].config;let s=applyAction(createGame({...cfg,profile:'advanced',seed:29}),{type:'collect-income'});
  s=applyAction(s,{type:'activate',unitId:'unit-1'});const before=s.remainingMP;
  give(s,'player-oathborn',cards.find(c=>c.name==='Mountain Folk').id);
  s=choose(s,a=>a.type==='play-card'&&a.cardId===cards.find(c=>c.name==='Mountain Folk').id&&a.targetId==='unit-1');s=passWindows(s);
  assert.equal(s.remainingMP,before+2);assert.equal(s.advanced.movement['unit-1'],before+2);check(s);
});

test('Black Diamond records every Heavy critical confirmation in its chain',()=>{
  let s=active();battle(s,{hits:1});const b=s.advanced.battle;
  b.attackerRolls=[{sides:8,raw:8,modified:8,success:true,critical:true}];b.defenderHits=0;
  s.advanced.effects.push({cardId:'treasure-20',target:'unit-2',expires:s.turnSerial,activation:'unit-1'});
  s.advanced.pending={kind:'window',window:'critical',players:[fj],index:0,step:0,resume:null};s.rng=7;
  s=applyAction(s,{type:'magic-pass',playerId:fj});
  const die=s.advanced.battle?.attackerRolls[0]??s.lastCombat.attackerRolls[0];
  assert.deepEqual(die.confirmations,[{sides:8,raw:7},{sides:8,raw:7},{sides:8,raw:3}]);assert.equal(die.bonus,2);check(s);
});

test('unit dice modifiers resolve before stack dice modifiers',()=>{
  const s=active(),hero=placeHero(s,'hero-fjordland-17','A','unit-1');
  s.advanced.effects.push({cardId:'treasure-31',target:hero.id,expires:s.turnSerial,activation:'unit-1',light:1},{cardId:'spell-37',target:'unit-1',expires:s.turnSerial,activation:'unit-1',multiplyLight:2});
  assert.deepEqual(adjustedDice(s,'unit-1',{light:2,heavy:0}),{light:5,heavy:0});
  assert.deepEqual(adjustedDice(s,hero.id,{light:0,heavy:0},false),{light:1,heavy:0});
  s.advanced.effects.push({cardId:'blessing-empire-10',target:hero.id,expires:s.turnSerial,activation:'unit-1',multiplyLight:2});
  assert.deepEqual(adjustedDice(s,'unit-1',{light:2,heavy:0}),{light:10,heavy:0});
});

test('a garrison converts its own Light die without adding a phantom die',()=>{
  const s=active();s.units=s.units.filter(u=>u.id!=='unit-2');
  s.advanced.effects.push({cardId:'spell-25',target:'C',expires:s.turnSerial,activation:'unit-1',convertLightToHeavy:1});
  const forecast=combatForecast(s,'unit-1','C');assert.equal(forecast.defenderLight,0);assert.equal(forecast.defenderHeavy,1);
});

test('a ready Army must separate from an exhausted Hero before activating alone',()=>{
  let s=active();const hero=placeHero(s,'hero-fjordland-17','A','unit-1');hero.activated=true;
  assert.equal(legalActions(s).some(a=>['move','activate','attack'].includes(a.type)&&a.unitId==='unit-1'),false);
  s=applyAction(s,{type:'drop-hero',unitId:hero.id});s=applyAction(s,{type:'activate',unitId:'unit-1'});
  assert.equal(s.activeUnitId,'unit-1');assert.deepEqual(stackIds(s,'unit-1'),['unit-1']);check(s);
});

test('a Hero-led activation keeps its Army attack valid through the advance decision',()=>{
  const cfg=fixture();cfg.unitDefinitions[0].heavy=5;cfg.unitDefinitions[1].light=0;delete cfg.hexes[2].settlement;let s=active(cfg);
  const hero=placeHero(s,'hero-fjordland-17','A','unit-1');s=passWindows(applyAction(s,{type:'move',unitId:hero.id,toHex:'B'}));
  assert.equal(s.activeUnitId,hero.id);s=passWindows(applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'C'}));
  for(let i=0;i<20&&s.advanced.pending;i++){check(s);s=applyAction(s,botAction(s));}check(s);
  assert.equal(s.pendingCombat?.stage,'advance');s=choose(s,a=>a.type==='advance'&&a.accept);check(s);
  assert.equal(s.units.find(u=>u.id===hero.id).hexId,'C');assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'C');
});

test('Hand of the Emperor stops suppressions until the next Imperial turn begins',()=>{
  const cfg=fixture();cfg.scenario.kingdoms[1]={id:'empire',name:'Empire',side:'invader',gold:20,income:3,revolt:2};cfg.scenario.turnOrder[1]='empire';cfg.unitDefinitions[1].kingdom='empire';cfg.hexes[2].settlement.loyalty='empire';
  let s=active(cfg);s.advanced.effects.push({cardId:'blessing-empire-03',target:'player-empire',expires:10000,activation:null,extra:{noSuppression:true}});
  s=applyAction(s,{type:'end-turn'});s=applyAction(s,{type:'finish-study',playerId:fj});s=applyAction(s,{type:'finish-study',playerId:'player-empire'});
  assert.equal(s.currentKingdom,'empire');assert.equal(s.phase,'income-actions');assert.equal(s.advanced.effects.some(e=>e.extra?.noSuppression),false);s=applyAction(s,{type:'collect-income'});assert.ok(legalActions(s).some(a=>a.type==='suppress'));check(s);
});

test('Khazud does not keep the Oathborn alive when its original Cities are lost',()=>{
  const cfg=getScenarioOptions()[0].config;cfg.scenario.kingdoms.find(k=>k.id==='oathborn').cityCollapseThreshold=1;
  let s=applyAction(createGame({...cfg,profile:'advanced',seed:29}),{type:'collect-income'});
  const originals=s.hexes.filter(h=>h.settlement?.city&&h.settlement.loyalty==='oathborn');assert.ok(originals.length);
  for(const h of originals)s.razed.push(h.id);
  const khazud=s.hexes.find(h=>h.terrain==='mountain'&&!h.settlement&&!h.mine&&!s.units.some(u=>u.hexId===h.id));
  khazud.settlement={name:'Khazud',loyalty:'oathborn',city:true,fortified:2,port:false};s.advanced.khazud=khazud.id;
  s=applyAction(s,{type:'end-turn'});assert.equal(s.kingdoms.find(k=>k.id==='oathborn').collapsed,true);check(s);
});

test('a defeated Feral attacker cannot receive a reward after disappearing',()=>{
  const cfg=fixture();cfg.unitDefinitions[0].characteristics=['feral'];let s=active(cfg);
  const def=monsters.find(m=>m.pool==='land');s.advanced.monsterPools.land.splice(s.advanced.monsterPools.land.indexOf(def.id),1);
  s.advanced.monsters.push({id:'monster-1',defId:def.id,hexId:'F',kingdom:'orcs',weakened:false,activated:false,lair:true});s.advanced.eventSerial=1;
  battle(s,{attacker:'unit-1',defender:'monster-1',targetHex:'F',hits:1,kind:'battle',reward:'combat'});s.advanced.battle.rewardBlocked=true;s.units=s.units.filter(u=>u.id!=='unit-1');
  const gold=s.kingdoms[0].gold;s=applyAction(s,{type:'accept-hit'});assert.equal(s.kingdoms[0].gold,gold);check(s);
});

for(const seed of [5,49,20261005])test(`six-kingdom Advanced playthrough ${seed} completes with portable pending decisions`,()=>{
  const cfg=getScenarioOptions()[1].config;let s=createGame({...cfg,profile:'advanced',seed,controllers:Object.fromEntries(cfg.scenario.kingdoms.map(k=>[k.id,'ai']))});let windows=0,winter=false;
  for(let step=0;step<6000&&s.phase!=='game-over';step++){
    if(s.advanced.pending?.kind==='window')windows++;if(s.advanced.pending?.kind==='winter')winter=true;
    const action=botAction(s);assert.ok(action,`No action at step ${step}`);const next=applyAction(s,action);
    assert.deepEqual(validateState(next),[],`Step ${step}: ${JSON.stringify(action)}`);
    if(step%67===0||s.advanced.pending&&step%13===0)assert.deepEqual(applyAction(importGame(exportGame(s)),action),next);
    s=next;
  }
  assert.equal(s.phase,'game-over');assert.ok(windows>0);assert.ok(winter);
});
