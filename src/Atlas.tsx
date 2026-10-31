import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import type { SimulationLinkDatum } from 'd3-force';
import { ArrowRight, Maximize, Minus, Plus, Route } from 'lucide-react';
import { artById, learningPaths, seedGraph } from './data';
import type { AtlasNode } from './data';
import { communityFeatures, featureForId, peerStudiesForArt } from './learning';
import { libraryHighlights } from './library';
import { suggestRoutesFrom } from './routes';
import type { FeatureGroup } from './learning';

type SimNode = AtlasNode & { x: number; y: number; group: FeatureGroup };
type SimLink = SimulationLinkDatum<SimNode> & { kind: string; source: SimNode; target: SimNode };

const featureColor: Record<FeatureGroup, string> = { character: 'var(--ochre)', depth: 'var(--clay)', marks: 'var(--sage)', light: 'var(--plum)', line: 'var(--sepia)', shape: 'var(--teal)', graphic: 'var(--rose)' };

/**
 * A few images stand for each theme cluster; every other artwork draws as a dot.
 * New clusters use their chosen highlights; the original four use their root plus their two most-liked references.
 */
const showcase = (() => {
  const ids = new Set<string>(Object.values(libraryHighlights).flat());
  for (const [g, f] of Object.entries(communityFeatures) as [FeatureGroup, typeof communityFeatures[FeatureGroup]][]) {
    if (g in libraryHighlights) continue;
    ids.add(f.root);
    seedGraph.nodes
      .filter(n => (n.kind === 'reference' || n.kind === 'artwork') && n.id !== f.root && featureForId(n.artId) === g)
      .sort((a, b) => b.likes - a.likes).slice(0, 2)
      .forEach(n => ids.add(n.id));
  }
  return ids;
})();
const isArt = (n: AtlasNode) => n.kind === 'artwork' || n.kind === 'reference';
const themeRoots = new Set(Object.values(communityFeatures).map(f => f.root));

// The layout is computed once: deterministic, and identical every time the atlas opens.
const layout = (() => {
  const roots = new Map(Object.values(communityFeatures).map(f => [f.root, f]));
  const nodes = seedGraph.nodes.map((n, i) => {
    const group = featureForId(n.artId);
    const c = communityFeatures[group];
    const root = roots.get(n.id);
    return { ...n, group, x: c.x + Math.cos(i * 2.4) * (12 + i % 30), y: c.y + Math.sin(i * 2.4) * (12 + i % 30), fx: root ? root.x : null, fy: root ? root.y : null } as SimNode;
  });
  const byId = new Map(nodes.map(n => [n.id, n]));
  // Pin each cluster's supporting images around its root. For each one, try 24 directions and keep
  // the spot whose enlarged image box stays furthest clear of every root and every image already placed.
  const G = 3.75; // the largest zoom-out growth, so boxes are checked at their biggest
  const half = (root: boolean) => root ? [(120 * G) / 2 + 8, (120 * .74 * G) / 2 + 8] : [(92 * G) / 2 + 8, (92 * .74 * G) / 2 + 8];
  const placed: { x: number; y: number; root: boolean }[] = Object.values(communityFeatures).map(f => ({ x: f.x, y: f.y, root: true }));
  const clearance = (x: number, y: number) => Math.min(...placed.map(p => {
    const [aw, ah] = half(p.root), [bw, bh] = half(false);
    return Math.max(Math.abs(x - p.x) / (aw + bw), Math.abs(y - p.y) / (ah + bh)); // > 1 means no overlap
  }));
  for (const [g, f] of Object.entries(communityFeatures) as [FeatureGroup, typeof communityFeatures[FeatureGroup]][]) {
    nodes.filter(n => n.group === g && showcase.has(n.id) && n.id !== f.root).slice(0, 2).forEach(n => {
      let best = { x: f.x, y: f.y, score: -1 };
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const x = f.x + Math.cos(a) * 480, y = f.y + Math.sin(a) * 340;
        const score = clearance(x, y);
        if (score > best.score) best = { x, y, score };
      }
      n.fx = best.x; n.fy = best.y;
      placed.push({ x: best.x, y: best.y, root: false });
    });
  }
  const links = seedGraph.links.map(l => ({ ...l })) as unknown as SimLink[];
  forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-100))
    .force('x', forceX<SimNode>(d => communityFeatures[d.group].x).strength(.11))
    .force('y', forceY<SimNode>(d => communityFeatures[d.group].y).strength(.11))
    .force('link', forceLink<SimNode, SimLink>(links).id(d => d.id).strength(.25).distance(l => (l.source as SimNode).group === (l.target as SimNode).group ? 74 : 350))
    .force('collide', forceCollide<SimNode>(d => showcase.has(d.id) ? 46 : isArt(d) ? 8 : 12))
    .stop()
    .tick(220);
  // Each theme's halo grows to cover its members, so large user collections still read as one cluster.
  const halo = Object.fromEntries((Object.keys(communityFeatures) as FeatureGroup[]).map(g => {
    const c = communityFeatures[g];
    const d = nodes.filter(n => n.group === g).map(n => Math.hypot(n.x - c.x, n.y - c.y)).sort((a, b) => a - b);
    const r = Math.max(190, (d[Math.floor(d.length * .85)] || 0) + 50); // ignore a few stragglers
    return [g, r];
  })) as Record<FeatureGroup, number>;
  return { nodes, links, byId, halo };
})();

