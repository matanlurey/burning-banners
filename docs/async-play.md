# Async campaign companion

Implementation record: October 5, 2026 UTC. The campaign companion adds return briefings, observable history, temporary AI delegation, coordination messages, map pings and private planning notes to the existing **local game**. It works in pass-and-play or trusted campaign-file exchange. It is not a shared online room: there is no match server, account-secured seat, remote synchronization, push/email notification sender or AI worker that runs while the browser is closed.

The design follows the [async research](async-research.md): help a returning player understand recent events, find the next decision, coordinate, and leave a clear handoff. [Faction strategy research](faction-strategy-research.md) separates source-backed mechanics from candidate AI heuristics and strength claims.

## Using the campaign desk

Open **Campaign desk** from the game header. Its five sections are Briefing, Replay, Command, Messages and Notes.

- **Briefing:** see the actual kingdom needed for the current decision, including Magic/Study responses; read recent visible actions and messages; mark both read; choose whether return briefings open automatically. The compact list shows the latest 20 actions while Replay contains the full retained history.
- **Replay:** select an action, choose Before/After, step Previous/Next or explicitly play/pause the sequence. The historical board keeps the live map’s orientation, starts focused on the action’s changed positions/endpoints, and labels the changes. Whole Map switches to an overview; Focus This Action restores the detail. Return to Live Campaign closes history without restoring the old position.
- **Command:** set Easy/Normal/Hard per kingdom, delegate your human seat, take back a delegated seat, or pause/resume local computer play. Shared-player human kingdoms are delegated together so a shared hand is not split between incompatible control modes.
- **Messages:** select a map position before opening the desk to attach a ping; choose Alliance Only or Whole Table; enter text or a quick message. A message’s Show on Map button focuses its saved position.
- **Notes:** write and save the current kingdom’s private next-move plan.

The desk itself pauses automatic dispatch while open. Returning to live play resumes eligible AI work unless computer play is explicitly paused. Existing handoff screens still identify who should reveal the next private hand. The renderer escapes message and note text; it does not treat it as HTML.

## Briefings and observable history

Every committed game action can append a numbered before/after board observation. A briefing reports actions since that kingdom's last-read marker, unread messages, movement, recruitment, losses, weakening, control changes and razing. Read markers are independent by kingdom and saved with the campaign. An optional return-briefing preference is also saved.

Replay is a read-only observation of past board positions. It is not undo, a playable historical save or a way to reroll combat. Projections contain unit positions/status, controls, razed sites and commanded Monsters. Night can observe its own Coven positions; opponents cannot. Private card acquisition receipts go only to the owning player's kingdoms, so independent allied players do not receive another player's draw identities. Treasury values, decks, unplayed hands, random state, pending decisions and raw actions are not included in replay projections.

History retains the most recent **250 actions**. If older unread events have rolled out, the briefing explains that the retained history is incomplete. Older saves without a companion begin a fresh history baseline; this cannot reconstruct moves that happened before recording began. Marking a briefing read or observing history does not change the game turn, dice stream or legal choices.

## Delegation and difficulty

A human seat may explicitly delegate itself to AI and later take control back. The setting persists through campaign saves; takeover preserves the current turn, combat/Study decision and random state. Reclaiming the seat prevents the next automatic action; already committed actions remain part of the campaign. An originally computer-controlled seat remains computer-controlled, although its difficulty can change.

Delegation lasts until explicitly reclaimed. There is no one-turn deadline, reaction-only delegation, auto-away timeout or hidden-tab trigger. The client must remain running for AI actions to execute; closed-browser background progress is not implemented.

| Difficulty | Implemented policy |
| --- | --- |
| Easy | Conservative attacks, simple expansion and economy, limited Magic use. It still chooses legal actions under the same rules. |
| Normal | Preserves the original local opponent policy, using ordinary builds, recovery, advances and straightforward Powers. |
| Hard | Scores legal actions for the actual control/survival objective and deadline, combat outcomes, exposed forces, economy reserves, upkeep/revolt risk, terrain/ship opportunities and context-specific Magic. |

The policies share the legal-action generator and receive no resource bonus. Hard uses expected combat outcomes, not the actual next dice result, opposing private hand or future deck order. It is a heuristic planner, not a trained reinforcement-learning system or a complete multi-turn game-tree solver. Recent visible allied map pings can act as bounded tie-breakers between useful legal plans; enemy or hidden-alliance pings are ignored. Its utility scores are adapted to the current supported scenario schema; unavailable official campaigns and gated Advanced effects cannot establish mastery of those rules.

