import { mapEvidence } from './map-data.js';
const positions = {
    'broken-coast': [0, 0], wildlands: [14, -7], 'imperial-heartland': [0, 15], 'fields-of-ash': [14, 8],
};
export const reviewedBoards = mapEvidence.boards;
const landmarkNames = new Map();
const wildlandMines = { '2,2': 'The Trollshaft', '6,3': 'Black Deep', '11,1': 'North Drift', '7,12': 'Dwarven Falls', '5,14': 'The Endless Paths' };
for (const board of reviewedBoards) {
    const [dq, dr] = positions[board.boardId];
    for (const h of board.hexes) {
        const name = h.mineName ?? (board.boardId === 'wildlands' && h.mine ? wildlandMines[`${h.q},${h.j}`] : null) ?? (h.lair && typeof h.lair === 'object' && 'name' in h.lair ? String(h.lair.name) : null);
        if (name)
            landmarkNames.set(`k-${h.q + dq}-${h.j - Math.floor(h.q / 2) + dr}`, name);
    }
}
export const sourceLandmarkName = (id) => landmarkNames.get(id);
export const sourceCellId = (board, q, j) => `${board}-${q}-${j}`;
/** Source centers share a single axial lattice. North/south half-hexes are one cell.
 * Terrain comes from the reviewed source, never an all-clear template or image inference.
 */
export function joinReviewedBoards(boardIds) {
    const selected = reviewedBoards.filter(b => boardIds.includes(b.boardId));
    if (!selected.length)
        throw new Error('Choose at least one reviewed board.');
    const cells = new Map();
    const aliases = {}, conflicts = [];
    for (const b of selected) {
        const [dq, dr] = positions[b.boardId];
        for (const cell of b.hexes) {
            const q = cell.q + dq, r = cell.j - Math.floor(cell.q / 2) + dr, key = `${q},${r}`;
            const fraction = b.partials.find(p => p.q === cell.q && p.j === cell.j)?.fraction ?? 1;
            const id = `k-${q}-${r}`, alias = sourceCellId(b.boardId, cell.q, cell.j);
            aliases[alias] = id;
            const h = { id, q, r, terrain: cell.terrain };
            for (const flag of ['coastal', 'majorRiver', 'mine'])
                if (cell[flag])
                    h[flag] = true;
            if (cell.settlement)
                h.settlement = structuredClone(cell.settlement);
            if (cell.lair && typeof cell.lair === 'object' && 'pool' in cell.lair)
                h.lairPool = cell.lair.pool;
            if (cell.entry)
                h.entry = cell.entry;
            // A duplicate's center may lie beyond its scan's trim. Prefer the half
            // containing the center; conflicting non-clear terrain still needs review.
            const rank = fraction >= .5 ? 2 : 1, old = cells.get(key);
            if (!old) {
                cells.set(key, { hex: h, coverage: fraction, rank });
                continue;
            }
            if (old.hex.terrain !== h.terrain && old.hex.terrain !== 'clear' && h.terrain !== 'clear')
                conflicts.push(`${alias}: ${old.hex.terrain} / ${h.terrain}`);
            if (h.settlement && old.hex.settlement && h.settlement.name !== old.hex.settlement.name)
                conflicts.push(`${alias}: conflicting settlement names`);
            const preferred = rank > old.rank ? h : old.hex, other = preferred === h ? old.hex : h;
            if (!preferred.settlement && other.settlement)
                preferred.settlement = other.settlement;
            if (other.mine)
                preferred.mine = true;
            if (other.coastal)
                preferred.coastal = true;
            if (other.majorRiver)
                preferred.majorRiver = true;
            if (!preferred.entry && other.entry)
                preferred.entry = other.entry;
            if (!preferred.lairPool && other.lairPool)
                preferred.lairPool = other.lairPool;
            cells.set(key, { hex: preferred, coverage: Math.min(1, old.coverage + fraction), rank: Math.max(rank, old.rank) });
        }
    }
    const byId = new Map([...cells.values()].map(({ hex }) => [hex.id, hex]));
    for (const { hex, coverage } of cells.values())
        if (coverage < .5)
            hex.prohibited = true;
    const crossings = selected.flatMap(b => b.edges.map(e => ({ ...e, boardA: b.boardId, boardB: b.boardId })));
    const seams = mapEvidence.seams;
    crossings.push(...seams.edges.filter(e => boardIds.includes(e.boardA) && boardIds.includes(e.boardB)));
    for (const crossing of crossings) {
        const from = aliases[sourceCellId(crossing.boardA, ...crossing.a)], to = aliases[sourceCellId(crossing.boardB, ...crossing.b)];
        if (!from || !to)
            throw new Error(`${crossing.boardA}: crossing refers to an absent center.`);
        const a = byId.get(from), c = byId.get(to);
        if (Math.max(Math.abs(a.q - c.q), Math.abs(a.r - c.r), Math.abs(a.q + a.r - c.q - c.r)) !== 1)
            throw new Error(`${crossing.boardA}: crossing is not adjacent.`);
        const e = {};
        for (const f of ['road', 'river', 'sea', 'coastal', 'waterway'])
            if (crossing[f] !== undefined)
                e[f] = crossing[f];
        const existing = a.edges?.[to];
        if (existing)
            for (const f of ['river', 'sea', 'coastal'])
                if (existing[f] !== undefined && e[f] !== undefined && existing[f] !== e[f])
                    conflicts.push(`${from} / ${to}: conflicting ${f}`);
        const merged = { ...existing, ...e };
        if (merged.sea && merged.coastal) {
            conflicts.push(`${from} / ${to}: Sea and Coastal conflict`);
            delete merged.coastal;
        }
        (a.edges ??= {})[to] = structuredClone(merged);
        (c.edges ??= {})[from] = structuredClone(merged);
    }
    const seamUncertainties = seams.uncertainties.filter(u => u.edges.some(id => seams.edges.some(e => e.reviewId === id && boardIds.includes(e.boardA) && boardIds.includes(e.boardB)))).length;
    return { hexes: [...byId.values()].sort((a, b) => a.q - b.q || a.r - b.r), aliases, boardIds: selected.map(b => b.boardId), conflicts, uncertainties: selected.reduce((n, b) => n + b.uncertainties.length, 0) + seamUncertainties, complete: selected.every(b => b.complete.terrain && b.complete.edges && b.complete.settlements && !b.uncertainties.length) && !conflicts.length && !seamUncertainties };
}
