# Advanced interrupts and extra Attacks

Audit: October 5, 2026 UTC. This expansion increases automatic coverage from 169 to **181 of 186 effect records**. All components remain available through Full tabletop. The two built-in digital scenarios are original diagnostic setups, and the editable four-board templates still require printed calibration.

## Source basis

The primary rules witness is Compass Games' [Undying Rules v1.1](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying%20Rules%20v1.1.pdf), especially §§14, 16 and 18. The [publisher downloads page](https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/) identifies the living rules and incorporated August corrections. Printed card faces in the [VASSAL v1.7 module](https://vassalengine.org/library/projects/Burning_Banners) supplied mechanical wording where the guide was abbreviated. Source images and manuals are research-only; they are not redistributed as game assets.

| Effect | Automatic decision |
| --- | --- |
| Ring of Invisibility | Respond to the chosen Mage Hero's hit; relocate that Hero alone to a legal hex within two, including its original hex. Later hits stay with the original occupants. |
| Horn of Udun | Respond before enemy entry and relocate an eligible friendly/allied Army; recheck the interrupted move or advance. |
| Freyja | Save an eligible Fjordland Hero from elimination and place it beside Freyja; preserve its lock, lock the source and leave its Army behind. |
| Shapeshift | Save the selected Night Mage by placing that Hero alone in a live controlled Settlement. |
| Knives in the Dark | Replace Coven discovery with an unfortified two-Heavy Strike. Convert the Coven only if every original target was eliminated; an escape counts as survival. |
| Your True Rulers | Protect Covens from discovery/removal and finish units built in them. |
| Spy Network | After an attacking Goblin unit actually inflicts a normal-combat or Ambush hit, choose to retrieve the card or leave it discarded. |
| Luna | Choose an adjacent Hero/Monster; a successful roll eliminates that target directly. Failure offers a random Spell discard or voluntary Luna sacrifice, even when Spells remain. |
| Kagash | Select an ordered pair of adjacent enemy Armies within range, then Strike one with the other's printed stack rating; do not activate the borrowed Army. |
| Sofia | Following an actual advance, optionally move one legal hex or stay, then optionally make another legal Attack. |
| Haga-Tor | As a winning normal-combat defender, optionally advance and make an extra Attack, keeping the proper kingdom's control/loot decisions. |
| Fury of the Ancestors | As the winning Oathborn stack, optionally advance and Attack with an additional Heavy die; declining does not award advance loot. |

## Digital conventions and remaining questions

- Freyja can rescue herself under the literal card conditions. A sacrifice-related elimination can be rescued, consistent with the guide's Cronax example. The elimination snapshot is tentative until response choices finish; an earlier elimination log can precede the later rescue receipt.
- Coven discovery uses the corrected information-card trigger: enemy **unit** movement ends before its action. The living prose's narrower Army wording is recorded as a source mismatch.
- Your True Rulers resolves automatic protection before offering Knives. A protected Coven remains temporarily valid beneath a razed Settlement until protection expires. Neither competing-card priority nor this razed-Coven interaction had a separately verified designer ruling.
- Kagash follows the printed two-enemy-**Armies** target restriction; the guide uses broader unit language. Lone Hero and Monster substitutions are not inferred.
- Within a response window, allied players use the saved player order. The printed attacker/defender/attacker Battle Magic phases remain intact; this player ordering is a digital convention.
- Magic can remove or finish the attacking Army, or make its declared target illegal. At the end of Battle Magic, the engine cancels that battle and finishes the attacking activation. It does not roll a stale combat forecast or invent an advance.

The five remaining automatic gates are **Whips of Grom, three Enslave cards, and Siskar**. Whips requires an enforced Attack obligation across movement and enemy interruption. Enslave needs a controller, four-marker supply, forced first-hit release and legal return-placement lifecycle; the separate marker has Mage and no printed combat dice, inheriting its Army's movement/abilities. Siskar needs a selectable pause for every actual d6 event, including criticals and noncombat rolls. Full tabletop can adjudicate these effects; selecting their physical cards does not certify automatic enforcement.

## Interface and verification

Response panels name the chosen-hit, rescue, entry, Coven and victory windows. Extra-Attack buttons include the current expected hits dealt/returned and stack-loss probabilities, with larger dark text and native panel scrolling on small screens. Merely viewing these odds consumes no random dice. Pass-and-play handoffs preserve the privacy curtain; automatic briefings wait until a resumed game or ordinary turn handoff instead of interrupting each combat/Study response. The Campaign Desk remains available on demand.

The targeted interrupt suite covers saved hit choices, rescues, Coven outcomes, post-combat choices, Huge-stack teleport legality, magical joining of finished stacks and interrupted Flying transit. Nine validated positions can be regenerated with `node tests/fixtures/browser-interrupts.mjs` and imported through the ordinary Campaign UI. See [current verification](verification.md) for the final regression, browser and AI results.
