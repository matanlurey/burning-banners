import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions,botAction,validateState,exportGame,importGame} from '../dist/js/engine.js';
import {sendCampaignMessage} from '../dist/js/async-play.js';
import {chooseDifficultyAction,AI_DIFFICULTIES} from '../dist/js/ai.js';
import {fixture,active,give,placeHero,battle} from './fixtures/advanced.mjs';
const choose=(s,d='hard')=>chooseDifficultyAction(s,d,botAction(s));
function lane(){const c=fixture({profile:'basic'});c.hexes=Array.from({length:9},(_,i)=>({id:'H'+i,q:i,r:0,terrain:'clear'}));c.hexes[0].settlement={name:'Objective',loyalty:'fjordland',city:false,fortified:0,port:false};c.hexes[8].settlement={name:'Decoy',loyalty:'fjordland',city:false,fortified:0,port:false};c.scenario.initialUnits=[{defId:'army-b',hexId:'H4'},{defId:'army-a',hexId:'H8'}];c.scenario.turnOrder=['orcs','fjordland'];c.scenario.objective.hexIds=['H0'];c.scenario.kingdoms[1].gold=0;return c;}

test('three difficulty profiles remain deterministic, immutable, and legally playable through a complete campaign',()=>{
  assert.deepEqual(AI_DIFFICULTIES.map(d=>d.id),['easy','normal','hard']);
  for(const d of AI_DIFFICULTIES.map(d=>d.id)){
    let s=createGame(fixture({profile:'basic',seed:329})),steps=0;
    while(s.phase!=='game-over'&&steps++<400){const before=exportGame(s),a=choose(s,d),again=choose(importGame(before),d);assert.deepEqual(a,again);if(d==='hard')assert.deepEqual(a,chooseDifficultyAction(s,d,null));assert.equal(exportGame(s),before);assert.ok(legalActions(s).some(candidate=>JSON.stringify(candidate)===JSON.stringify(a)));s=applyAction(s,a);assert.deepEqual(validateState(s),[]);}
    assert.equal(s.phase,'game-over',d+' must terminate');
  }
});
test('Normal preserves the pre-existing policy and rejects a caller-supplied illegal fallback',()=>{
  const s=active({profile:'basic'}),fallback=botAction(s);assert.deepEqual(chooseDifficultyAction(s,'normal',fallback),fallback);
  const action=chooseDifficultyAction(s,'normal',{type:'move',unitId:'missing',toHex:'missing'});assert.ok(legalActions(s).some(a=>JSON.stringify(a)===JSON.stringify(action)));
});
test('Hard approaches the actual scenario objective rather than a closer non-scoring enemy',()=>{
  let s=applyAction(createGame(lane()),{type:'collect-income'});const a=choose(s);assert.equal(a.type,'move');assert.equal(a.unitId,'unit-1');assert.ok(Number(a.toHex.slice(1))<4,a.toHex+' must move toward H0');
});
test('Hard changes its plan when an imported scenario changes the victory target',()=>{
  const c=lane();c.scenario.objective.hexIds=['H8'];const s=applyAction(createGame(c),{type:'collect-income'}),a=choose(s);assert.equal(a.type,'move');assert.ok(Number(a.toHex.slice(1))>4,a.toHex+' must move toward H8');
});
test('Hard does not alter its choice from the hidden next dice seed or enemy hand contents',()=>{
  const s=applyAction(createGame(lane()),{type:'collect-income'}),before=choose(s);s.rng=1;assert.deepEqual(choose(s),before);s.rng=4294967295;assert.deepEqual(choose(s),before);
  const a=active();placeHero(a,'hero-fjordland-17','A','unit-1');give(a,'player-fjordland','spell-28');a.activeUnitId='unit-1';a.remainingMP=3;a.advanced.movement={'unit-1':3};const chosen=choose(a);a.advanced.hands['player-orcs']=['spell-15','spell-16','spell-19'];assert.deepEqual(choose(a),chosen);
});
test('Hard preserves an affordable Shashka final control marker',()=>{
  const c=lane();c.scenario.initialControls={H8:'orcs'};c.scenario.kingdoms[1].gold=1;const s=createGame(c);assert.ok(legalActions(s).some(a=>a.type==='lay-waste'));const a=choose(s);assert.notEqual(a.type,'lay-waste');
  // With another affordable control, an expendable marker can finance upkeep.
  s.controls.H0='orcs';const b=choose(s);assert.equal(b.type,'lay-waste');assert.equal(b.hexId,'H8','the objective must stay under control');
});
test('Hard avoids certain unpaid-upkeep collapse by razing when it is the only route to an activation',()=>{const c=lane();c.scenario.initialControls={H8:'orcs'};c.scenario.kingdoms[1].gold=0;let s=createGame(c);const a=choose(s);assert.equal(a.type,'lay-waste');s=applyAction(s,a);s=applyAction(s,choose(s));assert.equal(s.phase,'activation');assert.equal(s.kingdoms.find(k=>k.id==='orcs').collapsed,false);});
test('Hard keeps objective control when choosing a conquered settlement outcome',()=>{
  const s=active({profile:'basic'});s.currentKingdom='orcs';s.turnIndex=1;s.activeUnitId='unit-2';s.pendingCombat={attackerId:'unit-2',targetHex:'A',stage:'settlement',decisionKingdom:'orcs'};assert.deepEqual(choose(s),{type:'settlement',choice:'control'});
});
test('Hard allocates a lethal hit to a cheap Hero rather than a valuable weakened Army',()=>{
  const s=active();const u=s.units[0];s.unitDefinitions.find(d=>d.id==='army-a').cost=10;s.unitDefinitions.find(d=>d.id==='army-a').heavy=5;u.weakened=true;const hero=placeHero(s,'hero-fjordland-17','A',u.id);battle(s,{hits:1});assert.equal(choose(s).unitId,hero.id);
});
test('Hard chooses beneficial Magic targets; Easy skips the same legal reaction',()=>{
  let s=active();placeHero(s,'hero-fjordland-17','A','unit-1');give(s,'player-fjordland','spell-28');s.advanced.battle={kind:'battle',attacker:'unit-1',defender:'unit-2',targetHex:'C',attackerKingdom:'fjordland',defenderKingdom:'orcs',step:0,magicLifted:false,attackerRolls:[],defenderRolls:[],attackerSuccesses:0,defenderSuccesses:0,attackerHits:0,defenderHits:0,result:'draw',hitQueue:[]};s.advanced.pending={kind:'window',window:'battle',players:['player-fjordland'],index:0,step:0,resume:null};
  const a=choose(s);assert.ok(a.type==='play-card'||a.type==='hero-power');if(a.cardId==='spell-28')assert.ok(a.targetId==='unit-1'||a.targetId==='unit-3');assert.equal(choose(s,'easy').type,'magic-pass');
});
test('Hard avoids a costly two-card sacrifice when an ordinary no-cost Blessing is available',()=>{
  const s=active();placeHero(s,'hero-fjordland-17','A','unit-1');give(s,'player-fjordland','blessing-fjordland-04');give(s,'player-fjordland','spell-15');give(s,'player-fjordland','spell-17');give(s,'player-fjordland','blessing-fjordland-03');const a=choose(s);assert.notEqual(a.cardId,'blessing-fjordland-04');
});
test('Hard keeps Endless Satchel when Winter requires a sale and chooses the least valuable excess',()=>{
  const s=active();for(const id of ['treasure-02','treasure-14','treasure-17','treasure-18','treasure-20'])give(s,'player-fjordland',id);s.advanced.pending={kind:'winter',playerIndex:0};const a=choose(s);assert.equal(a.type,'sell-treasure');assert.notEqual(a.cardId,'treasure-02');s.advanced.hands['player-fjordland']=s.advanced.hands['player-fjordland'].filter(id=>id!==a.cardId);assert.equal(choose(s).type,'finish-winter');
});
test('Hard reduces dangerous Imperial revolts instead of spending the treasury on recruitment',()=>{
  const c=fixture({profile:'basic'});c.scenario.kingdoms[0].id='empire';c.scenario.kingdoms[0].name='Empire';c.scenario.kingdoms[0].revolt=14;c.scenario.turnOrder[0]='empire';c.unitDefinitions[0].kingdom='empire';c.hexes[0].settlement.loyalty='empire';c.scenario.empireRevoltModifier=6;const s=applyAction(createGame(c),{type:'collect-income'});assert.equal(choose(s).type,'suppress');
});

