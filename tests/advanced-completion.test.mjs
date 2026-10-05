import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions,validateState,exportGame,importGame,shipOptions} from '../dist/js/engine.js';
import {cards,monsters,stackIds,effectiveDefinition,advancedActor} from '../dist/js/advanced.js';
import {fixture,active,give,placeHero,passWindows,battle} from './fixtures/advanced.mjs';
import {chooseDifficultyAction} from '../dist/js/ai.js';
import {getScenarioOptions} from '../dist/js/scenarios.js';
const fj='player-fjordland',orc='player-orcs';
function cast(s,id,filter=()=>true){const action=legalActions(s).find(a=>a.type==='play-card'&&a.cardId===id&&filter(a));assert.ok(action,`No legal ${id}`);return applyAction(s,action);}
function choice(s,value){assert.equal(s.advanced.pending?.kind,'choice');return applyAction(s,{type:'magic-choice',value});}
function settle(s){for(let guard=0;guard<150&&s.advanced.pending;guard++){const legal=legalActions(s),action=legal.find(a=>a.type==='magic-pass')??legal.find(a=>a.type==='allocate-hit')??legal.find(a=>a.type==='accept-hit');if(!action)break;s=applyAction(s,action);}return s;}
function six(first){const cfg=structuredClone(getScenarioOptions()[1].config);cfg.scenario.turnOrder=[first,...cfg.scenario.turnOrder.filter(k=>k!==first)];return createGame({...cfg,profile:'advanced',seed:29});}
const check=s=>{assert.deepEqual(validateState(s),[]);assert.deepEqual(importGame(exportGame(s)),s);};
test('Conscription asks for each free Akritoi placement and respects occupied hexes',()=>{
  let s=applyAction(six('empire'),{type:'collect-income'});give(s,'player-empire','blessing-empire-05');s=passWindows(cast(s,'blessing-empire-05',a=>a.choice==='0'));
  for(let i=0;i<3;i++){assert.equal(s.advanced.pending.flow,'build');const at=s.advanced.pending.choices[0].value;s=choice(s,at);assert.ok(s.units.some(u=>u.defId==='empire-akritoi'&&u.hexId===at));check(s);}
  assert.notEqual(s.advanced.pending?.flow,'build');
});
test('Runestones lets the player select every discarded Spell, including an already overfull hand',()=>{
  let s=applyAction(six('oathborn'),{type:'collect-income'}),p='player-oathborn';for(const id of ['spell-01','spell-02','spell-03','spell-04','spell-05'])give(s,p,id);give(s,p,'blessing-oathborn-10');s=passWindows(cast(s,'blessing-oathborn-10'));
  while(s.advanced.pending?.flow==='discard'){const id=s.advanced.pending.choices.at(-1).value;s=choice(s,id);assert.ok(s.advanced.discards.spells.includes(id));check(s);}
  assert.equal(s.advanced.hands[p].filter(id=>id.startsWith('spell')).length,3);
});
test('Powerful and Eternal offers a single immediate discipline and resumes the same turn',()=>{
  let s=applyAction(six('night'),{type:'collect-income'});give(s,'player-night','blessing-night-05');const turn=s.turnSerial,kingdom=s.currentKingdom;
  s=passWindows(cast(s,'blessing-night-05'));assert.equal(s.advanced.pending.kind,'study');assert.equal(s.advanced.pending.immediate,true);
  const action=legalActions(s).find(a=>a.type==='study'&&a.discipline==='spells'&&!a.discardId);s=applyAction(s,action);assert.equal(legalActions(s).some(a=>a.type==='study'),false);
  s=applyAction(s,{type:'finish-study',playerId:'player-night'});assert.equal(s.turnSerial,turn);assert.equal(s.currentKingdom,kingdom);assert.equal(s.advanced.pending,null);check(s);
});
test('Fear is chosen by the target owner and may move the Army while leaving its Hero',()=>{
  let s=active();placeHero(s,'hero-fjordland-17','A','unit-1');const hero=placeHero(s,'hero-orcs-11','C','unit-2');give(s,fj,'spell-27');
  s=passWindows(cast(s,'spell-27',a=>a.targetId==='unit-2'));assert.equal(advancedActor(s),'orcs');assert.equal(s.advanced.pending.flow,'forced-move');assert.ok(s.advanced.pending.choices.some(c=>c.value==='army:E'));
  s=choice(s,'army:E');assert.equal(s.units.find(u=>u.id===hero.id).hexId,'C');assert.equal(s.units.find(u=>u.id==='unit-2').hexId,'E');assert.equal(s.advanced.stacks[hero.id],undefined);check(s);
});
test('Book of the Dead targets a player, then that player chooses the actual Spell or Blessing',()=>{
  let s=active();placeHero(s,'hero-fjordland-17','A','unit-1');s.units[0].weakened=true;give(s,fj,'spell-17');give(s,fj,'treasure-21');
  s=passWindows(cast(s,'spell-17',a=>a.targetId==='unit-1'&&a.tomeId==='treasure-21'));assert.equal(s.advanced.pending.flow,'book-target');s=choice(s,orc);
  assert.equal(advancedActor(s),'orcs');assert.equal(s.advanced.pending.flow,'book-discard');const blessing=s.advanced.pending.choices.find(c=>cards.find(x=>x.id===c.value).kind==='blessing').value;
  s=choice(s,blessing);assert.ok(s.advanced.discards.blessings.includes(blessing));assert.ok(!s.advanced.hands[orc].includes(blessing));check(s);
});
test('Encyclopedia can copy an opponent’s commanded Monster and adds its light die',()=>{
  let s=active();const hero=placeHero(s,'hero-fjordland-17','A','unit-1');s.units[0].weakened=true;s=applyAction(s,{type:'activate',unitId:'unit-1'});const d=monsters.find(m=>m.pool==='land'&&m.abilities.includes('flying'));
  s.advanced.monsterPools.land.splice(s.advanced.monsterPools.land.indexOf(d.id),1);s.advanced.monsters.push({id:`monster-${s.serial++}`,defId:d.id,hexId:'F',kingdom:'orcs',weakened:false,activated:false,lair:true});
  give(s,fj,'spell-17');give(s,fj,'treasure-22');s=passWindows(cast(s,'spell-17',a=>a.targetId==='unit-1'&&a.tomeId==='treasure-22'));
  assert.equal(s.advanced.pending.flow,'copy-monster');s=choice(s,s.advanced.pending.choices[0].value);
  assert.ok(s.advanced.effects.some(e=>e.cardId==='treasure-22'&&e.target===hero.id&&e.abilities?.includes('flying')));assert.equal(effectiveDefinition(s,s.units.find(u=>u.id===hero.id),s.unitDefinitions.find(d=>d.id===hero.defId)).abilities.includes('flying'),false,'A flying Hero cannot make its non-flying Army fly');assert.ok(s.advanced.effects.some(e=>e.cardId==='treasure-22'&&e.target===hero.id&&e.light===1));check(s);
});
test('Earthquake rolls independently against neighboring friendly and enemy occupied hexes, including ordinary forts',()=>{
  const cfg=fixture();cfg.hexes.push({id:'G',q:3,r:0,terrain:'clear'},{id:'H',q:3,r:-1,terrain:'clear'});cfg.hexes[2].settlement.fortified=1;cfg.scenario.initialUnits.push({defId:'army-a',hexId:'H'});
  let s=applyAction(createGame(cfg),{type:'collect-income'});placeHero(s,'hero-fjordland-17','A','unit-1');give(s,fj,'spell-04');s=cast(s,'spell-04',a=>a.targetId==='G');
  const struck=new Set();for(let guard=0;guard<100&&s.advanced.pending;guard++){if(s.advanced.battle?.sourceCard==='spell-04')struck.add(s.advanced.battle.targetHex);const action=legalActions(s).find(a=>a.type==='magic-pass')??legalActions(s).find(a=>a.type==='allocate-hit')??legalActions(s).find(a=>a.type==='accept-hit');if(!action)break;s=applyAction(s,action);}
  assert.ok(struck.has('C'));assert.ok(s.log.some(line=>line==='Strike dice rolled at H.'));assert.ok(s.log.some(line=>line==='Strike dice rolled at orcs town.'));assert.equal(s.log.filter(line=>line.includes('dice rolled at')).length,2);check(s);
});
test('Crushing Vines waits until the first complete Strike before spending a chosen Spell for a repeat',()=>{
  const cfg=fixture();cfg.hexes[1].terrain='forest';let s=applyAction(createGame(cfg),{type:'collect-income'});placeHero(s,'hero-fjordland-17','A','unit-1');give(s,fj,'spell-05');give(s,fj,'spell-17');s.rng=1;
  s=settle(cast(s,'spell-05',a=>a.targetId==='unit-2'));assert.equal(s.advanced.pending?.flow,'repeat-strike');assert.ok(s.advanced.hands[fj].includes('spell-17'));check(s);
  s=choice(s,'spell-17');assert.ok(s.advanced.discards.spells.includes('spell-17'));s=settle(s);assert.notEqual(s.advanced.pending?.flow,'repeat-strike');check(s);
});
test('Necromancy responds to an actual dead-unit snapshot and selects a different friendly Army for recovery',()=>{
  const cfg=fixture();cfg.scenario.initialUnits.push({defId:'army-a',hexId:'D',weakened:true});let s=applyAction(createGame(cfg),{type:'collect-income'});placeHero(s,'hero-fjordland-17','A','unit-1');s.units.find(u=>u.id==='unit-1').weakened=true;give(s,fj,'spell-10');battle(s,{hits:1});
  s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});assert.equal(s.advanced.pending.window,'elimination');assert.ok(legalActions(s).some(a=>a.type==='play-card'&&a.cardId==='spell-10'));
  s=passWindows(cast(s,'spell-10'));assert.equal(s.advanced.pending.flow,'recover');s=choice(s,'unit-3');assert.equal(s.units.find(u=>u.id==='unit-3').weakened,false);check(s);
});
test('Moryana’s Fury allocates its one sea-crossing hit to the stack owner without damaging an unchosen member',()=>{
  let s=active();const hero=placeHero(s,'hero-fjordland-17','A','unit-1');placeHero(s,'hero-orcs-11','C','unit-2');give(s,orc,'spell-47');
  s.advanced.pending={kind:'window',window:'movement',players:[orc],index:0,step:0,event:{unitId:'unit-1',ship:true,sea:true,path:[],finish:false},resume:null};
  s=passWindows(cast(s,'spell-47',a=>a.targetId==='unit-1'));assert.equal(s.advanced.pending.kind,'hit');assert.deepEqual(new Set(s.advanced.pending.members),new Set(['unit-1',hero.id]));
  s=applyAction(s,{type:'allocate-hit',unitId:hero.id});s=settle(s);assert.equal(s.units.find(u=>u.id==='unit-1').weakened,false);assert.ok(!s.units.some(u=>u.id===hero.id));check(s);
});
test('Martyrdom preserves its caster kingdom and asks for two separately selected controlled Blessings',()=>{
  let s=active({players:[{id:'one',name:'One player',kingdoms:['fjordland','orcs']}]});const hero=placeHero(s,'hero-fjordland-17','A','unit-1');give(s,'one','spell-24');s=passWindows(cast(s,'spell-24',a=>a.casterId===hero.id));
  assert.ok(!s.units.some(u=>u.id===hero.id));assert.equal(s.advanced.pending.flow,'blessing');const before=s.advanced.hands.one.length;s=choice(s,'orcs');assert.equal(s.advanced.pending.data.count,1);s=choice(s,'fjordland');assert.equal(s.advanced.hands.one.length,before+2);check(s);
});
test('Lilith’s draw Power requires her own Mage-required cast and draws that card’s type',()=>{
  let s=applyAction(six('night'),{type:'collect-income'}),army=s.units.find(u=>u.kingdom==='night');const lilith=placeHero(s,'hero-night-11',army.hexId,army.id);army.weakened=true;give(s,'player-night','spell-17');const before=s.advanced.hands['player-night'].length;
  s=cast(s,'spell-17',a=>a.casterId===lilith.id&&a.targetId===army.id);
  for(let i=0;i<20&&!legalActions(s).some(a=>a.type==='hero-power'&&a.cardId===lilith.defId);i++)s=applyAction(s,legalActions(s).find(a=>a.type==='magic-pass'));
  const power=legalActions(s).find(a=>a.type==='hero-power'&&a.cardId===lilith.defId);assert.ok(power);s=passWindows(applyAction(s,power));assert.equal(s.advanced.hands['player-night'].length,before);assert.ok(s.advanced.locked.includes(lilith.id));check(s);
});
test('Dominia’s automatic Coven placement consumes no die and remains active while locked',()=>{
  let s=six('night'),army=s.units.find(u=>u.kingdom==='night');const dominia=placeHero(s,'hero-night-13',army.hexId,army.id);s.advanced.locked.push(dominia.id);
  const from=s.hexes.find(h=>h.id===army.hexId),action=legalActions(s).find(a=>a.type==='coven'&&(()=>{const h=s.hexes.find(h=>h.id===a.hexId);return Math.max(Math.abs(h.q-from.q),Math.abs(h.r-from.r),Math.abs(h.q+h.r-from.q-from.r))<=5;})());assert.ok(action);const rng=s.rng;s=applyAction(s,action);assert.equal(s.rng,rng);assert.ok(s.covens.includes(action.hexId));check(s);
});
test('unsellable-only Winter excess requires an explicit logged table ruling',()=>{
  let s=active();for(const id of ['treasure-29','treasure-30','treasure-35'])give(s,fj,id);s.advanced.pending={kind:'winter',playerIndex:0};
  assert.equal(legalActions(s).some(a=>a.type==='finish-winter'),false);assert.equal(legalActions(s).some(a=>a.type==='sell-treasure'),false);const action=legalActions(s).find(a=>a.type==='winter-ruling');assert.ok(action);
  s=applyAction(s,action);assert.equal(s.advanced.tableRulings.length,1);assert.match(s.advanced.tableRulings[0],/Table ruling/);check(s);
});

