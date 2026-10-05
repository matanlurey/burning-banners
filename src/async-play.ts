import type { Action, Controller, GameState } from './engine.js';
import { cardById, monsterById, advancedActor } from './advanced.js';

/** Local campaign companion. Replays contain visible board information only;
 * they are observations and can never be restored as playable game states. */
export type AIDifficulty = 'easy' | 'normal' | 'hard';
export type MessageChannel = 'table' | 'alliance';
export const EVENT_LIMIT = 250;
export const MESSAGE_LIMIT = 200;
export const messageTemplates = {
  support: 'I can support your next attack.',
  defend: 'Please defend this position.',
  attack: 'Let us concentrate our attack here.',
  'need-gold': 'I need gold to reinforce my kingdom.',
  ready: 'I am ready for the next turn.',
  wait: 'Please wait; I am reviewing the position.',
  thanks: 'Thank you for the support.'
} as const;
export type MessageTemplate = keyof typeof messageTemplates;
export interface MapProjection {
  units: { id: string; defId: string; kingdom: string; hexId: string; weakened: boolean; activated: boolean }[];
  controls: Record<string, string>;
  razed: string[];
  monsters: { id: string; defId: string; kingdom: string | null; hexId: string; activated: boolean }[];
  /** Present only in an authorized viewer's returned projection. */
  covens?: string[];
}
export interface TimelineEvent {
  seq: number;
  turn: number;
  year: number;
  season: 0 | 1 | 2;
  actor: string;
  actionKind: string;
  automatic: boolean;
  summary: string;
  publicLines: string[];
  privateLines: Record<string, string[]>;
  before: MapProjection;
  after: MapProjection;
  privateCovens: Record<string, { before: string[]; after: string[] }>;
}
export interface VisibleTimelineEvent {
  seq: number; turn: number; year: number; season: 0 | 1 | 2;
  actor: string; actionKind: string; automatic: boolean; summary: string;
  lines: string[]; before: MapProjection; after: MapProjection;
}
export interface CampaignMessage {
  seq: number;
  turn: number;
  year: number;
  season: 0 | 1 | 2;
  author: string;
  channel: MessageChannel;
  recipients: string[];
  text: string;
  automatic: boolean;
  hexId?: string;
  template?: MessageTemplate;
}
export interface CampaignCompanion {
  version: 1;
  originalControllers: Record<string, Controller>;
  difficulty: Record<string, AIDifficulty>;
  delegated: Record<string, boolean>;
  viewKingdom: string;
  briefingOnReturn: boolean;
  seenByKingdom: Record<string, number>;
  seenMessagesByKingdom: Record<string, number>;
  eventSerial: number;
  messageSerial: number;
  events: TimelineEvent[];
  messages: CampaignMessage[];
  privateNotes: Record<string, string>;
}
export interface CampaignBriefing {
  viewer: string;
  since: number;
  latestSeq: number;
  unreadCount: number;
  unreadMessages: number;
  truncated: boolean;
  summary: string;
  events: VisibleTimelineEvent[];
  keyChanges: { moved: number; recruited: number; eliminated: number; weakened: number; controlChanges: number; razed: number };
}

