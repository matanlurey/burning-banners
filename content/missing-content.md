# Content availability

The playable build implements a Basic local rules profile. Advanced gameplay is disabled rather than offering a hybrid with placeholder card effects.

## Advanced inventory

`cards-index.json` lists every base-game card and separates verified names, reviewed mechanical examples, reference-face availability and runtime availability. The printed inventory totals 192: 52 Spells, 36 Treasures, 60 Blessings, 38 Hero cards and six kingdom information cards.

Twenty mechanical examples in `cards-mechanical-reference.json` were visually checked against printed reference faces and the Undying card guide. These are research data, not executable effects. The remaining cards require transcription and visual checking of requirements, dice symbols, ranges, Cantrip/Discard/Tome icons, target classes and corrections. All Advanced cards still require effect handlers and independent fixtures.

Enabling Advanced additionally requires player-owned hands, private pass-and-play handoffs for responses and study, the ordered Battle Magic state machine, per-hit decisions, Hero random pools and lock lifecycle, Hero/Army stack movement, Monster pools/command actions/rewards, Treasure owned/held/eliminated zones, Autumn study pools and Winter cleanup. These mechanics are documented in `docs/advanced-implementation.md`.

## Official maps and scenarios

Current content provenance and enabled scenarios are recorded in the supplied source and content manifests. The editor accepts complete externally verified Basic content packs; structural validation cannot establish that a submitted map matches the printed boards or a scenario matches its campaign instructions. Unverified geography and setup must remain labeled custom/reference until reviewed.

Four exact map-board hex graphs require terrain, road/river/Sea edges, Settlement attributes, Entry hexes, joins and campaign exclusions to be checked against authoritative images. The publisher's 29-scenario count does not prove all setup/objective values have been imported. Unsupported scenarios should remain unavailable. Campaigns 8 and 16 require full setup, board geometry and applicable correction verification before release.

## Artwork

The downloadable VASSAL module was inspected as reference. Original map, counter, card and playmat images from that module are excluded from the public build because no public redistribution grant was established. Original generated presentation art may approximate the board game's illustration language; it cannot replace map geometry or printed mechanical data.
