# Version 1 Basic content packs

Import a JSON object with `version: 1`, `hexes`, `unitDefinitions` and a single `scenario`. Optional `controllers` maps participating kingdom IDs to `human` or `ai`; optional `seed` is an unsigned 32-bit integer. The full field types are defined in `src/engine.ts` and checked at runtime by `validateContentPack` in `src/content-validation.ts`.

Content JSON imports and exports are limited to 20 MB. The editor preserves campaign-only settlement fields when applying visible hex properties.

The validator checks plain JSON, known fields, bounded arrays and numbers, unique IDs and axial coordinates, reciprocal neighbor edges, unit supply, initial placements, kingdom participation, turn order and scenario references. It never executes imported effects or code. Structural validity does not certify official board-game fidelity. Keep an imported scenario's provenance and review status visible.

Hexes use axial `q,r` coordinates; `coastal: true` may accompany a Forest, Mountain or other coastal land terrain. `edges` is keyed by neighboring hex ID. Declared edges must be reciprocal, with matching `road`, `river` (1 or 2), `sea` and `coastal` values. A missing edge declaration uses the engine's default adjacency. Cards and Advanced effect definitions are unsupported in a Basic pack.

Unit abilities are explicit supported tags: `ranged`, `stealth`, `regenerate`, `flying`, `mage`, `siege`, `mining`. Characteristics are `feral`, `fragile`, `huge`, `siege`, `siege-engine`. The last two are engine representation tags for the printed Siege Engine role. A Mage tag has no card functionality while Advanced is disabled.

Two objective forms are supported:

- `control`: `hexIds` lists Settlement targets; `count` is 1 through target count. Optional `kingdom` requires that exact participating kingdom to control targets; otherwise the Invader side counts. `deadlineOnly` defaults to true.
- `survival`: the original digital fixture convention checks whether the specified Invader kingdom remains uncollapsed at deadline, or any Invader kingdom if omitted. It requires `hexIds: []`, `count: 0`, and must not set `deadlineOnly: false`. This convention does not substitute for an untranscribed official campaign victory rule.

Ordinary independent artwork paths, HTTPS images and PNG/WebP/JPEG/GIF data URLs are accepted. JavaScript URLs, executable HTML/SVG, traversal paths, unsafe object keys, functions and accessors are rejected.
