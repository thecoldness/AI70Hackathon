import { artById, seedGraph } from './data';
import { featureForId } from './learning';

/** A recorded route: real node ids in the order someone visited them, with their captions. */
export interface RecordedRoute { id: string; name: string; nodes: string[]; captions: string[] }

export interface SuggestedRoute {
  id: string;
  title: string;
  nodes: string[];
  captions: string[];
  /** One line on how it was put together, shown with the route. */
  basis: string;
}

const nodeById = new Map(seedGraph.nodes.map(n => [n.id, n]));
const isArtNode = (id: string) => { const k = nodeById.get(id)?.kind; return k === 'artwork' || k === 'reference'; };
const titleOf = (id: string) => nodeById.get(id)?.title ?? artById[id]?.title ?? id;

/**
 * Up to `max` routes that start at `startId`, assembled only from routes people recorded:
 * 1. the rest of any recorded route that already passes through this image;
 * 2. walks over the "what came next" network of all recorded routes, most-travelled step first;
 * 3. for an image no route touches, a bridge to the most similar image that starts recorded routes.
 * Never presented as anyone's real history.
 */
export function suggestRoutesFrom(startId: string, recorded: RecordedRoute[], max = 3): SuggestedRoute[] {
  // Collect every candidate first, then pick for variety: different endpoints before repeats.
  const candidates: Omit<SuggestedRoute, 'id' | 'title'>[] = [];
  const seen = new Set<string>();
  const add = (r: Omit<SuggestedRoute, 'id' | 'title'>) => {
    const key = r.nodes.join('>');
    if (r.nodes.length < 3 || seen.has(key)) return;
    seen.add(key);
    candidates.push(r);
  };

  // What came next after each node, across every recorded route.
  const next = new Map<string, Map<string, { count: number; caption: string }>>();
  for (const r of recorded) {
    r.nodes.slice(0, -1).forEach((id, i) => {
      const to = r.nodes[i + 1];
      if (!nodeById.has(to)) return;
      const m = next.get(id) ?? new Map();
      const e = m.get(to) ?? { count: 0, caption: r.captions[i + 1] ?? '' };
      e.count += 1;
      m.set(to, e);
      next.set(id, m);
    });
  }
  const walk = (from: string, firstChoice: number, visited: Set<string>, limit = 6) => {
    const nodes = [from], captions: string[] = [];
    let cur = from;
    for (let step = 0; step < limit - 1; step++) {
      const options = [...(next.get(cur) ?? new Map()).entries()].filter(([id]) => !visited.has(id) && !nodes.includes(id)).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
      const pick = options[step === 0 ? Math.min(firstChoice, options.length - 1) : 0];
      if (!pick) break;
      nodes.push(pick[0]); captions.push(pick[1].caption);
      cur = pick[0];
    }
    return { nodes, captions };
  };

  const startCaption = `Start here: ${titleOf(startId)}.`;

  // 1. Continue recorded routes that pass through this image (a route that already starts here is listed as-is, not repeated).
  for (const r of recorded) {
    const i = r.nodes.indexOf(startId);
    if (i > 0 && i < r.nodes.length - 2) {
      add({ nodes: r.nodes.slice(i), captions: [startCaption, ...r.captions.slice(i + 1)], basis: `Continues ${r.name}'s recorded route from this image.` });
    }
  }
  // 2. Recombine: the most-travelled next steps, starting with a different first step each time.
  for (let k = 0; k < 3 && next.has(startId); k++) {
    const w = walk(startId, k, new Set());
    add({ nodes: w.nodes, captions: [startCaption, ...w.captions], basis: 'Joins the steps people most often took after each image.' });
  }
  // 3. Bridge: hop to the most similar image that recorded routes continue from.
  {
    const start = artById[startId] ?? artById[nodeById.get(startId)?.artId ?? ''];
    if (start) {
      const startTags = new Set(start.tags);
      const startTheme = featureForId(start.id);
      const bridges = [...next.keys()]
        .filter(id => id !== startId && isArtNode(id))
        .map(id => {
          const art = artById[id];
          const shared = art.tags.filter(t => startTags.has(t));
          return { id, shared, score: shared.length + (featureForId(id) === startTheme ? 2 : 0) };
        })
        .filter(b => b.score > 0)
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
      for (const b of bridges.slice(0, max * 2)) {
        const w = walk(b.id, 0, new Set([startId]), 5);
        const why = b.shared.length ? `Shares ${b.shared.slice(0, 2).join(' · ')} with ${start.title}.` : `Same learning theme as ${start.title}.`;
        add({ nodes: [startId, ...w.nodes], captions: [startCaption, why, ...w.captions], basis: `Bridges to ${titleOf(b.id)}, a similar image, then follows recorded steps.` });
      }
    }
  }
  const ends = new Set<string>();
  const picked = [
    ...candidates.filter(c => { const e = c.nodes[c.nodes.length - 1]; return ends.has(e) ? false : (ends.add(e), true); }),
    ...candidates,
  ].filter((c, i, all) => all.indexOf(c) === i).slice(0, max);
  return picked.map((r, i) => ({ ...r, id: `suggest-${startId}-${i}`, title: `Toward ${titleOf(r.nodes[r.nodes.length - 1])}` }));
}
