import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, applyAction, legalActions, moveOptions, shipOptions, validateState, exportGame, importGame} from '../dist/js/engine.js';
import {validateContentPack} from '../dist/js/content-validation.js';

// Synthetic routes isolate printed movement rules; these are not official maps.
// Sources: Undying Rules v1.1 §§8.1.2–8.1.6, 8.2.1 and 12.5.2.
const settlement = (name, port=false) => ({name, loyalty:'oathborn', city:false, fortified:0, port});
function fixture(hexes, {kingdom='oathborn', profile='basic', abilities=[]}={}) {
  return {
    hexes,
    unitDefinitions:[{id:'test-army',name:'Route test Army',kingdom,cost:2,recoveryCost:1,movement:4,light:1,heavy:0,count:2,abilities,characteristics:[]}],
    scenario:{id:'shipping-regression',name:'Synthetic shipping routes',official:false,source:'Undying Rules v1.1 §§8.1.2–8.1.6 and 12.5.2; synthetic diagnostic geometry',startYear:1,startSeason:0,endYear:1,endSeason:2,turnOrder:[kingdom,'orcs'],kingdoms:[{id:kingdom,name:kingdom,side:'resistance',gold:8,income:0},{id:'orcs',name:'Orcs',side:'invader',gold:8,income:0}],initialUnits:[{defId:'test-army',hexId:'A'}],objective:{type:'survival',kingdom:'orcs',hexIds:[],count:0,deadlineOnly:true}},
    profile,seed:20261005,
  };
}
function connect(hexes, from, to, edge) {
  const a=hexes.find(h=>h.id===from), b=hexes.find(h=>h.id===to);
  (a.edges??={})[to]={...edge};(b.edges??={})[from]={...edge};return hexes;
}
const active = config => applyAction(createGame(config),{type:'collect-income'});
const destination = (s,id) => shipOptions(s,'unit-1').find(o=>o.hexId===id);
function passWindows(s) {
  for(let count=0;s.advanced?.pending?.kind==='window';count++) {
    assert.ok(count<30,'movement response windows should finish');
    const pass=legalActions(s).find(a=>a.type==='magic-pass');assert.ok(pass);s=applyAction(s,pass);
  }
  return s;
}

test('Coastal hexes do not create shipping channels across a land side',()=>{
  const hexes=[{id:'A',q:0,r:0,terrain:'clear',coastal:true},{id:'B',q:1,r:0,terrain:'forest',coastal:true}];
  let s=active(fixture(hexes));assert.equal(destination(s,'B'),undefined);
  assert.ok(moveOptions(s,'unit-1').some(o=>o.hexId==='B'),'ordinary movement can cross the land side');
  connect(hexes,'A','B',{coastal:true});s=active(fixture(hexes));
  assert.deepEqual(destination(s,'B')?.path,['B'],'a traced Coastal side permits shipping');
});

test('shipping follows Major River hexes along a bank without crossing a River side',()=>{
  const hexes=[{id:'A',q:0,r:0,terrain:'major-river'},{id:'B',q:1,r:0,terrain:'major-river'},{id:'C',q:2,r:0,terrain:'major-river'}];
  const s=active(fixture(hexes));assert.deepEqual(destination(s,'C')?.path,['B','C']);
  assert.equal(destination(s,'C')?.cost,2,'each bank-to-bank step costs one Ship MP');
});

test('a traced Major River course preserves Wilderness costs and rejects untraced neighboring banks',()=>{
  const hexes=[{id:'A',q:0,r:0,terrain:'clear',majorRiver:true},{id:'B',q:1,r:0,terrain:'swamp',majorRiver:true},{id:'C',q:2,r:0,terrain:'forest',majorRiver:true},{id:'D',q:1,r:-1,terrain:'clear',majorRiver:true}];
  connect(hexes,'A','B',{waterway:true});connect(hexes,'B','C',{waterway:true});
  const config=fixture(hexes),pack=validateContentPack({version:1,hexes:config.hexes,unitDefinitions:config.unitDefinitions,scenario:config.scenario});
  assert.equal(pack.hexes.find(h=>h.id==='B').terrain,'swamp');assert.equal(pack.hexes.find(h=>h.id==='B').majorRiver,true);
  const s=active(config);assert.equal(moveOptions(s,'unit-1').find(o=>o.hexId==='B')?.cost,2,'river overlay does not erase Swamp movement cost');
  assert.deepEqual(destination(s,'C')?.path,['B','C']);assert.equal(destination(s,'D'),undefined,'Major River overlays alone cannot infer a river course');
  const restored=importGame(exportGame(s));assert.deepEqual(restored.hexes,s.hexes);assert.deepEqual(destination(restored,'C'),destination(s,'C'));
});

