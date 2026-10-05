import {publishedCampaigns,compilePublishedCampaign,campaignSummary} from './published-campaigns.js';
import { hexes, worldHexes, unitDefinitions, scenario } from './content.js';
import type { GameConfig, Hex, ScenarioDefinition } from './engine.js';

export interface ScenarioOption { id:string; title:string; description:string; config:GameConfig; }
const directions=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
function sixKingdomSandbox():GameConfig {
  const board:Hex[]=structuredClone(worldHexes);
  const homes:Record<string,string>={oathborn:'w-5-3',fjordland:'w-3-13',empire:'w-5-5',night:'w-5-7',goblins:'w-8-3',orcs:'w-9-11'};
  const rosters:Record<string,string[]>={
    oathborn:['oath-iron-legion','oath-crossbows','oath-miners'],
    fjordland:['fjord-sea-reavers','fjord-rangers','fjord-freeholders'],
    empire:['empire-kontari','empire-psiloi','empire-akritoi'],
    night:['night-ghouls','night-wolf-pack','night-emissaries'],
    goblins:['goblins-hobgoblins','goblins-goblin-elites','goblins-goblin-warriors'],
    orcs:['orcs-black-axes','orcs-wolf-riders','orcs-orc-reavers'],
  };
  const participants=Object.keys(homes);
  // This is a declared sandbox override, not a claim about official postures.
  for(const h of board){delete h.entry;if(h.settlement){h.settlement.loyalty=null;h.settlement.neutralFriendlyTo=[...participants];}}
  const occupied=new Set<string>();
  const initialUnits:ScenarioDefinition['initialUnits']=[];
  for(const [kingdom,homeId] of Object.entries(homes)){
    const home=board.find(h=>h.id===homeId)!;
    home.settlement!.loyalty=kingdom;
    const nearby=board.filter(h=>h.id===home.id||directions.some(([dq,dr])=>h.q===home.q+dq&&h.r===home.r+dr))
      .filter(h=>!h.prohibited&&!['sea','lair'].includes(h.terrain)&&(!h.settlement||h.id===home.id))
      .sort((a,b)=>Number(b.id===home.id)-Number(a.id===home.id));
    for(let i=0;i<rosters[kingdom]!.length;i++){
      const target=nearby.find(h=>!occupied.has(h.id));
      if(!target)throw new Error(`Sandbox needs three legal opening hexes near ${homeId}.`);
      occupied.add(target.id);initialUnits.push({defId:rosters[kingdom]![i]!,hexId:target.id});
    }
  }
  const definition:ScenarioDefinition={
    id:'six-banners-sandbox',name:'Six banners at war · sandbox',official:false,
    source:'Original digital sandbox using source-derived Wildlands centers and printed Army mechanics. This is not a published Burning Banners campaign.',
    startYear:588,startSeason:0,endYear:589,endSeason:2,
    turnOrder:['oathborn','goblins','fjordland','night','empire','orcs'],
    kingdoms:[
      {id:'oathborn',name:'The Oathborn',side:'resistance',gold:12,income:3},
      {id:'fjordland',name:'Fjordland',side:'resistance',gold:12,income:3},
      {id:'empire',name:'Eastern Empire',side:'resistance',gold:15,income:4,revolt:0},
      {id:'night',name:'Army of Night',side:'invader',gold:12,income:2,controlLimit:5},
      {id:'goblins',name:'The Goblins',side:'invader',gold:18,income:0},
      {id:'orcs',name:'The Orcs',side:'invader',gold:18,income:0},
    ],
    initialUnits,initialControls:Object.fromEntries(Object.entries(homes).map(([k,h])=>[h,k])),
    objective:{type:'control',hexIds:[homes.oathborn!,homes.fjordland!,homes.empire!],count:2,deadlineOnly:true},
    notes:[
      'Original six-kingdom sandbox. Alliances, turn order, opening armies, treasuries and objectives are digital fixture choices.',
      'Invaders must control two of the three Resistance headquarters at the end of Autumn 589; otherwise Resistance wins.',
      'Other settlements are welcoming to both sides. Printed loyalty is overridden for this sandbox only.',
      'Army of Night uses its five shared Control/Coven markers. Other marker inventories remain under review; this sandbox does not certify physical supply parity.',
      'Wildlands center geometry and Army stats were inspected. Road, river and coast extraction is partial; this is not a certified official map pack.',
    ],
  };
  return {hexes:board,unitDefinitions:structuredClone(unitDefinitions),scenario:definition};
}
export function getScenarioOptions():ScenarioOption[]{return [
  {id:scenario.id,title:scenario.name,description:'Oathborn versus Fjordland. Three seasons, a compact front, and the board game’s Basic rules. Original teaching setup; full official campaign data remains unverified.',config:{hexes:structuredClone(hexes),unitDefinitions:structuredClone(unitDefinitions),scenario:structuredClone(scenario)}},
  {id:'six-banners-sandbox',title:'Six banners at war · sandbox',description:'All six kingdoms, two alliances, and any mix of human and AI commanders. Original setup on the reconstructed Wildlands board.',config:sixKingdomSandbox()},
  ...publishedCampaigns.map(s=>({id:`published-${s.id}`,title:s.series==='scroll'?`${s.number}. ${s.name}`:s.series==='chronicle'?`Chronicle ${s.chapter}: ${s.name}`:s.name,description:campaignSummary(s),config:compilePublishedCampaign(s.id)})),
  {id:'published-chronicle-full',title:'Full Chronicle · 589–600 · 35 seasons',description:'The complete war, from Out of the Shadows through Bitter End, preserving your position across the years.',config:compilePublishedCampaign('chronicle-1',{endingChapter:10,bitterEnd:true})},
];}
