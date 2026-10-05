import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, exportGame, importGame } from '../dist/js/engine.js';
import { getScenarioOptions } from '../dist/js/scenarios.js';
import { cardById } from '../dist/js/advanced.js';
import { renderCampaignDesk } from '../dist/js/campaign-desk.js';
import { fixture, active, give, placeHero, battle } from './fixtures/advanced.mjs';
import {
  createCompanion, recordCampaignEvent, getBriefing, getReplayEvents,
  getProjectionAt, markRead, visibleMessages, sendCampaignMessage,
  setDelegation, updateCompanionDifficulty, savePrivateNote,
  validateCompanionShape, EVENT_LIMIT, MESSAGE_LIMIT, messageTemplates
} from '../dist/js/async-play.js';

function local(config = fixture({ profile: 'basic' })) {
  const state = createGame(config);
  state.companion = createCompanion(state);
  return state;
}
function sandbox() {
  return local({ ...structuredClone(getScenarioOptions()[1].config), profile: 'basic' });
}
const record = (s, action) => recordCampaignEvent(s, applyAction(s, action), action);
const shape = s => validateCompanionShape(s.companion, s);

test('companion defaults migrate a legacy game without changing its deterministic state', () => {
  const s = createGame(fixture({ profile: 'basic' })), original = structuredClone(s);
  const c = createCompanion(s, { fjordland: 'hard' });
  assert.equal(c.version, 1);
  assert.equal(c.viewKingdom, 'fjordland');
  assert.equal(c.difficulty.fjordland, 'hard');
  assert.equal(c.difficulty.orcs, 'normal');
  assert.equal(c.briefingOnReturn, true);
  assert.deepEqual(s, original);
  assert.deepEqual(validateCompanionShape(undefined), []);
  assert.deepEqual(validateCompanionShape(c, s), []);
  assert.throws(() => createCompanion(s, { nonexistent: 'normal' }));
});

test('timeline records real movement and returns a read-only board projection without hands, decks, or RNG', () => {
  let s = local();
  s = record(s, { type: 'collect-income' });
  const before = structuredClone(s), rng = s.rng;
  const after = record(s, { type: 'move', unitId: 'unit-1', toHex: 'B' });
  const event = getReplayEvents(after, 'orcs').at(-1);
  assert.equal(event.before.units.find(u => u.id === 'unit-1').hexId, 'A');
  assert.equal(event.after.units.find(u => u.id === 'unit-1').hexId, 'B');
  assert.match(event.summary, /Freeholders.*moved.*A|fjordland town/);
  assert.deepEqual(Object.keys(event.after).sort(), ['controls', 'monsters', 'razed', 'units']);
  assert.equal(after.rng, rng);
  assert.deepEqual(s, before);
  assert.deepEqual(shape(after), []);
  const projection = getProjectionAt(after, 'orcs', event.seq);
  projection.units[0].hexId = 'F';
  assert.equal(getProjectionAt(after, 'orcs', event.seq).units[0].hexId, 'B');
  assert.equal(getProjectionAt(after, 'orcs', 9999), null);
});

test('private card acquisitions and future draw logs are visible only to the card owner', () => {
  const s = active(); give(s,'player-orcs','spell-52');s.companion = createCompanion(s);
  const next = structuredClone(s);
  give(next, 'player-fjordland', 'spell-52');
  next.log.push('Fjordland drew The Wrath of Bakari.');
  const after = recordCampaignEvent(s, next, { type: 'study', playerId: 'player-fjordland', discipline: 'spells' });
  const own = getReplayEvents(after, 'fjordland').at(-1);
  const opponent = getReplayEvents(after, 'orcs').at(-1);
  const name = cardById('spell-52').name;
  assert.ok(own.lines.some(line => line.includes(name)));
  assert.ok(!JSON.stringify(opponent).includes(name));
  assert.ok(!Object.hasOwn(opponent, 'privateLines'));
  assert.ok(!Object.hasOwn(after.companion.events[0], 'action'));
  assert.deepEqual(shape(after), []);
});

