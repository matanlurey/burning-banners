# Burning Banners · The War Table

A browser adaptation of **Burning Banners: Rage of the Witch Queen**, with Basic rules, an Advanced preview, a full tabletop profile, original generated artwork, local AI and pass-and-play. This repository stores the code, production assets, factual catalogs, research and verification records. Christopher Moeller designed and illustrated the physical game, published by Compass Games; this independent adaptation does not claim publisher endorsement.

## Play

- **The Invasion of Drefeld**, all **17 Scrolls campaigns**, and all **10 Chronicle chapters** are selectable from the Campaign Book transcription. Opening deployment uses the printed purchasing allowances, free units, Heroes, Covens, controls and faction restrictions. Independently assign each kingdom to a human or computer. The two original digital scenarios remain available.
- **Linked Chronicle** preserves the evolving map and armies between chapters. Choose a starting and ending chapter, or the complete **Spring 589–Summer 600 war: 35 playable seasons**, including Bitter End. Winter is an interphase, not a fourth playable season. Source conflicts require a recorded table ruling rather than an AI guess.
- **Full tabletop** makes all 148 Magic cards, 38 named Heroes, 44 Army types, 36 Monsters and four Enslaved Hero markers available. Published campaigns retain their automated objectives; custom tables support explicit campaign adjudication. The table controls also support the five manual effects and recorded source rulings. See the [table guide](docs/full-tabletop.md).
- Automated rules cover movement, ship transport, combat/Ambush, critical confirmations, capture/raze, construction, recovery, income, mining, Covens, Shashka upkeep, Imperial revolts, allied transfers and collapse. Advanced play adds private hands, nested counters/Tomes, per-hit decisions, Hero stacks/Powers, Monsters, Study and Winter.
- Attack previews show **expected net hits, wounds, weakening and elimination chances**. Compare normal combat/Ambush and Army-first/Hero-first hit allocation. Forecasts use resolved public modifiers and consume no dice. Extra-Attack choices include the same expected-hit and loss probabilities. Movement previews itemize costs for each stack member. Map search finds locations, units and objectives; `/` opens it.
- Readable counters, legal destinations, dice receipts, Next Army/Focus/Overview, bounded drag/pinch/keyboard navigation and responsive panels. Motion follows the system preference or can be switched On/Off; sound is optional.
- Local saves and validated portable JSON backups preserve pending choices, private cards and dice state. Clipboard failures leave selectable backup text.
- The **Campaign Desk** provides visible-event return briefings, Before/After replay, unread indicators, AI delegation/takeback, table/alliance messages, preset AI replies, pings and private notes. Easy/Normal/Hard share the human legal-action generator. Hard scores scenario victory conditions, deadlines, threats, economy and Magic without hidden-hand or dice foreknowledge.

## Fidelity and source limits

The catalog contains all **186 game cards** plus six kingdom information cards. **181 effects run automatically:** 52 Spells, 36 Treasures, 56 Blessings and 37 Hero effects. All 38 Hero counters are recruitable. Unsellable-only Winter excess pauses for an explicit human table ruling; AI cannot choose that exception. The **5 remaining effects** use human resolution in Full tabletop and are excluded from the automated preview's decks/Powers. See [exact coverage](docs/advanced-runtime-coverage.md).

A rare Horn interruption can strand a Huge Army in a welcoming Settlement. That interaction requires a recorded human ruling; the game can switch an ongoing Advanced preview to Full tabletop while preserving its state and published objectives. No automatic official movement-point remedy is asserted. The [table guide](docs/full-tabletop.md) explains the recovery controls.

The complete public publisher Campaign Book review gallery supplies **28 named starts**: Intro + 17 Scrolls + 10 Chronicle chapters. The publisher advertises 29 scenarios; the book's named count and additional full-war play mode are recorded without inventing a 29th start. English living notes, errata, printed header photographs and the supplied English overview take precedence over identified proof-copy errors. The source is a Spanish preproduction review copy, so some instructions remain qualified. See [campaign/map provenance](docs/campaign-map-audit.md).

