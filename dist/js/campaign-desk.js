import { AI_DIFFICULTIES } from './ai.js';
import { advancedActor, advancedDescription, playerFor } from './advanced.js';
import { createCompanion, getBriefing, getProjectionAt, getReplayEvents, messageTemplates, visibleMessages } from './async-play.js';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const name = (s, id) => s.kingdoms.find(k => k.id === id)?.name ?? id;
const date = (event) => `${['Spring', 'Summer', 'Autumn'][event.season]} ${event.year}`;
const factionColors = { oathborn: '#5f7f85', fjordland: '#a69462', empire: '#bc665a', night: '#9b748c', goblins: '#7e8761', orcs: '#9f6a4e' };
const factionColor = (id) => id ? factionColors[id] ?? '#657779' : '#8c7d58';
const button = (command, label, primary = false, disabled = false) => `<button type="button" class="${primary ? 'primary-button' : 'secondary-button'}" data-command="${command}"${disabled ? ' disabled' : ''}>${esc(label)}</button>`;
const unitName = (s, id) => s.unitDefinitions.find(d => d.id === id)?.name ?? id;
const placeName = (s, id) => s.hexes.find(h => h.id === id)?.settlement?.name ?? id;
function eventList(s, events, maximum = 20) {
    if (!events.length)
        return '<p class="desk-empty">Nothing new to report. Your next actions will appear here.</p>';
    return `<ol class="desk-events">${events.slice(-maximum).reverse().map(event => `<li><div class="desk-event-meta"><span>${esc(date(event))} · ${esc(name(s, event.actor))}</span>${event.automatic ? '<span class="desk-badge">Computer</span>' : ''}</div><p>${esc(event.summary)}</p>${event.lines.length ? `<details><summary>Visible details</summary><ul>${event.lines.map(line => `<li>${esc(line)}</li>`).join('')}</ul></details>` : ''}</li>`).join('')}</ol>${events.length > maximum ? `<p class="desk-note">Showing the latest ${maximum} of ${events.length} actions. Replay contains the retained history.</p>` : ''}`;
}
function briefing(s, viewer, c) {
    const b = getBriefing(s, viewer);
    const actor = advancedActor(s), decisionKingdom = s.kingdoms.find(k => k.id === actor);
    const decision = s.phase === 'game-over' ? 'Campaign finished' : `${name(s, actor)} · ${c.delegated[actor] ? 'Delegated computer' : decisionKingdom?.controller === 'ai' ? 'Computer' : 'Human'} · ${advancedDescription(s)?.title ?? (s.pendingCombat ? `${s.pendingCombat.stage} decision` : s.phase === 'income-actions' ? 'Income actions' : 'Activations')}`;
    const counts = [
        [b.keyChanges.moved, 'Moves'], [b.keyChanges.recruited, 'Recruits'],
        [b.keyChanges.eliminated, 'Losses'], [b.keyChanges.weakened, 'Weakened'],
        [b.keyChanges.controlChanges, 'Control changes'], [b.keyChanges.razed, 'Razed']
    ];
    return `<section class="desk-section" aria-labelledby="desk-brief-title"><div class="desk-section-heading"><div><h3 id="desk-brief-title">While you were away</h3><p>${esc(b.summary)}${b.unreadMessages ? ` ${b.unreadMessages} unread ${b.unreadMessages === 1 ? 'message' : 'messages'}.` : ''}</p></div><div class="desk-actions">${button('desk-read', 'Mark as read', false, !b.unreadCount && !b.unreadMessages)}${button('desk-replay-unread', 'Replay new actions', true, !b.events.length)}</div></div><p class="desk-current-decision"><strong>Needed next</strong><span>${esc(decision)}</span></p><label class="desk-check"><input id="desk-auto-brief" type="checkbox"${c.briefingOnReturn ? ' checked' : ''}>Show a briefing when I return to the game</label>${b.truncated ? '<p class="desk-notice">Some older actions have left the 250-action history. This briefing covers the retained actions.</p>' : ''}<div class="desk-stat-grid">${counts.filter(([count]) => Number(count) > 0).map(([count, label]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join('') || '<p class="desk-note">No board changes since your last briefing.</p>'}</div>${eventList(s, b.events)}</section>`;
}
function differences(s, event) {
    const oldUnits = new Map(event.before.units.map(u => [u.id, u]));
    const newUnits = new Map(event.after.units.map(u => [u.id, u]));
    const changes = [];
    for (const unit of event.after.units) {
        const old = oldUnits.get(unit.id), label = unitName(s, unit.defId);
        if (!old)
            changes.push({ hexId: unit.hexId, text: `${label} recruited at ${placeName(s, unit.hexId)}.` });
        else if (old.hexId !== unit.hexId)
            changes.push({ hexId: unit.hexId, text: `${label}: ${placeName(s, old.hexId)} → ${placeName(s, unit.hexId)}.` });
        else if (old.weakened !== unit.weakened)
            changes.push({ hexId: unit.hexId, text: `${label} ${unit.weakened ? 'weakened' : 'recovered'} at ${placeName(s, unit.hexId)}.` });
        else if (old.activated !== unit.activated)
            changes.push({ hexId: unit.hexId, text: `${label} ${unit.activated ? 'finished activation' : 'readied'} at ${placeName(s, unit.hexId)}.` });
    }
    for (const unit of event.before.units)
        if (!newUnits.has(unit.id))
            changes.push({ hexId: unit.hexId, text: `${unitName(s, unit.defId)} eliminated at ${placeName(s, unit.hexId)}.` });
    for (const id of new Set([...Object.keys(event.before.controls), ...Object.keys(event.after.controls)]))
        if (event.before.controls[id] !== event.after.controls[id])
            changes.push({ hexId: id, text: `${placeName(s, id)}: ${event.after.controls[id] ? name(s, event.after.controls[id]) + ' control' : 'control marker removed'}.` });
    for (const id of event.after.razed)
        if (!event.before.razed.includes(id))
            changes.push({ hexId: id, text: `${placeName(s, id)} razed.` });
    for (const monster of event.after.monsters)
        if (!event.before.monsters.some(m => m.id === monster.id))
            changes.push({ hexId: monster.hexId, text: `A Monster appeared at ${placeName(s, monster.hexId)}.` });
    return changes.slice(0, 24);
}
function replayFocusHexes(event) {
    const focus = new Set();
    const collectChanges = (before, after, changed) => {
        const old = new Map(before.map(item => [item.id, item]));
        const current = new Map(after.map(item => [item.id, item]));
        for (const item of after) {
            const previous = old.get(item.id);
            if (!previous || changed(previous, item)) {
                focus.add(item.hexId);
                if (previous)
                    focus.add(previous.hexId);
            }
        }
        for (const item of before)
            if (!current.has(item.id))
                focus.add(item.hexId);
    };
    collectChanges(event.before.units, event.after.units, (a, b) => a.hexId !== b.hexId || a.weakened !== b.weakened || a.activated !== b.activated);
    collectChanges(event.before.monsters, event.after.monsters, (a, b) => a.hexId !== b.hexId || a.activated !== b.activated || a.kingdom !== b.kingdom);
    for (const id of new Set([...Object.keys(event.before.controls), ...Object.keys(event.after.controls)]))
        if (event.before.controls[id] !== event.after.controls[id])
            focus.add(id);
    for (const id of new Set([...event.before.razed, ...event.after.razed]))
        if (event.before.razed.includes(id) !== event.after.razed.includes(id))
            focus.add(id);
    // These covens have already been filtered for the viewer by the model.
    for (const id of new Set([...event.before.covens ?? [], ...event.after.covens ?? []]))
        if (event.before.covens?.includes(id) !== event.after.covens?.includes(id))
            focus.add(id);
    if (!focus.size)
        for (const unit of event.after.units)
            if (unit.kingdom === event.actor)
                focus.add(unit.hexId);
    return [...focus];
}
function replayMap(s, projection, changes, edge, event, overview = false) {
    // Match the live map's flat-top axial orientation so landmarks stay familiar.
    const point = (q, r) => ({ x: q * 33, y: Math.sqrt(3) * (r + q / 2) * 22 });
    const points = s.hexes.map(hex => point(hex.q, hex.r));
    const focusIds = overview ? [] : replayFocusHexes(event);
    const focusedPoints = focusIds.map(id => s.hexes.find(hex => hex.id === id)).filter((hex) => !!hex).map(hex => point(hex.q, hex.r));
    const bounds = focusedPoints.length ? focusedPoints : points;
    // Two hexes of context include departure/destination and neighboring terrain.
    const padding = focusedPoints.length ? 86 : 29;
    const minX = Math.min(...bounds.map(p => p.x)) - padding, minY = Math.min(...bounds.map(p => p.y)) - padding;
    const width = Math.max(...bounds.map(p => p.x)) - minX + padding, height = Math.max(...bounds.map(p => p.y)) - minY + padding;
    const terrain = { clear: '#d1c8a2', forest: '#90a481', mountain: '#9c9b91', swamp: '#929d82', sea: '#8aadb5', coastal: '#b9c7b2', 'major-river': '#9bb6b3', lair: '#a59a91' };
    const hexPoints = Array.from({ length: 6 }, (_, i) => { const angle = i * 60 * Math.PI / 180; return `${(Math.cos(angle) * 21).toFixed(2)},${(Math.sin(angle) * 21).toFixed(2)}`; }).join(' ');
    const hexes = s.hexes.map(hex => {
        const p = point(hex.q, hex.r), razed = projection.razed.includes(hex.id), owner = projection.controls[hex.id] ?? (!razed ? hex.settlement?.loyalty ?? null : null);
        const change = changes.findIndex(c => c.hexId === hex.id);
        const covenant = projection.covens?.includes(hex.id);
        return `<g transform="translate(${p.x.toFixed(2)},${p.y.toFixed(2)})"><title>${esc(hex.id)} · ${esc(hex.terrain)}${hex.settlement ? ` · ${esc(hex.settlement.name)}` : ''}${owner ? ` · ${esc(name(s, owner))}` : ''}${razed ? ' · razed' : ''}</title><polygon points="${hexPoints}" fill="${terrain[hex.terrain] ?? '#ccc3a4'}" stroke="${change >= 0 ? '#fff9e7' : '#45534766'}" stroke-width="${change >= 0 ? 3 : .7}"/>${hex.settlement ? `<circle r="${hex.settlement.city ? 9 : 6}" fill="${razed ? '#343737' : factionColor(owner)}" stroke="#fff4d1" stroke-width="1.4"/>` : ''}${covenant ? '<path d="m0 -12 9 16-18 0Z" fill="#774994" stroke="#f8e2ff"/>' : ''}${change >= 0 ? `<circle cx="-15" cy="-15" r="8" fill="#223a45" stroke="#fff2ba"/><text x="-15" y="-12" text-anchor="middle" font-size="9" font-weight="700" fill="#fff2ba">${change + 1}</text>` : ''}</g>`;
    }).join('');
    const unitGroups = new Map();
    for (const unit of projection.units) {
        const group = unitGroups.get(unit.hexId) ?? [];
        group.push(unit);
        unitGroups.set(unit.hexId, group);
    }
    const units = [...unitGroups.entries()].map(([hexId, group]) => {
        const hex = s.hexes.find(h => h.id === hexId);
        if (!hex)
            return '';
        const p = point(hex.q, hex.r);
        return group.map((unit, index) => `<g transform="translate(${(p.x + (index ? 10 : -4)).toFixed(2)},${(p.y + (index ? -7 : 5)).toFixed(2)})"><title>${esc(unitName(s, unit.defId))} · ${esc(name(s, unit.kingdom))} · ${esc(placeName(s, hexId))} · ${unit.weakened ? 'weakened' : 'full strength'} · ${unit.activated ? 'finished' : 'ready'}</title><rect x="-6" y="-6" width="12" height="12" rx="2" fill="${factionColor(unit.kingdom)}" stroke="${unit.weakened ? '#ffdc8c' : '#172c33'}" stroke-width="${unit.weakened ? 2 : 1}"${unit.activated ? ' opacity=".6"' : ''}/></g>`).join('');
    }).join('');
    const monsters = projection.monsters.map(monster => {
        const hex = s.hexes.find(h => h.id === monster.hexId);
        if (!hex)
            return '';
        const p = point(hex.q, hex.r);
        return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="7" fill="#65485f" stroke="#fce9c4" stroke-width="1.5"><title>Monster · ${esc(placeName(s, hex.id))}</title></circle>`;
    }).join('');
    return `<p class="desk-map-mode">${overview || !focusedPoints.length ? 'Whole map' : 'Action detail'} · read-only</p><div class="desk-replay-map"><svg viewBox="${minX.toFixed(2)} ${minY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}" role="img" aria-label="Read-only ${edge === 'before' ? 'before' : 'after'} replay map. ${overview ? 'Whole map overview.' : 'Focused on this action.'} Numbered positions correspond to the change list below.">${hexes}${units}${monsters}</svg></div><div class="desk-map-legend"><span>■ Armies & Heroes</span><span>● Settlements</span><span>◉ Monsters</span><span>Numbers: changed positions</span></div>${changes.length ? `<ol class="desk-change-list">${changes.map(c => `<li>${esc(c.text)} <small>${esc(c.hexId)}</small></li>`).join('')}</ol>` : '<p class="desk-note">This action did not change public board positions.</p>'}`;
}
function replay(s, opts) {
    const events = getReplayEvents(s, opts.viewer);
    const chosen = events.find(e => e.seq === opts.replaySeq) ?? events.at(-1);
    if (!chosen)
        return '<section class="desk-section"><h3>Replay the campaign</h3><p class="desk-empty">Take an action to begin recording. Replay is an observation; it does not change the live game.</p></section>';
    const index = events.indexOf(chosen), projection = getProjectionAt(s, opts.viewer, chosen.seq, opts.replayEdge);
    const changes = differences(s, chosen);
    return `<section class="desk-section" aria-labelledby="desk-replay-title"><div class="desk-section-heading"><div><h3 id="desk-replay-title">Replay the campaign</h3><p>Read-only history. The live campaign keeps its current position.</p></div><span class="desk-badge">${index + 1} / ${events.length}</span></div><div class="desk-replay-controls">${button('desk-prev', '← Previous', false, index === 0)}<div class="desk-replay-field"><label for="desk-replay">Action</label><select id="desk-replay">${events.map(e => `<option value="${e.seq}"${e.seq === chosen.seq ? ' selected' : ''}>${esc(`${e.seq} · ${date(e)} · ${e.summary}`)}</option>`).join('')}</select></div>${button('desk-next', 'Next →', false, index === events.length - 1)}<div class="desk-replay-field"><label for="desk-edge">Position</label><select id="desk-edge"><option value="before"${opts.replayEdge === 'before' ? ' selected' : ''}>Before action</option><option value="after"${opts.replayEdge === 'after' ? ' selected' : ''}>After action</option></select></div>${button('desk-play', 'Play / pause replay', false, events.length < 2)}${button('desk-overview', opts.replayOverview ? 'Focus this action' : 'Whole map')}${button('close-modal', 'Return to live campaign')}</div><div class="desk-replay-caption"><strong>${esc(chosen.summary)}</strong><span>${esc(date(chosen))} · ${esc(name(s, chosen.actor))}${chosen.automatic ? ' · Computer' : ''}</span></div>${replayMap(s, projection, changes, opts.replayEdge, chosen, opts.replayOverview)}${chosen.lines.length ? `<details class="desk-replay-details" open><summary>Visible action details</summary><ul>${chosen.lines.map(line => `<li>${esc(line)}</li>`).join('')}</ul></details>` : ''}</section>`;
}
function command(s, opts, c) {
    const player = playerFor(s, opts.viewer);
    const members = player?.kingdoms ?? [opts.viewer];
    const humanMembers = members.filter(id => c.originalControllers[id] === 'human');
    const delegated = humanMembers.some(id => c.delegated[id]);
    const listNames = humanMembers.map(id => name(s, id)).join(', ');
    return `<section class="desk-section" aria-labelledby="desk-command-title"><h3 id="desk-command-title">Keep your campaign moving</h3><p>Delegate your human seat to the computer, then take control back whenever you return.</p><div class="desk-delegation"><div><strong>${humanMembers.length ? esc(listNames) : 'Computer-controlled seat'}</strong><p>${delegated ? 'Computer control is active for your seat.' : humanMembers.length ? 'You are in control.' : 'This seat began as a computer opponent.'}</p></div><div class="desk-actions">${humanMembers.length ? button(delegated ? 'desk-takeback' : 'desk-delegate', delegated ? 'Take control back' : 'Delegate to computer', true) : ''}${button('desk-pause', opts.botPaused ? 'Resume computer play' : 'Pause computer play')}</div></div><p class="desk-note">The computer acts while this game is open and running. Closing the browser stops play. Delegation is saved with the campaign.</p><div class="desk-command-grid">${s.kingdoms.map(kingdom => `<article class="desk-commander"><div class="desk-commander-title"><span class="desk-faction" style="background:${factionColor(kingdom.id)}"></span><strong>${esc(kingdom.name)}</strong><span class="desk-badge">${c.delegated[kingdom.id] ? 'Delegated' : kingdom.controller === 'ai' ? 'Computer' : 'Human'}</span></div><label for="desk-difficulty-${esc(kingdom.id)}">Computer difficulty</label><select id="desk-difficulty-${esc(kingdom.id)}" data-desk-difficulty="${esc(kingdom.id)}" aria-label="${esc(kingdom.name)} computer difficulty">${AI_DIFFICULTIES.map(d => `<option value="${d.id}"${c.difficulty[kingdom.id] === d.id ? ' selected' : ''}>${d.name}</option>`).join('')}</select><p>${esc(AI_DIFFICULTIES.find(d => d.id === c.difficulty[kingdom.id])?.description ?? AI_DIFFICULTIES[1].description)}</p>${c.delegated[kingdom.id] ? `<button type="button" class="secondary-button desk-reclaim" data-desk-reclaim="${esc(kingdom.id)}" title="Take back ${esc(kingdom.name)}">Take back ${esc(kingdom.name)}</button>` : ''}</article>`).join('')}</div></section>`;
}
function messages(s, opts, c) {
    const messages = visibleMessages(s, opts.viewer), unread = c.seenMessagesByKingdom[opts.viewer] ?? 0;
    const ping = opts.selectedHex && s.hexes.some(h => h.id === opts.selectedHex) ? opts.selectedHex : null;
    return `<section class="desk-section" aria-labelledby="desk-messages-title"><div class="desk-section-heading"><div><h3 id="desk-messages-title">Coordinate with the table</h3><p>Alliance messages are shown to your allies. Table messages are shown to every seat.</p></div>${button('desk-read', 'Mark as read')}</div><div class="desk-chat-composer"><div class="desk-form-row"><div class="desk-form-field"><label for="desk-channel">Audience</label><select id="desk-channel"><option value="alliance">Alliance only</option><option value="table">Whole table</option></select></div><div class="desk-form-field"><label for="desk-template">Quick message</label><select id="desk-template"><option value="">Write a message</option>${Object.entries(messageTemplates).map(([id, text]) => `<option value="${id}">${esc(text)}</option>`).join('')}</select></div></div><label for="desk-message">Message</label><textarea id="desk-message" maxlength="300" rows="3" placeholder="Share a plan, ask for support, or choose a quick message." aria-describedby="desk-message-note"></textarea><div class="desk-compose-actions"><label class="desk-check"><input id="desk-attach-ping" type="checkbox"${ping ? '' : ' disabled'}>${ping ? `Attach map ping: ${esc(placeName(s, ping))}` : 'Select a map position to attach a ping'}</label>${button('desk-send', 'Send message', true)}</div><p id="desk-message-note" class="desk-note">Up to 300 characters. Computers use the quick-message list.</p></div><div class="desk-message-list" role="log" aria-label="Campaign messages">${messages.length ? [...messages].reverse().map(m => `<article class="desk-message${m.seq > unread ? ' unread' : ''}"><div class="desk-event-meta"><strong>${esc(name(s, m.author))}${m.automatic ? ' · Computer' : ''}</strong><span>${m.channel === 'alliance' ? 'Alliance' : 'Table'} · ${esc(date(m))}</span></div><p>${esc(m.text)}</p>${m.hexId ? `<button type="button" class="desk-ping" data-desk-ping="${esc(m.hexId)}">Show ${esc(placeName(s, m.hexId))} on map ↗</button>` : ''}</article>`).join('') : '<p class="desk-empty">No messages yet. Start with a plan or a map ping.</p>'}</div></section>`;
}
function notes(s, opts, c) {
    return `<section class="desk-section" aria-labelledby="desk-notes-title"><h3 id="desk-notes-title">Your next move</h3><p>A private planning note for ${esc(name(s, opts.viewer))}. It is kept in the campaign backup and hidden from other seats in the desk.</p><label for="desk-note-text">Private note</label><textarea id="desk-note-text" maxlength="2000" rows="7" placeholder="Objectives, reinforcements, and what to do when you return…">${esc(c.privateNotes[opts.viewer] ?? '')}</textarea><div class="desk-actions">${button('desk-note', 'Save private note', true)}</div><p class="desk-note">Up to 2,000 characters.</p></section>`;
}
export function renderCampaignDesk(s, options) {
    const c = s.companion ?? createCompanion(s);
    const opts = { ...options, viewer: s.kingdoms.some(k => k.id === options.viewer) ? options.viewer : c.viewKingdom };
    const b = getBriefing(s, opts.viewer);
    const tabs = [['briefing', 'Briefing'], ['replay', 'Replay'], ['command', 'Command'], ['messages', `Messages${b.unreadMessages ? ` (${b.unreadMessages})` : ''}`], ['notes', 'Notes']];
    const content = opts.tab === 'replay' ? replay(s, opts) : opts.tab === 'command' ? command(s, opts, c) : opts.tab === 'messages' ? messages(s, opts, c) : opts.tab === 'notes' ? notes(s, opts, c) : briefing(s, opts.viewer, c);
    return `<div class="campaign-desk"><div class="desk-heading"><div class="eyebrow">Your campaign desk</div><h3>${esc(name(s, opts.viewer))}</h3><p>Pick up the campaign where you left it.</p></div><nav class="desk-tabs" aria-label="Campaign desk sections">${tabs.map(([id, label]) => `<button type="button" data-desk-tab="${id}" class="${opts.tab === id ? 'active' : ''}" aria-current="${opts.tab === id ? 'page' : 'false'}">${esc(label)}</button>`).join('')}</nav>${content}<p class="desk-local-note">This is a local table. Share campaign backup files to exchange turns; live remote chat and background play are not connected.</p></div>`;
}
