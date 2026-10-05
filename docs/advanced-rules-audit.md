# Advanced rules audit

This is an implementation and regression checklist, not a claim that the runtime supports every rule. Rule references use the printed page numbers of **Undying Rules v1.1**, the publisher's September 2024 living rulebook. The PDF diagrams for Heroes, stacking, Monster ranges and combat timing were visually checked as well as read through extracted text.

Primary sources:

- [Publisher rules hub](https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/) identifies the living rules and campaign notes as September 23, 2024 and says the August clarification sheet is incorporated.
- [Undying Rules v1.1](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying%20Rules%20v1.1.pdf), principally §§13–18, pp.32–55; §§3.2.1, 9.2–9.8 and 12.3.7 supply necessary cross-references.
- [August 2024 clarification and errata](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Burning%20Banners%20Clarifications%20%26%20Errata%200824.pdf) is a comparison source. Apply the newer living-rule wording when they conflict, and record that choice.
- [Publisher-linked VASSAL project](https://vassalengine.org/library/projects/Burning_Banners) supplies individual printed reference faces. Counter and card symbols must be checked visually; the rulebook's card guide supplements card text and does not replace it.

## State and setup checks

| Owner | Required state | Invariant |
|---|---|---|
| Player | Private hand; public owned Treasures; controlled kingdoms | A player controlling two kingdoms has one shared Spell hand, not two. |
| Kingdom | Randomized unbuilt Hero pool; eliminated Heroes awaiting turn end; Hero-card locks; commanded Monsters | Ordinary stacks contain at most one Army and one Hero of that kingdom. Enslaved Heroes are an explicit exception. |
| Global | Spell deck/discard; Treasure deck/withheld cards; kingdom Blessing decks/shared discard; land/sea Monster pools | Every unique card or counter occupies exactly one zone. |
| Pending resolution | Battle Magic window; current actor; parent Spell/Tome; remaining hits; advance; study choices; Winter sales | Save/import must preserve pending decisions and deterministic RNG, not silently resolve or redraw them. |

At setup, randomize unbuilt Heroes by kingdom and land/sea Monsters separately; shuffle Spell, Treasure and in-play kingdom Blessing decks. Every player draws **three Spells plus one Blessing from each kingdom they control**. This is a draw threshold, not a hand limit (§§13.1, 16, 16.1.3, 17.4.4).

Study pools count **kingdoms**, not players: two kingdoms = two Glyphs + one Churn; three = three Glyphs + one Churn; four or more = four Glyphs + two Churn. Keep the separate Autumn Churn out of the pool until Autumn. Distribute one hidden marker to each live kingdom turn; leave surplus hidden. Collapsed kingdoms receive none (§§17.1–17.2).

## Turn, study and Winter order

1. Resolve normal Income Actions and Income. Empire pays its Revolt Level; Night gains Coven income; Shashka maintenance remains in force (§13.2).
2. At Activation start, ready the active kingdom's units and commanded Monsters and unlock its Hero cards. Building, unit actions and legal Magic follow.
3. At turn end, all kingdoms recycle eliminated Heroes into their randomized unbuilt pools. Resolve collapse, then reveal that turn's study marker. **Every player** studies after **every kingdom turn**.
4. Glyph permits up to three different disciplines; Churn permits up to one. Spells: optionally discard one, draw to three. Blessings: optionally discard **one total**, draw to one from each controlled kingdom. Treasures: retrieve one owned Treasure; unavailable if none are owned. A discipline cannot repeat (§§17.3–17.4).
5. At season end, check the campaign ending condition before advancing. Add Autumn Churn on entering Autumn and redistribute the hidden pool for the next season (§13.2.1).
6. Winter: remove Autumn Churn from the pool and reserve it for next Autumn; redistribute the remaining study markers; return defeated Lair Monsters to their pools; force Treasure sales to the allowed holding limit; shuffle discards/withheld Treasures into decks; enter next Spring. Commanded Monsters and Abandoned Lairs remain (§13.2.2).

Drawing from an empty deck recreates it from that deck's discarded or eliminated cards (§17.5); this is also needed when a Treasure deck empties before Winter.

## Heroes and stacks

| Check | Required behavior | Source |
|---|---|---|
| Recruitment | Pay the kingdom's printed generic Hero-back build cost, then randomly reveal an unbuilt Hero. Use the revealed counter front for movement, dice and abilities rather than deriving stats from flavor or portrait art. | §14.2, p.34; printed counters |
| Placement | Entry hex, or in/adjacent to an unbesieged friendly Settlement; no hex with another Hero. Entry/in-Settlement builds are ready; adjacent builds are finished. Joining a finished Army makes the Hero finished, and vice versa. | §14.2 |
| Card-gained Hero | Place with any friendly Army, including a besieged Settlement; readiness follows the joined Army. | §§14.3, 19 “Gain” |
| Movement | Stack moves within both members' individual budgets. A moving unit can pick up a ready partner; count only movement actually spent by that partner. Dropping a member finishes the dropped member. | §14.6.1, p.35 diagram |
| Joint action | Members may activate jointly or separately. Joining a finished unit ends action eligibility. Stacked actions and an advance are joint. | §§14.6.1–14.6.4 |
| Abilities | Combine dice and abilities; Flying requires both members to fly. Characteristics are not shared. A non-Feral Hero suppresses the Army's Feral restrictions; a Feral Hero does not. | §§3.2.1, 14.4, 14.6.3 |
| Damage | For each hit, controller chooses Army or Hero; one hit eliminates a Hero. A surviving lone defending Hero does not prevent advance: it is eliminated if the enemy Army enters. | §§9.2.1, 9.3, 14.4 |
| Lone Hero | Cannot attack, be attacked or advance. Enemy Army entry eliminates it. A moving lone Hero can pass through an enemy lone Hero but cannot end there. | §14.6.5, p.36 |
| Garrison commander | A Hero in an attacked Settlement adds its dice/abilities to the unoccupied Settlement's garrison. If the defender takes a hit, Hero dies and attacker must advance. | §14.6.5 |
| Lock | Lock the card without finishing the unit; unlock at its kingdom's next Activation start. Ongoing printed powers continue when applicable; a locked activated power is unavailable. | §§13.2, 14.5.1–14.5.2 |

The content audit visually checked all six generic Hero backs: **Fjordland and Goblins cost two gold; Oathborn, Eastern Empire, Orcs and Army of the Night cost three gold**. This visible generic cost is paid before the random identity is revealed. The 38 revealed fronts supply individual movement and abilities: all have Mage; all six Night Heroes and Freyja also have Flying; Lieva and Ariadne have Ranged. Base combat dice are zero except Gond's printed one Heavy die. Hero-card Powers can add further dice or abilities under their stated conditions; do not treat those as unconditional counter stats.

Enslaved Heroes require their own control lifecycle (§12.3.7, p.28): cannot enslave an Army already with a Hero or **in any Settlement**; successful stack becomes ready; Enslaved Hero inherits Army movement/abilities; original kingdom abilities remain available. First hit kills the Enslaved Hero. Army immediately returns to its original owner, who must relocate it adjacent or lose it if it is freed in a hex welcoming to Night. Enslaved Hero cannot voluntarily unstack. If all four are in play, replace newly drawn Enslave Blessings as directed.

## Magic timing and nested decisions

During a player's controlled kingdom Activation Phase, ordinary Magic is available; during another player's Activation, only Cantrips are available. Kingdom-specific restrictions still apply: an ordinary Blessing is playable only during its own kingdom's turn. A Mage caster need not be active or ready; repeated casts are allowed. Validate caster, kingdom/ability requirements, actual range including minimum range, target, discard costs and a useful effect **before** spending a card (§§16.4, 16.6–16.7).

An Attack opens these windows (§§16.7.3–16.8):

| Window | Attacking side | Defending side |
|---|---|---|
| 1. Attacker | Attacker may play eligible Magic/Powers; its allies may play Cantrips. | Wait. |
| 2. Defender | Wait. | Defender and its allies may play Cantrips. |
| 3. Attacker again | Attacker and its allies may play Cantrips. | Wait; cannot reopen the completed response window. |
| 4. Ambush choice and rolls | Use resulting abilities/dice; both sides having Stealth forbids Ambush. | Same. |
| 5. Normal permissions resume | Ordinary phase permissions resume after normal combat dice and confirmations, or after the Ambush opening Strike. | Cantrips resume under normal phase permissions. |

Battle-Magic-only cards require windows 1–3, although other eligible cards can also be played there. This is ordered play, **not an alternating response stack**. Attacker's final-window Cantrip cannot be canceled by a later defender Negation, Banished to Meji or Undertow (§18.1.15, .34, .42).

Process hits individually, preserving intervention opportunities. Cure Wounds can recover after the first of two hits, so the second leaves an ordinary Army weakened; pre-applying both hits incorrectly eliminates it (§18.1.17). In an Ambush, opening Strike and its hits occur before a surviving target Strikes back. There are no win/tie/draw results in an Ambush, and Ranged tie benefits do not apply (§§9.6–9.8, 16.8.1).

Default effect duration ends when the currently active unit/stack's activation ends. With no active unit, resolve immediately and expire. Printed turn-long/ongoing durations override this. Caster elimination does not cancel already cast effects (§§16.7.1, 18.1.18/.24, 18.3 Orc .16).

A Tome accompanies a Spell from the same player's hand and inherits that Spell's Cantrip permission. Canceling the parent Spell cancels its Tome effect. A canceled card still counts as played; its costs and played-card history remain. Keep any child target/discard/choice attached to its parent action before returning to the current Battle Magic window (§§16.6.2, 18.1.14–15). Do not give a separate ordinary response window to the Tome.

## Monsters and Treasures

Monsters are **not units or Armies**. Units, including Flying ones, never enter a Lair. Attacking an unexplored Lair reveals a random appropriate land/sea Monster before combat; ignore terrain. Sea Lairs/Monsters can always be attacked by an adjacent active Army across a Sea edge (§§15.1–15.2).

Command belongs to an opposing kingdom; eligible opponents agree or choose randomly. Maximum three commands per kingdom; acquiring another can require choosing an old Monster to Slink Away. Defeat and Slink Away return command capacity. Monsters cannot move, stack or advance, and cannot be targeted by forced movement. Mage Monsters cast eligible **Spells only**, never Blessings/Treasures or self-eliminating spells (§15.3).

Each commanded Monster gets one Strike, Slink Away or Pass during its kingdom Activation, then finishes. Range: Sea four, Flying three, Mage two, other adjacent; Sea range follows Sea/Coastal edges. Ordinary Strikes ignore terrain and cannot target Fortified Settlements except printed exceptions. A Monster is defeated by one hit (§§9.7, 15.4–15.5).

Lair combat defeat gives printed gold plus a Treasure and leaves a defeated Monster blocking re-exploration until Winter. Wandering combat defeat gives **gold only** and returns Monster to its pool. Out-of-combat defeat gives no reward; an Ambush is combat and rewards apply. Four Fingered Fist has its specific printed/guide reward exception. A Feral Army without a non-Feral Hero receives no Monster reward (§§3.2.1, 15.2.1, 15.6–15.8, 18.1.46).

Wandering Monsters enter ready, commanded by the active kingdom; draw and examine before placing. No Lair, Monster/unit-occupied hex or Settlement, including Razed Settlements. Sea placement must be a Sea hex adjacent to Coastal terrain. Their hex remains prohibited to units. Abandoned Lairs cannot be attacked (§§15.7–15.8).

Played Treasures move to the public owned zone and can later be retrieved. Sell held or owned Treasures for two gold on the player's kingdom turn; a Treasure played that turn cannot be sold. Winter counts **hand plus owned** and forces sales down to two. Endless Satchel allows two retrievals and four total retained cards including itself. Curses have their printed no-sale/no-retrieval and removal costs (§§16.1.2, 16.5, 18.2.2/.29–30).

## Correction and regression fixtures

These are expected outcomes for executable tests and browser play tests; this document does not assert that they have passed.

| Fixture | Expected outcome |
|---|---|
| One player controls Orcs + Goblins | Initial hand is five cards: three Spells, one Orc Blessing, one Goblin Blessing. Both players study after either kingdom's turn. |
| Churn with empty Spells and owned Treasure | Choosing Spells draws to three; Treasure cannot also be retrieved. Glyph permits both, with each discipline used once. |
| Three-kingdom pool / entering Autumn / Winter | Pool starts 3 Glyph + 1 Churn with hidden surplus; Autumn adds one Churn; Winter removes that extra. |
| Recruitment then Hero dies during same turn | It cannot be recruited again until turn-end pool recycling; save/reload does not alter its identity or RNG result. |
| Two-gold Fjordland/Goblin recruitment versus three-gold other kingdoms | Correct kingdom-back cost is paid before random identity reveal; Gond's printed Heavy die and Freyja's Flying/Mage remain distinct from temporary card powers. |
| Freyja 8 MP picks up Drakken 3 MP after five hexes | Three joint hexes remain; Freyja spent eight, Drakken three. A fourth joint hex is rejected. |
| Lilith + Wolf Pack move two hexes, drop Wolf Pack | Wolf Pack finishes; Lilith may continue within her own remaining budget. Joining a finished member then forbids an action. |
| Flying Hero + ground Army; Feral Army + ordinary Hero | First stack cannot fly; second may loot/use Ship Movement/gain Monster rewards under its non-Feral Hero exception. |
| Stack receives two hits | Controller can lose Hero then weaken Army. Choosing Army twice eliminates Army; lone Hero survives only until enemy advance. Cure Wounds between hits gives a different legal outcome. |
| Lone Hero in city; attacker hits | Hero adds dice to city garrison; a hit eliminates Hero and requires legal attacker advance. Lone Hero in open terrain is not a valid ordinary attack target. |
| Hero-card Lock, then unit move | Unit stays ready and can move; card power stays locked until its kingdom Activation. Ongoing Lilith/Dominia Enslave modifiers remain. |
| Defender Negation after attacker final Cantrip | Rejected because defender window ended. A canceled earlier Spell still records played-card history and cancels its attached Tome. |
| Black Diamond and Festering Wounds | Heavy confirmation may generate further critical chains; Festering Wounds changes one chosen critical's confirmation only. Fortification never modifies confirmation success threshold. |
| Post-roll Tidal Shelter / Ray of Weakness / Cure Wounds | Effects modify pending hits/successes at their printed timing; Battle-Magic-only cards are unavailable after windows close. |
| Sleep during Battle Magic | Target Army and its stacked Hero finish; successful attacker Negation allows combat to continue. |
| Earth to Mud during path traversal | Only actual movement; immediate at entered hex, not after destination is revealed. Reject build, Place, Flying, Ship Movement and a hex where ending is prohibited. |
| Moryana's Fury | Intercept the actual Sea-edge crossing immediately; destination-only or retroactive triggering is rejected. |
| Monster attacked, survives; fourth command acquired | Appropriate opponent chooses command; full commander chooses one old Monster to Slink Away before new command. Monster receives no movement/advance action. |
| Monster Ambush defeat / ordinary magical Strike defeat | Ambush gives combat reward; out-of-combat Strike gives none. Wandering combat defeat gives gold without Treasure. |
| Sea Monster range path crosses inland edge | Reject range path even if geometric distance is at most four; adjacent Army can still attack Sea Monster across Sea edge. |
| Enslave success followed by first hit | Hero takes first hit, Army owner restores; owner chooses legal forced relocation when applicable. No generic hit-allocation prompt may preserve the Enslaved Hero. |
| Winter with three normal Treasures / owned Satchel + four others | First player sells one; Satchel player sells one to retain four including Satchel. Commanded and Abandoned Lairs remain, defeated Lairs reopen. |
| Staff of Plagues / Helm of Domination | Count opponent-player Spells/Treasures played before and after the item in the current Battle Magic sequence; exclude Blessings and other players' cards. |
| Regenerate / Staff of Healing under siege | Recovery is blocked; Regenerate's free action still requires normal Recovery gold. Cure Wounds follows its separate printed effect. |
| Frostheart | Opponent Spells blocked during Battle Magic; Blessings/Treasures available; normal Spell permissions resume after rolls. |

Current-source differences: v1.1 Enslave excludes **any Settlement**, broader than August's Fortified-only correction. v1.1 Earth to Mud and the printed face no longer specify August's “unoccupied” restriction. v1.1 §16.9 full paragraph removes a hostile Settlement's existing control marker, or razes if none, **only when unoccupied after the Strike**; August says occupied or not. Follow v1.1 full paragraph, not its abbreviated summary box, and retain this discrepancy in the implementation notes.

## Digital conventions that must be explicit

The book does not specify a priority order among allied players in one window, nor a serial order for simultaneous all-player study. Use a documented stable player order, allow a side to pass after all its eligible participants, and preserve each decision in saves. This is a digital ordering convention, not an extra tabletop rule.

Private handoff screens must conceal another player's cards during Cantrip responses and study. Skip a window automatically only when its participants have no legal decisions, not merely no ready Armies. Preview requirements/costs and show why a card cannot be played. Keep per-hit interventions available without forcing repeated empty confirmations. Optional animation must never delay legal input, obscure the active chooser or alter resolution/RNG; reduced-motion and disabled-motion modes should follow the same state transitions.