type CompanionGame = GameState & { companion?: CampaignCompanion };
const companionOf = (s: GameState) => (s as CompanionGame).companion;
const copy = <T>(value: T): T => structuredClone(value);
const kingdomIds = (s: GameState) => s.kingdoms.map(k => k.id);
const kingdomName = (s: GameState, id: string) => s.kingdoms.find(k => k.id === id)?.name ?? id;
const difficultyValid = (value: unknown): value is AIDifficulty => value === 'easy' || value === 'normal' || value === 'hard';
const requireKingdom = (s: GameState, id: string) => {
  if (!s.kingdoms.some(k => k.id === id)) throw new Error('Choose a kingdom in this campaign.');
};
const sameSide = (s: GameState, a: string, b: string) => s.kingdoms.find(k => k.id === a)?.side === s.kingdoms.find(k => k.id === b)?.side;
function withCompanion(s: GameState): CompanionGame {
  const next = copy(s) as CompanionGame;
  next.companion ??= createCompanion(s);
  return next;
}
export function createCompanion(s: GameState, difficulties: Record<string, AIDifficulty> = {}): CampaignCompanion {
  for (const [id, difficulty] of Object.entries(difficulties)) {
    requireKingdom(s, id);
    if (!difficultyValid(difficulty)) throw new Error('Choose Easy, Normal, or Hard.');
  }
  return {
    version: 1,
    originalControllers: Object.fromEntries(s.kingdoms.map(k => [k.id, k.controller])),
    difficulty: Object.fromEntries(s.kingdoms.map(k => [k.id, difficulties[k.id] ?? 'normal'])),
    delegated: Object.fromEntries(s.kingdoms.map(k => [k.id, false])),
    viewKingdom: s.kingdoms.find(k => k.controller === 'human')?.id ?? s.currentKingdom,
    briefingOnReturn: true,
    seenByKingdom: Object.fromEntries(s.kingdoms.map(k => [k.id, 0])),
    seenMessagesByKingdom: Object.fromEntries(s.kingdoms.map(k => [k.id, 0])),
    eventSerial: 0, messageSerial: 0, events: [], messages: [],
    privateNotes: Object.fromEntries(s.kingdoms.map(k => [k.id, '']))
  };
}

