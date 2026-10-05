# Content availability and remaining work

The selectable build includes Basic play and an **Advanced preview**. Catalog completeness and executable rule coverage are separate facts. The two supplied setups remain original digital fixtures, not official campaigns.

## Advanced coverage

`advanced-catalog.json` is the authoritative normalized catalog for all 186 game cards and 36 Monsters. The stable `cards-index.json` also includes six kingdom information cards, making 192 printed cards. Every Advanced card/Monster record's normalized facts were visually checked; that flag does not certify all runtime interactions.

The preview enables 44 Spells, 28 Treasures, 42 Blessings and 27 Hero card effects. All 38 Hero counters are available. **45 effects remain reference-only** and are excluded from Magic decks or Hero Power actions. The exact IDs, names and missing decisions are listed in [runtime coverage](../docs/advanced-runtime-coverage.md). Those include Enslave's separate supply/lifecycle, multi-target and elimination-triggered choices, some reaction/event hooks and uncertain unsellable Treasure Winter exceptions.

Executable systems now include hidden player-owned cards and handoffs, ordered Battle Magic, counter/Tome cancellation, per-hit recovery, Hero pools/locks/stacks, Monster command actions/rewards, Study and Winter. They are documented in [Advanced implementation](../docs/advanced-implementation.md) and tested in [Advanced playtests](../docs/advanced-playtests.md). Their availability does not make every printed card or official campaign supported.

## Official maps and campaigns

The four-board location inventory contains 66 settlements, 11 mines and 22 lairs. Full terrain, road, river, Sea/coastal edges, Settlement flags, Entry hexes, shared half-hexes, joins and campaign exclusions still need certification. Only the partially reviewed 217-cell Wildlands graph is currently playable. None of the four boards has a completely certified mechanical graph.

The campaign catalog identifies 28 named starts: the introductory campaign, 17 Scrolls campaigns and ten Chronicle chapters. The publisher advertises 29 scenarios; the count discrepancy remains explicit. **No official executable campaign setup is complete.** Retrieved headers, correction fragments and purchasing allowances must not be converted into guessed fixed armies or victory rules. Campaigns 8 and 16 still require full instructions and applicable geometry. See [campaign/map audit](../docs/campaign-map-audit.md).

Custom content imports validate structural consistency, not source fidelity. Editor exports remain unofficial until their geography and setup are independently reviewed. Physical control-marker supplies outside Army of the Night, allied entry denial and the Ambush garrison interpretation also remain disclosed in [rules ambiguities](../rules/ambiguities.md).

## Async and online play

This release is a local shared-table game with algorithmic opponents. Separate-device rooms, actor-secured private views and server persistence are not enabled. The local Campaign Desk now supports return briefings, read-only replay, explicit AI delegation/takeback, table/alliance messages, pings and private notes. Easy/Normal/Hard policies have a separate [evaluation record](../docs/async-play.md). Those aids work in a running client or trusted save-file exchange; they do not provide cross-device synchronization, closed-browser progress or push/email delivery. Full saves contain all seats’ private data.

## Artwork

Source scans and full manuals are research-only. No public redistribution grant was established for the VASSAL bitmap components. The production build uses 28 original generated raster illustrations, including the new Arcane Library banner. Presentation art cannot establish printed mechanical facts or map topology.
