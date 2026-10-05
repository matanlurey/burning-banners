# Content availability and remaining work

The selectable build includes Basic, an **Advanced preview**, and **Full tabletop**. Catalog completeness and executable rule coverage are separate facts. The selectable campaigns include 28 source-backed published starts and linked Chronicle play. The two earlier original digital fixtures also remain available.

## Advanced coverage

`advanced-catalog.json` is the authoritative normalized catalog for all 186 game cards and 36 Monsters. The stable `cards-index.json` also includes six kingdom information cards, making 192 printed cards. Every Advanced card/Monster record's normalized facts were visually checked; that flag does not certify all runtime interactions.

**181 effects run automatically:** 52 Spells, 36 Treasures, 56 Blessings and 37 Hero effects. All 38 Hero counters are available. **Five effects require human table resolution** and are excluded from preview decks/Powers. Full tabletop retains all 148 Magic cards, 38 named Heroes and four Enslaved Hero markers. The exact IDs, names and remaining decisions are listed in [runtime coverage](../docs/advanced-runtime-coverage.md). Unsellable-only Winter excess also requires an explicit human ruling; ordinary curse/fountain effects are supported and AI does not approve an unverified disposal exception.

Executable systems now include hidden player-owned cards and handoffs, ordered Battle Magic, counter/Tome cancellation, per-hit recovery, Hero pools/locks/stacks, Monster command actions/rewards, Study and Winter. They are documented in [Advanced implementation](../docs/advanced-implementation.md) and tested in [Advanced playtests](../docs/advanced-playtests.md). Their availability does not make every printed card or official campaign supported.

## Official maps and campaigns

The complete public publisher Campaign Book review gallery was retrieved and transcribed. [Published campaign facts](published-campaigns.json) implement the introductory campaign, all 17 Scrolls campaigns and ten Chronicle chapter openings, plus selectable linked play and the 35-season full war with Bitter End. Opening purchasing allowances, finite supplies, legal deployment and source victory conditions are no longer metadata-only. The publisher advertises 29 scenarios while the book names 28 starts; that discrepancy remains explicit.

The new reviewed four-board gameplay geography contains **854 distinct cells**, **868 source aliases**, **66 settlements, 11 mines and 22 lairs**. Terrain, settlement flags, loyalties, entry crests and individually reviewed crossings come from the actual board sources. Joined partial hexes are deduplicated and standalone occupancy uses measured source coverage. Custom tables inherit this geography rather than blank clear-terrain templates. Earlier saved digital fixtures retain their own board pack.

Exact printed fidelity still has source limits. Some water/river crossings remain uncertain. Chronicle 4's Oronar and Chronicle 8's Zarinar are unmatched names; later Chronicle chapters duplicate Khorikar/Belgunot ownership; Campaign 15's five western Sea entries and third road entry need clarification; the Bitter End printed nine-turn count conflicts with its eight-season dates. Explicit table rulings and recorded qualifications preserve these discrepancies rather than presenting guessed corrections as official facts. See the [campaign/map source audit](../docs/campaign-map-audit.md).

Control supplies are now verified from a complete countersheet photograph: Night/Oathborn/Fjordland/Empire 10 each, Goblins/Orcs 12 each, and three Monster command markers per kingdom. Campaign caps replace those defaults. Custom content imports and topology tests validate structure; they cannot certify source fidelity or resolve a disputed printed instruction. Allied consent and other rule questions remain disclosed in [rules ambiguities](../rules/ambiguities.md).

## Async and online play

This release is a local shared-table game with algorithmic opponents. Separate-device rooms, actor-secured private views and server persistence are not enabled. The local Campaign Desk now supports return briefings, read-only replay, explicit AI delegation/takeback, table/alliance messages, pings and private notes. Easy/Normal/Hard policies have a separate [evaluation record](../docs/async-play.md). Those aids work in a running client or trusted save-file exchange; they do not provide cross-device synchronization, closed-browser progress or push/email delivery. Full saves contain all seats’ private data.

## Artwork

Source scans and full manuals are research-only. No public redistribution grant was established for the VASSAL bitmap components. The production build uses 28 original generated raster illustrations, including the new Arcane Library banner. Presentation art cannot establish printed mechanical facts or map topology.
