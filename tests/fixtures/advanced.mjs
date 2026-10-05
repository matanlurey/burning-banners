import assert from 'node:assert/strict';
import {createGame,applyAction,legalActions} from '../../dist/js/engine.js';
import {cards} from '../../dist/js/advanced.js';
export const definitions=[
  {id:'army-a',name:'Freeholders',kingdom:'fjordland',cost:2,recoveryCost:1,movement:3,light:2,heavy:0,abilities:[],characteristics:[],count:5},
  {id:'army-b',name:'Orc Reavers',kingdom:'orcs',cost:2,recoveryCost:1,movement:3,light:2,heavy:0,abilities:[],characteristics:[],count:5}
];
const town=loyalty=>({name:loyalty+' town',loyalty,city:false,fortified:0,port:false});
export function fixture(extra={}) {
  return {profile:'advanced',hexes:[
    {id:'A',q:0,r:0,terrain:'clear',settlement:town('fjordland')},
    {id:'B',q:1,r:0,terrain:'clear'},
    {id:'C',q:2,r:0,terrain:'clear',settlement:town('orcs')},
    {id:'D',q:0,r:1,terrain:'forest'},
    {id:'E',q:1,r:1,terrain:'mountain'},
    {id:'F',q:2,r:1,terrain:'lair'}
  ],unitDefinitions:structuredClone(definitions),scenario:{id:'advanced-fixture',name:'Advanced diagnostic',official:false,source:'Original test fixture',startYear:1,startSeason:0,endYear:2,endSeason:2,turnOrder:['fjordland','orcs'],kingdoms:[{id:'fjordland',name:'Fjordland',side:'resistance',gold:20,income:2},{id:'orcs',name:'Orcs',side:'invader',gold:20,income:0}],initialUnits:[{defId:'army-a',hexId:'A'},{defId:'army-b',hexId:'C'}],objective:{type:'control',kingdom:'orcs',hexIds:['A'],count:1}},seed:29,...extra};
}
export const active=(extra={})=>applyAction(createGame(fixture(extra)),{type:'collect-income'});
export function give(s,player,id) {
  for(const pile of [...Object.values(s.advanced.hands),...Object.values(s.advanced.owned),...Object.values(s.advanced.decks),...Object.values(s.advanced.discards),s.advanced.eliminatedTreasures,s.advanced.removedCards]) {
    const i=pile.indexOf(id);if(i>=0)pile.splice(i,1);
  }
  s.advanced.hands[player].push(id);
}
export function own(s,player,id){give(s,player,id);s.advanced.hands[player].splice(s.advanced.hands[player].indexOf(id),1);s.advanced.owned[player].push(id);}
export function heroFirst(s,id){const pool=s.advanced.heroPools[cards.find(c=>c.id===id).kingdom];const index=pool.indexOf(id);assert.ok(index>=0);pool.splice(index,1);pool.unshift(id);}
export function placeHero(s,id,hexId,armyId){const c=cards.find(c=>c.id===id),pool=s.advanced.heroPools[c.kingdom];pool.splice(pool.indexOf(id),1);const hero={id:`unit-${s.serial++}`,defId:id,kingdom:c.kingdom,hexId,weakened:false,activated:false};s.units.push(hero);if(armyId)s.advanced.stacks[hero.id]=armyId;return hero;}
export function passWindows(s){for(let guard=0;guard<100&&s.advanced.pending?.kind==='window';guard++){const action=legalActions(s).find(a=>a.type==='magic-pass');assert.ok(action);s=applyAction(s,action);}return s;}
export function battle(s,{attacker='unit-2',defender='unit-1',targetHex='A',hits=2,kind='strike',reward}={}){
  s.advanced.battle={kind,attacker,defender,targetHex,attackerKingdom:s.units.find(u=>u.id===attacker)?.kingdom??s.currentKingdom,defenderKingdom:s.units.find(u=>u.id===defender)?.kingdom??'orcs',step:0,magicLifted:true,attackerRolls:[],defenderRolls:[],attackerSuccesses:hits,defenderSuccesses:0,attackerHits:0,defenderHits:hits,result:'attacker',hitQueue:[],...(reward?{reward}:{})};
  s.advanced.pending={kind:'hit',target:defender,count:hits,members: [defender,...Object.keys(s.advanced.stacks).filter(id=>s.advanced.stacks[id]===defender)],resume:null};
  return s;
}
