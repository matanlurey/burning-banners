import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContentPack, ContentValidationError } from '../dist/js/content-validation.js';
import { hexes, unitDefinitions, scenario } from '../dist/js/content.js';

const fixture = () => ({
  version: 1,
  hexes: [
    { id: 'a', q: 0, r: 0, terrain: 'clear', settlement: {name: 'A', loyalty: 'one', city: true, fortified: 0, port: false}, edges: { b: { road: true } } },
    { id: 'b', q: 1, r: 0, terrain: 'clear', settlement: {name: 'B', loyalty: 'two', city: true, fortified: 0, port: false}, edges: { a: { road: true } } }
  ],
  unitDefinitions: [ { id: 'soldiers', name: 'Soldiers', kingdom: 'one', cost: 2, recoveryCost: 1, movement: 3, light: 2, heavy: 0, count: 2, abilities: [], characteristics: [] } ],
  scenario: { id: 'test', name: 'Test fixture', official: false, source: 'Synthetic validation fixture', startYear: 1, startSeason: 0, endYear: 1, endSeason: 2, turnOrder: ['one', 'two'], kingdoms: [{ id: 'one', name: 'One', side: 'invader', gold: 3, income: 1 }, { id: 'two', name: 'Two', side: 'resistance', gold: 3, income: 1 }], initialUnits: [{ defId: 'soldiers', hexId: 'a' }], objective: {type: 'control', kingdom: 'one', hexIds: ['b'], count: 1} }
});
test('valid content becomes a detached engine configuration', () => {
  const pack = fixture(), checked = validateContentPack(JSON.stringify(pack));
  assert.equal(checked.scenario.id, 'test'); assert.equal(checked.hexes.length, 2);
  pack.hexes[0].terrain = 'sea'; assert.equal(checked.hexes[0].terrain, 'clear');
});
test('actual bundled content imports with every reviewed unit definition', () => {
  const checked = validateContentPack({version: 1, hexes, unitDefinitions, scenario});
  assert.equal(checked.hexes.length, hexes.length);
  assert.equal(checked.unitDefinitions.length, 44);
  assert.equal(checked.scenario.id, scenario.id);
});
test('coastal may accompany wilderness terrain and requires a boolean', () => {
  const pack = fixture(); pack.hexes[0].terrain = 'forest'; pack.hexes[0].coastal = true;
  assert.equal(validateContentPack(pack).hexes[0].coastal, true);
  pack.hexes[0].coastal = 'yes'; assert.throws(() => validateContentPack(pack), /Expected a boolean/);
});
test('rejects asymmetric or non-adjacent hex graph', () => {
  const pack = fixture(); pack.hexes[1].edges.a.road = false;
  assert.throws(() => validateContentPack(pack), /Reciprocal edge properties disagree/);
  const distant = fixture(); distant.hexes[1].q = 5;
  assert.throws(() => validateContentPack(distant), /adjacent axial coordinates/);
});
test('rejects missing references, bad actors and excess supply', () => {
  const missing = fixture(); missing.scenario.initialUnits[0].defId = 'absent';
  assert.throws(() => validateContentPack(missing), /Unknown unit definition/);
  const actors = fixture(); actors.scenario.turnOrder = ['one'];
  assert.throws(() => validateContentPack(actors), /every participating kingdom/);
  const supply = fixture(); supply.unitDefinitions[0].count = 1;
  supply.scenario.initialUnits.push({defId:'soldiers', hexId:'b'});
  assert.throws(() => validateContentPack(supply), /printed supply/);
});
test('rejects executable values, prototype payloads and unsafe artwork', () => {
  const executable = fixture(); executable.scenario.effect = () => {};
  assert.throws(() => validateContentPack(executable), ContentValidationError);
  assert.throws(() => validateContentPack('{"version":1,"__proto__":{"polluted":true}}'), /Unsafe object key/);
  const dangerousID = fixture(); dangerousID.scenario.id = 'constructor';
  assert.throws(() => validateContentPack(dangerousID), /unsafe object key/);
  const art = fixture(); art.unitDefinitions[0].art = 'javascript:alert(1)';
  assert.throws(() => validateContentPack(art), /safe raster/);
  const svg = fixture(); svg.unitDefinitions[0].art = 'data:image/svg+xml,<svg onload="alert(1)"/>';
  assert.throws(() => validateContentPack(svg), /safe raster/);
});
test('requires correct types and rejects custom executable fields', () => {
  const number = fixture(); number.unitDefinitions[0].light = '2';
  assert.throws(() => validateContentPack(number), /Expected an integer/);
  const unknown = fixture(); unknown.scenario.effects = [];
  assert.throws(() => validateContentPack(unknown), /Unknown field/);
});
test('survival fixture has an explicit supported deadline predicate', () => {
  const pack = fixture(); pack.scenario.objective = {type: 'survival', kingdom: 'one', hexIds: [], count: 0, deadlineOnly: true};
  assert.equal(validateContentPack(pack).scenario.objective.type, 'survival');
  pack.scenario.objective.kingdom = 'two';
  assert.throws(() => validateContentPack(pack), /Invader kingdom/);
  pack.scenario.objective.kingdom = 'one'; pack.scenario.objective.count = 1;
  assert.throws(() => validateContentPack(pack), /count zero/);
});