test('all three difficulties complete a supported Advanced campaign without illegal state or unfinished decision loops',()=>{
  for(const d of ['easy','normal','hard']){let s=createGame(fixture({seed:97})),steps=0;while(s.phase!=='game-over'&&steps++<900){const a=choose(s,d);assert.ok(a);s=applyAction(s,a);assert.deepEqual(validateState(s),[],d+' '+JSON.stringify(a));}assert.equal(s.phase,'game-over',d);}
});
test('Hard uses a non-sacrificial Counter before spending its Mage on Negation',()=>{
  const s=active();const mage=placeHero(s,'hero-fjordland-17','A','unit-1'),enemyMage=placeHero(s,'hero-orcs-15','C','unit-2');give(s,'player-fjordland','spell-15');give(s,'player-fjordland','treasure-03');give(s,'player-orcs','spell-08');s.units[0].weakened=true;
  s.advanced.pending={kind:'window',window:'reaction',players:['player-fjordland'],index:0,step:0,play:{cardId:'spell-08',playerId:'player-orcs',casterId:enemyMage.id,targetId:'unit-1'},resume:null};
  const a=choose(s);assert.equal(a.type,'play-card');assert.equal(a.cardId,'treasure-03');assert.equal(a.targetId,'player-orcs');assert.notEqual(a.casterId,mage.id);
});
test('Hard prioritizes a final-season scoring capture over Oathborn mining income',()=>{
  const c=fixture({profile:'basic'});c.unitDefinitions[0].kingdom='oathborn';c.unitDefinitions[0].name='Miners';c.unitDefinitions[0].light=0;c.unitDefinitions[0].heavy=8;c.scenario.kingdoms[0].id='oathborn';c.scenario.kingdoms[0].name='Oathborn';c.scenario.kingdoms[0].side='invader';c.scenario.kingdoms[0].gold=0;c.scenario.kingdoms[1].side='resistance';c.scenario.turnOrder[0]='oathborn';c.scenario.startSeason=2;c.scenario.endYear=1;c.hexes[0].settlement.loyalty='oathborn';c.hexes[1].mine=true;c.scenario.initialUnits[0].hexId='B';c.scenario.objective={type:'control',kingdom:'oathborn',hexIds:['C'],count:1,deadlineOnly:true};const s=applyAction(createGame(c),{type:'collect-income'});assert.ok(legalActions(s).some(a=>a.type==='mine'));assert.equal(choose(s).type,'attack');
});
test('Hard avoids a Feral force auto-razing a required control objective',()=>{
  const c=lane();c.scenario.initialUnits[0].hexId='H1';c.unitDefinitions.find(d=>d.id==='army-b').characteristics=['feral'];c.unitDefinitions.find(d=>d.id==='army-b').heavy=8;const s=applyAction(createGame(c),{type:'collect-income'});assert.ok(legalActions(s).some(a=>a.type==='attack'&&a.targetHex==='H0'));assert.notEqual(choose(s).type,'attack');
});

