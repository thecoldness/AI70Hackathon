import { useEffect, useMemo, useRef, useState } from 'react';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';
import { Expand, Minus, Plus, Quote, Route, Sparkles, Video } from 'lucide-react';
import { artById, seedGraph } from './data';
import { communityFeatures, featureForId, personalThreads, focusForArt } from './learning';
import type { AtlasLink, AtlasNode, Session } from './data';

type PositionedNode = AtlasNode & SimulationNodeDatum & { x: number; y: number };

function layoutGraph(): PositionedNode[] {
  const counts: Record<string, number> = {};
  const nodes = seedGraph.nodes.map((node, index) => {
    const cluster = communityFeatures[featureForId(node.artId)];
    const n = counts[featureForId(node.artId)] = (counts[featureForId(node.artId)] || 0) + 1;
    const theta = n * 2.39996;
    const radius = node.id === cluster.root ? 0 : 85 + (n % 4) * 29;
    return { ...node, x: cluster.x + Math.cos(theta) * radius, y: cluster.y + Math.sin(theta) * radius, ...(node.id === cluster.root ? { fx: cluster.x, fy: cluster.y } : {}), index } as PositionedNode;
  });
  const links = seedGraph.links.map(link => ({ ...link })) as SimulationLinkDatum<PositionedNode>[];
  const simulation = forceSimulation(nodes)
    .force('link', forceLink<PositionedNode, SimulationLinkDatum<PositionedNode>>(links).id(node => node.id).distance(link => featureForId((link.source as PositionedNode).artId) !== featureForId((link.target as PositionedNode).artId) ? 350 : 74).strength(0.25))
    .force('charge', forceManyBody().strength(-100))
    .force('x', forceX<PositionedNode>(node => communityFeatures[featureForId(node.artId)].x).strength(0.11))
    .force('y', forceY<PositionedNode>(node => communityFeatures[featureForId(node.artId)].y).strength(0.11))
    .force('collide', forceCollide<PositionedNode>(node => node.kind === 'artwork' ? 54 : node.kind === 'reflection' ? 12 : 30).strength(0.8))
    .stop();
  simulation.tick(220);
  return nodes;
}

const positionedSeed = layoutGraph();

