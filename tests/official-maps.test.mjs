import test from 'node:test';
import assert from 'node:assert/strict';
import {joinReviewedBoards,reviewedBoards,sourceCellId} from '../dist/js/official-maps.js';
import {tabletopConfig} from '../dist/js/tabletop.js';
import {createGame,exportGame,importGame,validateState,adjacentHexes} from '../dist/js/engine.js';

const ids=['broken-coast','wildlands','imperial-heartland','fields-of-ash'];
const map=joinReviewedBoards(ids);
const cell=(board,q,j)=>map.hexes.find(h=>h.id===map.aliases[sourceCellId(board,q,j)]);
test('four source boards share one lattice with joined half hexes',()=>{
  assert.equal(map.hexes.length,854);assert.equal(Object.keys(map.aliases).length,868);
  assert.equal(new Set(map.hexes.map(h=>`${h.q},${h.r}`)).size,854);
  assert.deepEqual(map.conflicts,[]);
  for(let q=0;q<14;q+=2){assert.equal(cell('broken-coast',q,15).id,cell('imperial-heartland',q,0).id);assert.equal(cell('wildlands',q,15).id,cell('fields-of-ash',q,0).id);}
});
test('clipped standalone corner cannot be occupied until its neighboring half is present',()=>{
  const wild=joinReviewedBoards(['wildlands']);
  assert.equal(wild.hexes.find(h=>h.id===wild.aliases['wildlands-0-15']).prohibited,true);
  assert.equal(cell('wildlands',0,15).prohibited,undefined);
});
test('visual map witnesses fix terrain, settlement crests and lair-body coordinates',()=>{
  assert.equal(cell('wildlands',10,1).terrain,'mountain');
  assert.equal(cell('wildlands',3,12).terrain,'sea');
  assert.equal(cell('wildlands',0,9).coastal,true);
  assert.equal(cell('wildlands',8,8).terrain,'sea');
  assert.equal(cell('wildlands',9,8).terrain,'sea');
  assert.equal(cell('imperial-heartland',13,5).terrain,'lair');
  assert.notEqual(cell('imperial-heartland',13,6).terrain,'lair');
  assert.equal(cell('imperial-heartland',8,14).settlement.loyalty,'mara-mitai');
  assert.equal(cell('imperial-heartland',3,13).settlement.loyalty,'assassins-guild');
  assert.equal(cell('fields-of-ash',2,14).settlement.loyalty,'mara-mitai');
  assert.equal(cell('wildlands',11,9).lairPool,'sea');
  assert.equal(cell('imperial-heartland',13,5).lairPool,'land');
});
test('rulebook p18 course is traversable along the river, while crossing its bank ends shipping',()=>{
  const route=[[7,2],[8,3],[8,4],[7,4],[7,5],[7,6],[8,7]].map(([q,j])=>cell('wildlands',q,j));
  for(let i=1;i<route.length;i++)assert.equal(route[i-1].edges[route[i].id].waterway,true,`${i} course edge`);
  assert.equal(cell('wildlands',8,4).edges[cell('wildlands',9,4).id].river,2);
  assert.notEqual(cell('wildlands',8,4).edges[cell('wildlands',9,4).id].waterway,true);
});
test('reviewed crossings are reciprocal and no cell acquires a seventh neighbor',()=>{
  const state=createGame({...tabletopConfig(ids,'Map inspection'),profile:'basic',tabletop:false});
  for(const h of map.hexes){assert.ok(adjacentHexes(state,h.id).length<=6);for(const [id,e] of Object.entries(h.edges??{})){assert.deepEqual(map.hexes.find(v=>v.id===id).edges[h.id],e);assert.ok(!(e.sea&&e.coastal));}}
  assert.equal(map.hexes.filter(h=>h.settlement).length,66);
  assert.equal(map.hexes.filter(h=>h.mine).length,11);
  assert.equal(map.hexes.filter(h=>h.terrain==='lair').length,22);
});
test('source map qualification survives custom-table backups',()=>{
  const state=createGame(tabletopConfig(ids,'Four board table'));
  assert.deepEqual(validateState(state),[]);assert.deepEqual(importGame(exportGame(state)),state);
  assert.ok(reviewedBoards.every(b=>typeof b.complete.edges==='boolean'));
  assert.ok(map.uncertainties>0);assert.equal(map.complete,false);
});
test('independently reviewed board seams preserve roads, river banks and shorelines',()=>{
  const edge=(ba,a,bb,b)=>cell(ba,...a).edges[cell(bb,...b).id];
  assert.equal(edge('broken-coast',[13,4],'wildlands',[0,4]).road,true);
  assert.equal(edge('imperial-heartland',[13,7],'fields-of-ash',[0,7]).road,true);
  assert.equal(edge('imperial-heartland',[13,7],'fields-of-ash',[0,7]).river,1);
  assert.equal(cell('fields-of-ash',0,1).terrain,'forest');
  assert.equal(cell('fields-of-ash',0,1).coastal,true);
  assert.notEqual(edge('wildlands',[11,14],'fields-of-ash',[11,0]).road,true);
  assert.equal(edge('fields-of-ash',[11,0],'fields-of-ash',[12,0]).road,true);
  assert.ok(edge('broken-coast',[5,14],'imperial-heartland',[5,0]).sea);
});
