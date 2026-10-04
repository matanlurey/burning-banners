import { createGame, applyAction, legalActions, moveOptions, shipOptions, combatForecast, botAction, validateState, exportGame, importGame } from './engine.js';
import { getScenarioOptions } from './scenarios.js';
const root = document.querySelector('#app');
const R = 72;
const SQRT3 = Math.sqrt(3);
const seasons = ['Spring', 'Summer', 'Autumn'];
const rulesURL = 'https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/';
const icons = {
    banner: '<path d="M5 21V3m0 1h13l-3 4 3 4H5m4 5 3 4 3-4"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
    army: '<path d="m12 3 8 4v6c0 4-4 7-8 9-4-2-8-5-8-9V7l8-4Zm-4 7 8 8m0-8-8 8M9 8l-3 1 1 3m8-4 3 1-1 3"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M14 8h-3a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3m2-10v12"/>',
    book: '<path d="M12 5C8 2 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15m-6-12 3 1m-3 3 3 1m6-5 3-1m-3 5 3-1"/>',
    history: '<path d="M4 9a8 8 0 1 1 0 7m0-12v5h5m3-1v5l3 2"/>',
    settings: '<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
    fit: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><path d="m8 8 8 8m0-8-8 8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    swords: '<path d="m5 4 14 15M19 4 5 19M3 16l5 5m8-18 5 5M3 3l2 6m16-6-2 6m-2 7 4 5"/>',
    move: '<path d="M4 18h5V6h10m-5-5 5 5-5 5"/>',
    sound: '<path d="m4 9 4 0 5-5v16l-5-5H4V9Zm12-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
    mute: '<path d="m4 9 4 0 5-5v16l-5-5H4V9Zm12 0 6 6m0-6-6 6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    ship: '<path d="M12 2v13M12 4l7 8h-7M10 6l-6 7h6M3 16h18l-3 5H6l-3-5Z"/>',
    pause: '<path d="M8 5v14m8-14v14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.info}</svg>`;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
const button = (cmd, name, glyph, cls = '', disabled = false) => `<button type="button" data-command="${esc(cmd)}" class="${cls}" ${disabled ? 'disabled' : ''}>${icon(glyph)}<span>${esc(name)}</span></button>`;
const color = (id) => { const key = id.toLowerCase(); return key.includes('fjord') ? '#a69462' : key.includes('oath') ? '#5f7f85' : key.includes('night') ? '#9b748c' : key.includes('orc') ? '#9f6a4e' : key.includes('gob') ? '#7e8761' : key.includes('emp') ? '#bc665a' : '#b49767'; };
const center = (hex) => ({ x: R * 1.5 * hex.q, y: R * SQRT3 * (hex.r + hex.q / 2) });
const points = Array.from({ length: 6 }, (_, i) => `${R * Math.cos(i * Math.PI / 3)},${R * Math.sin(i * Math.PI / 3)}`).join(' ');
const scenarioOptions = getScenarioOptions();
let config = scenarioOptions[0].config;
let selectedScenario = scenarioOptions[0].id;
config.controllers = Object.fromEntries(config.scenario.kingdoms.map((k, i) => [k.id, i ? 'ai' : 'human']));
let state = createGame(config);
let saved = null;
let selectedUnitId = null;
let selectedHex = null;
let sideTab = 'council';
let mobileOpen = false;
let modal = 'setup';
let modalParent = null;
let controllers = { ...config.controllers };
let seed = String(Date.now() % 1000000);
let camera = null;
let cameraBaseWidth = 1;
let shipMode = false;
let sound = false;
let audioCtx = null;
let saveStatus = 'Local save ready';
let saveError = false;
let curtain = null;
let botTimer = null;
let botPaused = false;
let botSteps = 0;
let botTurn = -1;
let noticeTimer = null;
let serialSaving = 0;
let saveClock = 0;
let gameHasBegun = false;
let recruitDefinition = null;
let currentActions = [];
let packLabel = null;
const getUnit = () => state.units.find(u => u.id === selectedUnitId);
const definition = (u) => state.unitDefinitions.find(d => d.id === u.defId);
const getHex = (id) => state.hexes.find(h => h.id === id);
const kingdom = (id) => state.kingdoms.find(k => k.id === id);
const kingdomName = (id) => kingdom(id)?.name || ({ oathborn: 'The Oathborn', fjordland: 'Fjordland', empire: 'Eastern Empire', night: 'Army of Night', goblins: 'The Goblins', orcs: 'The Orcs' }[id] || id);
const actor = () => state.pendingCombat?.decisionKingdom || state.currentKingdom;
const isBot = () => kingdom(actor())?.controller === 'ai';
const art = (d) => {
    if (d.art)
        return d.art;
    const name = d.name.toLowerCase();
    const key = name.includes('freeholder') ? 'freeholders' : name.includes('sea reaver') ? 'sea-reavers' : name.includes('ranger') ? 'rangers' : name.includes('berserk') ? 'berserkir' : name.includes('oath taker') || name.includes('oath-taker') ? 'oath-takers' : name.includes('iron legion') ? 'iron-legion' : name.includes('crossbow') ? 'kings-crossbows' : name.includes('miner') ? 'miners' : null;
    if (key)
        return `./assets/unit-${key}.webp`;
    const id = d.kingdom.toLowerCase();
    const faction = id.includes('fjord') ? 'fjordland' : id.includes('oath') ? 'oathborn' : id.includes('orc') ? 'orcs' : id.includes('gob') ? 'goblins' : id.includes('night') ? 'night' : 'empire';
    return `./assets/troop-${faction}.webp`;
};
const stateReady = () => !modal && !curtain && !isBot() && state.phase !== 'game-over';
const stats = (u) => { const d = definition(u); return { light: u.weakened ? d.weakenedLight ?? d.light : d.light, heavy: u.weakened ? d.weakenedHeavy ?? d.heavy : d.heavy, move: d.movement }; };
const selectedTargetAction = () => {
    const unit = getUnit();
    if (!unit || !selectedHex || unit.hexId === selectedHex)
        return undefined;
    const attack = currentActions.find(a => a.type === 'attack' && a.unitId === unit.id && a.targetHex === selectedHex);
    if (attack)
        return attack;
    return currentActions.find(a => a.type === (shipMode ? 'ship' : 'move') && a.unitId === unit.id && a.toHex === selectedHex);
};
const actionAttr = (action) => `data-action="${esc(JSON.stringify(action))}"`;
const actionLabel = (a) => {
    if (a.type === 'transfer-gold')
        return `Aid ${kingdomName(a.toKingdom)}`;
    const names = { recover: 'Recover to full strength', regenerate: 'Regenerate', mine: 'Work this mine', pass: 'Finish activation', coven: 'Raise a Coven', 'remove-coven': 'Remove this Coven', 'lay-waste': 'Lay waste', 'remove-control': 'Remove control', recolonize: 'Recolonize', 'disband-siege': 'Disband Siege', suppress: 'Suppress rebellion', 'collect-income': 'Collect income', 'end-turn': 'End kingdom turn' };
    return names[a.type] || a.type;
};
const objectiveText = () => {
    const obj = state.scenario.objective;
    const places = obj.hexIds.map(id => getHex(id)?.settlement?.name || id).join(', ');
    return obj.type === 'survival' ? `Hold out through ${seasons[state.scenario.endSeason]} ${state.scenario.endYear}. ${places ? `Protect ${places}.` : ''}` : `${obj.kingdom ? kingdomName(obj.kingdom) : 'The invaders'} must control ${obj.count} ${obj.count === 1 ? 'objective' : 'objectives'}${places ? `: ${places}` : ''}${obj.deadlineOnly ? ` by ${seasons[state.scenario.endSeason]} ${state.scenario.endYear}` : ''}.`;
};
function notify(message) {
    document.querySelector('.notification')?.remove();
    const div = document.createElement('div');
    div.className = 'notification';
    div.setAttribute('role', 'status');
    div.textContent = message;
    document.body.append(div);
    if (noticeTimer)
        clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => div.remove(), 4800);
}
async function db() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('burning-banners-war-table', 1);
        request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('saves'))
            request.result.createObjectStore('saves'); };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
