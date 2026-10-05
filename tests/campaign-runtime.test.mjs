import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions,isWelcoming,validateState,exportGame,importGame} from '../dist/js/engine.js';
import {validateContentPack} from '../dist/js/content-validation.js';
import {campaignVictory,campaignCondition} from '../dist/js/campaign-runtime.js';
import {effectiveDefinition} from '../dist/js/advanced.js';

// Small synthetic maps isolate campaign calendar and posture rules. They are
// diagnostic fixtures, not reconstructions of any published campaign setup.
const army=(id,kingdom,extra={})=>({id,name:id,kingdom,cost:2,recoveryCost:1,movement:3,light:1,heavy:0,count:2,abilities:[],characteristics:[],...extra});
const village=(name,loyalty=null,neutralFriendlyTo=[])=>({name,loyalty,neutralFriendlyTo,city:false,fortified:0,port:false});
function fixture({hexes,rules={},initialUnits=[],initialControls={},startYear=598,startSeason=2,endYear=600}={}){
  return {hexes:hexes??[{id:'Spire',q:0,r:0,terrain:'clear',settlement:village('Spire','night')},{id:'Road',q:1,r:0,terrain:'clear'},{id:'Imperial',q:-1,r:0,terrain:'clear',settlement:village('Imperial','empire')}],unitDefinitions:[army('night-army','night'),army('empire-army','empire'),army('fjord-army','fjordland'),army('campaign-osterlich','night',{cost:0,count:1,characteristics:['fragile']})],profile:'basic',seed:731,scenario:{id:'calendar-regression',name:'Synthetic campaign rules',official:false,source:'Published campaign calendar and Undying Rules; diagnostic geometry',startYear,startSeason,endYear,endSeason:1,turnOrder:['night','empire'],kingdoms:[{id:'night',name:'Night',side:'invader',gold:12,income:0},{id:'empire',name:'Empire',side:'resistance',gold:12,income:0}],initialUnits,initialControls,objective:{type:'survival',kingdom:'night',hexIds:[],count:0,deadlineOnly:true},sourceCampaign:{series:'chronicle',deploymentOrder:[['night'],['empire']],opening:[{kingdom:'night',gold:12},{kingdom:'empire',gold:12}],specialRules:[{type:'no-collapse',kingdoms:['night','empire']}],victory:{deadline:{type:'score',metric:'settlements',tieWinner:'resistance'}},...rules}}};
}
function finishOpening(s){for(let n=0;s.phase==='opening';n++){assert.ok(n<20);const done=legalActions(s).find(a=>a.type==='opening-done');assert.ok(done);s=applyAction(s,done);}return s;}
function finishSeason(s){for(let n=0;s.season===2;n++){assert.ok(n<10);const a=legalActions(s).find(a=>a.type==='collect-income')??legalActions(s).find(a=>a.type==='end-turn');assert.ok(a);s=applyAction(s,a);}return s;}
const roundtrip=s=>{assert.deepEqual(validateState(s),[]);assert.equal(exportGame(importGame(exportGame(s))),exportGame(s));};

test('a nonparticipant Control changes allegiance while preserving the printed neutral posture',()=>{
  const config=fixture({hexes:[{id:'Megas',q:0,r:0,terrain:'clear',settlement:village('Megas',null,['empire'])}],rules:{nonplayerControls:{Megas:'fjordland'},nonplayerAllies:{fjordland:['night']}}});
  let s=createGame(config),h=s.hexes[0];assert.equal(s.controls.Megas,'fjordland');assert.equal(h.settlement.loyalty,null);assert.deepEqual(h.settlement.neutralFriendlyTo,['empire']);
  assert.equal(isWelcoming(s,h,'night'),true);assert.equal(isWelcoming(s,h,'empire'),false);assert.equal(isWelcoming(s,h,'empire',true),true);
  s=finishOpening(s);delete s.controls.Megas;assert.equal(isWelcoming(s,s.hexes[0],'empire'),true);assert.equal(isWelcoming(s,s.hexes[0],'night'),false);roundtrip(s);
});