test('Coven placements, coordinates, and hidden-operation log lines stay out of opponent replay', () => {
  const s = sandbox(), town = s.hexes.find(h => h.settlement && !s.razed.includes(h.id));
  const next = structuredClone(s); next.covens.push(town.id);
  next.log.push(`Coven placement at ${town.settlement.name}: 6+0 succeeds.`);
  const after = recordCampaignEvent(s, next, { type: 'coven', hexId: town.id });
  const enemy = getReplayEvents(after, 'fjordland').at(-1);
  const own = getReplayEvents(after, 'night').at(-1);
  assert.equal(enemy.before.covens, undefined);
  assert.equal(enemy.after.covens, undefined);
  assert.ok(!enemy.lines.some(line => line.includes('Coven placement')));
  assert.ok(!enemy.summary.includes(town.settlement.name));
  assert.ok(own.lines.some(line => line.includes(town.settlement.name)));
  assert.deepEqual(own.after.covens, next.covens);
  assert.deepEqual(shape(after), []);
});

test('shared player hands are private to that player and are not revealed to allied independent seats', () => {
  const cfg = structuredClone(getScenarioOptions()[1].config);
  const s = local({ ...cfg, profile: 'advanced', players: [
    { id: 'shared', name: 'Shared resistance', kingdoms: ['fjordland', 'oathborn'] },
    ...cfg.scenario.kingdoms.filter(k => !['fjordland', 'oathborn'].includes(k.id)).map(k => ({ id: `player-${k.id}`, name: k.name, kingdoms: [k.id] }))
  ] });
  const next = structuredClone(s); give(next, 'shared', 'spell-52');
  const after = recordCampaignEvent(s, next, { type: 'study', playerId: 'shared', discipline: 'spells' });
  const name = cardById('spell-52').name;
  assert.ok(getReplayEvents(after, 'fjordland')[0].lines.some(line => line.includes(name)));
  assert.ok(getReplayEvents(after, 'oathborn')[0].lines.some(line => line.includes(name)));
  assert.ok(!JSON.stringify(getReplayEvents(after, 'empire')).includes(name));
  assert.ok(!JSON.stringify(getReplayEvents(after, 'night')).includes(name));
});

test('briefing counts visible map changes and independent read markers without altering gameplay', () => {
  const s = local(), next = structuredClone(s);
  next.units[0].hexId = 'B'; next.units[0].weakened = true;
  next.units.push({ id: `unit-${next.serial++}`, defId: 'army-a', kingdom: 'fjordland', hexId: 'D', activated: true, weakened: false });
  next.units.splice(1, 1); next.controls.C = 'fjordland'; next.razed.push('A');
  const after = recordCampaignEvent(s, next, { type: 'resolve-combat' });
  const briefing = getBriefing(after, 'fjordland');
  assert.deepEqual(briefing.keyChanges, { moved: 1, recruited: 1, eliminated: 1, weakened: 1, controlChanges: 1, razed: 1 });
  assert.equal(briefing.unreadCount, 1);
  const read = markRead(after, 'fjordland');
  assert.equal(getBriefing(read, 'fjordland').unreadCount, 0);
  assert.equal(getBriefing(read, 'orcs').unreadCount, 1);
  const { companion: ignoredBefore, ...gameBefore } = after;
  const { companion: ignoredAfter, ...gameAfter } = read;
  assert.deepEqual(gameAfter, gameBefore);
  assert.equal(after.companion.seenByKingdom.fjordland, 0);
});

test('rolling engine logs preserve only newly appended lines at the history boundary', () => {
  const s = local(); s.log = Array.from({ length: 250 }, (_, i) => `Old line ${i}`);
  const next = structuredClone(s); next.log.shift(); next.log.push('New visible outcome.');
  const after = recordCampaignEvent(s, next, { type: 'collect-income' });
  assert.deepEqual(getReplayEvents(after, 'fjordland')[0].lines, ['New visible outcome.']);
});

test('history remains bounded, warns when older unread events were discarded, and accepts retained serials', () => {
  let s = local();
  for (let i = 0; i < EVENT_LIMIT + 12; i++) {
    const next = structuredClone(s); next.turnSerial++; next.log.push(`Visible event ${i}`); next.log = next.log.slice(-250);
    s = recordCampaignEvent(s, next, { type: 'end-turn' }, true);
  }
  assert.equal(s.companion.events.length, EVENT_LIMIT);
  assert.equal(s.companion.eventSerial, EVENT_LIMIT + 12);
  const b = getBriefing(s, 'fjordland');
  assert.equal(b.truncated, true);
  assert.equal(b.unreadCount, EVENT_LIMIT);
  assert.equal(b.events[0].seq, 13);
  assert.deepEqual(shape(s), []);
});

