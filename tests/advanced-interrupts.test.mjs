import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions,validateState,exportGame,importGame} from '../dist/js/engine.js';
import {cards} from '../dist/js/advanced.js';
import {fixture,active,give,placeHero,passWindows,battle} from './fixtures/advanced.mjs';
const choose=(s,match)=>{const a=legalActions(s).find(match);assert.ok(a,'Expected legal advanced decision');return applyAction(s,a);};
const check=s=>{assert.deepEqual(validateState(s),[]);assert.deepEqual(importGame(exportGame(s)),s);};

test('Hero teleportation respects the Huge Army in its stack',()=>{
 const c=fixture();c.unitDefinitions[0].characteristics=['huge'];c.scenario.initialUnits[0].hexId='D';let s=active(c);
 placeHero(s,'hero-fjordland-17','D','unit-1');give(s,'player-fjordland','spell-21');
 const moves=legalActions(s).filter(a=>a.cardId==='spell-21');assert.ok(moves.some(a=>a.targetHex==='B'));assert.equal(moves.some(a=>a.targetHex==='A'),false);check(s);
});

test('Teleport joins a finished Hero to the active Army and finishes that stack',()=>{
 let s=active();const hero=placeHero(s,'hero-fjordland-17','D');hero.activated=true;give(s,'player-fjordland','spell-21');
 s=applyAction(s,{type:'activate',unitId:'unit-1'});s.remainingMP=s.advanced.movement['unit-1']=0;
 s=choose(s,a=>a.cardId==='spell-21'&&a.casterId===hero.id&&a.targetHex==='A');s=passWindows(s);
 assert.equal(s.advanced.stacks[hero.id],'unit-1');assert.equal(s.activeUnitId,null);assert.ok(s.units.find(u=>u.id==='unit-1').activated);assert.ok(legalActions(s).some(a=>a.type==='end-turn'));check(s);
});

test('Portal joins an Army to a finished Hero and preserves the other caster',()=>{
 let s=active();const arriving= s.units.find(u=>u.id==='unit-1');arriving.hexId='B';const waiting=placeHero(s,'hero-fjordland-17','D');waiting.activated=true;const caster=placeHero(s,'hero-fjordland-13','A');give(s,'player-fjordland','spell-11');
 s=applyAction(s,{type:'activate',unitId:'unit-1'});s=choose(s,a=>a.cardId==='spell-11'&&a.casterId===caster.id&&a.targetId==='unit-1'&&a.targetHex==='D');s=passWindows(s);
 assert.equal(s.advanced.stacks[waiting.id],'unit-1');assert.equal(s.units.find(u=>u.id===caster.id).hexId,'A');assert.equal(s.activeUnitId,null);assert.ok(s.units.find(u=>u.id==='unit-1').activated);check(s);
});

test('Battle Magic eliminating the attacker ends combat without a stale forecast',()=>{
 const c=fixture();c.scenario.initialUnits[0].hexId='B';let s=active(c);s.units.find(u=>u.id==='unit-1').weakened=true;
 placeHero(s,'hero-orcs-12','C','unit-2');give(s,'player-orcs','spell-52');s=applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'C'});
 for(let guard=0;guard<10&&!legalActions(s).some(a=>a.cardId==='spell-52');guard++)s=choose(s,a=>a.type==='magic-pass');
 s=choose(s,a=>a.cardId==='spell-52'&&a.targetId==='unit-1');s=passWindows(s);
 s=choose(s,a=>a.type==='allocate-hit'&&a.unitId==='unit-1');s=passWindows(s);
 assert.equal(s.advanced.battle,null);assert.equal(s.pendingCombat,null);assert.equal(s.activeUnitId,null);assert.ok(s.log.some(l=>l.startsWith('Combat canceled')));check(s);
});

