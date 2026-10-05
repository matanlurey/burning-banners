# Burning Banners · The War Table

A standalone browser adaptation of **Burning Banners: Rage of the Witch Queen**, with Basic play, an **Advanced preview**, original generated artwork, local algorithmic opponents and pass-and-play.

This repository stores the implementation, production assets, normalized content, research records and tests. Christopher Moeller designed and illustrated the physical game, published by Compass Games. This independent adaptation does not claim publisher endorsement.

## Playable now

- **Drefeld teaching table:** an original three-season, two-kingdom fixture using the inspected Wildlands grid and printed Army values.
- **Six banners at war:** an original six-kingdom sandbox with Invader and Resistance alliances and independently assignable human/computer kingdoms.
- Basic movement, ship transport, combat, ambush, critical confirmations, capture/raze, recruitment, recovery, income, mining, Covens, Shashka upkeep, Imperial revolts, allied gold transfers and kingdom collapse.
- Advanced player-owned hands, private handoffs, eligible Magic/counter choices, Tomes, per-hit decisions, Hero stacks and Powers, Monster pools/command/rewards, Arcane Study and Winter Treasure management.
- A searchable **Arcane Library** containing all card and Monster records, four-board location inventories and the named campaign catalog. Reference-only records explain their current limits.
- Readable Army/Hero counters, stack details with separate movement budgets, legal destinations, combat forecasts, dice receipts and a chronicle. Responsive Hand/Council sheets keep decisions usable on small screens.
- Pointer-centered zoom, bounded drag navigation, pinch handlers, keyboard navigation, Next Army/Focus/Overview controls and target-to-map focus. Terrain and landmarks pan as one layer.
- Browser-local IndexedDB saves, checked JSON imports, an explicit backup download link and copyable backup text. Motion follows the system preference or can be switched On/Off; sound is optional.
- A Campaign Desk with return briefings, read-only Before/After replay, unread markers, temporary AI delegation/takeback, table/alliance messages, map pings and private planning notes.
- Easy, Normal and Hard local AI policies. Hard considers scenario goals/deadlines, threats, economy and Magic; it follows the same rules without hidden-hand or dice foreknowledge.

## Fidelity and availability

The living rules, official corrections and printed reference faces were inspected. The catalogs contain **44 Army types**, **38 Hero counters**, **36 Monsters**, **186 game cards** and six kingdom information cards. The Advanced preview supports **44 of 52 Spells, 28 of 36 Treasures, 42 of 60 Blessings and 27 of 38 Hero card effects**. All Hero counters are recruitable; the eleven unsupported Hero effects stay unavailable. The **45 reference-only effects** are excluded from playable decks and Power choices, rather than replaced with guessed behavior. See the [runtime coverage table](docs/advanced-runtime-coverage.md).

**This is not yet the complete official game.** Both supplied setups are explicitly original. The catalog identifies 28 named campaign starts; their complete opening/victory instructions have not been acquired. The publisher's advertised 29-scenario total remains unreconciled. Four boards now have location inventories totaling 66 settlements, 11 mines and 22 lairs, but only the partially reviewed **217-cell Wildlands** graph is playable. Full road, river, coast and joined-board topology remains unfinished. Physical control-marker supplies outside Night, allied entry denial and the Ambush garrison interpretation also remain open. See [missing content](content/missing-content.md), [campaign/map audit](docs/campaign-map-audit.md) and [rules ambiguities](rules/ambiguities.md).

The current target is local play on **ChatGPT Sites**. After loading, play needs no Cloudflare account, database, model API key or running server. Separate-device online rooms are not enabled. The [Campaign Desk](docs/async-play.md) supports local pass-and-play or trusted file-exchange correspondence. Its AI stops when the browser is closed; there is no live remote message or notification delivery. Complete backup files contain all seats’ private state.

## Develop and verify

Node 24 and npm are supported. TypeScript is pinned and locked.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open `http://localhost:5173/`. The strict build generates `src/advanced-data.ts` from the factual JSON catalogs, compiles the shared rules/UI into `dist/js/`, and copies HTML/CSS. Production uses local modules and assets. `dist/` is checked in for plain static hosting.

The same legal-action generator and transition validator serve human buttons and bots. Basic rules are in [src/engine.ts](src/engine.ts), Advanced systems in [src/advanced.ts](src/advanced.ts), and original setups in [src/scenarios.ts](src/scenarios.ts). [content/advanced-catalog.json](content/advanced-catalog.json) is the authoritative normalized Advanced content; the earlier card index and module inventory link to it by stable ID.

The frozen source passed the strict build and **137 automated tests**: 32 Basic/content, 15 Advanced, 42 Advanced interactions, 27 AI and 21 companion/desk checks. The initial expansion also completed six Advanced and five Basic regression games with validated saves and deterministic continuation. The final balance pass completed **144 paired games**—120 Basic and 24 Advanced—with zero errors or timeouts. Hard won 26/40 against Normal in Basic and 5/8 in Advanced. These are self-play results with substantial seat/scenario bias, not expert-human strength.

Real Chrome passes covered Magic costs/cancellation, recovery between hits, Winter sales, private handoffs, local reload and copied backup import. Seven CSS frame sizes, from 320×568 through desktop/tablet and short landscape, were checked; all five Campaign Desk tabs added 35 measured layout checks. Briefing/replay, safe messages/pings, private notes, owner-confirmed Regenerate, AI delegation during Study/Battle Magic and cross-seat takeback were exercised. Replay preserved the full copied campaign and RNG exactly. Motion On/Off and reload persistence were verified.

See [async play and AI results](docs/async-play.md), [Advanced playtests](docs/advanced-playtests.md) and [verification](docs/verification.md). Physical touchscreen, audio output and expert-human difficulty checks remain uncompleted. Run the development server and open `/__qa` to repeat the frame checks. `window.__GAME_DEBUG__` remains a development reproduction aid and is not a private multiplayer boundary.

## Content workshop

Open `/content-editor.html`, optionally load an authorized local reference image, calibrate it against the flat-top grid, edit terrain/settlements and reciprocal crossings, then validate/export. Import the resulting pack from setup. Images stay on the user's device; the export contains mechanics only. Validation checks structural consistency, not source fidelity. Custom packs remain unofficial.

## Research and production records

- [Implementation brief](docs/implementation-prompt.md), [source registry](sources/source-registry.json) and [access report](sources/access-report.md)
- [Basic rules research](docs/basic-rules-research.md) and [Advanced systems](docs/advanced-implementation.md)
- [Advanced content audit](docs/advanced-content-audit.md), [rules audit](docs/advanced-rules-audit.md) and [runtime effect coverage](docs/advanced-runtime-coverage.md)
- [Campaign/map audit](docs/campaign-map-audit.md), [content research](docs/content-research.md) and [content pack format](docs/content-pack-format.md)
- [UI research](docs/ui-reference-research.md), [earlier UI browser checks](docs/ui-browser-checks.md), [camera audit](docs/camera-audit.md) and [Advanced playtest record](docs/advanced-playtests.md)
- [Campaign Desk and difficulty](docs/async-play.md), [async references](docs/async-research.md), [faction strategy research](docs/faction-strategy-research.md) and [paired Basic AI report](docs/ai-balance-report.json)
- [Generated art direction](docs/art-direction.md) and [28-asset manifest](content/assets-manifest.json)

The existing MIT license is retained for implementation code. Burning Banners names, printed art and manuals remain their respective owners' material. Production raster illustrations are original generations. Source scans and complete manuals are research-only and are not redistributed here.
