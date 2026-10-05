import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions,botAction,validateState,exportGame,importGame} from '../dist/js/engine.js';
import {chooseDifficultyAction} from '../dist/js/ai.js';
import {publishedCampaigns,compilePublishedCampaign} from '../dist/js/published-campaigns.js';
import {fixture} from './fixtures/advanced.mjs';
const choose=(s,d='hard')=>chooseDifficultyAction(s,d,s.phase==='opening'?null:botAction(s));
const legal=(s,a)=>legalActions(s).some(x=>JSON.stringify(x)===JSON.stringify(a));

assert.equal(publishedCampaigns.length,28);
for(const difficulty of ['easy','normal','hard'])for(const campaign of publishedCampaigns)test(`${campaign.id}/${difficulty}: legal recruiting and setup save/resume`,()=>{
    let s=createGame({...compilePublishedCampaign(campaign.id),seed:931}),steps=0;
    assert.equal(s.phase,'opening',campaign.id);
    // Review-copy discrepancies need a human decision. The test table chooses
    // its first documented option explicitly; the AI must leave that choice alone.
    while(s.phase==='opening'&&steps++<160){
      const before=exportGame(s),actions=legalActions(s);let a=choose(s,difficulty);
      if(actions.some(x=>x.type==='opening-choice')){assert.equal(a,null);a=actions[0];}
      assert.ok(a,`${campaign.id}/${difficulty}: no setup action`);
      assert.ok(actions.some(x=>JSON.stringify(x)===JSON.stringify(a)),`${campaign.id}/${difficulty}: illegal ${JSON.stringify(a)}`);
      if(steps===3){const resumed=importGame(before);assert.deepEqual(choose(resumed,difficulty),choose(s,difficulty));assert.equal(exportGame(resumed),before);}
      assert.equal(exportGame(s),before,'decision must not mutate a save');
      s=applyAction(s,a);assert.deepEqual(validateState(s),[],`${campaign.id}/${difficulty}: ${JSON.stringify(a)}`);
    }
    assert.notEqual(s.phase,'opening',`${campaign.id}/${difficulty}: setup loop`);
    assert.ok(s.units.length,`${campaign.id}/${difficulty}: empty army`);
    assert.equal(exportGame(importGame(exportGame(s))),exportGame(s),`${campaign.id}/${difficulty}: post-setup import`);
    assert.ok(s.kingdoms.every(k=>k.gold>=0));
});

function sourceLane(condition,{winner='invader',metric='condition'}={}){
  const c=fixture({profile:'basic'});
  c.hexes=Array.from({length:9},(_,i)=>({id:'H'+i,q:i,r:0,terrain:'clear'}));
  c.hexes[0].settlement={name:'Scoring port',loyalty:'fjordland',city:false,fortified:0,port:false};
  c.hexes[8].settlement={name:'Decoy',loyalty:'fjordland',city:false,fortified:0,port:false};
  c.scenario.initialUnits=[{defId:'army-b',hexId:'H4'}];c.scenario.initialControls={};
  c.scenario.turnOrder=['orcs','fjordland'];c.scenario.kingdoms.forEach(k=>k.gold=0);
  c.scenario.objective={type:'control',hexIds:['H8'],count:1};
  let s=applyAction(createGame(c),{type:'collect-income'});
  s.scenario.sourceCampaign={series:'scroll',deploymentOrder:[['orcs'],['fjordland']],opening:[],specialRules:[],victory:{deadline:metric==='condition'?{type:'condition',condition,winner,otherwise:winner==='invader'?'resistance':'invader'}:condition}};
  return s;
}