test('collapsed kingdoms cannot answer their last elimination window with a Hero-producing Blessing',()=>{
  let s=applyAction(six('goblins'),{type:'collect-income'});give(s,'player-goblins','blessing-goblins-06');
  s.advanced.pending={kind:'window',window:'elimination',players:['player-goblins'],index:0,step:0,event:{type:'unit-eliminated',army:true,kingdom:'goblins'},resume:null};
  assert.ok(legalActions(s).some(a=>a.type==='play-card'&&a.cardId==='blessing-goblins-06'));
  s.kingdoms.find(k=>k.id==='goblins').collapsed=true;
  assert.equal(legalActions(s).some(a=>a.type==='play-card'||a.type==='hero-power'),false);
});
test('a moving Army cannot pick up a finished Hero, and a finished stack cannot cycle join/drop',()=>{
  let s=active();const hero=placeHero(s,'hero-fjordland-11','A');hero.activated=true;
  s=applyAction(s,{type:'activate',unitId:'unit-1'});
  assert.equal(legalActions(s).some(a=>a.type==='join-stack'&&a.unitId===hero.id),false);
  s=passWindows(applyAction(s,legalActions(s).find(a=>a.type==='move'&&a.toHex==='B')));s=applyAction(s,{type:'pass',unitId:'unit-1'});s.units.find(u=>u.id===hero.id).hexId='B';s.advanced.stacks[hero.id]='unit-1';
  assert.equal(legalActions(s).some(a=>a.type==='drop-hero'||a.type==='drop-army'),false);check(s);
});

test('all AI difficulties defer unsellable-only Winter excess to a human table ruling',()=>{
  let s=active();for(const id of ['treasure-29','treasure-30','treasure-35'])give(s,fj,id);s.advanced.pending={kind:'winter',playerIndex:0};
  for(const difficulty of ['easy','normal','hard'])assert.equal(chooseDifficultyAction(s,difficulty,legalActions(s)[0]),null);
});
