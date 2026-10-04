# Burning Banners: Rage of the Witch Queen — web-game implementation prompt

Research cutoff: October 4, 2026.

This is an implementation brief, not a substitute rulebook or a licensed distribution of the game. The correct subtitle is **Rage of the Witch Queen**, not Rise. Source identifiers in brackets resolve in the source manifest near the end. The accompanying research index contains additional guides, access notes, and references.

---

## Copy everything below into the implementation agent

You are a senior board-game implementation engineer, TypeScript engineer, multiplayer/backend engineer, game-AI developer, and mobile interaction designer.

Build a genuinely playable, rules-enforced web adaptation of **Burning Banners: Rage of the Witch Queen**, designed by Christopher Moeller and published by Compass Games. Build the game, its tests, its content pipeline, and its deployment package—not a marketing website, a static board mockup, an unregulated virtual tabletop, or a vaguely similar fantasy game.

Treat the official rule sources as authoritative. Treat the architecture and interface requirements below as product requirements. Never confuse an engineering convenience with an official game rule.

### Configuration

Use these defaults unless the launch message overrides them:

```text
DEPLOY_TARGET = sites       # sites | cloudflare | both
FIRST_EXPERIENCE = guided-basic
LOCAL_PLAY = enabled
HUMAN_AND_BOT_MIXING = enabled
REMOTE_MULTIPLAYER = enabled only for cloudflare/both
RULESET = verified official Undying rules + applicable campaign/card corrections
PUBLIC_ASSETS = only assets/data cleared for the intended distribution
PAID_MODEL_REQUIRED = false
```

A `sites` build must be complete for local play without Cloudflare credentials, a running server on the user's computer, or an AI-provider key. A `cloudflare` build must support both local games and authoritative online rooms. With `both`, deliver both targets from the same codebase.

Do not pause the entire implementation for cosmetic preferences or optional integrations. Investigate source gaps, implement independent work, and report exact blockers. Do not silently change the scope or announce completion of features that remain stubs.

## 1. Product boundaries and the playable experience

The target is the base game's full supported content: Basic and Advanced rules, the six kingdoms, four map boards, and 29 scenarios advertised by the publisher. Reconcile those targets against actual source inventories rather than guessing what the component totals represent. [G01]

The application must support one person playing against bots; several people sharing one device; humans with bot allies against human and/or bot opponents; and, on the online target, humans on separate devices in the same match. Support bot-only games for testing and optional spectating. These are controller arrangements, not replacements for each scenario's actual factions, sides, turn order, or victory conditions.

Keep these concepts separate:

- A person or bot policy: the decision-maker.
- A player/controller seat: the entity to which the game assigns decisions and private information.
- A kingdom: a game entity with its own pieces, resources, and rules.
- A side/alliance: scenario-defined cooperation and victory relationships.
- A device/session: a transport and display endpoint.

Do not implement one of these concepts by assuming it is always identical to another. A person may control multiple kingdoms. Build assignment validation from scenario requirements and verify private-information ownership against the rules, not against a one-player-one-kingdom assumption. [G02]

Start with a verified short official Basic scenario. Prioritize adding Campaign 8 and Campaign 16 once their complete setup and corrections are verified; those are useful user-facing acceptance cases. Do not infer their armies, number of players, board arrangement, dates, or victory conditions from their titles. Include longer linked play after its actual campaign instructions have been imported.

An optional sandbox, open-hand teaching mode, faster response clock, or original demonstration map must be visibly labeled as such. Never present a house rule or invented scenario as the official game.

## 2. Source acquisition, authority, and uncertainty

Begin by opening the publisher's rules/downloads hub [G01]. Follow its current links rather than assuming the URLs in this brief will remain valid. The hub currently identifies the Undying rules and campaign notes as September 23, 2024 material, and says the earlier August 7 clarifications are incorporated. Record the actual files, internal version labels, publication dates, and checksums you obtain. A newer upload date on a mirror is not a newer rules edition. [G01]

Acquire and inspect, in order of relevance:

1. Current official living rulebook, campaign book, campaign notes, and explicit corrections.
2. Applicable printed cards, counters, kingdom information/playmats, setup cards, terrain/combat aids, and other reference displays, reconciled with corrections.
3. Identifiable designer/publisher rulings that resolve a specific remaining ambiguity.
4. Designer tutorials and official playthroughs for demonstration, with attention to their publication dates.
5. Community explanations, cheat sheets, and playthroughs as search aids and cross-checks, never as automatic overrides.

The rule hierarchy must itself follow the game's instructions. Apply a campaign or card exception where authorized; do not invent a universal hierarchy that overrides printed rules. When two sources disagree, record the exact conflict, the relevant passage, and the basis of the resolution. Do not average the answers.

The research pass supplying this brief located official links but could not fully retrieve every publisher PDF, the complete campaign book, all aids, or every card/counter face. Accessible HTML transcriptions and a mirror of the living rules were inspected. Video links were located, not fully watched. Therefore this brief is not a certification that a complete machine-readable game dataset already exists.

