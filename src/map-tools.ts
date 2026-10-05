import type {GameState} from './engine.js';
import {monsterById} from './advanced.js';
export type MapFilter='all'|'ready'|'objectives'|'settlements';
export interface MapResult {hexId:string;unitId?:string;name:string;detail:string;kind:'army'|'hero'|'monster'|'settlement'|'objective'|'hex';priority:number;}
/** Only board information; private hands, Covens and hidden piles are excluded. */
export function findMap(s:GameState,query:string,filter:MapFilter='all'):MapResult[] {
  const q=query.trim().toLocaleLowerCase(),out:MapResult[]=[],objective=new Set(s.scenario.objective.hexIds);
  for(const h of s.hexes){
    const location=h.settlement?.name??h.id,units=s.units.filter(u=>u.hexId===h.id);
    const faction=(id:string)=>s.kingdoms.find(k=>k.id===id)?.name??id;
    if(filter==='all'||filter==='ready')for(const u of units){
      const d=s.unitDefinitions.find(d=>d.id===u.defId)!;if(filter==='ready'&&(u.kingdom!==s.currentKingdom||u.activated||d.kind==='hero'&&s.advanced?.stacks[u.id]||s.tabletop?.enslaved?.some(x=>x.armyId===u.id)))continue;
      out.push({hexId:h.id,unitId:u.id,name:d.name,detail:`${faction(u.kingdom)} · ${location} · ${u.activated?'Finished':'Ready'}${u.weakened?' · Weakened':''}`,kind:d.kind==='hero'?'hero':'army',priority:u.kingdom===s.currentKingdom&&!u.activated?0:3});
    }
    if(filter==='ready')continue;
    if((filter==='all'||filter==='objectives')&&objective.has(h.id))out.push({hexId:h.id,name:location,detail:`Campaign objective · ${h.id}${s.razed.includes(h.id)?' · Razed':''}`,kind:'objective',priority:1});
    if((filter==='all'||filter==='settlements')&&h.settlement)out.push({hexId:h.id,name:location,detail:`${h.id} · ${h.settlement.city?'City':'Settlement'}${h.settlement.fortified?' · Fort '+h.settlement.fortified:''}${h.settlement.port?' · Port':''}${s.razed.includes(h.id)?' · Razed':''}${s.controls[h.id]?' · '+faction(s.controls[h.id]):''}`,kind:'settlement',priority:2});
    if(filter==='all'){
      for(const m of s.advanced?.monsters.filter(m=>m.hexId===h.id)??[]){const d=monsterById(m.defId);out.push({hexId:h.id,name:d?.name??m.defId,detail:`Monster · ${location}${m.kingdom?' · '+faction(m.kingdom):''}`,kind:'monster',priority:3});}
      if(q&&!h.settlement&&!objective.has(h.id))out.push({hexId:h.id,name:h.id,detail:`${h.terrain}${h.mine?' · Mine':''}${h.entry?' · '+faction(h.entry)+' entry':''}`,kind:'hex',priority:4});
    }
  }
  return out.filter(item=>!q||`${item.name} ${item.detail} ${item.hexId}`.toLocaleLowerCase().includes(q))
    .sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name)||a.hexId.localeCompare(b.hexId));
}
