# Burning Banners · The War Table

A standalone browser implementation of researched **Burning Banners: Rage of the Witch Queen** Basic Game mechanics, with original generated artwork, local algorithmic opponents and pass-and-play.

This repository is the source of truth for the implementation, generated production assets, normalized content, research records and tests. The physical game is designed and illustrated by Christopher Moeller and published by Compass Games. This is an independent implementation and does not claim publisher endorsement.

## Playable now

- **Drefeld teaching table:** a three-season, two-kingdom original fixture using the inspected Wildlands grid and printed army values.
- **Six banners at war:** an original six-kingdom sandbox with Invader and Resistance alliances and independently assignable human/computer kingdoms.
- Move, ship transport, attack, ambush, critical-hit confirmation, capture/raze, recruit, recover, income, mining, Covens, Shashka upkeep, Imperial revolts, allied gold transfers and kingdom collapse.
- Generated terrain tiles, individual introductory troop portraits, faction art, transparent settlement vignettes, map pan/zoom, legal destinations, combat previews, dice receipts and an event chronicle.
- Browser-local IndexedDB saves, downloadable checked JSON backups, runtime-validated content packs, a local reference-image map editor, keyboard controls and a responsive map-centered interface.

## Fidelity status

The living rules, official corrections, counter faces, component inventory and reference module were inspected. There are **44 normalized Army types**, **217 reconstructed Wildlands cells**, and a reconciled **192-card inventory**. Source scans and full manuals are not redistributed here.

**This is not yet the complete base game.** The two supplied setups are explicitly original; neither is falsely presented as an official campaign. Full official Drefeld, Campaign 8 and Campaign 16 opening/victory instructions were not acquired. Road, river, coast and multi-board joins are not fully verified. Advanced play, executable card effects, hero stacks, monster play, Arcane Study, all 29 official setups and remote multiplayer are not enabled. Physical control-marker supplies and some Ambush/garrison interactions remain unresolved. See [missing content](content/missing-content.md), [content research](docs/content-research.md), [rules ambiguities](rules/ambiguities.md) and the [coverage matrix](rules/coverage-matrix.csv).

The current target is browser-local **ChatGPT Sites**. It requires no Cloudflare account, database, model API key or running server to play after the app has loaded. Separate-device online rooms are outside this deployment's enabled scope.

## Develop and verify

Node 24 and npm are supported. TypeScript is pinned and locked.

```sh
npm ci
npm run build
npm test
npm run dev
```

Open `http://localhost:5173/`. `npm run build` strictly compiles the shared rules and UI to `dist/js/` and copies the HTML/CSS. The production build uses only local modules and assets. `dist/` is checked in so it can also be served as a plain static directory.

The same validator/transition is used by human buttons and bots. Core types and logic are in [src/engine.ts](src/engine.ts); immutable definitions are in [src/content.ts](src/content.ts); original fixtures are in [src/scenarios.ts](src/scenarios.ts). There are no backend imports in the local bundle.

`window.__GAME_DEBUG__` exposes the current position, legal choices, last combat, an AI proposal and fixture loading for reproduction. Tests use fixed seeds and inspect accepted transitions and saves. Human playtesting and browser visual QA have not yet certified the mobile experience or AI strength.

## Content workshop

Open `/content-editor.html`, optionally load an authorized local reference image, calibrate it against the flat-top grid, edit terrain/settlements and reciprocal crossings, then validate and export. Import the resulting pack from the game setup. The image stays on the user's device; the export includes mechanics only. Validation checks structural consistency, not historical/source fidelity. Custom exports are marked unofficial.

## Research and future implementation

- [Implementation brief supplied by the user](docs/implementation-prompt.md)
- [Source registry](sources/source-registry.json) and [access report](sources/access-report.md)
- [Basic rules research](docs/basic-rules-research.md)
- [Advanced implementation research](docs/advanced-implementation.md)
- [Content pack format](docs/content-pack-format.md)
- [Design findings](docs/design-findings.md)
- [Verification record](docs/verification.md)
- [Generated assets manifest](content/assets-manifest.json)

Complete the remaining data and rule coverage before enabling purportedly official campaigns or Advanced play. A future Cloudflare target should reuse the rules engine in one SQLite-backed Durable Object per match, with actor-authorized projections and durable decisions. No placeholder online backend is shipped as a completed feature.

The existing repository MIT license is retained for this implementation. Burning Banners names, original game artwork and manuals remain their respective owners' material. Production raster illustrations in `dist/assets` were generated originally for this project.
