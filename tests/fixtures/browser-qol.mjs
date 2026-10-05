// Original, portable browser positions. Import through the ordinary Load saved game UI.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createGame,applyAction,exportGame,validateState} from '../../dist/js/engine.js';
import {cards} from '../../dist/js/advanced.js';
import {createCompanion} from '../../dist/js/async-play.js';
import {fixture,give,placeHero} from './advanced.mjs';
const output=resolve(process.argv[2]||'tests/fixtures/generated');mkdirSync(output,{recursive:true});
function save(name,s){const issues=validateState(s);if(issues.length)throw Error(issues.join('; '));s.companion=createCompanion(s);writeFileSync(resolve(output,name+'.json'),exportGame(s));console.log(name);}
let cfg=fixture({tabletop:true});cfg.scenario.name='Full tabletop · nested response diagnostic';cfg.scenario.source='Original local browser test position';
let s=applyAction(createGame(cfg),{type:'collect-income'});placeHero(s,'hero-fjordland-17','A','unit-1');placeHero(s,'hero-orcs-11','C','unit-2');give(s,'player-fjordland','spell-51');give(s,'player-orcs','spell-15');s=applyAction(s,{type:'activate',unitId:'unit-1'});save('table-nested-response',s);
cfg=fixture();cfg.scenario.name='Combat odds · Ambush diagnostic';cfg.scenario.source='Original forecast test with a synthetic Stealth Army';cfg.scenario.initialUnits[0].hexId='B';cfg.unitDefinitions[0].abilities=['stealth'];
s=applyAction(createGame(cfg),{type:'collect-income'});placeHero(s,'hero-fjordland-17','B','unit-1');placeHero(s,'hero-orcs-11','C','unit-2');save('odds-ambush',s);

cfg=fixture({controllers:{fjordland:'ai',orcs:'ai'}});cfg.scenario.name='Winter ruling · AI must wait';cfg.scenario.source='Original unsellable-only edge-case diagnostic';s=applyAction(createGame(cfg),{type:'collect-income'});
const extra=s.advanced.hands['player-fjordland'].filter(id=>cards.find(c=>c.id===id)?.kind==='treasure');for(const id of extra){s.advanced.hands['player-fjordland'].splice(s.advanced.hands['player-fjordland'].indexOf(id),1);s.advanced.removedCards.push(id);}
for(const id of ['treasure-29','treasure-30','treasure-35','treasure-36'])give(s,'player-fjordland',id);s.year=2;s.advanced.pending={kind:'winter',playerIndex:0};save('winter-human-ruling',s);