test('an explicit source entry choice survives save/import and rejects unknown map or kingdom references',()=>{
  const config=fixture({rules:{preChoices:[{id:'entry',label:'Resolve a disputed edge',options:[{value:'upper',label:'Upper road',entries:{Road:'night'}},{value:'lower',label:'Lower road',entries:{Imperial:'night'}}]}]}});
  let s=createGame(config);s=applyAction(s,{type:'opening-choice',choiceId:'entry',value:'upper'});assert.equal(s.hexes.find(h=>h.id==='Road').entry,'night');assert.equal(s.hexes.find(h=>h.id==='Imperial').entry,undefined);assert.equal(s.opening.choices.entry,'upper');roundtrip(s);
  for(const entries of [{Missing:'night'},{Road:'missing'}]){const invalid=structuredClone(config);invalid.scenario.sourceCampaign.preChoices[0].options[0].entries=entries;assert.throws(()=>validateContentPack({version:1,hexes:invalid.hexes,unitDefinitions:invalid.unitDefinitions,scenario:invalid.scenario}),/Unknown reference/);}
});

for(const occupied of [false,true])test(`Basic Winter places the Bitter End defender${occupied?' after a saved displacement choice':''} and starts the next Spring`,()=>{
  const initialUnits=occupied?[{defId:'night-army',hexId:'Spire'}]:[];
  let s=finishOpening(createGame(fixture({initialUnits,rules:{chronicle:{book:3,chapter:10,historicalStartYear:598,bitterDefender:{defId:'campaign-osterlich',hexId:'Spire',kingdom:'night',winterYear:598}}}})));
  assert.ok(!legalActions(s).some(a=>a.type==='build'&&a.defId==='campaign-osterlich'));s=finishSeason(s);assert.equal(s.year,599);assert.equal(s.season,0);
  if(occupied){assert.equal(s.campaignRuntime.pendingBitterDisplacement,'unit-1');assert.equal(s.campaignRuntime.bitterPlaced,undefined);roundtrip(s);s=applyAction(importGame(exportGame(s)),{type:'campaign-displace',toHex:'Road'});assert.equal(s.units.find(u=>u.id==='unit-1').hexId,'Road');}
  assert.ok(s.campaignRuntime.bitterPlaced);assert.equal(s.phase,'income-actions');assert.equal(s.currentKingdom,'night');assert.equal(s.campaignRuntime.beginTurnAfterEvent,undefined);assert.ok(s.units.some(u=>u.defId==='campaign-osterlich'&&u.hexId==='Spire'));assert.ok(!s.campaignRuntime.pendingAbandon?.length,'Advanced abandoned-lair choices are absent in Basic');roundtrip(s);
});

test('an anchored defender can attack wilderness Armies but cannot choose a forced Settlement advance',()=>{
  const config=fixture({initialUnits:[{defId:'empire-army',hexId:'Road'}],rules:{specialRules:[{type:'no-collapse',kingdoms:['night','empire']},{type:'fragile-defender',defId:'campaign-osterlich',hexId:'Spire',kingdom:'night'}]}});
  let s=finishOpening(createGame(config));s=applyAction(s,{type:'collect-income'});const defender=s.units.find(u=>u.defId==='campaign-osterlich');
  assert.ok(legalActions(s).some(a=>a.type==='attack'&&a.unitId===defender.id&&a.targetHex==='Road'));assert.ok(!legalActions(s).some(a=>a.type==='attack'&&a.unitId===defender.id&&a.targetHex==='Imperial'));assert.ok(!legalActions(s).some(a=>['move','ship'].includes(a.type)&&a.unitId===defender.id));
  const corrupt=structuredClone(s);corrupt.units.find(u=>u.id===defender.id).hexId='Road';assert.ok(validateState(corrupt).some(i=>/Anchored defender/.test(i)));roundtrip(s);
});

