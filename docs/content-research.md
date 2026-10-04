# Burning Banners content research

Research date: October 4, 2026. The published subtitle is **Rage of the Witch Queen**.

## Evidence acquired

- Compass Games current product/download hub: https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/
- Official Undying Campaign Notes v1.0 (September 2024), retrieved as 1,449,299 bytes using the literal-plus URL: https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying+Campaign+Notes+v.1.0.pdf . The publisher's percent-encoded-plus link returned 404 in both direct and web retrieval. The literal-plus resource downloaded successfully. Both pages were extracted and the first page was visually inspected.
- Current living rulebook v1.1 was obtained by the separate rules workstream. Its rule 8.2.2 governs visible half-hexes; section 1.3 defines center-based terrain interpretation.
- VASSAL listing: https://vassalengine.org/wiki_old/wiki/Module:Burning_Banners . Version 1.7 is dated March 16, 2025 and requires VASSAL 3.7.15 or later.
- VASSAL 1.7 file: https://obj.vassalengine.org/images/8/84/Burning_Banners_v1.7.vmod . Downloaded 47,732,730 bytes; SHA-256 `edf9991723174a2c3105a70bbfe10a96da1f72f17581789d3524f7126a01927e`.
- VASSAL v1 was also inspected as a historical cross-check. Neither version supplied the full Campaign Book or quick setup cards. The only named embedded scenario in current 1.7 is Invasion of Drefeld, alongside an empty map option.

VASSAL is a community implementation and a useful image/setup witness, not an independent replacement for the publisher's rules. Its public availability does not grant redistribution permission. All downloaded scans and PDFs remain research-only; the public application uses original generated art and mechanical definitions.

## Reconciled inventories

The current VASSAL saved setup contains these decks, matching the publisher's advertised 192 playing cards:

| Kind | Count |
|---|---:|
| Spells | 52 |
| Treasures | 36 |
| Kingdom Blessings | 60, ten per kingdom |
| Hero cards | 38 |
| Kingdom information cards | 6 |
| Total | **192** |

Hero card distribution is Oathborn 6, Army of the Night 6, Eastern Empire 6, Orcs 6, Fjordland 7, Goblins 7. The Night deck contains three separate Enslave cards; its ten-card deck must not be reduced to eight unique card names. Treasure cards 17–19 are separate Treasure Hoard cards.

The monster pools contain **29 land monsters and 7 sea monsters**. The 44 Army types normalized for the application cover the six kingdoms and **146 Army counters**: Oathborn 26, Fjordland 20, Night 23, Empire 24, Goblins 27, Orcs 26. Full and weakened printed faces were visually checked. Non-Fragile counters retain their printed combat dice on the weakened side; weakness is a survival state rather than a universal dice penalty.

The publisher's 240 large counters and other advertised component totals include more than Armies; they cannot be used to guess an Army roster, monster distribution, card manifest, or control supply. VASSAL's cloneable control-marker piles and preset copies do **not** establish physical finite supply. This research does not assert kingdom control-marker limits.

## Map geometry

The extracted Wildlands board is 1,899 × 2,446 pixels. VASSAL's source-calibrated HexGrid uses horizontal center spacing 139.92431864335458, vertical spacing 161.4, origin x=66/y=24, and alternating column vertical offset 80.7.

Application coordinates are flat-top axial coordinates. With source offset column q and offset row j: `r = j - floor(q/2)`. The 14 columns each include rows 0–14, and the seven even-numbered columns include southern half-hex row 15. Those row-15 centers are at y=2445, within the image boundary, and satisfy the living rulebook's half-or-more-visible condition. This produces **217 included cells**. A first intermediate 210-cell interpretation omitted the southern half-hexes; that was corrected before final content freeze.

The source image was overlaid with coordinate labels for center-by-center review. Wilderness is determined from the hex center, not from a mountain, tree, coastline or tower extending from a neighboring cell. Source named zones support settlement, mine and feature location verification. Coast is an additional boolean so coastal Forest and Swamp cells do not lose wilderness behavior.

