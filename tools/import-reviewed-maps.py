"""Import independently inspected map facts; never copy the scanned artwork.

Usage: python tools/import-reviewed-maps.py /path/to/research/map-verification
"""
import hashlib
import json
import sys
from pathlib import Path

source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
partials = json.loads((source / 'geometric-partials.json').read_text())
names = {'broken-coast': 'The Broken Coast', 'wildlands': 'The Wildlands',
         'imperial-heartland': 'Imperial Heartland', 'fields-of-ash': 'Fields of Ash'}
boards = []
seams = json.loads((source / 'seam-review.json').read_text())
shipping = json.loads((source / 'broken-coast-shipping-candidate-review.json').read_text())
for board_id, name in names.items():
    path = source / (board_id + '-review.json')
    board = json.loads(path.read_text())
    for update in seams.get('internalEdgeUpdates', []):
        if update['board'] != board_id:
            continue
        edge = next(e for e in board['edges'] if {tuple(e['a']), tuple(e['b'])} == {tuple(update['a']), tuple(update['b'])})
        for flag in ('road', 'river', 'waterway', 'sea', 'coastal'):
            if flag in update:
                edge[flag] = update[flag]
    updates = [u for u in seams.get('hexUpdates', []) if u['board'] == board_id]
    if shipping['boardId'] == board_id:
        updates += shipping['hexUpdates']
        for review in shipping['candidateEdgeReviews']:
            edge = next(e for e in board['edges'] if {tuple(e['a']), tuple(e['b'])} == {tuple(review['a']), tuple(review['b'])})
            for flag in ('river', 'waterway'):
                if review.get('verified' + flag.title()) and flag in review:
                    edge[flag] = review[flag]
            edge['shippingReview'] = review['basis']
        board['uncertainties'] += shipping['uncertainties']
    for update in updates:
        cell = next(c for c in board['hexes'] if (c['q'], c['j']) == (update['q'], update['j']))
        for flag in ('coastal', 'majorRiver'):
            if flag in update:
                cell[flag] = update[flag]
    for cell in board['hexes']:
        # Off-scan halves are gated by coverage, and receive their complete
        # terrain from the adjoining board. Keep the review qualification.
        if cell['terrain'] is None:
            cell['terrain'] = cell.get('visibleHalfTerrain', 'clear')
            cell['notes'] = cell.get('notes', '') + ' Only the clipped half is visible; prohibited alone.'
        settlement = cell.get('settlement')
        if settlement:
            cell['settlement'] = {k: v for k, v in settlement.items()
                                  if k in ('name', 'loyalty', 'city', 'fortified', 'port', 'wilderness', 'neutralFriendlyTo')}
            cell['settlement']['loyalty'] = settlement.get('sourceLoyalty', settlement.get('neutralLoyalty', settlement.get('loyalty')))
    board['name'] = name
    board['partials'] = [{k: c[k] for k in ('q', 'j', 'fraction')}
                         for c in partials[board_id]['candidates']]
    board['reviewSha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    boards.append(board)
evidence = {'version': 1, 'source': {
    'url': 'https://vassalengine.org/library/projects/Burning_Banners',
    'moduleUrl': 'https://obj.vassalengine.org/images/8/84/Burning_Banners_v1.7.vmod',
    'moduleSha256': 'edf9991723174a2c3105a70bbfe10a96da1f72f17581789d3524f7126a01927e',
    'method': 'Manual inspection of board centers, settlement bodies and individual hexside crossings. Unresolved crossings remain explicitly listed. Artwork is not redistributed.'},
    'boards': boards, 'seams': seams}
(root / 'content/maps-reviewed.json').write_text(json.dumps(evidence, indent=2) + '\n')
print(json.dumps({'boards': len(boards), 'centers': sum(len(b['hexes']) for b in boards),
                  'edges': sum(len(b['edges']) for b in boards),
                  'uncertainties': sum(len(b['uncertainties']) for b in boards)}))