export default function Atlas({ session, mode, selectedId, onSelect, pathNodes, pathStep, filter }: {
  session: Session;
  mode: 'community' | 'personal';
  selectedId: string | null;
  onSelect: (node: AtlasNode) => void;
  pathNodes: string[];
  pathStep: number;
  filter: 'all' | 'popular' | 'quiet';
}) {
  const [camera, setCamera] = useState({ x: 0, y: -35, scale: 1 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [viewHeight, setViewHeight] = useState(700);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; cameraX: number; cameraY: number; moved: boolean } | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setViewHeight(1100 * entry.contentRect.height / entry.contentRect.width);
      }
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  const { nodes, links, myIds } = useMemo(() => {
    const nodes: PositionedNode[] = positionedSeed.map(node => ({ ...node }));
    const links: AtlasLink[] = seedGraph.links.map(link => ({ ...link }));
    const myIds = new Set<string>();
    for (const thread of personalThreads(session)) {
      let prev: string | null = null;
      const base = communityFeatures[featureForId(thread.steps[0].artId)];
      thread.steps.forEach((step, index) => {
        if (step.kind === 'goal') { myIds.add(step.id); prev = step.id; return; }
        const art = artById[step.artId];
        const kind = step.kind === 'study' ? 'study' : step.kind === 'reflection' ? 'reflection' : 'reference';
        nodes.push({ id: step.id, kind, title: step.title, artId: art.id, cluster: art.cluster, likes: 0, x: base.x - 150 + (index % 4) * 100, y: base.y + 175 + Math.floor(index / 4) * 105, ...(step.kind === 'study' ? { image: step.image, person: 'You', sample: session.practice?.sample } : step.kind === 'reflection' ? { person: 'You', note: step.note } : {}) });
        if (prev) links.push({ source: prev, target: step.id, kind: kind === 'study' ? 'practice' : kind === 'reflection' ? 'reflection' : 'reference' });
        if (step.kind === 'study' && session.practice) {
          for (const artId of session.practice.references) {
            if (focusForArt(artById[artId]) !== thread.id) continue;
            const source = thread.steps.find(item => item.artId === artId && item.kind !== 'study' && item.kind !== 'reflection')?.id;
            if (source && source !== prev) links.push({ source, target: step.id, kind: 'practice' });
          }
        }
        myIds.add(step.id); prev = step.id;
      });
    }
    return { nodes, links, myIds };
  }, [session]);
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const pathEdges = new Set(pathNodes.slice(1).map((id, index) => `${pathNodes[index]}:${id}`));
  const activePath = new Set(pathNodes.slice(0, pathStep < 0 ? undefined : pathStep + 1));
  const pathKey = pathNodes.join('|');

  function fitGraph() {
    const visible = pathNodes.length ? nodes.filter(node => pathNodes.includes(node.id)) : mode === 'personal' && session.started ? nodes.filter(node => myIds.has(node.id)) : nodes;
    if (!visible.length) return;
    const minX = Math.min(...visible.map(node => node.x)) - 85;
    const maxX = Math.max(...visible.map(node => node.x)) + 85;
    const minY = Math.min(...visible.map(node => node.y)) - 100;
    const maxY = Math.max(...visible.map(node => node.y)) + 105;
    const scale = Math.min(2.2, 1040 / (maxX - minX), (viewHeight - 85) / (maxY - minY));
    setCamera({ scale, x: 550 - (minX + maxX) / 2 * scale, y: viewHeight / 2 - (minY + maxY) / 2 * scale - 8 });
  }

  useEffect(() => {
    setHovered(null);
    fitGraph();
  }, [mode, session.started, session.artist, session.input?.artId, session.captures.length, !!session.practice, pathKey, viewHeight]);

  function zoom(delta: number) {
    setCamera(old => {
      const scale = Math.min(3, Math.max(0.3, old.scale + delta));
      return { scale, x: 550 - ((550 - old.x) / old.scale) * scale, y: viewHeight / 2 - ((viewHeight / 2 - old.y) / old.scale) * scale };
    });
  }

  return <div className={`atlas-canvas ${mode === 'personal' && session.started ? 'personal-view' : ''}`}>
    <div className="canvas-grain" />
    <svg ref={svgRef} className="network" viewBox={`0 0 1100 ${viewHeight}`} aria-label="Interactive learning atlas. Click artwork nodes to explore references, studies, and reflections."
      onWheel={event => { if (event.ctrlKey || event.metaKey) event.preventDefault(); zoom(event.deltaY > 0 ? -0.055 : 0.055); }}
      onPointerDown={event => { if ((event.target as Element).closest('[data-node]')) return; drag.current = { x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { if (!drag.current || !svgRef.current) return; const ratio = 1100 / svgRef.current.clientWidth; const dx = (event.clientX - drag.current.x) * ratio; const dy = (event.clientY - drag.current.y) * ratio; if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true; setCamera({ ...camera, x: drag.current.cameraX + dx, y: drag.current.cameraY + dy }); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <defs>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.75" fill="#4c5950" opacity="0.33" /></pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <rect width="1100" height={viewHeight} fill="url(#dots)" />
      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
        {Object.entries(communityFeatures).map(([key, cluster]) => <g key={`halo-${key}`} className={`cluster-halo ${mode === 'personal' && session.started && featureForId(session.input?.artId || 'kfp-goal') !== key ? 'muted' : ''}`}>
          <ellipse cx={cluster.x} cy={cluster.y} rx={key === 'depth' ? 260 : 185} ry={key === 'depth' ? 215 : 170} fill={cluster.color} opacity="0.025" />
        </g>)}
        {links.map((link, index) => {
          const source = nodeMap.get(link.source); const target = nodeMap.get(link.target);
          if (!source || !target) return null;
          const isMine = myIds.has(source.id) && myIds.has(target.id) && session.started;
          const isPath = pathEdges.has(`${source.id}:${target.id}`) || pathEdges.has(`${target.id}:${source.id}`);
          const visible = isMine || isPath || !(mode === 'personal' && session.started);
          return <path key={`edge-${index}`} className={`graph-edge ${isMine ? 'mine' : ''} ${isPath ? 'traced' : ''}`} d={`M ${source.x} ${source.y} Q ${(source.x + target.x) / 2 + (index % 2 ? 10 : -10)} ${(source.y + target.y) / 2 - 12} ${target.x} ${target.y}`} opacity={visible ? 1 : 0.08} />;
        })}
        {pathNodes.slice(1).map((id, index) => {
          const source = nodeMap.get(pathNodes[index]); const target = nodeMap.get(id);
          if (!source || !target) return null;
          return <path key={`path-${index}`} className={`path-connection ${pathStep >= 0 && index >= pathStep ? 'future' : ''}`} d={`M ${source.x} ${source.y} Q ${(source.x + target.x) / 2} ${(source.y + target.y) / 2 - 25} ${target.x} ${target.y}`} />;
        })}
        {nodes.map(node => {
          const isMine = myIds.has(node.id) && session.started;
          const root = node.id === communityFeatures[featureForId(node.artId)].root || node.id === session.input?.artId;
          const dimmed = (mode === 'personal' && session.started && !isMine) || (filter === 'popular' && node.likes < 16 && !root && !isMine) || (filter === 'quiet' && node.likes > 16 && !root && !isMine) || (pathNodes.length > 0 && !pathNodes.includes(node.id) && !isMine);
          const selected = node.id === selectedId;
          const hoveredNode = hovered === node.id;
          const size = root ? 92 : node.kind === 'reflection' ? 23 : node.kind === 'tutorial' ? 36 : isMine ? 65 : node.kind === 'study' ? 42 : 53;
          const art = artById[node.artId];
          const color = isMine || activePath.has(node.id) ? '#d6ebad' : communityFeatures[featureForId(node.artId)].color;
          return <g key={node.id} data-node={node.id} className={`art-node ${selected ? 'selected' : ''} ${isMine ? 'my-node' : ''} ${node.kind === 'study' && node.sample ? 'sample-study' : ''}`} transform={`translate(${node.x} ${node.y})`} opacity={dimmed ? 0.15 : 1} role="button" tabIndex={0} aria-label={`${node.kind}: ${node.title}${node.person ? ` by ${node.person}` : ''}`}
            onClick={() => onSelect(node)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node); } }} onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}>
            <title>{node.title}{node.person ? ` · ${node.person} · Demo study` : ''}</title>
            {(selected || activePath.has(node.id)) && <rect x={-size / 2 - 9} y={-size / 2 - 9} width={size + 18} height={size + 18} rx={root ? 15 : 12} fill="none" stroke={color} opacity="0.35" strokeWidth="1" />}
            <rect className="node-frame" x={-size / 2 - 3} y={-size / 2 - 3} width={size + 6} height={size + 6} rx={root ? 11 : 7} fill={node.kind === 'reflection' ? '#282b25' : '#252c29'} stroke={selected || isMine ? color : '#566158'} strokeWidth={selected || isMine ? 2 : 0.8} />
            {node.kind === 'reflection' ? <Quote x={-7} y={-7} width={14} height={14} color={color} /> : <>
              <defs><clipPath id={`clip-${node.id}`}><rect x={-size / 2} y={-size / 2} width={size} height={size} rx={root ? 8 : 4} /></clipPath></defs>
              <image className={node.kind === 'study' && node.sample ? `study-filter filter-${node.id.length % 3}` : ''} href={node.image || art.image} x={-size / 2} y={-size / 2} width={size} height={size} preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${node.id})`} />
              {node.kind === 'tutorial' && <Video x={-8} y={-8} width={16} height={16} color="white" />}
            </>}
            {root && <><circle cx={size / 2 - 3} cy={size / 2 - 2} r="10" fill={color} /><Sparkles x={size / 2 - 9} y={size / 2 - 8} width="12" height="12" color="#263127" /></>}
            {isMine && (node.kind !== 'artwork' || node.id === session.input?.artId) && <text y={size / 2 + 21} textAnchor="middle" fill="#dbe4d1" fontSize="11">{node.id === session.input?.artId ? 'Learning goal · Instagram' : node.kind === 'reflection' ? 'Your reflection' : node.person === 'You' ? 'Your study' : session.captures.find(item => `capture-${item.id}` === node.id)?.platform}</text>}
            {(hoveredNode || selected) && !isMine && <g className="node-tooltip" transform={`translate(0 ${-size / 2 - 31})`}><rect x={-Math.min(node.title.length * 3.3 + 12, 125)} width={Math.min(node.title.length * 6.6 + 24, 250)} height="24" rx="5" fill="#e5e9df" /><text y="16" textAnchor="middle" fontSize="11" fill="#1c251e">{node.title.length > 35 ? `${node.title.slice(0, 33)}…` : node.title}</text></g>}
            {pathNodes.includes(node.id) && <g transform={`translate(${-size / 2 - 4} ${-size / 2 - 4})`}><circle r="10" fill="#d6ebad" /><text textAnchor="middle" y="4" fontSize="10" fill="#253021" fontWeight="700">{pathNodes.indexOf(node.id) + 1}</text></g>}
          </g>;
        })}
        {Object.entries(communityFeatures).map(([key, cluster]) => <g key={`label-${key}`} className="cluster-label" transform={`translate(${cluster.labelX} ${cluster.labelY})`} opacity={mode === 'personal' && session.started && featureForId(session.input?.artId || 'kfp-goal') !== key ? 0.15 : 1} onClick={() => onSelect(seedGraph.nodes.find(node => node.id === cluster.root)!)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') onSelect(seedGraph.nodes.find(node => node.id === cluster.root)!); }} aria-label={`Explore theme ${cluster.title}`}>
          <circle cx="0" cy="0" r="3" fill={cluster.color} />
          <text x="12" y="4" fill={cluster.color} fontSize="17" fontWeight="500">{cluster.subtitle}</text>
          <text x="12" y="24" fill="#829086" fontSize="10">{cluster.title} · {seedGraph.nodes.filter(node => featureForId(node.artId) === key && (node.kind === 'artwork' || node.kind === 'reference')).length} references</text>
        </g>)}
      </g>
    </svg>
    <div className="canvas-top-note"><span className="live-spark" />{pathNodes.length ? 'One person’s path. A new way to see.' : session.started && mode === 'personal' ? `1 learning goal · ${session.captures.length} references · ${session.practice ? '1 study' : 'a study waiting to happen'}` : 'A shared atlas of small discoveries'}</div>
    <div className="canvas-legend"><span><i className="dot lime" />Reference</span><span><i className="dot lilac" />Practice</span><span><i className="dot sand" />Reflection</span></div>
    <div className="canvas-tools"><button aria-label="Zoom out" onClick={() => zoom(-0.2)}><Minus size={16} /></button><span>{Math.round(camera.scale * 100)}%</span><button aria-label="Zoom in" onClick={() => zoom(0.2)}><Plus size={16} /></button><div className="tool-separator" /><button aria-label="Fit graph to view" onClick={fitGraph}><Expand size={16} /></button></div>
    {!session.started && <div className="canvas-caption"><Route size={15} /><span>Every connection is a step someone took.</span></div>}
  </div>;
}