**Geometry center calibration is reviewed; full gameplay topology remains partial.** Southern Drefeld road segments and Shar River crossings are normalized, with reciprocal-edge and neighbor checks. The full northern Kars/Njalselva river network, all coast/lake side boundaries, every road path, multi-board joins, and source ambiguous boundary terrain are not certified complete. Adjacent coastal channel behavior in the demonstration is an explicit digital reconstruction. The application must not describe the whole map's movement topology as an official verified map pack.

The other three board images are obtainable in VASSAL (The Broken Coast, Imperial Heartland, Fields of Ash), but their complete mechanical graphs and joins have not been imported.

## Introductory Invasion of Drefeld

These six source locations are verified in the printed map and embedded setup note:

| Location | Offset column,row | Axial q,r | Starting relationship |
|---|---|---|---|
| Norstead | 2,8 | 2,7 | Fjordland controlled |
| Far Tumed | 5,9 | 5,7 | Fjordland controlled |
| Barlas on the Lake | 3,13 | 3,12 | Loyal Fjordland |
| Zarinbar | 5,11 | 5,9 | Loyal Oathborn |
| Shaded Vale | 8,14 | 8,10 | Oathborn controlled |
| Fort Gorod | 9,11 | 9,7 | Neutral, fortified, port |

The embedded note says that only these six settlements may be attacked or occupied. Official living Campaign Notes correct the postures: **Fort Gorod is hostile to both players; other settlements are welcoming to the kingdom controlling them at the start.** A publisher erratum corrects the Fjordland quick setup card's first gold instruction to 7 Gold.

The VASSAL setup is an incomplete witness: most starting Army purchases/placements are left for players; it does not provide the complete official opening instructions and victory condition. Its season marker and ending marker show a first-year three-season battle, and its turn track puts Oathborn before Fjordland. Those partial observations do not certify the whole scenario.

The runnable **Drefeld teaching battle is explicitly original**. Its initial Army purchases/placements, Oathborn opening gold, and two-settlement objective are demonstration choices. Its initial units, faction counter values, six settlement locations and basic rule procedures are grounded in source evidence. It is not labelled official. The complete official introductory campaign requires the missing Campaign Book/setup cards and final map-side review.

## Campaigns 8 and 16

Campaign 8 is **Goblin Apocalypse**. Available session reports and an unboxing contents transcription identify six seasons, five players and two maps, but complete setup, factions, exact objectives and exceptions were not obtained. It remains unavailable as an official scenario.

Campaign 16 is **Assault in the North**. A legible photograph of the actual printed scenario header establishes three players; Night invader vs Fjordland and Oathborn resistance; the northern two maps; turn order Fjordland, Night, Oathborn; five seasons; start Year 1 Spring and end Year 2 Summer; Glyph study value 3 and Churn 1. Its photograph is at https://theboardgameschronicle.com/wp-content/uploads/2025/03/bb_16_01.jpg , presented in the original session report https://theboardgameschronicle.com/2025/03/05/burning-banners-session-reports-campaign-16-assault-in-the-north/ . The living Campaign Notes supply corrected neutral postures. The complete opening setup and special victory/King-is-Dead procedure remain unimported. This header photograph alone does not enable the official campaign.

The designer-hosted video `_u_ifDZVdYQ` has internal title “210308 Banners Basic Tutorial,” indicating an early prototype tutorial. It cannot by itself certify current printed campaign setup. Its public caption endpoint returned HTTP 429; no bypass was attempted.

## Evidence asset paths (private scratch)

- `research-assets/Burning_Banners_v1.7.vmod`, `buildFile.xml`, `vassal-inventory.json`
- `research-assets/undying-campaign-notes.pdf`, `.txt`, `campaign-notes-page1.png`
- `research-assets/images/The_Wildlands.jpg`, other retrieved images and counter contact sheets
- `research-assets/map-top-labeled.jpg`, `map-bottom-labeled.jpg`, `map-bottom-strip.png`
- `research-assets/The_Invasion_of_Drefeld.vsav.txt` and older decoded setup files
- `research-assets/scenario-photo-1.jpg` (printed Campaign 16 header)
- `research-assets/normalized-map.json` and extraction script

These are evidence artifacts, not public production assets. The public content manifest records names and provenance without including the copyrighted scans.
