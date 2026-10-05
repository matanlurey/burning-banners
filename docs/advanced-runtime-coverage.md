# Advanced runtime coverage

Release audit: October 5, 2026 UTC. The selectable profile is **Advanced preview**. The research catalog contains every base-game card, but a verified face is not evidence that its complete decision flow is implemented. `src/advanced.ts` exports `runtimeLimitations`; those entries are omitted from playable Magic decks and Hero Power actions. The Codex retains them as clearly marked reference records.

| Content | Cataloged | Supported effects | Reference-only effects |
| --- | ---: | ---: | ---: |
| Spells | 52 | 44 | 8 |
| Treasures | 36 | 28 | 8 |
| Blessings | 60 | 42 | 18 |
| Hero card effects | 38 | 27 | 11 |
| Total | 186 | 141 | 45 |

All **38 Hero counters** can be recruited and contribute their checked printed statistics. The supported Hero-effect count includes passive effects and Gond’s Combat Rating; it does not mean 27 active buttons. The eleven reference-only Hero effects remain unavailable. There are also six kingdom information cards, bringing the physical card inventory to 192. All **36 Monster counters** are available through their finite land/sea pools.

## Reference-only effects

This table is generated from the compiled runtime’s actual gate list and the authoritative catalog. It describes missing decision flows, rather than inventing substitute rules.

| ID | Card / Hero | Unimplemented decision or source uncertainty |
| --- | --- | --- |
| blessing-empire-05 | Conscription | Free builds require three separate placement choices. |
| blessing-fjordland-05 | Song of the Valkyrie | The summoned Valkyries need a chosen legal placement. |
| blessing-goblins-02 | We Have Our Ways | Looting needs an immediate response window. |
| blessing-goblins-05 | Spy Network | Returning the card to hand needs a combat result choice. |
| blessing-goblins-06 | Natural Selection | Elimination needs a Hero placement response window. |
| blessing-goblins-08 | Sneak Attack | The benefit depends on the later Ambush declaration. |
| blessing-night-02 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-03 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-04 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-05 | Powerful and Eternal | Immediate Study needs a discipline choice outside the normal Study phase. |
| blessing-night-06 | Your True Rulers | Coven protection needs all build and discovery event hooks. |
| blessing-night-08 | Knives in the Dark | Coven discovery needs a Strike replacement window. |
| blessing-night-09 | Shapeshift | The Hero escape occurs after it is selected for elimination. |
| blessing-oathborn-02 | Delve Greedily | Mining needs an immediate response window. |
| blessing-oathborn-06 | Fury of the Ancestors | The winner chooses an extra advance and attack. |
| blessing-oathborn-10 | Runestones | The player chooses which Spells to discard after drawing. |
| blessing-orcs-01 | Whips of Grom | Movement must preserve a mandatory legal Attack action. |
| blessing-orcs-03 | Pestilence | The target owner chooses an adjacent Orc stack. |
| hero-empire-13 | Princess Sofia | Post-advance movement and extra Attack need a new activation window. |
| hero-fjordland-13 | Freyja | The save interrupts the chosen Hero’s elimination. |
| hero-goblins-16 | Siskar | Reroll selection must include every d6 event, including outside combat. |
| hero-night-11 | Lilith, Queen of the Night | The draw Power needs a source-cast response window. |
| hero-night-12 | Luna, Mist Hunter | Assassination uses elimination instead of ordinary Strike hits. |
| hero-night-13 | Dominia, Herald of Scyx | Automatic Coven placement needs the Income event hook. |
| hero-oathborn-11 | Haga-Tor, the Red Eagle | The defender needs optional advance and counterattack choices. |
| hero-oathborn-12 | Yeti Elder | Draw-then-discard needs the player’s Spell choice. |
| hero-orcs-11 | Warlord Szark | Ambush Strike successes need their special hit calculation. |
| hero-orcs-12 | Spy-Master Kagash | The Power requires two separately chosen enemy targets. |
| hero-orcs-14 | Kovat the Flayer | Forced movement needs a target-owner decision including Hero separation. |
| spell-04 | Earthquake | Area Strikes need separate target rolls and intervention windows. |
| spell-05 | Crushing Vines | The second Strike must be chosen after the first roll. |
| spell-10 | Necromancy | Elimination-triggered recovery needs a separate target choice. |
| spell-12 | Wave Strider | Free Ship Movement needs its own action allowance. |
| spell-24 | Martyrdom | Drawing two Blessings needs separate kingdom choices. |
| spell-27 | Fear | Forced Army movement can leave its Hero behind. |
| spell-35 | Demonic Possession | Possession has a separate Hero-only damage and reward sequence. |
| spell-47 | Moryana’s Fury | Sea-crossing damage needs a stack-specific hit allocation. |
| treasure-05 | Horn of Udun | Interception before enemy entry needs a placement window. |
| treasure-12 | Ring of Invisibility | The Hero escape occurs after that Hero is chosen for a hit. |
| treasure-21 | Book of the Dead | The target player chooses the discarded card type. |
| treasure-22 | Encyclopedia of Monstrosities | The caster chooses which commanded Monster abilities to copy. |
| treasure-29 | Curse of Xaraxxes | The Winter holding limit for unsellable cards needs a verified exception. |
| treasure-30 | The Red Wizard’s Curse | The Winter holding limit for unsellable cards needs a verified exception. |
| treasure-35 | Fountain of Power | The Winter holding limit for unsellable cards needs a verified exception. |
| treasure-36 | Fountain of Valor | The Winter holding limit for unsellable cards needs a verified exception. |

## Executable systems and limits

Player-owned hidden hands, kingdom-specific Blessing decks, Cantrip handoffs, ordered Battle Magic, nested counter responses, Tome cancellation, exact per-hit allocation and recovery, critical confirmation chains, Hero random pools/locks/stacks, Monster command/rewards, Arcane Study, Autumn markers and Winter Treasure cleanup are implemented. Imported Advanced saves validate their hidden zones, bounded pending decisions and unique card/counter inventories. See [implementation details](advanced-implementation.md) and [playtest evidence](advanced-playtests.md).

This remains a local shared-table implementation. It has no remote match server, secure separate-device private projections, or certified official campaign setups. Four-board location inventories are reference data; they do not constitute four playable map graphs. Physical control-marker supplies outside Night, allied entry denial and the Ambush garrison interpretation remain disclosed in [rules ambiguities](../rules/ambiguities.md).