test('river overlays and waterway edges reject nonboolean and asymmetric imported properties',()=>{
  const hexes=[{id:'A',q:0,r:0,terrain:'clear',majorRiver:true},{id:'B',q:1,r:0,terrain:'swamp',majorRiver:true}];connect(hexes,'A','B',{waterway:true});
  const config=fixture(hexes),pack={version:1,hexes,unitDefinitions:config.unitDefinitions,scenario:config.scenario};
  const badFlag=structuredClone(pack);badFlag.hexes[0].majorRiver='yes';assert.throws(()=>validateContentPack(badFlag),/Expected a boolean/);
  const badEdge=structuredClone(pack);badEdge.hexes[1].edges.A.waterway=false;assert.throws(()=>validateContentPack(badEdge),/Reciprocal edge properties disagree/);
  const badType=structuredClone(pack);badType.hexes[0].edges.B.waterway=1;assert.throws(()=>validateContentPack(badType),/Expected a boolean/);
});

for(const landing of ['coastal','major-river']) for(const river of [1,2]) {
  test(`crossing a ${river===1?'River':'Major River'} side stops shipping at a ${landing} landing`,()=>{
    const hexes=[{id:'A',q:0,r:0,terrain:'major-river'},{id:'B',q:1,r:0,terrain:landing},{id:'C',q:2,r:0,terrain:landing}];
    connect(hexes,'A','B',{river});if(landing==='coastal')connect(hexes,'B','C',{coastal:true});
    const s=active(fixture(hexes));assert.deepEqual(destination(s,'B')?.path,['B']);assert.equal(destination(s,'B')?.cost,1);
    assert.equal(destination(s,'C'),undefined,'remaining Ship MP cannot continue past the crossing');
    assert.throws(()=>applyAction(s,{type:'ship',unitId:'unit-1',toHex:'C'}),/Illegal action/);
  });
}

test('a Sea side overrides a river-side landing and permits continued shipping',()=>{
  const hexes=[{id:'A',q:0,r:0,terrain:'coastal'},{id:'B',q:1,r:0,terrain:'coastal'},{id:'C',q:2,r:0,terrain:'coastal'}];
  connect(hexes,'A','B',{sea:true,river:2});connect(hexes,'B','C',{coastal:true});
  const s=active(fixture(hexes));assert.deepEqual(destination(s,'C')?.path,['B','C']);
});

test('the printed Major River course continues across its bank modifiers; leaving the course stops the Ship Move',()=>{
  // Undying Rules §8.1.6, p18: A→Nal Narag→the next river hex→B.
  // River penalties also mark these bank sides. The waterway trace identifies
  // following the course, while the branch to C actually crosses the river.
  const hexes=[{id:'A',q:0,r:0,terrain:'clear',majorRiver:true,settlement:settlement('Departure port',true)},{id:'Nal',q:1,r:0,terrain:'clear',majorRiver:true,settlement:settlement('Nal Narag')},{id:'Step',q:2,r:0,terrain:'swamp',majorRiver:true},{id:'B',q:3,r:0,terrain:'clear',majorRiver:true},{id:'C',q:2,r:-1,terrain:'clear'},{id:'D',q:3,r:-1,terrain:'coastal'}];
  connect(hexes,'A','Nal',{river:2,waterway:true});connect(hexes,'Nal','Step',{river:2,waterway:true});connect(hexes,'Step','B',{waterway:true});connect(hexes,'Step','C',{river:2});
  const s=active(fixture(hexes));assert.deepEqual(destination(s,'B')?.path,['Nal','Step','B']);assert.equal(destination(s,'B')?.cost,3);
  assert.deepEqual(destination(s,'C')?.path,['Nal','Step','C'],'the actual river crossing remains a legal final step');
  connect(hexes,'C','D',{coastal:true});const withBranch=active(fixture(hexes));assert.equal(destination(withBranch,'D'),undefined,'the branch cannot continue the same Ship Move despite its remaining port MP');
});