for(const lead of [0,1,2])test(`First Among Equals: a ${lead}-marker Night lead keeps the shared victory and selects the printed individual winner`,()=>{
  const config=fixture({hexes:Array.from({length:5},(_,i)=>({id:`H${i}`,q:i,r:0,terrain:'clear',settlement:village(`H${i}`)})),rules:{competitiveInvaders:{leadKingdom:'night',otherKingdom:'orcs',requiredMarkerLead:2},victory:{deadline:{type:'score',metric:'markers',tieWinner:'invader'}}}});
  config.unitDefinitions.push(army('orc-army','orcs'));config.scenario.kingdoms.push({id:'orcs',name:'Orcs',side:'invader',gold:0,income:0});config.scenario.turnOrder.push('orcs');config.scenario.sourceCampaign.deploymentOrder.push(['orcs']);config.scenario.sourceCampaign.opening.push({kingdom:'orcs',gold:0});
  const s=createGame(config);s.controls={H0:'orcs',H1:'night'};for(let i=0;i<lead;i++)s.controls[`H${i+2}`]='night';
  const result=campaignVictory(s,'deadline');assert.equal(result.winner,'invader');assert.match(result.reason,new RegExp(`First Among Equals: ${lead>=2?'Night':'Orcs'} wins individually`));
  delete s.scenario.sourceCampaign.competitiveInvaders;assert.doesNotMatch(campaignVictory(s,'deadline').reason,/First Among Equals/);
});

test('published campaign foreign-contingent restrictions preserve the mandatory cross-faction Enslave stack',()=>{
  const config=fixture({initialUnits:[{defId:'empire-army',hexId:'Road'}]});config.profile='advanced';let s=finishOpening(createGame(config));
  const enslaved=s.units.find(u=>u.defId==='empire-army'),hero=s.advanced.heroPools.night.shift();assert.ok(hero);enslaved.kingdom='night';
  const heroUnit={id:`unit-${s.serial++}`,defId:hero,kingdom:'night',hexId:'Road',weakened:false,activated:false};s.units.push(heroUnit);s.advanced.enslaved={[enslaved.id]:'empire'};s.advanced.stacks[heroUnit.id]=enslaved.id;
  roundtrip(s);delete s.advanced.enslaved;assert.ok(validateState(s).some(i=>/wrong Kingdom|Invalid Hero stack/.test(i)),'An unsupported foreign stack still fails validation');
});

for(const nativeArmies of [0,2])test(`Strongheart respects the fixed defender’s printed Kingdom with ${nativeArmies} eligible Oathborn Armies`,()=>{
  const config=fixture({initialUnits:nativeArmies?[{defId:'oath-army',hexId:'Road'},{defId:'oath-army',hexId:'Far'}]:[],rules:{specialRules:[{type:'no-collapse',kingdoms:['night','empire','oathborn']},{type:'fixed-defender',defId:'fjord-army',hexId:'Spire',actingKingdom:'oathborn'}]}});
  config.profile='advanced';config.hexes.push({id:'Far',q:2,r:0,terrain:'clear'});config.unitDefinitions.push(army('oath-army','oathborn'));config.scenario.kingdoms.push({id:'oathborn',name:'Oathborn',side:'resistance',gold:0,income:0});config.scenario.turnOrder=['oathborn','night','empire'];config.scenario.sourceCampaign.deploymentOrder=[['oathborn'],['night'],['empire']];config.scenario.sourceCampaign.opening.push({kingdom:'oathborn',gold:0});
  let s=finishOpening(createGame(config));s=applyAction(s,{type:'collect-income'});const p=s.advanced.players.find(p=>p.kingdoms.includes('oathborn')).id;
  for(const groups of [s.advanced.decks,s.advanced.discards,s.advanced.hands,s.advanced.owned])for(const [id,pile] of Object.entries(groups))groups[id]=pile.filter(id=>id!=='blessing-oathborn-09');s.advanced.hands[p].push('blessing-oathborn-09');
  const play=legalActions(s).find(a=>a.type==='play-card'&&a.cardId==='blessing-oathborn-09'&&a.choice==='1'&&a.targetId===p);
  if(!nativeArmies){assert.equal(play,undefined,'A fixed foreign defender cannot be the only destination for a gained Oathborn Hero');roundtrip(s);return;}
  assert.ok(play);s=applyAction(s,play);for(let n=0;s.advanced.pending?.kind==='window';n++){assert.ok(n<40);s=applyAction(s,legalActions(s).find(a=>a.type==='magic-pass'));}
  const choices=legalActions(s).filter(a=>a.type==='magic-choice');assert.deepEqual(new Set(choices.map(a=>a.value)),new Set(['Road','Far']));assert.ok(!choices.some(a=>a.value==='Spire'));
  s=applyAction(s,choices.find(a=>a.value==='Road'));const hero=s.units.find(u=>u.hexId==='Road'&&s.unitDefinitions.find(d=>d.id===u.defId).kind==='hero');assert.ok(hero);assert.equal(s.advanced.stacks[hero.id],s.units.find(u=>u.hexId==='Road'&&u.defId==='oath-army').id);assert.ok(!s.units.some(u=>u.hexId==='Spire'&&s.unitDefinitions.find(d=>d.id===u.defId).kind==='hero'));roundtrip(s);
});