test('recording an already-recorded transition is idempotent and does not double-count a briefing', () => {
  const s = local(), action = { type: 'collect-income' };
  const raw = applyAction(s, action), recorded = recordCampaignEvent(s, raw, action);
  const repeated = recordCampaignEvent(s, recorded, action);
  assert.equal(repeated.companion.eventSerial, 1);
  assert.deepEqual(repeated, recorded);
});

test('alliance chat and map pings reach exactly allies; table chat reaches every seat', () => {
  const s = sandbox(), hexId = s.hexes[0].id;
  const next = sendCampaignMessage(s, 'fjordland', 'Hold the pass.', { channel: 'alliance', hexId });
  assert.equal(visibleMessages(next, 'oathborn').length, 1);
  assert.equal(visibleMessages(next, 'empire').length, 1);
  assert.equal(visibleMessages(next, 'orcs').length, 0);
  assert.equal(visibleMessages(next, 'night').length, 0);
  assert.equal(visibleMessages(next, 'fjordland')[0].hexId, hexId);
  const publicMessage = sendCampaignMessage(next, 'night', 'Good luck.', { channel: 'table' });
  assert.equal(visibleMessages(publicMessage, 'orcs').length, 1);
  assert.equal(visibleMessages(publicMessage, 'fjordland').length, 2);
  assert.equal(s.companion.messages.length, 0);
  assert.equal(getBriefing(publicMessage, 'fjordland').unreadMessages, 2);
  assert.equal(getBriefing(markRead(publicMessage, 'fjordland'), 'fjordland').unreadMessages, 0);
  assert.deepEqual(shape(publicMessage), []);
});

test('computer coordination is constrained to quick messages and message inputs are bounded', () => {
  const s = local();
  const next = sendCampaignMessage(s, 'orcs', 'Ignored free-form AI text', { channel: 'table', template: 'attack', automatic: true });
  assert.equal(visibleMessages(next, 'fjordland')[0].text, messageTemplates.attack);
  assert.equal(visibleMessages(next, 'fjordland')[0].automatic, true);
  assert.throws(() => sendCampaignMessage(s, 'orcs', 'Arbitrary AI speech', { channel: 'table', automatic: true }), /templates/);
  assert.throws(() => sendCampaignMessage(s, 'orcs', 'a'.repeat(301), { channel: 'table' }), /300/);
  assert.throws(() => sendCampaignMessage(s, 'orcs', '  ', { channel: 'table' }));
  assert.throws(() => sendCampaignMessage(s, 'orcs', 'Ping', { channel: 'table', hexId: 'outside' }));
  assert.throws(() => sendCampaignMessage(s, 'orcs', 'Ping', { channel: 'private' }));
  assert.throws(() => sendCampaignMessage(s, 'orcs', '', { channel: 'table', template: 'toString' }), /quick message/);
});

test('chat caps messages without resetting serials or exposing alliance history', () => {
  let s = local();
  for (let i = 0; i < MESSAGE_LIMIT + 7; i++) s = sendCampaignMessage(s, 'fjordland', `Order ${i}`, { channel: 'alliance' });
  assert.equal(s.companion.messages.length, MESSAGE_LIMIT);
  assert.equal(s.companion.messageSerial, MESSAGE_LIMIT + 7);
  assert.equal(visibleMessages(s, 'orcs').length, 0);
  assert.equal(visibleMessages(s, 'fjordland')[0].seq, 8);
  assert.deepEqual(shape(s), []);
});

test('delegating and reclaiming a human seat preserves pending combat, turn, and random state', () => {
  let s = active(); s.companion = createCompanion(s);
  const hero = placeHero(s, 'hero-fjordland-17', 'A', 'unit-1');
  s = battle(s, { attacker: 'unit-2', defender: 'unit-1' });
  const before = structuredClone(s), delegate = setDelegation(s, 'fjordland', true, 'hard');
  assert.equal(delegate.kingdoms[0].controller, 'ai');
  assert.equal(delegate.companion.delegated.fjordland, true);
  assert.equal(delegate.companion.difficulty.fjordland, 'hard');
  assert.deepEqual(delegate.advanced.pending, s.advanced.pending);
  assert.deepEqual(delegate.advanced.battle, s.advanced.battle);
  assert.equal(delegate.rng, s.rng);
  assert.equal(delegate.currentKingdom, s.currentKingdom);
  assert.equal(delegate.units.some(u => u.id === hero.id), true);
  const reclaimed = setDelegation(delegate, 'fjordland', false);
  assert.equal(reclaimed.kingdoms[0].controller, 'human');
  assert.equal(reclaimed.companion.delegated.fjordland, false);
  assert.deepEqual(shape(reclaimed), []);
  assert.deepEqual(s, before);
});