Use mirrors [G06–G08] only with recorded provenance. Exclude their generated summaries, recommendations, advertisements, and question-answer widgets from the authoritative corpus. The original RulesPal transcription must not silently replace corrected living rules.

Create these project artifacts immediately, and update them as implementation progresses:

```text
sources/source-registry.json
sources/access-report.md
rules/rule-index.json
rules/coverage-matrix.csv
rules/ambiguities.md
content/content-manifest.json
content/missing-content.md
```

Each source record needs its title, issuer/author, URL or user-file identifier, document/version date, retrieval date, access status, checksum when bytes exist, authority class, and redistribution status. Use statuses such as `verified-text`, `verified-pages`, `link-only`, `partial`, `unavailable`, or `superseded`—not a single misleading boolean.

For each operative rule paragraph, table, or card exception, create a small indexed requirement with a source section/page, implementation owner, and tests. Avoid reproducing entire manuals in the public repository. If a rule cannot yet be resolved, label the affected feature accurately. Do not enable a purportedly official scenario while substituting invented values for missing data.

Read the relevant source before coding its subsystem. Do not write a generic game engine first and reinterpret the manual to fit it.

## 3. Rights-aware content and publication

Keep engine code, normalized mechanics data, explanatory interface copy, and visual assets separable. Track their provenance separately; an asset's download availability is not evidence of permission to redistribute it.

For a public prototype, use assets and data cleared for that distribution. Do not assume ownership of a physical copy or access to a VASSAL module grants redistribution rights. Keep any restricted source scans and unapproved packs out of public bundles and repositories. Use original interface art or schematic pieces where appropriate, with honest labels. Do not imply publisher endorsement. Sites publication also requires appropriate rights to supplied content. [O03]

A missing illustration should not block an implemented rule. Missing mechanical card text or unverified map topology must not be replaced with a made-up official effect or hex. Supply an import/editor workflow and an explicit content status instead. A synthetic diagnostic map may demonstrate the engine but must never be named as an official campaign.

Do not hotlink a third party's full-size images as the production asset strategy. Add credits, license metadata, pack versions, integrity checks, and an asset-removal path.

## 4. One codebase, clean boundaries

Use TypeScript with strict checking. Prefer a lightweight browser application such as React with Vite, unless the Sites scaffold requires another compatible arrangement. Respect the environment's actual tools and supported runtime. Pin installed dependencies and include a lockfile.

Suggested boundaries—not a demand for a heavyweight monorepo tool:

```text
apps/web/                     map UI, setup, hands, rule help, local/remote adapters
apps/cloudflare/              routing Worker, GameRoom Durable Object, optional jobs
packages/rules/               authoritative rules, effects, decisions, validations
packages/content/             validated immutable definitions and provenance
packages/protocol/            commands, projections, versioned messages
packages/ai/                  observation-limited bot policies and search
packages/persistence/         save schemas, migrations, replay utilities
packages/test-fixtures/        verified setup fixtures and explicit random tapes
tools/content-editor/         map calibration and content validation
docs/                         architecture, deployment, coverage, known gaps
```

Do not create backend imports in the local browser bundle. Do not duplicate the rules in the UI, bots, and server. A visual action button, an AI move, and a remote command must all reach the same validator and transition implementation.

Keep transient UI state—selected hex, camera, expanded panels, animation speed—outside authoritative game state. Store authoritative pending choices and effect continuations inside it.

Core API requirements:

```ts
// Contract sketch: implement proper domain types and discriminated unions.
interface CommandEnvelope {
  protocolVersion: number;
  gameId: string;
  commandId: string;
  expectedRevision: number;
  decisionId?: string;
  action: GameAction;
}

interface GameTransport {
  connect(): Promise<ConnectionResult>;
  subscribe(listener: (update: PlayerUpdate) => void): () => void;
  submit(command: CommandEnvelope): Promise<CommandResult>;
  resync(lastSeenRevision?: number): Promise<PlayerUpdate>;
  disconnect(): void;
}

// Authenticate the caller outside the engine; never trust a submitted actor id.
// The engine then checks whether that authenticated player may take this action.
// Random input is explicit, injectable, and recorded—not Math.random in reducers.
validateAction(state, actor, action, decisionId): ValidationResult;
listLegalActions(state, actor, decisionId): LegalActionSet;
transition(state, actor, action, suppliedRandomness): TransitionResult;
projectForPlayer(state, playerId): PlayerView;
projectForSpectator(state): SpectatorView;
```

Use runtime schema validation at every import and network boundary. TypeScript assertions alone do not validate untrusted JSON. Keep legal-action generation efficient; do not materialize millions of action combinations merely to show five relevant choices.

## 5. Explicit state machine and rule coverage

Build a source-derived state machine rather than a single `currentPlayer` plus an `endTurn()` function.