test('magic gained Heroes retain the explicit Enslave exception to printed Kingdom stacking',()=>{
  const config=fixture({initialUnits:[{defId:'empire-army',hexId:'Road'}]});config.profile='advanced';let s=finishOpening(createGame(config));s=applyAction(s,{type:'collect-income'});
  const captured=s.units.find(u=>u.defId==='empire-army');captured.kingdom='night';s.advanced.enslaved={[captured.id]:'empire'};const p=s.advanced.players.find(p=>p.kingdoms.includes('night')).id;
  for(const groups of [s.advanced.decks,s.advanced.discards,s.advanced.hands,s.advanced.owned])for(const [id,pile] of Object.entries(groups))groups[id]=pile.filter(id=>id!=='blessing-night-07');s.advanced.hands[p].push('blessing-night-07');roundtrip(s);
  const play=legalActions(s).find(a=>a.type==='play-card'&&a.cardId==='blessing-night-07');assert.ok(play);s=applyAction(s,play);for(let n=0;s.advanced.pending?.kind==='window';n++){assert.ok(n<40);s=applyAction(s,legalActions(s).find(a=>a.type==='magic-pass'));}
  const hero=s.units.find(u=>u.hexId==='Road'&&s.unitDefinitions.find(d=>d.id===u.defId).kind==='hero');assert.ok(hero);assert.equal(s.advanced.stacks[hero.id],captured.id);roundtrip(s);
});

test('a Hero cannot finish or drop a Huge stack member in a welcoming settlement',()=>{
  const config=fixture({initialUnits:[{defId:'test-huge',hexId:'Spire'}]});config.unitDefinitions.push(army('test-huge','night',{characteristics:['huge']}));config.profile='advanced';
  let s=finishOpening(createGame(config)),huge=s.units.find(u=>u.defId==='test-huge'),hero=s.advanced.heroPools.night.shift();assert.ok(hero);
  const h={id:`unit-${s.serial++}`,defId:hero,kingdom:'night',hexId:'Spire',weakened:false,activated:false};s.units.push(h);s.advanced.stacks[h.id]=huge.id;
  s=applyAction(s,{type:'collect-income'});let actions=legalActions(s);
  assert.ok(!actions.some(a=>['pass','recover','attack','explore-lair','attack-monster'].includes(a.type)&&[h.id,huge.id].includes(a.unitId)),'Every joint action must honor Huge departure');
  s=applyAction(s,{type:'activate',unitId:h.id});actions=legalActions(s);assert.ok(!actions.some(a=>a.type==='drop-army'&&a.unitId===h.id),'Dropping the Huge Army would finish it in the settlement');assert.ok(actions.some(a=>a.type==='drop-hero'&&a.unitId===h.id));assert.ok(!actions.some(a=>a.type==='pass'&&a.unitId===h.id),'Already-active Hero fallback must also inspect its Army');
  s=applyAction(s,actions.find(a=>a.type==='move'&&a.unitId===h.id&&a.toHex==='Road'));
  for(let n=0;s.advanced.pending;n++){assert.ok(n<40);const pass=legalActions(s).find(a=>a.type==='magic-pass');assert.ok(pass);s=applyAction(s,pass);}
  assert.equal(s.units.find(u=>u.id===huge.id).hexId,'Road');const pass=legalActions(s).find(a=>a.type==='pass'&&a.unitId===h.id);assert.ok(pass,'The joint action may finish after leaving');s=applyAction(s,pass);assert.ok(legalActions(s).some(a=>a.type==='end-turn'));roundtrip(s);
});

