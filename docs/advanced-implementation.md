# Advanced rules implementation boundary

Advanced gameplay is disabled. This document records researched implementation requirements; the card catalog is not an executable effect library. Sources are the publisher's **Undying Rules v1.1**, September 23, 2024, §§13–18, and individual printed faces inspected inside the publicly downloadable VASSAL v1.7 module. The module establishes reference availability, not permission to redistribute its images. Generated illustrations cannot establish rule values, scenario setups or map topology.

Publisher rules URL: https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying+Rules+v1.1.pdf

Publisher rules hub: https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/

Reference module: https://vassalengine.org/library/projects/Burning_Banners

## Ownership and study

Cards belong to players, including when one player controls several kingdoms. Each player's initial hand contains three Spells and one Blessing from each controlled kingdom. Full Strength is a draw threshold, not a hand limit. After every kingdom turn, **all players** study. Glyph permits up to three different disciplines; Churn permits one. Study Spells optionally discards one then draws to three. Study Blessings optionally discards one total then draws to one per controlled kingdom. Study Treasures retrieves one owned Treasure into hand.

Study-marker pools: two kingdoms use two Glyphs and one Churn; three use three Glyphs and one Churn; four or more use four Glyphs and two Churn. Hidden markers are shuffled and distributed to live kingdom turns each season. Excess stays hidden. Autumn adds an extra Churn; Winter removes it. Collapsed kingdoms receive no marker.

## Explicit combat timing

Declaring an Attack creates Battle Magic. Its ordered windows are:

1. Attacker plays eligible Magic and powers; attacker allies may play Cantrips.
2. Defender and defender allies may play Cantrips.
3. Attacker and attacker allies may play Cantrips.
4. Ambush declaration and dice.
5. Normal magic permissions resume after the normal combat rolls, before hits; in an Ambush they resume after the opening Strike roll, before the return Strike.

This is not an alternating response stack. The defender cannot Negate a Cantrip played in the attacker's final window. Cards labeled Battle Magic require those windows, but other eligible cards can be used there too. Preserve separate hits and decisions between them: Cure Wounds can Recover an Army after the first of two hits, allowing it to survive the second. A digital ordering convention among allies should be stated where the manual does not specify one.

Ordinary Magic is playable during an Activation Phase of a kingdom controlled by the player. Cantrips can be used during other kingdoms' Activation Phases. Mage casters need not be activated or ready, but must satisfy printed requirements. Card ranges and minimum ranges are binding. No-effect play is prohibited. Default duration ends when the currently active stack finishes; if none is active, the effect resolves then expires. Printed duration overrides this. A Tome accompanies a Spell, inherits its Cantrip permission and loses its effect when that Spell is canceled.

## Hero requirements

Recruit from a kingdom's randomized unbuilt Hero pool. A Hero adds dice and abilities to an Army of its own kingdom. Flying requires both members to fly. Track each member's movement separately for pickup/dropoff; dropped units become finished. Joining a finished unit ends action eligibility. Hits may be allocated to Army or Hero. Eliminated Heroes rejoin the randomized pool only at turn end. Hero-card Lock does not finish its unit; unlock occurs at its kingdom's next Activation Phase.

A lone Hero cannot attack or be attacked and is eliminated when an enemy Army enters its hex. A Hero in an attacked Settlement commands the garrison and adds its abilities/dice. Stacks must advance together. A non-Feral Hero removes an Army's Feral restrictions; a Feral Hero does not.

## Monsters and Treasures

Monsters have separate random land/sea pools and are not units. All units are forbidden to enter Lairs. When attacking an unexplored Lair, reveal its Monster and ignore terrain. An opposing kingdom commands it, with at most three commanded Monsters per kingdom. Monsters cannot move, stack or advance. Each turn a commanded Monster gets one Strike, Slink Away or Pass. Strike ranges are Sea four, Flying three, Mage two, other one; Sea range follows Sea/Coastal edges.

Defeated Lair Monsters block exploration until Winter; wandering Monsters return to their pool. Combat victory grants printed gold and a Treasure; wandering Monsters grant only gold. Out-of-combat elimination grants no reward. Mage Monsters may cast eligible Spells, but no Blessings/Treasures or effects forcing caster movement/elimination.

Played Treasures become face-up owned cards. Study retrieves them for reuse. Selling yields two gold; a Treasure played that turn cannot be sold. Winter forces each player's hand-plus-owned holdings down to two by selling excess, then shuffles withheld Treasures back. Endless Satchel modifies that limit. Treasures are not generic equipment attached to Heroes.

## Correction fixtures before enabling

- Earth to Mud: immediate response to actual movement, never building/placement, prohibited transit hexes, Flying or Ship Movement.
- Summon the Dead: remove printed Monster eligibility. Summon Kraken/Morag: remove printed Monster/Garrison eligibility.
- Helm of Domination: count Spells/Treasures played by the opposing player both before and after the Helm during the current Battle Magic sequence; disregard Blessings and other players' cards.
- Regenerate, including Staff of Healing: never usable under siege; normal Regenerate still requires Recovery gold.
- Cure Wounds: preserve recovery between individual hits.
- Moryana's Fury: respond to Sea-edge crossing immediately, never retroactively at destination.
- Frostheart: blocks opponent Spells during Battle Magic, not Blessings or Treasures.

`content/cards-index.json` reconciles 192 printed cards: 52 Spells, 36 Treasures, 60 Blessings, 38 Hero cards and six kingdom information cards. Twenty mechanical examples have been visually checked; they remain unavailable in matches. Every card needs executable targets, costs, timing, decisions and correction tests before the Advanced profile can be enabled. OCR alone is insufficient.
