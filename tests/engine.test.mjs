import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, legalActions, moveOptions, shipOptions, combatForecast, isBesieged, exportGame, importGame, validateState, botAction } from '../dist/js/engine.js';

const definition = (id,kingdom,extra={})=>({id,name:id,kingdom,cost:2,recoveryCost:1,movement:3,light:2,heavy:0,abilities:[],characteristics:[],count:6,...extra});
const city = (loyalty,extra={})=>({name:loyalty+'town',loyalty,city:false,fortified:0,port:false,...extra});
function fixture(extra={}) {
  return {
    hexes:[{id:'A',q:0,r:0,terrain:'clear',settlement:city('fjordland')},{id:'B',q:1,r:0,terrain:'clear'},{id:'C',q:2,r:0,terrain:'clear',settlement:city('orcs')},{id:'D',q:0,r:1,terrain:'forest'},{id:'E',q:1,r:1,terrain:'mountain'},{id:'F',q:2,r:1,terrain:'clear'}],
    unitDefinitions:[definition('freeholders','fjordland'),definition('warriors','orcs')],
    scenario:{id:'test-diagnostic',name:'Diagnostic fixture (unofficial)',official:false,source:'test-only',startYear:1,startSeason:0,endYear:1,endSeason:2,turnOrder:['fjordland','orcs'],kingdoms:[{id:'fjordland',name:'Fjordland',side:'resistance',gold:6,income:2},{id:'orcs',name:'Orcs',side:'invader',gold:6,income:0}],initialUnits:[{defId:'freeholders',hexId:'A'},{defId:'warriors',hexId:'C'}],objective:{type:'control',kingdom:'orcs',hexIds:['A'],count:1}},seed:1986,...extra
  };
}
const active=(config=fixture())=>applyAction(createGame(config),{type:'collect-income'});
const has=(s,type,match={})=>legalActions(s).some(a=>a.type===type&&Object.entries(match).every(([k,v])=>a[k]===v));

