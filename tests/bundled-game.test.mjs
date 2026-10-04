import test from 'node:test';
import assert from 'node:assert/strict';
import {getScenarioOptions} from '../dist/js/scenarios.js';
import {createGame,botAction,applyAction,validateState,exportGame,importGame} from '../dist/js/engine.js';

for(const [scenarioIndex,seed] of [[0,1],[0,1986],[0,29],[1,2026],[1,20261004]]) {
  test(`bundled ${scenarioIndex?'six-kingdom sandbox':'teaching fixture'}: seed ${seed} finishes, validates and resumes exactly`,()=>{
    const config=getScenarioOptions()[scenarioIndex].config;
    let s=createGame({...config,seed,controllers:Object.fromEntries(config.scenario.kingdoms.map(k=>[k.id,'ai']))});
    let steps=0;
    while(s.phase!=='game-over'&&steps<1200){
      const action=botAction(s);assert.ok(action,'computer must produce a legal command');
      s=applyAction(s,action);
      assert.deepEqual(validateState(s),[],`after ${JSON.stringify(action)}`);
      if(++steps===20){const resumed=importGame(exportGame(s));assert.deepEqual(applyAction(resumed,botAction(resumed)),applyAction(s,botAction(s)));s=resumed;}
    }
    assert.equal(s.phase,'game-over');assert.ok(steps<1200,'finite campaign deadline must terminate play');
    assert.deepEqual(importGame(exportGame(s)),s,'terminal saved game must preserve every receipt');
  });
}
