# Design and verification findings

Experience thesis: moving an army into position should feel like committing a seasonal plan, with the terrain, recruitment network, dice and capture consequences visible before the decision.

The first teaching fixture has three seasons, six starting armies and two kingdoms. It uses inspected printed army values and a reconstructed Wildlands grid. Its opening placements, treasury and objective are explicitly original, because the full official introductory campaign setup and victory paragraph were not obtained. It is not a certified reproduction of that scenario.

The six-kingdom sandbox demonstrates separate kingdoms and scenario alliances, with independently assignable local human or algorithmic AI controllers. Setup and objectives are original. It uses the same engine as the smaller fixture.

Correctness and enjoyment are separate. Deterministic engine tests and bot simulations check legal movement, attacks, results, phases, saving, resources and terminal outcomes. Final real Chrome checks demonstrate a human phone-sized income/movement/combat/capture flow, save reloads, pass-and-play handoff and desktop camera/keyboard controls across seven responsive dimensions. These bounded checks do not establish overall enjoyment, AI strength or fixture balance. See the [browser acceptance record](ui-browser-checks.md).

The October 5 UI revision follows [strategy-game interface research](ui-reference-research.md): quieter terrain, a single moving world layer, readable fixed-size pieces and labels, a compact desktop inspector, and phone panels. Working-size army cards are 60×64 CSS px, army names 14 px and town names 13 px; overview zoom uses smaller markers and suppresses lower-priority detail. This preserves a readable digital view without reproducing every printed counter at miniature scale.

Camera gestures update transforms through animation frames instead of rebuilding the board during each move. Wheel zoom anchors beneath the pointer; drag converts screen distance into world distance; pinch tracks pointers separately and cancels tap selection. The review identified and corrected lost-capture cleanup, three-pointer transitions, short-screen inspector occlusion and map keyboard focus. Opening Muster preserved the camera exactly in a real browser check. The inspector measures the army card/name and visible map area when focusing an army on a phone. Final browser checks confirmed crowded-label separation, unobstructed destination clicks and bounded landscape controls. At overview zoom, compact faction badges separate the eighteen sandbox armies.

The action flow remains select army → choose destination or target → inspect cost/forecast → commit the labeled action. An extra confirmation is used when ending a turn with ready armies, with cancellation verified to preserve the turn. No rules-engine or opponent changes were made as part of this revision.

The map, unit and rules provenance records identify inspected values, interpretations and missing data. Advanced timing and a card inventory were researched, but Advanced play stays disabled until complete executable card effects, player-owned hands, hero stacks and all reaction decisions are implemented and tested. This avoids mixing Basic and Advanced into a falsely named ruleset.

Next fidelity gates: obtain and inspect complete native campaign setups; review every river, road, coastline and excluded edge; certify counter supply; implement all Advanced decisions and card effects; then playtest on phone and tablet against the physical board.
