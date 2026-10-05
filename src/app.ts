import {cards, cardById, monsters, monsterById, advancedDescription, playerFor, stackIds, adjustedDice, effectiveDefinition, runtimeLimitations, runtimePlayable, playableCounts} from './advanced.js';
import {advancedCatalog} from './advanced-data.js';
import { advancedActor, createGame, applyAction, legalActions, moveOptions, shipOptions, combatForecast, botAction, validateState, exportGame, importGame } from './engine.js';
import type { Action, GameState, Hex, Unit, UnitDefinition, Controller, GameConfig, CombatForecast, DiceRoll } from './engine.js';
import {createCompanion,recordCampaignEvent,getBriefing,getReplayEvents,markRead,visibleMessages,sendCampaignMessage,setDelegation,updateCompanionDifficulty,savePrivateNote,messageTemplates} from './async-play.js';
import type {MessageTemplate} from './async-play.js';
import {chooseDifficultyAction,AI_DIFFICULTIES} from './ai.js';
import type {AIDifficulty} from './ai.js';
import {renderCampaignDesk} from './campaign-desk.js';
import { getScenarioOptions } from './scenarios.js';

const root = document.querySelector<HTMLDivElement>('#app')!;
const R = 72;
const SQRT3 = Math.sqrt(3);
const seasons = ['Spring', 'Summer', 'Autumn'];
const tableDate = (position: GameState) => position.advanced?.pending?.kind === 'winter'
  ? `Winter ${position.year - 1}` : `${seasons[position.season]} ${position.year}`;