Represent the campaign clock, current kingdom, current phase/substep, active unit or stack, movement progress, pending combat, pending effect resolution, and the next authorized decision-maker separately. Also represent terminal outcome and its explanation. A pending choice must survive saving, reconnecting, and server restart.

Every choice needs a stable `decisionId`, eligible actor set, public description, private choices where applicable, legal targets, and a serializable continuation. Do not store function closures, browser references, or animation promises as the saved continuation.

Build complete rule coverage for Basic sections 1–12 and Advanced sections 13–19, including the glossary and card guide. Treat those section ranges as a source-reading checklist, not as optional feature suggestions. [G02]

For every subsystem, derive positive, negative, boundary, and cross-system tests from its source. Cover setup; economy; activation; movement and board edges; combat; settlement changes; recruitment and recovery; faction exceptions; special pieces; cards; study; and campaign end checks. These are implementation workstreams, not alternative rules.

Do not transplant familiar mechanics from another game. In particular, do not assume conventional zones of control, adjacency-only interactions, ranged attacks at a guessed distance, a generic upkeep phase, interchangeable faction income, a chosen hero market, free ally resource pooling, or a Magic-style response stack. Implement what the verified sources actually say.

Present Basic and Advanced as distinct supported rule profiles, with the correct source-defined differences. The teaching interface may explain Advanced changes incrementally, but must not silently produce an unofficial hybrid while labeling it Advanced.

Use data and small explicit handlers for exceptions. Avoid scattered `if (kingdomName === ...)` checks in UI components. Do not hide substantive rules in display labels or tooltip text.

## 6. Content model and exact-map pipeline

Define immutable content separately from mutable match state. Definitions should include source references, ruleset compatibility, stable IDs, and version hashes. Instances need their own stable IDs: two copies of one piece are not one object.

Model the necessary concepts explicitly: terrain and edge properties; board adjacency; settlements and their changing relationships; units and their printed sides; stacks and occupancy; counters and finite supply; resources; player-owned and kingdom-owned information; card zones; effect durations; scenario definitions and overrides. Derive exact ownership and interaction rules from the source corpus rather than this list.

Use a deliberate hex-coordinate convention. Store a typed graph with neighbor connections, crossing information, and map-board transforms. Rendered geography must be a view of this graph—not the source of legality. Background art cannot decide whether a river, coast, road, boundary, or settlement exists.

Create a practical map-authoring workflow:

- Import an authorized reference image, then calibrate hex orientation, size, origin, and board alignment.
- Assign stable hex and edge IDs; enter printed terrain and locations.
- Record cropped/excluded areas and scenario-specific connections explicitly.
- Overlay graph labels on the reference for human review.
- Validate reciprocal neighbors, joins, inaccessible borders, unique location IDs, and all scenario references.
- Export normalized data plus a review report and checksum.

Computer vision may assist extraction, but a generated image, OCR guess, or attractive redraw is never authoritative game geometry. Require visual verification of diagrams and map joins where text is insufficient.

Scenario definitions must specify everything the actual scenario requires: included boards/regions, participating kingdoms and player arrangements, setup choices versus mandatory placement, starting state, turn schedule, exceptions, objectives, termination checks, and linked-scenario carryover. Store concrete values only after verification. Provide a setup preview and explain which elements are player choices.

Cards need executable effects, not merely a picture and a description. Use a constrained, validated effect representation with explicit costs, timing predicates, targets, changes, duration, and follow-up decisions. Exceptional effects can have named, tested handlers. Never execute imported JavaScript or `eval` text from a content pack.

Cross-check printed piece counts, duplicate cards, fronts/backs, and correction references. The publisher's component count is not a sufficient deck manifest. Missing-content reporting must identify actual IDs and blocked scenarios, not only say “some content remains.”

## 7. Errata regression gate

Maintain a separate corrections ledger, with superseded text quarantined. The official August clarification sheet is a useful regression list, but the verified living text and later applicable corrections take precedence. [G01, G04]

Mandatory named regression fixtures must address at least these correction areas: Regenerate under siege; Huge/Feral settlement interactions; Arcane Study marker distribution; when Battle Magic restrictions end; kingdom-collapse eligibility; Spire-related recruitment restrictions; Akritoi/Ogre printed-stat discrepancies; Earth to Mud; Summon the Dead; Helm of Domination; corrected campaign postures; and quick-setup discrepancies. [G04]

This is a checklist of areas to verify, not a paraphrase of their operative rules. Look up the exact corrected behavior before implementing each fixture. Follow the publisher's separately listed corrected Spire of the Moon setup card as well. [G05]

A test should explain both the expected current behavior and the old behavior it prevents. Never “fix” a failed test by reverting to an older cheat sheet.

## 8. Timing, responses, and hotseat privacy

This is a central correctness requirement. The rules contain out-of-turn card decisions and an ordered Battle Magic procedure; participating allies matter. Implement the verified procedure, not an invented alternating priority loop. [G02, sections 16.7–16.8]

