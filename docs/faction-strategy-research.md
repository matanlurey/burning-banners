# Faction strategy and AI evaluation research

Research checked 5 October 2026 UTC. Facts below come from the current official rules and the designer's own interview. The proposed AI priorities are engineering hypotheses to measure, not claims of an established competitive metagame.

## Sources and precedence

- [Compass Games Undying Rules v1.1](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying%20Rules%20v1.1.pdf): primary authority for mechanics; relevant sections 1.11, 9–12, 13–17 and magic clarifications. A local text extraction was inspected alongside the project's previously audited content.
- [Christopher Moeller interview, The Players' Aid, 13 June 2023](https://theplayersaid.com/2023/06/13/interview-with-christopher-moeller-designer-of-burning-banners-rage-of-the-witch-queen-from-compass-games-currently-on-kickstarter/): primary designer commentary about asymmetric economies, force identity, builds during a turn, and campaign-dependent victory. This predates publication and is not a substitute for v1.1 rules.
- [The Boardgames Chronicle strategy/training series, 22 February 2026](https://theboardgameschronicle.com/2026/02/22/strategy-training-materials-for-burning-banners-by-compass-games/): direct creator's series includes overview, Oathborn/Fjordland introductory play, Goblin/Orc introductory play and an Advanced explanation. The article text and embedded-video descriptions were retrieved; the full videos were not transcribed or watched. It establishes relevant training material, not verified deep strategies for all six factions.
- [Designer game page](https://moellerillustrations.com/games.html): confirms the project identity and asymmetric scope.

No complete primary competitive strategy guide for all six factions was found. The rules give a stronger implementation basis than invented opening recipes. Pre-release interviews, older rules and current v1.1 disagree in places: notably use v1.1's **3 gold** Shashka Expert Plunderers rule, not a generic doubled-loot heuristic.

## Verified faction differences

| Faction | Rule facts relevant to planning | Source |
| --- | --- | --- |
| Oathborn | Mining yields 1 gold per action. Mountain entry costs 1 MP except Siege Engines. Khazud is excluded from victory counting. | §§12.1.1–12.1.3 |
| Fjordland | Rangers gain forest mobility and combat benefits. Ship Movement is a free action once per activation with enhanced range. | §§12.5.1–12.5.2 |
| Eastern Empire | Revolts accumulate, consume income, and can cause collapse. Suppression costs gold. | §§12.4.2–12.4.7 |
| Goblins | Shashka settlements cost upkeep; expansion/loot funds the force. Goblins have mountain mobility. | §§12.2.1–12.2.6 |
| Orcs | Share Shashka economy and collapse rules; do not receive Goblin mountain mobility. | §§12.2.1–12.2.6 |
| Army of Night | Covens add income and attack support; placement favors vacant, unfortified, wilderness-adjacent sites. Adjacent Feral builds enter finished. | §§12.3.1–12.3.8 |

The designer characterizes Empire as wealthy but unstable; Goblins as numerous and weaker, Orcs as individually stronger, Night as stealthy with covens, Oathborn as mountain kingdoms, and Fjordland as sea raiders, berserkers and rangers. He emphasizes flexible build timing and varied campaign objectives. These descriptions suggest differentiated policies, not fixed advantages in every scenario.

## Proposed policy distinctions to test

These are candidate evaluation features, not additional rules or balance bonuses.

| Faction | Candidate policy | Failure fixture |
| --- | --- | --- |
| Oathborn | Compare economic actions with the remaining time to reach the objective. Use terrain-aware legal paths; reinforce chokepoints and keep slow forces relevant. | Mining while a one-turn objective capture is available; an expensive force built too far away to contribute. |
| Fjordland | Evaluate legal combined land/ship routes and the action retained after a free ship move. Prefer a landing with strategic value over maximum travel distance. | A strong army sails away from the defended goal; a route ends where no useful action remains. |
| Eastern Empire | Price each persistent revolt against remaining income cycles and collapse exposure. Keep a reserve before speculative purchases. | Buys an impressive unit and cannot pay next turn; spends all resources on suppression while an urgent capture goes unanswered. |
| Goblins | Value affordable board coverage, threatened recruitment sites and safe routes; ensure economic survival before expanding the footprint. | Fragile troops attack an unwinnable target; razing the last controlled site or a required scoring site. |
| Orcs | Value combat force that can arrive in time, profitable pressure and safe upkeep. Avoid treating distant high-rated troops as immediate power. | Uses an impossible mountain shortcut or spends loot that is already committed to upkeep. |
| Army of Night | Score durable supporting positions, future reinforcement value and the chance of enemy cleanup. Protect vulnerable casters and coordinate pressure with allies. | Selects a superficially easy coven placement that has no strategic use; assumes a fresh Feral build can act immediately. |

Shared priorities should include objective urgency, allied rather than individual victory, recruitment access, preservation of important stacks, and legal card timing. Card utility needs the actual pending decision context; an indiscriminate **play first legal card** policy wastes interactions and makes difficulty labels unreliable.

## Scenario-aware reward hierarchy

The project's current schema distinguishes control and survival objectives, a designated kingdom, explicit target hexes, a threshold, a deadline and optional deadline-only victory. Evaluation should consume these values, rather than assigning all hostile settlements the same reward.

1. Terminal outcome: winning the implemented scenario is highest priority; losing is lowest. A resource surplus must never outweigh a proven win.
2. Immediate danger: avoid a forced loss, collapse, or loss of the only realistic objective route when a legal alternative prevents it.
3. Objective progress: value eligible sites, threshold proximity, ownership at the deadline, and preserving the designated surviving kingdom. Discount irrelevant captures near the deadline.
4. Future capacity: compare usable force, legal travel time, safe recruitment/recovery access and sustainable gold.
5. Tactical efficiency: favorable combat, useful card effects and low exposure improve the position only insofar as they support the above goals.

For defense, holding enough sites to prevent the opponent reaching its threshold can be better than maximizing captures. For survival, chasing unrelated towns can be worse than reducing the designated kingdom's collapse risk. For Shashka, a scoring site is also a recurring liability; a useful policy must model both rather than always retain or always raze.

Avoid evaluating a proposed combat by applying it to the real game RNG and inspecting the sampled result. Estimate outcomes from the combat rules or use an independent planning seed/distribution. The agent must not use unseen hands, future deck order or exact future rolls. Visible Hero powers, public counters and already played cards are legitimate inputs. A weaker difficulty should use the same legal-action generator, not illegal shortcuts.

## Evidence required for a Hard claim

Publish a deterministic tournament report with paired seats, representative factions/scenarios, Basic and supported Advanced rules, and held-out seeds. Compare Hard against Normal and Easy, then inspect loss cases. Report any no-progress loop, invalid action, turn cap or crash separately from wins; do not silently count those as victory. Measure decision latency in a mobile-sized browser.

Include fixtures for objective-saving defense, deadline captures, revolt reserves, Shashka upkeep and final-control preservation, mountain/forest/ship routes, threatened recruitment, Hero exposure, defensive Counter, hit allocation and recovery, and Winter treasure sale. The currently cataloged but unimplemented official campaign setups cannot support claims about all official victory conditions. The reference-only Advanced effects likewise limit claims of complete rules mastery.