const rulesURL = 'https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/';
const icons: Record<string, string> = {
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
const icon = (name: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.info}</svg>`;
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]!));
const button = (cmd: string, name: string, glyph: string, cls = '', disabled = false) => `<button type="button" data-command="${esc(cmd)}" aria-label="${esc(name)}" class="${cls}" ${disabled ? 'disabled' : ''}>${icon(glyph)}<span>${esc(name)}</span></button>`;
const color = (id: string) => { const key = id.toLowerCase(); return key.includes('fjord') ? '#a69462' : key.includes('oath') ? '#5f7f85' : key.includes('night') ? '#9b748c' : key.includes('orc') ? '#9f6a4e' : key.includes('gob') ? '#7e8761' : key.includes('emp') ? '#bc665a' : '#b49767'; };
const center = (hex: Hex) => ({ x: R * 1.5 * hex.q, y: R * SQRT3 * (hex.r + hex.q / 2) });
const points = Array.from({ length: 6 }, (_, i) => `${R * Math.cos(i * Math.PI / 3)},${R * Math.sin(i * Math.PI / 3)}`).join(' ');
const scenarioOptions = getScenarioOptions();
let config: GameConfig = scenarioOptions[0].config;
let selectedScenario = scenarioOptions[0].id;
config.controllers = Object.fromEntries(config.scenario.kingdoms.map((k, i) => [k.id, i ? 'ai' : 'human']));
let state = createGame(config);
let saved: GameState | null = null;
let selectedUnitId: string | null = null;
let selectedHex: string | null = null;
let sideTab: 'council' | 'muster' | 'chronicle' | 'hand' = 'council';
let mobileOpen = false;
let modal: 'setup' | 'rules' | 'credits' | 'gallery' | 'victory' | 'end-confirm' | 'codex' | 'preferences' | 'save' | 'desk' | 'regenerate-confirm' | null = 'setup';
let modalParent: 'setup' | null = null;
let exportURL:string|null=null;
let regenerateRequest:Extract<Action,{type:'regenerate'}>|null=null;
let controllers: Record<string, Controller> = { ...config.controllers };
let seed = String(Date.now() % 1000000);
let camera: { x: number; y: number; w: number; h: number } | null = null;
let cameraBaseWidth = 1;
let shipMode = false;
let sound = false;
let profile:'basic'|'advanced'='advanced';
let sharedHands=true;
let selectedCardId:string|null=null;
let selectedMagicIndex=0;
const studySelection:Record<string,number>={spells:0,blessings:0,treasures:0};
let motion:'system'|'on'|'off'='system';
try{const preferences=JSON.parse(localStorage.getItem('burning-banners-preferences')||'{}');if(['system','on','off'].includes(preferences.motion))motion=preferences.motion;sound=preferences.sound===true;}catch{}
const motionEnabled=()=>motion!=='off'&&(motion==='on'||!window.matchMedia('(prefers-reduced-motion:reduce)').matches);
const savePreferences=()=>{try{localStorage.setItem('burning-banners-preferences',JSON.stringify({motion,sound}));}catch{}};
let movementFrom:Record<string,string>|null=null;
let audioCtx: AudioContext | null = null;
let saveStatus = 'Local save ready';
let saveError = false;
let curtain: string | null = null;
let botTimer: ReturnType<typeof setTimeout> | null = null;
let botPaused = false;
let botSteps = 0;
let botTurn = -1;
let noticeTimer: ReturnType<typeof setTimeout> | null = null;
let serialSaving = 0;
let saveClock = 0;
let gameHasBegun = false;
let recruitDefinition: string | null = null;
let currentActions: Action[] = [];
let packLabel: string | null = null;
let deskTab:'briefing'|'replay'|'command'|'messages'|'notes'='briefing';
let replaySeq:number|null=null;
let replayEdge:'before'|'after'='after';
let replayTimer:ReturnType<typeof setTimeout>|null=null;
let replayPlaying=false;
let replayOverview=false;
let setupDifficulty:AIDifficulty='normal';
const ensureCompanion=()=>{state.companion??=createCompanion(state);};
const deskViewer=()=>state.companion?.viewKingdom??actor();
function followHumanViewer(){ensureCompanion();if(kingdom(actor())?.controller==='human')state.companion!.viewKingdom=actor();}
function returnBriefing(){ensureCompanion();const b=getBriefing(state,deskViewer());if(state.companion!.briefingOnReturn&&(b.unreadCount||b.unreadMessages)){deskTab='briefing';modal='desk';}}
function ownedHumanSeats(){const viewer=deskViewer();return (playerFor(state,viewer)?.kingdoms??[viewer]).filter(id=>state.companion?.originalControllers[id]==='human');}
function aiChoice(){const clean={...state,companion:undefined},difficulty=state.companion?.difficulty[actor()]??'normal';return chooseDifficultyAction(state,difficulty,difficulty==='hard'?null:botAction(clean));}
function computerMessage(who:string,action:Action){
  const c=state.companion!;
  const latest=visibleMessages(state,who).filter(m=>m.author!==who&&!m.automatic&&m.channel==='alliance'&&m.hexId&&m.turn>=state.turnSerial-2).at(-1);
  const replied=c.messages.some(m=>m.author===who&&m.automatic&&m.turn===state.turnSerial);
  if(replied)return;
  if(latest)state=sendCampaignMessage(state,who,'',{channel:'alliance',template:'support',hexId:latest.hexId,automatic:true});
  else if(action.type==='end-turn')state=sendCampaignMessage(state,who,'',{channel:'alliance',template:'ready',automatic:true});
}
function advanceReplay(step:number){const events=getReplayEvents(state,deskViewer());if(!events.length)return;const i=Math.max(0,events.findIndex(e=>e.seq===replaySeq));replaySeq=events[Math.max(0,Math.min(events.length-1,i+step))].seq;}
function scheduleReplay(){if(replayTimer)clearTimeout(replayTimer);if(!replayPlaying||modal!=='desk'||deskTab!=='replay')return;replayTimer=setTimeout(()=>{if(!replayPlaying||modal!=='desk'||deskTab!=='replay')return;const events=getReplayEvents(state,deskViewer());if(replaySeq===events.at(-1)?.seq){replayPlaying=false;render();return;}advanceReplay(1);render();scheduleReplay();},1200);}
function regenerationModal(){const unit=state.units.find(u=>u.id===regenerateRequest?.unitId);return standardModal('A free action for its owner',unit?`<p>Ask ${esc(kingdomName(unit.kingdom))} to confirm regeneration of ${esc(definition(unit).name)}. Their kingdom pays ${definition(unit).recoveryCost} gold. The current kingdom turn continues.</p><button class="primary-button full" data-command="regenerate-confirm">${esc(kingdomName(unit.kingdom))} confirms · Regenerate</button>`:'<p>That Army is no longer available.</p>');}
function deskModal(){ensureCompanion();const events=getReplayEvents(state,deskViewer());if(!events.some(e=>e.seq===replaySeq))replaySeq=events.at(-1)?.seq??null;return standardModal('Campaign desk',renderCampaignDesk(state,{viewer:deskViewer(),tab:deskTab,replaySeq,replayEdge,replayOverview,selectedHex:selectedHex??getUnit()?.hexId??null,botPaused}));}


const getUnit = () => state.units.find(u => u.id === selectedUnitId);
const definition = (u: Unit) => state.unitDefinitions.find(d => d.id === u.defId)!;
const getHex = (id: string | null) => state.hexes.find(h => h.id === id);
const kingdom = (id: string) => state.kingdoms.find(k => k.id === id);
const kingdomName = (id: string) => kingdom(id)?.name || ({ oathborn: 'The Oathborn', fjordland: 'Fjordland', empire: 'Eastern Empire', night: 'Army of Night', goblins: 'The Goblins', orcs: 'The Orcs' }[id] || id);
const actor = () => advancedActor(state);
const isBot = () => kingdom(actor())?.controller === 'ai';
const mobileLayout = () => window.matchMedia('(max-width:760px)').matches;
const art = (d: UnitDefinition) => {
  if (d.art) return d.art;
  const name = d.name.toLowerCase();
  const key = name.includes('freeholder') ? 'freeholders' : name.includes('sea reaver') ? 'sea-reavers' : name.includes('ranger') ? 'rangers' : name.includes('berserk') ? 'berserkir' : name.includes('oath taker') || name.includes('oath-taker') ? 'oath-takers' : name.includes('iron legion') ? 'iron-legion' : name.includes('crossbow') ? 'kings-crossbows' : name.includes('miner') ? 'miners' : null;
  if (key) return `./assets/unit-${key}.webp`;
  const id = d.kingdom.toLowerCase();
  const faction = id.includes('fjord') ? 'fjordland' : id.includes('oath') ? 'oathborn' : id.includes('orc') ? 'orcs' : id.includes('gob') ? 'goblins' : id.includes('night') ? 'night' : 'empire';
  return `./assets/troop-${faction}.webp`;
};
const stateReady = () => !modal && !curtain && !isBot() && state.phase !== 'game-over';
const stats = (u: Unit, includeStack = true) => { const d = definition(u); const dice=adjustedDice(state,u.id,{light:u.weakened?d.weakenedLight??d.light:d.light,heavy:u.weakened?d.weakenedHeavy??d.heavy:d.heavy},includeStack);return {...dice,move:effectiveDefinition(state,u,d).movement}; };
const selectedTargetAction = (): Action | undefined => {
  const unit = getUnit();
  if (!unit || !selectedHex || unit.hexId === selectedHex) return undefined;
  const attack = currentActions.find(a => a.type === 'attack' && a.unitId === unit.id && a.targetHex === selectedHex);
  if (attack) return attack;
  return currentActions.find(a => a.type === (shipMode ? 'ship' : 'move') && a.unitId === unit.id && a.toHex === selectedHex);
};
const actionAttr = (action: Action) => `data-action="${esc(JSON.stringify(action))}"`;
const actionLabel = (a: Action) => {
  if (a.type === 'finish-winter') {
    const advanced = state.advanced, pending = advanced?.pending;
    const anotherPlayer = pending?.kind === 'winter' && advanced?.players.slice(pending.playerIndex + 1)
      .some(player => player.kingdoms.some(id => !state.kingdoms.find(k => k.id === id)?.collapsed));
    return anotherPlayer ? 'Confirm Treasures' : 'Continue to Spring';
  }
  if(a.type==='store-satchel')return 'Keep & play the Satchel';
  if(a.type==='remove-curse')return `Remove ${cardById(a.cardId)?.name} · ${kingdomName(a.kingdomId)} pays 3 gold`;
  if(a.type==='request-cantrip')return `${state.advanced?.players.find(p=>p.id===a.playerId)?.name} · Play a Cantrip`;
  if (a.type === 'study') return `Study ${a.discipline}${a.discardId?' · exchange '+cardById(a.discardId)?.name:''}${a.treasureId?' · '+cardById(a.treasureId)?.name:''}${a.secondTreasureId?' + '+cardById(a.secondTreasureId)?.name:''}${a.payKingdomId?' · '+kingdomName(a.payKingdomId)+' pays the Curse fee':''}`;
  if(a.type==='allocate-hit')return `Hit ${state.units.find(u=>u.id===a.unitId)?definition(state.units.find(u=>u.id===a.unitId)!).name:a.unitId}`;
  if(a.type==='command-monster')return `Command with ${kingdomName(a.kingdomId)}`;
  if(a.type==='sell-treasure')return `Sell ${cardById(a.cardId)?.name} · ${kingdomName(a.kingdomId)} +2 gold`;
  if(a.type==='magic-choice')return state.advanced?.pending?.kind==='choice'?state.advanced.pending.choices.find(c=>c.value===a.value)?.label||a.value:a.value;
  if (a.type === 'transfer-gold') return `Aid ${kingdomName(a.toKingdom)}`;
  const names: Record<string, string> = { 'magic-pass':'Continue', 'finish-study':'Finish study', 'finish-winter':'Continue to Spring', 'accept-hit':'Apply next hit', 'drop-army':'Leave Army & continue with Hero', 'drop-hero':'Drop off Hero', 'join-stack':'Join Army stack', 'explore-lair':'Explore Lair', 'attack-monster':'Attack Monster', 'monster-pass':'Finish Monster', 'slink-away':'Slink away', 'recruit-hero':'Recruit a random Hero', recover: 'Recover to full strength', regenerate: 'Regenerate', mine: 'Work this mine', pass: 'Finish activation', coven: 'Raise a Coven', 'remove-coven': 'Remove this Coven', 'lay-waste': 'Lay waste', 'remove-control': 'Remove control', recolonize: 'Recolonize', 'disband-siege': 'Disband Siege', suppress: 'Suppress rebellion', 'collect-income': 'Collect income', 'end-turn': 'End kingdom turn' };
  return names[a.type] || a.type;
};
const objectiveText = () => {
  const obj = state.scenario.objective;
  const places = obj.hexIds.map(id => getHex(id)?.settlement?.name || id).join(', ');
  return obj.type === 'survival' ? `Hold out through ${seasons[state.scenario.endSeason]} ${state.scenario.endYear}. ${places ? `Protect ${places}.` : ''}` : `${obj.kingdom ? kingdomName(obj.kingdom) : 'The invaders'} must control ${obj.count} ${obj.count === 1 ? 'objective' : 'objectives'}${places ? `: ${places}` : ''}${obj.deadlineOnly ? ` by ${seasons[state.scenario.endSeason]} ${state.scenario.endYear}` : ''}.`;
};

function notify(message: string) {
  document.querySelector('.notification')?.remove();
  const div = document.createElement('div');
  div.className = 'notification'; div.setAttribute('role', 'status'); div.textContent = message;
  document.body.append(div);
  if (noticeTimer) clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => div.remove(), 4800);
}

async function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('burning-banners-war-table', 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('saves')) request.result.createObjectStore('saves'); };
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
    if (saving !== serialSaving) { database.close(); return; }
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(JSON.stringify(envelope), 'latest');
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
    database.close();
    if (saving === serialSaving) { saved = snapshot; saveStatus = 'Saved on this device'; saveError = false; }
  } catch {
    if (saving !== serialSaving) return;
    try { localStorage.setItem('burning-banners-backup', JSON.stringify(envelope)); saved = snapshot; saveStatus = 'Saved locally · backup'; saveError = false; }
    catch { saveStatus = 'Save unavailable · export a copy'; saveError = true; }
  }
  const indicator = document.querySelector('.save-status');
  if (indicator) { indicator.textContent = saveStatus; indicator.classList.toggle('error', saveError); }
}

async function loadSave() {
  const candidates: { state: GameState; savedAt: number }[] = [];
  const read = (raw: unknown) => {
    if (typeof raw !== 'string') return;
    try {
      const envelope = JSON.parse(raw) as { savedAt?: unknown; stateText?: unknown };
      if (typeof envelope.stateText === 'string' && typeof envelope.savedAt === 'number' && Number.isFinite(envelope.savedAt)) candidates.push({ state: importGame(envelope.stateText), savedAt: envelope.savedAt });
      else candidates.push({ state: importGame(raw), savedAt: 0 });
    } catch { /* A malformed copy is not considered. */ }
  };
  try {
    const database = await db();
    const raw = await new Promise<unknown>((resolve, reject) => { const req = database.transaction('saves').objectStore('saves').get('latest'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
    database.close();
    read(raw);
  } catch { /* Backup storage is checked below. */ }
  try { read(localStorage.getItem('burning-banners-backup')); } catch { /* Storage can be unavailable. */ }
  if (serialSaving || gameHasBegun) return;
  candidates.sort((a, b) => b.savedAt - a.savedAt);
  if (candidates[0]) { saved = candidates[0].state; saveClock = Math.max(saveClock, candidates[0].savedAt); state = saved; gameHasBegun = true; camera = null; saveStatus = 'Saved campaign found'; render(); }
}

function playSound(kind: string) {
  if (!sound) return;
  try {
    audioCtx ||= new AudioContext();
    void audioCtx.resume();
    const oscillator = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    oscillator.type = 'triangle'; oscillator.frequency.value = kind === 'attack' ? 90 : kind === 'move' ? 250 : 175;
    gain.gain.setValueAtTime(.025, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .14);
    oscillator.connect(gain); gain.connect(audioCtx.destination); oscillator.start(); oscillator.stop(audioCtx.currentTime + .15);
  } catch { sound = false; notify('Audio is unavailable in this browser.'); }
}

function perform(action: Action, automatic = false, ownerConfirmed=false) {
  if (!automatic && !stateReady()) return;
  if(!automatic&&!ownerConfirmed&&action.type==='regenerate'){
    const unit=state.units.find(u=>u.id===action.unitId);
    if(unit&&unit.kingdom!==actor()){
      if(kingdom(unit.kingdom)?.controller==='ai'){notify('The computer decides when its own Army regenerates.');return;}
      regenerateRequest=action;modal='regenerate-confirm';modalParent=null;render();return;
    }
  }
  try {
    const beforeActor = actor();
    const beforeController = kingdom(beforeActor)?.controller;
    const beforePlayer=playerFor(state,beforeActor)?.id;
    movementFrom=motionEnabled()?Object.fromEntries(state.units.map(u=>[u.id,u.hexId])):null;
    const beforeState=state;
    state = recordCampaignEvent(beforeState,applyAction(state, action),action,automatic);
    if(automatic)computerMessage(beforeActor,action);
    selectedMagicIndex=0;
    if(selectedCardId&&!state.advanced?.hands[playerFor(state,actor())?.id||'']?.includes(selectedCardId)&&!state.units.some(u=>u.defId===selectedCardId))selectedCardId=null;
    playSound(action.type);
    const active = state.units.find(u => u.id === state.activeUnitId);
    if (active) selectedUnitId = active.id;
    if (selectedUnitId && !state.units.some(u => u.id === selectedUnitId)) selectedUnitId = null;
    selectedHex = null; recruitDefinition = null;
    if (action.type === 'end-turn') { selectedUnitId = null; shipMode = false; }
    if (state.phase === 'game-over') { modal = 'victory'; botPaused = true; }
    else if (actor() !== beforeActor && (!state.advanced||playerFor(state,actor())?.id!==beforePlayer) && kingdom(actor())?.controller === 'human') curtain = actor();
    if(!curtain)followHumanViewer();
    render();animateMovement(); void persist(); scheduleBot();
  } catch (error) { notify(error instanceof Error ? error.message : 'That action is not available.'); render(); }
}

function scheduleBot() {
  if (botTimer) clearTimeout(botTimer);
  if (!isBot() || modal || curtain || botPaused || state.phase === 'game-over') return;
  if (botTurn !== state.turnSerial) { botTurn = state.turnSerial; botSteps = 0; }
  if (++botSteps > 180) { botPaused = true; render(); notify('Computer play paused after a long turn. Resume from the action bar.'); return; }
  botTimer = setTimeout(() => {
    if (!isBot() || modal || curtain || botPaused) return;
    const action = aiChoice();
    if (action) perform(action, true);
    else { botPaused = true; render(); notify('The computer has no legal action. You can save this position for inspection.'); }
  }, 650);
}

function boardBounds(campaign = false) {
  const opening = state.units.map(u => getHex(u.hexId)).filter((h): h is Hex => !!h);
  const coords = (campaign && state.scenario.id === 'drefeld-teaching' && opening.length ? opening : state.hexes).map(center);
  const minX = Math.min(...coords.map(c => c.x)) - R - 32;
  const minY = Math.min(...coords.map(c => c.y)) - R - 32;
  const maxX = Math.max(...coords.map(c => c.x)) + R + 32;
  const maxY = Math.max(...coords.map(c => c.y)) + R + 32;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function viewport() {
  const element = root.querySelector<HTMLElement>('.board-wrap');
  const rect = element?.getBoundingClientRect();
  return { width: Math.max(1, rect?.width || 900), height: Math.max(1, rect?.height || 650), left: rect?.left || 0, top: rect?.top || 0 };
}

let cameraFrame = 0;
let readyIndex = 0;
let gestureActive = false;
let suppressMapClickUntil = 0;

function clampCamera() {
  if (!camera) return;
  const view = viewport();
  camera.h = camera.w * view.height / view.width;
  const bounds = boardBounds();
  const area = visibleMapArea();
  const visibleWidth = mobileLayout() && mobileOpen ? area.right / (view.width / camera.w) : camera.w;
  const visibleHeight = mobileLayout() && mobileOpen ? area.bottom / (view.width / camera.w) : camera.h;
  const margin = 70;
  const clampAxis = (start: number, size: number, min: number, length: number) => size > length + margin * 2 ? min - (size - length) / 2 : Math.max(min - margin, Math.min(start, min + length + margin - size));
  camera.x = clampAxis(camera.x, visibleWidth, bounds.x, bounds.w);
  camera.y = clampAxis(camera.y, visibleHeight, bounds.y, bounds.h);
}

function visibleMapArea() {
  const v = viewport();
  const heading = root.querySelector<HTMLElement>('.board-heading');
  const panel = mobileLayout() && mobileOpen ? root.querySelector<HTMLElement>('.sidebar.mobile-open') : null;
  let right = v.width - 12, bottom = v.height - 72;
  if (panel) {
    const rect = panel.getBoundingClientRect();
    if (rect.left - v.left > v.width * .3) right = rect.left - v.left - 12;
    else bottom = rect.top - v.top - 12;
  }
  return { left: 12, top: heading ? heading.getBoundingClientRect().bottom - v.top + 12 : 70, right, bottom };
}

function fitBoard(campaign = false) {
  const view = viewport();
  const bounds = boardBounds(campaign);
  let width = Math.max(bounds.w + 55, (bounds.h + 55) * view.width / view.height);
  if (campaign && mobileLayout()) {
    const first = state.units.find(u => u.kingdom === state.currentKingdom && !u.activated) || state.units[0];
    const hex = first && getHex(first.hexId);
    if (hex) {
      const pos = center(hex);
      width = view.width / .8;
      camera = { x: pos.x - width / 2, y: pos.y - width * view.height / view.width / 2, w: width, h: width * view.height / view.width };
    }
  }
  if (!camera || !campaign || !mobileLayout()) camera = { x: bounds.x + bounds.w / 2 - width / 2, y: bounds.y + bounds.h / 2 - width * view.height / view.width / 2, w: width, h: width * view.height / view.width };
  if (campaign && state.scenario.id !== 'drefeld-teaching') {
    const first = state.units.find(u => u.kingdom === state.currentKingdom && !u.activated);
    const hex = first && getHex(first.hexId);
    if (hex) {
      const p = center(hex); const w = view.width / .8;
      camera = { x: p.x - w / 2, y: p.y - w * view.height / view.width / 2, w, h: w * view.height / view.width };
    }
  }
  cameraBaseWidth = Math.max(boardBounds().w, boardBounds().h * view.width / view.height);
  clampCamera(); updateCamera();
}

function zoom(multiplier: number, anchor?: { x: number; y: number }, anchorScreen?: { x: number; y: number }) {
  if (!camera) return;
  const view = viewport(), bounds = boardBounds();
  const fullWidth = Math.max(bounds.w, bounds.h * view.width / view.height);
  const newW = Math.min(fullWidth * 1.08, Math.max(view.width / 1.7, camera.w * multiplier));
  const point = anchor || { x: camera.x + camera.w / 2, y: camera.y + camera.h / 2 };
  const screen = anchorScreen || { x: view.width / 2, y: view.height / 2 };
  camera = { x: point.x - screen.x / view.width * newW, y: point.y - screen.y / view.width * newW, w: newW, h: newW * view.height / view.width };
  clampCamera(); updateCamera();
}

function updateCamera() {
  if (cameraFrame) return;
  cameraFrame = requestAnimationFrame(() => { cameraFrame = 0; paintCamera(); });
}

const markerInkCache = new WeakMap<HTMLElement,{mode:string;parts:Array<{kind:string;box:{left:number;top:number;right:number;bottom:number}}>}>();

function paintCamera() {
  if (!camera) return;
  const view = viewport(), scale = view.width / camera.w, bounds = boardBounds();
  const world = root.querySelector<SVGSVGElement>('.board-world');
  if (world) world.style.transform = `translate(${(bounds.x - camera.x) * scale}px,${(bounds.y - camera.y) * scale}px) scale(${scale})`;
  const wrap = root.querySelector<HTMLElement>('.board-wrap');
  if (!wrap) return;
  wrap.dataset.cameraX = camera.x.toFixed(3); wrap.dataset.cameraY = camera.y.toFixed(3); wrap.dataset.cameraWidth = camera.w.toFixed(3); wrap.dataset.cameraHeight = camera.h.toFixed(3); wrap.dataset.cameraScale = scale.toFixed(4);
  wrap.classList.toggle('map-overview', scale < .48);
  wrap.classList.toggle('map-detail', scale >= 1.12);
  type Box = {left:number;top:number;right:number;bottom:number};
  const units:Box[] = [], townLabels:Box[] = [], townIcons:Box[]=[];
  const markers = Array.from(root.querySelectorAll<HTMLElement>('.map-marker'));
  const leaders:string[] = [];
  const mode=`${scale<.48}:${mobileLayout()}`;
  // Only newly mounted markers or a semantic zoom change need a DOM measurement.
  // Every gesture thereafter uses cached local ink rectangles, not text guesses.
  for(const marker of markers){
    const previous=markerInkCache.get(marker);if(previous?.mode===mode)continue;
    const origin=marker.getBoundingClientRect(),cx=origin.left+origin.width/2,cy=origin.top+origin.height/2;
    const parts:Array<{kind:string;box:Box}>=[];
    for(const selector of marker.dataset.markerKind==='unit'?['.unit-card','.unit-map-name','.hero-stack-badge']:['img','.town-map-name']){
      const element=marker.querySelector<HTMLElement>(selector);if(!element)continue;
      const r=element.getBoundingClientRect();if(r.width<1||r.height<1)continue;
      parts.push({kind:selector.includes('name')?'label':'icon',box:{left:r.left-cx,top:r.top-cy,right:r.right-cx,bottom:r.bottom-cy}});
    }
    if(marker.dataset.markerKind==='town')parts.push({kind:'hit',box:{left:-origin.width/2,top:-origin.height/2,right:origin.width/2,bottom:origin.height/2}});
    markerInkCache.set(marker,{mode,parts});
  }
  const overlap=(a:Box,b:Box)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  const shift=(b:Box,x:number,y:number,pad=2):Box=>({left:b.left+x-pad,top:b.top+y-pad,right:b.right+x+pad,bottom:b.bottom+y+pad});
  const setPosition=(marker:HTMLElement,x:number,y:number)=>{
    marker.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-50%)`;
    const outside=x<-120||x>view.width+120||y<-100||y>view.height+100;
    marker.style.visibility=outside?'hidden':'visible';marker.style.pointerEvents=outside?'none':'';
  };
  for(const marker of markers.filter(m=>m.dataset.markerKind==='unit')){
    const x=(Number(marker.dataset.worldX)-camera.x)*scale+Number(marker.dataset.stackOffset||0),y=(Number(marker.dataset.worldY)-camera.y)*scale-8;
    setPosition(marker,x,y);
    for(const part of markerInkCache.get(marker)?.parts||[])units.push(shift(part.box,Math.round(x),Math.round(y),3));
  }
  const towns=markers.filter(m=>m.dataset.markerKind==='town').sort((a,b)=>Number(b.classList.contains('selected'))-Number(a.classList.contains('selected'))||Number(b.classList.contains('important'))-Number(a.classList.contains('important')));
  const destinations:Box[]=[];
  const selected=getUnit();
  if(selected)for(const action of currentActions){
    if(!('unitId'in action)||action.unitId!==selected.id||!['move','ship','attack'].includes(action.type))continue;
    const id=action.type==='attack'?action.targetHex:action.type==='move'||action.type==='ship'?action.toHex:'';
    const hex=getHex(id);if(!hex)continue;const p=center(hex),px=(p.x-camera.x)*scale,py=(p.y-camera.y)*scale,half=Math.max(22,15*scale+3);
    destinations.push({left:px-half,top:py-half,right:px+half,bottom:py+half});
  }
  for(const marker of towns){
    const x=(Number(marker.dataset.worldX)-camera.x)*scale,y=(Number(marker.dataset.worldY)-camera.y)*scale;
    if((scale<.48&&!marker.classList.contains('important')&&!marker.classList.contains('selected'))||x<-80||x>view.width+80||y<-80||y>view.height+80){marker.style.visibility='hidden';marker.style.pointerEvents='none';continue;}
    const ink=markerInkCache.get(marker)?.parts||[],label=ink.find(p=>p.kind==='label')?.box,iconBox=ink.find(p=>p.kind==='icon')?.box,hitBox=ink.find(p=>p.kind==='hit')?.box;
    if(!label||!iconBox||!hitBox)continue;
    const occupied=state.units.some(u=>u.hexId===marker.dataset.mapHex);
    const candidates=occupied?[[0,44],[105,0],[-105,0],[105,52],[-105,52],[0,-84],[0,112],[142,-48],[-142,-48]]:[[0,12],[90,0],[-90,0],[0,60],[0,-70],[130,40],[-130,40]];
    for(const radius of [120,170,220])for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[.75,.75],[-.75,.75],[.75,-.75],[-.75,-.75]])candidates.push([dx*radius,dy*radius]);
    let chosen={x,y},best=Infinity,chosenLabel=shift(label,x,y),chosenIcon=shift(iconBox,x,y);
    for(let i=0;i<candidates.length;i++){
      const[dx,dy]=candidates[i];
      // Clamp the whole plaque into view before comparing candidates; otherwise
      // a partially offscreen town can prefer a text collision to edge clipping.
      const px=Math.round(Math.max(7-label.left,Math.min(x+dx,view.width-7-label.right)));
      const py=Math.round(Math.max(7-iconBox.top,Math.min(y+dy,view.height-7-label.bottom)));
      const plaque=shift(label,px,py,3),image=shift(iconBox,px,py,2),buttonBox=shift(hitBox,px,py,3);
      const textHit=units.reduce((n,u)=>n+overlap(plaque,u),0)+townLabels.reduce((n,t)=>n+overlap(plaque,t),0);
      const imageHit=units.reduce((n,u)=>n+overlap(image,u),0)+townIcons.reduce((n,t)=>n+overlap(image,t),0);
      const destinationHit=destinations.reduce((n,d)=>n+overlap(buttonBox,d)+overlap(plaque,d),0);
      const score=destinationHit*1000000+textHit*100000+imageHit*25+Math.hypot(px-x,py-y)*.1+i*.01;
      if(score<best){best=score;chosen={x:px,y:py};chosenLabel=plaque;chosenIcon=image;}
      if(destinationHit===0&&textHit===0&&imageHit===0&&i===0)break;
    }
    setPosition(marker,chosen.x,chosen.y);townLabels.push(chosenLabel);townIcons.push(chosenIcon);
    marker.dataset.labelShiftX=(chosen.x-x).toFixed(1);marker.dataset.labelShiftY=(chosen.y-y).toFixed(1);
    if(occupied||Math.abs(chosen.x-x)>1||Math.abs(chosen.y-y-12)>1)leaders.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${chosen.x.toFixed(1)}" y2="${(chosen.y-8).toFixed(1)}"/>`);
  }
  const leaderLayer=root.querySelector('.map-leaders');if(leaderLayer)leaderLayer.innerHTML=leaders.join('');
  const label = root.querySelector('.zoom-level');
  if (label) label.textContent = `${Math.round(scale * 100)}%`;
}