test('Hard and Normal follow the published occupation target even when the legacy objective points elsewhere',()=>{
  for(const d of ['normal','hard']){
    const s=sourceLane({type:'count',metric:'occupied',side:'invader',hexIds:['H0'],atLeast:1}),a=choose(s,d);
    assert.equal(a.type,'move');assert.ok(Number(a.toHex.slice(1))<4,`${d}: ${a.toHex}`);
  }
});
test('Hard directs a town race toward the printed loyalty filter and obeys deadline tie scopes',()=>{
  const s=sourceLane({type:'count',metric:'controlled',side:'invader',loyalties:['empire'],atLeast:1});
  s.hexes[0].settlement.loyalty='empire';assert.ok(Number(choose(s).toHex.slice(1))<4);
  const race=sourceLane({type:'score',metric:'settlements',tieWinner:'resistance',hexIds:['H0']},{metric:'score'});
  assert.ok(Number(choose(race).toHex.slice(1))<4);
});
test('Hard allows a Feral Army to pursue a source objective that explicitly counts razed settlements',()=>{
  const s=sourceLane({type:'count',metric:'controlled-or-razed',side:'invader',hexIds:['H0'],atLeast:1});
  s.units[0].hexId='H1';const d=s.unitDefinitions.find(d=>d.id==='army-b');d.characteristics=['feral'];d.heavy=8;
  assert.equal(choose(s).type,'attack');
  s.scenario.sourceCampaign.victory.deadline.condition.metric='markers';assert.notEqual(choose(s).type,'attack');
});
test('Hard preserves the last Army presence contributing to a source deadline',()=>{
  const s=sourceLane({type:'count',metric:'presence',kingdoms:['orcs'],hexIds:['H0','H8'],atLeast:2});
  s.units[0].hexId='H0';s.activeUnitId=s.units[0].id;s.remainingMP=3;
  assert.ok(['pass','end-turn'].includes(choose(s).type));
});
test('Hard supports the correct allied banner instead of stealing its exclusive marker objective',()=>{
  const s=sourceLane({type:'count',metric:'markers',kingdoms:['night'],hexIds:['H0'],atLeast:1});
  s.kingdoms.push({id:'night',name:'Night',side:'invader',gold:0,income:0,collapsed:false});
  s.units[0].hexId='H1';s.unitDefinitions.find(d=>d.id==='army-b').heavy=8;
  assert.ok(legalActions(s).some(a=>a.type==='attack'));assert.notEqual(choose(s).type,'attack');
});
test('Hard pursues the final Shashka marker for a printed collapse objective',()=>{
  const s=sourceLane({type:'collapse',kingdoms:['goblins']});
  s.kingdoms.push({id:'goblins',name:'Goblins',side:'resistance',gold:0,income:0,collapsed:false});
  s.controls.H0='goblins';
  const a=choose(s);assert.equal(a.type,'move');assert.ok(Number(a.toHex.slice(1))<4);
});
test('Hard considers a hostile nonplayer City for a source occupation victory',()=>{
  const s=sourceLane({type:'enemy-city-occupied',side:'invader'});
  s.hexes[0].settlement.loyalty='mara-mitai';s.hexes[0].settlement.city=true;
  const a=choose(s);assert.equal(a.type,'move');assert.ok(Number(a.toHex.slice(1))<4);
});
test('Hard pursues a standing City instead of a nearby ruin for the printed hostile City victory',()=>{
  const s=sourceLane({type:'enemy-city-occupied',side:'invader'});
  for(const h of [s.hexes[0],s.hexes[8]]){h.settlement.city=true;h.settlement.loyalty='mara-mitai';}
  s.razed=['H0'];s.units[0].hexId='H1';
  const a=choose(s);assert.equal(a.type,'move');assert.ok(Number(a.toHex.slice(1))>1,`ruined City cannot satisfy the victory: ${a.toHex}`);
});
test('Hard chooses funded Shashka razing when the published goal counts razed towns equally',()=>{
  const s=sourceLane({type:'count',metric:'controlled-or-razed',side:'invader',hexIds:['H0'],atLeast:1});
  s.controls.H8='orcs';s.kingdoms.find(k=>k.id==='orcs').hasEverControlled=true;
  s.pendingCombat={attackerId:s.units[0].id,targetHex:'H0',stage:'settlement',decisionKingdom:'orcs'};
  assert.deepEqual(choose(s),{type:'settlement',choice:'raze'});
});
test('Hard suppresses even a small revolt when net income determines the campaign score',()=>{
  const s=sourceLane({type:'score',metric:'income',tieWinner:'invader',deductRevolts:true},{metric:'score'});
  const k=s.kingdoms.find(k=>k.id==='orcs');k.id='empire';k.name='Empire';k.gold=3;k.revolt=2;
  s.currentKingdom='empire';s.scenario.turnOrder[0]='empire';s.units[0].kingdom='empire';s.unitDefinitions.find(d=>d.id==='army-b').kingdom='empire';
  s.units[0].activated=true;
  assert.ok(legalActions(s).some(a=>a.type==='suppress'));assert.equal(choose(s).type,'suppress');
});
test('C12 completes every kingdom first turn without a Hero finishing its Huge Army in a friendly town',()=>{
  let s=createGame({...compilePublishedCampaign('campaign-12'),seed:931}),steps=0;
  while(s.phase!=='game-over'&&s.turnSerial<=s.kingdoms.length&&steps++<600){
    const actions=legalActions(s);let a=choose(s);
    if(actions.some(x=>x.type==='opening-choice')){assert.equal(a,null);a=actions[0];}
    assert.ok(a,`C12 action ${steps}: ${s.currentKingdom}/${s.phase} stalled`);
    assert.ok(legal(s,a));s=applyAction(s,a);assert.deepEqual(validateState(s),[]);
  }
  assert.ok(s.phase==='game-over'||s.turnSerial>s.kingdoms.length,'the complete first round must finish');
});
test('Chronicle 8 recruits its restricted contingent at every difficulty and completes the Hard first round',()=>{
  for(const difficulty of ['easy','normal','hard']){
    let s=createGame({...compilePublishedCampaign('chronicle-8'),seed:931}),steps=0;
    while(s.phase==='opening'&&steps++<180){
      const actions=legalActions(s);let a=choose(s,difficulty);
      if(actions.some(x=>x.type==='opening-choice')){assert.equal(a,null);a=actions[0];}
      assert.ok(a,`Chronicle8/${difficulty}: recruitment stalled`);assert.ok(legal(s,a));
      s=applyAction(s,a);assert.deepEqual(validateState(s),[]);
    }
    assert.notEqual(s.phase,'opening',difficulty);
    assert.equal(s.units.filter(u=>u.kingdom==='empire'&&u.defId.startsWith('fjord-')).length,2,'both free Armies must belong to the Empire');
    if(difficulty==='hard'){
      while(s.phase!=='game-over'&&s.turnSerial<=s.kingdoms.length&&steps++<700){
        const a=choose(s);assert.ok(a,'the first round must have a legal continuation');s=applyAction(s,a);assert.deepEqual(validateState(s),[]);
      }
      assert.ok(s.phase==='game-over'||s.turnSerial>s.kingdoms.length,'the full first round must finish');
    }
  }
});
