# UI browser checks

UI revision reviewed October 5, 2026. This record distinguishes rendered Chrome checks from source-level camera/gesture checks. The rules engine and opponent behavior were not changed by this revision.

## Rendered browser checks

Checks used real Chrome with CSS frames sized for desktop, tablet and phones. They were not mobile device emulation and did not use physical touchscreen hardware. A phone-sized frame verifies layout and browser interaction at that size; it does not establish hardware touch behavior.

| CSS frame | Final observed result | Map height |
| --- | --- | --- |
| 1280×800 | Desktop map and inspector; drag, wheel, keyboard and camera retention passed. | 655 px |
| 768×1024 | Tablet map and bounded inspector. | 879 px |
| 390×844 | Phone map, bottom details sheet, movement/combat/capture passed. | 668 px |
| 360×740 | Smaller portrait map and details sheet; selected name stayed above the sheet. | 564 px |
| 320×568 | Compact portrait map; selected card and name cleared both heading and sheet. | 392 px |
| 844×390 | Short landscape map and inspector; initial clipped controls corrected and retested. | 245 px |
| 736×414 | Mobile landscape map with details docked to the right. | 257 px |

All seven final frames had zero horizontal and vertical body overflow. Zoom/overview controls stayed within the map and the action bar stayed within the frame. The preview-only `/__qa` route offers these sizes for reproducible inspection; it is not included in the production static build.

### Completed interaction observations

- On the final build, a human used teaching seed 6, collected income, tapped the highlighted `w-5-10` destination, moved Iron Legion, selected Rangers, reviewed the forecast, attacked, and chose Take control. The history confirmed 3 attacker / 1 defender successes, elimination of Rangers, and control of Far Tumed; Oathborn gold reached 11.
- A local saved game survived reload, including the subsequent Fjordland income phase.
- Ending a turn while two armies remained ready opened one confirmation. Cancel preserved the current turn; confirming produced the human Fjordland handoff, and Reveal returned to its income phase.
- A 60 CSS px desktop drag changed camera position by 54.546 world units at scale 1.1, matching screen/world conversion within measurement precision.
- Pointer-anchored wheel zoom in/out restored the camera. Four plus/minus cycles also returned to the original camera.
- A final resize-limit regression check zoomed the phone map to scale 1.7, resized to desktop, and pressed Zoom in again. Both resized and subsequent scales remained 1.7; world center was preserved. This corrected a case where an oversized resized scale could make Zoom in move outward.
- Enter selected a focused army marker; arrow keys panned the map.
- Opening the Muster inspector retained the camera exactly.
- Next army selected and focused King's Crossbows after closing the phone sheet.
- At 320×568, the final selected card occupied y=137–201 and its name y=205–230. The heading ended at y=125.19 and the sheet began at y=240.
- The crowded Zarinbar plaque cleared Miners: plaque y=260–285, card y=297–361. Far Tumed's plaque also cleared both adjacent combat counters.
- A browser hit test at the legal `w-5-10` circle returned that hex rather than a displaced town button. Pointer clicking and Enter on SVG destinations both produced the movement preview.
- The six-kingdom overview displayed 18 separate 22×24 faction badges with role initials instead of overlapping portraits. Working zoom retained the larger portrait cards.
- No application-origin warning/error appeared in the captured console log sample; unrelated browser extension messages were excluded.

### Current presentation

Working-size army cards are 60×64 CSS px. Army names use 14 px text and town names 13 px. At overview zoom, pieces become smaller and lower-priority labels/details are hidden. Terrain, roads and rivers share one world-space layer; readable pieces and labels use screen-space placement from their world anchors. Inspector tabs and ordinary rerenders retain the camera.

Phone layouts use a bottom inspector in portrait and a side inspector on short screens. Selected-army focus accounts for measured card/name dimensions and the visible map area. Town placement scores actual labels, icons, button hitboxes and legal destination centers, with leader lines to their world anchors. Decorative roads and rivers do not intercept map clicks. The design rationale and reference screenshots are in [UI reference research](ui-reference-research.md).

## Source-level camera and gesture checks

The independent reviewer exercised actual compiled application functions with controlled inputs. These are source-level numeric/event checks, not real device gestures.

| Check | Cases | Result and scope |
| --- | ---: | --- |
| Focal zoom anchoring | 162 | Passed across 390/768/1200 px widths, three aspect ratios, nine anchor positions and zoom in/out. The selected world point remained beneath its screen anchor when bounds did not intervene. |
| Extreme pan bounds | 18 | Passed for oversized and ordinary view spans with extreme positive/negative camera positions. |
| Gesture handlers | 5 | Passed: releasing each possible finger from a three-pointer pinch rebased the remaining pair; cancellation and lost capture cleared the gesture; drag conversion matched the current scale. Pointer-down keyboard focus was also checked in the handler harness. |
| Mobile focus geometry | 5 | Passed using controlled CSS-derived geometry for 320×568, 375×568, 375×667, 393×852 and 736×414. The selected card/name remained outside the heading and panel. Real browser layout remains the authoritative check. |

Review findings corrected during implementation: gesture state surviving a board rerender; an interrupted three-pointer pinch becoming an incorrect pan; focus hidden by short-screen panels; inconsistent mobile breakpoints; and pointer prevention leaving keyboard focus outside the map. These checks support the implementation without certifying physical touch performance.

## Screenshot record

| View | Before | Final after |
| --- | --- | --- |
| Desktop | [before-desktop.jpg](screenshots/before-desktop.jpg) | [after-desktop.jpg](screenshots/after-desktop.jpg) |
| Phone | [before-phone.jpg](screenshots/before-phone.jpg) | [after-phone.jpg](screenshots/after-phone.jpg) |

The dense-map semantic overview is recorded in [after-phone-overview.jpg](screenshots/after-phone-overview.jpg). Screenshots show the game inside its responsive browser-check harness.

## Final acceptance

- [x] Inspect crowded city/army labels at working zoom and the dense faction overview.
- [x] Retest the corrected landscape layout and its primary controls.
- [x] Check delegated hex-click fallback and keyboard selection.
- [x] Repeat the human phone income/move/attack/resolution/capture flow after the final patch.
- [x] Capture final desktop and phone screenshots.
- [x] Run the strict TypeScript build and all 30 automated tests against the final UI snapshot.

Physical touchscreen hardware was unavailable. Audio, prolonged human play, accessibility across assistive products, AI strength and fixture balance are not certified by this record. Full published-game fidelity remains subject to the separate [verification limits](verification.md#fidelity-limits).