function focusUnit(u: Unit) {
  const hex = getHex(u.hexId); if (!hex) return;
  const view = viewport(); const pos = center(hex);
  const scale = Math.max(.8, Math.min(1.1, camera ? view.width / camera.w : .9));
  const w = view.width / scale;
  const area = visibleMapArea();
  const targetX = mobileLayout() ? (area.left + area.right) / 2 : view.width / 2;
  let targetY = mobileLayout() ? (area.top + area.bottom) / 2 : view.height / 2;
  if (mobileLayout()) {
    const marker=Array.from(root.querySelectorAll<HTMLElement>('[data-map-unit]')).find(m=>m.dataset.mapUnit===u.id||m.dataset.stackHeroes?.split(',').includes(u.id));
    let inkTop=-40,inkBottom=53;
    if(marker){
      const origin=marker.getBoundingClientRect(),cy=origin.top+origin.height/2;
      const rects=Array.from(marker.querySelectorAll<HTMLElement>('.unit-card,.unit-map-name,.hero-stack-badge')).map(e=>e.getBoundingClientRect()).filter(r=>r.height>0);
      if(rects.length){inkTop=Math.min(...rects.map(r=>r.top-cy))-8;inkBottom=Math.max(...rects.map(r=>r.bottom-cy))-8;}
    }
    // Centre the complete visible card and its name, not just the hex centre.
    const minY=area.top-inkTop,maxY=area.bottom-inkBottom;
    targetY=minY<=maxY?Math.max(minY,Math.min((area.top+area.bottom-inkTop-inkBottom)/2,maxY)):minY;
  }
  camera = { x: pos.x - targetX / scale, y: pos.y - targetY / scale, w, h: w * view.height / view.width };
  clampCamera(); updateCamera();
}

function drawCounter(u: Unit) {
  const h = getHex(u.hexId); if (!h) return '';
  const d = definition(u), s = stats(u,false), pos = center(h);
  const attachedArmy = state.advanced?.stacks[u.id];
  if (d.kind === 'hero' && attachedArmy && state.units.some(v => v.id === attachedArmy && v.hexId === u.hexId)) return '';
  const heroes = state.units.filter(v => state.advanced?.stacks[v.id] === u.id && v.hexId === u.hexId);
  const stack = state.units.filter(v => v.hexId === u.hexId && !(definition(v).kind === 'hero' && state.advanced?.stacks[v.id] && state.units.some(a => a.id === state.advanced!.stacks[v.id] && a.hexId === v.hexId)));
  const offset = (stack.findIndex(v => v.id === u.id) - (stack.length - 1) / 2) * 72;
  const ready = !u.activated && u.kingdom === state.currentKingdom;
  const selected = selectedUnitId === u.id || heroes.some(v => v.id === selectedUnitId);
  const heroNames = heroes.map(v => definition(v).name).join(' + ');
  const short = d.name.replace(/^(The |King’s |King's )/, '').split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  return `<button type="button" class="map-marker unit-marker ${d.kind==='hero'?'hero-marker':''} ${heroes.length?'has-hero':''} ${stack.length>1?'stacked':''} counter ${u.activated ? 'used' : ''} ${selected ? 'selected' : ''}" data-map-unit="${esc(u.id)}" data-unit="${esc(u.id)}" data-stack-heroes="${esc(heroes.map(v=>v.id).join(','))}" data-marker-kind="unit" data-world-x="${pos.x}" data-world-y="${pos.y}" data-stack-offset="${offset}" style="--faction:${color(u.kingdom)}" aria-label="${esc(`${d.name}${heroNames ? ', with Hero '+heroNames : ''}, ${kingdomName(u.kingdom)}, ${u.weakened ? 'weakened' : 'full strength'}, ${u.activated ? 'activated' : 'ready'}`)}" title="${esc(d.name)}${heroNames?' · Hero '+esc(heroNames):''} · ${esc(kingdomName(u.kingdom))}">
    ${heroNames?`<span class="hero-stack-badge" title="${esc(heroNames)}"><span aria-hidden="true">✦</span> ${esc(heroNames)}</span>`:''}<span class="unit-card ${u.weakened ? 'weakened' : ''}"><img src="${esc(art(d))}" alt="" draggable="false"><span class="unit-faction-mark">${esc(short)}</span>${ready ? '<span class="unit-ready" title="Ready"></span>' : ''}<span class="unit-card-stats"><span class="light-die">${s.light}</span><span class="heavy-die">${s.heavy}</span><span class="move-value">${u.id === state.activeUnitId || heroes.some(v=>v.id===state.activeUnitId) ? state.remainingMP : s.move}›</span></span></span><span class="unit-map-name">${esc(d.name)}</span>${u.weakened ? '<span class="unit-condition">WEAK</span>' : ''}
  </button>`;
}

function renderMap() {
  const unit = getUnit();
  const movement = unit && unit.kingdom === state.currentKingdom ? (shipMode ? shipOptions(state, unit.id) : moveOptions(state, unit.id)) : [];
  const moveSet = new Set(movement.map(m => m.hexId));
  const attackSet = new Set(currentActions.filter(a => a.type === 'attack' && a.unitId === unit?.id).map(a => a.type === 'attack' ? a.targetHex : ''));
  const terrainColors: Record<string, string> = { clear: '#e0d7b8', forest: '#a9b99a', mountain: '#b8b5a5', swamp: '#acb9a5', sea: '#a9c0c6', coastal: '#b7cac5', 'major-river': '#a9c0c6', lair: '#b4a99d' };
  const terrainAsset: Record<string, string> = { coastal: 'sea', 'major-river': 'sea', lair: 'mountain' };
  const definitions = Object.keys(terrainColors).map(t => `<pattern id="terrain-${t}" width="220" height="220" patternUnits="userSpaceOnUse"><rect width="220" height="220" fill="${terrainColors[t]}"/><image href="./assets/terrain-${terrainAsset[t] || t}.webp" width="220" height="220" opacity=".23"/></pattern>`).join('');
  let roads = '';
  const byId = new Map(state.hexes.map(h => [h.id, h]));
  for (const hex of state.hexes) for (const [neighbor, edge] of Object.entries(hex.edges || {})) {
    const to = byId.get(neighbor); if (!to || hex.id > to.id) continue;
    const a = center(hex), b = center(to);
    if (edge.road) roads += `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" class="map-road"/>`;
    if (edge.river) { const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; const dx = b.x - a.x, dy = b.y - a.y; roads += `<path d="M${mx - dy * .3} ${my + dx * .3}L${mx + dy * .3} ${my - dx * .3}" class="map-river"/>`; }
  }
  const cells = state.hexes.map(h => {
    const p = center(h), controlled = state.controls[h.id], selected = selectedHex === h.id;
    return `<g class="hex-group ${selected ? 'selected' : ''} ${moveSet.has(h.id) ? 'move-option' : ''} ${attackSet.has(h.id) ? 'attack-option' : ''} ${h.prohibited ? 'unavailable' : ''}" transform="translate(${p.x},${p.y})" data-hex="${esc(h.id)}" role="button" tabindex="-1" aria-label="${esc(`${h.id}, ${h.terrain}${h.settlement ? `, ${h.settlement.name}` : ''}`)}"><title>${esc(h.id)} · ${esc(h.terrain)}${h.settlement ? ` · ${esc(h.settlement.name)}` : ''}</title><polygon class="hex-shape" points="${points}" fill="url(#terrain-${h.terrain})"/>${controlled ? `<circle class="control-ring" r="28" stroke="${color(controlled)}"/>` : ''}${deskViewer()==='night'&&state.covens.includes(h.id) ? '<path d="m-14 4 14-23 14 23-14-6Z" fill="#634354" stroke="#e0b7ca" stroke-width="2"/>' : ''}${moveSet.has(h.id) && !state.units.some(u => u.hexId === h.id) ? `<circle r="15" fill="#366450" stroke="#fcf6db" stroke-width="2"/><text x="0" y="5" text-anchor="middle" font-size="15" font-weight="600" fill="#fff9df">${movement.find(m => m.hexId === h.id)?.cost ?? ''}</text>` : ''}</g>`;
  }).join('');
  const target = selectedTargetAction();
  const path = target && (target.type === 'move' || target.type === 'ship') && target.path ? [unit?.hexId, ...target.path].filter((id): id is string => !!id).map(id => getHex(id)).filter((h): h is Hex => !!h).map(center) : [];
  const line = path.length > 1 ? `<polyline points="${path.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#fff6c7" stroke-width="7" stroke-dasharray="8 7" stroke-linecap="round" pointer-events="none"/>` : '';
  const towns = state.hexes.filter(h => h.settlement || h.mine || h.entry || state.advanced&&h.terrain==='lair').map(h => {
    const p = center(h), razed = state.razed.includes(h.id), settlement = h.settlement;
    const kind = h.terrain==='lair'?'spire':h.mine ? 'mine' : razed ? 'ruin' : settlement?.city ? 'city' : settlement?.port ? 'port' : settlement ? 'village' : 'spire';
    const name = settlement?.name || (h.terrain==='lair'?state.advanced?.explored.includes(h.id)?'Explored Lair':'Lair':h.mine ? ({'w-2-2':'Trollshaft','w-6-3':'Black Deep','w-11-1':'North Drift','w-7-12':'Dwarven Falls','w-5-14':'Endless Paths'}[h.id]||'Gold mine') : h.entry || '');
    const important = !!state.controls[h.id] || state.scenario.objective.hexIds.includes(h.id) || !!state.units.find(u => u.hexId === h.id);
    return `<button type="button" class="map-marker town-marker ${important ? 'important' : ''} ${selectedHex === h.id ? 'selected' : ''}" data-map-hex="${esc(h.id)}" data-marker-kind="town" data-world-x="${p.x}" data-world-y="${p.y}" title="${esc(name)} · ${esc(h.terrain)}" aria-label="${esc(name)}, ${esc(kind)}"><img src="./assets/landmark-${kind}.webp" alt="" draggable="false"><span class="town-map-name">${esc(name)}</span>${state.controls[h.id] ? `<i style="background:${color(state.controls[h.id])}"></i>` : ''}</button>`;
  }).join('');
  const bounds = boardBounds();
  const sortedUnits = state.units.slice().sort((a, b) => Number(a.id === selectedUnitId) - Number(b.id === selectedUnitId));
  return `<svg class="board board-world" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}" width="${bounds.w}" height="${bounds.h}" role="img" aria-label="Terrain and legal destinations on the Wildlands map" preserveAspectRatio="none"><defs>${definitions}</defs>${cells}${roads}${line}</svg><svg class="map-leaders" aria-hidden="true"></svg><div class="map-marker-layer">${towns}${drawMonsters()}${sortedUnits.map(drawCounter).join('')}</div>`;
}

function selectedDescription() {
  const h = getHex(selectedHex); const u = getUnit();
  const advanced=advancedDescription(state);if(advanced)return advanced;
  if (state.pendingCombat) return { title: state.pendingCombat.stage === 'ambush' ? 'Ambush decision' : state.pendingCombat.stage === 'advance' ? 'Advance after battle' : 'Settlement captured', text: `${kingdomName(actor())} must choose how to proceed.` };
  if (isBot()) return { title: `${kingdomName(actor())} is taking its turn`, text: botPaused ? 'Computer play paused. Resume when ready.' : 'Watch movement and battles, or pause the computer.' };
  if (state.phase === 'income-actions') return { title: 'Income phase', text: 'Resolve kingdom preparations, then collect income to begin activations.' };
  const a = selectedTargetAction();
  if (a?.type === 'attack') return { title: `Attack ${h?.settlement?.name || h?.id}`, text: `${u ? definition(u).name : 'Army'} attacks. Review the dice forecast in Council.` };
  if (a?.type === 'move' || a?.type === 'ship') { const option = (a.type === 'ship' ? shipOptions(state, u!.id) : moveOptions(state, u!.id)).find(o => o.hexId === a.toHex); return { title: `${a.type === 'ship' ? 'Ship to' : 'Move to'} ${h?.settlement?.name || h?.id}`, text: `${option?.cost ?? ''} movement${a.type === 'ship' ? ' · Transport' : ''}${option?.roadOnly ? ' · Road route' : ''}` }; }
  if (u) return { title: definition(u).name, text: u.activated ? 'This army has finished its activation.' : u.id === state.activeUnitId ? `${state.remainingMP} movement remaining · Choose a destination or finish activation.` : u.kingdom === state.currentKingdom ? 'Select a highlighted hex to move, or an enemy to attack.' : `${kingdomName(u.kingdom)} army · Select one of your ready armies.` };
  return { title: `${tableDate(state)} · ${kingdomName(state.currentKingdom)}`, text: 'Select a ready army. Green hexes mark movement; red hexes mark attacks.' };
}

function pendingPanel() {
  if(state.advanced?.pending)return advancedPanel();
  const pending = state.pendingCombat; if (!pending) return '';
  const target = getHex(pending.targetHex);
  let choices: string;
  if (pending.stage === 'ambush') choices = currentActions.filter(a => a.type === 'resolve-combat').map(a => `<button class="${a.type === 'resolve-combat' && a.ambush ? 'primary-button' : 'secondary-button'} full" ${actionAttr(a)}>${a.type === 'resolve-combat' && a.ambush ? `Use ${a.ambush} ambush` : 'Fight normally'}</button>`).join('');
  else if (pending.stage === 'advance') choices = currentActions.filter(a => a.type === 'advance').map(a => `<button class="${a.type === 'advance' && a.accept ? 'primary-button' : 'secondary-button'} full" ${actionAttr(a)}>${a.type === 'advance' && a.accept ? 'Advance into hex' : 'Remain in place'}</button>`).join('');
  else choices = currentActions.filter(a => a.type === 'settlement').map(a => `<button class="${a.type === 'settlement' && a.choice === 'control' ? 'primary-button' : 'secondary-button'} full" ${actionAttr(a)}>${a.type === 'settlement' && a.choice === 'control' ? 'Take control' : 'Raze settlement'}</button>`).join('');
  return `<div class="target-card combat"><div class="eyebrow">${esc(kingdomName(pending.decisionKingdom))} decision</div><h3 style="margin-top:9px">${esc(target?.settlement?.name || pending.targetHex)}</h3><p class="small-note">${pending.stage === 'ambush' ? 'An army can use Ambush before normal combat. Choose your resolution.' : pending.stage === 'advance' ? 'The victorious attacker may enter the defender’s hex.' : 'Choose what happens to this hostile settlement.'}</p><div class="action-list" style="margin-top:13px">${choices}</div></div>`;
}

function forecastPanel(f: CombatForecast) {
  return `<div class="target-card combat"><div class="eyebrow">Battle forecast</div><h3 style="margin-top:8px">${esc(getHex(f.targetHex)?.settlement?.name || f.targetHex)}</h3><div class="forecast-row"><div><strong>${f.attackerLight}<small style="font-size:10px">d6</small> + ${f.attackerHeavy}<small style="font-size:10px">d8</small></strong>Attacker</div><span class="vs">vs</span><div><strong>${f.defenderLight}<small style="font-size:10px">d6</small> + ${f.defenderHeavy}<small style="font-size:10px">d8</small></strong>Defender</div></div><div class="forecast-row"><div>${f.attackerExpected.toFixed(1)} expected hits</div><span></span><div>${f.defenderExpected.toFixed(1)} expected hits</div></div><p class="forecast-copy">${f.explanation.map(esc).join('<br>')}</p>${f.attackerCanAmbush || f.defenderCanAmbush ? '<p class="forecast-copy">Ambush may change this resolution. An estimate is not a guaranteed result.</p>' : ''}</div>`;
}

function councilPanel() {
  const u = getUnit(); const h = getHex(selectedHex);
  const current = kingdom(state.currentKingdom)!;
  if (u) {
    const d = definition(u), s = stats(u); const a = selectedTargetAction();
    const group=stackIds(state,u.id).map(id=>state.units.find(v=>v.id===id)!).filter(Boolean);
    const stackInfo=group.length>1?`<div class="stack-detail"><strong>${group.map(v=>esc(definition(v).name)).join(" + ")}</strong><p>Combined combat below. ${group.map(v=>`${esc(definition(v).name)}: ${state.advanced?.movement[v.id]??definition(v).movement} movement`).join(" · ")}</p><p>Separate a member in Army actions to activate it alone.</p></div>`:"";
    const f = a?.type === 'attack' ? combatForecast(state, u.id, a.targetHex) : null;
    const specials = currentActions.filter(a => ('unitId' in a && group.some(v=>v.id===a.unitId) && ['recover', 'regenerate', 'mine', 'pass', 'disband-siege','drop-hero','drop-army','join-stack','explore-lair','attack-monster'].includes(a.type)));
    return `<div class="unit-hero"><img src="${esc(art(d))}" alt="Illustration of ${esc(d.name)}"><div class="unit-title"><h3>${esc(d.name)}</h3><p>${esc(kingdomName(u.kingdom).toUpperCase())} · ${esc(u.weakened ? 'WEAKENED' : 'FULL STRENGTH')} · ${esc(getHex(u.hexId)?.settlement?.name || u.hexId)}</p></div></div>${pendingPanel()}${stackInfo}<div class="unit-stats"><div class="stat-box"><b>${s.light}</b><small>Light · d6</small></div><div class="stat-box"><b>${s.heavy}</b><small>Heavy · d8</small></div><div class="stat-box"><b>${u.id === state.activeUnitId ? state.remainingMP : s.move}</b><small>Movement</small></div></div><div class="trait-list">${[...d.abilities, ...d.characteristics].map(t => `<span>${esc(t)}</span>`).join('')}${u.activated ? '<span>Activated</span>' : '<span>Ready</span>'}</div>${f ? forecastPanel(f) : a && (a.type === 'move' || a.type === 'ship') ? `<div class="target-card"><div class="eyebrow">Destination</div><h3 style="margin-top:8px">${esc(h?.settlement?.name || h?.id)}</h3><p class="small-note">${esc(h?.terrain)}${h?.settlement ? ` · ${h.settlement.fortified ? 'Fortified settlement' : 'Settlement'}` : ''}${state.controls[h?.id || ''] ? ` · ${esc(kingdomName(state.controls[h!.id]))} control` : ''}</p></div>` : `<p class="small-note">${u.activated ? 'This army is exhausted until its next kingdom turn.' : u.kingdom === state.currentKingdom ? 'Select a green hex to move or a red hex to attack. A battle finishes this army’s activation.' : 'This army belongs to another kingdom.'}</p>`}<div class="panel-rule"></div><div class="side-title"><h3>Army actions</h3></div><div class="action-list">${specials.map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))}${a.type === 'recover' ? `<small>${d.recoveryCost} gold</small>` : ''}</button>`).join('')}${currentActions.some(a => a.type === 'activate' && a.unitId === u.id) ? `<button ${actionAttr({ type: 'activate', unitId: u.id })}>Activate this army ${icon('arrow')}</button>` : ''}${shipOptions(state, u.id).length ? `<button data-command="ship-mode">${shipMode ? 'Return to land movement' : 'Show sea transport'} ${icon('ship')}</button>` : ''}${!specials.length && u.activated ? '<p class="small-note">No actions remain for this army.</p>' : ''}</div>${destinationPicker(u)}${hexActionsPanel(h)}${lastBattlePanel()}`;
  }
  const ready = state.units.filter(u => u.kingdom === current.id && !u.activated);
  const roster = state.units.filter(u => u.kingdom === current.id);
  return `${pendingPanel()}<div class="objective"><div class="eyebrow">The campaign</div><p>${esc(objectiveText())}</p></div><div class="kingdom-strip">${state.kingdoms.map(k => `<div class="kingdom-card"><small><span class="faction-dot" style="background:${color(k.id)}"></span>${esc(k.name)}</small><b><span class="gold-icon">•</span>${k.gold} <em>gold</em></b></div>`).join('')}</div>${state.phase === 'income-actions' ? `<div class="guide"><strong>Prepare your kingdom</strong>Use any available income-phase actions below, then collect income to activate armies.</div><div class="action-list">${currentActions.filter(a => ['collect-income', 'suppress'].includes(a.type)).map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))} ${icon(a.type === 'collect-income' ? 'coin' : 'army')}</button>`).join('')}</div>` : '<div class="guide"><strong>Command one army at a time</strong>Select an army, choose its destination, then commit the move or battle. Finish its activation before selecting the next army.</div>'}${kingdomActionsPanel()}${monsterActionsPanel()}<div class="side-title"><h3>Your armies</h3><span>${ready.length} ready / ${roster.length}</span></div><div class="army-list">${roster.map(u => armyRow(u)).join('') || '<p class="empty-state">No armies remain in the field. Check Muster for available recruitment.</p>'}</div>${h ? `<div class="panel-rule"></div><div class="side-title"><h3>${esc(h.settlement?.name || h.id)}</h3><span>${esc(h.terrain)}</span></div><p class="small-note">${h.settlement ? `${h.settlement.city ? 'City' : 'Settlement'} · ${h.settlement.port ? 'Port · ' : ''}${h.settlement.fortified ? `Fortification ${h.settlement.fortified}` : 'Unfortified'}` : h.mine ? 'A source of gold when worked by a capable army.' : 'Unsettled terrain.'}</p>${hexActionsPanel(h)}` : ''}${lastBattlePanel()}`;
}

