// Trusted local correspondence fixture; import through the normal browser UI.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createGame,applyAction,botAction,exportGame,validateState} from '../../dist/js/engine.js';
import {getScenarioOptions} from '../../dist/js/scenarios.js';
import {createCompanion,recordCampaignEvent,sendCampaignMessage,savePrivateNote} from '../../dist/js/async-play.js';
import {chooseDifficultyAction} from '../../dist/js/ai.js';
const output=resolve(process.argv[2]||'tests/fixtures/generated');mkdirSync(output,{recursive:true});
let s=createGame({...getScenarioOptions()[0].config,profile:'advanced',seed:29,controllers:{oathborn:'human',fjordland:'human'}});
s.companion=createCompanion(s,{oathborn:'hard',fjordland:'easy'});
for(let i=0;i<18&&s.phase!=='game-over';i++){const a=chooseDifficultyAction(s,'hard',botAction({...s,companion:undefined}));if(!a)break;s=recordCampaignEvent(s,applyAction(s,a),a,true);}
s=sendCampaignMessage(s,'oathborn','Attack <strong>carefully</strong> & hold the mine.',{channel:'table',hexId:s.units.find(u=>u.kingdom==='oathborn').hexId});
s=sendCampaignMessage(s,'fjordland','Fjord private alliance plan',{channel:'alliance'});
s=savePrivateNote(s,'oathborn','Keep a reserve for Winter.');
s=savePrivateNote(s,'fjordland','Fjord private note must stay hidden.');
s.companion.viewKingdom='oathborn';
const errors=validateState(s);if(errors.length)throw new Error(errors.join('; '));
writeFileSync(resolve(output,'async-campaign.json'),exportGame(s));
console.log(`Created ${s.companion.events.length} recorded events and trusted correspondence.`);
