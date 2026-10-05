# Burning Banners · The War Table

A browser adaptation of **Burning Banners: Rage of the Witch Queen**, with Basic rules, an Advanced preview, a full tabletop profile, original generated artwork, local AI and pass-and-play. This repository stores the code, production assets, factual catalogs, research and verification records. Christopher Moeller designed and illustrated the physical game, published by Compass Games; this independent adaptation does not claim publisher endorsement.

## Play

- **Drefeld teaching battle** and **Six banners at war** are original digital scenarios, with independently assignable human/computer kingdoms.
- **Full tabletop** makes all 148 Magic cards, 38 named Heroes, 44 Army types, 36 Monsters and four Enslaved Hero markers available. Enter a printed campaign and calibrate its map using the table controls. Human adjudication supplies the remaining card effects, consent and special campaign rules; standard actions still use the engine. See the [table guide](docs/full-tabletop.md).
- Automated rules cover movement, ship transport, combat/Ambush, critical confirmations, capture/raze, construction, recovery, income, mining, Covens, Shashka upkeep, Imperial revolts, allied transfers and collapse. Advanced play adds private hands, nested counters/Tomes, per-hit decisions, Hero stacks/Powers, Monsters, Study and Winter.
- Attack previews show **expected net hits, wounds, weakening and elimination chances**. Compare normal combat/Ambush and Army-first/Hero-first hit allocation. Forecasts use resolved public modifiers and consume no dice. Movement previews itemize costs for each stack member. Map search finds locations, units and objectives; `/` opens it.
- Readable counters, legal destinations, dice receipts, Next Army/Focus/Overview, bounded drag/pinch/keyboard navigation and responsive panels. Motion follows the system preference or can be switched On/Off; sound is optional.
- Local saves and validated portable JSON backups preserve pending choices, private cards and dice state. Clipboard failures leave selectable backup text.
- The **Campaign Desk** provides visible-event return briefings, Before/After replay, unread indicators, AI delegation/takeback, table/alliance messages, preset AI replies, pings and private notes. Easy/Normal/Hard share the human legal-action generator. Hard scores scenario victory conditions, deadlines, threats, economy and Magic without hidden-hand or dice foreknowledge.

## Fidelity and source limits

The catalog contains all **186 game cards** plus six kingdom information cards. **169 effects run automatically:** 52 Spells, 34 Treasures, 51 Blessings and 32 Hero effects. All 38 Hero counters are recruitable. Unsellable-only Winter excess pauses for an explicit human table ruling; AI cannot choose that exception. The **17 remaining effects** use human resolution in Full tabletop and are excluded from the automated preview's decks/Powers. See [exact coverage](docs/advanced-runtime-coverage.md).

Complete official campaign setups and fully verified four-board geography remain unavailable. Research obtained 28 named starts; the publisher advertises 29, and that discrepancy is retained. The four boards have inventories of 66 settlements, 11 mines and 22 lairs. The supplied digital scenarios use the partially reviewed 217-cell Wildlands graph. Full tabletop provides four **editable calibration templates**, not certified terrain/crossing graphs. Template gold, income, control limits, flags, opening armies and victory conditions must be entered from the printed campaign. Template coordinates have different origins from the original digital Wildlands pack. See [source gaps](content/missing-content.md), [map audit](docs/campaign-map-audit.md) and [rules questions](rules/ambiguities.md).

Play is browser-local. Hosted async multiplayer is deferred: no remote rooms, background workers, live remote chat or delivered push/email notices. File exchange requires trusted players because a full backup contains every seat's private state. The AI progresses only while the client is running. Replay observes history and does not undo play.

## Develop and verify

Node 24 and npm are supported; TypeScript is pinned and locked.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open `http://localhost:5173/`. The strict build normalizes factual Advanced catalogs, compiles shared rules/UI modules and writes the static production bundle to `dist/`. Human controls and bots use the same legal actions. The principal modules are [engine](src/engine.ts), [Advanced rules](src/advanced.ts), [table adjudication](src/tabletop.ts), [combat odds](src/combat-odds.ts) and [AI](src/ai.ts).

The completion pass passed **178/178 automated tests**, including all-component finite inventory traversal and 20,000 actual combat resolutions checked against forecasts. Its final paired self-play pass completed **60 Basic and 36 Advanced games with zero errors or timeouts**, plus 12 targeted retests. Across the 96-game pass, Hard won 26/32 against Easy and 22/32 against Normal. These are original scenarios, reused deterministic seeds and measured self-play advantages; they do not establish expert-human strength or official campaign balance. [Verification](docs/verification.md) records browser interactions, sizes, regressions and practical limits. Previous release reports remain historical evidence.

The development `/__qa` page runs the real game in seven CSS frame sizes, including 320×568, 390×844, tablet and short landscape. Physical touchscreen gestures, audible output and expert-human strength have not been verified. Portable browser fixture generators live in `tests/fixtures/`. Development debug state is not a private multiplayer boundary.

## Content and research

The `/content-editor.html` workshop accepts an authorized local reference image, calibrates the grid, edits terrain/settlements/reciprocal crossings and exports validated mechanics. Imports validate structure, not printed-source fidelity.

- [Full tabletop guide](docs/full-tabletop.md) and [quality-of-life research](docs/quality-of-life-research.md)
- [Source registry](sources/source-registry.json), [Basic research](docs/basic-rules-research.md), [Advanced audit](docs/advanced-content-audit.md) and [coverage](docs/advanced-runtime-coverage.md)
- [Map/campaign audit](docs/campaign-map-audit.md) and [content pack format](docs/content-pack-format.md)
- [UI research](docs/ui-reference-research.md), [camera audit](docs/camera-audit.md), [async research](docs/async-research.md) and [faction strategies](docs/faction-strategy-research.md)
- [Campaign Desk](docs/async-play.md), [verification](docs/verification.md), [Basic balance](docs/ai-completion-basic-balance.json) and [Advanced balance](docs/ai-completion-advanced-balance.json)
- [Art direction](docs/art-direction.md) and [28 original generated assets](content/assets-manifest.json)

The existing MIT license is retained for code. Names, printed artwork and manuals remain their owners' material. Source scans and complete manuals are research-only and are not redistributed in production.