function kingdomActionsPanel() {
  const actions = currentActions.filter(a => a.type === 'transfer-gold');
  return actions.length ? `<div class="side-title" style="margin-top:19px"><h3>Allied support</h3></div><div class="action-list" style="margin-bottom:21px">${actions.map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))}<small>Pay 2 · Ally gains 1</small></button>`).join('')}</div>` : '';
}

function destinationPicker(u: Unit) {
  const actions = currentActions.filter(a => 'unitId' in a && a.unitId === u.id && (a.type === 'attack' || a.type === (shipMode ? 'ship' : 'move')));
  if (!actions.length) return '';
  return `<div class="panel-rule"></div><label class="scenario-select-label" for="destination-choice">Choose a destination</label><select class="scenario-select" id="destination-choice"><option value="">Select on map or choose here</option>${actions.map(a => { const id = a.type === 'attack' ? a.targetHex : a.type === 'move' || a.type === 'ship' ? a.toHex : ''; const h = getHex(id); return `<option value="${esc(id)}" ${selectedHex === id ? 'selected' : ''}>${a.type === 'attack' ? 'Attack' : a.type === 'ship' ? 'Ship' : 'Move'} · ${esc(h?.settlement?.name || id)} · ${esc(h?.terrain)}</option>`; }).join('')}</select>`;
}

function armyRow(u: Unit) { const d = definition(u), s = stats(u,false); return `<button class="army-item ${selectedUnitId === u.id ? 'selected' : ''}" data-select-unit="${esc(u.id)}"><img src="${esc(art(d))}" alt=""><span><span class="army-name">${esc(d.name)}</span><span class="army-sub">${s.light} Light · ${s.heavy} Heavy · ${esc(getHex(u.hexId)?.settlement?.name || u.hexId)}</span></span><span class="ready-dot ${u.activated ? 'used' : ''}" title="${u.activated ? 'Activated' : 'Ready'}"></span></button>`; }

function hexActionsPanel(h: Hex | undefined) {
  if (!h) return '';
  const actions = currentActions.filter(a => 'hexId' in a && a.hexId === h.id && a.type !== 'build');
  return actions.length ? `<div class="panel-rule"></div><div class="side-title"><h3>At this hex</h3></div><div class="action-list">${actions.map(a => `<button ${actionAttr(a)}>${esc(actionLabel(a))}</button>`).join('')}</div>` : '';
}

function diceRow(rolls:DiceRoll[]){return `<div class="combat-dice">${rolls.map((d,i)=>`<span class="die ${d.sides===8?'heavy':''} ${d.critical?'critical':d.success?'success':'fail'}" aria-label="Die ${i+1}, d${d.sides}, ${d.raw}${d.modified!==d.raw?', modified '+d.modified:''}, ${d.critical?'critical':d.success?'success':'miss'}" title="d${d.sides} · raw ${d.raw} · modified ${d.modified}">${d.raw}</span>`).join('')||'<span class="small-note">No dice</span>'}</div>${rolls.some(d=>d.confirmation!==undefined)?`<div class="critical-receipt">${rolls.flatMap((d,i)=>d.confirmation===undefined?[]:[`<p>Die ${i+1} confirms: ${(d.confirmations??[{sides:6,raw:d.confirmation}]).map(c=>`d${c.sides} ${c.raw}`).join(' → ')}</p>`]).join('')}</div>`:''}`;}


function lastBattlePanel() {
  const result = state.lastCombat; if (!result) return '';
  return `<div class="panel-rule"></div><div class="side-title"><h3>Last battle</h3><span>${esc(getHex(result.targetHex)?.settlement?.name || result.targetHex)}</span></div><p class="small-note">Attacker ${result.attackerSuccesses} successes · Defender ${result.defenderSuccesses} successes.<br>${result.attackerHits} hits to attacker · ${result.defenderHits} hits to defender.</p><div style="margin-top:12px"><div class="eyebrow">Attacker rolls</div>${diceRow(result.attackerRolls)}</div><div style="margin-top:12px"><div class="eyebrow">Defender rolls</div>${diceRow(result.defenderRolls)}</div><p class="small-note" style="margin-top:11px">${result.ambush ? `${esc(result.ambush)} ambush. ` : ''}${esc(result.result)} result. Green borders mark successes; gold marks criticals. Hover a die for modifiers.</p>`;
}

function musterPanel() {
  const k = kingdom(state.currentKingdom)!;
  const defs = state.unitDefinitions.filter(d => d.kingdom === k.id&&d.kind!=='hero');
  const buildActions = currentActions.filter((a): a is Extract<Action, { type: 'build' }> => a.type === 'build');
  return `${heroRecruitPanel()}<div class="side-title"><h3>Recruitment</h3><span>${k.gold} gold available</span></div><p class="small-note" style="margin-bottom:16px">A new army must enter at a legal friendly settlement. Recruitment uses the kingdom’s army supply.</p><div class="recruit-list">${defs.map(d => {
    const builds = buildActions.filter(a => a.defId === d.id);
    const count = state.units.filter(u => u.defId === d.id).length;
    return `<div class="recruit-card"><div class="recruit-top"><img src="${esc(art(d))}" alt=""><div><h3>${esc(d.name)}</h3><p>${d.light} Light · ${d.heavy} Heavy · Move ${d.movement}</p></div><span class="cost"><span class="gold-icon">•</span>${d.cost}</span></div><p class="supply-count">${Math.max(0, d.count - count)} / ${d.count} in supply</p><button data-recruit="${esc(d.id)}" ${builds.length ? '' : 'disabled'}>${builds.length ? recruitDefinition === d.id ? 'Choose an entry settlement' : `Recruit · ${builds.length} ${builds.length === 1 ? 'entry' : 'entries'}` : count >= d.count ? 'Supply exhausted' : k.gold < d.cost ? 'Insufficient gold' : 'No legal entry'}</button>${recruitDefinition === d.id ? `<div class="recruit-locations">${builds.map(a => `<button ${actionAttr(a)}>At ${esc(getHex(a.hexId)?.settlement?.name || a.hexId)} ${icon('arrow')}</button>`).join('')}</div>` : ''}</div>`;
  }).join('') || '<p class="empty-state">No army definitions are available for this kingdom.</p>'}</div>`;
}

function chroniclePanel() {
  const lines=state.companion?.events.length?getReplayEvents(state,deskViewer()).flatMap(e=>e.lines.length?e.lines:[e.summary]):state.log.filter(line=>deskViewer()==='night'||!/\bcoven\b/i.test(line)||/\bcoven discovered\b/i.test(line));
  return `<div class="side-title"><h3>Chronicle of war</h3><span>${lines.length} visible entries</span></div><p class="small-note" style="margin-bottom:12px">Events visible to your seat. Newest entries appear first. Open the Campaign desk to replay the board.</p><div class="chronicle">${lines.slice().reverse().slice(0,160).map((line,i)=>`<div class="log-entry"><span class="log-number">${String(lines.length-i).padStart(3,'0')}</span>${esc(line)}</div>`).join('')}</div>`;
}

function actionBar() {
  const description = selectedDescription(); const target = selectedTargetAction();
  const u = getUnit(), values = u ? stats(u) : null;
  const statCopy = values ? `<span class="action-stats">${values.light} Light · ${values.heavy} Heavy · ${u!.id === state.activeUnitId ? state.remainingMP : values.move} Move</span> ` : '';
  let actions = '';
  if (isBot()) actions = button('bot-toggle', botPaused ? 'Resume computer' : 'Pause computer', botPaused ? 'arrow' : 'pause', 'secondary-button');
  else if(state.advanced?.pending){const simple=currentActions.filter(a=>!['play-card','hero-power','study','sell-treasure'].includes(a.type));const study=currentActions.find(a=>a.type==='study'&&a.discipline==='spells'&&!a.discardId);if(study)actions+=`<button class="primary-button" ${actionAttr(study)}>Study spells</button>`;const proceed=simple.find(a=>['magic-pass','finish-study','finish-winter'].includes(a.type));if(proceed)actions+=`<button class="${study?'secondary-button':'primary-button'}" ${actionAttr(proceed)}>${esc(actionLabel(proceed))}</button>`;actions+=button('decisions',simple.length&&!proceed?'Choose outcome':'Cards & choices','book','secondary-button');}
  else if (state.pendingCombat) actions = button('decisions', 'Choose resolution', 'swords', 'primary-button');
  else if (target) actions = `<button class="primary-button" ${actionAttr(target)} ${stateReady() ? '' : 'disabled'}>${icon(target.type === 'attack' ? 'swords' : target.type === 'ship' ? 'ship' : 'move')}<span>${target.type === 'attack' ? 'Attack' : target.type === 'ship' ? 'Ship army' : 'Move army'}</span></button>`;
  else if (state.phase === 'income-actions') { const a = currentActions.find(a => a.type === 'collect-income'); if (a) actions = `<button class="primary-button" ${actionAttr(a)} ${stateReady() ? '' : 'disabled'}>${icon('coin')}<span>Collect income</span></button>`; }
  else if (state.phase === 'game-over') actions = button('victory', 'Campaign result', 'banner', 'primary-button');
  else {
    const pass = currentActions.find(a => a.type === 'pass' && a.unitId === state.activeUnitId);
    const ready = state.units.some(u => u.kingdom === state.currentKingdom && !u.activated);
    if (getUnit() && !getUnit()!.activated && getUnit()!.kingdom === state.currentKingdom) actions += '<button class="primary-button" disabled><span class="desktop-label">Choose destination</span><span class="phone-label">Choose hex</span></button>';
    else if (ready) actions += button('next-ready', 'Command army', 'army', 'primary-button');
    if (pass) actions += `<button class="secondary-button desktop-pass" ${actionAttr(pass)} ${stateReady() ? '' : 'disabled'}>Finish army</button>`;
    const end = currentActions.find(a => a.type === 'end-turn');
    actions += `<button class="${ready || pass ? 'secondary-button' : 'primary-button'}" ${actionAttr({ type: 'end-turn' })} ${end && stateReady() ? '' : 'disabled'}>${icon('arrow')}<span>End turn</span></button>`;
  }
  return `<div class="actionbar"><div class="action-context"><div class="phase-icon">${icon(target?.type === 'attack' ? 'swords' : 'banner')}</div><div><h3>${esc(description.title)}</h3><p>${statCopy}<span class="action-instruction">${esc(description.text)}</span></p></div></div><div class="action-buttons">${actions}${button('mobile-panel', 'Details', 'army', 'mobile-panel-toggle')}</div></div>`;
}

function setupModal() {
  const sc = config.scenario;
  const tag = sc.official ? 'VERIFIED BASIC SCENARIO' : packLabel ? 'IMPORTED CONTENT PACK' : 'BASIC GAME · TEACHING FIXTURE';
  return `<div class="modal-shade"><section class="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div class="setup-art"><div class="setup-art-copy"><div class="eyebrow">The war table</div><h2>Burning<br>Banners</h2><p>Rage of the Witch Queen<br>Armies march. Kingdoms rise. The Wildlands await.</p></div></div><div class="setup-panel"><div class="eyebrow">Set your banners</div><h2 id="setup-title">A kingdom to command</h2><p>A browser-local war table for pass-and-play humans and computer opponents.</p><label class="scenario-select-label" for="scenario-choice">Choose a campaign</label><select id="scenario-choice" class="scenario-select">${scenarioOptions.map(o => `<option value="${esc(o.id)}" ${selectedScenario === o.id && !packLabel ? 'selected' : ''}>${esc(o.title)}</option>`).join('')}${packLabel ? `<option value="imported" selected>${esc(config.scenario.name)} · imported</option>` : ''}</select><div class="setup-scenario"><div class="eyebrow">${tag}</div><h3>${esc(sc.name)}</h3><p>${esc(sc.notes?.[0] || 'A short campaign to learn movement, recruitment, terrain and battle.')}</p><div class="setup-tags"><span>${sc.kingdoms.length} kingdoms</span><span>${sc.endYear === sc.startYear ? `${sc.endSeason - sc.startSeason + 1} seasons` : `${sc.startYear}–${sc.endYear}`}</span><span>${profile==='advanced'?'Advanced preview':'Basic rules'}</span></div></div>${sc.kingdoms.map(k => `<div class="player-setting"><div class="player-label"><span class="faction-dot" style="background:${color(k.id)}"></span>${esc(k.name)} <span class="alliance-label">${k.side === 'invader' ? 'Invaders' : 'Resistance'}</span></div><div class="controller-switch" role="group" aria-label="${esc(k.name)} controller"><button data-controller="${esc(k.id)}:human" class="${controllers[k.id] !== 'ai' ? 'active' : ''}" aria-pressed="${controllers[k.id] !== 'ai'}">Human</button><button data-controller="${esc(k.id)}:ai" class="${controllers[k.id] === 'ai' ? 'active' : ''}" aria-pressed="${controllers[k.id] === 'ai'}">Computer</button></div></div>`).join('')}<label class="scenario-select-label" for="rules-profile">Rules</label><select class="scenario-select" id="rules-profile"><option value="advanced" ${profile==='advanced'?'selected':''}>Advanced preview · Heroes, Magic, Monsters & Study</option><option value="basic" ${profile==='basic'?'selected':''}>Basic · Armies, movement & combat</option></select>${profile==='advanced'?`<p class="preview-note">Playable preview: ${playableCounts.spell} Spells, ${playableCounts.treasure} Treasures, ${playableCounts.blessing} Blessings and all 38 Hero counters. ${186-Object.values(playableCounts).reduce((n,v)=>n+v,0)} card effects remain reference-only. Browse the Codex for coverage.</p><label class="preference-check"><input id="shared-hands" type="checkbox" ${sharedHands?'checked':''}>Share hands across allied kingdoms with the same controller</label>`:''}<label class="scenario-select-label" for="ai-level">Computer difficulty</label><select id="ai-level" class="scenario-select">${AI_DIFFICULTIES.map(d=>`<option value="${d.id}" ${setupDifficulty===d.id?'selected':''}>${d.name}</option>`).join('')}</select><details class="advanced-setting"><summary>More options</summary><label>Deterministic seed <input id="game-seed" type="number" min="1" max="4294967295" value="${esc(seed)}"></label><p class="small-note" style="margin-top:9px">Same setup and actions produce the same rolls. No reroll or undo of random outcomes.</p></details><div class="setup-buttons"><button class="primary-button" data-command="start">Begin campaign ${icon('arrow')}</button>${saved ? `<button class="secondary-button gold-button" data-command="continue">Continue saved campaign · ${esc(tableDate(saved))}</button>` : ''}<div style="display:flex;gap:8px"><button class="secondary-button" data-command="import">Load saved game</button><button class="secondary-button" data-command="import-pack">Import content pack</button></div></div><div class="setup-footnote">${sc.official ? 'Basic Game rules implementation. ' : 'The built-in openings are original teaching and sandbox setups, not complete official campaign transcriptions. '}Original generated artwork. Complete card and Monster catalogs are available. Official campaign setups need a verified content pack. <button data-command="credits" style="font-size:8px;border:0;padding:0;text-decoration:underline;color:#b7a679">Read the coverage notes</button>.</div></div></section></div>`;
}

