# Campaign and map audit

Research checked on October 5, 2026. The two factual catalogs added in this pass are `content/campaign-catalog.json` and `content/maps-catalog.json`. Neither is an executable official campaign pack. The application must not turn partial headers, a screenshot of someone’s purchased armies, or a contents list into invented official opening positions.

## What was obtained

The current [publisher download hub](https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/) offers the living rulebook, living Campaign Notes, August 2024 clarifications, and a corrected **front** of the Oathborn quick setup card for Campaign 6. It does not currently expose the complete Campaign Book or all quick setup cards in its linked downloads. Search results for a full Campaign Book led back to the general rulebook and reviews, not a complete authoritative setup file. The BoardGameGeek file listing returned HTTP 403. Two potentially relevant session pages returned HTTP 429; no access restriction was bypassed.

The literal-plus publisher resources work when their percent-encoded-plus links return 404:

- [Undying Campaign Notes v1.0](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying+Campaign+Notes+v.1.0.pdf).
- [Clarifications and Errata, August 2024](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Burning+Banners+Clarifications+%26+Errata+0824.pdf). Re-downloaded successfully: 441,315 bytes; SHA-256 `53d0ce6846a8dd7504645f64b84ad67381eb1b068e65234e9345a812fa938424`.
- [Corrected Campaign 6 Oathborn setup-card front](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/PastedGraphic-1+(2).png). Successfully downloaded and visually inspected: 3,537,922 bytes. The catalog records its SHA-256.