test('whole Kingdom turn order, income, Winter skipped and deadline victory',()=>{
  let s=createGame(fixture());assert.equal(s.phase,'income-actions');assert.equal(s.kingdoms[0].gold,6);
  for(let season=0;season<3;season++){s=applyAction(s,{type:'collect-income'});assert.equal(s.kingdoms[0].gold,8+2*season);s=applyAction(s,{type:'end-turn'});assert.equal(s.currentKingdom,'orcs');s=applyAction(s,{type:'collect-income'});s=applyAction(s,{type:'end-turn'});}
  assert.equal(s.phase,'game-over');assert.equal(s.winner,'resistance');assert.equal(legalActions(s).length,0);
  const f=fixture();f.scenario.endYear=2;let w=active(f);
  for(let i=0;i<6;i++){w=applyAction(w,{type:'end-turn'});if(i<5)w=applyAction(w,{type:'collect-income'});}
  assert.equal(w.year,2);assert.equal(w.season,0);assert.ok(w.log.some(l=>l.includes('Winter')));
});
test('move then action commits; finished Army cannot activate, state immutable',()=>{
  const original=active();const u=original.units[0].id;let s=applyAction(original,{type:'move',unitId:u,toHex:'B'});
  assert.equal(original.units[0].hexId,'A');assert.equal(s.activeUnitId,u);assert.equal(s.remainingMP,2);assert.ok(has(s,'attack',{unitId:u,targetHex:'C'}));
  s=applyAction(s,{type:'pass',unitId:u});assert.equal(s.units[0].activated,true);
  assert.throws(()=>applyAction(s,{type:'move',unitId:u,toHex:'A'}),/Illegal/);
  assert.throws(()=>applyAction(original,{type:'attack',unitId:u,targetHex:'C'}),/Illegal/);
});
test('terrain costs, rivers, mountain specialties, all-road +1 and flying blockers',()=>{
  const f=fixture();f.hexes.find(h=>h.id==='A').edges={B:{road:true},D:{river:1}};f.hexes.find(h=>h.id==='B').edges={C:{road:true}};
  f.unitDefinitions[0].movement=1;let s=active(f);let m=moveOptions(s,s.units[0].id);assert.equal(m.find(m=>m.hexId==='D').cost,3,'minimum one hex still legal');assert.ok(m.find(m=>m.hexId==='B'));
  f.scenario.initialUnits=f.scenario.initialUnits.filter(u=>u.defId==='freeholders');f.hexes.find(h=>h.id==='C').settlement=undefined;s=active(f);m=moveOptions(s,s.units[0].id);assert.equal(m.find(m=>m.hexId==='C').cost,2,'all-road route gets extra MP');
  f.unitDefinitions[0].kingdom='goblins';f.scenario.kingdoms[0].id='goblins';f.scenario.turnOrder[0]='goblins';f.hexes[0].settlement=city('goblins');f.scenario.initialUnits[0].defId='freeholders';s=active(f);assert.equal(moveOptions(s,s.units[0].id).find(m=>m.hexId==='E'),undefined,'mountain beyond one-MP minimum is unreachable');
  f.unitDefinitions[0].movement=3;s=active(f);assert.equal(moveOptions(s,s.units[0].id).find(m=>m.hexId==='E').cost,2,'goblin mountain route costs plains1 + mountain1');
});
test('build ready in own settlement, finished adjacent, siege prevents construction',()=>{
  let s=active();assert.ok(has(s,'build',{defId:'freeholders',hexId:'B'}));s=applyAction(s,{type:'build',defId:'freeholders',hexId:'B'});assert.equal(s.units.at(-1).activated,true);
  const f=fixture();f.scenario.initialUnits=[{defId:'warriors',hexId:'B'}];s=active(f);assert.equal(isBesieged(s,'A'),true);assert.equal(has(s,'build',{defId:'freeholders',hexId:'A'}),false);assert.equal(has(s,'build',{defId:'freeholders',hexId:'D'}),false);
  f.hexes[0].settlement.port=true;s=active(f);assert.equal(isBesieged(s,'A'),false);s=applyAction(s,{type:'build',defId:'freeholders',hexId:'A'});assert.equal(s.units.at(-1).activated,false);
});
test('recovery uses allied welcoming settlements, pays printed cost and ends activation',()=>{
  const f=fixture();f.scenario.initialUnits[0].weakened=true;let s=active(f);const u=s.units[0].id;assert.ok(has(s,'recover',{unitId:u}));s=applyAction(s,{type:'recover',unitId:u});assert.equal(s.units[0].weakened,false);assert.equal(s.kingdoms[0].gold,7);assert.equal(s.units[0].activated,true);
  f.scenario.initialUnits[1].hexId='B';s=active(f);assert.equal(has(s,'recover',{unitId:s.units[0].id}),false);
});
test('city garrison stacks with Army; defense terrain/river; siege cancels fortification',()=>{
  const f=fixture();f.hexes.find(h=>h.id==='C').settlement=city('orcs',{city:true,fortified:2,wilderness:'forest'});f.hexes.find(h=>h.id==='B').edges={C:{river:2}};f.scenario.initialUnits[0].hexId='B';f.unitDefinitions.push(definition('siege','fjordland',{name:'Siege Engine',abilities:['siege']}));f.scenario.initialUnits.push({defId:'siege',hexId:'E'});
  const s=active(f),forecast=combatForecast(s,s.units[0].id,'C');assert.equal(forecast.defenderLight,8,'army2+city3+forest1+major river2');assert.equal(forecast.fortificationPenalty,1);assert.equal(has(s,'attack',{unitId:s.units[2].id,targetHex:'B'}),false,'siege cannot attack field Armies');
});
test('critical hits confirm with d6, no combat retreat, deterministic saved continuation',()=>{
  const f=fixture();f.seed=1;f.unitDefinitions[0].light=0;f.unitDefinitions[0].heavy=6;f.scenario.initialUnits[0].hexId='B';let s=active(f);const u=s.units[0].id;const before=exportGame(s);const one=applyAction(s,{type:'attack',unitId:u,targetHex:'C'}),two=applyAction(importGame(before),{type:'attack',unitId:u,targetHex:'C'});
  assert.deepEqual(one,two);assert.ok(one.lastCombat.attackerRolls.some(d=>d.critical&&d.confirmation));assert.ok(one.lastCombat.attackerRolls.every(d=>d.success===(d.modified>=5)));assert.ok(!legalActions(one).some(a=>a.type==='retreat'));
  s=one;if(s.pendingCombat?.stage==='settlement')s=applyAction(s,{type:'settlement',choice:'control'});assert.equal(s.controls.C,'fjordland');assert.equal(s.kingdoms[0].income,3);assert.equal(s.units[0].hexId,'C');assert.equal(s.units[0].activated,true);
});
test('Stealth Ambush uses sequential Strikes; fortified attacker cannot ambush',()=>{
  const f=fixture();f.seed=1;f.scenario.initialUnits[0].hexId='B';f.unitDefinitions[0].abilities=['stealth'];f.unitDefinitions[0].light=0;f.unitDefinitions[0].heavy=6;let s=active(f);s=applyAction(s,{type:'attack',unitId:s.units[0].id,targetHex:'C'});assert.equal(s.pendingCombat.stage,'ambush');assert.ok(has(s,'resolve-combat',{ambush:'attacker'}));s=applyAction(s,{type:'resolve-combat',ambush:'attacker'});assert.equal(s.lastCombat.result,'ambush');assert.equal(s.lastCombat.defenderRolls.length,0,'eliminated Army cannot strike back');
  f.hexes.find(h=>h.id==='C').settlement.fortified=1;s=active(f);assert.equal(combatForecast(s,s.units[0].id,'C').attackerCanAmbush,false);
});
test('friendly-ready switching forces the other Army to leave before its action',()=>{
  const f=fixture();f.scenario.initialUnits.push({defId:'freeholders',hexId:'B'});let s=active(f);const first=s.units[0].id,other=s.units[2].id;s=applyAction(s,{type:'move',unitId:first,toHex:'B'});assert.equal(s.activeUnitId,other);assert.equal(s.units.find(u=>u.id===first).activated,true);assert.ok(!has(s,'attack',{unitId:other}));assert.ok(!has(s,'pass',{unitId:other}));assert.ok(!has(s,'end-turn'));
  s=applyAction(s,{type:'move',unitId:other,toHex:'A'});assert.ok(has(s,'pass',{unitId:other}));
});
test('ordinary ships finish the action; Fjordland ships are free and +2MP',()=>{
  const f=fixture();f.hexes=[{id:'A',q:0,r:0,terrain:'coastal',settlement:city('fjordland',{port:true})},{id:'B',q:1,r:0,terrain:'sea'},{id:'C',q:2,r:0,terrain:'coastal',settlement:city('orcs')},{id:'D',q:1,r:1,terrain:'forest',coastal:true,edges:{B:{sea:true}}}];f.scenario.initialUnits[1].hexId='C';let s=active(f);const u=s.units[0].id;assert.ok(shipOptions(s,u).some(m=>m.hexId==='D'));s=applyAction(s,{type:'ship',unitId:u,toHex:'D'});assert.equal(s.activeUnitId,u);assert.equal(s.units[0].activated,false);assert.equal(shipOptions(s,u).length,0);assert.ok(has(s,'pass',{unitId:u}));
  assert.ok(!shipOptions(s,u).some(m=>m.hexId==='B'),'cannot stop at sea');
});
test('Shashka maintenance and Laying Waste, immunity until first controlled Settlement',()=>{
  let s=active();s=applyAction(s,{type:'end-turn'});s=applyAction(s,{type:'collect-income'});assert.equal(s.kingdoms[1].gold,6);s=applyAction(s,{type:'end-turn'});assert.equal(s.kingdoms[1].collapsed,false);
  const f=fixture();f.scenario.initialControls={A:'orcs'};f.scenario.kingdoms[1].gold=0;s=active(f);s=applyAction(s,{type:'end-turn'});assert.ok(has(s,'lay-waste',{hexId:'A'}));s=applyAction(s,{type:'lay-waste',hexId:'A'});assert.equal(s.kingdoms[1].gold,3);assert.ok(s.razed.includes('A'));s=applyAction(s,{type:'collect-income'});s=applyAction(s,{type:'end-turn'});assert.equal(s.kingdoms[1].collapsed,true);
});
test('AI chooses legal actions and reaches finite campaign terminal state',()=>{
  let s=createGame(fixture({controllers:{fjordland:'ai',orcs:'ai'}}));let steps=0;
  while(s.phase!=='game-over'&&steps++<400){const a=botAction(s);assert.ok(a);s=applyAction(s,a);assert.equal(validateState(s).length,0,`${JSON.stringify(a)}: ${validateState(s).join('; ')}`);}
  assert.equal(s.phase,'game-over');assert.ok(steps<400);
});
test('malformed saves and invalid phase/cost commands are rejected',()=>{
  const s=createGame(fixture());assert.throws(()=>applyAction(s,{type:'end-turn'}),/Illegal/);assert.throws(()=>importGame('{"version":1}'),/Missing/);
  const bad=structuredClone(s);bad.units[0].hexId='outside';assert.throws(()=>importGame(JSON.stringify(bad)),/Invalid Army/);
  const a=active();a.kingdoms[0].gold=0;assert.throws(()=>applyAction(a,{type:'build',defId:'freeholders',hexId:'B'}),/Illegal/);
});
test('Army of Night can flip the target Coven into control while all five markers are used',()=>{
  const f=fixture();f.seed=1;f.scenario.kingdoms[0].id='night';f.scenario.kingdoms[0].name='Army of Night';f.scenario.kingdoms[0].controlLimit=5;f.scenario.turnOrder[0]='night';f.hexes[0].settlement=city('night');f.unitDefinitions[0].kingdom='night';f.unitDefinitions[0].light=0;f.unitDefinitions[0].heavy=12;f.scenario.initialUnits[0].hexId='B';
  for(const h of f.hexes.filter(h=>['D','E','F'].includes(h.id)))h.settlement=city('orcs');
  f.hexes.push({id:'G',q:3,r:1,terrain:'clear',settlement:city('orcs')});f.scenario.initialCovens=['C','D','E','F','G'];f.scenario.objective.kingdom='night';
  let s=active(f);s=applyAction(s,{type:'attack',unitId:s.units[0].id,targetHex:'C'});assert.equal(s.pendingCombat.stage,'settlement');assert.ok(has(s,'settlement',{choice:'control'}));s=applyAction(s,{type:'settlement',choice:'control'});
  assert.equal(s.controls.C,'night');assert.equal(s.covens.length,4);assert.equal(Object.values(s.controls).filter(k=>k==='night').length+s.covens.length,5);assert.equal(validateState(s).length,0);
});