test('original computer seats stay computer controlled while difficulty changes persist', () => {
  const s = local(fixture({ profile: 'basic', controllers: { fjordland: 'human', orcs: 'ai' } }));
  assert.throws(() => setDelegation(s, 'orcs', false), /human seat/);
  const next = updateCompanionDifficulty(s, 'orcs', 'hard');
  assert.equal(next.companion.difficulty.orcs, 'hard');
  assert.equal(next.kingdoms[1].controller, 'ai');
  assert.throws(() => updateCompanionDifficulty(s, 'orcs', 'impossible'));
  assert.deepEqual(shape(next), []);
});

test('private planning notes are bounded, independent, and do not leak into replay or messages', () => {
  const s = local(), next = savePrivateNote(s, 'fjordland', 'Secret flank at dawn.');
  assert.equal(next.companion.privateNotes.fjordland, 'Secret flank at dawn.');
  assert.equal(next.companion.privateNotes.orcs, '');
  assert.ok(!JSON.stringify(getReplayEvents(next, 'orcs')).includes('Secret flank'));
  assert.ok(!JSON.stringify(visibleMessages(next, 'orcs')).includes('Secret flank'));
  assert.throws(() => savePrivateNote(s, 'fjordland', 'x'.repeat(2001)));
  assert.deepEqual(shape(next), []);
});

test('companion save round trips retain delegation, message pings, private notes, and unread briefing state', () => {
  let s = local(); s = record(s, { type: 'collect-income' });
  s = setDelegation(s, 'fjordland', true, 'hard');
  s = sendCampaignMessage(s, 'fjordland', '', { channel: 'alliance', template: 'defend', hexId: 'A' });
  s = savePrivateNote(s, 'fjordland', 'Reinforce before attacking.');
  assert.deepEqual(importGame(exportGame(s)), s);
  assert.deepEqual(shape(s), []);
});

test('import gate rejects huge history, duplicate serials, forbidden private snapshots, forged recipients, and controller mismatch', () => {
  const s = record(local(), { type: 'collect-income' });
  for (const mutate of [
    c => { c.events = Array(EVENT_LIMIT + 1).fill(c.events[0]); },
    c => { c.events.push(structuredClone(c.events[0])); },
    c => { c.events[0].after.rng = 42; },
    c => { c.events[0].before.hands = { enemy: ['spell-52'] }; },
    c => { c.events[0].privateCovens.orcs = { before: ['A'], after: ['A'] }; },
    c => { c.difficulty.fjordland = 'unknown'; },
    c => { c.delegated.fjordland = true; },
    c => { c.privateNotes.fjordland = 'x'.repeat(2001); },
    c => { c.seenByKingdom.fjordland = 999; },
    c => { c.events[0].publicLines = ['x'.repeat(2001)]; }
  ]) {
    const c = structuredClone(s.companion); mutate(c);
    assert.ok(validateCompanionShape(c, s).length > 0);
  }
  const chat = sendCampaignMessage(s, 'fjordland', 'Secret ally chat.', { channel: 'alliance' });
  chat.companion.messages[0].recipients.push('orcs');
  assert.match(shape(chat).join(), /recipients/);
  const bad = structuredClone(s); bad.companion.events[0].after.hands = { enemy: ['spell-52'] };
  // The engine calls the same gate during import once companion is integrated.
  assert.ok(validateCompanionShape(bad.companion, bad).length);
});

test('desk presentation escapes free-form chat and notes without creating executable markup', () => {
  let s = local();
  const hostile = '</textarea><img src=x onerror=alert(1)><script>bad()</script>';
  s = sendCampaignMessage(s, 'fjordland', hostile, { channel: 'table' });
  s = savePrivateNote(s, 'fjordland', hostile);
  const options = { viewer: 'fjordland', tab: 'messages', replaySeq: null, replayEdge: 'after', selectedHex: null, botPaused: true };
  for (const tab of ['messages', 'notes']) {
    const html = renderCampaignDesk(s, { ...options, tab });
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(!html.includes('<img src=x'));
    assert.ok(!html.includes('<script>'));
  }
});