The [current VASSAL library](https://vassalengine.org/library/projects/Burning_Banners) still identifies version 1.7, dated March 16, 2025. Its module SHA-256 is `edf9991723174a2c3105a70bbfe10a96da1f72f17581789d3524f7126a01927e`. The module XML has exactly two predefined setup entries: **Invasion of Drefeld** and **Empty Map**. There is no complete embedded campaign book. Only the Wildlands has named-location zones in the XML; the other three boards expose a hex grid and bitmap image but no mechanical terrain graph.

These downloaded board images, PDFs and card images remain private research evidence. Their public availability does not confer art redistribution rights. The production game continues to use original presentation assets.

## Campaign coverage

The catalog contains the introductory campaign, all 17 named Scrolls campaigns, and all ten named Chronicle chapters. Titles and reported durations/player counts are cross-referenced against the [contents transcription](https://strategeek.net/2024/05/03/ouverture-burning-banners-compass-games/). That is a secondary witness; its counts are explicitly marked as reported metadata. All entries have `playableOfficialSetup: false`.

The publisher advertises 29 scenarios. The publicly transcribed list resolves to **28 named starting setups**: 1 + 17 + 10. The Chronicle also describes a complete war that can continue beyond one starting chapter. Whether that accounts for the advertised 29th item is unverified. The catalog preserves the discrepancy and does not invent another campaign name or setup.

The source facts available beyond a title are useful, but incomplete:

| Item | Primary evidence captured | Still needed for an official playable setup |
|---|---|---|
| Introductory Drefeld | Corrected Fjordland starting gold 7; Fort Gorod hostile to both; other permitted settlements welcome their starting controller. Community module witnesses six permitted settlements. | Complete opening builds, postures and victory rules. |
| Campaign 1 | Orc quick setup entry edge corrected to east. | All other setup instructions and objectives. |
| Campaign 6 | Corrected Oathborn front: three King’s Crossbows, one Miner, starting gold 0, income 6, second in turn order. | Opponent, setup-card back, all Advanced setup, special rules and victory. |
| Campaign 7 | Army of the Night places one control in a non-city Imperial Heartland settlement before other opening builds. | Complete other faction setup, alliances and victory. |
| Campaign 12 | No opening Coven; Oathborn remove Razed markers without gold cost. | Complete setup and the surrounding special rules. |
| Campaign 13 | Oathborn allied with Resistance and hostile to Invader. | Complete setup and victory. |
| Campaign 14 | Belgunot begins Oathborn controlled and transfers peacefully to Fjordland upon entry; five western sea entry hexes; partial west edge excluded; no setup builds in/adjacent to Sunehammer. | Other setup, exact eligible entry cells, and victory. |
| Campaign 16 | Photograph verifies 3 players, Night versus Fjordland/Oathborn, northern boards, turn order, five seasons, Year 1 Spring–Year 2 Summer, Glyph 3/Churn 1; official posture corrections. | Complete kingdom opening builds, controls, covens/heroes and special victory procedure. |
| Chronicle chapter 4 | Goblins opening gold 33/one Hero/five listed controls; Orcs gold 35/one Hero/nine listed controls. | The other four kingdom setups and all complete campaign rules. |
| Chronicle chapter 7 | Replacement Wildlands settlement list. | The surrounding rule that determines what the list does. |

The Campaign 16 header was inspected directly in the [printed header photograph](https://theboardgameschronicle.com/wp-content/uploads/2025/03/bb_16_01.jpg), not inferred from the author’s purchases. Opening build gold means a purchasing allowance, so these fragments should not be turned into a fixed list of Armies without the accompanying placement and build rules.

## Four boards

`maps-catalog.json` records source image dimensions, image hashes, exact XML grid calibration, and named-location offsets. New locations were checked on private annotated copies of the source images. Locations follow the settlement illustration’s hex, not the often displaced town-name plaque. The new boards’ locations still require an independent cross-check before being described as an official executable import.

| Board | Image pixels | XML origin x,y | Settlement locations | Mines | Lairs |
|---|---:|---:|---:|---:|---:|
| The Broken Coast | 1898 × 2446 | 6,23 | 15 | 3 | 4 |
| The Wildlands | 1899 × 2446 | 66,24 | 14 | 5 | 7 |
| Imperial Heartland | 1898 × 2446 | 6,−2 | 14 | 0 | 5 |
| Fields of Ash | 1899 × 2446 | 65,−2 | 23 | 3 | 6 |

All grids use horizontal spacing `139.92431864335458`, vertical spacing `161.4`, and odd-column vertical offset `80.7`. Offset column `q`, row `j` becomes axial `q,r` with `r = j - floor(q/2)`.

The existing digital Wildlands retains 217 centers and its reviewed center-based terrain. Northern river/road topology and many coast sides remain partial. No other board’s full hex terrain, road, river, coast graph, or board join has been certified. It would be incorrect to fill the new boards with clear terrain by default and label that official geography. Shared edge half-hexes also need joined-board deduplication; merely concatenating four isolated grids will duplicate cells at the seams.

The named locations across four boards total **66 settlements, 11 mines and 22 lairs**. This is a location audit, not a reconciled physical component count or a promise that every campaign activates every settlement. The new boards’ settlement loyalty, port, city, fortification and wilderness flags are deliberately marked as awaiting a full mechanical import.

## Problems found during the second visual pass

- The Wildlands mines’ correct names and offset centers are Trollshaft `(2,2)`, Black Deep `(6,3)`, North Drift `(11,1)`, Dwarven Falls `(7,12)`, and Endless Paths `(5,14)`. The previous digital map’s coordinates were already present, but a new catalog draft initially matched several names incorrectly; those labels were corrected before delivery. A Campaign 6 Miner at Dwarven Falls maps to `w-7-12`.
- A low-resolution read of the northern Fields of Ash lair was misleading. Its actual label is **Corridors of Elemental Death**. The catalog uses the enlarged source label.
- **Oronar** appears in the publisher’s Chronicle chapter 4 correction as a Wildlands control location. It is not found in the current source map image or VASSAL named zones. This remains an explicit unresolved source discrepancy, with no guessed hex assignment.
- Catalog JSON consistency checks passed: unique IDs, 28 entries, all official setup gates false, coordinate conversion, valid offset ranges, and no colliding named locations within a board. These checks verify data structure, not missing terrain or campaign rules.

The concrete route to complete official campaigns is a readable complete Campaign Book and its setup cards, followed by board-center/side/seam review and executable acceptance scenarios for every special victory rule. The catalogs identify precisely which evidence is present and which facts are still missing.
