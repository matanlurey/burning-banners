# Streamlined play without changing the rules

Research and implementation checked October 5, 2026 UTC. The aim is to expose information players could calculate or inspect at the physical table and reduce navigation/bookkeeping. It does not pre-roll dice, reveal opponents' cards, automate an owner's strategic choice, restore earlier RNG or relax movement rules.

| Primary reference | Relevant pattern | Applied here |
| --- | --- | --- |
| [Battle for Wesnoth attack prediction source](https://devdocs.wesnoth.org/attack__prediction_8cpp_source.html) | Damage/survival probability distributions and expected remaining health help assess risk. | Analytic net-hit, wound, weakening and elimination distributions before an attack; normal/Ambush comparisons. Original implementation, no copied prediction code. |
| [Freeciv21 game shortcut manual](https://longturn.readthedocs.io/en/stable/Manuals/Game/shortcut-options.html) | Center-view, stack selection, map navigation, tile information and visible shortcuts reduce repeated map hunting. | Find locations/units/objectives, ready-unit filter, `/` search, Next Army/Focus/Overview and per-member movement routes. |
| [Civilization VI April 2019 update](https://support.civilization.com/hc/en-us/articles/37662702532499-Patch-Notes-April-2-2019) | Actionable turn notifications help a player return to the correct decision. | Current-decision briefing and map-focused unread actions/messages; existing local return preference. |
| [Civilization VI spring update](https://support.civilization.com/hc/en-us/articles/37687176307731-Patch-Notes-Spring-Update) | Clearer live status and notifications reduce uncertainty while continuing a game. | Persistent next-actor/phase labels, visible save status, pending manual resolution banner and per-seat handoffs. |

The earlier [async research](async-research.md) and [UI references](ui-reference-research.md) cover replay, correspondence, optional motion and other turn-based games. These are design inspirations; Burning Banners' own living rules determine legal play.

## Combat preview

A success is not necessarily a hit: normal combat subtracts opposing successes. The preview convolves each Light/Heavy die's distribution, accounts for modified success/critical thresholds and confirmation dice, then predicts net hits. It includes positive Ranged ties, Fortification, resolved dice effects and appropriate Ambush Strikes. Ambush reply odds use the surviving, possibly weakened defender after the opening Strike. An unoccupied garrison Strikes with its printed rating; ordinary terrain bonuses do not apply to Strikes.

Wounds are effective damage, capped by the current unit/stack's remaining hit capacity. A full ordinary Army takes two hits; a weakened/Fragile Army, Hero or Monster takes one. Hit-allocation comparisons show Army-first and Hero-first outcomes for both stacks, including their elimination chances. Players still allocate the actual hits. Fractions are averages across possible battles, not a forecasted die result.

The calculation reads public counters and resolved effects. Opponent hands, decks, future choices and the RNG are never consulted. Hidden Night Coven bonuses are withheld from viewers who do not control Night. Future Magic and an owner's different hit allocation can change the real outcome, so assumptions remain inspectable. Extreme percentages use <1%/>99% rather than rounding uncertainty into certainty. No selection or comparison advances the saved random stream.

Twenty thousand real engine battles across normal combat, Fortification, Ranged and Ambush were compared with the model; focused checks cover critical confirmations, stacks, Fragile units, revealed Monsters and hidden-information isolation. This is substantial targeted validation, not exhaustive enumeration of every possible card combination.

## Navigation and mobile

Search is case-insensitive across public location, unit, kingdom and hex names. Ready/objective/Settlement filters reduce the result list; secret Covens are not searchable. Selecting a result focuses the map without committing an action. Movement routes show every entered hex, each member's terrain cost, remaining movement, road allowance and the one-hex minimum where applicable. Players choose and commit the legal destination.

A selected attack puts odds before stack bookkeeping. On portrait phones, **Odds** opens a larger sheet and decorative unit artwork is collapsed so the forecast is immediately readable. Full tabletop controls remain accessible through the panel's Table tab. The save dialog offers a visible, selectable JSON backup even when clipboard permission is unavailable; attached file inputs make imports reliable through standard browser pickers.

Long campaign setup panels now scroll without hiding Start/Load controls. The map clips its layers without creating a native scroll container, so keyboard focus cannot move terrain or counters independently of the camera. Attached Heroes use a compact badge beside their Army; the tooltip and inspector retain the full Hero name. Battle receipts name the unit that was weakened or eliminated, making return briefings easier to scan.

Replay remains read-only. Automation never undoes a die or gives a player information that was not visible in that recorded seat's observation. Optional motion and sound remain user preferences, not rule timing.