test('Entry interrupts preserve legal transit through a finished Army and Hero',()=>{
 const c=fixture();c.hexes.push({id:'G',q:0,r:2,terrain:'clear'});c.scenario.initialUnits.push({defId:'army-a',hexId:'D'});let s=active(c);
 s.units.find(u=>u.id==='unit-3').activated=true;const finished=placeHero(s,'hero-fjordland-17','D','unit-3');finished.activated=true;
 placeHero(s,'hero-orcs-12','C','unit-2');give(s,'player-orcs','treasure-05');
 s=applyAction(s,{type:'move',unitId:'unit-1',toHex:'G',path:['D','G']});
 for(let guard=0;guard<10&&s.units.find(u=>u.id==='unit-1').hexId!=='D';guard++)s=choose(s,a=>a.type==='magic-pass');
 assert.equal(s.advanced.pending.window,'entry');assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'D');check(s);
 s=passWindows(s);assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'G');check(s);
});

test('Flying entry interrupts can be saved while passing through an enemy stack',()=>{
 const c=fixture();c.hexes.push({id:'G',q:0,r:2,terrain:'clear'});c.unitDefinitions[0].abilities=['flying'];c.scenario.initialUnits[1].hexId='D';let s=active(c);
 placeHero(s,'hero-orcs-12','D','unit-2');give(s,'player-orcs','treasure-05');
 s=applyAction(s,{type:'move',unitId:'unit-1',toHex:'G',path:['D','G']});
 for(let guard=0;guard<10&&s.units.find(u=>u.id==='unit-1').hexId!=='D';guard++)s=choose(s,a=>a.type==='magic-pass');
 assert.equal(s.advanced.pending.window,'entry');check(s);s=passWindows(s);assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'G');check(s);
});
function nightConfig(){const c=fixture();c.scenario.turnOrder.unshift('night');c.scenario.kingdoms.push({id:'night',name:'Army of the Night',side:'invader',gold:20,income:2});c.unitDefinitions.push({...c.unitDefinitions[1],id:'army-n',kingdom:'night',name:'Night Army'});c.scenario.initialUnits.push({defId:'army-n',hexId:'D'});return c;}

test('Ring cancels the selected Hero hit and places only the caster, keeping the next Army hit',()=>{
 let s=active();const hero=placeHero(s,'hero-fjordland-17','A','unit-1');give(s,'player-fjordland','treasure-12');
 battle(s,{hits:2});s=applyAction(s,{type:'allocate-hit',unitId:hero.id});
 assert.equal(s.advanced.pending.window,'selected-hit');assert.equal(s.units.find(u=>u.id===hero.id).hexId,'A');check(s);
 s=choose(s,a=>a.type==='play-card'&&a.cardId==='treasure-12'&&a.targetHex==='D');s=passWindows(s);
 assert.equal(s.units.find(u=>u.id===hero.id).hexId,'D');assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'A');assert.equal(s.advanced.stacks[hero.id],undefined);
 assert.equal(s.advanced.pending.kind,'hit');assert.equal(s.advanced.pending.count,1);assert.deepEqual(s.advanced.pending.members,['unit-1']);
 s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});assert.equal(s.units.find(u=>u.id==='unit-1').weakened,true);check(s);
});

test('Ring can remain in its original legal hex and cannot protect an unchosen Hero',()=>{
 let s=active();const hero=placeHero(s,'hero-fjordland-17','A','unit-1');give(s,'player-fjordland','treasure-12');battle(s,{hits:1});
 assert.equal(legalActions(s).some(a=>a.cardId==='treasure-12'),false);
 s=applyAction(s,{type:'allocate-hit',unitId:hero.id});s=choose(s,a=>a.cardId==='treasure-12'&&a.targetHex==='A');s=passWindows(s);
 assert.ok(s.units.some(u=>u.id===hero.id));assert.equal(s.advanced.stacks[hero.id],'unit-1');check(s);
});

test('Freyja saves a locked Hero and resolves before combat proceeds',()=>{
 let s=active();const saved=placeHero(s,'hero-fjordland-17','A','unit-1'),freyja=placeHero(s,'hero-fjordland-13','E');s.advanced.locked.push(saved.id);battle(s,{hits:1});
 s=applyAction(s,{type:'allocate-hit',unitId:saved.id});assert.equal(s.advanced.pending.window,'elimination');check(s);
 const options=legalActions(s).filter(a=>a.cardId==='hero-fjordland-13');assert.ok(options.length);assert.ok(options.every(a=>a.targetHex!=='A'));
 s=applyAction(s,options.find(a=>a.targetHex==='B'));s=passWindows(s);
 assert.equal(s.units.find(u=>u.id===saved.id).hexId,'B');assert.ok(s.advanced.locked.includes(saved.id));assert.ok(s.advanced.locked.includes(freyja.id));assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'A');check(s);
});