/** Coven positions never enter a public timeline snapshot. */
function project(s: GameState): MapProjection {
  return {
    units: s.units.map(({ id, defId, kingdom, hexId, weakened, activated }) => ({ id, defId, kingdom, hexId, weakened, activated })),
    controls: { ...s.controls }, razed: [...s.razed],
    monsters: (s.advanced?.monsters ?? []).map(({ id, defId, kingdom, hexId, activated }) => ({ id, defId, kingdom, hexId, activated }))
  };
}
function actionActor(s: GameState, action: Action): string {
  if ('casterId' in action && action.casterId) {
    const caster = s.units.find(u => u.id === action.casterId);
    if (caster) return caster.kingdom;
    const monster=s.advanced?.monsters.find(m=>m.id===action.casterId);if(monster?.kingdom)return monster.kingdom;
  }
  if ('kingdomId' in action && action.kingdomId) return action.kingdomId;
  if ('unitId' in action) {
    const unit = s.units.find(u => u.id === action.unitId);
    if (unit) return unit.kingdom;
  }
  if('monsterId'in action){const monster=s.advanced?.monsters.find(m=>m.id===action.monsterId);if(monster?.kingdom)return monster.kingdom;}
  if ('playerId' in action) {
    const player = s.advanced?.players.find(p => p.id === action.playerId);
    if (player) return player.kingdoms.includes(s.currentKingdom) ? s.currentKingdom : player.kingdoms.find(id => !s.kingdoms.find(k => k.id === id)?.collapsed) ?? player.kingdoms[0];
  }
  const pending = s.advanced?.pending;
  if (pending?.kind === 'hit') {
    const unit = s.units.find(u => u.id === pending.target);
    if (unit) return unit.kingdom;
  }
  return advancedActor(s);
}
function newLogLines(before: string[], after: string[]): string[] {
  // Engine logs are a rolling 250-line list. Find the surviving overlap.
  for (let length = Math.min(before.length, after.length); length > 0; length--) {
    if (before.slice(-length).every((line, index) => line === after[index])) return after.slice(length);
  }
  return [...after];
}
const privateAction = (action: Action) => action.type === 'coven' || action.type === 'remove-coven';
function summarize(before: GameState, after: GameState, action: Action, actor: string): string {
  const who = kingdomName(before, actor);
  const unit = 'unitId' in action ? before.units.find(u => u.id === action.unitId) : undefined;
  const name = unit ? before.unitDefinitions.find(d => d.id === unit.defId)?.name ?? unit.defId : '';
  const place = (id: string) => before.hexes.find(h => h.id === id)?.settlement?.name ?? id;
  switch (action.type) {
    case 'table-ruling': return action.private?`${who} adjusted private table components.`:`${who}: ${action.summary}`;
    case 'move': case 'ship': return `${who}: ${name} ${action.type === 'ship' ? 'sailed' : 'moved'} from ${place(unit!.hexId)} to ${place(action.toHex)}.`;
    case 'build': return `${who} recruited ${before.unitDefinitions.find(d => d.id === action.defId)?.name ?? action.defId} at ${place(action.hexId)}.`;
    case 'play-card': case 'hero-power': return `${who} ${action.type === 'hero-power' ? 'used' : 'played'} ${cardById(action.cardId)?.name ?? 'Magic'}${action.type === 'play-card' && action.tomeId ? ` with ${cardById(action.tomeId)?.name ?? 'a Tome'}` : ''}.`;
    case 'study': return `${who} studied ${action.discipline}.`;
    case 'finish-study': return `${who} finished Arcane Study.`;
    case 'finish-winter': return `${who} finished Winter preparation.`;
    case 'coven': case 'remove-coven': return `${who} conducted a secret operation.`;
    case 'collect-income': return `${who} collected income.`;
    case 'end-turn': return `${who} ended its kingdom turn.`;
    case 'attack': case 'attack-monster': return `${who}: ${name} attacked at ${place(action.targetHex)}.`;
    case 'recruit-hero': return `${who} recruited a Hero at ${place(action.hexId)}.`;
    case 'recover': case 'regenerate': return `${who}: ${name} recovered.`;
    case 'settlement': return `${who} chose to ${action.choice} the settlement.`;
    case 'transfer-gold': return `${who} sent support to ${kingdomName(before, action.toKingdom)}.`;
    case 'magic-pass': return `${who} passed its Magic response.`;
    case 'allocate-hit': {const survivor=after.units.find(u=>u.id===action.unitId);return `${who}: ${name} ${!survivor?'was eliminated':!unit?.weakened&&survivor.weakened?'was weakened':'took a hit'}.`;}
    case 'accept-hit': {const target=before.advanced?.pending?.kind==='hit'?before.advanced.pending.target:'';const monster=before.advanced?.monsters.find(m=>m.id===target);return monster?`${who}: ${monsterById(monster.defId)?.name??'Monster'} was defeated.`:`${who} applied a hit at ${place(target)}.`;}
    case 'activate': return `${who} activated ${name}.`;
    case 'pass': return `${who}: ${name} finished its activation.`;
    case 'resolve-combat': return after.lastCombat ? `${who} resolved the battle: ${after.lastCombat.result}.` : `${who} continued the battle.`;
    default: return `${who}: ${action.type.replaceAll('-', ' ')}.`;
  }
}
export function recordCampaignEvent(before: GameState, after: GameState, action: Action, automatic = false): GameState {
  const previous = companionOf(before);
  const next = withCompanion(after);
  if (!companionOf(after) && previous) next.companion = copy(previous);
  const c = next.companion!;
  // ApplyAction normally clones companion too; retain current after metadata.
  c.eventSerial = Math.max(c.eventSerial, previous?.eventSerial ?? 0);
  const actor = actionActor(before, action);
  const latest = c.events.at(-1);
  if (latest && latest.seq === (previous?.eventSerial ?? 0) + 1 && latest.actor === actor && latest.actionKind === action.type && latest.turn === before.turnSerial &&
    JSON.stringify(latest.before) === JSON.stringify(project(before)) && JSON.stringify(latest.after) === JSON.stringify(project(after))) return next;
  const publicLines: string[] = [], privateLines: Record<string, string[]> = {};
  const addPrivate = (id: string, line: string) => {
    // A model record must remain importable even at the engine's log bounds.
    if (!before.kingdoms.some(k => k.id === id)) return;
    const lines = privateLines[id] ??= [];
    lines.push(line.slice(0, 2000));
    if (lines.length > 40) lines.shift();
  };
  for (const line of newLogLines(before.log, after.log).slice(-40)) {
    // Hidden operations and card acquisitions are private even if a future
    // engine revision adds card names to its plain-text log.
    if(action.type==='table-ruling'&&action.private)addPrivate(actor,line);
    else if (privateAction(action) || /\bcoven\b/i.test(line) && !/\bcoven discovered\b/i.test(line)) addPrivate('night', line);
    else if (/\b(draws?|drew|drawn|retriev(?:e[sd]?|ing)|discard(?:s|ed)?|cost card)\b/i.test(line)) addPrivate(actor, line);
    else publicLines.push(line);
  }
  if (before.advanced && after.advanced) {
    for (const player of after.advanced.players) {
      const old = new Set(before.advanced.hands[player.id] ?? []);
      const gained = (after.advanced.hands[player.id] ?? []).filter(id => !old.has(id));
      if (gained.length) for (const id of player.kingdoms) addPrivate(id, `Received ${gained.map(id => cardById(id)?.name ?? 'a Magic card').join(', ')}.`);
    }
  }
  const privateCovens: TimelineEvent['privateCovens'] = {};
  if (before.kingdoms.some(k => k.id === 'night')) privateCovens.night = { before: [...before.covens], after: [...after.covens] };
  c.events.push({ seq: ++c.eventSerial, turn: before.turnSerial, year: before.year, season: before.season,
    actor, actionKind: action.type, automatic, summary: summarize(before, after, action, actor),
    publicLines, privateLines, before: project(before), after: project(after), privateCovens });
  if (c.events.length > EVENT_LIMIT) c.events.splice(0, c.events.length - EVENT_LIMIT);
  return next;
}
function visibleEvent(event: TimelineEvent, viewer: string): VisibleTimelineEvent {
  const before = copy(event.before), after = copy(event.after), covens = event.privateCovens[viewer];
  if (covens) { before.covens = [...covens.before]; after.covens = [...covens.after]; }
  return { seq: event.seq, turn: event.turn, year: event.year, season: event.season, actor: event.actor,
    actionKind: event.actionKind, automatic: event.automatic, summary: event.summary,
    lines: [...event.publicLines, ...(event.privateLines[viewer] ?? [])], before, after };
}
export function getReplayEvents(s: GameState, viewer: string): VisibleTimelineEvent[] {
  requireKingdom(s, viewer);
  return (companionOf(s)?.events ?? []).map(event => visibleEvent(event, viewer));
}
export function getProjectionAt(s: GameState, viewer: string, seq: number, edge: 'before' | 'after' = 'after'): MapProjection | null {
  requireKingdom(s, viewer);
  const event = companionOf(s)?.events.find(event => event.seq === seq);
  return event ? visibleEvent(event, viewer)[edge] : null;
}
export function getBriefing(s: GameState, viewer: string): CampaignBriefing {
  requireKingdom(s, viewer);
  const c = companionOf(s), since = c?.seenByKingdom[viewer] ?? 0;
  const events = getReplayEvents(s, viewer).filter(event => event.seq > since);
  const changes = { moved: 0, recruited: 0, eliminated: 0, weakened: 0, controlChanges: 0, razed: 0 };
  for (const event of events) {
    const before = new Map(event.before.units.map(u => [u.id, u]));
    const after = new Map(event.after.units.map(u => [u.id, u]));
    for (const unit of event.after.units) {
      const old = before.get(unit.id);
      if (!old) changes.recruited++;
      else { if (old.hexId !== unit.hexId) changes.moved++; if (!old.weakened && unit.weakened) changes.weakened++; }
    }
    changes.eliminated += event.before.units.filter(unit => !after.has(unit.id)).length;
    for (const id of new Set([...Object.keys(event.before.controls), ...Object.keys(event.after.controls)])) if (event.before.controls[id] !== event.after.controls[id]) changes.controlChanges++;
    changes.razed += event.after.razed.filter(id => !event.before.razed.includes(id)).length;
  }
  return { viewer, since, latestSeq: c?.eventSerial ?? 0, unreadCount: events.length,
    unreadMessages: visibleMessages(s, viewer).filter(message => message.seq > (c?.seenMessagesByKingdom[viewer] ?? 0)).length,
    truncated: !!events.length && since < events[0].seq - 1,
    summary: events.length ? `${events.length} ${events.length === 1 ? 'action' : 'actions'} since your last briefing.` : 'You are up to date.',
    events, keyChanges: changes };
}
export function markRead(s: GameState, viewer: string): GameState {
  requireKingdom(s, viewer);
  const next = withCompanion(s), c = next.companion!;
  c.seenByKingdom[viewer] = c.eventSerial;
  c.seenMessagesByKingdom[viewer] = c.messageSerial;
  return next;
}
export function visibleMessages(s: GameState, viewer: string): CampaignMessage[] {
  requireKingdom(s, viewer);
  return copy((companionOf(s)?.messages ?? []).filter(message => message.recipients.includes(viewer)));
}
export interface SendMessageOptions { channel: MessageChannel; hexId?: string; template?: MessageTemplate; automatic?: boolean }
export function sendCampaignMessage(s: GameState, viewer: string, text: string, options: SendMessageOptions): GameState {
  requireKingdom(s, viewer);
  if (options.channel !== 'table' && options.channel !== 'alliance') throw new Error('Choose table or alliance chat.');
  if (options.hexId && !s.hexes.some(hex => hex.id === options.hexId)) throw new Error('Choose a position on this map.');
  if (options.template && !Object.hasOwn(messageTemplates, options.template)) throw new Error('Choose a supported quick message.');
  if (options.automatic && !options.template) throw new Error('Computer messages use quick-message templates.');
  const value = options.template ? messageTemplates[options.template] : text.trim();
  if (!value || value.length > 300) throw new Error('Messages must contain 1–300 characters.');
  const next = withCompanion(s), c = next.companion!;
  const recipients = s.kingdoms.filter(k => options.channel === 'table' || sameSide(s, viewer, k.id)).map(k => k.id);
  c.messages.push({ seq: ++c.messageSerial, turn: s.turnSerial, year: s.year, season: s.season,
    author: viewer, channel: options.channel, recipients, text: value, automatic: options.automatic === true,
    ...(options.hexId ? { hexId: options.hexId } : {}), ...(options.template ? { template: options.template } : {}) });
  if (c.messages.length > MESSAGE_LIMIT) c.messages.splice(0, c.messages.length - MESSAGE_LIMIT);
  return next;
}
export function setDelegation(s: GameState, kingdom: string, on: boolean, difficulty?: AIDifficulty): GameState {
  requireKingdom(s, kingdom);
  if (difficulty !== undefined && !difficultyValid(difficulty)) throw new Error('Choose Easy, Normal, or Hard.');
  const next = withCompanion(s), c = next.companion!;
  if (c.originalControllers[kingdom] !== 'human') throw new Error('Only a human seat can be delegated.');
  c.delegated[kingdom] = on;
  if (difficulty) c.difficulty[kingdom] = difficulty;
  next.kingdoms.find(k => k.id === kingdom)!.controller = on ? 'ai' : 'human';
  return next;
}
export function updateCompanionDifficulty(s: GameState, kingdom: string, difficulty: AIDifficulty): GameState {
  requireKingdom(s, kingdom);
  if (!difficultyValid(difficulty)) throw new Error('Choose Easy, Normal, or Hard.');
  const next = withCompanion(s);
  next.companion!.difficulty[kingdom] = difficulty;
  return next;
}
export function savePrivateNote(s: GameState, kingdom: string, note: string): GameState {
  requireKingdom(s, kingdom);
  if (typeof note !== 'string' || note.length > 2000) throw new Error('Private notes must be at most 2,000 characters.');
  const next = withCompanion(s); next.companion!.privateNotes[kingdom] = note; return next;
}

