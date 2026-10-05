import fs from 'node:fs';
import {createGame,applyAction,legalActions,botAction,validateState,exportGame,importGame} from '../dist/js/engine.js';
import {chooseDifficultyAction} from '../dist/js/ai.js';
import {compilePublishedCampaign} from '../dist/js/published-campaigns.js';

// Reproducible public-state self-play. This is a rule/dead-end check, not a
// statistical claim about strength or tabletop balance.
const output=process.argv[2]??'/tmp/burning-banners-campaign-playtest.json';
const ids=(process.argv[3]??'intro,campaign-3,campaign-6').split(',');
const difficulties=(process.argv[4]??'easy,normal,hard').split(',');
const seeds=(process.argv[5]??'931,1327').split(',').map(Number);
const mode=process.argv[6]??'complete';
const results=[];
for(const id of ids)for(const difficulty of difficulties)for(const seed of seeds){
  const start=performance.now(),result={id,difficulty,seed,steps:0,status:'running',manualSetupRulings:0};
  try{
    let s=createGame({...compilePublishedCampaign(id),seed});
    while(s.phase!=='game-over'&&result.steps<1800&&!(mode==='round'&&s.turnSerial>s.kingdoms.length)){
      const actions=legalActions(s);let a=chooseDifficultyAction(s,difficulty,botAction(s));
      if(actions.some(x=>x.type==='opening-choice')){a=actions[0];result.manualSetupRulings++;}
      if(!a){result.status=actions.length?'human-ruling':'no-legal-action';result.phase=s.phase;result.pending=s.advanced?.pending?.kind;break;}
      if(!actions.some(x=>JSON.stringify(x)===JSON.stringify(a)))throw new Error('AI selected a non-enumerated action');
      s=applyAction(s,a);result.steps++;
      const issues=validateState(s);if(issues.length)throw new Error(issues.join('; '));
      if(result.steps%50===0)importGame(exportGame(s));
    }
    if(s.phase==='game-over'){result.status='complete';result.winner=s.winner;result.reason=s.victoryReason;}
    else if(mode==='round'&&s.turnSerial>s.kingdoms.length)result.status='round-complete';
    else if(result.status==='running')result.status='action-limit';
    result.year=s.year;result.season=s.season;result.turn=s.turnSerial;result.units=s.units.length;
  }catch(error){result.status='error';result.error=error.message;}
  result.elapsedMs=Math.round(performance.now()-start);results.push(result);
  fs.writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),mode,maxActions:1800,results},null,2)+'\n');
  console.log(`${id}/${difficulty}/${seed}: ${result.status}, ${result.steps} actions, ${result.elapsedMs} ms${result.error?' · '+result.error:''}`);
}
