# Campaign and map source audit

Research checked on October 5, 2026. The application now includes all **28 named Campaign Book starts**, linked Chronicle play and reviewed mechanics from the four printed boards. Availability is separate from exact source certification: unresolved proof-copy instructions and map crossings remain qualified.

## Complete Campaign Book evidence

The Spanish publisher's [June 2025 preproduction review gallery](https://edicionesmasqueoca.com/diarios/2025/06/12/a-punto-para-pre-produccion/) publicly serves all **60 Campaign Book pages**. The publisher warns that these proof files can contain errors. The research pass retrieved every page and visually checked printed icons and setup instructions; OCR was an aid rather than authority. The research manifest's SHA-256 is `30ce2757fe37a2946ba652f8c1b1c6d01f9815b7cb349405f954498fa1654011`.

Only mechanical facts, short original summaries and source links enter the repository. Complete page scans, printed narrative and board artwork are not redistributed. The executable facts are in [published-campaigns.json](../content/published-campaigns.json); [campaign-catalog.json](../content/campaign-catalog.json) is its browse summary.

English corrections and legible printed English evidence resolve known differences from the proof copy:

- [Undying Rules v1.1](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying%20Rules%20v1.1.pdf), [Undying Campaign Notes v1.0](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying+Campaign+Notes+v.1.0.pdf), and [August 2024 clarifications and errata](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Burning+Banners+Clarifications+%26+Errata+0824.pdf). The retrieved August errata SHA-256 is `53d0ce6846a8dd7504645f64b84ad67381eb1b068e65234e9345a812fa938424`.
- [Corrected Campaign 6 Oathborn setup-card front](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/PastedGraphic-1+(2).png), useful for checking that particular quick setup. A quick-card remainder is distinct from the book's opening purchasing allowance.
- [Campaign 7 English printed header](https://i0.wp.com/theboardgameschronicle.com/wp-content/uploads/2024/11/img_3682.jpg), photographed in a [session report](https://theboardgameschronicle.com/2024/11/03/burning-banners-session-reports-campaign-7-fire-in-the-fields-of-ash/). It establishes Spring Year 1 through Autumn Year 2, six seasons, superseding the conflicting Spanish proof dates.
- The user-supplied English `Campaigns_at_a_Glance_v4.pdf` corroborates campaign season and board counts. Its SHA-256 is `1771288daac98d567bd2837a23ea34188fe0281bd0b35fde1d4cb88cb69a7a58`. It is a community overview with artwork permission, not a replacement for full setup instructions.
- The Spanish publisher's [April 2026 FAQ/errata discussion](https://edicionesmasqueoca.com/diarios/2026/04/06/faqs-y-erratas-detectadas/) was checked for additional corrections. Unverified player suggestions are not silently promoted to official rules.

The other supplied English PDFs—the rulebook, August errata, alternate player references and cheat sheet—support rule and reference checks. The cheat sheet and overview are secondary aids when they disagree with the rulebook or corrected Campaign Book facts.

## Implemented campaign scope

| Content | Starts | Implemented scope |
|---|---:|---|
| Introductory Invasion of Drefeld | 1 | Six allowed settlements, purchasing allowances, welcoming/hostile postures, three-season deadline and tie rule |
| Scrolls of Sandaria | 17 | Opening gold/income, finite supplies, controls, entry restrictions, free units, Heroes/Covens, special rules and timed victory conditions |
| Chronicle | 10 | Every chapter's starting setup and victory conditions, plus selectable linking to a later ending chapter |
| Full Chronicle with Bitter End | Additional mode | Spring 589–Summer 600, **35 playable seasons**, preserving game state rather than reloading each chapter's opening positions |

The publisher advertises 29 scenarios; the book names **1 + 17 + 10 = 28 starts**. Full-war and Bitter End are additional play modes. Whether the publisher counts one of these as its 29th scenario is not verified; no extra numbered campaign is invented.

Opening gold is a purchasing allowance, not a mandatory fixed roster. Allies may interleave deployment within their printed group. Required free counters and Heroes, optional Siege Engines, per-board spending limits and special Miner placement remain explicit. Basic play omits Advanced-only components. The Intro's Fjordland purchasing allowance is **15**, while **7** on a corrected quick card is the remainder after that quick setup's purchases. Campaign 12 begins with **no Coven**, following the English errata.

Linked play uses the ending chapter's victory conditions while preserving the evolving map, armies and decks. It includes the treaty transition, Fjordland's return, abandoned-lair decisions and the Bitter End defender timing. Winter remains an interphase: Spring, Summer and Autumn are the three playable seasons in each year. AI policies score the implemented source objectives and pause for explicit source rulings; they do not decide disputed printed facts on behalf of the table.

### Source qualifications retained

| Source issue | Treatment and limit |
|---|---|
| Chronicle 4 **Oronar** | Named in English living notes and the proof copy, but unmatched in the audited map. Setup asks for a recorded table ruling; no guessed alias is certified. |
| Chronicle 8 **Zarinar** | A Razed-marker name is unmatched in the audited base map. The discrepancy is retained and requires a table ruling for exact setup. |
| Chronicle 8–10 **Khorikar** | Listed under both Night and Oathborn controls. Opening requires an explicit ownership ruling. |
| Chronicle 9–10 **Belgunot** | Listed under both Oathborn and Fjordland controls. Opening requires an explicit ownership ruling. |
| Chronicle 8 sea entry direction | The proof says east while the relevant ocean is west. The discrepancy is disclosed rather than described as corrected publisher text. |
| Campaign 15 western entry list | Five Sea entries and the third road entry do not resolve exactly against the reviewed Wildlands footprint. Known road entries and remaining source qualifications are shown; precise disputed entries are not certified. |
| Bitter End duration | The text prints nine turns, while Spring 598–Summer 600 has eight playable seasons and the full war has 35. The implementation follows the dates and keeps the conflicting printed count in provenance. |

A source-backed selectable start with a table ruling is not a claim that every surviving source instruction is unambiguous. `officialExecutableSetupCount` in the browse catalog counts implemented starts; `certifiedExactPrintedSetupCount` remains zero because the general map qualifications apply.

## Four-board map evidence

The [VASSAL library](https://vassalengine.org/library/projects/Burning_Banners) identifies version 1.7, dated March 16, 2025. Its [module](https://obj.vassalengine.org/images/8/84/Burning_Banners_v1.7.vmod) has SHA-256 `edf9991723174a2c3105a70bbfe10a96da1f72f17581789d3524f7126a01927e`. The module provides board images and grid calibration. Its XML contains only two predefined setups, **Invasion of Drefeld** and **Empty Map**, and cannot supply the full Campaign Book by itself.

[Reviewed map records](../content/maps-reviewed.json) transcribe center terrain, settlement bodies/flags/loyalties, mines, lair pools, printed entry crests and individually inspected crossings. Name plaques can sit outside their settlement's actual hex; locations follow the illustrated settlement body. Reviews retain uncertainty records rather than marking unchecked crossings verified.

| Board | Image pixels | Grid origin x,y | Settlements | Mines | Lairs |
|---|---:|---:|---:|---:|---:|
| The Broken Coast | 1898 × 2446 | 6,23 | 15 | 3 | 4 |
| The Wildlands | 1899 × 2446 | 66,24 | 14 | 5 | 7 |
| Imperial Heartland | 1898 × 2446 | 6,−2 | 14 | 0 | 5 |
| Fields of Ash | 1899 × 2446 | 65,−2 | 23 | 3 | 6 |
| **Total** | | | **66** | **11** | **22** |

The lattice uses horizontal spacing `139.92431864335458`, vertical spacing `161.4`, and odd-column vertical offset `80.7`. Offset `(q,j)` converts to axial `(q,r)` with `r = j − floor(q/2)`.

Joining all four boards produces **854 distinct cells** from **868 source-center aliases**, merging **14 shared north/south edge cells**. The game preserves aliases so campaign facts and editor records can reference the source coordinates. Visible coverage is measured for partial cells: standalone cells with less than half a printed hex are prohibited, while joined board halves can restore a complete playable cell. Boards are joined at their actual lattice positions rather than separated by invented clear terrain.

### Corrections and acceptance checks

- The Wildlands `(10,1)` is Mountain; `(3,12)`, `(8,8)` and `(9,8)` are Sea. `(0,9)` has a dry Clear center and a Coastal flag, rather than being a Sea hex.
- Sunken Temple is a Sea-lair pool. Valley of Storm Giants belongs to Imperial Heartland `(13,5)`, following the illustrated lair body rather than its displaced label.
- Guild and Mara Mitai settlement loyalties remain distinct from player kingdoms and ordinary Neutral settlements.
- The rulebook page 18 shipping example is traced through six explicit waterway edges. Shipping can follow a waterway without treating every neighboring Major River bank as navigable; transverse river crossings retain their separate effects.
- Named mines retain their source identities, including Wildlands Trollshaft `(2,2)`, Black Deep `(6,3)`, North Drift `(11,1)`, Dwarven Falls `(7,12)`, and Endless Paths `(5,14)`.

The tests check joined-cell counts, reciprocal neighbors, source feature positions, partial-cell legality, the worked shipping route, campaign openings and victory timing. These are meaningful acceptance checks, **not proof that every coastline, river side or seam has exact printed fidelity**. Current records still list uncertain water classifications and crossings. The app's map reference exposes those qualifications; table edits remain available for a documented correction. Historical `maps-catalog.json` records image/location metadata, while `maps-reviewed.json` supplies new gameplay geography.

## Physical supplies and remaining boundaries

A [printed countersheet photograph](https://strategeek.net/wp-content/uploads/2024/05/img_0956.jpeg) in the [component review](https://strategeek.net/2024/05/03/ouverture-burning-banners-compass-games/) resolves Control supplies: **10 each** for Night, Oathborn, Fjordland and Empire; **12 each** for Goblins and Orcs; **3 Monster command markers per kingdom**. The photograph SHA-256 is `466b89db18689c4022476e62beb02043b511b4c0c87890c6b3ee69fa12390d15`. Campaign-specific caps replace those defaults, including reduced Night/Goblin supplies in the small coastal campaigns.

The card catalog contains all components, with **181 automated effects and five manual effects**; see [runtime coverage](advanced-runtime-coverage.md). Hosted async multiplayer remains deferred. Local pass-and-play, AI delegation, briefings, replay and trusted backup exchange are available, but a closed browser does not run AI turns and full backups contain every seat's private state. Neither campaign transcription nor structural map validation creates a remote privacy boundary.

Rare interrupted interactions can also require human adjudication. Horn of the Goblin King can strand a Huge Army in a welcoming Settlement when its last departure is blocked; no verified official movement-point exception was found. The existing game can switch from Advanced preview to Full tabletop without resetting the board, hands, counters or published objectives. Table controls require a recorded Rule/reason for the agreed recovery; this is not an automated official remedy. See [the table guide](full-tabletop.md).