Before automating a transition, establish whether any player retains a meaningful legal decision at that timing point. Build a timing table derived from the rules and card inventory. Account for declarations, movement boundaries, targeting, combat stages, resolution, and other documented interrupt points. Never let a convenient multihex animation skip a reaction opportunity.

Distinguish an announced intent from the point at which its outcome becomes irrevocable. Preserve every legitimate intermediate choice. When response order outside a printed procedure is genuinely unspecified, record a narrow digital convention as a convention; do not claim the book specifies it. Keep that convention stable and visible in room rules.

For pass-and-play, use a privacy curtain whenever a different person needs private information, including mid-turn decisions. It should show only who should receive the device and a neutral description. Require deliberate reveal. Hide private hands again before returning to the public board or another person.

Provide optional player-approved standing instructions: for example, pass selected categories of response windows until a chosen boundary. Make their exact scope visible and easy to revoke. Default strict play must not time out a human's right to respond. A timed casual mode must be clearly marked and agreed before play.

Do not broadcast “this opponent has no playable card” or leak hidden options through tailored public messages. Treat response timing as an information-design problem too. Avoid unnecessary windows, but do not gain speed by silently removing genuine agency or revealing hand contents.

Local hotseat privacy is a courtesy barrier on a shared device, not protection against a determined person inspecting browser storage. State that plainly. Online secrecy must instead be enforced before data leaves the server.

## 9. Interface: map first, phone first

Design for a 390 × 844 portrait viewport first, then support wider phones, tablets, desktops, and a TV browser. No horizontal page overflow and no requirement to scroll the entire document up and down to alternate between map and actions.

Use a stable app viewport. The map occupies the primary area and pans/zooms inside it. A compact header shows the acting kingdom, phase, campaign clock, decision owner, and connection/save status. A collapsible bottom sheet shows the selection, relevant actions, and concise explanations. Wider screens may use a side inspector.

Always answer these four questions visually: Who needs to act? What is selected? What can it legally do? Why is another action unavailable?

Required interactions:

- Tap a piece or hex to inspect it; tap a legal target to preview a concrete action.
- Show reachable areas, path costs, meaningful intermediate steps, and why an endpoint is illegal.
- Provide a compact recruitment/choice interface filtered by the selected context.
- Show combat inputs and possible consequences before commitment, then explain each actual result afterward.
- Make private-card reading, zooming, target selection, and cancellation usable without hover.
- Provide “next decision” navigation without automatically making decisions for the player.
- Keep objectives and the current source-based rule explanation one tap away.

Use strong silhouettes, readable labels, explicit ready/finished presentation, and redundant visual encodings. Do not rely only on faction colors. Aim for touch targets around 44 CSS pixels, respect safe areas, and provide keyboard alternatives and screen-reader-accessible status/actions. A canvas renderer must have a synchronized accessible inspection/action layer.

Choose Canvas, SVG, or a GPU renderer based on measured needs; do not add a large rendering framework by reflex. Keep the action UI in semantic DOM controls. Load only necessary board art and thumbnails initially, with higher-detail assets on demand.

A restrained illustrated-map presentation is preferable to a stack of generic dashboard cards. Use fantasy styling without sacrificing text contrast or adding oversized ornaments. Do not clone the layout of an unrelated card battler.

Animations are optional presentation. Skipping them cannot skip a rule, reroll a die, or change state order. Include reduced motion, fast bot playback, mute, and a readable log. No repeated “OK” screens for deterministic bookkeeping.

Add an original, concise in-context teaching layer with rule-section references. Provide an “Advanced differences” view and a first-game guided setup, without reproducing a manual wholesale. State clearly when an explanation is about the official rule versus the interface's operation.

## 10. Determinism, chance, saves, and replay

Make outcomes reproducible given the same initial state, accepted action sequence, content/rules versions, and random inputs. Store all game-relevant randomness with private/public classification.

For local games, support an explicit seed for debugging and reproducible demonstrations. For online games, obtain unpredictable randomness server-side and record the authoritative outcomes or private random stream needed for replay. Do not expose deck order, unrevealed draws, or a future-predicting seed to clients. Use unbiased bounded sampling and test it.

Never let cosmetics, bot search, retries, or opening a panel consume authoritative game randomness. Give simulations separate random sources. Replay consumes recorded outcomes rather than generating fresh ones.

Persist state after each accepted action and at pending decisions. Save schemas must include their own version plus engine/ruleset/content identities. Supply forward migrations where safe and informative rejection where not. Never reinterpret an old save using silently changed card data.

Local persistence should use IndexedDB, with an explicit downloadable JSON backup/restore workflow. Feature-test storage, handle quota/private-mode failures, and display whether a save actually succeeded. Storage is local to the browser/origin; do not suggest that publishing a new site URL automatically transfers saves. [W01]

Keep source art out of save JSON; reference approved content packs. Validate imports, bound their size, reject executable content, and explain missing packs. Checksums detect accidental mismatch; do not market editable local saves as tamper-proof.

