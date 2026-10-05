import type { Hex, HexEdge, Settlement } from './engine.js';
import { mapEvidence } from './map-data.js';

export type BoardId = 'broken-coast'|'wildlands'|'imperial-heartland'|'fields-of-ash';
export interface ReviewedCell {
  q:number; j:number; terrain:Hex['terrain']; coastal?:boolean; majorRiver?:boolean;
  mine?:boolean; mineName?:string; settlement?:Settlement; lair?:unknown; verified?:boolean; notes?:string;
  entry?:string;
}
export interface ReviewedCrossing {
  a:[number,number]; b:[number,number]; road?:boolean; river?:1|2; sea?:boolean;
  coastal?:boolean; waterway?:boolean; verified?:boolean; verifiedLand?:boolean;
}
export interface ReviewedBoard {
  boardId:BoardId; name:string; hexes:ReviewedCell[]; edges:ReviewedCrossing[];
  partials:{q:number;j:number;fraction:number}[];
  uncertainties:unknown[]; complete:{terrain:boolean;edges:boolean;settlements:boolean};
}
const positions:Record<BoardId,[number,number]>={
  'broken-coast':[0,0],wildlands:[14,-7],'imperial-heartland':[0,15],'fields-of-ash':[14,8],
};
export const reviewedBoards = mapEvidence.boards as unknown as ReviewedBoard[];
const landmarkNames=new Map<string,string>();
const wildlandMines:Record<string,string>={'2,2':'The Trollshaft','6,3':'Black Deep','11,1':'North Drift','7,12':'Dwarven Falls','5,14':'The Endless Paths'};
for(const board of reviewedBoards){const[dq,dr]=positions[board.boardId];for(const h of board.hexes){const name=h.mineName??(board.boardId==='wildlands'&&h.mine?wildlandMines[`${h.q},${h.j}`]:null)??(h.lair&&typeof h.lair==='object'&&'name'in h.lair?String(h.lair.name):null);if(name)landmarkNames.set(`k-${h.q+dq}-${h.j-Math.floor(h.q/2)+dr}`,name);}}
export const sourceLandmarkName=(id:string)=>landmarkNames.get(id);
export interface JoinedMap {
  hexes:Hex[]; aliases:Record<string,string>; boardIds:BoardId[];
  conflicts:string[]; uncertainties:number; complete:boolean;
}
export const sourceCellId=(board:BoardId,q:number,j:number)=>`${board}-${q}-${j}`;
/** Source centers share a single axial lattice. North/south half-hexes are one cell.
 * Terrain comes from the reviewed source, never an all-clear template or image inference.
 */
