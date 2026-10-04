import type { Controller, GameConfig, Hex, HexEdge, ScenarioDefinition, ScenarioKingdom, Settlement, Terrain, UnitDefinition } from './engine.js';

export interface ContentValidationIssue { path: string; message: string }
export class ContentValidationError extends Error {
  readonly issues: ContentValidationIssue[];
  constructor(issues: ContentValidationIssue[]) {
    super(`Content pack rejected: ${issues.slice(0, 5).map(x => `${x.path}: ${x.message}`).join('; ')}${issues.length > 5 ? `; and ${issues.length - 5} more` : ''}`);
    this.name = 'ContentValidationError'; this.issues = issues;
  }
}
type Obj = Record<string, unknown>;
const TERRAIN = ['clear', 'forest', 'mountain', 'swamp', 'sea', 'coastal', 'major-river', 'lair'] as const;
const ABILITIES = ['ranged', 'stealth', 'regenerate', 'flying', 'mage', 'siege', 'mining'];
const CHARACTERISTICS = ['feral', 'fragile', 'huge', 'siege', 'siege-engine'];
const DIRECTIONS = new Set(['1,0', '1,-1', '0,-1', '-1,0', '-1,1', '0,1']);
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/** Strict, bounded JSON importer. Never executes imported effects or JavaScript. */
export function validateContentPack(input: unknown): GameConfig {
  const issues: ContentValidationIssue[] = [];
  const fail = (path: string, message: string) => { if (issues.length < 150) issues.push({ path, message }); };
  if (typeof input === 'string') {
    if (input.length > 20_000_000) throw new ContentValidationError([{ path: '$', message: 'JSON exceeds 20 MB' }]);
    try { input = JSON.parse(input); } catch { throw new ContentValidationError([{ path: '$', message: 'Invalid JSON' }]); }
  }
  let visited = 0;
  const seen = new Set<object>();
  function inspect(value: unknown, path: string, depth: number): void {
    if (++visited > 200_000) { fail(path, 'Content exceeds 200,000 values'); return; }
    if (depth > 16) { fail(path, 'Content exceeds nesting depth 16'); return; }
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint' || value === undefined) { fail(path, 'Only JSON values are supported'); return; }
    if (typeof value === 'number' && !Number.isFinite(value)) fail(path, 'Number must be finite');
    if (typeof value === 'string' && value.length > 2_000_000) fail(path, 'String exceeds 2 MB');
    if (!value || typeof value !== 'object') return;
    if (seen.has(value)) { fail(path, 'Circular or shared object references are not JSON'); return; }
    seen.add(value);
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) { fail(path, 'Expected a plain JSON object'); return; }
    for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (Array.isArray(value) && key === 'length') continue;
      if (FORBIDDEN_KEYS.has(key)) fail(`${path}.${key}`, 'Unsafe object key');
      if (!('value' in d)) { fail(`${path}.${key}`, 'Accessors are unsupported'); continue; }
      inspect(d.value, `${path}.${key}`, depth + 1);
      if (visited > 200_000) break;
    }
  }
  inspect(input, '$', 0);
  if (issues.length) throw new ContentValidationError(issues);
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 20_000_000) throw new ContentValidationError([{ path: '$', message: 'JSON exceeds 20 MB' }]);
  function obj(v: unknown, path: string, keys: string[]): Obj {
    if (!v || typeof v !== 'object' || Array.isArray(v)) { fail(path, 'Expected an object'); return {}; }
    const o = v as Obj;
    for (const key of Object.keys(o)) if (!keys.includes(key)) fail(`${path}.${key}`, 'Unknown field');
    return o;
  }
  function arr(v: unknown, path: string, max: number, min = 0): unknown[] {
    if (!Array.isArray(v)) { fail(path, 'Expected an array'); return []; }
    if (v.length < min || v.length > max) { fail(path, `Expected ${min}–${max} entries`); return v.slice(0, max); }
    return v;
  }
  function str(v: unknown, path: string, max = 200, min = 1): string {
    if (typeof v !== 'string' || v.length < min || v.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) { fail(path, `Expected text of length ${min}–${max}`); return ''; }
    return v;
  }
  function id(v: unknown, path: string): string {
    const s = str(v, path, 80);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(s)) fail(path, 'ID must contain only letters, numbers, period, underscore or hyphen');
    if (FORBIDDEN_KEYS.has(s)) fail(path, 'ID conflicts with an unsafe object key');
    return s;
  }
  function num(v: unknown, path: string, min: number, max: number): number {
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < min || v > max) { fail(path, `Expected an integer ${min}–${max}`); return min; }
    return v;
  }
  function bool(v: unknown, path: string): boolean {
    if (typeof v !== 'boolean') { fail(path, 'Expected a boolean'); return false; } return v;
  }
  function one<T extends string>(v: unknown, path: string, choices: readonly T[]): T {
    if (typeof v !== 'string' || !choices.includes(v as T)) { fail(path, `Expected one of ${choices.join(', ')}`); return choices[0]; } return v as T;
  }
  function ids(v: unknown, path: string, max: number): string[] {
    const result = arr(v, path, max).map((x, i) => id(x, `${path}[${i}]`));
    if (new Set(result).size !== result.length) fail(path, 'Duplicate entries'); return result;
  }
  const top = obj(input, '$', ['version', 'hexes', 'unitDefinitions', 'scenario', 'controllers', 'seed']);
  if (top.version !== 1) fail('$.version', 'Supported content version is 1');
  const hexes: Hex[] = arr(top.hexes, '$.hexes', 5000, 1).map((v, i) => {
    const p = `$.hexes[${i}]`, o = obj(v, p, ['id', 'q', 'r', 'terrain', 'coastal', 'settlement', 'mine', 'entry', 'edges', 'prohibited']);
    const h: Hex = { id: id(o.id, `${p}.id`), q: num(o.q, `${p}.q`, -10000, 10000), r: num(o.r, `${p}.r`, -10000, 10000), terrain: one(o.terrain, `${p}.terrain`, TERRAIN) as Terrain };
    if (o.mine !== undefined) h.mine = bool(o.mine, `${p}.mine`);
    if (o.coastal !== undefined) h.coastal = bool(o.coastal, `${p}.coastal`);
    if (o.prohibited !== undefined) h.prohibited = bool(o.prohibited, `${p}.prohibited`);
    if (o.entry !== undefined) h.entry = id(o.entry, `${p}.entry`);
    if (o.settlement !== undefined) {
      const s = obj(o.settlement, `${p}.settlement`, ['name', 'loyalty', 'city', 'fortified', 'port', 'wilderness', 'neutralFriendlyTo']);
      const settlement: Settlement = { name: str(s.name, `${p}.settlement.name`), loyalty: s.loyalty === null ? null : id(s.loyalty, `${p}.settlement.loyalty`), city: bool(s.city, `${p}.settlement.city`), fortified: num(s.fortified, `${p}.settlement.fortified`, 0, 2) as 0 | 1 | 2, port: bool(s.port, `${p}.settlement.port`) };
      if (s.wilderness !== undefined) settlement.wilderness = one(s.wilderness, `${p}.settlement.wilderness`, ['forest', 'mountain'] as const);
      if (s.neutralFriendlyTo !== undefined) settlement.neutralFriendlyTo = ids(s.neutralFriendlyTo, `${p}.settlement.neutralFriendlyTo`, 20);
      h.settlement = settlement;
      if (h.terrain === 'sea' || h.terrain === 'lair') fail(p, 'Settlement cannot be in Sea or Lair terrain');
    }
    if (o.edges !== undefined) {
      const e = obj(o.edges, `${p}.edges`, Object.keys((o.edges && typeof o.edges === 'object') ? o.edges : {}));
      if (Object.keys(e).length > 6) fail(`${p}.edges`, 'A hex can have at most six neighbors');
      h.edges = {};
      for (const [neighbor, edge] of Object.entries(e)) {
        id(neighbor, `${p}.edges key`);
        const x = obj(edge, `${p}.edges.${neighbor}`, ['road', 'river', 'sea', 'coastal']); const out: HexEdge = {};
        for (const flag of ['road', 'sea', 'coastal'] as const) if (x[flag] !== undefined) out[flag] = bool(x[flag], `${p}.edges.${neighbor}.${flag}`);
        if (x.river !== undefined) out.river = num(x.river, `${p}.edges.${neighbor}.river`, 1, 2) as 1 | 2;
        if (out.sea && out.coastal) fail(`${p}.edges.${neighbor}`, 'Edge cannot be both Sea and Coastal');
        h.edges[neighbor] = out;
      }
    }
    return h;
  });
  const unitDefinitions: UnitDefinition[] = arr(top.unitDefinitions, '$.unitDefinitions', 1000, 1).map((v, i) => {
    const p = `$.unitDefinitions[${i}]`, o = obj(v, p, ['id', 'name', 'kingdom', 'cost', 'recoveryCost', 'movement', 'light', 'heavy', 'weakenedLight', 'weakenedHeavy', 'abilities', 'characteristics', 'count', 'art']);
    const d: UnitDefinition = { id: id(o.id, `${p}.id`), name: str(o.name, `${p}.name`), kingdom: id(o.kingdom, `${p}.kingdom`), cost: num(o.cost, `${p}.cost`, 0, 100), recoveryCost: num(o.recoveryCost, `${p}.recoveryCost`, 0, 100), movement: num(o.movement, `${p}.movement`, 0, 30), light: num(o.light, `${p}.light`, 0, 50), heavy: num(o.heavy, `${p}.heavy`, 0, 50), count: num(o.count, `${p}.count`, 1, 2000), abilities: arr(o.abilities, `${p}.abilities`, 7).map((a, j) => one(a, `${p}.abilities[${j}]`, ABILITIES)), characteristics: arr(o.characteristics, `${p}.characteristics`, 3).map((a, j) => one(a, `${p}.characteristics[${j}]`, CHARACTERISTICS)) };
    if (new Set(d.abilities).size !== d.abilities.length || new Set(d.characteristics).size !== d.characteristics.length) fail(p, 'Duplicate ability or characteristic');
    if (o.weakenedLight !== undefined) d.weakenedLight = num(o.weakenedLight, `${p}.weakenedLight`, 0, 50);
    if (o.weakenedHeavy !== undefined) d.weakenedHeavy = num(o.weakenedHeavy, `${p}.weakenedHeavy`, 0, 50);
    if (o.art !== undefined) {
      const art = str(o.art, `${p}.art`, 2_000_000);
      if (!(/^[a-zA-Z0-9_./-]+\.(png|webp|jpe?g|gif)$/i.test(art) && !art.split('/').includes('..')) && !/^https:\/\/[^\s<>]+$/i.test(art) && !/^data:image\/(png|webp|jpeg|gif);base64,[A-Za-z0-9+/=]+$/.test(art)) fail(`${p}.art`, 'Art must be a safe raster path, HTTPS URL or raster data URL');
      d.art = art;
    }
    return d;
  });
  const s = obj(top.scenario, '$.scenario', ['id', 'name', 'official', 'source', 'startYear', 'startSeason', 'endYear', 'endSeason', 'turnOrder', 'kingdoms', 'initialUnits', 'initialControls', 'initialRazed', 'initialCovens', 'objective', 'notes', 'empireRevoltModifier']);
  const kingdoms: ScenarioKingdom[] = arr(s.kingdoms, '$.scenario.kingdoms', 6, 2).map((v, i) => {
    const p = `$.scenario.kingdoms[${i}]`, o = obj(v, p, ['id', 'name', 'side', 'gold', 'income', 'revolt', 'controlLimit', 'cityCollapseThreshold']);
    const k: ScenarioKingdom = { id: id(o.id, `${p}.id`), name: str(o.name, `${p}.name`), side: one(o.side, `${p}.side`, ['invader', 'resistance']), gold: num(o.gold, `${p}.gold`, 0, 10000), income: num(o.income, `${p}.income`, 0, 1000) };
    if (o.revolt !== undefined) k.revolt = num(o.revolt, `${p}.revolt`, 0, 19);
    if (o.controlLimit !== undefined) k.controlLimit = num(o.controlLimit, `${p}.controlLimit`, 0, 1000);
    if (o.cityCollapseThreshold !== undefined) k.cityCollapseThreshold = num(o.cityCollapseThreshold, `${p}.cityCollapseThreshold`, 1, 100);
    return k;
  });
  const objective = obj(s.objective, '$.scenario.objective', ['type', 'kingdom', 'hexIds', 'count', 'deadlineOnly']);
  const scenario: ScenarioDefinition = { id: id(s.id, '$.scenario.id'), name: str(s.name, '$.scenario.name'), official: bool(s.official, '$.scenario.official'), source: str(s.source, '$.scenario.source', 2000), startYear: num(s.startYear, '$.scenario.startYear', 1, 10000), startSeason: num(s.startSeason, '$.scenario.startSeason', 0, 2) as 0 | 1 | 2, endYear: num(s.endYear, '$.scenario.endYear', 1, 10000), endSeason: num(s.endSeason, '$.scenario.endSeason', 0, 2) as 0 | 1 | 2, turnOrder: ids(s.turnOrder, '$.scenario.turnOrder', 6), kingdoms, initialUnits: arr(s.initialUnits, '$.scenario.initialUnits', 2000).map((v, i) => { const p = `$.scenario.initialUnits[${i}]`, o = obj(v, p, ['defId', 'hexId', 'weakened']); const u: ScenarioDefinition['initialUnits'][number] = { defId: id(o.defId, `${p}.defId`), hexId: id(o.hexId, `${p}.hexId`) }; if (o.weakened !== undefined) u.weakened = bool(o.weakened, `${p}.weakened`); return u; }), objective: { type: one(objective.type, '$.scenario.objective.type', ['control', 'survival']), hexIds: ids(objective.hexIds, '$.scenario.objective.hexIds', 5000), count: num(objective.count, '$.scenario.objective.count', 0, 5000) } };
  if (objective.kingdom !== undefined) scenario.objective.kingdom = id(objective.kingdom, '$.scenario.objective.kingdom');
  if (objective.deadlineOnly !== undefined) scenario.objective.deadlineOnly = bool(objective.deadlineOnly, '$.scenario.objective.deadlineOnly');
  if (s.initialRazed !== undefined) scenario.initialRazed = ids(s.initialRazed, '$.scenario.initialRazed', 5000);
  if (s.initialCovens !== undefined) scenario.initialCovens = ids(s.initialCovens, '$.scenario.initialCovens', 5000);
  if (s.initialControls !== undefined) { const o = obj(s.initialControls, '$.scenario.initialControls', Object.keys((s.initialControls && typeof s.initialControls === 'object') ? s.initialControls : {})); scenario.initialControls = {}; for (const [h, k] of Object.entries(o)) scenario.initialControls[id(h, '$.scenario.initialControls key')] = id(k, `$.scenario.initialControls.${h}`); }
  if (s.notes !== undefined) scenario.notes = arr(s.notes, '$.scenario.notes', 100).map((v, i) => str(v, `$.scenario.notes[${i}]`, 2000));
  if (s.empireRevoltModifier !== undefined) scenario.empireRevoltModifier = num(s.empireRevoltModifier, '$.scenario.empireRevoltModifier', -6, 6);
  const hexMap = new Map(hexes.map(h => [h.id, h])), defMap = new Map(unitDefinitions.map(d => [d.id, d])), kingdomMap = new Map(kingdoms.map(k => [k.id, k]));
  if (hexMap.size !== hexes.length) fail('$.hexes', 'Duplicate hex ID');
  if (new Set(hexes.map(h => `${h.q},${h.r}`)).size !== hexes.length) fail('$.hexes', 'Duplicate axial coordinate');
  if (defMap.size !== unitDefinitions.length) fail('$.unitDefinitions', 'Duplicate unit definition ID');
  if (kingdomMap.size !== kingdoms.length) fail('$.scenario.kingdoms', 'Duplicate kingdom ID');
  if (new Set(kingdoms.map(k => k.side)).size !== 2) fail('$.scenario.kingdoms', 'Both Invader and Resistance must participate');
  if (scenario.turnOrder.length !== kingdoms.length || scenario.turnOrder.some(k => !kingdomMap.has(k))) fail('$.scenario.turnOrder', 'Turn order must contain every participating kingdom exactly once');
  if (scenario.endYear * 3 + scenario.endSeason < scenario.startYear * 3 + scenario.startSeason) fail('$.scenario.endYear', 'End must not precede start');
  for (const h of hexes) for (const [neighbor, e] of Object.entries(h.edges ?? {})) {
    const n = hexMap.get(neighbor), p = `$.hexes.${h.id}.edges.${neighbor}`;
    if (!n) { fail(p, 'Unknown neighbor hex'); continue; }
    if (!DIRECTIONS.has(`${n.q - h.q},${n.r - h.r}`)) fail(p, 'Edge must join adjacent axial coordinates');
    const reverse = n.edges?.[h.id];
    if (!reverse) fail(p, 'Neighbor must declare reciprocal edge');
    else if ((!!e.road !== !!reverse.road) || ((e.river ?? 0) !== (reverse.river ?? 0)) || (!!e.sea !== !!reverse.sea) || (!!e.coastal !== !!reverse.coastal)) fail(p, 'Reciprocal edge properties disagree');
  }
  const occupied = new Set<string>(), supply = new Map<string, number>();
  scenario.initialUnits.forEach((u, i) => {
    const p = `$.scenario.initialUnits[${i}]`, d = defMap.get(u.defId), h = hexMap.get(u.hexId);
    if (!d) fail(`${p}.defId`, 'Unknown unit definition');
    else { if (!kingdomMap.has(d.kingdom)) fail(`${p}.defId`, 'Unit kingdom does not participate'); const count = (supply.get(d.id) ?? 0) + 1; supply.set(d.id, count); if (count > d.count) fail(`${p}.defId`, 'Opening deployment exceeds printed supply'); if (u.weakened && d.characteristics.includes('fragile')) fail(p, 'Fragile Army cannot deploy weakened'); }
    if (!h) fail(`${p}.hexId`, 'Unknown hex');
    else if (h.prohibited || h.terrain === 'sea' || h.terrain === 'lair' || (d && h.entry && h.entry !== d.kingdom)) fail(`${p}.hexId`, 'Illegal opening hex for unit');
    if (occupied.has(u.hexId)) fail(`${p}.hexId`, 'Basic game allows only one Army per hex'); occupied.add(u.hexId);
  });
  for (const [h, k] of Object.entries(scenario.initialControls ?? {})) { if (!hexMap.get(h)?.settlement) fail(`$.scenario.initialControls.${h}`, 'Control marker must reference a Settlement'); if (!kingdomMap.has(k)) fail(`$.scenario.initialControls.${h}`, 'Unknown controlling kingdom'); }
  for (const h of scenario.initialRazed ?? []) { if (!hexMap.get(h)?.settlement) fail('$.scenario.initialRazed', `Unknown Settlement ${h}`); if (scenario.initialControls?.[h]) fail('$.scenario.initialRazed', `Settlement ${h} cannot have Razed and Control markers together`); }
  for (const h of scenario.initialCovens ?? []) if (!hexMap.get(h)?.settlement) fail('$.scenario.initialCovens', `Unknown Settlement ${h}`);
  if (scenario.objective.kingdom && !kingdomMap.has(scenario.objective.kingdom)) fail('$.scenario.objective.kingdom', 'Unknown objective kingdom');
  for (const h of scenario.objective.hexIds) { if (!hexMap.has(h)) fail('$.scenario.objective.hexIds', `Unknown hex ${h}`); if (scenario.objective.type === 'control' && !hexMap.get(h)?.settlement) fail('$.scenario.objective.hexIds', `Control target ${h} must be a Settlement`); }
  if (scenario.objective.type === 'control' && (scenario.objective.count < 1 || scenario.objective.count > scenario.objective.hexIds.length)) fail('$.scenario.objective.count', 'Control count must be 1 through number of targets');
  if (scenario.objective.type === 'survival') {
    if (scenario.objective.hexIds.length || scenario.objective.count !== 0) fail('$.scenario.objective', 'Survival uses no hex targets and count zero');
    if (scenario.objective.kingdom && kingdomMap.get(scenario.objective.kingdom)?.side !== 'invader') fail('$.scenario.objective.kingdom', 'Survival target must be an Invader kingdom');
    if (scenario.objective.deadlineOnly === false) fail('$.scenario.objective.deadlineOnly', 'Survival is evaluated at the campaign deadline');
  }
  const config: GameConfig = { hexes, unitDefinitions, scenario };
  if (top.controllers !== undefined) { const o = obj(top.controllers, '$.controllers', kingdoms.map(k => k.id)); config.controllers = {}; for (const [k, c] of Object.entries(o)) config.controllers[k] = one(c, `$.controllers.${k}`, ['human', 'ai']) as Controller; }
  if (top.seed !== undefined) config.seed = num(top.seed, '$.seed', 0, 0xffffffff);
  if (issues.length) throw new ContentValidationError(issues);
  return config;
}