function rulesModal() {
  return standardModal(state.advanced?'Rules of the war table':'The Basic Game', `<div class="reference-actions">${button('codex','Browse the Codex','book','secondary-button')}${button('preferences','Table preferences','settings','secondary-button')}</div><div class="status-banner">This table enforces the implemented Basic Game rules. Legal highlights and action buttons always use the same engine that resolves your turn. Consult the official rulebook for the full published game.</div>${state.advanced?`<h3>Advanced play</h3><p>Heroes join Army stacks, contribute dice and Powers, and can absorb hits. Recruit a random Hero in Muster. Open Hand to choose Magic cards, casters, targets and optional Tomes. Battle Magic follows attacker, defender Cantrips, then attacker Cantrips. Responses and individual hits pause for the correct player.</p><p>After each kingdom turn, every player studies. A Glyph allows up to three different disciplines; a Churn allows one. Treasures remain owned after play and can be retrieved through Study. In Winter, lairs reopen and excess Treasures are sold.</p><p>All 186 cards are cataloged. This playable preview uses the supported card subset; reference-only effects are marked in the Codex and excluded from decks. See Sources for the current coverage.</p>`:''}<h3>Command your kingdom</h3><p>Each kingdom takes its turn in scenario order. Prepare the kingdom during the income phase, collect income, then recruit and activate armies. A kingdom may end its turn when the engine allows it.</p><h3>Activate an army</h3><p>Select a ready counter, then choose a highlighted destination. Movement spends the army’s movement allowance; terrain, roads, characteristics and enemy presence determine its legal path. The table displays the complete route before you commit. An army that completes its activation is dimmed.</p><h3>Fight a battle</h3><p>Select an enemy or hostile settlement in legal attack range, review the forecast, and press Attack. Light combat uses six-sided dice; Heavy combat uses eight-sided dice. Terrain, fortification and army abilities affect the resolution. The displayed expected hits are estimates, not guaranteed outcomes.</p><p>The battle record shows every roll, critical confirmation and hit. Battles can weaken or eliminate armies. Ambush, advance and settlement choices appear when the rules require a decision. An attack finishes the activation after these choices.</p><h3>Recruit and recover</h3><p>Muster lists your kingdom’s army types, gold cost and remaining supply. Recruit only at the legal entry settlements shown. A weakened army can recover when its location and available gold permit it. Miners and other characteristics unlock specific contextual actions.</p><h3>Pass and play</h3><p>Set any kingdom to Human or Computer before starting. A handoff curtain appears between different human decision makers. Computer play uses legal actions and can be paused. This is a local shared table.</p><h3>Map controls</h3><p>Drag the board to pan. Scroll or use <span class="rule-key">+</span> / <span class="rule-key">−</span> to zoom. Arrow keys pan while the map is focused; <span class="rule-key">0</span> fits the board. Use Council’s army list to select counters with a keyboard. <span class="rule-key">Esc</span> closes a panel or clears a selection.</p><h3>Your campaign</h3><p>${esc(objectiveText())}</p><p class="muted">${esc(state.scenario.notes?.join(' ') || '')}</p><p><a href="${rulesURL}" target="_blank" rel="noopener">Official publisher page and rulebook downloads ↗</a></p>`);
}

function creditsModal() {
  return standardModal('Sources & implementation coverage', `<p><strong>Burning Banners: Rage of the Witch Queen</strong> is designed and illustrated by Christopher Moeller and published by Compass Games. This is an unofficial browser implementation.</p><table class="coverage-table"><thead><tr><th>Content</th><th>Available in this table</th></tr></thead><tbody><tr><td>Core turn sequence</td><td>Implemented Basic Game</td></tr><tr><td>Movement, combat, recruitment</td><td>Rules-enforced local engine</td></tr><tr><td>Map and army statistics</td><td>Source-calibrated content where verified</td></tr><tr><td>Built-in scenario</td><td>${esc(state.scenario.official ? 'Verified official Basic scenario' : 'Original fixture; opening/objectives created')}</td></tr><tr><td>Advanced heroes, spells, treasures</td><td>186-card catalog; playable preview with ${playableCounts.spell} Spells, ${playableCounts.treasure} Treasures, ${playableCounts.blessing} Blessings, all 38 Hero counters and ${playableCounts.hero} implemented Powers</td></tr><tr><td>Online multiplayer</td><td>Not included; local human/computer play</td></tr><tr><td>Illustrations</td><td>Original generated terrain and army art</td></tr></tbody></table><h3>Remaining coverage</h3><p>Reference-only effects include Enslave, area Strikes, elimination rescues, some Tome choices, extra attacks and Coven responses. They need complete decision flows. The 28 cataloged campaign names have no executable official setups. The four board inventories still need full terrain and join calibration.</p><h3>Rules sources</h3><p>Compass Games’ official Undying Rules v1.1 (September 2024) and published game components inform the rules and data. Scenario source: ${esc(state.scenario.source)}.</p><p>The generated art evokes the printed game’s ink and watercolor character. It is not Christopher Moeller’s original board or counter artwork. Hexes use explicit coordinates; image pixels are not used to infer game rules.</p><h3>Bring your own verified content</h3><p>Use the <a href="./content-editor.html" target="_blank">content calibration editor ↗</a> to inspect or prepare a reference pack, then import it from setup. Imported content supplies verified map and campaign data for either rules profile.</p><h3>Local saves</h3><p>Each action saves to this browser. Export a JSON copy to keep a portable backup; imported saves are validated before loading. Seeded random outcomes are part of the save.</p><p><a href="${rulesURL}" target="_blank" rel="noopener">Compass Games · official game and reference downloads ↗</a></p>`);
}

function galleryModal() {
  const groups = Array.from(new Set(state.unitDefinitions.map(d => d.kingdom)));
  return standardModal('Armies of the Wildlands', `<p style="margin-bottom:19px">Printed combat values are shown at full strength. The portrait art is original to this adaptation.</p>${groups.map(id => `<h3>${esc(kingdomName(id))}</h3><div class="gallery-grid">${state.unitDefinitions.filter(d => d.kingdom === id).map(d => `<article class="gallery-card"><img src="${esc(art(d))}" alt="${esc(d.name)} illustration"><div><h3>${esc(d.name)}</h3><p>${d.light} Light · ${d.heavy} Heavy · Move ${d.movement}<br>Cost ${d.cost} · Recovery ${d.recoveryCost}<br>${esc([...d.abilities, ...d.characteristics].join(', ') || 'No special characteristics')}</p></div></article>`).join('')}</div>`).join('')}`);
}

function victoryModal() {
  return standardModal('The campaign ends', `<div class="eyebrow">${esc(tableDate(state))}</div><h3 class="game-over-title" style="margin-top:17px">${state.winner ? `${state.winner === 'invader' ? 'Invaders' : 'Resistance'} prevail` : 'Campaign complete'}</h3><p>${esc(state.victoryReason || 'The campaign has reached its conclusion.')}</p><p style="margin-top:17px">Your final position remains on the table. Export a copy or start another campaign.</p><div style="display:flex;gap:9px;margin-top:23px"><button class="primary-button" data-command="setup">New campaign</button><button class="secondary-button" data-command="export">Export final position</button></div>`);
}

function endTurnModal() {
  const count = state.units.filter(u => u.kingdom === state.currentKingdom && !u.activated).length;
  return standardModal('End this kingdom’s turn?', `<p>${count} ${count === 1 ? 'army is' : 'armies are'} still ready. Ending the turn leaves their remaining actions unused.</p><div class="end-turn-choices"><button class="secondary-button" data-command="close-modal">Keep commanding</button><button class="primary-button" data-command="end-now">End turn</button></div>`);
}

function standardModal(title: string, body: string) { return `<div class="modal-shade"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-header"><h2 id="dialog-title">${esc(title)}</h2>${button('close-modal', 'Close dialog', 'close')}</div><div class="modal-body">${body}</div><div class="modal-footer"><button class="secondary-button" data-command="close-modal">Return to the table</button></div></section></div>`; }

function curtainHTML() { return `<div class="curtain" role="dialog" aria-modal="true" aria-labelledby="handoff-title"><div class="curtain-inner"><div class="curtain-seal">${icon('banner')}</div><div class="eyebrow">Pass the table</div><h2 id="handoff-title">${esc(kingdomName(curtain!))}</h2><p>It is your decision. Pass the device to the player commanding this kingdom, then reveal the table.</p>${state.companion&&ownedHumanSeats().some(id=>state.companion!.delegated[id])?`<button class="secondary-button full" data-command="desk-takeback">Take my delegated kingdoms back</button>`:''}<button class="primary-button" data-command="reveal">I’m ready · Reveal the map</button></div></div>`; }