// Artworks that several (fictional) people have studied: clicking them fans the studies out around the original.
type PeerStudy = ReturnType<typeof peerStudiesForArt>[number];
const fanStudies = new Map(layout.nodes.filter(isArt).map(n => [n.id, peerStudiesForArt(n.artId)] as const).filter(([, s]) => s.length >= 3));
// Where each study card lands, in base units around the enlarged original (top-left, top-right, below).
const fanSlots: [number, number][] = [[-215, -125], [215, -125], [0, 170]];

interface Camera { k: number; x: number; y: number }

/** A completed path of yours, shared from My path: art ids in order, plus your study image. */
export interface SharedPath { id: string; title: string; path: string[]; study: string }
type AtlasPath = { id: string; name: string; initials: string; title: string; description: string; nodes: string[]; captions: string[]; mine?: boolean; suggested?: boolean };
const studyNodeId = (pathId: string) => `my-study-${pathId}`;

interface Props {
  hideOthers: boolean;
  myPaths: SharedPath[];
  goalArtId: string | null;
  fromArtId: string | null;
  onOpenArt: (artId: string) => void;
}

export function Atlas({ hideOthers, myPaths, goalArtId, fromArtId, onOpenArt }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [cam, setCam] = useState<Camera>({ k: .6, x: 0, y: 0 });
  const [pathId, setPathId] = useState<string | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [spread, setSpread] = useState<string | null>(null);
  // The image whose routes the sidebar shows. Clicking an image on the map selects it; arriving
  // from an image's Community page ("Paths from here") selects that image.
  const [selectedArt, setSelectedArt] = useState<string | null>(fromArtId);
  useEffect(() => { setSelectedArt(fromArtId); }, [fromArtId]);
  const startArt = selectedArt;
  // Studies by others never fan out while the viewer has chosen to hide them.
  const fans: Map<string, PeerStudy[]> = hideOthers ? new Map() : fanStudies;
  const drag = useRef<{ x: number; y: number; cam: Camera } | null>(null);

  // Your study is not part of the shared graph, so it gets a node of its own beside the path's last image.
  const studyNodes = useMemo(() => new Map(myPaths.map(mp => {
    const last = layout.byId.get(mp.path[mp.path.length - 1])!;
    const others = mp.path.map(id => layout.byId.get(id)!);
    // Try 12 directions around the last step; keep the spot furthest from the path's other images.
    let best = { x: last.x + 150, y: last.y, d: -1 };
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, x = last.x + Math.cos(a) * 150, y = last.y + Math.sin(a) * 120;
      const d = Math.min(...others.map(o => Math.hypot(o.x - x, o.y - y)));
      if (d > best.d) best = { x, y, d };
    }
    return [studyNodeId(mp.id), { ...last, id: studyNodeId(mp.id), kind: 'study', title: mp.title, image: mp.study, person: 'You', x: best.x, y: best.y } as SimNode];
  })), [myPaths]);
  const nodeOf = (id: string) => layout.byId.get(id) ?? studyNodes.get(id);
  // Routes that start at the chosen image, assembled only from the recorded routes above (never anyone's real history).
  const suggestions = useMemo(() => startArt ? suggestRoutesFrom(startArt, [
    ...learningPaths,
    ...myPaths.map(mp => ({ id: mp.id, name: 'You', nodes: mp.path, captions: mp.path.map(() => 'A step from your own path.') })),
  ]) : [], [startArt, myPaths]);
  const allPaths: AtlasPath[] = [
    ...suggestions.map(sg => ({ id: sg.id, name: 'Suggested', initials: '↗', suggested: true, title: sg.title, description: sg.basis, nodes: sg.nodes, captions: sg.captions })),
    ...myPaths.map(mp => ({
      id: mp.id, name: 'You', initials: 'You', mine: true, title: mp.title,
      description: 'Your completed path, shared from My path. Your learning log and notes stay private.',
      nodes: [...mp.path, studyNodeId(mp.id)],
      captions: [...mp.path.map((_, i) => i === 0 ? 'Where you started, with your question.' : 'A reference you kept for the same question.'), 'The study you made.'],
    })),
    ...learningPaths,
  ];
  const path = allPaths.find(p => p.id === pathId) || null;

  const fit = useCallback((ids?: string[]) => {
    const pts = (ids ? ids.map(id => nodeOf(id)!).filter(Boolean) : layout.nodes);
    const xs = pts.map(n => n.x), ys = pts.map(n => n.y);
    const minX = Math.min(...xs) - 70, maxX = Math.max(...xs) + 70, minY = Math.min(...ys) - 70, maxY = Math.max(...ys) + 70;
    const k = Math.min(1.6, size.w / (maxX - minX), size.h / (maxY - minY));
    setCam({ k, x: size.w / 2 - ((minX + maxX) / 2) * k, y: size.h / 2 - ((minY + maxY) / 2) * k });
  }, [size]);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);


  const startPath = (id: string) => { setPathId(id); setFocus(null); setPicked(null); setSpread(null); };
  const centerOn = (n: SimNode) => {
    const k = .75; // grow is 1 here, so the fan is drawn at its natural size and fits the canvas
    setCam({ k, x: size.w / 2 - n.x * k, y: size.h / 2 - n.y * k });
  };
  const toggleSpread = (n: SimNode) => {
    if (spread === n.id) return setSpread(null);
    setSpread(n.id); setPicked(null); setPathId(null);
    centerOn(n);
  };
  // Re-frame whenever the canvas resizes or the view changes; an open fan keeps the camera on its image.
  useEffect(() => {
    if (spread) centerOn(layout.byId.get(spread)!);
    else if (path) fit(path.nodes);
    else fit();
  }, [size, pathId]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoomBy = (f: number, cx = size.w / 2, cy = size.h / 2) => setCam(c => {
    const k = Math.max(.25, Math.min(3, c.k * f));
    return { k, x: cx - (cx - c.x) * (k / c.k), y: cy - (cy - c.y) * (k / c.k) };
  });
  const onDown = (e: ReactPointerEvent) => {
    if ((e.target as Element).closest('[data-node],[data-label]')) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cam };
  };
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current; if (!d) return;
    setCam({ ...d.cam, x: d.cam.x + e.clientX - d.x, y: d.cam.y + e.clientY - d.y });
  };

  const routeEdges = useMemo(() => {
    if (!path) return [];
    return path.nodes.slice(1).map((id, i) => [nodeOf(path.nodes[i])!, nodeOf(id)!] as const);
  }, [pathId, studyNodes]); // eslint-disable-line react-hooks/exhaustive-deps
  // Representative images keep a readable size when zoomed out (up to 3.75× their base size).
  const grow = Math.max(1, Math.min(3.75, .75 / cam.k));
  const routeIndex = new Map(path ? path.nodes.map((id, i) => [id, i + 1]) : []);

  const recordedPaths = allPaths.filter(p => !p.suggested);
  const candidatePaths = startArt ? recordedPaths.filter(p => p.nodes.includes(startArt)) : recordedPaths;
  const selectArt = (artId: string) => { setSelectedArt(artId); setPathId(null); setPicked(null); setSpread(null); setFocus(null); };
  const pickedNode = picked ? layout.byId.get(picked) : null;
  const pickedPaths = picked ? recordedPaths.filter(p => p.nodes.includes(picked)) : [];

  return (
    <div className="atlas">
      <div className="atlas-canvas" ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => { drag.current = null; }}
        onWheel={e => { const r = box.current!.getBoundingClientRect(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }}>
        <svg width={size.w} height={size.h}>
          <defs>
            <clipPath id="clip-r" clipPathUnits="objectBoundingBox"><rect width="1" height="1" rx=".14" /></clipPath>
            <clipPath id="clip-c" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5" /></clipPath>
          </defs>
          <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
            {(Object.entries(communityFeatures) as [FeatureGroup, typeof communityFeatures[FeatureGroup]][]).map(([g, f]) => (
              <circle key={g} cx={f.x} cy={f.y} r={layout.halo[g]} className="atlas-halo" style={{ fill: featureColor[g] }} />
            ))}
            <g className={`atlas-links ${path ? 'muted' : ''}`}>
              {layout.links.map((l, i) => <line key={i} x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y} className={l.kind} />)}
            </g>
            <g className={`atlas-route ${path?.suggested ? 'suggested' : ''}`}>
              {routeEdges.map(([a, b], i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />)}
            </g>
            {spread && <StudyFan key={`l-${spread}`} part="links" n={layout.byId.get(spread)!} studies={fans.get(spread)!} grow={grow} onOpen={() => onOpenArt(layout.byId.get(spread)!.artId)} />}
            {layout.nodes.map(n => <AtlasNodeView key={n.id} n={n} idx={routeIndex.get(n.id)} faded={!!path && !routeIndex.has(n.id)} goal={n.id === goalArtId} picked={picked === n.id || (!path && n.id === startArt) || (!!path && focus !== null && path.nodes[focus] === n.id)} grow={grow}
              fan={fans.get(n.id)?.length} spread={spread === n.id}
              onClick={() => fans.has(n.id) ? toggleSpread(n) : isArt(n) ? (startArt === n.artId && !path ? onOpenArt(n.artId) : selectArt(n.artId)) : setPicked(n.id)} />)}
            {path?.mine && (() => {
              const v = studyNodes.get(path.nodes[path.nodes.length - 1])!;
              return (
                <g data-node className="atlas-node my-study in-route" transform={`translate(${v.x} ${v.y})`}>
                  <title>{`Your study: ${v.title}`}</title>
                  <rect x={-40} y={-32} width={80} height={64} rx={8} className="frame" style={{ stroke: 'var(--clay)' }} />
                  <image href={v.image} x={-38} y={-30} width={76} height={60} preserveAspectRatio="xMidYMid meet" />
                  <text y={48} className="node-title">Your study</text>
                  <g transform="translate(-42 -34)"><circle r={9} className="idx" /><text className="idx-t" dy="3.5">{path.nodes.length}</text></g>
                </g>
              );
            })()}
            {spread && <StudyFan key={`c-${spread}`} part="cards" n={layout.byId.get(spread)!} studies={fans.get(spread)!} grow={grow} onOpen={() => onOpenArt(layout.byId.get(spread)!.artId)} />}
            {/* Theme labels step aside while a path is shown, so they never sit on the route. */}
            {!path && (Object.entries(communityFeatures) as [FeatureGroup, typeof communityFeatures[FeatureGroup]][]).map(([g, f]) => (
              <g key={g} data-label className="atlas-label" onClick={() => onOpenArt(f.root)}
                // Each theme label sits centred just above its own (enlarged) root image, and grows when zoomed out so it stays legible.
                transform={`translate(${f.x} ${f.y - (120 * .74 / 2) * grow - 8 * Math.max(1, .5 / cam.k)}) scale(${Math.max(1, .5 / cam.k)})`}>
                <text className="t1" y={-20} style={{ fill: featureColor[g] }}>{f.title}</text>
                <text className="t2" y={-4}>{f.subject}</text>
              </g>
            ))}
          </g>
        </svg>
        <div className="atlas-zoom" onPointerDown={e => e.stopPropagation()}>
          <button className="icon-btn" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out"><Minus size={15} /></button>
          <span>{Math.round(cam.k * 100)}%</span>
          <button className="icon-btn" onClick={() => zoomBy(1.2)} aria-label="Zoom in"><Plus size={15} /></button>
          <i />
          <button className="icon-btn" onClick={() => path ? fit(path.nodes) : fit()} aria-label="Fit to view"><Maximize size={14} /></button>
        </div>
        <div className="atlas-legend"><i className="ref" /> Reference <i className="study" /> Practice <i className="reflection" /> Reflection <i className="tutorial" /> Tutorial <span>· Illustrative learning themes</span></div>
      </div>

      <aside className="atlas-side">
        {spread ? (
          <>
            <button className="rc-back" onClick={() => setSpread(null)}>← All paths</button>
            <span className="eyebrow">One image · {fans.get(spread)!.length} people studied it</span>
            <h3 className="serif">{artById[layout.byId.get(spread)!.artId].title}</h3>
            <p className="atlas-desc">Same reference, three different hands. Each person copied a different part, in their own way.</p>
            {fans.get(spread)!.map(st => (
              <div key={st.id} className="fan-note">
                <img src={st.image} alt={st.title} />
                <div><strong>{st.title}</strong><em>{st.person}</em><p>{st.text}</p></div>
              </div>
            ))}
            <span className="rc-prov">{fans.get(spread)![0].provenance}</span>
            <button className="btn sm primary" onClick={() => selectArt(layout.byId.get(spread)!.artId)}><Route size={13} /> Paths from this image</button>
            <button className="btn sm" onClick={() => onOpenArt(layout.byId.get(spread)!.artId)}>Open this image's community <ArrowRight size={13} /></button>
          </>
        ) : path ? (
          <>
            <button className="rc-back" onClick={() => setPathId(null)}>← All paths</button>
            <span className="eyebrow">{path.suggested ? 'Suggested route · built from recorded paths' : path.mine ? 'Your path · shared to Community' : `${path.name}'s recorded path · demo`}</span>
            <h3 className="serif">{path.title}</h3>
            <p className="atlas-desc">{path.description}</p>
            <ol className="timeline">
              {path.nodes.map((id, i) => {
                const n = nodeOf(id)!;
                const img = n.image || artById[n.artId]?.image;
                const isMine = id.startsWith('my-study-');
                return (
                  <li key={id} className={focus === i ? 'now' : 'past'}>
                    <button onClick={() => setFocus(focus === i ? null : i)} title="Highlight on the map">
                      <span className="tl-num">{i + 1}</span>
                      <img src={img} alt="" className={n.kind === 'study' && !isMine ? 'demo-study' : ''} />
                      <span className="tl-text"><span className="eyebrow">{i === 0 ? 'Starting point' : isMine ? 'Your study' : n.kind}</span><strong>{n.title}</strong><em>{path.captions[i]}</em></span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </>
        ) : pickedNode ? (
          <>
            <button className="rc-back" onClick={() => setPicked(null)}>← All paths</button>
            <span className="eyebrow">{pickedNode.kind} · {pickedNode.person || 'demo'}</span>
            <h3 className="serif">{pickedNode.title}</h3>
            {pickedNode.note && <p className="atlas-desc">{pickedNode.note}</p>}
            <p className="atlas-desc">Around <button className="link" onClick={() => onOpenArt(pickedNode.artId)}>{artById[pickedNode.artId].title}</button>.</p>
            {pickedPaths.length ? pickedPaths.map(p => <PathCard key={p.id} p={p} endTitle={nodeOf(p.nodes[p.nodes.length - 1])!.title} onClick={() => startPath(p.id)} />) : <p className="atlas-desc">No recorded path passes through this note yet.</p>}
          </>
        ) : (
          <>
            {startArt ? <>
              <button className="rc-back" onClick={() => setSelectedArt(null)}>← All paths</button>
              <div className="atlas-start">
                <img src={artById[startArt].thumb || artById[startArt].image} alt="" />
                <div><span className="eyebrow">Starting from</span><strong className="serif">{artById[startArt].title}</strong></div>
              </div>
              <button className="btn sm" onClick={() => onOpenArt(startArt)}>Open its community page <ArrowRight size={13} /></button>
            </> : <>
              <span className="eyebrow">One person’s path. A new way to see.</span>
              <h3 className="serif">A map of ways to see.</h3>
              <p className="atlas-desc">Grouped by what people were learning to see — not by film or artist. Choose a far-off result to see exactly how someone got there.</p>
              <p className="atlas-tip"><Route size={13} /> Click any image on the map to see routes that start from it.</p>
            </>}
            {startArt && <>
              <span className="eyebrow" style={{ marginTop: 6 }}><Route size={11} style={{ verticalAlign: -1 }} /> Suggested routes from here</span>
              {suggestions.length
                ? allPaths.filter(p => p.suggested).map(p => <PathCard key={p.id} p={p} endTitle={nodeOf(p.nodes[p.nodes.length - 1])!.title} onClick={() => startPath(p.id)} />)
                : <p className="atlas-desc">No recorded route leads anywhere from this image yet.</p>}
              <p className="atlas-note">Put together from routes people recorded — a starting idea, not anyone's actual history.</p>
            </>}
            <span className="eyebrow" style={{ marginTop: 6 }}><Route size={11} style={{ verticalAlign: -1 }} /> {startArt ? 'Recorded paths through this image' : 'Find a learning path'}</span>
            {candidatePaths.length ? candidatePaths.map(p => <PathCard key={p.id} p={p} endTitle={nodeOf(p.nodes[p.nodes.length - 1])!.title} onClick={() => startPath(p.id)} />)
              : <p className="atlas-desc">No one's recorded path passes through this image yet.</p>}
          </>
        )}
      </aside>
    </div>
  );
}

function PathCard({ p, endTitle, onClick }: { p: AtlasPath; endTitle: string; onClick: () => void }) {
  return (
    <button className={`path-card ${p.mine ? 'mine' : ''} ${p.suggested ? 'suggested' : ''}`} onClick={onClick}>
      <span className={`avatar ${p.mine ? 'you' : ''}`}>{p.initials}</span>
      <span><strong>{p.title}</strong><em>{p.suggested ? p.description : `${p.mine ? 'Your path' : p.name} · ${p.nodes.length} steps · ends at “${endTitle}”`}</em></span>
      <ArrowRight size={14} />
    </button>
  );
}

/**
 * The studies of one image, flying out from behind it to their places around it.
 * Drawn in two parts so the dashed links sit under the original and the cards sit over the dots.
 */
function StudyFan({ n, studies, grow, part, onOpen }: { n: SimNode; studies: PeerStudy[]; grow: number; part: 'links' | 'cards'; onOpen: () => void }) {
  const [out, setOut] = useState(false);
  // Start collapsed behind the original, then let the cards fly out (a timer, so it also runs where frames are throttled).
  useEffect(() => { const t = setTimeout(() => setOut(true), 40); return () => clearTimeout(t); }, []);
  const W = 190, H = 120;
  const shown = studies.slice(0, fanSlots.length);
  return (
    <g className={`study-fan ${out ? 'out' : ''}`} transform={`translate(${n.x} ${n.y}) scale(${grow})`}>
      {part === 'links' && shown.map((st, i) => <line key={`l-${st.id}`} x1={0} y1={0} x2={fanSlots[i][0]} y2={fanSlots[i][1]} className="fan-link" style={{ transitionDelay: `${180 + i * 80}ms` }} />)}
      {part === 'cards' && shown.map((st, i) => (
        <g key={st.id} data-node className="fan-card" onClick={onOpen}
          style={{ transform: out ? `translate(${fanSlots[i][0]}px, ${fanSlots[i][1]}px) scale(1)` : 'translate(0px, 0px) scale(.25)', transitionDelay: `${i * 80}ms` }}>
          <title>{`${st.title} - ${st.person}`}</title>
          <rect x={-W / 2 - 5} y={-H / 2 - 5} width={W + 10} height={H + 10} rx={8} className="fan-frame" />
          <image href={st.image} x={-W / 2} y={-H / 2} width={W} height={H} preserveAspectRatio="xMidYMid meet" />
          <text y={H / 2 + 20} className="fan-name">{st.person}</text>
          <text y={H / 2 + 33} className="fan-title">{st.title}</text>
        </g>
      ))}
    </g>
  );
}

function AtlasNodeView({ n, idx, faded, goal, picked, grow, fan, spread, onClick }: { n: SimNode; idx?: number; faded: boolean; goal: boolean; picked: boolean; grow: number; fan?: number; spread: boolean; onClick: () => void }) {
  const art = artById[n.artId];
  const cls = `atlas-node ${n.kind} ${faded ? 'faded' : ''} ${idx ? 'in-route' : ''} ${picked ? 'picked' : ''}`;
  // Images only where they carry meaning: cluster highlights, the shown route, your goal, or what you picked.
  const asImage = showcase.has(n.id) || !!idx || goal || picked;
  let body;
  if (isArt(n) && !asImage) {
    body = <circle r={4.5} className="art-dot" style={{ fill: featureColor[n.group] }} />;
  } else if (n.kind === 'study' && !asImage) {
    body = <circle r={4} className="study-dot" />;
  } else if (isArt(n)) {
    // Opened for its studies, the original shows whole, at its true proportions (fits a 110×110 box).
    const r = art.ratio || 1 / .74;
    const w = spread ? (r >= 1 ? 110 : 110 * r) : themeRoots.has(n.id) ? 120 : 92;
    const h = spread ? w / r : w * .74;
    body = <>
      {goal && <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx={10} className="goal-ring" />}
      <rect x={-w / 2 - 2} y={-h / 2 - 2} width={w + 4} height={h + 4} rx={8} className="frame" style={{ stroke: featureColor[n.group] }} />
      <image href={spread ? art.image : art.thumb || art.image} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio={spread ? 'xMidYMid meet' : 'xMidYMid slice'} clipPath="url(#clip-r)" />
      {themeRoots.has(n.id) && <text y={h / 2 + 16} className="node-title">{n.title}</text>}
      {goal && <text y={-h / 2 - 12} className="node-goal">You started here</text>}
      {fan && !spread && <g className="fan-badge" transform={`translate(0 ${h / 2 + 4})`}><rect x={-30} y={-8} width={60} height={16} rx={8} /><text dy={3.5}>{fan} studies</text></g>}
    </>;
  } else if (n.kind === 'study') {
    body = <><circle r={13} className="ring" /><image href={art.image} x={-11} y={-11} width={22} height={22} preserveAspectRatio="xMidYMid slice" clipPath="url(#clip-c)" className="demo-study" /></>;
  } else {
    body = <circle r={n.kind === 'tutorial' ? 7 : 5.5} className="dot" />;
  }
  return (
    <g data-node className={`${cls} ${spread ? 'spread' : ''}`} transform={`translate(${n.x} ${n.y}) scale(${(showcase.has(n.id) ? grow : 1) * (spread ? 1.5 : 1)})`} onClick={onClick}>
      <title>{n.title}</title>
      {body}
      {idx && <g transform="translate(-22 -22)"><circle r={9} className="idx" /><text className="idx-t" dy="3.5">{idx}</text></g>}
    </g>
  );
}
