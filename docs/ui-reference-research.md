# Strategy-game interface references

Researched 5 October 2026. Scope: map readability, camera interaction and human-facing desktop/mobile UI. This is UI research, not opponent AI research. Sources below are developer/publisher material or official platform documentation. Screenshot observations describe the cited images; proposed dimensions and behavior are design targets for this project, not measurements of those games. References are for borrowing interaction patterns, not copying game artwork or proprietary layouts.

## What the references establish

| Reference | Verified source or screenshot observation | Useful pattern for Burning Banners |
|---|---|---|
| **The Battle of Polytopia** | Midjiwan's current store listing supports both portrait and landscape. One actual gameplay image shows city names on faction-colour plaques, separate unit numbers/status badges, a short top resource strip, and four large bottom commands with labels. Most other store images are promotional art and should not be mistaken for the UI. [Developer listing][poly] · [Gameplay image][poly-image] | Give settlements their own opaque label layer. Keep the map available while showing a small number of clear commands. Make ownership and readiness recognizable without reading tiny counter text. |
| **Into the Breach mobile** | Subset explicitly says its touch interface was revisited and redesigned for smaller phones. The Netflix-published battle image shows bright corner brackets around the selected tile, direction overlays, a compact resource strip, and dark bordered action/terrain cards outside the battle board. [Developer announcement][itb-dev] · [Publisher listing][itb] · [Battle image][itb-image] | Selection must stand out from ownership. Display a preview on the map and details in a fixed inspector. Subdue terrain behind tactical markings. The tiny eight-by-eight board differs greatly from Burning Banners' campaign map; its whole-board framing does not transfer. |
| **Civilization VI iPhone** | Aspyr documents an adapted unit-actions panel, collapsible corner controls, horizontal builder options, and full-screen notifications on small screens. Its product screenshots are largely promotional, so the documented adaptations are stronger evidence than assumptions from those images. [Aspyr mobile FAQ][civ-faq] · [Mobile product page][civ] | Recompose the mobile interface instead of shrinking the desktop sidebar. Collapse infrequent controls; reveal contextual unit actions; use a separate readable view for long logs or notices. |
| **Battle for Wesnoth** | The official guide makes the map the majority of the screen, with current-hex information and a selected-unit profile around it. Its Actions menu includes Next Unit and its Unit List includes map positions. The official 1.18 gameplay screenshot shows team-coloured unit bases, visible health indicators, a minimap and a persistent inspector. [Guide][wes-guide] · [Official screenshot collection][wes-shots] · [Gameplay image][wes-image] | Keep a compact inspector visible on desktop, make an army list easy to find, and provide Next Ready Army plus Focus Selected. Do not port the full desktop column unchanged to a phone. |

## Readability targets for this board

These are proposed targets, to be adjusted with real viewport screenshots and device testing.

| Element | Proposed implementation target |
|---|---|
| Working zoom | Start on the active kingdom's army and nearby settlements, showing roughly 6–10 hexes across the playable width. Whole-map Fit remains an explicit overview control. Fitting all 210 hexes is useful for orientation, not the default interaction scale. |
| Army counter | At working zoom, about 48–64 CSS px wide, with a strong faction band, a clear unit-type silhouette/portrait, large combat/movement numerals and one readiness mark. Do not try to fit faction name, full army name and every trait onto the counter. Put those in the inspector. |
| Overview counter | When the projected size is too small for readable statistics, replace the detailed counter with a simple faction/type marker and readiness cue. A selected marker retains a strong outline. An army list remains a reliable way to select it. Avoid rendering illegible miniature text. |
| Settlement label | About 12–14 CSS px at working zoom, with a contrasting opaque or near-opaque plaque and city/port/fortification badges. Place the label below the counter footprint. Prioritize selected settlement and cities when resolving overlapping labels. Hide low-priority labels at overview scale; selected details remain readable in the inspector. |
| State distinctions | Ownership uses faction colour plus emblem; selection uses bright brackets/outline; exhausted uses a clear spent badge or desaturation; weakened uses its own damage stripe. These states must not compete for the same small dot. |
| Panel text and controls | Aim for 16–17 CSS px body text, 14–16 px secondary text and at least 44×44 CSS px hit areas for frequent touch controls. Apple recommends 17 pt body/callout text and 44×44 pt iPhone/iPad targets; the CSS sizes here are our web adaptation, not a points-to-pixels equivalence. [Apple game-design guidance][apple] |
| Terrain | Flat overhead terrain shapes with restrained texture, clear coastlines/roads/rivers and a quiet clear-terrain fill. Ground remains one world-space layer. Use generated art as optional decoration rather than the information-bearing surface under every number. |

Do not keep full army names in 7–9 px labels simply to match a printed counter. The digital view can preserve the familiar counter colours and statistics while displaying the full name at a readable size in the inspector.

## Camera interaction

Apple's game-design guidance specifically recommends direct panning and two-finger pinch zoom for overhead/isometric games. It also stresses broad gesture areas and controls that appear only when relevant. These support the interaction model; the implementation details below are recommendations for this SVG application, not claims about Polytopia's internal camera.