function render() {
  if (gestureActive) suppressMapClickUntil = performance.now() + 250;
  gestureActive = false;
  const previousFocus = document.activeElement as HTMLElement | null;
  const focusID = previousFocus?.id;
  const focusData = previousFocus && ['command', 'controller', 'selectUnit', 'recruit'].map(key => [key, previousFocus.dataset[key]]).find(([, value]) => !!value);
  const mapFocused = previousFocus?.classList.contains('board-wrap');
  currentActions = legalActions(state);
  const k = kingdom(actor())!;
  root.dataset.motion=motionEnabled()?'on':'off';root.dataset.motionPreference=motion;
  root.innerHTML = `<main class="war-app"><header class="topbar"><div class="brand"><div class="brand-seal">${icon('banner')}</div><div><h1>Burning Banners</h1><small>RAGE OF THE WITCH QUEEN</small></div></div><div class="header-scenario"><strong>${esc(state.scenario.name)}</strong><span class="separator"></span><span>${state.advanced?'Advanced preview':'Basic Game'}</span></div><div class="header-actions"><span class="save-status ${saveError ? 'error' : ''}" role="status">${esc(saveStatus)}</span>${button('desk','Campaign desk','history','desk-trigger')}${button('rules', 'Rules', 'book')}${button('export', 'Save', 'download')}${button('setup', 'Campaign', 'settings')}</div></header><section class="workspace"><nav class="toolrail" aria-label="Table tools">${button('council', 'Council', 'map', `rail-button ${sideTab === 'council' ? 'active' : ''}`)}${button('muster', 'Muster', 'army', `rail-button ${sideTab === 'muster' ? 'active' : ''}`)}${state.advanced?button('hand','Hand','book',`rail-button ${sideTab==='hand'?'active':''}`):''}${button('chronicle', 'Chronicle', 'history', `rail-button ${sideTab === 'chronicle' ? 'active' : ''}`)}<div class="rail-spacer"></div>${button('codex','Codex','book','rail-button rail-secondary')}${button('preferences','Preferences','settings','rail-button rail-secondary')}${button('gallery', 'Armies', 'banner', 'rail-button rail-secondary')}${button('rules', 'Rules', 'book', 'rail-button rail-secondary')}${button('sound', sound ? 'Sound on' : 'Sound off', sound ? 'sound' : 'mute', `rail-button rail-secondary ${sound ? 'active' : ''}`)}${button('credits', 'Sources', 'info', 'rail-button rail-secondary')}</nav><div class="board-wrap" tabindex="0" role="application" aria-label="War map. Drag to pan, scroll or pinch to zoom. Arrow keys pan, N finds the next ready army."><div class="board-heading"><span>${esc(state.scenario.official ? 'THE WILDLANDS' : 'THE WILDLANDS · ORIGINAL SETUP')}</span><h2>${esc(state.scenario.name)}</h2></div><div class="board-legend"><span><i class="legend-dot"></i>Legal movement</span><span><i class="legend-dot enemy"></i>Legal attack</span></div>${renderMap()}<div class="board-compass"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2 29 20 46 24 29 29 24 46 19 29 2 24 19 20Z"/><circle cx="24" cy="24" r="8" fill="#d6cda8"/><path d="M24 6 27 22 24 24 21 22Z"/></svg>NORTH</div><div class="map-nav">${button('next-ready', 'Next army', 'army')}${button('focus-selected', 'Focus', 'fit', '', !getUnit())}</div><div class="map-controls">${button('zoom-out', 'Zoom out', 'minus')}<span class="zoom-level">100%</span>${button('zoom-in', 'Zoom in', 'plus')}${button('fit', 'Overview', 'fit')}</div></div><aside data-panel="${sideTab}" class="sidebar ${mobileOpen ? 'mobile-open' : ''}" aria-label="Kingdom and army details"><div class="turn-card"><div class="eyebrow"><span>${esc(tableDate(state))}</span><span>${isBot() ? '<span class="bot-indicator">COMPUTER</span>' : 'YOUR COMMAND'}</span></div><h2><span class="faction-dot" style="background:${color(k.id)}"></span>${esc(k.name)}</h2><div class="turn-meta"><span><span class="gold-icon">•</span><strong>${k.gold}</strong> gold</span><span>Income +${k.income}</span><span class="phase">${state.advanced?.pending?advancedDescription(state)?.title:state.pendingCombat ? 'Battle decision' : state.phase === 'income-actions' ? 'Income phase' : state.phase === 'game-over' ? 'Campaign ends' : 'Activations'}</span></div></div>${button('mobile-panel', `Close ${sideTab[0].toUpperCase()+sideTab.slice(1)}`,  'close', 'close-panel')}<div class="side-tabs" role="tablist" aria-label="Kingdom panels">${button('council', 'Council', 'map', sideTab === 'council' ? 'active' : '')}${button('muster', 'Muster', 'army', sideTab === 'muster' ? 'active' : '')}${state.advanced?button('hand','Hand','book',sideTab==='hand'?'active':''):''}${button('chronicle', 'Chronicle', 'history', sideTab === 'chronicle' ? 'active' : '')}</div><div class="side-scroll">${sideTab === 'council' ? councilPanel() : sideTab === 'muster' ? musterPanel() : sideTab==='hand'?handPanel():chroniclePanel()}</div></aside></section>${actionBar()}</main>${modal === 'setup' ? setupModal() : modal === 'rules' ? rulesModal() : modal === 'credits' ? creditsModal() : modal === 'gallery' ? galleryModal() : modal === 'victory' ? victoryModal() : modal === 'end-confirm' ? endTurnModal() : modal==='codex'?codexModal():modal==='preferences'?preferencesModal():modal==='save'?saveModal():modal==='desk'?deskModal():modal==='regenerate-confirm'?regenerationModal():''}${curtain ? curtainHTML() : ''}`;
  if(state.companion){const b=getBriefing(state,deskViewer()),trigger=root.querySelector('.desk-trigger');trigger?.classList.toggle('has-unread',!!(b.unreadCount||b.unreadMessages));trigger?.setAttribute('title',`${b.unreadCount} new actions · ${b.unreadMessages} new messages`);}
  wireBoard();
  if (!stateReady()) root.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach(b => { b.disabled = true; });
  // A fresh map must have the current transform before its first interaction.
  // Keep gesture updates coalesced, but never expose the newly mounted map at
  // its untransformed position while waiting for an animation frame.
  if (cameraFrame) { cancelAnimationFrame(cameraFrame); cameraFrame = 0; }
  if (!camera) fitBoard(true);
  if (cameraFrame) { cancelAnimationFrame(cameraFrame); cameraFrame = 0; }
  paintCamera();
  requestAnimationFrame(() => {
    let destination: HTMLElement | SVGSVGElement | null = null;
    if (focusID) destination = document.getElementById(focusID);
    if (!destination && focusData) destination = Array.from(root.querySelectorAll<HTMLElement>('button')).find(b => b.dataset[focusData[0]!] === focusData[1]) || null;
    if (!destination && mapFocused) destination = root.querySelector<HTMLElement>('.board-wrap');
    if (!destination && (modal || curtain)) destination = root.querySelector<HTMLElement>('.curtain button, .modal select, .modal button');
    destination?.focus({ preventScroll: true });
  });
}

function selectUnit(id: string, focus = false) {
  const unit = state.units.find(u => u.id === id); if (!unit) return;
  selectedUnitId = id; selectedHex = null; shipMode = false; sideTab = 'council';
  if (mobileLayout()) mobileOpen = false;
  render(); if (focus) focusUnit(unit);
}

function selectHex(id: string) {
  const occupier = state.units.find(u => u.hexId === id);
  const unit = getUnit();
  const attack = unit && currentActions.some(a => a.type === 'attack' && a.unitId === unit.id && a.targetHex === id);
  if (occupier && !attack) { selectUnit(occupier.id); return; }
  selectedHex = id;
  if (attack) sideTab = 'council';
  render();
}

function wireBoard() {
  const wrap = root.querySelector<HTMLElement>('.board-wrap')!;
  const pointers = new Map<number, { x: number; y: number }>();
  let lastX = 0, lastY = 0, downX = 0, downY = 0;
  let moved = false;
  let downTarget: Element | null = null;
  let pinch: { distance: number; width: number; anchor: { x: number; y: number } } | null = null;
  const position = (x: number, y: number) => { const v = viewport(); return { x: camera!.x + (x - v.left) / v.width * camera!.w, y: camera!.y + (y - v.top) / v.height * camera!.h }; };
  const measurePinch = () => {
    const pair = Array.from(pointers.values()).slice(0, 2);
    return { distance: Math.max(1, Math.hypot(pair[1].x - pair[0].x, pair[1].y - pair[0].y)), x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
  };
  wrap.addEventListener('wheel', event => {
    if ((event.target as Element).closest('.map-controls') || !camera) return;
    event.preventDefault();
    wrap.focus({preventScroll:true});
    const v = viewport();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? v.height : 1);
    const factor = Math.exp(Math.max(-180, Math.min(180, delta)) * .0017);
    zoom(factor, position(event.clientX, event.clientY), { x: event.clientX - v.left, y: event.clientY - v.top });
  }, { passive: false });
  wrap.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !camera || (event.target as Element).closest('.map-controls, .map-nav')) return;
    event.preventDefault();
    wrap.focus({preventScroll:true});
    if (!pointers.size) { moved = false; downTarget = event.target as Element; downX = lastX = event.clientX; downY = lastY = event.clientY; }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    gestureActive = true;
    wrap.setPointerCapture(event.pointerId);
    if (pointers.size === 2) { const p = measurePinch(); pinch = { distance: p.distance, width: camera.w, anchor: position(p.x, p.y) }; moved = true; }
  });
  wrap.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId) || !camera) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && pinch) {
      const p = measurePinch(), v = viewport();
      zoom(pinch.width / camera.w * pinch.distance / p.distance, pinch.anchor, { x: p.x - v.left, y: p.y - v.top });
      wrap.classList.add('dragging'); moved = true; return;
    }
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) moved = true;
    if (moved) {
      const v = viewport();
      camera.x -= (event.clientX - lastX) / v.width * camera.w;
      camera.y -= (event.clientY - lastY) / v.height * camera.h;
      clampCamera(); updateCamera(); wrap.classList.add('dragging');
    }
    lastX = event.clientX; lastY = event.clientY;
  });
  const release = (event: PointerEvent, cancelled = false) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId);
    if (pointers.size >= 2 && camera) { const p = measurePinch(); pinch = { distance: p.distance, width: camera.w, anchor: position(p.x, p.y) }; moved = true; return; }
    if (pointers.size) { const other = Array.from(pointers.values())[0]; lastX = downX = other.x; lastY = downY = other.y; pinch = null; moved = true; return; }
    gestureActive = false; wrap.classList.remove('dragging'); pinch = null;
    suppressMapClickUntil = performance.now() + 250;
    if (moved || cancelled || !downTarget) return;
    const counter = downTarget.closest<HTMLElement>('[data-map-unit]');
    const town = downTarget.closest<HTMLElement>('[data-map-hex]');
    const cell = downTarget.closest<SVGElement>('[data-hex]');
    if (counter) selectMapUnit(counter.dataset.mapUnit!);
    else if (town) selectHex(town.dataset.mapHex!);
    else if (cell) selectHex(cell.dataset.hex!);
  };
  wrap.addEventListener('pointerup', event => release(event));
  wrap.addEventListener('pointercancel', event => release(event, true));
  wrap.addEventListener('lostpointercapture', event => { if (pointers.has(event.pointerId)) release(event, true); });
  wrap.addEventListener('keydown', event => {
    const cell=(event.target as Element).closest<SVGElement>('[data-hex]');
    if(cell&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectHex(cell.dataset.hex!);return;}
    if (!camera || (event.target as Element).closest('.map-controls, .map-nav, button')) return;
    const amount = camera.w * .08;
    if (event.key === '+' || event.key === '=') zoom(.85);
    else if (event.key === '-') zoom(1 / .85);
    else if (event.key === '0') fitBoard();
    else if (event.key.toLowerCase() === 'n') nextReadyUnit();
    else if (event.key === 'ArrowLeft') camera.x -= amount;
    else if (event.key === 'ArrowRight') camera.x += amount;
    else if (event.key === 'ArrowUp') camera.y -= amount;
    else if (event.key === 'ArrowDown') camera.y += amount;
    else return;
    event.preventDefault(); clampCamera(); updateCamera();
  });
}

function selectMapUnit(id: string) {
  const u = state.units.find(u => u.id === id), selected = getUnit();
  if (u && selected && u.kingdom !== selected.kingdom && currentActions.some(a => a.type === 'attack' && a.unitId === selected.id && a.targetHex === u.hexId)) selectHex(u.hexId);
  else selectUnit(id);
}

function nextReadyUnit() {
  const available = state.units.filter(u => u.kingdom === state.currentKingdom && !u.activated);
  if (!available.length) { notify('No ready armies remain for this kingdom.'); return; }
  const current = available.findIndex(u => u.id === selectedUnitId);
  readyIndex = current < 0 ? 0 : (current + 1) % available.length;
  selectUnit(available[readyIndex].id, true);
}

function startGame() {
  const input = root.querySelector<HTMLInputElement>('#game-seed'); if (input) seed = input.value;
  const parsedSeed = Number(seed);
  if (!Number.isInteger(parsedSeed) || parsedSeed < 1 || parsedSeed > 4294967295) { notify('Use a whole-number seed between 1 and 4294967295.'); return; }
  try {
    const grouped:Record<string,string[]>={};for(const k of config.scenario.kingdoms){const key=sharedHands?`${k.side}-${controllers[k.id]}`:k.id;(grouped[key]??=[]).push(k.id);}
    const players=Object.entries(grouped).map(([key,kingdoms],i)=>({id:`player-${i+1}`,name:kingdoms.length===1?kingdomName(kingdoms[0]):`${controllers[kingdoms[0]]==='ai'?'Computer':'Human'} ${key.startsWith('invader')?'Invaders':'Resistance'}`,kingdoms}));
    state = createGame({ ...config, controllers, seed: parsedSeed,profile,players });
    state.companion=createCompanion(state,Object.fromEntries(state.kingdoms.map(k=>[k.id,setupDifficulty])));
    gameHasBegun = true;
    selectedUnitId = null; selectedHex = null; modal = null; camera = null; botPaused = false; botSteps = 0; botTurn = -1; curtain = null; sideTab = 'council'; mobileOpen = false;
    render(); void persist(); scheduleBot();
  } catch (error) { notify(error instanceof Error ? error.message : 'Unable to create that campaign.'); }
}

function exportSave() {
  const blob = new Blob([exportGame(state)], { type: 'application/json' });
  if (blob.size > 20_000_000) { notify('Save exceeds 20 MB. Reduce embedded artwork in the content pack before creating a new campaign.'); return; }
  if(exportURL)URL.revokeObjectURL(exportURL);
  exportURL=URL.createObjectURL(blob);modalParent=null;modal='save';render();
}
function saveModal(){return standardModal('Keep this campaign',`<p>Your position is saved on this device. Download a backup to continue in another browser or keep a copy.</p><p class="small-note">The backup includes the current decision, hands, decks, dice state, and Chronicle.</p><a class="primary-button full save-download" href="${esc(exportURL||'')}" download="burning-banners-${state.year}-${seasons[state.season].toLowerCase()}.json">Download campaign backup</a><button class="secondary-button full" style="margin-top:12px" data-command="copy-save">Copy backup text</button>`);}

async function copyBackup(){
  const text=exportGame(state);
  try {
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);notify('Backup text copied. Paste into a .json file to keep it.');return;}
    let field=root.querySelector<HTMLTextAreaElement>('#backup-copy');
    if(!field){field=document.createElement('textarea');field.id='backup-copy';field.className='backup-copy';field.readOnly=true;field.setAttribute('aria-label','Campaign backup text');root.querySelector('.modal-body')?.append(field);}
    field.value=text;field.focus();field.select();
    notify(document.execCommand('copy')?'Backup text copied. Paste into a .json file to keep it.':'Backup text selected. Copy it and save as a .json file.');
  } catch {notify('Clipboard unavailable. Use Download campaign backup.');}
}

function importFile(pack = false) {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; if (!file) return;
    if (file.size > 20_000_000) { notify('Choose a JSON file smaller than 20 MB.'); return; }
    try {
      const text = await file.text();
      if (!pack) {
        const imported = importGame(text); const errors = validateState(imported);
        if (errors.length) throw new Error(errors[0]);
        state = imported; ensureCompanion(); saved = state; gameHasBegun = true; modal = null; camera = null; selectedUnitId = null; selectedHex = null; botPaused = false; curtain = null;
        followHumanViewer();returnBriefing();render(); void persist(); scheduleBot(); notify('Campaign loaded.');
      } else {
        const validation = await import('./content-validation.js');
        const raw: unknown = JSON.parse(text);
        const candidate = validation.validateContentPack(raw);
        config = { hexes: candidate.hexes, unitDefinitions: candidate.unitDefinitions, scenario: { ...candidate.scenario, official: false }, controllers: {} };
        createGame(config); packLabel = file.name; controllers = Object.fromEntries(config.scenario.kingdoms.map((k, i) => [k.id, i ? 'ai' : 'human'])); modal = 'setup'; render(); notify('Content pack validated. Choose controllers and begin when ready.');
      }
    } catch (error) { notify(`Import failed: ${error instanceof Error ? error.message : 'The file is not a valid game JSON.'}`); }
  });
  input.click();
}