for(const profile of ['basic','advanced']) for(const kingdom of ['oathborn','fjordland']) {
  test(`${profile}: a river landing ends the Ship Move; ${kingdom==='fjordland'?'Fjordland retains its Free Action activation':'an ordinary Army finishes'}`,()=>{
    const hexes=[{id:'A',q:0,r:0,terrain:'major-river'},{id:'B',q:1,r:0,terrain:'forest'},{id:'C',q:2,r:0,terrain:'coastal'}];
    connect(hexes,'A','B',{river:1});connect(hexes,'B','C',{coastal:true});
    let s=active(fixture(hexes,{kingdom,profile}));assert.ok(destination(s,'B'),'a river crossing may land in an inland hex');assert.equal(destination(s,'C'),undefined);
    s=applyAction(s,{type:'ship',unitId:'unit-1',toHex:'B'});
    if(profile==='advanced') {s=importGame(exportGame(s));s=passWindows(s);}
    assert.equal(s.units[0].hexId,'B');assert.equal(s.units[0].activated,kingdom!=='fjordland');
    assert.equal(s.activeUnitId,kingdom==='fjordland'?'unit-1':null);
    assert.equal(shipOptions(s,'unit-1').length,0,'one Ship Move cannot be restarted after the crossing');
    assert.equal(validateState(s).length,0);
    if(kingdom==='fjordland')assert.ok(legalActions(s).some(a=>a.type==='pass'&&a.unitId==='unit-1'),'Fjordland can still choose its ordinary action');
  });
}

test('Ship MP is determined by the departure: three normally, six from a welcoming Port or Entry hex',()=>{
  const hexes=Array.from({length:7},(_,i)=>({id:i===0?'A':`H${i}`,q:i,r:0,terrain:'coastal'}));
  for(let i=0;i<hexes.length-1;i++)connect(hexes,hexes[i].id,hexes[i+1].id,{coastal:true});
  hexes[2].settlement=settlement('Passing port',true);
  let s=active(fixture(hexes));assert.equal(destination(s,'H3')?.cost,3);assert.equal(destination(s,'H4'),undefined,'a passing Port does not replenish the Ship MP budget');
  hexes[0].settlement=settlement('Departure port',true);s=active(fixture(hexes));assert.equal(destination(s,'H6')?.cost,6);
  delete hexes[0].settlement;hexes[0].entry='oathborn';s=active(fixture(hexes));assert.equal(destination(s,'H6')?.cost,6);
});

test('normal movement crosses Coastal sides but cannot cross Sea sides; Flying may pass over Sea',()=>{
  const hexes=[{id:'A',q:0,r:0,terrain:'clear',coastal:true},{id:'B',q:1,r:0,terrain:'forest',coastal:true},{id:'C',q:2,r:0,terrain:'sea'},{id:'D',q:3,r:0,terrain:'clear',coastal:true}];
  connect(hexes,'A','B',{coastal:true});connect(hexes,'B','C',{sea:true});connect(hexes,'C','D',{sea:true});
  let s=active(fixture(hexes));assert.equal(moveOptions(s,'unit-1').find(o=>o.hexId==='B')?.cost,2);
  assert.equal(moveOptions(s,'unit-1').some(o=>['C','D'].includes(o.hexId)),false);
  assert.ok(destination(s,'D'),'shipping can sail through Sea hexes to a legal landing');assert.equal(destination(s,'C'),undefined,'shipping may not stop at Sea');
  s=active(fixture(hexes,{abilities:['flying']}));assert.deepEqual(moveOptions(s,'unit-1').find(o=>o.hexId==='D')?.path,['B','C','D']);assert.equal(moveOptions(s,'unit-1').some(o=>o.hexId==='C'),false,'Flying also cannot stop at Sea');
});