test('every opponent desk view keeps private hand receipts and private planning notes hidden', () => {
  const s = active();give(s,'player-orcs','spell-52'); s.companion = createCompanion(s);
  const next = structuredClone(s); give(next, 'player-fjordland', 'spell-52');
  let after = recordCampaignEvent(s, next, { type: 'study', playerId: 'player-fjordland', discipline: 'spells' });
  after = savePrivateNote(after, 'fjordland', 'Secret plan: attack under moonlight.');
  const privateName = cardById('spell-52').name;
  for (const tab of ['briefing', 'replay', 'command', 'messages', 'notes']) {
    const html = renderCampaignDesk(after, { viewer: 'orcs', tab, replaySeq: 1, replayEdge: 'after', selectedHex: null, botPaused: false });
    assert.ok(!html.includes(privateName), `Hand receipt leaked in ${tab}`);
    assert.ok(!html.includes('Secret plan:'), `Private note leaked in ${tab}`);
  }
  const own = renderCampaignDesk(after, { viewer: 'fjordland', tab: 'briefing', replaySeq: null, replayEdge: 'after', selectedHex: null, botPaused: false });
  assert.ok(own.includes(privateName));
});

test('replay detail keeps both movement endpoints in view while offering an unchanged whole-map observation', () => {
  const s = sandbox(), next = structuredClone(s), unit = s.units[0];
  const from = s.hexes.find(h => h.id === unit.hexId);
  const to = s.hexes.find(h => h.q === from.q + 1 && h.r === from.r);
  assert.ok(to);
  next.units[0].hexId = to.id;
  const after = recordCampaignEvent(s, next, { type: 'move', unitId: unit.id, toHex: to.id });
  const original = structuredClone(after);
  const options = { viewer: unit.kingdom, tab: 'replay', replaySeq: 1, replayEdge: 'after', selectedHex: null, botPaused: false };
  const detail = renderCampaignDesk(after, options);
  const overview = renderCampaignDesk(after, { ...options, replayOverview: true });
  const box = html => html.match(/<svg viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const [x, y, width, height] = box(detail), [, , wholeWidth, wholeHeight] = box(overview);
  assert.ok(width < wholeWidth && height < wholeHeight);
  for (const hex of [from, to]) {
    const px = hex.q * 33, py = Math.sqrt(3) * (hex.r + hex.q / 2) * 22;
    assert.ok(px > x && px < x + width && py > y && py < y + height, 'Both movement endpoints must remain visible');
  }
  assert.match(detail, /Action detail · read-only/);
  assert.match(overview, /Whole map · read-only/);
  assert.equal((detail.match(/<polygon /g) ?? []).length, s.hexes.length);
  assert.equal((overview.match(/<polygon /g) ?? []).length, s.hexes.length);
  assert.deepEqual(after, original);
});


test('foreign Monster command decisions retain the real commander in the briefing',()=>{
  const before=active();before.companion=createCompanion(before);
  before.advanced.pending={kind:'command',monsterId:'monster-new',choices:['orcs'],resume:null};
  before.advanced.monsters.push({id:'monster-old',defId:'monster-land-01',kingdom:'orcs',hexId:'B',weakened:false,activated:false,lair:false});
  const after=structuredClone(before);after.advanced.monsters=after.advanced.monsters.filter(m=>m.id!=='monster-old');
  const recorded=recordCampaignEvent(before,after,{type:'slink-away',monsterId:'monster-old'});
  assert.equal(getReplayEvents(recorded,'fjordland').at(-1).actor,'orcs');
  const command=recordCampaignEvent(before,after,{type:'magic-choice',value:'continue'});
  assert.equal(getReplayEvents(command,'fjordland').at(-1).actor,'orcs');
});

test('hit receipts tell every visible seat which public Army weakened or was eliminated',()=>{
  let s=active();battle(s,{attacker:'unit-1',defender:'unit-2',targetHex:'C',hits:1});s.companion=createCompanion(s);
  const hit={type:'allocate-hit',unitId:'unit-2'};s=recordCampaignEvent(s,applyAction(s,hit),hit);
  assert.match(getBriefing(s,'fjordland').events.at(-1).summary,/Orc Reavers was weakened/);
  battle(s,{attacker:'unit-1',defender:'unit-2',targetHex:'C',hits:1});s=recordCampaignEvent(s,applyAction(s,hit),hit);
  assert.match(getBriefing(s,'fjordland').events.at(-1).summary,/Orc Reavers was eliminated/);
  assert.equal(getReplayEvents(s,'fjordland').at(-1).after.units.some(u=>u.id==='unit-2'),false);
});