root.addEventListener('click', event => {
  const cell=(event.target as Element).closest<SVGElement>('[data-hex]');
  if(cell){if(event.detail&&performance.now()<suppressMapClickUntil)return;selectHex(cell.dataset.hex!);return;}
  const element = (event.target as Element).closest<HTMLElement>('button'); if (!element || element.hasAttribute('disabled')) return;
  if (element.dataset.mapUnit || element.dataset.mapHex) { if (event.detail && performance.now() < suppressMapClickUntil) return; if (element.dataset.mapUnit) selectMapUnit(element.dataset.mapUnit); else selectHex(element.dataset.mapHex!); return; }
  if (element.dataset.action) { try { const action = JSON.parse(element.dataset.action) as Action; if (action.type === 'end-turn' && stateReady() && state.units.some(u => u.kingdom === state.currentKingdom && !u.activated)) { modal = 'end-confirm'; modalParent = null; render(); return; } perform(action); } catch { notify('Invalid action.'); } return; }
  if (element.dataset.selectUnit) { selectUnit(element.dataset.selectUnit, true); return; }
  if (element.dataset.recruit) { recruitDefinition = recruitDefinition === element.dataset.recruit ? null : element.dataset.recruit; render(); return; }
  if (element.dataset.controller) { const [id, control] = element.dataset.controller.split(':'); const input = root.querySelector<HTMLInputElement>('#game-seed'); if (input) seed = input.value; controllers[id] = control as Controller; render(); return; }
  if(element.dataset.deskReclaim){ensureCompanion();const members=playerFor(state,element.dataset.deskReclaim)?.kingdoms??[element.dataset.deskReclaim];for(const id of members.filter(id=>state.companion!.originalControllers[id]==='human'))state=setDelegation(state,id,false);if(botTimer)clearTimeout(botTimer);botSteps=0;render();void persist();scheduleBot();notify('Human control restored for the returning seat.');return;}
  if(element.dataset.deskTab){deskTab=element.dataset.deskTab as typeof deskTab;replayPlaying=false;render();return;}
  if(element.dataset.deskPing){const h=getHex(element.dataset.deskPing);if(h){selectedHex=h.id;modal=null;mobileOpen=false;const p=center(h),v=viewport();camera={x:p.x-v.width/2,y:p.y-v.height/2,w:v.width,h:v.height};clampCamera();render();}return;}
  if(element.dataset.codexSection){codexSection=element.dataset.codexSection;render();return;}
  const card=element.closest<HTMLElement>('[data-card]');if(card){selectedCardId=card.dataset.card!;selectedMagicIndex=0;sideTab='hand';mobileOpen=true;render();return;}
  const command = element.dataset.command;
  if(command==='regenerate-confirm'){const request=regenerateRequest;regenerateRequest=null;modal=null;if(request)perform(request,false,true);return;}
  if(command==='desk'){ensureCompanion();deskTab='briefing';modalParent=null;modal='desk';render();return;}
  if(command?.startsWith('desk-')){
    ensureCompanion();const viewer=deskViewer();
    try{
      if(command==='desk-read'){state=markRead(state,viewer);notify('Briefing and messages marked as read.');}
      else if(command==='desk-replay-unread'){deskTab='replay';replaySeq=getBriefing(state,viewer).events[0]?.seq??getReplayEvents(state,viewer)[0]?.seq??null;}
      else if(command==='desk-overview'){replayOverview=!replayOverview;}
      else if(command==='desk-prev'||command==='desk-next'){replayPlaying=false;advanceReplay(command==='desk-prev'?-1:1);}
      else if(command==='desk-play'){replayPlaying=!replayPlaying;if(replayPlaying&&replaySeq===getReplayEvents(state,viewer).at(-1)?.seq)replaySeq=getReplayEvents(state,viewer)[0]?.seq??null;scheduleReplay();notify(replayPlaying?'Replay playing.':'Replay paused.');}
      else if(command==='desk-delegate'||command==='desk-takeback'){for(const id of ownedHumanSeats())state=setDelegation(state,id,command==='desk-delegate');if(botTimer)clearTimeout(botTimer);botPaused=false;botSteps=0;if(command==='desk-delegate')modal=null;notify(command==='desk-delegate'?'Your commander will act until you take control back.':'You have control. Committed actions remain in the briefing.');}
      else if(command==='desk-pause')botPaused=!botPaused;
      else if(command==='desk-send'){
        const template=root.querySelector<HTMLSelectElement>('#desk-template')?.value;
        const channel=root.querySelector<HTMLSelectElement>('#desk-channel')?.value==='table'?'table':'alliance';
        const attach=root.querySelector<HTMLInputElement>('#desk-attach-ping')?.checked;
        state=sendCampaignMessage(state,viewer,root.querySelector<HTMLTextAreaElement>('#desk-message')?.value??'',{channel,...(template?{template:template as MessageTemplate}:{}),...(attach&& (selectedHex||getUnit()?.hexId)?{hexId:selectedHex??getUnit()!.hexId}:{})});notify('Message saved to the campaign.');
      }else if(command==='desk-note'){state=savePrivateNote(state,viewer,root.querySelector<HTMLTextAreaElement>('#desk-note-text')?.value??'');notify('Private note saved.');}
      render();void persist();scheduleBot();
    }catch(error){notify(error instanceof Error?error.message:'That desk action is unavailable.');}
    return;
  }
  if(command==='magic-focus'){const a=cardActions(selectedCardId)[selectedMagicIndex];const u=state.units.find(u=>u.id===a?.targetId||u.id===a?.casterId),m=state.advanced?.monsters.find(m=>m.id===a?.targetId);const h=getHex(a?.targetHex||u?.hexId||m?.hexId||a?.targetId||null);if(h){const v=viewport(),p=center(h),scale=1.1,w=v.width/scale,area=visibleMapArea();camera={x:p.x-(area.left+area.right)/2/scale,y:p.y-(area.top+area.bottom)/2/scale,w,h:w*v.height/v.width};selectedHex=h.id;mobileOpen=false;clampCamera();render();}return;}
  if(command==='play-selected'){const actions=cardActions(selectedCardId);const action=actions[selectedMagicIndex];if(action)perform(action);return;}
  if (command === 'zoom-in' || command === 'zoom-out') {
    zoom(command === 'zoom-in' ? .8 : 1.25);
    if (cameraFrame) { cancelAnimationFrame(cameraFrame); cameraFrame = 0; }
    paintCamera();
    return;
  }
  if (command === 'fit') { fitBoard(); return; }
  if (command === 'next-ready') { nextReadyUnit(); return; }
  if (command === 'focus-selected') { const u = getUnit(); if (u) focusUnit(u); return; }
  if (command === 'start') { startGame(); return; }
  if (command === 'end-now') { modal = null; perform({type:'end-turn'}); return; }
  if (command === 'export') { exportSave(); return; }
  if(command==='copy-save'){void copyBackup();return;}
  if (command === 'import' || command === 'import-pack') { importFile(command === 'import-pack'); return; }
  if (command === 'continue' && saved) { state = saved; ensureCompanion();modal = null; camera = null; botPaused = false;followHumanViewer();returnBriefing(); }
  else if (command === 'setup') { modal = 'setup'; controllers = Object.fromEntries(config.scenario.kingdoms.map(k => [k.id, controllers[k.id] || 'human'])); }
  else if (command === 'rules' || command === 'credits' || command === 'gallery' || command === 'victory' || command==='codex' || command==='preferences') { modalParent = modal === 'setup' ? 'setup' : null; modal = command; }
  else if (command === 'close-modal') { modal = modalParent; modalParent = null; }
  else if (command === 'reveal') {curtain = null;followHumanViewer();returnBriefing();void persist();}
  else if (command === 'council' || command === 'muster' || command === 'chronicle' || command==='hand') { sideTab = command; mobileOpen = true; }
  else if (command === 'mobile-panel') mobileOpen = !mobileOpen;
  else if (command === 'decisions') { sideTab = state.advanced?.pending?'hand':'council'; mobileOpen = true; }
  else if (command === 'sound') { sound = !sound;savePreferences(); if (sound) playSound('sound'); }
  else if (command === 'ship-mode') { shipMode = !shipMode; selectedHex = null; }
  else if (command === 'bot-toggle') { botPaused = !botPaused; if (!botPaused) botSteps = 0; }
  render();
  if ((command === 'mobile-panel' || command === 'decisions' || command === 'council') && mobileOpen) { const u = getUnit(); if (u) focusUnit(u); }
  scheduleBot();
});

root.addEventListener('change', event => {
  const setting=event.target as HTMLInputElement;
  if(setting.id==='ai-level'){setupDifficulty=setting.value as AIDifficulty;return;}
  if(setting.dataset.deskDifficulty){state=updateCompanionDifficulty(state,setting.dataset.deskDifficulty,setting.value as AIDifficulty);void persist();render();return;}
  if(setting.id==='desk-auto-brief'){ensureCompanion();state.companion!.briefingOnReturn=setting.checked;void persist();return;}
  if(setting.id==='desk-replay'){replaySeq=Number(setting.value);replayPlaying=false;render();return;}
  if(setting.id==='desk-edge'){replayEdge=setting.value==='before'?'before':'after';render();return;}
if(setting.id==='rules-profile'){profile=setting.value as typeof profile;render();return;}if(setting.id==='shared-hands'){sharedHands=setting.checked;return;}if(setting.id==='motion-choice'){motion=setting.value as typeof motion;savePreferences();render();return;}if(setting.id==='sound-choice'){sound=setting.checked;savePreferences();return;}if(setting.id==='magic-target'){selectedMagicIndex=Number(setting.value);render();return;}
  if(setting.dataset.magicField){const field=setting.dataset.magicField as MagicField;const choices=cardActions(selectedCardId),selected=choices[selectedMagicIndex]??choices[0];const before=magicFields.slice(0,magicFields.indexOf(field));const next=choices.find(a=>before.every(k=>magicFieldValue(a,k)===magicFieldValue(selected,k))&&magicFieldValue(a,field)===setting.value);if(next)selectedMagicIndex=choices.indexOf(next);render();return;}
  if(setting.dataset.studyChoice){studySelection[setting.dataset.studyChoice]=Number(setting.value);render();return;}
  const element = event.target as HTMLSelectElement;
  if (element.id === 'destination-choice') { selectedHex = element.value || null; render(); return; }
  if (element.id !== 'scenario-choice' || element.value === 'imported') return;
  const option = scenarioOptions.find(o => o.id === element.value); if (!option) return;
  const input = root.querySelector<HTMLInputElement>('#game-seed'); if (input) seed = input.value;
  selectedScenario = option.id; config = structuredClone(option.config); packLabel = null;
  controllers = Object.fromEntries(config.scenario.kingdoms.map((k, i) => [k.id, i ? 'ai' : 'human']));
  render();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Tab' && (modal || curtain)) {
    const dialog = root.querySelector('.curtain') || root.querySelector('.modal');
    const elements = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, summary, textarea') || []).filter(el => !el.closest('details:not([open])') || el.tagName === 'SUMMARY');
    const first = elements[0], last = elements[elements.length - 1];
    if (first && last && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (event.key !== 'Escape') return;
  if (curtain) return;
  if (modal && modal !== 'setup') { modal = modalParent; modalParent = null; }
  else if (mobileOpen) mobileOpen = false;
  else { selectedUnitId = null; selectedHex = null; }
  render(); scheduleBot();
});
window.addEventListener('resize', () => {
  const wrap = root.querySelector<HTMLElement>('.board-wrap');
  if (!camera || !wrap) return;
  const centerX = camera.x + camera.w / 2, centerY = camera.y + camera.h / 2;
  const view = viewport(), bounds = boardBounds();
  const fullWidth = Math.max(bounds.w, bounds.h * view.width / view.height);
  camera.w = Math.min(fullWidth * 1.08, Math.max(view.width / 1.7, camera.w));
  camera.h = camera.w * view.height / view.width;
  camera.x = centerX - camera.w / 2;
  camera.y = centerY - camera.h / 2;
  clampCamera(); updateCamera();
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&gameHasBegun&&!modal&&!curtain){returnBriefing();if(modal){render();}scheduleBot();}});
window.addEventListener('beforeunload', () => { if (!gameHasBegun) return; try { localStorage.setItem('burning-banners-backup', JSON.stringify({ savedAt: saveClock = Math.max(Date.now(), saveClock + 1), stateText: exportGame(state) })); } catch { /* IndexedDB copy may still be available. */ } });

declare global {
  interface Window {
    __GAME_DEBUG__: {
      getState(): GameState;
      getCamera(): { x: number; y: number; width: number; height: number; scale: number; gestureActive: boolean } | null;
      legalActions(): Action[];
      exportSave(): string;
      getAIAction(): Action | null;
      loadScenario(id: string, seed?: number, controllers?: Record<string, Controller>): void;
    };
  }
}
window.__GAME_DEBUG__ = Object.freeze({
  getState: () => structuredClone(state),
  getCamera: () => camera ? { x: camera.x, y: camera.y, width: camera.w, height: camera.h, scale: viewport().width / camera.w, gestureActive } : null,
  legalActions: () => structuredClone(legalActions(state)),
  exportSave: () => exportGame(state),
  getAIAction: () => structuredClone(aiChoice()),
  loadScenario: (id: string, scenarioSeed = 20261004, scenarioControllers?: Record<string, Controller>) => {
    const choice = scenarioOptions.find(s => s.id === id); if (!choice) throw new Error('Unknown scenario fixture.');
    if (botTimer) clearTimeout(botTimer);
    config = structuredClone(choice.config); selectedScenario = choice.id; packLabel = null;
    controllers = scenarioControllers || Object.fromEntries(config.scenario.kingdoms.map(k => [k.id, 'human']));
    state = createGame({ ...config, seed: scenarioSeed, controllers }); modal = null; modalParent = null; curtain = null;
    selectedHex = null; selectedUnitId = null; camera = null; botPaused = true; mobileOpen = false; sideTab = 'council'; render();
  },
});

render();
void loadSave();