test('hostile-City occupation includes hostile neutrals and preserves welcoming source postures',()=>{
  const config=fixture();config.hexes[0].settlement.city=true;config.hexes[0].settlement.loyalty=null;config.hexes[0].settlement.neutralFriendlyTo=['night'];config.scenario.initialUnits=[{defId:'night-army',hexId:'Spire'}];
  const s=createGame(config),condition={type:'enemy-city-occupied',side:'invader'};assert.equal(campaignCondition(s,condition),false,'A welcoming neutral City is not hostile');
  s.hexes[0].settlement.neutralFriendlyTo=[];assert.equal(campaignCondition(s,condition),true,'Hostile neutral Cities count under the printed condition');
  s.controls.Spire='night';assert.equal(campaignCondition(s,condition),true,'Placing the conquering Control does not cancel victory');
  s.hexes[0].settlement.loyalty='empire';assert.equal(campaignCondition(s,condition),true);s.hexes[0].settlement.loyalty='night';assert.equal(campaignCondition(s,condition),false,'Restoring a native City is not conquest of a hostile City');
  s.hexes[0].settlement.loyalty='empire';s.razed.push('Spire');assert.equal(campaignCondition(s,condition),false,'Razed removes the City and Posture symbols');
});

test('a non-Huge Hero cannot repair a Razed settlement while its Huge Army occupies the hex',()=>{
  const config=fixture({initialUnits:[{defId:'test-huge',hexId:'Spire'}]});config.unitDefinitions.push(army('test-huge','night',{characteristics:['huge']}));config.scenario.initialRazed=['Spire'];config.profile='advanced';
  let s=finishOpening(createGame(config)),huge=s.units.find(u=>u.defId==='test-huge'),hero=s.advanced.heroPools.night.shift();const h={id:`unit-${s.serial++}`,defId:hero,kingdom:'night',hexId:'Spire',weakened:false,activated:false};s.units.push(h);s.advanced.stacks[h.id]=huge.id;s=applyAction(s,{type:'collect-income'});
  assert.ok(!legalActions(s).some(a=>a.type==='recolonize'&&a.hexId==='Spire'),'Undying §3.2.3 forbids removing Razed while Huge occupies the hex');
  const alone=structuredClone(s);alone.units=alone.units.filter(u=>u.id!==huge.id);delete alone.advanced.stacks[h.id];assert.ok(legalActions(alone).some(a=>a.type==='recolonize'&&a.hexId==='Spire'),'The ordinary Hero repair remains available once Huge is absent');roundtrip(s);
});

for(const profile of ['basic','advanced'])test(`${profile}: a Huge build may be ready in its own settlement but cannot be finished in a welcoming neighbor`,()=>{
  const config=fixture();config.unitDefinitions.push(army('test-huge','night',{characteristics:['huge']}));config.hexes[2].settlement=village('Welcoming neighbor',null,['night']);config.profile=profile;
  let s=finishOpening(createGame(config));s=applyAction(s,{type:'collect-income'});const actions=legalActions(s);
  assert.ok(actions.some(a=>a.type==='build'&&a.defId==='test-huge'&&a.hexId==='Spire'),'Own settlement builds remain ready and may leave');assert.ok(!actions.some(a=>a.type==='build'&&a.defId==='test-huge'&&a.hexId==='Imperial'),'Finished Huge cannot leave a welcoming neighbor before season end');assert.ok(actions.some(a=>a.type==='build'&&a.defId==='test-huge'&&a.hexId==='Road'),'Ordinary finished wilderness builds remain legal');
  if(profile==='advanced'){const hero=s.advanced.heroPools.night.shift(),h={id:`unit-${s.serial++}`,defId:hero,kingdom:'night',hexId:'Spire',weakened:false,activated:true};s.units.push(h);assert.ok(!legalActions(s).some(a=>a.type==='build'&&a.defId==='test-huge'&&a.hexId==='Spire'),'Joining a finished Hero must not finish Huge in a welcoming settlement');}
  roundtrip(s);
});