test('Freyja may save herself using her pre-elimination lock state',()=>{
 let s=active();const hero=placeHero(s,'hero-fjordland-13','A','unit-1');battle(s,{hits:1});s=applyAction(s,{type:'allocate-hit',unitId:hero.id});
 s=choose(s,a=>a.cardId==='hero-fjordland-13'&&a.targetHex==='B');s=passWindows(s);assert.ok(s.units.some(u=>u.id===hero.id));assert.ok(s.advanced.locked.includes(hero.id));check(s);
});

test('Shapeshift saves only the chosen Night Mage and requires a live controlled Settlement',()=>{
 let s=applyAction(createGame(nightConfig()),{type:'collect-income'});const hero=placeHero(s,'hero-night-11','D','unit-3');give(s,'player-night','blessing-night-09');
 s.controls.C='night';s.units.find(u=>u.id==='unit-2').hexId='E';battle(s,{attacker:'unit-1',defender:'unit-3',targetHex:'D',hits:1});s=applyAction(s,{type:'allocate-hit',unitId:hero.id});
 assert.equal(s.advanced.pending.window,'elimination');check(s);s=choose(s,a=>a.cardId==='blessing-night-09'&&a.targetHex==='C');s=passWindows(s);
 assert.equal(s.units.find(u=>u.id===hero.id).hexId,'C');assert.equal(s.units.find(u=>u.id==='unit-3').hexId,'D');assert.equal(s.advanced.stacks[hero.id],undefined);check(s);
});

test('Kagash selects two ordered adjacent enemy Armies without activating the borrowed Army',()=>{
 const c=fixture();c.scenario.turnOrder=['orcs','fjordland'];let s=active(c);placeHero(s,'hero-orcs-12','C','unit-2');s.units.find(u=>u.id==='unit-1').hexId='B';
 s.units.push({id:`unit-${s.serial++}`,defId:'army-a',kingdom:'fjordland',hexId:'D',weakened:false,activated:false});
 const powers=legalActions(s).filter(a=>a.cardId==='hero-orcs-12');assert.equal(powers.length,2);assert.ok(powers.every(a=>a.targetId!==a.choice));
 s=applyAction(s,powers.find(a=>a.targetId==='unit-1'));assert.equal(s.advanced.battle.sourceCard,'hero-orcs-12');assert.equal(s.advanced.battle.light,2);assert.equal(s.advanced.battle.heavy,0);
 assert.equal(s.units.find(u=>u.id==='unit-1').activated,false);check(s);
});

test('Luna uses adjacent targets, direct elimination and an optional sacrifice even with Spells',()=>{
 assert.equal(cards.find(c=>c.id==='hero-night-12').range.min,1);let success=false,failure=false;
 for(let seed=1;seed<=40&&(!success||!failure);seed++){
  const c=nightConfig();c.seed=seed;let s=applyAction(createGame(c),{type:'collect-income'});const luna=placeHero(s,'hero-night-12','D','unit-3'),victim=placeHero(s,'hero-fjordland-17','B');
  s=choose(s,a=>a.cardId==='hero-night-12'&&a.targetId===victim.id);s=passWindows(s);
  if(s.advanced.pending?.flow==='assassin-failure'){
   failure=true;assert.ok(s.advanced.pending.choices.some(c=>c.value==='discard'));assert.ok(s.advanced.pending.choices.some(c=>c.value==='sacrifice'));check(s);
   s=applyAction(s,{type:'magic-choice',value:'sacrifice'});s=passWindows(s);assert.equal(s.units.some(u=>u.id===luna.id),false);assert.ok(s.units.some(u=>u.id===victim.id));
  }else {success=true;assert.equal(s.units.some(u=>u.id===victim.id),false);assert.ok(s.units.some(u=>u.id===luna.id));assert.equal(s.advanced.battle,null);assert.equal(s.advanced.pending,null);}
  check(s);
 }
 assert.ok(success&&failure);
});