function cardActions(id:string|null){return currentActions.filter((a):a is Extract<Action,{type:'play-card'|'hero-power'}>=>['play-card','hero-power'].includes(a.type)&&'cardId'in a&&a.cardId===id&&(!state.advanced||a.playerId===playerFor(state,actor())?.id));}
function magicOptionLabel(a:Extract<Action,{type:'play-card'|'hero-power'}>){const u=state.units.find(u=>u.id===a.targetId),m=state.advanced?.monsters.find(m=>m.id===a.targetId),caster=state.units.find(u=>u.id===a.casterId);const target=u?`${definition(u).name} · ${getHex(u.hexId)?.settlement?.name||u.hexId}`:m?monsterById(m.defId)?.name:getHex(a.targetId??'')?.settlement?.name||getHex(a.targetId??'')?.id||state.advanced?.players.find(p=>p.id===a.targetId)?.name||'';const c=cardById(a.cardId);const choice=a.choice?c?.effect.choices?.[Number(a.choice)]:null;const choiceLabel=choice?(choice.light?`${choice.light>0?'+':''}${choice.light} Light`:choice.heavy?`${choice.heavy>0?'+':''}${choice.heavy} Heavy`:Object.keys(choice)[0]):a.choice?`Option ${a.choice}`:'';return [caster?definition(caster).name:'',target,a.targetHex?`to ${getHex(a.targetHex)?.settlement?.name||a.targetHex}`:'',choiceLabel,a.type==='play-card'&&a.tomeId?`with ${cardById(a.tomeId)?.name}`:''].filter(Boolean).join(' · ');}
type MagicAction=Extract<Action,{type:'play-card'|'hero-power'}>;
type MagicField='casterId'|'targetId'|'targetHex'|'choice'|'tomeId'|'costCardId';
const magicFields:MagicField[]=['casterId','targetId','targetHex','choice','tomeId','costCardId'];
function magicFieldValue(a:MagicAction|undefined,field:MagicField){return a&&field in a?String((a as unknown as Record<string,unknown>)[field]??''):'';}
function magicFieldLabel(a:MagicAction,field:MagicField,value:string):string{
  if(!value)return field==='tomeId'?'No Tome':'';
  if(field==='costCardId')return value.split(',').map(id=>cardById(id)?.name??id).join(' + ');
  if(field==='tomeId')return cardById(value)?.name??value;
  if(field==='choice'){if(value.includes(':')){const [side,index]=value.split(':');const b=state.advanced?.battle,die=side==='attacker'?b?.attackerRolls[Number(index)]:b?.defenderRolls[Number(index)];if(die)return `${side==='attacker'?'Attacker':'Defender'} · ${die.sides===6?'Light':'Heavy'} die ${Number(index)+1}: ${die.raw}${die.critical?' · critical':''}`;}if(value==='boost')return 'Discard a Spell · add 1 Heavy die';if(value==='normal')return 'Printed dice · no extra cost';const card=cardById(a.cardId),choice=card?.effect.choices?.[Number(value)];return choice?(choice.light?`${choice.light>0?'+':''}${choice.light} Light`:choice.heavy?`${choice.heavy>0?'+':''}${choice.heavy} Heavy`:choice.gainHeroes?'Gain a Hero':choice.recoverArmy?'Recover an Army':Object.keys(choice)[0]):cardById(value)?.name||state.unitDefinitions.find(d=>d.id===value)?.name||value;}
  const u=state.units.find(u=>u.id===value),m=state.advanced?.monsters.find(m=>m.id===value),h=getHex(value);
  return u?`${definition(u).name} · ${getHex(u.hexId)?.settlement?.name||u.hexId}`:m?`${monsterById(m.defId)?.name} · ${m.hexId}`:h?h.settlement?.name||`${h.id} · ${h.terrain}${h.coastal?' · coastal':''}`:state.advanced?.players.find(p=>p.id===value)?.name||value;
}
function magicForm(choices:MagicAction[]){
  const selected=choices[selectedMagicIndex]??choices[0],labels:Record<MagicField,string>={casterId:'Caster',targetId:'Target',targetHex:'Placement',choice:'Effect choice',tomeId:'Optional Tome',costCardId:'Discard as the cost'};
  return `<div class="magic-form">${magicFields.map((field,index)=>{const candidates=choices.filter(a=>magicFields.slice(0,index).every(k=>magicFieldValue(a,k)===magicFieldValue(selected,k))),values=[...new Set(candidates.map(a=>magicFieldValue(a,field)))];if(values.length===1&&!values[0])return '';return `<div class="magic-field"><label for="magic-${field}">${labels[field]}</label>${values.length>1?`<select id="magic-${field}" data-magic-field="${field}" class="scenario-select">${values.map(value=>`<option value="${esc(value)}" ${value===magicFieldValue(selected,field)?'selected':''}>${esc(magicFieldLabel(selected,field,value))}</option>`).join('')}</select>`:`<p>${esc(magicFieldLabel(selected,field,values[0]))}</p>`}</div>`;}).join('')}${selected&&(selected.targetHex||selected.targetId)&&!state.advanced?.players.some(p=>p.id===selected.targetId)?'<button class="secondary-button full" data-command="magic-focus">Show target on map</button>':''}</div>`;
}
function advancedPanel(){
  const d=advancedDescription(state);if(!d)return '';
  const actions=currentActions.filter(a=>!['play-card','hero-power','request-cantrip'].includes(a.type));
  const study=state.advanced?.pending?.kind==='study';
  const body=study?['spells','blessings','treasures'].map(discipline=>{const choices=actions.filter((a):a is Extract<Action,{type:'study'}>=>a.type==='study'&&a.discipline===discipline);if(!choices.length)return '';const index=Math.min(studySelection[discipline]??0,choices.length-1);return `<div class="study-discipline"><h4>Study ${esc(discipline)}</h4>${choices.length>1?`<label for="study-${discipline}">Choose ${discipline==='treasures'?'a Treasure to retrieve':'an optional exchange'}</label><select class="scenario-select" id="study-${discipline}" data-study-choice="${discipline}">${choices.map((a,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(a.discardId?'Discard '+cardById(a.discardId)?.name:a.treasureId?`${cardById(a.treasureId)?.name}${a.secondTreasureId?' + '+cardById(a.secondTreasureId)?.name:''}${a.payKingdomId?' · '+kingdomName(a.payKingdomId)+' pays the fee':''}`:'Keep cards · draw to full strength')}</option>`).join('')}</select>`:'<p>Draw to full strength.</p>'}<button class="secondary-button full" ${actionAttr(choices[index])}>Study ${esc(discipline)}</button></div>`;}).join('')+actions.filter(a=>a.type!=='study').map(a=>`<button class="primary-button full" ${actionAttr(a)}>${esc(actionLabel(a))}</button>`).join(''):`<div class="action-list">${actions.map(a=>`<button ${actionAttr(a)}>${esc(actionLabel(a))}</button>`).join('')}</div>`;
  return `<section class="decision-panel"><div class="eyebrow">${esc(playerFor(state,actor())?.name||kingdomName(actor()))}</div><h3>${esc(d.title)}</h3><p>${esc(d.text)}</p>${state.advanced?.pending?.kind==='window'&&sideTab!=='hand'?`<button class="secondary-button full" data-command="hand">Open eligible Magic cards ${icon('book')}</button>`:''}${body}</section>`;
}
function handPanel(){const a=state.advanced,p=playerFor(state,actor());if(!a||!p)return '<p class="empty-state">Choose Advanced rules to play Magic cards.</p>';if(curtain||isBot())return '<p class="empty-state">The acting player’s hand is private. Reveal the table when it is your decision.</p>';if(a.pending?.kind==='winter'){
  const collection=[...a.hands[p.id].filter(id=>cardById(id)?.kind==='treasure'),...a.owned[p.id]];
  return `${advancedPanel()}<div class="side-title"><h3>Your Winter collection</h3><span>${collection.length} Treasures</span></div>${collection.map(id=>`<div class="owned-treasure"><strong>${esc(cardById(id)?.name)}</strong><small>${esc(cardById(id)?.summary)}</small></div>`).join('')||'<p class="small-note">No Treasures to keep this Winter.</p>'}`;
}const hand=a.hands[p.id],heroes=state.units.filter(u=>p.kingdoms.includes(u.kingdom)&&definition(u).kind==='hero').map(u=>u.defId),all=[...hand,...heroes].sort((x,y)=>Number(cardActions(y).length>0)-Number(cardActions(x).length>0));const selected=selectedCardId?cardById(selectedCardId):null;const choices=cardActions(selectedCardId);return `${state.advanced?.pending?advancedPanel():''}<div class="side-title"><h3>${esc(p.name)} · Hand</h3><span>${hand.length} ${hand.length===1?'card':'cards'}</span></div><p class="small-note">Cards with a green border are playable now. Select a card to choose its caster and target.</p>${selected&&all.includes(selected.id)?`<section class="selected-magic"><div class="eyebrow">${esc(selected.kind)}${selected.cantrip?' · CANTRIP':''}${selected.mage?' · MAGE':''}</div><h3>${esc(selected.name)}</h3>${selected.powerLabel?`<strong>${esc(selected.powerLabel)}</strong>`:''}<p>${esc(selected.summary)}</p>${choices.length?`${magicForm(choices)}<button class="primary-button full" data-command="play-selected">${selected.kind==='hero'?'Use Power':'Play '+esc(selected.name)}</button>`:`<p class="card-ineligible">${runtimeLimitations[selected.id]?'Reference-only effect: '+esc(runtimeLimitations[selected.id]):selected.tome?'Choose a Spell and select this Tome with it.':selected.effect.ongoing?'This Power applies automatically while its conditions hold.':'No eligible caster, target, or timing window at this step.'}</p>`}</section>`:''}<div class="hand-cards">${all.map(id=>{const c=cardById(id)!;const legal=cardActions(id).length>0;return `<button class="magic-card ${legal?'playable':''} ${selectedCardId===id?'selected':''}" data-card="${esc(id)}"><span class="card-kind">${esc(c.kind)}${c.cantrip?' · cantrip':''}</span><strong>${esc(c.name)}</strong><span>${esc(c.summary)}</span><small>${legal?'Playable now':runtimeLimitations[c.id]?(c.kind==='hero'?'Power is reference-only':'Reference-only'):c.tome?'Attach to a Spell':c.kind==='hero'&&a.locked.some(uid=>state.units.find(u=>u.id===uid)?.defId===id)?'Power locked':c.effect.ongoing?'Passive Power':'Not available at this step'}</small></button>`;}).join('')}</div><div class="side-title"><h3>Owned Treasures</h3><span>${a.owned[p.id].length}</span></div><p class="small-note">Retrieve played Treasures during Study. Selling grants 2 gold to a kingdom you command.</p>${currentActions.filter(a=>a.type==='request-cantrip').map(a=>`<button class="secondary-button full" ${actionAttr(a)}>${esc(actionLabel(a))}</button>`).join('')}${a.owned[p.id].map(id=>`<div class="owned-treasure"><strong>${esc(cardById(id)?.name)}</strong><small>${esc(cardById(id)?.summary)}</small></div>`).join('')||'<p class="small-note">No owned Treasures yet. Explore a Lair to find one.</p>'}`;}
function heroRecruitPanel(){if(!state.advanced)return '';const k=kingdom(state.currentKingdom)!,defs=cards.filter(c=>c.kind==='hero'&&c.kingdom===k.id),actions=currentActions.filter(a=>a.type==='recruit-hero');const cost=defs[0]?.unitDefinition.cost??3;return `<section class="hero-recruit"><div class="eyebrow">Heroes</div><h3>Recruit from the hidden pool</h3><p>${state.advanced.heroPools[k.id]?.length??0} Heroes available · ${cost} gold. Identity is revealed after recruitment.</p>${actions.length?`<details><summary>Choose a legal arrival hex</summary><div class="action-list">${actions.map(a=>`<button ${actionAttr(a)}>${esc(a.type==='recruit-hero'?getHex(a.hexId)?.settlement?.name||a.hexId:'')}</button>`).join('')}</div></details>`:`<p class="small-note">${k.gold<cost?'Insufficient gold':'Finish the active stack or free an eligible arrival hex.'}</p>`}</section>`;}
function preferencesModal(){return standardModal('Table preferences',`<div class="preferences-grid"><label for="motion-choice">Motion & animation</label><select class="scenario-select" id="motion-choice"><option value="system" ${motion==='system'?'selected':''}>Follow device setting</option><option value="on" ${motion==='on'?'selected':''}>On · brief movement and dice animation</option><option value="off" ${motion==='off'?'selected':''}>Off · immediate changes</option></select><p>Movement animation takes 220 ms and never delays a command. Following your device respects reduced motion.</p><label class="preference-check"><input id="sound-choice" type="checkbox" ${sound?'checked':''}>Quiet action sounds</label><p>These preferences are saved on this device.</p></div>`);}
let codexSection='cards';
function codexModal(){const campaigns=(advancedCatalog as any).campaigns?.entries??[],boards=(advancedCatalog as any).maps?.boards??[];return standardModal('The Codex',`<div class="codex-banner"><div class="eyebrow">The living reference</div><h3>Heroes, Magic & Monsters</h3><p>186 cards · 38 Heroes · 36 Monsters · all six kingdoms</p></div><nav class="codex-tabs" aria-label="Reference sections"><button data-codex-section="cards" class="${codexSection==='cards'?'active':''}">Cards & Monsters</button><button data-codex-section="campaigns" class="${codexSection==='campaigns'?'active':''}">Campaigns</button><button data-codex-section="maps" class="${codexSection==='maps'?'active':''}">Maps</button></nav><label for="codex-search">Find a name, kingdom, or rule</label><input id="codex-search" type="search" placeholder="Search this reference…" class="codex-search">${codexSection==='cards'?`<div class="codex-grid">${cards.map(c=>`<article class="codex-entry" data-search="${esc((c.name+' '+c.kind+' '+c.kingdom+' '+c.summary).toLowerCase())}"><small>${esc(c.kind)}${c.kingdom?' · '+esc(kingdomName(c.kingdom)):''}${c.cantrip?' · Cantrip':''}</small><h3>${esc(c.name)}</h3>${c.powerLabel?`<strong>${esc(c.powerLabel)}</strong>`:''}<p>${esc(c.summary)}</p>${runtimeLimitations[c.id]?`<p class="reference-badge"><strong>${c.kind==='hero'?'Power reference-only':'Reference only'}</strong> · ${esc(runtimeLimitations[c.id])}</p>`:`<p class="runtime-badge">${c.kind==='hero'?'Counter & Power implemented':'In the playable deck'}</p>`}<span>${c.range?`Range ${c.range.min?c.range.min+'–':''}${c.range.max} · `:''}${c.mage?'Mage required · ':''}${c.tome?'Tome · ':''}${esc(c.duration.replaceAll('-',' '))}</span></article>`).join('')}${monsters.map(m=>`<article class="codex-entry" data-search="${esc((m.name+' monster '+m.pool+' '+m.abilities.join(' ')).toLowerCase())}"><small>${m.pool} Monster</small><h3>${esc(m.name)}</h3><p>${m.light} Light · ${m.heavy} Heavy · ${m.rewardGold} gold · Strike range ${m.strikeRange}</p><span>${esc(m.abilities.join(', ')||'No special abilities')} · One hit eliminates</span></article>`).join('')}</div>`:codexSection==='campaigns'?`<p>Official campaign names and published corrections are cataloged below. Complete setup pages and victory conditions are required before an official campaign can be launched.</p><div class="codex-grid">${campaigns.map((c:any)=>`<article class="codex-entry" data-search="${esc(JSON.stringify(c).toLowerCase())}"><small>${esc(c.series||c.kind||'Published campaign')}</small><h3>${esc(c.name||c.title)}</h3><p>${esc(c.summary||c.status||'Setup source needed')}</p></article>`).join('')||'<p>The campaign catalog is stored with the source repository.</p>'}</div>`:`<p>All four board grids and named locations are cataloged. The Wildlands is playable with reviewed centers and partial edges. Remaining terrain edges and board joins require calibration.</p><div class="codex-grid">${boards.map((m:any)=>`<article class="codex-entry" data-search="${esc(JSON.stringify(m).toLowerCase())}"><h3>${esc(m.name||m.title)}</h3><p>${esc(m.status||'Grid and named landmarks recorded; terrain graph review required.')}</p></article>`).join('')}</div>`}`);}
function animateMovement(){if(!movementFrom||!motionEnabled())return;const before=movementFrom;movementFrom=null;requestAnimationFrame(()=>{const scale=camera?viewport().width/camera.w:1;for(const marker of root.querySelectorAll<HTMLElement>('[data-map-unit]')){const unit=state.units.find(u=>u.id===marker.dataset.mapUnit),from=unit&&getHex(before[unit.id]),to=unit&&getHex(unit.hexId);if(!from||!to||from.id===to.id)continue;const p=center(from),q=center(to),card=marker.querySelector('.unit-card');card?.animate([{transform:`translate(${(p.x-q.x)*scale}px,${(p.y-q.y)*scale}px)`,opacity:.8},{transform:'translate(0,0)',opacity:1}],{duration:220,easing:'ease-out'});}});}

root.addEventListener('input',event=>{const target=event.target as HTMLInputElement;if(target.id==='codex-search')for(const entry of root.querySelectorAll<HTMLElement>('.codex-entry'))entry.hidden=!entry.dataset.search?.includes(target.value.toLowerCase());});

function drawMonsters(){return state.advanced?.monsters.map(m=>{const d=monsterById(m.defId),h=getHex(m.hexId);if(!d||!h)return '';const p=center(h),ready=!m.activated&&m.kingdom===state.currentKingdom;return `<button class="map-marker unit-marker monster-marker ${m.activated?'used':''}" data-map-hex="${esc(m.hexId)}" data-marker-kind="unit" data-world-x="${p.x}" data-world-y="${p.y}" data-stack-offset="0" style="--faction:${color(m.kingdom||'night')}" aria-label="${esc(d.name)}, ${d.pool} Monster, ${d.light} Light, ${d.heavy} Heavy, ${m.activated?'finished':'ready'}" title="${esc(d.name)} · Strike range ${d.strikeRange} · ${m.kingdom?kingdomName(m.kingdom):'Uncommanded'}"><span class="unit-card">♜${ready?'<span class="unit-ready"></span>':''}<span class="unit-card-stats"><span class="light-die">${d.light}</span><span class="heavy-die">${d.heavy}</span></span></span><span class="unit-map-name">${esc(d.name)}</span></button>`;}).join('')??'';}
function monsterActionsPanel(){const ms=state.advanced?.monsters.filter(m=>m.kingdom===state.currentKingdom)??[];return ms.length?`<div class="side-title"><h3>Commanded Monsters</h3><span>${ms.length}/3</span></div>${ms.map(m=>{const d=monsterById(m.defId)!;const acts=currentActions.filter(a=>'monsterId'in a&&a.monsterId===m.id);return `<details class="hero-recruit"><summary>${esc(d.name)} · ${m.activated?'finished':'ready'}</summary><p>${d.light} Light · ${d.heavy} Heavy · ${getHex(m.hexId)?.id}</p><div class="action-list">${acts.map(a=>`<button ${actionAttr(a)}>${a.type==='monster-strike'?`Strike ${esc(state.units.find(u=>u.id===a.targetId)?definition(state.units.find(u=>u.id===a.targetId)!).name:getHex(a.targetId)?.settlement?.name||a.targetId)}`:esc(actionLabel(a))}</button>`).join('')}</div></details>`;}).join('')}`:'';}