Provide an event-based turn history, public replay, and—where appropriate—private/full replay export for authorized users. Do not export opponents' hidden information mid-match. Define reveal policy at game end rather than assuming all private data should become public.

Ordinary undo must not enable fishing for different rolls or undoing already-revealed secrets. Restrict it to safe uncommitted planning or genuinely reversible agreed actions. A teaching rewind can exist as a visibly different, noncompetitive feature with an audit trail.

## 11. Bots: competent, inexpensive, and non-omniscient

The default AI is a local algorithmic game player, not a remote language model. It must work without paid APIs in the standalone build. Run expensive local search in a Web Worker where supported so the UI remains responsive; provide a bounded cooperative fallback when necessary. [W02]

Give a bot only its authorized observation, remembered public events, and its legal choices. Do not pass the full authoritative state “for convenience.” Bot tests must detect access to opponent hands, future randomness, unobserved pools, and hidden scenario information. Strategic cooperation does not automatically authorize sharing private data between allied bots.

Start with a dependable legal policy and improve it incrementally. Include a strategic evaluator for scenario progress, territorial pressure, force preservation, recruitment efficiency, recovery, future threats, and alliance objectives. Add faction-specific behavior using verified mechanics, not stereotype-based arbitrary bonuses.

Use hierarchical decisions: choose an objective, consider a short sequence of candidate operations, evaluate resulting opportunities and risks, and replan after a meaningful event. A simple greedy attack-only policy is not sufficient. Equally, do not begin with an elaborate search system that cannot finish a legal game.

For uncertainty, use probabilities and sampled states consistent with the bot's observations. Combat forecasts must use the actual dice/effect system. Search cannot inspect the real hidden deck or consume the live random stream. Be explicit about limitations of imperfect-information sampling and measure whether extra search actually helps.

Difficulty levels should primarily alter search budget, candidate breadth, and planning quality—not secretly grant extra gold, altered rolls, or hidden information. Offer concise public-safe explanations such as “protecting the objective” without exposing unrevealed strategy or private information to opponents.

Bots must handle every decision type exposed by an enabled scenario, including setup, private choices, responses, and terminal acknowledgement. Unsupported decisions must not be “handled” by silently omitting their rule. A diagnostic failure should identify the missing handler.

Track bot stability and quality separately: legal-action rate, completed-game rate, decision cost, stall cases, and results against baseline policies. Use fixed evaluation seeds and randomized starting assignments. Avoid promising human-level strength without evidence.

Optional language-model assistance may explain rules from the curated corpus or rank an already validated action shortlist. It is not the rules authority or default dependency. Keep keys server-side, bound costs, validate outputs, and fall back to the algorithmic bot on timeout or failure.

## 12. Standalone ChatGPT Sites target

For `DEPLOY_TARGET=sites`, inspect the actual Sites workflow/scaffold and its available capabilities before choosing framework configuration. Current official documentation supports creating hosted apps/games from prompts or compatible projects; it does not justify inventing a deployment API. Use the supported Sites workflow and inspect compatibility. [O01, O02]

The local game must run entirely in the browser after its assets load. No custom server, external database, remote model, or Cloudflare binding is required for a match. Ship real bots and saves with it. Bundle essential fonts/icons/assets locally or provide robust fallbacks; do not make a CDN's availability essential to game logic.

Sites is the deployment surface—not a request to build an Apps SDK/MCP integration. Do not replace the requested game with a conversational tool or presume it receives the visitor's ChatGPT credentials or free model inference.

Test the actual deployed/runtime environment for Web Workers, storage, module loading, asset paths, deep-link refresh, and mobile viewport behavior. A service worker/offline-install feature is optional and must be feature-tested; do not promise offline use solely because the game has no backend.

Provide a normal development command and a production build. Ensure route refresh works in the selected host, or choose hash routing where required. Package the application portably; “standalone” does not require cramming every asset into one giant HTML file unless the environment demands it.

Before publishing, save/review the build as supported. Every Sites deployment URL is a production deployment, so do not treat publication as a private temporary test. Report a real deployment URL only after successful deployment and smoke testing. When deployment permission is unavailable, supply the working project and precise remaining action instead. [O02]

## 13. Cloudflare target: minimal authoritative architecture

For `DEPLOY_TARGET=cloudflare` or `both`, begin with Workers static assets, a routing/API Worker, and one SQLite-backed `GameRoom` Durable Object per match. This is an architectural choice for this game. Do not create one global game object, or split one small match across kingdom-level objects requiring distributed turn coordination. [C01, C02, C05]

Keep the local transport available. The browser switches transport; it does not switch game rules.

The default online topology is same-origin:

```text
browser clients
    | HTTPS commands / hibernatable WebSocket updates
routing Worker + static frontend
    |
GameRoom Durable Object for that match
    | private persisted state + ordered events + pending decisions
    | shared rules package; validated player-view projection
    + optional bounded bot job / optional asynchronous services
```

