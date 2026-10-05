import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, legalActions, shipOptions, isWelcoming, validateState, exportGame, importGame } from '../dist/js/engine.js';

function fixture() {
  const config = {
    seed: 123,
    hexes: Array.from({length: 10}, (_,q) => ({ id: `h${q}`, q, r:0, terrain:'coastal', coastal:true, edges:Object.fromEntries([q-1,q+1].filter(n=>n>=0&&n<10).map(n=>[`h${n}`,{coastal:true}])) })),
    unitDefinitions:[{id:'freeholders',name:'Freeholders',kingdom:'fjordland',cost:2,recoveryCost:1,movement:3,light:1,heavy:0,count:5,abilities:[],characteristics:[]}],
    scenario:{id:'review',name:'Independent source fixture',official:false,source:'Synthetic regression fixture for Undying v1.1',startYear:1,startSeason:0,endYear:1,endSeason:2,turnOrder:['fjordland','oathborn'],kingdoms:[{id:'fjordland',name:'Fjordland',side:'invader',gold:20,income:0},{id:'oathborn',name:'Oathborn',side:'resistance',gold:20,income:0}],initialUnits:[{defId:'freeholders',hexId:'h0'}],objective:{type:'control',kingdom:'fjordland',hexIds:['h9'],count:1,deadlineOnly:true}}
  };
  config.hexes[9].settlement={name:'Goal',loyalty:'oathborn',city:false,fortified:0,port:false};
  return config;
}
const ready = config => applyAction(createGame(config), {type:'collect-income'});

test('Fjordland has five Ship MPs from coast, eight from a Port (Undying p30)',()=>{
  const base = fixture(), coast = ready(base);
  const ids = shipOptions(coast,'unit-1').map(o=>o.hexId);
  assert.ok(ids.includes('h5')); assert.ok(!ids.includes('h6'));
  const port = fixture(); port.hexes[0].settlement={name:'Port',loyalty:'fjordland',city:false,fortified:0,port:true};
  const portIds=shipOptions(ready(port),'unit-1').map(o=>o.hexId);
  assert.ok(portIds.includes('h8')); assert.ok(!portIds.includes('h9'));
});
test('cannot recruit in allied/enemy Entry even beside friendly Settlement (8.2 p19)',()=>{
  const pack=fixture(); pack.hexes[0].settlement={name:'Home',loyalty:'fjordland',city:false,fortified:0,port:false};
  pack.hexes[1].entry='oathborn';
  const actions=legalActions(ready(pack));
  assert.ok(!actions.some(a=>a.type==='build'&&a.hexId==='h1'));
});
test('LoyalNeutral posture follows campaign when loyalty kingdom is absent (4.1.1/12.6)',()=>{
  const pack=fixture(); pack.hexes[2].settlement={name:'Farsund',loyalty:'assassins-guild',city:false,fortified:0,port:false,neutralFriendlyTo:['fjordland']};
  const s=ready(pack), h=s.hexes.find(h=>h.id==='h2');
  assert.equal(isWelcoming(s,h,'fjordland'),true);
  assert.equal(isWelcoming(s,h,'oathborn'),false);
});

for (const kingdom of ['fjordland','empire']) test(`${kingdom} Ship Movement can hand activation to a friendly ready Army`,()=>{
  const pack=fixture();
  pack.unitDefinitions[0].kingdom=kingdom;
  pack.scenario.kingdoms[0].id=kingdom;
  pack.scenario.turnOrder[0]=kingdom;
  pack.scenario.objective.kingdom=kingdom;
  pack.scenario.initialUnits.push({defId:'freeholders',hexId:'h1'});
  let s=ready(pack);
  const landing=legalActions(s).find(a=>a.type==='ship'&&a.unitId==='unit-1'&&a.toHex==='h1');
  assert.ok(landing);
  s=applyAction(s,landing);
  assert.equal(s.activeUnitId,'unit-2');
  assert.equal(s.units.find(u=>u.id==='unit-1').activated,true);
  assert.equal(s.units.find(u=>u.id==='unit-2').activated,false);
  assert.deepEqual(validateState(s),[]);
  assert.deepEqual(importGame(exportGame(s)),s);
  const departure=legalActions(s).find(a=>a.type==='move'&&a.unitId==='unit-2'&&a.toHex==='h2');
  assert.ok(departure);
  s=applyAction(s,departure);
  assert.deepEqual(validateState(s),[]);
});