/** Bounded, allow-listed import validation. No arbitrary state/history payloads. */
export function validateCompanionShape(value: unknown, state?: GameState): string[] {
  if (value === undefined) return [];
  const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
  const integer = (v: unknown, min: number, max = 10_000_000): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
  const string = (v: unknown, max = 100): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
  const only = (v: Record<string, any>, keys: string[]) => Object.keys(v).every(key => keys.includes(key));
  const strings = (v: unknown, limit = 5000) => Array.isArray(v) && v.length <= limit && v.every(id => string(id));
  const record = (v: unknown, valid: (v: any) => boolean, keys?: string[]) => object(v) && Object.keys(v).length <= 6 && Object.entries(v).every(([key, val]) => string(key) && (!keys || keys.includes(key)) && valid(val));
  if (!object(value) || !only(value, ['version', 'originalControllers', 'difficulty', 'delegated', 'viewKingdom', 'briefingOnReturn', 'seenByKingdom', 'seenMessagesByKingdom', 'eventSerial', 'messageSerial', 'events', 'messages', 'privateNotes'])) return ['Invalid campaign companion structure.'];
  const c = value;
  const ids = state?.kingdoms?.map(k => k.id) ?? Object.keys(object(c.originalControllers) ? c.originalControllers : {});
  const complete = (v: unknown, valid: (v: any) => boolean) => record(v, valid, ids) && Object.keys(v as object).length === ids.length;
  if (c.version !== 1 || ids.length < 2 || ids.length > 6 || !ids.includes(c.viewKingdom) || typeof c.briefingOnReturn !== 'boolean' ||
    !integer(c.eventSerial, 0) || !integer(c.messageSerial, 0) ||
    !complete(c.originalControllers, v => v === 'human' || v === 'ai') || !complete(c.difficulty, difficultyValid) || !complete(c.delegated, v => typeof v === 'boolean') ||
    !complete(c.seenByKingdom, v => integer(v, 0, c.eventSerial)) || !complete(c.seenMessagesByKingdom, v => integer(v, 0, c.messageSerial)) || !complete(c.privateNotes, v => typeof v === 'string' && v.length <= 2000)) return ['Invalid campaign companion settings.'];
  if (state) for (const kingdom of state.kingdoms) {
    if (c.delegated[kingdom.id] && c.originalControllers[kingdom.id] !== 'human' || kingdom.controller !== (c.delegated[kingdom.id] ? 'ai' : c.originalControllers[kingdom.id])) return ['Campaign delegation disagrees with its controller.'];
  }
  const hexIds = state ? new Set(state.hexes.map(h => h.id)) : null;
  const defIds = state ? new Set(state.unitDefinitions.map(d => d.id)) : null;
  const knownHex = (id: unknown) => string(id) && (!hexIds || hexIds.has(id));
  const lineList = (v: unknown) => Array.isArray(v) && v.length <= 40 && v.every(line => string(line, 2000));
  const projection = (p: unknown): boolean => object(p) && only(p, ['units', 'controls', 'razed', 'monsters']) &&
    Array.isArray(p.units) && p.units.length <= 2000 && new Set(p.units.map(u => u?.id)).size === p.units.length && p.units.every(u => object(u) && only(u, ['id', 'defId', 'kingdom', 'hexId', 'weakened', 'activated']) && string(u.id) && string(u.defId) && (!defIds || defIds.has(u.defId)) && ids.includes(u.kingdom) && knownHex(u.hexId) && typeof u.weakened === 'boolean' && typeof u.activated === 'boolean') &&
    object(p.controls) && Object.keys(p.controls).length <= 5000 && Object.entries(p.controls).every(([id, owner]) => knownHex(id) && ids.includes(owner)) &&
    strings(p.razed) && p.razed.every(knownHex) && new Set(p.razed).size === p.razed.length &&
    Array.isArray(p.monsters) && p.monsters.length <= 100 && new Set(p.monsters.map(m => m?.id)).size === p.monsters.length && p.monsters.every(m => object(m) && only(m, ['id', 'defId', 'kingdom', 'hexId', 'activated']) && string(m.id) && string(m.defId) && (m.kingdom === null || ids.includes(m.kingdom)) && knownHex(m.hexId) && typeof m.activated === 'boolean');
  if (!Array.isArray(c.events) || c.events.length > EVENT_LIMIT) return ['Campaign timeline exceeds its history limit.'];
  let seq = 0;
  for (const e of c.events) {
    if (!object(e) || !only(e, ['seq', 'turn', 'year', 'season', 'actor', 'actionKind', 'automatic', 'summary', 'publicLines', 'privateLines', 'before', 'after', 'privateCovens']) ||
      !integer(e.seq, seq + 1, c.eventSerial) || !integer(e.turn, 0) || !integer(e.year, 1, 10000) || ![0, 1, 2].includes(e.season) || !ids.includes(e.actor) || !string(e.actionKind) || typeof e.automatic !== 'boolean' || !string(e.summary, 2000) || !lineList(e.publicLines) || !record(e.privateLines, lineList, ids) || !projection(e.before) || !projection(e.after) ||
      !record(e.privateCovens, (p: any) => object(p) && only(p, ['before', 'after']) && strings(p.before) && strings(p.after) && p.before.every(knownHex) && p.after.every(knownHex), ids) || Object.keys(e.privateCovens).some(id => id !== 'night')) return ['Invalid campaign timeline event.'];
    if (seq !== 0 && e.seq !== seq + 1) return ['Campaign timeline has a missing event.'];
    seq = e.seq;
  }
  if (seq !== c.eventSerial) return ['Campaign timeline serial is inconsistent.'];
  if (!Array.isArray(c.messages) || c.messages.length > MESSAGE_LIMIT) return ['Campaign chat exceeds its message limit.'];
  seq = 0;
  for (const m of c.messages) {
    if (!object(m) || !only(m, ['seq', 'turn', 'year', 'season', 'author', 'channel', 'recipients', 'text', 'automatic', 'hexId', 'template']) || !integer(m.seq, seq + 1, c.messageSerial) || !integer(m.turn, 0) || !integer(m.year, 1, 10000) || ![0, 1, 2].includes(m.season) || !ids.includes(m.author) || !['table', 'alliance'].includes(m.channel) || !strings(m.recipients, 6) || new Set(m.recipients).size !== m.recipients.length || !m.recipients.includes(m.author) || m.recipients.some((id: string) => !ids.includes(id)) || !string(m.text, 300) || typeof m.automatic !== 'boolean' || m.hexId !== undefined && !knownHex(m.hexId) || m.template !== undefined && !Object.hasOwn(messageTemplates, m.template) || m.automatic && !m.template || m.template && m.text !== messageTemplates[m.template as MessageTemplate]) return ['Invalid campaign chat message.'];
    if (state) {
      const expected = state.kingdoms.filter(k => m.channel === 'table' || sameSide(state, m.author, k.id)).map(k => k.id);
      if (expected.length !== m.recipients.length || expected.some(id => !m.recipients.includes(id))) return ['Campaign chat has invalid recipients.'];
    }
    if (seq !== 0 && m.seq !== seq + 1) return ['Campaign chat has a missing message.'];
    seq = m.seq;
  }
  if (seq !== c.messageSerial) return ['Campaign chat serial is inconsistent.'];
  return [];
}