Only the room accepts authoritative gameplay decisions. Clients submit intents, not new board states, rolls, costs, card draws, ownership changes, or success claims. Validate schema, authentication, seat permission, decision identity, revision, targets, costs, and current legality server-side.

Use opaque game identifiers and scoped invite/join capabilities. A public room ID is not authorization. Provide named seats, invitations, reconnect credentials, pregame controller assignment, and explicit spectator permissions. Never trust a client-provided `playerId`, `isHost`, or `isAI` flag.

Start without mandatory external accounts. Persistent accounts and matchmaking can be added later. Host powers should manage room setup and agreed administration, not alter opponents' hands or choose battle results. Replacement of an absent player with a bot requires an explicit recorded policy or authorized action.

### Atomic commands and durable state

Require unique command IDs and optimistic expected revisions. Deduplicate by authorized actor plus command identity. A retry of an accepted command returns its prior result rather than performing it again; check recognized duplicates before treating their old revision as a new stale request.

For each accepted action, atomically record the resulting state, event records, random outcomes, new revision, idempotency record, and necessary durable work intents. Use the documented SQLite storage transaction facilities. Keep the critical transition free of external network awaits. Broadcast/acknowledge only in accordance with the runtime's durability guarantees. [C02]

Do not confuse single-threaded execution with immunity to interleaving across asynchronous work. For an external bot job or other delayed operation, retain the originating revision and decision ID, then revalidate when the result returns. Reject stale results instead of applying them to a changed board.

Store immutable content by reference. Keep persisted records within current row/message limits and bounded in size. Avoid placing full art or unlimited history in one JSON row. Add event compaction/checkpointing with replay verification rather than deleting needed state.

### WebSockets and reconnects

Use the documented hibernation-aware WebSocket API, including `ctx.acceptWebSocket` and the corresponding message/close/error handlers, rather than keeping a room continuously awake with ordinary timers. Persist all consequential state; socket attachments can hold small connection metadata but are not the game database. Reconstruct live session state after hibernation. [C03]

On reconnect, authenticate again and send the player's authorized snapshot or contiguous projected events since their last revision. Include protocol/content version checks. Handle duplicates, gaps, old clients, dropped acknowledgements, reconnect backoff, revoked seats, and two tabs attempting the same action.

Never transmit the complete room state and depend on the UI to hide it. Project snapshots, event payloads, legal actions, logs, and bot explanations per recipient. Spectator endpoints need their own projection. Avoid error messages and diagnostics that reveal secrets.

Provide a revision-based HTTP resync/command path even when WebSockets are preferred. Apply sensible message size and rate limits; malformed traffic must not crash or corrupt a room.

### Durable scheduling and bots

Use durable alarms for pending automated work and optional room deadlines. One object has a single scheduled alarm; maintain a small due-work table and schedule its earliest item. Alarm execution can repeat, so handlers must be idempotent. Keep a recovery path that checks due work whenever the room activates. [C04]

Default strict games pause for required human responses rather than silently passing because someone disconnected. Make asynchronous-play expectations explicit: a pending reaction may block progress. Optional clocks must be agreed settings and visible, not accidental consequences of network latency.

Keep bot calculations bounded. Initially use short local-in-object decisions only when measured budgets permit. For stronger search, use a separate Worker/job path with explicit authorized observation, job ID, decision ID, and revision. Apply its result only through the same validator. Do not monopolize the room with long search loops. Verify current CPU and storage constraints instead of relying on remembered limits. [C09]

Record work intents durably before scheduling or dispatching them. Commit or otherwise guarantee the next wakeup with the work record; prove recovery even when a crash occurs before initial dispatch and no player reconnects. A scan triggered only by future player traffic is insufficient for promised unattended progression. Use a replayable outbox and explicit recovery scheduling. Do not claim exactly-once processing for work delivered at least once.

### Add other Cloudflare services only for a concrete need

Use D1 optionally for a cross-room directory, user profiles, or aggregated results—not as a second competing owner of live turns. R2 is appropriate for authorized large assets or protected replay exports. Keep private exports private. Consult current service documentation before provisioning. [C10, C11]

Do not use Workers KV as authoritative rapidly changing match state; its consistency model is inappropriate for that role. Cache noncritical public configuration there only when useful. Queues can support retriable background jobs; assume duplicate delivery and no intrinsic turn ordering. Workflows are optional for an actual long-lived orchestration need, not a mandatory component of every match. [C06, C07]

Do not deploy a whole cloud platform merely because services exist. The first online playable milestone should need only the frontend/API Worker and room Durable Objects.

### Cross-origin variant

A Sites frontend connecting to an external Cloudflare backend is optional, not the default promise. Verify the actual Sites environment permits the needed requests and socket connections. Solve origin allowlisting, CSP, cookies/storage restrictions, and short-lived upgrade authentication intentionally. Do not put reusable secret tokens in logged URLs. Preserve the fully local Sites mode regardless of hybrid compatibility.