New source campaigns use reviewed terrain and crossing records from all four actual boards. Joined geography contains **854 distinct hexes**, retaining **868 source aliases** and merging 14 shared edge cells, with **66 settlements, 11 mines and 22 lairs**. Partial hexes use measured visible coverage and joined-board geometry. Source ambiguities remain visible: several water/river sides, Campaign 15's western entries, unmatched Oronar/Zarinar names, duplicate Chronicle control lists and the Bitter End turn-count discrepancy. Structural tests do not certify every printed edge. Custom tables begin with the same reviewed geography and may record corrections.

Play is browser-local. Hosted async multiplayer is deferred: no remote rooms, background workers, live remote chat or delivered push/email notices. File exchange requires trusted players because a full backup contains every seat's private state. The AI progresses only while the client is running. Replay observes history and does not undo play.

## Develop and verify

Node 24 and npm are supported; TypeScript is pinned and locked.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open `http://localhost:5173/`. The strict build normalizes Advanced, published-campaign and reviewed-map catalogs, compiles shared rules/UI modules and writes the static production bundle to `dist/`. Human controls and bots use the same legal actions. The principal modules are [engine](src/engine.ts), [Advanced rules](src/advanced.ts), [table adjudication](src/tabletop.ts), [combat odds](src/combat-odds.ts) and [AI](src/ai.ts).

The earlier completion release passed **178/178 automated tests**, including all-component finite inventory traversal and 20,000 actual combat resolutions checked against forecasts. Its final paired self-play pass completed **60 Basic and 36 Advanced games with zero errors or timeouts**, plus 12 targeted retests. Across the 96-game pass, Hard won 26/32 against Easy and 22/32 against Normal. These are original scenarios, reused deterministic seeds and measured self-play advantages; they do not establish expert-human strength or official campaign balance. [Verification](docs/verification.md) records browser interactions, sizes, regressions and practical limits. Those measurements are historical evidence; source-campaign opening, victory and map regression tests are also included in the current suite.

[Published campaign integration](docs/campaign-validation.md) records **99 passing cases**, **24 supplementary objective assertions**, a **35-season calendar dry run**, and **43 final lifecycle/shipping/table-ruling checks**. [Source campaign AI validation](docs/campaign-ai-validation.md) records **26 completed Advanced self-plays** and **32 passing affected setup/strategy checks**, with separate build scopes and regression history. These measurements do not establish official campaign balance or expert-human strength.

The development `/__qa` page runs the real game in seven CSS frame sizes, including 320×568, 390×844, tablet and short landscape. Physical touchscreen gestures, audible output and expert-human strength have not been verified. Portable browser fixture generators live in `tests/fixtures/`. Development debug state is not a private multiplayer boundary.

## Content and research

The `/content-editor.html` workshop accepts an authorized local reference image, calibrates the grid, edits terrain/settlements/reciprocal crossings and exports validated mechanics. Imports validate structure, not printed-source fidelity.

- [Full tabletop guide](docs/full-tabletop.md) and [quality-of-life research](docs/quality-of-life-research.md)
- [Source registry](sources/source-registry.json), [Basic research](docs/basic-rules-research.md), [Advanced audit](docs/advanced-content-audit.md) and [coverage](docs/advanced-runtime-coverage.md)
- [Campaign/map source audit](docs/campaign-map-audit.md), [published campaign facts](content/published-campaigns.json), [reviewed map records](content/maps-reviewed.json) and [content pack format](docs/content-pack-format.md)
- [UI research](docs/ui-reference-research.md), [camera audit](docs/camera-audit.md), [async research](docs/async-research.md) and [faction strategies](docs/faction-strategy-research.md)
- [Campaign Desk](docs/async-play.md), [verification](docs/verification.md), [Basic balance](docs/ai-completion-basic-balance.json) and [Advanced balance](docs/ai-completion-advanced-balance.json)
- [Art direction](docs/art-direction.md) and [28 original generated assets](content/assets-manifest.json)

The existing MIT license is retained for code. Names, printed artwork and manuals remain their owners' material. Source scans and complete manuals are research-only and are not redistributed in production.