test('Horn intercepts movement before entry and rechecks the destination without spending movement',()=>{
 let s=active();placeHero(s,'hero-orcs-12','C','unit-2');s.units.push({id:`unit-${s.serial++}`,defId:'army-b',kingdom:'orcs',hexId:'E',weakened:false,activated:false});give(s,'player-orcs','treasure-05');
 s=applyAction(s,{type:'move',unitId:'unit-1',toHex:'B'});assert.equal(s.advanced.pending.window,'entry');assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'A');check(s);
 s=choose(s,a=>a.cardId==='treasure-05'&&a.targetId==='unit-4'&&a.targetHex==='B');s=passWindows(s);
 assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'A');assert.equal(s.remainingMP,3);assert.equal(s.units.find(u=>u.id==='unit-4').hexId,'B');assert.ok(s.log.some(l=>l.includes('Movement stops')));check(s);
});

test('Knives replaces Hiding at movement end, ignores fortification and flips only when every target dies',()=>{
 let success=false,failure=false;
 for(let seed=1;seed<=30&&(!success||!failure);seed++){
  const c=nightConfig();c.scenario.turnOrder=['fjordland','night','orcs'];c.seed=seed;c.hexes.find(h=>h.id==='B').settlement={name:'Coven Town',loyalty:'fjordland',fortified:2,city:false,port:false};let s=applyAction(createGame(c),{type:'collect-income'});
  s.covens.push('B');s.units.find(u=>u.id==='unit-1').weakened=true;give(s,'player-night','blessing-night-08');
  s=applyAction(s,{type:'move',unitId:'unit-1',toHex:'B'});assert.equal(s.advanced.pending.window,'coven');assert.equal(s.units.find(u=>u.id==='unit-1').activated,false);check(s);
  s=choose(s,a=>a.cardId==='blessing-night-08');s=passWindows(s);
  if(s.advanced.pending?.kind==='hit')s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});
  s=passWindows(s);assert.equal(s.covens.includes('B'),false);
  if(s.controls.B==='night'){success=true;assert.equal(s.units.some(u=>u.id==='unit-1'),false);assert.equal(s.razed.includes('B'),false);}
  else {failure=true;assert.ok(s.units.some(u=>u.id==='unit-1'));assert.equal(s.units.find(u=>u.id==='unit-1').activated,false);}
  check(s);
 }
 assert.ok(success&&failure);
});

test('Your True Rulers makes Hiding automatic without RNG and blocks voluntary Coven removal',()=>{
 const c=nightConfig();c.scenario.turnOrder=['fjordland','night','orcs'];c.hexes.find(h=>h.id==='B').settlement={name:'Coven Town',loyalty:'fjordland',fortified:0,city:false,port:false};let s=applyAction(createGame(c),{type:'collect-income'});s.covens.push('B');give(s,'player-night','blessing-night-06');give(s,'player-night','blessing-night-08');
 s=choose(s,a=>a.cardId==='blessing-night-06');s=passWindows(s);const rng=s.rng;
 s=applyAction(s,{type:'move',unitId:'unit-1',toHex:'B'});s=passWindows(s);assert.equal(s.rng,rng);assert.ok(s.covenProtected.includes('B'));assert.ok(s.covens.includes('B'));assert.equal(s.units.find(u=>u.id==='unit-1').activated,false);check(s);
});

function alliedConfig(kingdom){const c=fixture();c.scenario.turnOrder.unshift(kingdom);c.scenario.kingdoms.push({id:kingdom,name:kingdom,side:'resistance',gold:20,income:2});c.unitDefinitions.push({...c.unitDefinitions[0],id:'army-extra',kingdom,name:kingdom+' Army'});c.scenario.initialUnits.push({defId:'army-extra',hexId:'D'});return c;}
function combatPosition(s,attacker,defender,targetHex,result='attacker'){
 s=applyAction(s,{type:'activate',unitId:attacker});
 s.pendingCombat={attackerId:attacker,targetHex,stage:'ambush',decisionKingdom:s.units.find(u=>u.id===attacker).kingdom};
 const victim=result==='attacker'?defender:attacker;
 battle(s,{attacker,defender,targetHex,hits:1,kind:'battle'});Object.assign(s.advanced.battle,{result,attackerHex:s.units.find(u=>u.id===attacker).hexId,attackerHits:result==='defender'?1:0,defenderHits:result==='attacker'?1:0,attackerSuccesses:result==='attacker'?1:0,defenderSuccesses:result==='defender'?1:0});
 s.advanced.pending={kind:'hit',target:victim,count:1,members:[victim],resume:null};return s;
}