### Operations and deployment

Provide current Wrangler configuration, the Durable Object binding, and the SQLite-class migration configuration supported by the installed version. Serve assets and route `/api/*` and WebSocket upgrades deliberately; the SPA fallback must not swallow API errors or upgrade requests. [C03, C05, C08]

Supply local, test, staging, and production instructions with secrets kept out of browser bundles and version control. Validate configuration against the installed tooling rather than copying an outdated example untested.

Include sanitized logs, command error rates, reconnect metrics, bot decision cost, room storage growth, and a clear cleanup/retention policy. Avoid logging private hands and tokens. Document actual service requirements and measured usage; do not guarantee the project will remain free under arbitrary load.

## 14. Test plan and acceptance gates

A feature is not complete because a screen renders. Require automated tests plus recorded manual checks where source images or touch interaction need human inspection.

### Rules and content tests

For every indexed rule, link its implementation and regression tests. Include source-verified scenario setup fixtures, exact objective checks, malformed content rejection, missing-definition detection, and any required supply limits. Verify no piece/card instance occupies incompatible zones and no resource can be spent twice. Define invariants from the actual rules—do not impose simplistic global conservation where rules create or remove resources.

Exercise every enabled card/exception through an executable fixture. A card with an image and a TODO is unavailable content, not an implemented card. Add counterexamples for superficially similar cases that have different results.

Use independent expected outcomes. A test that asks the engine what should happen and then compares the engine with itself proves little. Build hand-checked golden cases from authoritative examples and separately validated calculations.

### Determinism and crash recovery

Replay the same initial fixture, actions, and explicit random tape through the browser and server adapters. Compare authoritative states internally at every revision. Also compare each player's projected view. These internal comparisons must not expose secrets to clients.

Save/reload at setup choices, ordinary actions, response windows, partial effect resolution, and end-of-period transitions. Reconnect or restart after commit but before acknowledgement. Verify no duplicated income, movement, draw, casualty, or bot action.

### Privacy and authorization

Attempt to request other players' hands, submit actions for another seat, forge outcomes, replay expired credentials, inspect spectator payloads, and fetch restricted exports. Check hidden information is absent from the payload—not merely absent from the screen. Test a person controlling more than one kingdom and multiple people on one side.

### AI tests

Run deterministic scenario fixtures and randomized legal-play campaigns. Report completed games, illegal proposals, stalls, decision costs, and failure traces. Exercise every pending-decision category. Changing hidden information that a bot has not observed must not change its decision except through a deliberately sampled belief process independent of the real hidden state.

Use adversarial examples where short-term attacks lose the objective, a response matters, preserving a piece matters, or a teammate needs help. Difficulty labels must be backed by comparison with baseline policies, not by branding.

### UI and deployment tests

Test portrait touch at the specified small viewport, card readability, handoff concealment, pinch/drag cancellation, safe areas, orientation changes, keyboard play, and reduced motion. Ensure every required action is reachable without hover and without page-length scrolling.

Play a complete human-versus-bot game locally; a local mixed-human/bot game with an out-of-turn private decision; an online two-browser game; and an online mixed-controller game with disconnect/resume. Test the largest supported verified scenario for performance, not just a tiny demonstration board.

On Cloudflare, test duplicate alarms/jobs, stale bot replies, socket hibernation, multi-tab races, missing acknowledgements, client version mismatch, expired rooms, and failure during persistence. On Sites, test the actual hosted build rather than assuming local development proves compatibility.

## 15. Delivery sequence

Keep each milestone runnable and tested. Implement in this order unless a verified dependency justifies another order:

**A — Source and content foundation.** Establish versions and provenance; define rules/content schemas; import a fully verified short scenario and its map data; produce an annotated setup review. Build a clearly separate synthetic fixture only for diagnostics when needed.

**B — Complete Basic local game.** Implement the complete Basic rules needed for that scenario, all decisions, legal actions, results, saves, and a baseline bot. Finish real games. Do not stop at movement and combat animation.

**C — Basic breadth and teaching.** Extend verified kingdom/scenario coverage, improve mobile interaction and explanations, and exercise the priority campaigns. Keep unsupported campaigns visibly unavailable rather than faking their setup.

**D — Complete Advanced local game.** Add the remaining source-defined rules, executable content, timing decisions, and private handoffs. Run the corrections suite. Improve bots to cover every newly enabled decision.

**E — Selected deployment.** For Sites, deploy/review the working local game. For Cloudflare, add authoritative rooms and remote transport, then test parity and failure recovery. Deployment work must not fork the rules engine.

**F — Full content and polish.** Finish the remaining base-game inventory, linked play, reference browser, performance work, stronger AI, accessibility, and deployment documentation. The advertised base-game target remains the target; staged delivery is not permission to silently redefine “complete.”