test('a finished Hero cannot teleport onto a ready Huge Army in a welcoming settlement',()=>{
  const config=fixture({initialUnits:[{defId:'test-huge',hexId:'Spire'}]});config.unitDefinitions.push(army('test-huge','night',{characteristics:['huge']}));config.hexes.push({id:'Far',q:2,r:0,terrain:'clear'});config.profile='advanced';let s=finishOpening(createGame(config));s=applyAction(s,{type:'collect-income'});
  const hero=s.advanced.heroPools.night.find(id=>s.unitDefinitions.find(d=>d.id===id).abilities.includes('mage'));assert.ok(hero);s.advanced.heroPools.night=s.advanced.heroPools.night.filter(id=>id!==hero);
  const h={id:`unit-${s.serial++}`,defId:hero,kingdom:'night',hexId:'Road',weakened:false,activated:true};s.units.push(h);const player=s.advanced.players.find(p=>p.kingdoms.includes('night')).id;
  for(const groups of [s.advanced.decks,s.advanced.discards,s.advanced.hands,s.advanced.owned])for(const [id,pile] of Object.entries(groups))groups[id]=pile.filter(id=>id!=='spell-21');s.advanced.hands[player].push('spell-21');
  let actions=legalActions(s);assert.ok(actions.some(a=>a.type==='play-card'&&a.cardId==='spell-21'&&a.targetHex==='Far'),'Finished Mage may still teleport to an ordinary legal hex');assert.ok(!actions.some(a=>a.type==='play-card'&&a.cardId==='spell-21'&&a.targetHex==='Spire'),'Reverse arrival must not finish the destination Huge Army');
  h.activated=false;actions=legalActions(s);const arrive=actions.find(a=>a.type==='play-card'&&a.cardId==='spell-21'&&a.targetId===h.id&&a.targetHex==='Spire');assert.ok(arrive,'Ready Hero may join a ready Huge Army and then move it out');s=applyAction(s,arrive);for(let n=0;s.advanced.pending;n++){assert.ok(n<40);const pass=legalActions(s).find(a=>a.type==='magic-pass');assert.ok(pass);s=applyAction(s,pass);}assert.ok(s.units.filter(u=>u.hexId==='Spire').every(u=>!u.activated));roundtrip(s);
});

test('a protected Coven cannot force a newly recruited Hero to finish a ready Huge Army',()=>{
  const config=fixture({initialUnits:[{defId:'test-huge',hexId:'Spire'}]});config.unitDefinitions.push(army('test-huge','night',{characteristics:['huge']}));config.profile='advanced';let s=finishOpening(createGame(config));s=applyAction(s,{type:'collect-income'});s.covens.push('Spire');s.advanced.effects.push({cardId:'blessing-night-06',target:'night',activation:null,expires:s.turnSerial,extra:{protectedCovens:true}});
  assert.ok(!legalActions(s).some(a=>a.type==='recruit-hero'&&a.hexId==='Spire'),'Your True Rulers would create a finished Hero and strand the ready Huge Army');s.advanced.effects=[];
  const recruit=legalActions(s).find(a=>a.type==='recruit-hero'&&a.hexId==='Spire');assert.ok(recruit,'A ready Hero joining the ready Huge Army remains legal');s=applyAction(s,recruit);assert.ok(s.units.filter(u=>u.hexId==='Spire').every(u=>!u.activated));roundtrip(s);
});