test('Sofia grants one legal extra move and Attack only after an actual advance, without locking or resetting movement',()=>{
 let s=active(alliedConfig('empire'));const sofia=placeHero(s,'hero-empire-13','D','unit-3');s.units.find(u=>u.id==='unit-3').hexId=sofia.hexId='B';s.units.find(u=>u.id==='unit-2').weakened=true;
 s=combatPosition(s,'unit-3','unit-2','C');s=applyAction(s,{type:'allocate-hit',unitId:'unit-2'});s=passWindows(s);assert.equal(s.pendingCombat.stage,'settlement');s=applyAction(s,{type:'settlement',choice:'control'});
 assert.equal(s.advanced.pending.flow,'grant-move');assert.equal(s.advanced.grant.cardId,'hero-empire-13');const mp=s.remainingMP;check(s);
 s=applyAction(s,{type:'magic-choice',value:'E'});s=passWindows(s);assert.equal(s.units.find(u=>u.id==='unit-3').hexId,'E');assert.equal(s.units.find(u=>u.id===sofia.id).hexId,'E');assert.equal(s.remainingMP,mp);assert.equal(s.advanced.pending.flow,'grant-attack');assert.equal(s.advanced.locked.includes(sofia.id),false);check(s);
 s=applyAction(s,{type:'magic-choice',value:'finish'});assert.equal(s.activeUnitId,null);assert.equal(s.advanced.grant,undefined);check(s);
});

test('Haga-Tor responds as defender out of turn and Settlement control belongs to his kingdom',()=>{
 const c=alliedConfig('oathborn');c.scenario.turnOrder=['fjordland','oathborn','orcs'];c.scenario.kingdoms.find(k=>k.id==='fjordland').side='invader';c.hexes.find(h=>h.id==='B').settlement={name:'Border Town',loyalty:'fjordland',fortified:0,city:false,port:false};let s=active(c);s.units.find(u=>u.id==='unit-2').hexId='E';s.units.find(u=>u.id==='unit-3').hexId='C';s.units.find(u=>u.id==='unit-3').activated=true;s.controls.C='oathborn';placeHero(s,'hero-oathborn-11','C','unit-3');s.units.find(u=>u.id==='unit-1').hexId='B';s.units.find(u=>u.id==='unit-1').weakened=true;
 s=combatPosition(s,'unit-1','unit-3','C','defender');s=applyAction(s,{type:'allocate-hit',unitId:'unit-1'});s=passWindows(s);
 assert.equal(s.advanced.pending.flow,'grant-advance');assert.equal(s.currentKingdom,'fjordland');assert.equal(s.advanced.grant.cardId,'hero-oathborn-11');check(s);
 s=applyAction(s,{type:'magic-choice',value:'advance'});s=passWindows(s);assert.equal(s.pendingCombat.stage,'settlement');assert.equal(s.pendingCombat.decisionKingdom,'oathborn');check(s);
 s=applyAction(s,{type:'settlement',choice:'control'});assert.equal(s.controls.B,'oathborn');assert.equal(s.currentKingdom,'fjordland');assert.equal(s.advanced.pending.flow,'grant-attack');check(s);
 assert.ok(legalActions(s).some(a=>a.value==='A'));s=applyAction(s,{type:'magic-choice',value:'finish'});assert.equal(s.units.find(u=>u.id==='unit-3').activated,true,'the out-of-turn grant preserves the defender readiness');assert.equal(s.advanced.grant,undefined);check(s);
});

