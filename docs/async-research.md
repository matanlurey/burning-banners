# Async campaign experience research

Research checked 5 October 2026 UTC. This is an implementation recommendation, not a claim that network multiplayer or push notifications already exist.

Experience thesis: return after a busy evening, understand what changed in under a minute, make the decision that matters, and leave the campaign in a clear state for the next person.

## What established games support

| Primary source | Observed behavior | Implication for this project |
| --- | --- | --- |
| [Board Game Arena turn-based FAQ](https://en.doc.boardgamearena.com/Turn_based_FAQ) | Players can arrive at different times; chat persists until the recipient reconnects; log entries can launch replay from that point; turn notices can be immediate, batched until the next visit, or a daily digest. | Make the campaign log navigable, preserve unread markers per seat, and let a returning player choose recap or immediate play. |
| [BGA game clock](https://en.doc.boardgamearena.com/Game_clock) | The page describes configurable pace and incremental thinking time, but explicitly marks itself deprecated. | Use configurable pace as design precedent; do not copy its penalties or assume the old clock rules are current. |
| [CGE Through the Ages app](https://www.czechgames.com/games/through-the-ages-app) | Offers different AI difficulties and challenges that alter victory conditions or rules. | Difficulty must change decision quality and adapt to the scenario rather than merely increase resources. |
| [CGE tournament FAQ](https://forum.czechgames.com/d/14-faq-tournaments) | Mobile/email notification preferences and turn alerts are described. | Notifications need a preference surface and a real delivery channel, separate from a local reminder label. |
| [SGS multiplayer rules](https://strategygamestudio.com/sgs-rules/multiplayer/number-of-players-and-multiplayer/) | PBEM exists; defender battle cards may be chosen by AI in that mode. | Reaction delegation is a useful option for interrupt-heavy games, but it should be an explicit agreement. |
| [Illwinter Dominions 6 manual](https://www.illwinter.com/dom6/dom6manual.pdf) | Its indexed host options include scheduled hosting, intervals, pause days, quick-host control, and save backups. The complete PDF was too large for the web reader; the indexed launch-options section was available. | Provide predictable pacing, pauses and recovery. Do not claim to have audited the complete manual. |

The BGA documentation mixes present behavior with older launch-era language. The useful precedents are recap, persistent messages, configurable pace, and notification batching; this document does not assert exact current limits or premium entitlements.

## Concrete interaction recommendations

| Need | Product behavior | Correctness boundary |
| --- | --- | --- |
| Return briefing | On reopening or requesting a briefing, show since-last-seen changes: captures, losses, builds, battles, objective progress, and messages. Lead with the next decision and its owner. | Summaries must be generated from events visible to that seat. Never summarize an opponent's unplayed hand, draw identities, deck order or private notes. |
| Replay | Previous/next, play/pause, first/latest, speed, and an event list that focuses the map. Provide a persistent **Viewing history** banner and **Return to live campaign** action. | Historical views are read-only. Looking backward must never restore a live save, reroll dice, dispatch an action, or reveal private information. |
| Helpful recap | Group routine moves, emphasize ownership changes and casualties, skip long animation by default, and offer motion off. | Keep the full underlying event history available; a compact digest is not the authoritative record. |
| Temporary delegation | Choose a seat, difficulty, and an optional return boundary such as one turn. Show an unmistakable delegated badge and a take-back action. | Do not conflate delegation with resignation. A take-back request takes effect before the next AI action; an already committed action is not undone. |
| AFK behavior | Optionally delegate reactions only, preserving strategic turns for the human; stop at an explicit return boundary. | Do not silently pass a legal response or delegate simply because a tab became hidden. Browser-only AI stops when no running client exists. |
| Coordination | Public and team channels; a short text composer; map-location pings; unread counts; focus-map from messages. AI uses a fixed list such as **Defending this location**, **Attacking this location**, **Need support**, **Objective secured**. | Team/private messages require audience filtering in both the live desk and replay. Display text with escaping. AI messages should reflect committed actions or actual intent, not fabricated conversation. |
| Planning | Seat-private notes, pinned objective reminders, and map bookmarks. | Keep planning information outside public history; changing a note does not alter the game turn or RNG. |
| Pace | Display who is needed next, an optional agreed move cadence, and a voluntary pause/away status. | A cadence preference is advisory until a server enforces a clock. Do not show fake countdown enforcement. |
| Backups and transfer | Export/import a versioned campaign with sequence identity and a readable handoff summary. | Full saves contain hidden state. File exchange is trusted-player correspondence, not secure competitive multiplayer. Refuse stale or incompatible room updates once a server exists. |
| Attention | On-demand briefings plus a preference for automatic return recaps; optional sounds, no forced motion, and quiet-hours notification batching when a real sender exists. | Browser-local notices cannot reach another device while closed. Do not represent an in-page badge as push delivery. |

## Scope that works with the current static website

The existing game is a deterministic browser runtime with local saves and file import/export. Briefings, read-only history, local messages, pings, seat notes, AI delegation and difficulty can be useful immediately in pass-and-play or trusted file exchange.

That is different from a shared asynchronous room. A room requires an authoritative persistent service, seat authentication, audience-filtered event retrieval, compare-and-swap action sequence checks, durable chat, reconnection handling, and an actual notification sender. A static Sites deployment does not acquire these properties by adding an async panel. A Cloudflare Durable Object would be one reasonable room authority if hosting is expanded later; this is an architectural recommendation, not a provisioned service.

Store immutable action events separately from the displayed text. A practical event has a monotonic sequence, actor/decision owner, public summary, location references, visibility/audience, and deterministic before/after data or a replayable action. Redacted snapshots may be retained for fast history. Per-seat last-seen markers and preferences belong outside the game RNG. Old saves without recorded history should start a new history baseline and say so.

## Verification requirements

1. Resume after several human/AI turns: briefing starts at the saved seat's marker and includes exactly the visible changes.
2. Replay backward through builds, magic, combat, capture and Winter: live state, RNG, legal actions and save identity remain unchanged.
3. Switch seats while browsing history: other hands, private notes, team chat and unrevealed draws stay absent.
4. Delegate during a strategic turn and a defensive response, reload, then take control back before the next action; no duplicate AI dispatch.
5. One-turn delegation returns control at its declared boundary, including a turn with Arcane Study or nested reactions.
6. Free text containing HTML renders as text; team/public/AI messages retain their audience after export/import.
7. A map ping opens the intended location on a 320-pixel-wide viewport and a short landscape viewport.
8. Old saves still import; history omission is explained; invalid or oversized history/message payloads fail safely.
9. Return recap, replay speed, motion and sound preferences survive reload without obstructing the next decision.
10. Tests distinguish same-browser persistence and trusted file transfer from unavailable server/push behavior.

## Difficulty evaluation

Use identical rules, counters and information access for Easy, Normal and Hard. Easy can use simpler priorities or controlled legal-choice noise; Normal should handle basic economy and favorable combat; Hard should value scenario progress, enemy replies, survival, terrain, economic reserves and card timing. Difficulty labels describe intended policy, not proven strength.

Run paired seeds with seats swapped so a favorable opening or faction does not masquerade as AI skill. Record wins, draws, invalid choices, steps, collapse reasons, objective count at the deadline, runtime, and reproducible loss seeds. Keep a held-out seed set after tuning. Isolate tactical fixtures as well as complete games: an agent that wins one small map can still miss Cure Wounds, Counter timing, a lethal Hero exposure or a Shashka upkeep trap. Publish the actual results and remaining weaknesses; reserve **extremely tough** for evidence against competent human play.