export function joinReviewedBoards(boardIds:BoardId[]):JoinedMap {
  const selected=reviewedBoards.filter(b=>boardIds.includes(b.boardId));
  if(!selected.length)throw new Error('Choose at least one reviewed board.');
  const cells=new Map<string,{hex:Hex;coverage:number;rank:number}>();
  const aliases:Record<string,string>={},conflicts:string[]=[];
  for(const b of selected){
    const [dq,dr]=positions[b.boardId];
    for(const cell of b.hexes){
      const q=cell.q+dq,r=cell.j-Math.floor(cell.q/2)+dr,key=`${q},${r}`;
      const fraction=b.partials.find(p=>p.q===cell.q&&p.j===cell.j)?.fraction??1;
      const id=`k-${q}-${r}`,alias=sourceCellId(b.boardId,cell.q,cell.j);aliases[alias]=id;
      const h:Hex={id,q,r,terrain:cell.terrain};
      for(const flag of ['coastal','majorRiver','mine'] as const)if(cell[flag])h[flag]=true;
      if(cell.settlement)h.settlement=structuredClone(cell.settlement);
      if(cell.lair&&typeof cell.lair==='object'&&'pool'in cell.lair)h.lairPool=(cell.lair as {pool:'land'|'sea'}).pool;
      if(cell.entry)h.entry=cell.entry;
      // A duplicate's center may lie beyond its scan's trim. Prefer the half
      // containing the center; conflicting non-clear terrain still needs review.
      const rank=fraction>=.5?2:1,old=cells.get(key);
      if(!old){cells.set(key,{hex:h,coverage:fraction,rank});continue;}
      if(old.hex.terrain!==h.terrain&&old.hex.terrain!=='clear'&&h.terrain!=='clear')conflicts.push(`${alias}: ${old.hex.terrain} / ${h.terrain}`);
      if(h.settlement&&old.hex.settlement&&h.settlement.name!==old.hex.settlement.name)conflicts.push(`${alias}: conflicting settlement names`);
      const preferred=rank>old.rank?h:old.hex,other=preferred===h?old.hex:h;
      if(!preferred.settlement&&other.settlement)preferred.settlement=other.settlement;
      if(other.mine)preferred.mine=true;
      if(other.coastal)preferred.coastal=true;
      if(other.majorRiver)preferred.majorRiver=true;
      if(!preferred.entry&&other.entry)preferred.entry=other.entry;
      if(!preferred.lairPool&&other.lairPool)preferred.lairPool=other.lairPool;
      cells.set(key,{hex:preferred,coverage:Math.min(1,old.coverage+fraction),rank:Math.max(rank,old.rank)});
    }
  }
  const byId=new Map([...cells.values()].map(({hex})=>[hex.id,hex]));
  for(const {hex,coverage} of cells.values())if(coverage<.5)hex.prohibited=true;
  const crossings=selected.flatMap(b=>b.edges.map(e=>({...e,boardA:b.boardId,boardB:b.boardId})));
  const seams=mapEvidence.seams;
  crossings.push(...seams.edges.filter(e=>boardIds.includes(e.boardA as BoardId)&&boardIds.includes(e.boardB as BoardId)) as unknown as typeof crossings);
  for(const crossing of crossings){
    const from=aliases[sourceCellId(crossing.boardA,...crossing.a)],to=aliases[sourceCellId(crossing.boardB,...crossing.b)];
    if(!from||!to)throw new Error(`${crossing.boardA}: crossing refers to an absent center.`);
    const a=byId.get(from)!,c=byId.get(to)!;
    if(Math.max(Math.abs(a.q-c.q),Math.abs(a.r-c.r),Math.abs(a.q+a.r-c.q-c.r))!==1)throw new Error(`${crossing.boardA}: crossing is not adjacent.`);
    const e:HexEdge={};for(const f of ['road','river','sea','coastal','waterway'] as const)if(crossing[f]!==undefined)(e as any)[f]=crossing[f];
    const existing=a.edges?.[to];
    if(existing)for(const f of ['river','sea','coastal'] as const)if(existing[f]!==undefined&&e[f]!==undefined&&existing[f]!==e[f])conflicts.push(`${from} / ${to}: conflicting ${f}`);
    const merged={...existing,...e};
    if(merged.sea&&merged.coastal){conflicts.push(`${from} / ${to}: Sea and Coastal conflict`);delete merged.coastal;}
    (a.edges??={})[to]=structuredClone(merged);(c.edges??={})[from]=structuredClone(merged);
  }
  const seamUncertainties=seams.uncertainties.filter(u=>u.edges.some(id=>seams.edges.some(e=>e.reviewId===id&&boardIds.includes(e.boardA as BoardId)&&boardIds.includes(e.boardB as BoardId)))).length;
  return {hexes:[...byId.values()].sort((a,b)=>a.q-b.q||a.r-b.r),aliases,boardIds:selected.map(b=>b.boardId),conflicts,uncertainties:selected.reduce((n,b)=>n+b.uncertainties.length,0)+seamUncertainties,complete:selected.every(b=>b.complete.terrain&&b.complete.edges&&b.complete.settlements&&!b.uncertainties.length)&&!conflicts.length&&!seamUncertainties};
}