The Paper Wars 109 solitaire material is an optional separately sourced supplement. Its publisher-listed existence does not mean a universal official bot system is available for all base scenarios. Do not claim the algorithmic bots are official rules. [G13]

## 16. Required final implementation handoff

Return the working source project, build commands, selected deployment instructions, and the real hosted URL only when published. Include:

- An honest feature/content coverage report: implemented, tested, unavailable, and known limitations.
- The source registry, rule coverage, correction ledger, content manifests, and unresolved issues.
- Automated tests, useful golden fixtures, and a reproducible bug-report export.
- Local save/import instructions, online reconnect behavior, and documented privacy boundaries.
- An explanation of bot behavior and limits, not unsupported claims of intelligence.
- A deployment README with required accounts/bindings, migrations, environment variables, and secret handling.

Do not replace runnable deliverables with a plan. Do not say “all rules implemented” while any enabled mechanic still uses a generic placeholder. When access or credentials block a piece of the work, finish everything independent of that blocker and identify exactly what is missing.

The desired result is the actual strategic game with administrative work removed: readable choices, correct outcomes, playable bots, private decisions handled carefully, and the same rules whether the match lives in one browser or in a Cloudflare room.

## Source manifest for the implementation agent

These are retrieval starting points, not a claim that every linked item has been fully examined. Follow official hubs for updated files. The separate research index adds status details and additional tutorials.

### Game sources

[G01] Compass Games product, component overview, and official rules/download hub:
https://www.compassgames.com/product/burning-banners-rage-of-the-witch-queen/

[G02] Undying Rules, publisher-linked file (re-resolve from G01; direct retrieval was unreliable):
https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying%2BRules%2Bv1.1.pdf

[G03] Undying Campaign Notes, publisher-linked file (re-resolve from G01):
https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying%2BCampaign%2BNotes%2Bv.1.0.pdf

[G04] Official August 2024 clarifications: author-upload listing plus publisher-linked file:
https://boardgamegeek.com/filepage/277937/burning-banners-clarifications-and-errata
https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Burning%2BBanners%2BClarifications%2B%26%2BErrata%2B0824.pdf

[G05] Corrected setup card: on G01, follow “Updated Setup Card Front for The Spire of the Moon (Oathborn).” Do not guess a direct asset URL.

[G06] Living-rulebook text mirror, not official hosting; inspect document body, not generated summary:
https://www.scribd.com/document/816753648/Undying-Rules-v1-1

[G07] August errata text mirror, not official hosting; inspect document body:
https://www.scribd.com/document/884204022/Burning-Banners-Clarifications-Errata-0824

[G08] Searchable original transcription; do not assume living-rule parity:
https://www.rulespal.com/burning-banners/rulebook

[G09] Original official rules upload listing; older than the living revision:
https://boardgamegeek.com/filepage/278003/burning-banners-official-rules-booklet

[G10] Designer Basic tutorial, linked by publisher:
https://www.youtube.com/watch?v=_u_ifDZVdYQ

[G11] Designer Advanced tutorial, linked by publisher:
https://www.youtube.com/watch?v=5IoaX8Hmsso

[G12] Designer playthrough, Out of the Shadows, parts 1 and 2:
https://www.youtube.com/watch?v=TouvmXLKdNI
https://www.youtube.com/watch?v=9qwIwCWD93U

[G13] Publisher listing for Paper Wars 109, including a Burning Banners solitaire scenario:
https://www.compassgames.com/product/issue-109-magazine-game-baltic-freikorps-1919/

### ChatGPT Sites

[O01] Creating and using ChatGPT Sites:
https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites

[O02] Official Sites workflow documentation:
https://learn.chatgpt.com/docs/sites

[O03] Sites terms, including content rights responsibilities:
https://openai.com/policies/chatgpt-sites-terms/

### Cloudflare and browser APIs

[C01] Durable Objects:
https://developers.cloudflare.com/durable-objects/

[C02] SQLite-backed Durable Object storage and transactions:
https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/

[C03] WebSockets and hibernation:
https://developers.cloudflare.com/durable-objects/best-practices/websockets/

[C04] Durable Object alarms:
https://developers.cloudflare.com/durable-objects/api/alarms/

[C05] Workers static assets:
https://developers.cloudflare.com/workers/static-assets/

[C06] Workers KV consistency:
https://developers.cloudflare.com/kv/concepts/how-kv-works/

[C07] Queues delivery guarantees:
https://developers.cloudflare.com/queues/reference/delivery-guarantees/

[C08] Static asset / Worker routing:
https://developers.cloudflare.com/workers/static-assets/routing/worker-script/

[C09] Current Durable Object limits:
https://developers.cloudflare.com/durable-objects/platform/limits/

[C10] D1 documentation, to consult before optional integration:
https://developers.cloudflare.com/d1/

[C11] R2 documentation, to consult before optional integration:
https://developers.cloudflare.com/r2/

[W01] IndexedDB:
https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

[W02] Web Workers:
https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