## Coordination and planning

Messages can address the whole table or the sender's alliance. The recipient list is retained and validated on import. Free-form human messages are limited to **300 characters**; the campaign retains the latest **200 messages**. A map ping attaches a valid hex location. AI communication is restricted to seven fixed templates: support, defend, concentrate attack, need gold, ready, wait and thanks. Automatic messages require a template rather than unrestricted generated speech.

Each kingdom has a saved private planning note of up to **2,000 characters**. Notes stay out of replay and messages. Changing a note, sending a message, reading a briefing or changing delegation/difficulty does not consume a game action or advance the random stream.

These are local audience-filtered displays. The complete local save necessarily includes all players' hands, Coven records, notes and message history. A person with that JSON or browser development access can inspect it. Trusted file exchange and pass-and-play privacy must not be presented as secure competitive online multiplayer.

## Persistence and import boundary

The companion is stored with ordinary IndexedDB saves and versioned campaign JSON. Legacy saves remain valid without it. Import validation allow-lists settings, timeline fields and projection fields; checks sequence continuity and caps; rejects forged alliance recipients, unsupported difficulties, oversized notes/messages, private fields inserted into public projections and delegation/controller mismatches. Read-only projections are copied before returning them to the UI.

The existing download/copy/import flow is the handoff channel for another local installation. It has no live message delivery, conflict merge, notification scheduling or stale-update authority. Participants should agree which exported campaign is current. A server-backed correspondence mode would require authenticated seats, authoritative sequence checks, audience-filtered events and durable notification delivery.

## Verification status

The companion module and desk renderer have **21 targeted tests**: 18 model tests for legacy migration, redacted replay, private draws/Covens, shared ownership, unread markers, retained-history warnings, idempotent recording, table/alliance recipients, bounded AI messages, delegation/takeback during pending combat, notes, saved round trips, correct foreign Monster caster/command attribution and malformed imports, plus three renderer regressions for escaped free-form HTML, the absence of owner-private card receipts/notes from every opponent tab, and unchanged detail/whole-map replay observations that keep both movement endpoints in view. Integrated browser checks are recorded below. The frozen source passed the strict build and **137/137 full-suite tests**, with zero failures or skips. All **144 final paired AI games** completed without errors or timeouts: 120 Basic and 24 Advanced.

## Completed Basic AI balance pass

The final [Basic tournament report](ai-balance-report.json) contains **120 terminal games**, zero invalid-state errors and zero step-cap timeouts. Each difficulty pair played both alliance assignments on both original fixtures over ten seeds: 1, 29, 1986, 2026, 20261005, 17, 97, 329, 430 and 777. Whole alliances use the same difficulty. This is self-play on the two supported original scenarios, not unavailable official campaigns.

| Paired matchup | Games | Higher difficulty wins | Lower difficulty wins |
| --- | ---: | ---: | ---: |
| Normal versus Easy | 40 | 22 (55%) | 18 |
| Hard versus Easy | 40 | 33 (82.5%) | 7 |
| Hard versus Normal | 40 | 26 (65%) | 14 |

Across 80 appearances, Hard won **59 (73.75%)**. Seat effects remain substantial: Hard won 40/40 as Resistance and 19/40 as Invaders. By fixture, it won 32/40 in teaching and 27/40 in the sandbox. These results support an observed advantage over the other policies; they do **not** establish an extremely tough opponent for expert humans or balanced scenarios.

The five additional seeds 17, 97, 329, 430 and 777 were initially reserved from tuning and then reused for final verification. On that subset Hard won 16/20 against Easy (80%) and 14/20 against Normal (70%). Because those seeds were already observed before later corrections, this is a reproducible verification subset, **not an untouched final holdout**. A new blind set and competent human opponents remain useful next evaluations.

The Node batch took about 288 seconds; complete games used 40–503 actions. Its largest reported legal-decision latency was 533 ms while concurrent batches were running, not a measured mobile-device latency. **27 AI regression checks** cover deterministic legal choices, scenario changes/control/survival, held-objective defense, revolt/upkeep, Counter costs, hit allocation, beneficial Magic targets, Winter retention, Feral scoring hazards, public-information-only planning, allied-ping coordination, exact Study draw thresholds, exhausted-Hero separation and zero-gold upkeep planning.