- **Desktop:** drag anywhere on the board to pan, wheel/trackpad to zoom around the pointer, plus/minus and Fit as visible alternatives. Arrow keys pan only when the map has focus. Keep UI panels stationary.
- **Touch:** one finger pans; a short stationary tap inspects/selects; two fingers pan and pinch together. Starting a pinch cancels any pending tap. Preserve the world point beneath the pinch midpoint, including when that midpoint moves.
- Convert client coordinates with `getScreenCTM().inverse()` rather than assuming the SVG fills its bounding rectangle. This handles `preserveAspectRatio` letterboxing and prevents the zoom focal point drifting. MDN documents the SVG-to-viewport transform. [API reference][ctm]
- Track active pointers by ID. Handle `pointerup`, `pointercancel` and lost capture; keep drag/tap state separate. A proposed 6–8 CSS px movement threshold distinguishes a tap from a drag. Clear both-pointer pinch state before allowing the remaining finger to behave as a new gesture. [Pointer-event pinch example][pinch]
- Change only camera transforms/viewBox during gestures, coalesced through `requestAnimationFrame`; do not rebuild the board DOM or reset the camera on every pointer move or panel render. Wheel and pinch should have continuous bounded zoom rather than abrupt jumps.
- Keep terrain textures, rivers, roads, counters and label anchors in the same world coordinate system. No screen-space repeating plains backdrop or separate parallax motion. A stable texture should slide only with its underlying hex.
- Opening the inspector, changing tabs or receiving an autosave update must not recenter the map. Focus Selected and Fit are explicit. A modest boundary margin prevents panning indefinitely into empty space. Optional inertia can wait until direct drag and pinch are reliable.

No authoritative Polytopia gesture specification was found, so its exact pinch sensitivity, tap thresholds and zoom limits are not asserted here.

## Desktop and mobile action flow

**Desktop:** map dominates the window; use one compact right inspector for the selected army/hex and its next action. Put armies, recruitment and chronicle behind clear tabs or drawers. Keep current kingdom, gold and phase in a short header. Show Next Ready Army and Focus Selected near the army controls.

**Portrait phone:** use a compact top status strip and a bottom inspector with collapsed/expanded states. The collapsed state contains army/hex name, short stats and one primary contextual button. Expansion reveals traits, costs and forecast without replacing the entire map. A full army list or chronicle can occupy a separate scrollable sheet. Honor the home-indicator safe area. Opening long information is explicit; ordinary selection should not cover most of the board.

**Landscape phone:** keep the same interaction model, with a compact side inspector where space permits. Use the available height for the map instead of forcing the desktop header/sidebar proportions.

Suggested action sequence: select army → select destination/target and preview route/cost or battle forecast → press the labeled primary action once. Tapping the board never immediately rolls combat or spends gold. The action button is the commitment; do not add a second confirmation dialog for every move, recovery or recruitment. Reserve an extra confirmation for destructive reset/replacement, or ending a turn while ready armies remain. This policy is our recommendation, not a verified rule shared by the reference games. Do not borrow Into the Breach's Undo Move as a game feature: Burning Banners' random outcomes and existing no-reroll policy need separate treatment.

## Acceptance checks

At a 390×844 portrait viewport, a player can identify the active army, read its selected name and stats, find a nearby named city, choose a destination and commit without horizontal page scrolling. At working zoom, army counters and settlement labels do not cover each other. At a 1440×900 desktop viewport, the inspector leaves the majority of the width for the board. Switching inspector tabs does not move the camera. Ten successive wheel zooms keep the same chosen point under the cursor; a two-finger gesture cannot execute a tap or action when either finger is released. Dragging terrain does not cause a separate plains backdrop to slide at a different speed.

[poly]: https://play.google.com/store/apps/details?id=air.com.midjiwan.polytopia&hl=en_US
[poly-image]: https://play-lh.googleusercontent.com/TcWV5dgLRKeZsCDKFXdcjHxSv0Z7lzodcCjOfFEn3TlS_GHKx2NVEhYI_JsVTvQSoWtOOKWQYch3El3J0ZwL=w1600
[itb-dev]: https://new.subsetgames.com/itb_ae.html
[itb]: https://play.google.com/store/apps/details?id=com.netflix.NGP.IntoTheBreach&hl=en_US
[itb-image]: https://play-lh.googleusercontent.com/dezXnPVi3-665EQuy5rUyKx7IpYqfhtvqDEi1X586I9ITXTozg2RAO_RE83AzBMzih06uWmiDOSaLO8b8P7Bfw=w1600
[civ-faq]: https://support.aspyr.com/hc/en-us/articles/115005650223-Civilization-VI-iOS-FAQ
[civ]: https://www.aspyr.com/games/civilization-vi-mobile
[wes-guide]: https://wiki.wesnoth.org/GettingStarted#The_Game_Screen
[wes-shots]: https://wiki.wesnoth.org/Screenshots
[wes-image]: https://www.wesnoth.org/images/sshots/wesnoth-1.18.0-2.jpg
[apple]: https://developer.apple.com/videos/play/wwdc2024/10085/
[ctm]: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM
[pinch]: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