function coordinationFixture(){const c=lane();c.scenario.kingdoms.push({id:'empire',name:'Allied Empire',side:'invader',gold:4,income:1});c.scenario.turnOrder.push('empire');c.scenario.initialUnits=c.scenario.initialUnits.slice(0,1);c.scenario.objective.hexIds=['H0','H8'];return applyAction(createGame(c),{type:'collect-income'});}
test('Hard accepts a visible allied attack ping as a bounded tie-breaker between equally useful fronts',()=>{const s=coordinationFixture(),before=choose(s);assert.equal(before.type,'move');assert.ok(Number(before.toHex.slice(1))<4);const message=sendCampaignMessage(s,'empire','',{channel:'alliance',hexId:'H8',template:'attack'}),after=choose(message);assert.equal(after.type,'move');assert.ok(Number(after.toHex.slice(1))>4);});
test('Hard ignores both a hidden enemy alliance ping and a visible enemy table ping',()=>{const s=coordinationFixture(),before=choose(s);for(const channel of ['alliance','table']){const message=sendCampaignMessage(s,'fjordland','',{channel,hexId:'H8',template:'attack'});assert.deepEqual(choose(message),before);}});

test('Hard invaders reinforce a threatened held objective after achieving the control threshold',()=>{const c=lane();c.scenario.objective.hexIds=['H0','H8'];c.scenario.objective.count=2;c.scenario.initialControls={H0:'orcs',H8:'orcs'};c.scenario.kingdoms[1].gold=2;c.scenario.initialUnits[1].hexId='H1';const s=applyAction(createGame(c),{type:'collect-income'}),a=choose(s);assert.equal(a.type,'move');assert.ok(Number(a.toHex.slice(1))<4,a.toHex+' must support held H0 against the nearby threat');});