test('Storm Giant’s Amulet razes the entered Settlement before its Hero activation ends without making the Army Huge',()=>{
  const config=fixture({initialUnits:[{defId:'night-army',hexId:'Spire'}]});config.profile='advanced';const base=config.unitDefinitions.find(d=>d.id==='night-army');base.light=12;base.heavy=12;for(const k of config.scenario.kingdoms)k.income=3;
  let s=finishOpening(createGame(config));s=applyAction(s,{type:'collect-income'});const armyUnit=s.units.find(u=>u.defId==='night-army'),hero=s.advanced.heroPools.night.find(id=>s.unitDefinitions.find(d=>d.id===id).abilities.includes('mage'));assert.ok(hero);s.advanced.heroPools.night=s.advanced.heroPools.night.filter(id=>id!==hero);
  const h={id:`unit-${s.serial++}`,defId:hero,kingdom:'night',hexId:'Spire',weakened:false,activated:false};s.units.push(h);s.advanced.stacks[h.id]=armyUnit.id;const player=s.advanced.players.find(p=>p.kingdoms.includes('night')).id;
  for(const groups of [s.advanced.decks,s.advanced.discards,s.advanced.hands,s.advanced.owned])for(const [id,pile] of Object.entries(groups))groups[id]=pile.filter(id=>id!=='treasure-33');s.advanced.hands[player].push('treasure-33');
  const gold=s.kingdoms.find(k=>k.id==='night').gold;s=applyAction(s,{type:'attack',unitId:armyUnit.id,targetHex:'Imperial'});const amulet=legalActions(s).find(a=>a.type==='play-card'&&a.cardId==='treasure-33'&&a.casterId===h.id);assert.ok(amulet);s=applyAction(s,amulet);
  let observed=false;for(let n=0;(s.advanced.pending||s.pendingCombat)&&n<100;n++){
    if(s.advanced.effects.some(e=>e.cardId==='treasure-33')){observed=true;const u=s.units.find(u=>u.id===armyUnit.id);assert.ok(!effectiveDefinition(s,u,s.unitDefinitions.find(d=>d.id===u.defId)).characteristics.includes('huge'),'Hero characteristics remain unshared');}
    const actions=legalActions(s),a=actions.find(a=>a.type==='magic-pass')??actions.find(a=>a.type==='resolve-combat'&&!a.ambush)??actions.find(a=>a.type==='allocate-hit')??actions.find(a=>a.type==='accept-hit')??actions.find(a=>a.type==='advance'&&a.accept);assert.ok(a,`Expected battle continuation: ${JSON.stringify(actions.slice(0,3))}`);s=applyAction(s,a);
  }
  assert.ok(observed);assert.ok(s.razed.includes('Spire'),'The casting Settlement is razed');assert.equal(s.units.find(u=>u.id===armyUnit.id).hexId,'Imperial');assert.ok(s.razed.includes('Imperial'),'The advancing Hero also razes the entered Settlement');assert.equal(s.controls.Imperial,undefined);assert.equal(s.kingdoms.find(k=>k.id==='empire').income,2,'Enemy income decreases once');assert.equal(s.kingdoms.find(k=>k.id==='night').gold,gold+2,'The ordinary Army retains its ordinary Loot rule');assert.ok(!s.advanced.effects.some(e=>e.cardId==='treasure-33'));roundtrip(s);
});

function hostileCityConfig(characteristics=[],razed=false){const config=fixture({initialUnits:[{defId:'night-army',hexId:'Road'}],rules:{victory:{immediate:[{winner:'invader',condition:{type:'enemy-city-occupied',side:'invader'}}],deadline:{type:'score',metric:'income',tieWinner:'resistance'}}}});const city=config.hexes[0];city.settlement=village('Hostile City','empire');city.settlement.city=true;const d=config.unitDefinitions.find(d=>d.id==='night-army');d.characteristics=characteristics;d.light=12;d.heavy=12;if(razed)config.scenario.initialRazed=['Spire'];return config;}

test('moving through the ruins of a former hostile City never grants the instant City victory',()=>{
  let s=finishOpening(createGame(hostileCityConfig([],true)));s=applyAction(s,{type:'collect-income'});s=applyAction(s,{type:'move',unitId:'unit-1',toHex:'Spire'});assert.equal(s.units[0].hexId,'Spire');assert.equal(s.winner,null);assert.equal(s.phase,'activation');roundtrip(s);
});

for(const trait of ['ordinary','huge','feral'])test(`fresh live City conquest grants instant victory at occupation before ${trait==='ordinary'?'the Control choice':trait+' Raze'}`,()=>{
  let s=finishOpening(createGame(hostileCityConfig(trait==='ordinary'?[]:[trait])));s=applyAction(s,{type:'collect-income'});s=applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'Spire'});assert.equal(s.winner,'invader');assert.equal(s.phase,'game-over');assert.equal(s.units[0].hexId,'Spire');assert.ok(!s.razed.includes('Spire'),'Immediate victory ends the game after advance and before Capture step 4');assert.equal(s.controls.Spire,undefined);roundtrip(s);
});