## Completed Advanced AI balance pass

The final [Advanced tournament report](ai-advanced-balance-report.json) contains **24 terminal games**, zero invalid-state errors and zero step-cap timeouts. It uses both original fixtures, seeds 1 and 29, all three difficulty pairs and both alliance assignments. These games exercise the supported Advanced preview, not its 45 gated effects or unavailable official campaigns.

| Paired matchup | Games | Higher difficulty wins | Lower difficulty wins |
| --- | ---: | ---: | ---: |
| Normal versus Easy | 8 | 5 (62.5%) | 3 |
| Hard versus Easy | 8 | 6 (75%) | 2 |
| Hard versus Normal | 8 | 5 (62.5%) | 3 |

Hard won **11/16 appearances (68.75%)**. The sample is small and the scenarios remain asymmetric; this is observed self-play performance rather than proof of complete rules mastery or expert-human challenge.

The batch took about 214 seconds under concurrent load, with 65–1,576 actions per game and a largest reported legal-decision latency of 451 ms in Node. The final action cap was 2,500. One legal seed-29 Normal-Invader/Hard-Resistance game genuinely needed more than the old 1,500 cap and completed in 1,576 actions. Raising the cap followed inspection of varied progress through turns/Study; it was not used to hide a repetitive engine stall.

Earlier stress passes exposed and repaired command-overflow handling, reuse of a free Ship action by alternating a stack’s Hero/Army lead, and a magically gained finished Hero trapping its active Army. Hero gain now uses the source-correct readiness rule; finished-member joins end the activation appropriately, legacy trapped activations can finish, and Hero/Army joins require the same kingdom even when one player owns both kingdoms. Four dedicated regressions cover those gain/join/legacy cases. The final 24 games were rerun after these repairs. AI Study utility was also corrected to use one Blessing per controlled kingdom and actual draw/cycle value, rather than an assumed three-card Blessing threshold.

## Integrated browser checks

The owner-consent Regenerate fixture was also tested through ordinary UI import: Oathborn remained the active kingdom while the owning Goblins confirmed a two-gold heal of their weakened Hill Troll. The Troll became ready/full strength; Goblin gold fell from 18 to 16. A copied backup attributed the event to Goblins.

Root’s real Chrome pass imported an 18-event diagnostic through the normal Load Saved Game UI. An automatic briefing opened, and Continue after reload opened the return briefing again. Human messages persisted; text containing HTML appeared as plain text with no injected HTML element. The Oathborn desk omitted Fjordland’s enemy-alliance plan. A Zarinbar message ping focused the correct live map location. On mobile, a quick attack template with an attached Zarinbar ping was retained in alliance messages.

A private Oathborn note saved with the 2,000-character field limit. When the next Fjordland handoff was revealed, its Notes tab showed only the Fjordland note; the Oathborn plan remained absent. Replay selected action 5, viewed its Before position and stepped Next/Previous. Full campaign JSON copied through the UI was exactly unchanged after history observation, including the random state. Automatic replay also advanced from action 5 to action 9 and then paused. The mobile replay uses a focused action view with an optional whole-map overview.

Delegation was exercised during an actual Churn Study decision: Oathborn was set to Hard, delegated, and the computer committed Finish Study as event 19. After the Fjordland curtain/reveal, its Command tab’s per-seat Take Back Oathborn restored that originally human kingdom to Human. The committed Study action remained in the timeline. This also covers takeback after the viewed human seat changes. A separate Battle Magic pass delegated Oathborn to Hard; AI committed Molten Hammer with Tablets of Amûn Koth, then stopped at the Fjordland human response curtain. Taking Oathborn back from the curtain restored Human control without undoing that Spell/Tome event. The revealed Fjordland desk showed the retained public play and both human controllers.

The final desk layout had **35 geometry checks**: all five tabs at 1280×800, 390×844, 360×740, 320×568, 768×1024, 844×390 and 736×414 CSS frames. Every record reports no page or desk horizontal overflow and a modal wholly inside its frame. The [measured records](async-responsive-geometry.json) preserve the actual bounds. The 320-pixel phone header’s four action targets were additionally measured at 44×44 pixels, with no overflow. These are rendered browser frames, not physical touchscreen or mobile-device tests. Native input and ordinary imports/copies were used; no private application state was injected.

Saved browser evidence: [phone return briefing](screenshots/async-phone-briefing.jpg) and [phone replay](screenshots/async-phone-replay.jpg).