test('Fury may decline a mandatory Settlement advance without looting and offers its extra heavy Attack',()=>{
 let s=active(alliedConfig('oathborn'));s.units.find(u=>u.id==='unit-3').hexId='B';s.units.find(u=>u.id==='unit-2').weakened=true;give(s,'player-oathborn','blessing-oathborn-06');
 s=combatPosition(s,'unit-3','unit-2','C');s=applyAction(s,{type:'allocate-hit',unitId:'unit-2'});assert.equal(s.advanced.pending.window,'victory');check(s);s=choose(s,a=>a.cardId==='blessing-oathborn-06'&&a.targetId==='unit-3');s=passWindows(s);assert.equal(s.advanced.pending.flow,'grant-advance');const gold=s.kingdoms.find(k=>k.id==='oathborn').gold;
 s=applyAction(s,{type:'magic-choice',value:'stay'});assert.equal(s.units.find(u=>u.id==='unit-3').hexId,'B');assert.equal(s.kingdoms.find(k=>k.id==='oathborn').gold,gold);assert.equal(s.controls.C,undefined);check(s);
 assert.ok(legalActions(s).some(a=>a.value==='C'));s=applyAction(s,{type:'magic-choice',value:'C'});assert.ok(s.advanced.effects.some(e=>e.cardId==='blessing-oathborn-06'&&e.heavy===1));check(s);
});

for(const ambush of [false,true])test(`Spy Network can return after an actual ${ambush?'Ambush':'normal combat'} hit`,()=>{
 const c=alliedConfig('goblins');c.scenario.kingdoms.find(k=>k.id==='goblins').side='invader';c.unitDefinitions.find(d=>d.id==='army-extra').abilities=ambush?['stealth']:[];c.unitDefinitions.find(d=>d.id==='army-extra').light=8;let s=active(c);s.units.find(u=>u.id==='unit-3').hexId='B';give(s,'player-goblins','blessing-goblins-05');
 s=applyAction(s,{type:'attack',unitId:'unit-3',targetHex:'A'});while(s.advanced.pending?.kind==='window'&&s.advanced.pending.players[s.advanced.pending.index]!=='player-goblins')s=applyAction(s,legalActions(s).find(a=>a.type==='magic-pass'));s=choose(s,a=>a.cardId==='blessing-goblins-05'&&a.targetId==='unit-3');s=passWindows(s);
 if(ambush){assert.equal(s.pendingCombat.stage,'ambush');s=applyAction(s,{type:'resolve-combat',ambush:'attacker'});s=passWindows(s);}
 for(let i=0;i<12&&s.advanced.pending?.kind==='hit';i++){const action=legalActions(s).find(a=>a.type==='allocate-hit')??legalActions(s).find(a=>a.type==='accept-hit');s=applyAction(s,action);s=passWindows(s);}
 assert.equal(s.advanced.pending.flow,'spy-return');assert.ok(s.advanced.discards.blessings.includes('blessing-goblins-05'));check(s);
 s=applyAction(s,{type:'magic-choice',value:'keep'});assert.ok(s.advanced.hands['player-goblins'].includes('blessing-goblins-05'));assert.equal(s.advanced.discards.blessings.includes('blessing-goblins-05'),false);check(s);
});

test('Your True Rulers makes a protected Coven build finished and prevents manual removal',()=>{
 const c=nightConfig();c.scenario.turnOrder=['fjordland','night','orcs'];c.hexes.find(h=>h.id==='B').settlement={name:'Coven Town',loyalty:'fjordland',fortified:0,city:false,port:false};let s=active(c);s.covens.push('B');s.units.find(u=>u.id==='unit-3').hexId='E';give(s,'player-night','blessing-night-06');
 s=choose(s,a=>a.cardId==='blessing-night-06');s=passWindows(s);s=applyAction(s,{type:'build',defId:'army-a',hexId:'B'});assert.equal(s.units.find(u=>u.hexId==='B').activated,true);check(s);
});

test('Shapeshift is unavailable when no controlled Settlement can legally receive the Mage',()=>{
 let s=applyAction(createGame(nightConfig()),{type:'collect-income'});const hero=placeHero(s,'hero-night-11','D','unit-3');give(s,'player-night','blessing-night-09');battle(s,{attacker:'unit-1',defender:'unit-3',targetHex:'D',hits:1});s=applyAction(s,{type:'allocate-hit',unitId:hero.id});s=passWindows(s);assert.equal(s.units.some(u=>u.id===hero.id),false);assert.ok(s.advanced.hands['player-night'].includes('blessing-night-09'));check(s);
});
