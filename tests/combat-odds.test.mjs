import test from 'node:test';
import assert from 'node:assert/strict';
import {combatForecast,createGame,applyAction,movementPreview,moveOptions,exportGame} from '../dist/js/engine.js';
import {monsters} from '../dist/js/advanced.js';
import {combatOdds} from '../dist/js/combat-odds.js';
import {findMap} from '../dist/js/map-tools.js';
import {fixture,active,placeHero} from './fixtures/advanced.mjs';
const close=(actual,expected,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
function duel(light=1,heavy=0,enemyLight=1){const cfg=fixture({profile:'basic'});cfg.unitDefinitions[0].light=light;cfg.unitDefinitions[0].heavy=heavy;cfg.unitDefinitions[1].light=enemyLight;cfg.scenario.initialUnits[0].hexId='B';return cfg;}
const forecast=(s,mode='combat',allocation='army-first')=>combatOdds(s,combatForecast(s,'unit-1','C'),mode,allocation);
test('one light die each predicts cancellation, wounds, and the independent tie probability',()=>{
  const s=applyAction(createGame(duel()),{type:'collect-income'}),before=exportGame(s),odds=forecast(s);
  close(odds.attacker.expectedHits,2/9);close(odds.defender.expectedHits,2/9);close(odds.noHitChance,5/9);
  close(odds.defenderWounds.expectedWounds,2/9);close(odds.defenderWounds.army.weakenedChance,2/9);close(odds.defenderWounds.army.eliminatedChance,0);
  assert.equal(exportGame(s),before);
});
test('heavy dice include critical confirmation, fortified dice use modified thresholds',()=>{
  let cfg=duel(0,1,0),s=applyAction(createGame(cfg),{type:'collect-income'}),odds=forecast(s);
  close(odds.attacker.expectedHits,7/12);close(odds.attacker.hitChance,1/2);close(odds.attacker.twoHitChance,1/12);close(odds.defenderWounds.army.eliminatedChance,1/12);
  cfg.hexes[2].settlement.fortified=2;s=applyAction(createGame(cfg),{type:'collect-income'});odds=forecast(s);close(odds.attacker.expectedHits,1/4);close(odds.attacker.twoHitChance,0);
});
test('Ranged only breaks positive ties, while Fragile and weakened Armies take one hit',()=>{
  const cfg=duel();cfg.unitDefinitions[0].abilities=['ranged'];cfg.unitDefinitions[1].characteristics=['fragile'];const odds=forecast(applyAction(createGame(cfg),{type:'collect-income'}));
  close(odds.attacker.hitChance,1/3);close(odds.defender.hitChance,2/9);close(odds.defenderWounds.army.eliminatedChance,1/3);close(odds.defenderWounds.army.weakenedChance,0);
});
test('Army-first and Hero-first show different outcomes without changing the real hit owner choice',()=>{
  const cfg=duel(2,0,0);cfg.profile='advanced';let s=applyAction(createGame(cfg),{type:'collect-income'});placeHero(s,'hero-orcs-11','C','unit-2');
  // Hold the displayed public dice fixed to isolate the printed hit-allocation rule.
  const f={...combatForecast(s,'unit-1','C'),defenderLight:0,defenderHeavy:0},army=combatOdds(s,f,'combat','army-first'),hero=combatOdds(s,f,'combat','hero-first');
  close(army.defenderWounds.army.eliminatedChance,1/9);close(army.defenderWounds.hero.eliminatedChance,0);
  close(hero.defenderWounds.army.eliminatedChance,0);close(hero.defenderWounds.hero.eliminatedChance,5/9);close(hero.defenderWounds.army.weakenedChance,1/9);
});
test('Ambush caps ordinary successes and uses the surviving weakened Army for its reply',()=>{
  const cfg=duel(2,0,2);cfg.unitDefinitions[0].abilities=['stealth'];cfg.unitDefinitions[1].weakenedLight=1;
  const s=applyAction(createGame(cfg),{type:'collect-income'}),normal=forecast(s),ambush=forecast(s,'attacker-ambush');
  close(ambush.attacker.expectedHits,5/9);close(ambush.attacker.twoHitChance,0);close(ambush.defender.expectedHits,(4/9)*(5/9)+(5/9)*(1/3));
  assert.notEqual(normal.attacker.expectedHits,ambush.attacker.expectedHits);
});
test('Ambush ignores terrain and the unoccupied settlement garrison really Strikes back',()=>{
  const cfg=duel(1,0,0);cfg.unitDefinitions[0].abilities=['stealth'];cfg.scenario.initialUnits.pop();cfg.hexes[2].settlement.wilderness='forest';
  const s=applyAction(createGame(cfg),{type:'collect-income'}),odds=forecast(s,'attacker-ambush');close(odds.attacker.expectedHits,1/3);close(odds.defender.expectedHits,2/9);assert.equal(odds.defenderPool.light,1);
  let found=false;for(let seed=1;seed<200;seed++){let play=applyAction(createGame({...cfg,seed}),{type:'collect-income'});play=applyAction(play,{type:'attack',unitId:'unit-1',targetHex:'C'});play=applyAction(play,{type:'resolve-combat',ambush:'attacker'});if(!play.lastCombat.defenderHits){assert.equal(play.lastCombat.defenderRolls.length,1);found=true;break;}}assert.ok(found);
});
test('advanced resolved effects are reflected without reading private hands, decks, or future dice',()=>{
  let s=active();s.units[0].hexId='B';s.unitDefinitions[0].light=0;s.unitDefinitions[0].heavy=1;s.unitDefinitions[1].light=0;
  s.advanced.effects.push({cardId:'treasure-20',target:'unit-1',expires:s.turnSerial,activation:null});
  const f=combatForecast(s,'unit-1','C');Object.defineProperty(s,'rng',{get(){throw Error('Future RNG leaked');}});for(const key of ['hands','decks'])Object.defineProperty(s.advanced,key,{get(){throw Error('Private cards leaked');}});
  const odds=combatOdds(s,f);close(odds.attacker.expectedHits,2/3,1e-9);close(odds.attacker.twoHitChance,1/8,1e-9);
});
test('forecast probabilities agree with thousands of actual resolutions across terrain, Ranged and Ambush',()=>{
  for(const kind of ['normal','fortified','ranged','ambush']){
    const cfg=duel(2,2,2);cfg.unitDefinitions[1].heavy=1;if(kind==='fortified')cfg.hexes[2].settlement.fortified=1;if(kind==='ranged')cfg.unitDefinitions[0].abilities=['ranged'];if(kind==='ambush')cfg.unitDefinitions[0].abilities=['stealth'];
    const base=applyAction(createGame(cfg),{type:'collect-income'}),odds=forecast(base,kind==='ambush'?'attacker-ambush':'combat');let ah=0,dh=0,count=5000;
    for(let i=0;i<count;i++){let s=applyAction(createGame({...cfg,seed:(Math.imul(i+1,2654435761)>>>0)||1}),{type:'collect-income'});s=applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'C'});if(s.pendingCombat?.stage==='ambush')s=applyAction(s,{type:'resolve-combat',ambush:kind==='ambush'?'attacker':null});ah+=s.lastCombat.defenderHits;dh+=s.lastCombat.attackerHits;}
    close(ah/count,odds.attacker.expectedHits,.055);close(dh/count,odds.defender.expectedHits,.055);
  }
});
test('route preview itemizes actual terrain cost for each stack member and road allowance',()=>{
  let s=active();placeHero(s,'hero-fjordland-17','A','unit-1');const option=moveOptions(s,'unit-1').find(o=>o.hexId==='E'),before=exportGame(s),preview=movementPreview(s,'unit-1',option);
  assert.equal(preview.steps.length,option.path.length);assert.equal(Math.max(...preview.units.map(u=>u.spent)),option.cost);assert.equal(exportGame(s),before);
  s.hexes[0].edges={B:{road:true}};s.hexes[1].edges={A:{road:true},E:{road:true}};s.hexes[4].edges={B:{road:true}};const road=moveOptions(s,'unit-1').find(o=>o.hexId==='E');assert.ok(road.roadOnly);assert.ok(movementPreview(s,'unit-1',road).units.every(u=>u.roadBonus===1));
});
test('map finder discovers locations, objectives and ready counters without exposing secret Covens',()=>{
  const s=active();s.covens=['C'];s.units[0].activated=true;assert.equal(findMap(s,'orc').some(r=>r.name==='Orc Reavers'),true);assert.equal(findMap(s,'','ready').length,0);assert.equal(findMap(s,'','objectives')[0].hexId,'A');assert.equal(findMap(s,'coven').length,0);assert.ok(findMap(s,'E').some(r=>r.hexId==='E'));
});

test('a revealed Monster forecast caps wounds at its one-hit elimination rule',()=>{
  let s=active();s.units[0].hexId='B';s.units.splice(1);const m=monsters.find(m=>m.pool==='land'&&!m.abilities.includes('stealth'));
  s.advanced.monsterPools.land.splice(s.advanced.monsterPools.land.indexOf(m.id),1);
  s.advanced.monsters.push({id:'monster-1',defId:m.id,hexId:'C',weakened:false,activated:false,lair:true});
  const before=exportGame(s),f=combatForecast(s,'unit-1','C'),odds=combatOdds(s,f);
  assert.equal(f.defenderUnitId,'monster-1');assert.equal(odds.defenderWounds.capacity,1);
  close(odds.defenderWounds.expectedWounds,odds.attacker.hitChance);close(odds.defenderWounds.eliminatedChance,odds.attacker.hitChance);assert.equal(exportGame(s),before);
});
