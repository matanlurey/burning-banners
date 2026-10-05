// Create portable diagnostic positions for manual browser QA through Load saved game.
// These are original fixtures, not official campaign openings.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createGame,applyAction,exportGame,validateState} from '../../dist/js/engine.js';
import {cards} from '../../dist/js/advanced.js';
import {getScenarioOptions} from '../../dist/js/scenarios.js';
import {give,own,placeHero,battle} from './advanced.mjs';

const output=resolve(process.argv[2]||'tests/fixtures/generated');mkdirSync(output,{recursive:true});
const oath='player-oathborn',fjord='player-fjordland';
function position(){
  const cfg=structuredClone(getScenarioOptions()[0].config);
  cfg.scenario.name='Advanced interaction diagnostic';cfg.scenario.source='Original portable browser test fixture';cfg.scenario.endYear=2;
  let s=applyAction(createGame({...cfg,profile:'advanced',seed:29,controllers:{oathborn:'human',fjordland:'human'}}),{type:'collect-income'});
  s.units.find(u=>u.id==='unit-4').hexId='w-6-11';
  placeHero(s,'hero-oathborn-15','w-5-11','unit-1');placeHero(s,'hero-fjordland-17','w-6-11','unit-4');
  return s;
}
function write(name,s){const errors=validateState(s);if(errors.length)throw new Error(errors.join('; '));writeFileSync(resolve(output,name+'.json'),exportGame(s));console.log(name);}

let s=position();
for(const id of ['spell-28','treasure-31'])give(s,oath,id);give(s,fjord,'spell-15');
s=applyAction(s,{type:'attack',unitId:'unit-1',targetHex:'w-6-11'});write('battle-magic',s);

s=position();give(s,fjord,'spell-17');battle(s,{attacker:'unit-1',defender:'unit-4',targetHex:'w-6-11',hits:2});write('recover-between-hits',s);

s=position();s.season=2;s.turnIndex=1;s.currentKingdom='fjordland';
for(const id of ['treasure-02','treasure-17','treasure-18','treasure-19','treasure-23'])own(s,fjord,id);
s=applyAction(s,{type:'end-turn'});s=applyAction(s,{type:'finish-study',playerId:oath});s=applyAction(s,{type:'finish-study',playerId:fjord});write('winter-treasures',s);

// Regenerate is a Free Action belonging to the Army's owner, even on another
// kingdom's turn. The UI must ask that human owner before spending their gold.
const regenConfig=structuredClone(getScenarioOptions()[1].config);
s=applyAction(createGame({...regenConfig,controllers:Object.fromEntries(regenConfig.scenario.kingdoms.map(k=>[k.id,'human'])),seed:29}),{type:'collect-income'});
const troll=s.units.find(u=>u.kingdom==='goblins');troll.defId='goblins-hill-troll';troll.weakened=true;
write('regenerate-owner',s);