async function persist() {
    const saving = ++serialSaving;
    const snapshot = state;
    const envelope = { savedAt: saveClock = Math.max(Date.now(), saveClock + 1), stateText: exportGame(snapshot) };
    try {
        const database = await db();
        if (saving !== serialSaving) {
            database.close();
            return;
        }
        await new Promise((resolve, reject) => {
            const tx = database.transaction('saves', 'readwrite');
            tx.objectStore('saves').put(JSON.stringify(envelope), 'latest');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
        database.close();
        if (saving === serialSaving) {
            saved = snapshot;
            saveStatus = 'Saved on this device';
            saveError = false;
        }
    }
    catch {
        if (saving !== serialSaving)
            return;
        try {
            localStorage.setItem('burning-banners-backup', JSON.stringify(envelope));
            saved = snapshot;
            saveStatus = 'Saved locally · backup';
            saveError = false;
        }
        catch {
            saveStatus = 'Save unavailable · export a copy';
            saveError = true;
        }
    }
    const indicator = document.querySelector('.save-status');
    if (indicator) {
        indicator.textContent = saveStatus;
        indicator.classList.toggle('error', saveError);
    }
}
async function loadSave() {
    const candidates = [];
    const read = (raw) => {
        if (typeof raw !== 'string')
            return;
        try {
            const envelope = JSON.parse(raw);
            if (typeof envelope.stateText === 'string' && typeof envelope.savedAt === 'number' && Number.isFinite(envelope.savedAt))
                candidates.push({ state: importGame(envelope.stateText), savedAt: envelope.savedAt });
            else
                candidates.push({ state: importGame(raw), savedAt: 0 });
        }
        catch { /* A malformed copy is not considered. */ }
    };
    try {
        const database = await db();
        const raw = await new Promise((resolve, reject) => { const req = database.transaction('saves').objectStore('saves').get('latest'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
        database.close();
        read(raw);
    }
    catch { /* Backup storage is checked below. */ }
    try {
        read(localStorage.getItem('burning-banners-backup'));
    }
    catch { /* Storage can be unavailable. */ }
    if (serialSaving || gameHasBegun)
        return;
    candidates.sort((a, b) => b.savedAt - a.savedAt);
    if (candidates[0]) {
        saved = candidates[0].state;
        saveClock = Math.max(saveClock, candidates[0].savedAt);
        state = saved;
        gameHasBegun = true;
        camera = null;
        saveStatus = 'Saved campaign found';
        render();
    }
}
function playSound(kind) {
    if (!sound)
        return;
    try {
        audioCtx ||= new AudioContext();
        void audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.value = kind === 'attack' ? 90 : kind === 'move' ? 250 : 175;
        gain.gain.setValueAtTime(.025, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .14);
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + .15);
    }
    catch {
        sound = false;
        notify('Audio is unavailable in this browser.');
    }
}
function perform(action, automatic = false) {
    if (!automatic && !stateReady())
        return;
    try {
        const beforeActor = actor();
        const beforeController = kingdom(beforeActor)?.controller;
        state = applyAction(state, action);
        playSound(action.type);
        const active = state.units.find(u => u.id === state.activeUnitId);
        if (active)
            selectedUnitId = active.id;
        if (selectedUnitId && !state.units.some(u => u.id === selectedUnitId))
            selectedUnitId = null;
        selectedHex = null;
        recruitDefinition = null;
        if (action.type === 'end-turn') {
            selectedUnitId = null;
            shipMode = false;
        }
        if (state.phase === 'game-over') {
            modal = 'victory';
            botPaused = true;
        }
        else if (actor() !== beforeActor && kingdom(actor())?.controller === 'human' && beforeController === 'human')
            curtain = actor();
        render();
        void persist();
        scheduleBot();
    }
    catch (error) {
        notify(error instanceof Error ? error.message : 'That action is not available.');
        render();
    }
}
function scheduleBot() {
    if (botTimer)
        clearTimeout(botTimer);
    if (!isBot() || modal || curtain || botPaused || state.phase === 'game-over')
        return;
    if (botTurn !== state.turnSerial) {
        botTurn = state.turnSerial;
        botSteps = 0;
    }
    if (++botSteps > 180) {
        botPaused = true;
        render();
        notify('Computer play paused after a long turn. Resume from the action bar.');
        return;
    }
    botTimer = setTimeout(() => {
        if (!isBot() || modal || curtain || botPaused)
            return;
        const action = botAction(state);
        if (action)
            perform(action, true);
        else {
            botPaused = true;
            render();
            notify('The computer has no legal action. You can save this position for inspection.');
        }
    }, 650);
}
function boardBounds(campaign = false) {
    const opening = state.units.map(u => getHex(u.hexId)).filter((h) => !!h);
    const coords = (campaign && state.scenario.id === 'drefeld-teaching' && opening.length ? opening : state.hexes).map(center);
    const minX = Math.min(...coords.map(c => c.x)) - R - 45;
    const minY = Math.min(...coords.map(c => c.y)) - R - 45;
    const maxX = Math.max(...coords.map(c => c.x)) + R + 45;
    const maxY = Math.max(...coords.map(c => c.y)) + R + 45;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
function fitBoard(campaign = false) {
    const bounds = boardBounds(campaign);
    if (campaign) {
        bounds.x -= R;
        bounds.y -= R;
        bounds.w += R * 2;
        bounds.h += R * 2;
    }
    const element = document.querySelector('.board-wrap');
    const aspect = element ? element.clientWidth / Math.max(1, element.clientHeight) : 1.4;
    let w = bounds.w, h = bounds.h;
    if (w / h < aspect)
        w = h * aspect;
    else
        h = w / aspect;
    camera = { x: bounds.x - (w - bounds.w) / 2, y: bounds.y - (h - bounds.h) / 2, w, h };
    cameraBaseWidth = w;
    updateCamera();
}
function zoom(multiplier, anchor) {
    if (!camera)
        return;
    const newW = Math.min(cameraBaseWidth * 1.3, Math.max(180, camera.w * multiplier));
    const ratio = newW / camera.w;
    const cx = anchor?.x ?? camera.x + camera.w / 2, cy = anchor?.y ?? camera.y + camera.h / 2;
    camera = { x: cx + (camera.x - cx) * ratio, y: cy + (camera.y - cy) * ratio, w: newW, h: camera.h * ratio };
    updateCamera();
}
function updateCamera() {
    const svg = document.querySelector('.board');
    if (camera && svg)
        svg.setAttribute('viewBox', `${camera.x} ${camera.y} ${camera.w} ${camera.h}`);
    const label = document.querySelector('.zoom-level');
    if (camera && label)
        label.textContent = `${Math.round(cameraBaseWidth / camera.w * 100)}%`;
}
function focusUnit(u) {
    const hex = getHex(u.hexId);
    if (!hex || !camera)
        return;
    const pos = center(hex);
    if (camera.w > 1800)
        zoom(900 / camera.w, pos);
    camera = { ...camera, x: pos.x - camera.w / 2, y: pos.y - camera.h / 2 };
    updateCamera();
}
function drawCounter(u, index) {
    const h = getHex(u.hexId);
    if (!h)
        return '';
    const d = definition(u), s = stats(u), pos = center(h);
    const friendly = u.kingdom === state.currentKingdom;
    const name = d.name.length > 18 ? d.name.slice(0, 17) + '…' : d.name;
    const stack = state.units.filter(v => v.hexId === u.hexId);
    const offset = (stack.findIndex(v => v.id === u.id) - (stack.length - 1) / 2) * 24;
    return `<g class="counter ${u.activated ? 'used' : ''} ${selectedUnitId === u.id ? 'selected' : ''}" transform="translate(${pos.x - 30 + offset},${pos.y - 36 + offset / 3})" data-unit="${esc(u.id)}" role="button" tabindex="0" aria-label="${esc(`${d.name}, ${kingdomName(u.kingdom)}, ${u.weakened ? 'weakened' : 'full strength'}, ${u.activated ? 'activated' : 'ready'}`)}">
    <title>${esc(d.name)} · ${esc(kingdomName(u.kingdom))} · ${s.light} Light / ${s.heavy} Heavy · Move ${s.move}</title>
    <rect class="counter-border" x="0" y="0" width="60" height="65" rx="1.5" style="stroke:${selectedUnitId === u.id ? '#fff2b4' : color(u.kingdom)};stroke-width:${selectedUnitId === u.id ? 3 : 2}"/>
    <clipPath id="counter-clip-${index}"><rect x="2" y="2" width="56" height="45"/></clipPath>
    <image href="${esc(art(d))}" x="2" y="2" width="56" height="45" preserveAspectRatio="xMidYMid slice" clip-path="url(#counter-clip-${index})"/>
    <rect x="2" y="2" width="56" height="9" fill="${color(u.kingdom)}" fill-opacity=".88"/>
    <text class="counter-faction" x="30" y="8.5" text-anchor="middle">${esc(kingdomName(u.kingdom).toUpperCase())}</text>
    <rect x="2" y="43" width="56" height="20" fill="#192028" fill-opacity=".9"/>
    <text class="counter-name" x="30" y="50.5" text-anchor="middle">${esc(name)}</text>
    <rect x="6" y="53" width="11" height="10" rx="1.5" fill="#eee5c9"/><text x="11.5" y="61.5" text-anchor="middle" class="counter-stat">${s.light}</text>
    <path d="m24 53 5-1 5 3v5l-5 3-5-3Z" fill="#45545d" stroke="#afbbc0" stroke-width=".5"/><text x="29" y="61.5" text-anchor="middle" class="counter-stat heavy">${s.heavy}</text>
    <text x="49" y="61" text-anchor="middle" class="counter-move">${s.move}›</text>
    ${u.weakened ? '<rect x="1" y="1" width="58" height="63" class="counter-weakened"/>' : ''}
    ${friendly && !u.activated ? '<circle cx="57" cy="3" r="3" fill="#e9dfb7" stroke="#273d33" stroke-width="1"/>' : ''}
  </g>`;
}
function renderMap() {
    const unit = getUnit();
    const movement = unit && unit.kingdom === state.currentKingdom ? (shipMode ? shipOptions(state, unit.id) : moveOptions(state, unit.id)) : [];
    const moveSet = new Set(movement.map(m => m.hexId));
    const attackSet = new Set(currentActions.filter(a => a.type === 'attack' && a.unitId === unit?.id).map(a => a.type === 'attack' ? a.targetHex : ''));
    const terrainColors = { clear: '#cbc19b', forest: '#7e9171', mountain: '#989486', swamp: '#829588', sea: '#92abb0', coastal: '#a2b5b0', 'major-river': '#92aaa6', lair: '#979076' };
    const terrainAsset = { coastal: 'sea', 'major-river': 'sea', lair: 'mountain' };
    const definitions = Object.keys(terrainColors).map(t => `<pattern id="terrain-${t}" width="200" height="200" patternUnits="userSpaceOnUse"><rect width="200" height="200" fill="${terrainColors[t]}"/><image href="./assets/terrain-${terrainAsset[t] || t}.webp" width="200" height="200" opacity=".92"/></pattern>`).join('');
    let roads = '';
    const byId = new Map(state.hexes.map(h => [h.id, h]));
    for (const hex of state.hexes)
        for (const [neighbor, edge] of Object.entries(hex.edges || {})) {
            const to = byId.get(neighbor);
            if (!to || hex.id > to.id)
                continue;
            const a = center(hex), b = center(to);
            if (edge.road)
                roads += `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" class="map-road"/>`;
            if (edge.river) {
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                const dx = b.x - a.x, dy = b.y - a.y;
                roads += `<path d="M${mx - dy * .3} ${my + dx * .3}L${mx + dy * .3} ${my - dx * .3}" class="map-river"/>`;
            }
        }
    const cells = state.hexes.map(h => {
        const p = center(h);
        const controlled = state.controls[h.id];
        const razed = state.razed.includes(h.id);
        const selected = selectedHex === h.id;
        const settlement = h.settlement;
        const landmark = h.mine ? 'mine' : razed ? 'ruin' : settlement?.city ? 'city' : settlement?.port ? 'port' : settlement ? 'village' : h.entry ? 'spire' : null;
        const label = settlement?.name || (h.mine ? 'Gold mine' : h.entry || '');
        return `<g class="hex-group ${selected ? 'selected' : ''} ${moveSet.has(h.id) ? 'move-option' : ''} ${attackSet.has(h.id) ? 'attack-option' : ''} ${h.prohibited ? 'unavailable' : ''}" transform="translate(${p.x},${p.y})" data-hex="${esc(h.id)}" role="button" tabindex="-1" aria-label="${esc(`${h.id}, ${h.terrain}${label ? `, ${label}` : ''}`)}">
      <title>${esc(h.id)} · ${esc(h.terrain)}${label ? ` · ${esc(label)}` : ''}${controlled ? ` · ${esc(kingdomName(controlled))} control` : ''}</title>
      <polygon class="hex-shape" points="${points}" fill="url(#terrain-${h.terrain})"/>
      ${controlled ? `<circle class="control-ring" r="24" stroke="${color(controlled)}"/>` : ''}
      ${landmark ? `<image href="./assets/landmark-${landmark}.webp" x="-28" y="-25" width="56" height="50" preserveAspectRatio="xMidYMid meet"/>` : ''}
      ${state.covens.includes(h.id) ? '<path d="m-10 4 10-19 10 19-10-5Z" fill="#634354" stroke="#e0b7ca" stroke-width="1.5"/>' : ''}
      ${label ? `<text class="map-name" text-anchor="middle" x="0" y="${landmark ? 39 : 9}">${esc(label)}</text>` : ''}
      ${moveSet.has(h.id) && !state.units.some(u => u.hexId === h.id) ? `<circle r="7" fill="#315d47" fill-opacity=".6" stroke="#d7e0b3"/><text x="0" y="3" text-anchor="middle" font-size="8" fill="#eeeacb">${movement.find(m => m.hexId === h.id)?.cost ?? ''}</text>` : ''}
      <text class="map-id" x="42" y="-36" text-anchor="middle">${esc(h.id)}</text>
    </g>`;
    }).join('');
    const target = selectedTargetAction();
    const path = target && (target.type === 'move' || target.type === 'ship') && target.path ? [unit?.hexId, ...target.path].filter((id) => !!id).map(id => getHex(id)).filter((h) => !!h).map(center) : [];
    const line = path.length > 1 ? `<polyline points="${path.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#f5e4ad" stroke-width="4" stroke-dasharray="5 7" stroke-linecap="round" pointer-events="none"/>` : '';
    const bounds = camera || boardBounds();
    const sortedUnits = state.units.slice().sort((a, b) => Number(a.id === selectedUnitId) - Number(b.id === selectedUnitId));
    return `<svg class="board" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}" tabindex="0" role="application" aria-label="War map. Drag to pan, mouse wheel to zoom. Arrow keys pan; plus and minus zoom. Select armies in the Council panel to use keyboard controls." preserveAspectRatio="xMidYMid meet"><defs>${definitions}</defs>${cells}${roads}${line}${sortedUnits.map(drawCounter).join('')}</svg>`;
}
function selectedDescription() {
    const h = getHex(selectedHex);
    const u = getUnit();
    if (state.pendingCombat)
        return { title: state.pendingCombat.stage === 'ambush' ? 'Ambush decision' : state.pendingCombat.stage === 'advance' ? 'Advance after battle' : 'Settlement captured', text: `${kingdomName(actor())} must choose how to proceed.` };
    if (isBot())
        return { title: `${kingdomName(actor())} is taking its turn`, text: botPaused ? 'Computer play paused. Resume when ready.' : 'Watch movement and battles, or pause the computer.' };
    if (state.phase === 'income-actions')
        return { title: 'Income phase', text: 'Resolve kingdom preparations, then collect income to begin activations.' };
    const a = selectedTargetAction();
    if (a?.type === 'attack')
        return { title: `Attack ${h?.settlement?.name || h?.id}`, text: `${u ? definition(u).name : 'Army'} attacks. Review the dice forecast in Council.` };
    if (a?.type === 'move' || a?.type === 'ship') {
        const option = (a.type === 'ship' ? shipOptions(state, u.id) : moveOptions(state, u.id)).find(o => o.hexId === a.toHex);
        return { title: `${a.type === 'ship' ? 'Ship to' : 'Move to'} ${h?.settlement?.name || h?.id}`, text: `${option?.cost ?? ''} movement${a.type === 'ship' ? ' · Transport' : ''}${option?.roadOnly ? ' · Road route' : ''}` };
    }
    if (u)
        return { title: definition(u).name, text: u.activated ? 'This army has finished its activation.' : u.id === state.activeUnitId ? `${state.remainingMP} movement remaining · Choose a destination or finish activation.` : u.kingdom === state.currentKingdom ? 'Select a highlighted hex to move, or an enemy to attack.' : `${kingdomName(u.kingdom)} army · Select one of your ready armies.` };
    return { title: `${seasons[state.season]} ${state.year} · ${kingdomName(state.currentKingdom)}`, text: 'Select a ready army. Green hexes mark movement; red hexes mark attacks.' };
}
function pendingPanel() {
    const pending = state.pendingCombat;
    if (!pending)
        return '';
    const target = getHex(pending.targetHex);
    let choices;
    if (pending.stage === 'ambush')
        choices = currentActions.filter(a => a.type === 'resolve-combat').map(a => `<button class="${a.type === 'resolve-combat' && a.ambush ? 'primary-button' : 'secondary-button'} full" ${actionAttr(a)}>${a.type === 'resolve-combat' && a.ambush ? `Use ${a.ambush} ambush` : 'Fight normally'}</button>`).join('');
    else if (pending.stage === 'advance')
        choices = currentActions.filter(a => a.type === 'advance').map(a => `<button class="${a.type === 'advance' && a.accept ? 'primary-button' : 'secondary-button'} full" ${actionAttr(a)}>${a.type === 'advance' && a.accept ? 'Advance into hex' : 'Remain in place'}</button>`).join('');
    else
        choices = currentActions.filter(a => a.type === 'settlement').map(a => `<button class="${a.type === 'settlement' && a.choice === 'control' ? 'primary-button' : 'secondary-button'} full" ${actionAttr(a)}>${a.type === 'settlement' && a.choice === 'control' ? 'Take control' : 'Raze settlement'}</button>`).join('');
    return `<div class="target-card combat"><div class="eyebrow">${esc(kingdomName(pending.decisionKingdom))} decision</div><h3 style="margin-top:9px">${esc(target?.settlement?.name || pending.targetHex)}</h3><p class="small-note">${pending.stage === 'ambush' ? 'An army can use Ambush before normal combat. Choose your resolution.' : pending.stage === 'advance' ? 'The victorious attacker may enter the defender’s hex.' : 'Choose what happens to this hostile settlement.'}</p><div class="action-list" style="margin-top:13px">${choices}</div></div>`;
}
function forecastPanel(f) {
    return `<div class="target-card combat"><div class="eyebrow">Battle forecast</div><h3 style="margin-top:8px">${esc(getHex(f.targetHex)?.settlement?.name || f.targetHex)}</h3><div class="forecast-row"><div><strong>${f.attackerLight}<small style="font-size:10px">d6</small> + ${f.attackerHeavy}<small style="font-size:10px">d8</small></strong>Attacker</div><span class="vs">vs</span><div><strong>${f.defenderLight}<small style="font-size:10px">d6</small> + ${f.defenderHeavy}<small style="font-size:10px">d8</small></strong>Defender</div></div><div class="forecast-row"><div>${f.attackerExpected.toFixed(1)} expected hits</div><span></span><div>${f.defenderExpected.toFixed(1)} expected hits</div></div><p class="forecast-copy">${f.explanation.map(esc).join('<br>')}</p>${f.attackerCanAmbush || f.defenderCanAmbush ? '<p class="forecast-copy">Ambush may change this resolution. An estimate is not a guaranteed result.</p>' : ''}</div>`;
}
function councilPanel() {
    const u = getUnit();
    const h = getHex(selectedHex);
    const current = kingdom(state.currentKingdom);
    if (u) {
        const d = definition(u), s = stats(u);
        const a = selectedTargetAction();
        const f = a?.type === 'attack' ? combatForecast(state, u.id, a.targetHex) : null;
        const specials = currentActions.filter(a => ('unitId' in a && a.unitId === u.id && ['recover', 'regenerate', 'mine', 'pass', 'disband-siege'].includes(a.type)));
        return `<div class="unit-hero"><img src="${esc(art(d))}" alt="Illustration of ${esc(d.name)}"><div class="unit-title"><h3>${esc(d.name)}</h3><p>${esc(kingdomName(u.kingdom).toUpperCase())} · ${esc(u.weakened ? 'WEAKENED' : 'FULL STRENGTH')} · ${esc(getHex(u.hexId)?.settlement?.name || u.hexId)}</p></div></div>${pendingPanel()}<div class="unit-stats"><div class="stat-box"><b>${s.light}</b><small>Light · d6</small></div><div class="stat-box"><b>${s.heavy}</b><small>Heavy · d8</small></div><div class="stat-box"><b>${u.id === state.activeUnitId ? state.remainingMP : s.move}</b><small>Movement</small></div></div><div class="trait-list">${[...d.abilities, ...d.characteristics].map(t => `<span>${esc(t)}</span>`).join('')}${u.activated ? '<span>Activated</span>' : '<span>Ready</span>'}</div>${f ? forecastPanel(f) : a && (a.type === 'move' || a.type === 'ship') ? `<div class="target-card"><div class="eyebrow">Destination</div><h3 style="margin-top:8px">${esc(h?.settlement?.name || h?.id)}</h3><p class="small-note">${esc(h?.terrain)}${h?.settlement ? ` · ${h.settlement.fortified ? 'Fortified settlement' : 'Settlement'}` : ''}${state.controls[h?.id || ''] ? ` · ${esc(kingdomName(state.controls[h.id]))} control` : ''}</p></div>` : `<p class="small-note">${u.activated ? 'This army is exhausted until its next kingdom turn.' : u.kingdom === state.currentKingdom ? 'Select a green hex to move or a red hex to attack. A battle finishes this army’s activation.' : 'This army belongs to another kingdom.'}</p>`}<div class="panel-rule"></div><div class="side-title"><h3>Army actions</h3></div><div class="action-list">${specials.map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))}${a.type === 'recover' ? `<small>${d.recoveryCost} gold</small>` : ''}</button>`).join('')}${currentActions.some(a => a.type === 'activate' && a.unitId === u.id) ? `<button ${actionAttr({ type: 'activate', unitId: u.id })}>Activate this army ${icon('arrow')}</button>` : ''}${shipOptions(state, u.id).length ? `<button data-command="ship-mode">${shipMode ? 'Return to land movement' : 'Show sea transport'} ${icon('ship')}</button>` : ''}${!specials.length && u.activated ? '<p class="small-note">No actions remain for this army.</p>' : ''}</div>${destinationPicker(u)}${hexActionsPanel(h)}${lastBattlePanel()}`;
    }
    const ready = state.units.filter(u => u.kingdom === current.id && !u.activated);
    const roster = state.units.filter(u => u.kingdom === current.id);
    return `${pendingPanel()}<div class="objective"><div class="eyebrow">The campaign</div><p>${esc(objectiveText())}</p></div><div class="kingdom-strip">${state.kingdoms.map(k => `<div class="kingdom-card"><small><span class="faction-dot" style="background:${color(k.id)}"></span>${esc(k.name)}</small><b><span class="gold-icon">•</span>${k.gold} <em>gold</em></b></div>`).join('')}</div>${state.phase === 'income-actions' ? `<div class="guide"><strong>Prepare your kingdom</strong>Use any available income-phase actions below, then collect income to activate armies.</div><div class="action-list">${currentActions.filter(a => ['collect-income', 'suppress'].includes(a.type)).map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))} ${icon(a.type === 'collect-income' ? 'coin' : 'army')}</button>`).join('')}</div>` : '<div class="guide"><strong>Command one army at a time</strong>Select an army, choose its destination, then commit the move or battle. Finish its activation before selecting the next army.</div>'}${kingdomActionsPanel()}<div class="side-title"><h3>Your armies</h3><span>${ready.length} ready / ${roster.length}</span></div><div class="army-list">${roster.map(u => armyRow(u)).join('') || '<p class="empty-state">No armies remain in the field. Check Muster for available recruitment.</p>'}</div>${h ? `<div class="panel-rule"></div><div class="side-title"><h3>${esc(h.settlement?.name || h.id)}</h3><span>${esc(h.terrain)}</span></div><p class="small-note">${h.settlement ? `${h.settlement.city ? 'City' : 'Settlement'} · ${h.settlement.port ? 'Port · ' : ''}${h.settlement.fortified ? `Fortification ${h.settlement.fortified}` : 'Unfortified'}` : h.mine ? 'A source of gold when worked by a capable army.' : 'Unsettled terrain.'}</p>${hexActionsPanel(h)}` : ''}${lastBattlePanel()}`;
}
function kingdomActionsPanel() {
    const actions = currentActions.filter(a => a.type === 'transfer-gold');
    return actions.length ? `<div class="side-title" style="margin-top:19px"><h3>Allied support</h3></div><div class="action-list" style="margin-bottom:21px">${actions.map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))}<small>Pay 2 · Ally gains 1</small></button>`).join('')}</div>` : '';
}
function destinationPicker(u) {
    const actions = currentActions.filter(a => 'unitId' in a && a.unitId === u.id && (a.type === 'attack' || a.type === (shipMode ? 'ship' : 'move')));
    if (!actions.length)
        return '';
    return `<div class="panel-rule"></div><label class="scenario-select-label" for="destination-choice">Choose a destination</label><select class="scenario-select" id="destination-choice"><option value="">Select on map or choose here</option>${actions.map(a => { const id = a.type === 'attack' ? a.targetHex : a.type === 'move' || a.type === 'ship' ? a.toHex : ''; const h = getHex(id); return `<option value="${esc(id)}" ${selectedHex === id ? 'selected' : ''}>${a.type === 'attack' ? 'Attack' : a.type === 'ship' ? 'Ship' : 'Move'} · ${esc(h?.settlement?.name || id)} · ${esc(h?.terrain)}</option>`; }).join('')}</select>`;
}
function armyRow(u) { const d = definition(u), s = stats(u); return `<button class="army-item ${selectedUnitId === u.id ? 'selected' : ''}" data-select-unit="${esc(u.id)}"><img src="${esc(art(d))}" alt=""><span><span class="army-name">${esc(d.name)}</span><span class="army-sub">${s.light} Light · ${s.heavy} Heavy · ${esc(getHex(u.hexId)?.settlement?.name || u.hexId)}</span></span><span class="ready-dot ${u.activated ? 'used' : ''}" title="${u.activated ? 'Activated' : 'Ready'}"></span></button>`; }
function hexActionsPanel(h) {
    if (!h)
        return '';
    const actions = currentActions.filter(a => 'hexId' in a && a.hexId === h.id && a.type !== 'build');
    return actions.length ? `<div class="panel-rule"></div><div class="side-title"><h3>At this hex</h3></div><div class="action-list">${actions.map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))}</button>`).join('')}</div>` : '';
}
function diceRow(rolls) { return `<div class="combat-dice">${rolls.map(d => `<span class="die ${d.sides === 8 ? 'heavy' : ''} ${d.critical ? 'critical' : d.success ? 'success' : 'fail'}" title="d${d.sides} · raw ${d.raw} · modified ${d.modified} · ${d.success ? 'success' : 'miss'}${d.confirmation !== undefined ? ` · confirmation ${d.confirmation}` : ''}">${d.raw}</span>`).join('') || '<span class="small-note">No dice</span>'}</div>`; }
function lastBattlePanel() {
    const result = state.lastCombat;
    if (!result)
        return '';
    return `<div class="panel-rule"></div><div class="side-title"><h3>Last battle</h3><span>${esc(getHex(result.targetHex)?.settlement?.name || result.targetHex)}</span></div><p class="small-note">Attacker ${result.attackerSuccesses} successes · Defender ${result.defenderSuccesses} successes.<br>${result.attackerHits} hits to attacker · ${result.defenderHits} hits to defender.</p><div style="margin-top:12px"><div class="eyebrow">Attacker rolls</div>${diceRow(result.attackerRolls)}</div><div style="margin-top:12px"><div class="eyebrow">Defender rolls</div>${diceRow(result.defenderRolls)}</div><p class="small-note" style="margin-top:11px">${result.ambush ? `${esc(result.ambush)} ambush. ` : ''}${esc(result.result)} result. Green borders mark successes; gold marks criticals. Hover a die for modifiers.</p>`;
}
function musterPanel() {
    const k = kingdom(state.currentKingdom);
    const defs = state.unitDefinitions.filter(d => d.kingdom === k.id);
    const buildActions = currentActions.filter((a) => a.type === 'build');
    return `<div class="side-title"><h3>Recruitment</h3><span>${k.gold} gold available</span></div><p class="small-note" style="margin-bottom:16px">A new army must enter at a legal friendly settlement. Recruitment uses the kingdom’s army supply.</p><div class="recruit-list">${defs.map(d => {
        const builds = buildActions.filter(a => a.defId === d.id);
        const count = state.units.filter(u => u.defId === d.id).length;
        return `<div class="recruit-card"><div class="recruit-top"><img src="${esc(art(d))}" alt=""><div><h3>${esc(d.name)}</h3><p>${d.light} Light · ${d.heavy} Heavy · Move ${d.movement}</p></div><span class="cost"><span class="gold-icon">•</span>${d.cost}</span></div><p class="supply-count">${Math.max(0, d.count - count)} / ${d.count} in supply</p><button data-recruit="${esc(d.id)}" ${builds.length ? '' : 'disabled'}>${builds.length ? recruitDefinition === d.id ? 'Choose an entry settlement' : `Recruit · ${builds.length} ${builds.length === 1 ? 'entry' : 'entries'}` : count >= d.count ? 'Supply exhausted' : k.gold < d.cost ? 'Insufficient gold' : 'No legal entry'}</button>${recruitDefinition === d.id ? `<div class="recruit-locations">${builds.map(a => `<button ${actionAttr(a)}>At ${esc(getHex(a.hexId)?.settlement?.name || a.hexId)} ${icon('arrow')}</button>`).join('')}</div>` : ''}</div>`;
    }).join('') || '<p class="empty-state">No army definitions are available for this kingdom.</p>'}</div>`;
}
function chroniclePanel() {
    return `<div class="side-title"><h3>Chronicle of war</h3><span>${state.log.length} entries</span></div><p class="small-note" style="margin-bottom:12px">Each movement, gold change and combat result is recorded. Newest entries appear first.</p><div class="chronicle">${state.log.slice().reverse().slice(0, 160).map((line, i) => `<div class="log-entry"><span class="log-number">${String(state.log.length - i).padStart(3, '0')}</span>${esc(line)}</div>`).join('')}</div>`;
}
function actionBar() {
    const description = selectedDescription();
    const target = selectedTargetAction();
    let actions = '';
    if (isBot())
        actions = button('bot-toggle', botPaused ? 'Resume computer' : 'Pause computer', botPaused ? 'arrow' : 'pause', 'secondary-button');
    else if (state.pendingCombat)
        actions = button('decisions', 'Choose resolution', 'swords', 'primary-button');
    else if (target)
        actions = `<button class="primary-button" ${actionAttr(target)} ${stateReady() ? '' : 'disabled'}>${icon(target.type === 'attack' ? 'swords' : target.type === 'ship' ? 'ship' : 'move')}<span>${target.type === 'attack' ? 'Attack' : target.type === 'ship' ? 'Ship army' : 'Move army'}</span></button>`;
    else if (state.phase === 'income-actions') {
        const a = currentActions.find(a => a.type === 'collect-income');
        if (a)
            actions = `<button class="primary-button" ${actionAttr(a)} ${stateReady() ? '' : 'disabled'}>${icon('coin')}<span>Collect income</span></button>`;
    }
    else if (state.phase === 'game-over')
        actions = button('victory', 'Campaign result', 'banner', 'primary-button');
    else {
        const pass = currentActions.find(a => a.type === 'pass' && a.unitId === state.activeUnitId);
        if (pass)
            actions += `<button class="secondary-button desktop-pass" ${actionAttr(pass)} ${stateReady() ? '' : 'disabled'}>Finish activation</button>`;
        const end = currentActions.find(a => a.type === 'end-turn');
        actions += `<button class="${pass ? 'secondary-button' : 'primary-button'}" ${actionAttr({ type: 'end-turn' })} ${end && stateReady() ? '' : 'disabled'}>${icon('arrow')}<span>End turn</span></button>`;
    }
    return `<div class="actionbar"><div class="action-context"><div class="phase-icon">${icon(target?.type === 'attack' ? 'swords' : 'banner')}</div><div><h3>${esc(description.title)}</h3><p>${esc(description.text)}</p></div></div><div class="action-buttons">${actions}${button('mobile-panel', 'Open Council', 'army', 'mobile-panel-toggle')}</div></div>`;
}
function setupModal() {
    const sc = config.scenario;
    const tag = sc.official ? 'VERIFIED BASIC SCENARIO' : packLabel ? 'IMPORTED CONTENT PACK' : 'BASIC GAME · TEACHING FIXTURE';
    return `<div class="modal-shade"><section class="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div class="setup-art"><div class="setup-art-copy"><div class="eyebrow">The war table</div><h2>Burning<br>Banners</h2><p>Rage of the Witch Queen<br>Armies march. Kingdoms rise. The Wildlands await.</p></div></div><div class="setup-panel"><div class="eyebrow">Set your banners</div><h2 id="setup-title">A kingdom to command</h2><p>A browser-local war table for pass-and-play humans and computer opponents.</p><label class="scenario-select-label" for="scenario-choice">Choose a campaign</label><select id="scenario-choice" class="scenario-select">${scenarioOptions.map(o => `<option value="${esc(o.id)}" ${selectedScenario === o.id && !packLabel ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}${packLabel ? `<option value="imported" selected>${esc(config.scenario.name)} · imported</option>` : ''}</select><div class="setup-scenario"><div class="eyebrow">${tag}</div><h3>${esc(sc.name)}</h3><p>${esc(sc.notes?.[0] || 'A short campaign to learn movement, recruitment, terrain and battle.')}</p><div class="setup-tags"><span>${sc.kingdoms.length} kingdoms</span><span>${sc.endYear === sc.startYear ? `${sc.endSeason - sc.startSeason + 1} seasons` : `${sc.startYear}–${sc.endYear}`}</span><span>Basic rules</span></div></div>${sc.kingdoms.map(k => `<div class="player-setting"><div class="player-label"><span class="faction-dot" style="background:${color(k.id)}"></span>${esc(k.name)} <span class="alliance-label">${k.side === 'invader' ? 'Invaders' : 'Resistance'}</span></div><div class="controller-switch" role="group" aria-label="${esc(k.name)} controller"><button data-controller="${esc(k.id)}:human" class="${controllers[k.id] !== 'ai' ? 'active' : ''}" aria-pressed="${controllers[k.id] !== 'ai'}">Human</button><button data-controller="${esc(k.id)}:ai" class="${controllers[k.id] === 'ai' ? 'active' : ''}" aria-pressed="${controllers[k.id] === 'ai'}">Computer</button></div></div>`).join('')}<details class="advanced-setting"><summary>Advanced setup</summary><label>Deterministic seed <input id="game-seed" type="number" min="1" max="4294967295" value="${esc(seed)}"></label><p class="small-note" style="margin-top:9px">Same setup and actions produce the same rolls. No reroll or undo of random outcomes.</p></details><div class="setup-buttons"><button class="primary-button" data-command="start">Begin campaign ${icon('arrow')}</button>${saved ? `<button class="secondary-button gold-button" data-command="continue">Continue saved campaign · ${esc(seasons[saved.season])} ${saved.year}</button>` : ''}<div style="display:flex;gap:8px"><button class="secondary-button" data-command="import">Load saved game</button><button class="secondary-button" data-command="import-pack">Import content pack</button></div></div><div class="setup-footnote">${sc.official ? 'Basic Game rules implementation. ' : 'The built-in openings are original teaching and sandbox setups, not complete official campaign transcriptions. '}Original generated artwork. Advanced cards and network rooms are not included. <button data-command="credits" style="font-size:8px;border:0;padding:0;text-decoration:underline;color:#b7a679">Read the coverage notes</button>.</div></div></section></div>`;
}
function rulesModal() {
    return standardModal('The Basic Game', `<div class="status-banner">This table enforces the implemented Basic Game rules. Legal highlights and action buttons always use the same engine that resolves your turn. Consult the official rulebook for the full published game.</div><h3>Command your kingdom</h3><p>Each kingdom takes its turn in scenario order. Prepare the kingdom during the income phase, collect income, then recruit and activate armies. A kingdom may end its turn when the engine allows it.</p><h3>Activate an army</h3><p>Select a ready counter, then choose a highlighted destination. Movement spends the army’s movement allowance; terrain, roads, characteristics and enemy presence determine its legal path. The table displays the complete route before you commit. An army that completes its activation is dimmed.</p><h3>Fight a battle</h3><p>Select an enemy or hostile settlement in legal attack range, review the forecast, and press Attack. Light combat uses six-sided dice; Heavy combat uses eight-sided dice. Terrain, fortification and army abilities affect the resolution. The displayed expected hits are estimates, not guaranteed outcomes.</p><p>The battle record shows every roll, critical confirmation and hit. Battles can weaken or eliminate armies. Ambush, advance and settlement choices appear when the rules require a decision. An attack finishes the activation after these choices.</p><h3>Recruit and recover</h3><p>Muster lists your kingdom’s army types, gold cost and remaining supply. Recruit only at the legal entry settlements shown. A weakened army can recover when its location and available gold permit it. Miners and other characteristics unlock specific contextual actions.</p><h3>Pass and play</h3><p>Set any kingdom to Human or Computer before starting. A handoff curtain appears between different human decision makers. Computer play uses legal actions and can be paused. This is a local shared table.</p><h3>Map controls</h3><p>Drag the board to pan. Scroll or use <span class="rule-key">+</span> / <span class="rule-key">−</span> to zoom. Arrow keys pan while the map is focused; <span class="rule-key">0</span> fits the board. Use Council’s army list to select counters with a keyboard. <span class="rule-key">Esc</span> closes a panel or clears a selection.</p><h3>Your campaign</h3><p>${esc(objectiveText())}</p><p class="muted">${esc(state.scenario.notes?.join(' ') || '')}</p><p><a href="${rulesURL}" target="_blank" rel="noopener">Official publisher page and rulebook downloads ↗</a></p>`);
}
function creditsModal() {
    return standardModal('Sources & implementation coverage', `<p><strong>Burning Banners: Rage of the Witch Queen</strong> is designed and illustrated by Christopher Moeller and published by Compass Games. This is an unofficial browser implementation.</p><table class="coverage-table"><thead><tr><th>Content</th><th>Available in this table</th></tr></thead><tbody><tr><td>Core turn sequence</td><td>Implemented Basic Game</td></tr><tr><td>Movement, combat, recruitment</td><td>Rules-enforced local engine</td></tr><tr><td>Map and army statistics</td><td>Source-calibrated content where verified</td></tr><tr><td>Built-in scenario</td><td>${esc(state.scenario.official ? 'Verified official Basic scenario' : 'Original fixture; opening/objectives created')}</td></tr><tr><td>Advanced heroes, spells, treasures</td><td>Not implemented</td></tr><tr><td>Online multiplayer</td><td>Not included; local human/computer play</td></tr><tr><td>Illustrations</td><td>Original generated terrain and army art</td></tr></tbody></table><h3>Rules sources</h3><p>Compass Games’ official Undying Rules v1.1 (September 2024) and published game components inform the rules and data. Scenario source: ${esc(state.scenario.source)}.</p><p>The generated art evokes the printed game’s ink and watercolor character. It is not Christopher Moeller’s original board or counter artwork. Hexes use explicit coordinates; image pixels are not used to infer game rules.</p><h3>Bring your own verified content</h3><p>Use the <a href="./content-editor.html" target="_blank">content calibration editor ↗</a> to inspect or prepare a reference pack, then import it from setup. Imported content changes game data and does not add Advanced Game rules.</p><h3>Local saves</h3><p>Each action saves to this browser. Export a JSON copy to keep a portable backup; imported saves are validated before loading. Seeded random outcomes are part of the save.</p><p><a href="${rulesURL}" target="_blank" rel="noopener">Compass Games · official game and reference downloads ↗</a></p>`);
}
function galleryModal() {
    const groups = Array.from(new Set(state.unitDefinitions.map(d => d.kingdom)));
    return standardModal('Armies of the Wildlands', `<p style="margin-bottom:19px">Printed combat values are shown at full strength. The portrait art is original to this adaptation.</p>${groups.map(id => `<h3>${esc(kingdomName(id))}</h3><div class="gallery-grid">${state.unitDefinitions.filter(d => d.kingdom === id).map(d => `<article class="gallery-card"><img src="${esc(art(d))}" alt="${esc(d.name)} illustration"><div><h3>${esc(d.name)}</h3><p>${d.light} Light · ${d.heavy} Heavy · Move ${d.movement}<br>Cost ${d.cost} · Recovery ${d.recoveryCost}<br>${esc([...d.abilities, ...d.characteristics].join(', ') || 'No special characteristics')}</p></div></article>`).join('')}</div>`).join('')}`);
}
function victoryModal() {
    return standardModal('The campaign ends', `<div class="eyebrow">${esc(seasons[state.season])} ${state.year}</div><h3 class="game-over-title" style="margin-top:17px">${state.winner ? `${state.winner === 'invader' ? 'Invaders' : 'Resistance'} prevail` : 'Campaign complete'}</h3><p>${esc(state.victoryReason || 'The campaign has reached its conclusion.')}</p><p style="margin-top:17px">Your final position remains on the table. Export a copy or start another campaign.</p><div style="display:flex;gap:9px;margin-top:23px"><button class="primary-button" data-command="setup">New campaign</button><button class="secondary-button" data-command="export">Export final position</button></div>`);
}
function standardModal(title, body) { return `<div class="modal-shade"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-header"><h2 id="dialog-title">${esc(title)}</h2>${button('close-modal', 'Close dialog', 'close')}</div><div class="modal-body">${body}</div><div class="modal-footer"><button class="secondary-button" data-command="close-modal">Return to the table</button></div></section></div>`; }
function curtainHTML() { return `<div class="curtain" role="dialog" aria-modal="true" aria-labelledby="handoff-title"><div class="curtain-inner"><div class="curtain-seal">${icon('banner')}</div><div class="eyebrow">Pass the table</div><h2 id="handoff-title">${esc(kingdomName(curtain))}</h2><p>It is your decision. Pass the device to the player commanding this kingdom, then reveal the table.</p><button class="primary-button" data-command="reveal">I’m ready · Reveal the map</button></div></div>`; }
function render() {
    const previousFocus = document.activeElement;
    const focusID = previousFocus?.id;
    const focusData = previousFocus && ['command', 'controller', 'selectUnit', 'recruit'].map(key => [key, previousFocus.dataset[key]]).find(([, value]) => !!value);
    const mapFocused = previousFocus?.classList.contains('board');
    currentActions = legalActions(state);
    const k = kingdom(state.currentKingdom);
    root.innerHTML = `<main class="war-app"><header class="topbar"><div class="brand"><div class="brand-seal">${icon('banner')}</div><div><h1>Burning Banners</h1><small>RAGE OF THE WITCH QUEEN</small></div></div><div class="header-scenario"><strong>${esc(state.scenario.name)}</strong><span class="separator"></span><span>Basic Game</span></div><div class="header-actions"><span class="save-status ${saveError ? 'error' : ''}" role="status">${esc(saveStatus)}</span>${button('rules', 'Rules', 'book')}${button('export', 'Save', 'download')}${button('setup', 'Campaign', 'settings')}</div></header><section class="workspace"><nav class="toolrail" aria-label="Table tools">${button('council', 'Council', 'map', `rail-button ${sideTab === 'council' ? 'active' : ''}`)}${button('muster', 'Muster', 'army', `rail-button ${sideTab === 'muster' ? 'active' : ''}`)}${button('chronicle', 'Chronicle', 'history', `rail-button ${sideTab === 'chronicle' ? 'active' : ''}`)}<div class="rail-spacer"></div>${button('gallery', 'Armies', 'banner', 'rail-button rail-secondary')}${button('rules', 'Rules', 'book', 'rail-button rail-secondary')}${button('sound', sound ? 'Sound on' : 'Sound off', sound ? 'sound' : 'mute', `rail-button rail-secondary ${sound ? 'active' : ''}`)}${button('credits', 'Sources', 'info', 'rail-button rail-secondary')}</nav><div class="board-wrap"><div class="board-heading"><span>${esc(state.scenario.official ? 'THE WILDLANDS' : 'THE WILDLANDS · ORIGINAL SETUP')}</span><h2>${esc(state.scenario.name)}</h2></div><div class="board-legend"><span><i class="legend-dot"></i>Legal movement</span><span><i class="legend-dot enemy"></i>Legal attack</span></div>${renderMap()}<div class="board-compass"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2 29 20 46 24 29 29 24 46 19 29 2 24 19 20Z"/><circle cx="24" cy="24" r="8" fill="#d6cda8"/><path d="M24 6 27 22 24 24 21 22Z"/></svg>NORTH</div><div class="map-controls">${button('zoom-out', 'Zoom out', 'minus')}<span class="zoom-level">100%</span>${button('zoom-in', 'Zoom in', 'plus')}${button('fit', 'Fit board', 'fit')}</div></div><aside class="sidebar ${mobileOpen ? 'mobile-open' : ''}" aria-label="Kingdom and army details"><div class="turn-card"><div class="eyebrow"><span>${esc(seasons[state.season])} ${state.year}</span><span>${isBot() ? '<span class="bot-indicator">COMPUTER</span>' : 'YOUR COMMAND'}</span></div><h2><span class="faction-dot" style="background:${color(k.id)}"></span>${esc(k.name)}</h2><div class="turn-meta"><span><span class="gold-icon">•</span><strong>${k.gold}</strong> gold</span><span>Income +${k.income}</span><span class="phase">${state.pendingCombat ? 'Battle decision' : state.phase === 'income-actions' ? 'Income phase' : state.phase === 'game-over' ? 'Campaign ends' : 'Activations'}</span></div></div>${button('mobile-panel', 'Close Council', 'close', 'close-panel')}<div class="side-tabs" role="tablist" aria-label="Kingdom panels">${button('council', 'Council', 'map', sideTab === 'council' ? 'active' : '')}${button('muster', 'Muster', 'army', sideTab === 'muster' ? 'active' : '')}${button('chronicle', 'Chronicle', 'history', sideTab === 'chronicle' ? 'active' : '')}</div><div class="side-scroll">${sideTab === 'council' ? councilPanel() : sideTab === 'muster' ? musterPanel() : chroniclePanel()}</div></aside></section>${actionBar()}</main>${modal === 'setup' ? setupModal() : modal === 'rules' ? rulesModal() : modal === 'credits' ? creditsModal() : modal === 'gallery' ? galleryModal() : modal === 'victory' ? victoryModal() : ''}${curtain ? curtainHTML() : ''}`;
    wireBoard();
    if (!stateReady())
        root.querySelectorAll('button[data-action]').forEach(b => { b.disabled = true; });
    if (!camera)
        requestAnimationFrame(() => fitBoard(true));
    else
        updateCamera();
    requestAnimationFrame(() => {
        let destination = null;
        if (focusID)
            destination = document.getElementById(focusID);
        if (!destination && focusData)
            destination = Array.from(root.querySelectorAll('button')).find(b => b.dataset[focusData[0]] === focusData[1]) || null;
        if (!destination && mapFocused)
            destination = root.querySelector('.board');
        if (!destination && (modal || curtain))
            destination = root.querySelector('.curtain button, .modal select, .modal button');
        destination?.focus({ preventScroll: true });
    });
}
function selectUnit(id, focus = false) {
    const unit = state.units.find(u => u.id === id);
    if (!unit)
        return;
    selectedUnitId = id;
    selectedHex = null;
    shipMode = false;
    sideTab = 'council';
    render();
    if (focus)
        focusUnit(unit);
}
function selectHex(id) {
    const occupier = state.units.find(u => u.hexId === id);
    const unit = getUnit();
    const attack = unit && currentActions.some(a => a.type === 'attack' && a.unitId === unit.id && a.targetHex === id);
    if (occupier && !attack) {
        selectUnit(occupier.id);
        return;
    }
    selectedHex = id;
    if (attack)
        sideTab = 'council';
    render();
}
function wireBoard() {
    const svg = root.querySelector('.board');
    let dragging = false;
    let moved = false;
    let downX = 0, downY = 0;
    let lastX = 0, lastY = 0;
    let downTarget = null;
    const position = (x, y) => { const rect = svg.getBoundingClientRect(); return { x: camera.x + (x - rect.left) / rect.width * camera.w, y: camera.y + (y - rect.top) / rect.height * camera.h }; };
    svg.addEventListener('wheel', event => { event.preventDefault(); if (!camera)
        return; zoom(event.deltaY > 0 ? 1.12 : .89, position(event.clientX, event.clientY)); }, { passive: false });
    svg.addEventListener('pointerdown', event => { if (event.button !== 0 || !camera)
        return; dragging = true; moved = false; downX = lastX = event.clientX; downY = lastY = event.clientY; downTarget = event.target; svg.setPointerCapture(event.pointerId); });
    svg.addEventListener('pointermove', event => { if (!dragging || !camera)
        return; if (Math.hypot(event.clientX - downX, event.clientY - downY) > 5)
        moved = true; if (moved) {
        svg.classList.add('dragging');
        const rect = svg.getBoundingClientRect();
        camera.x -= (event.clientX - lastX) / rect.width * camera.w;
        camera.y -= (event.clientY - lastY) / rect.height * camera.h;
        updateCamera();
    } lastX = event.clientX; lastY = event.clientY; });
    const release = (event) => { if (!dragging)
        return; dragging = false; svg.classList.remove('dragging'); if (svg.hasPointerCapture(event.pointerId))
        svg.releasePointerCapture(event.pointerId); if (!moved && downTarget) {
        const counter = downTarget.closest('[data-unit]');
        const cell = downTarget.closest('[data-hex]');
        if (counter) {
            const u = state.units.find(u => u.id === counter.dataset.unit);
            const selected = getUnit();
            if (u && selected && u.kingdom !== selected.kingdom && currentActions.some(a => a.type === 'attack' && a.unitId === selected.id && a.targetHex === u.hexId))
                selectHex(u.hexId);
            else
                selectUnit(counter.dataset.unit);
        }
        else if (cell)
            selectHex(cell.dataset.hex);
    } };
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', () => { dragging = false; svg.classList.remove('dragging'); });
    svg.addEventListener('keydown', event => { if (!camera)
        return; const counter = event.target.closest('[data-unit]'); if (counter && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        selectUnit(counter.dataset.unit);
        return;
    } const amount = camera.w * .075; if (event.key === '+')
        zoom(.8);
    else if (event.key === '-')
        zoom(1.25);
    else if (event.key === '0')
        fitBoard();
    else if (event.key === 'ArrowLeft')
        camera.x -= amount;
    else if (event.key === 'ArrowRight')
        camera.x += amount;
    else if (event.key === 'ArrowUp')
        camera.y -= amount;
    else if (event.key === 'ArrowDown')
        camera.y += amount;
    else
        return; event.preventDefault(); updateCamera(); });
}
function startGame() {
    const input = root.querySelector('#game-seed');
    if (input)
        seed = input.value;
    const parsedSeed = Number(seed);
    if (!Number.isInteger(parsedSeed) || parsedSeed < 1 || parsedSeed > 4294967295) {
        notify('Use a whole-number seed between 1 and 4294967295.');
        return;
    }
    try {
        state = createGame({ ...config, controllers, seed: parsedSeed });
        gameHasBegun = true;
        selectedUnitId = null;
        selectedHex = null;
        modal = null;
        camera = null;
        botPaused = false;
        botSteps = 0;
        botTurn = -1;
        curtain = null;
        sideTab = 'council';
        mobileOpen = false;
        render();
        void persist();
        scheduleBot();
    }
    catch (error) {
        notify(error instanceof Error ? error.message : 'Unable to create that campaign.');
    }
}
function exportSave() {
    const text = exportGame(state);
    const blob = new Blob([text], { type: 'application/json' });
    if (blob.size > 20_000_000) {
        notify('Save exceeds 20 MB. Reduce embedded artwork in the content pack before creating a new campaign.');
        return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `burning-banners-${state.year}-${seasons[state.season].toLowerCase()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify('Campaign exported with its current position, random state, and chronicle.');
}
function importFile(pack = false) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file)
            return;
        if (file.size > 20_000_000) {
            notify('Choose a JSON file smaller than 20 MB.');
            return;
        }
        try {
            const text = await file.text();
            if (!pack) {
                const imported = importGame(text);
                const errors = validateState(imported);
                if (errors.length)
                    throw new Error(errors[0]);
                state = imported;
                saved = imported;
                gameHasBegun = true;
                modal = null;
                camera = null;
                selectedUnitId = null;
                selectedHex = null;
                botPaused = false;
                curtain = null;
                render();
                void persist();
                scheduleBot();
                notify('Campaign loaded.');
            }
            else {
                const validation = await import('./content-validation.js');
                const raw = JSON.parse(text);
                const candidate = validation.validateContentPack(raw);
                config = { hexes: candidate.hexes, unitDefinitions: candidate.unitDefinitions, scenario: { ...candidate.scenario, official: false }, controllers: {} };
                createGame(config);
                packLabel = file.name;
                controllers = Object.fromEntries(config.scenario.kingdoms.map((k, i) => [k.id, i ? 'ai' : 'human']));
                modal = 'setup';
                render();
                notify('Content pack validated. Choose controllers and begin when ready.');
            }
        }
        catch (error) {
            notify(`Import failed: ${error instanceof Error ? error.message : 'The file is not a valid game JSON.'}`);
        }
    });
    input.click();
}
root.addEventListener('click', event => {
    const element = event.target.closest('button');
    if (!element || element.hasAttribute('disabled'))
        return;
    if (element.dataset.action) {
        try {
            perform(JSON.parse(element.dataset.action));
        }
        catch {
            notify('Invalid action.');
        }
        return;
    }
    if (element.dataset.selectUnit) {
        selectUnit(element.dataset.selectUnit, true);
        return;
    }
    if (element.dataset.recruit) {
        recruitDefinition = recruitDefinition === element.dataset.recruit ? null : element.dataset.recruit;
        render();
        return;
    }
    if (element.dataset.controller) {
        const [id, control] = element.dataset.controller.split(':');
        const input = root.querySelector('#game-seed');
        if (input)
            seed = input.value;
        controllers[id] = control;
        render();
        return;
    }
    const command = element.dataset.command;
    if (command === 'zoom-in') {
        zoom(.8);
        return;
    }
    if (command === 'zoom-out') {
        zoom(1.25);
        return;
    }
    if (command === 'fit') {
        fitBoard();
        return;
    }
    if (command === 'start') {
        startGame();
        return;
    }
    if (command === 'export') {
        exportSave();
        return;
    }
    if (command === 'import' || command === 'import-pack') {
        importFile(command === 'import-pack');
        return;
    }
    if (command === 'continue' && saved) {
        state = saved;
        modal = null;
        camera = null;
        botPaused = false;
    }
    else if (command === 'setup') {
        modal = 'setup';
        controllers = Object.fromEntries(config.scenario.kingdoms.map(k => [k.id, controllers[k.id] || 'human']));
    }
    else if (command === 'rules' || command === 'credits' || command === 'gallery' || command === 'victory') {
        modalParent = modal === 'setup' ? 'setup' : null;
        modal = command;
    }
    else if (command === 'close-modal') {
        modal = modalParent;
        modalParent = null;
    }
    else if (command === 'reveal')
        curtain = null;
    else if (command === 'council' || command === 'muster' || command === 'chronicle') {
        sideTab = command;
        mobileOpen = true;
    }
    else if (command === 'mobile-panel')
        mobileOpen = !mobileOpen;
    else if (command === 'decisions') {
        sideTab = 'council';
        mobileOpen = true;
    }
    else if (command === 'sound') {
        sound = !sound;
        if (sound)
            playSound('sound');
    }
    else if (command === 'ship-mode') {
        shipMode = !shipMode;
        selectedHex = null;
    }
    else if (command === 'bot-toggle') {
        botPaused = !botPaused;
        if (!botPaused)
            botSteps = 0;
    }
    render();
    scheduleBot();
});
root.addEventListener('change', event => {
    const element = event.target;
    if (element.id === 'destination-choice') {
        selectedHex = element.value || null;
        render();
        return;
    }
    if (element.id !== 'scenario-choice' || element.value === 'imported')
        return;
    const option = scenarioOptions.find(o => o.id === element.value);
    if (!option)
        return;
    const input = root.querySelector('#game-seed');
    if (input)
        seed = input.value;
    selectedScenario = option.id;
    config = structuredClone(option.config);
    packLabel = null;
    controllers = Object.fromEntries(config.scenario.kingdoms.map((k, i) => [k.id, i ? 'ai' : 'human']));
    render();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && (modal || curtain)) {
        const dialog = root.querySelector('.curtain') || root.querySelector('.modal');
        const elements = Array.from(dialog?.querySelectorAll('button:not([disabled]), a[href], input, select, summary') || []).filter(el => !el.closest('details:not([open])') || el.tagName === 'SUMMARY');
        const first = elements[0], last = elements[elements.length - 1];
        if (first && last && event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }
        else if (first && last && !event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
    if (event.key !== 'Escape')
        return;
    if (curtain)
        return;
    if (modal && modal !== 'setup') {
        modal = modalParent;
        modalParent = null;
    }
    else if (mobileOpen)
        mobileOpen = false;
    else {
        selectedUnitId = null;
        selectedHex = null;
    }
    render();
    scheduleBot();
});
window.addEventListener('resize', () => {
    const wrap = root.querySelector('.board-wrap');
    if (!camera || !wrap)
        return;
    const centerY = camera.y + camera.h / 2;
    camera.h = camera.w * wrap.clientHeight / Math.max(1, wrap.clientWidth);
    camera.y = centerY - camera.h / 2;
    updateCamera();
});
window.addEventListener('beforeunload', () => { if (!gameHasBegun)
    return; try {
    localStorage.setItem('burning-banners-backup', JSON.stringify({ savedAt: saveClock = Math.max(Date.now(), saveClock + 1), stateText: exportGame(state) }));
}
catch { /* IndexedDB copy may still be available. */ } });
window.__GAME_DEBUG__ = Object.freeze({
    getState: () => structuredClone(state),
    legalActions: () => structuredClone(legalActions(state)),
    exportSave: () => exportGame(state),
    getAIAction: () => structuredClone(botAction(state)),
    loadScenario: (id, scenarioSeed = 20261004, scenarioControllers) => {
        const choice = scenarioOptions.find(s => s.id === id);
        if (!choice)
            throw new Error('Unknown scenario fixture.');
        if (botTimer)
            clearTimeout(botTimer);
        config = structuredClone(choice.config);
        selectedScenario = choice.id;
        packLabel = null;
        controllers = scenarioControllers || Object.fromEntries(config.scenario.kingdoms.map(k => [k.id, 'human']));
        state = createGame({ ...config, seed: scenarioSeed, controllers });
        modal = null;
        modalParent = null;
        curtain = null;
        selectedHex = null;
        selectedUnitId = null;
        camera = null;
        botPaused = true;
        mobileOpen = false;
        sideTab = 'council';
        render();
    },
});
render();
void loadSave();