test('Hard and Easy never spend an action regenerating an enemy Army',()=>{const c=fixture({profile:'basic'});c.unitDefinitions[1].abilities=['regenerate'];c.scenario.initialUnits[1].weakened=true;const s=applyAction(createGame(c),{type:'collect-income'});assert.ok(legalActions(s).some(a=>a.type==='regenerate'&&a.unitId==='unit-2'));for(const d of ['easy','hard'])assert.notDeepEqual(choose(s,d),{type:'regenerate',unitId:'unit-2'});});
test('Hard decisions are independent of another kingdom’s secret Coven locations',()=>{const c=fixture({profile:'basic'});c.unitDefinitions[1].kingdom='night';c.scenario.kingdoms[1]={id:'night',name:'Night',side:'invader',gold:8,income:2,controlLimit:5};c.scenario.turnOrder[1]='night';c.hexes[2].settlement.loyalty='night';c.scenario.objective.kingdom='night';let s=applyAction(createGame(c),{type:'collect-income'}),before=choose(s);s.covens=['A'];assert.deepEqual(choose(s),before);s.covens=['C'];assert.deepEqual(choose(s),before);});

test('Hard respects a survival scenario by reinforcing its designated kingdom rather than chasing unrelated towns',()=>{const c=lane();c.hexes[0].settlement.loyalty='orcs';c.hexes[0].settlement.city=true;c.scenario.initialUnits[1].hexId='H1';c.scenario.objective={type:'survival',kingdom:'orcs',hexIds:[],count:0,deadlineOnly:true};const s=applyAction(createGame(c),{type:'collect-income'}),a=choose(s);assert.equal(a.type,'move');assert.ok(Number(a.toHex.slice(1))<4,a.toHex+' must support the surviving kingdom');});

function churn(s){s.advanced.pending={kind:'study',playerIndex:0,allowance:1,disciplines:[],marker:'churn'};return s;}
test('Hard replenishes Spells instead of wasting Churn on an already full-strength kingdom Blessing',()=>{const s=active();for(const id of [...s.advanced.hands['player-fjordland']].filter(id=>id.startsWith('spell-')))give(s,'player-orcs',id);const a=choose(churn(s));assert.equal(a.type,'study');assert.equal(a.discipline,'spells');assert.equal(a.discardId,undefined);});
test('Hard studies a missing kingdom Blessing using one-per-kingdom full strength',()=>{const s=active();for(const id of [...s.advanced.hands['player-fjordland']].filter(id=>id.startsWith('blessing-')))give(s,'player-orcs',id);const a=choose(churn(s));assert.equal(a.type,'study');assert.equal(a.discipline,'blessings');assert.equal(a.discardId,undefined);});
test('Hard cycles the least valuable Spell when studying at full strength',()=>{const s=active();for(const id of [...s.advanced.hands['player-fjordland']].filter(id=>id.startsWith('spell-')))give(s,'player-orcs',id);for(const id of ['spell-01','spell-15','spell-17'])give(s,'player-fjordland',id);const a=choose(churn(s));assert.equal(a.type,'study');assert.equal(a.discipline,'spells');assert.equal(a.discardId,'spell-01');});

test('Hard frees a ready Army from an exhausted Hero and continues moving rather than joining it back',()=>{let s=active();s.advanced.hands['player-fjordland']=[];const hero=placeHero(s,'hero-fjordland-13','A','unit-1');hero.activated=true;s.activeUnitId='unit-1';s.remainingMP=1;s.advanced.movement={'unit-1':1};assert.deepEqual(choose(s),{type:'drop-hero',unitId:hero.id});s=applyAction(s,choose(s));const a=choose(s);assert.equal(a.type,'move');assert.equal(a.unitId,'unit-1');assert.notEqual(a.type,'join-stack');});
