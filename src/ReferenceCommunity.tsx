import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, Heart, Image as ImageIcon, Lightbulb, Paintbrush, Play, Plus, Quote, Route, X } from 'lucide-react';
import { artById, seedGraph } from './data';
import type { Session } from './data';
import { communityFeatures, featureForArt, resourcesForArt } from './learning';
import type { CommunityResource } from './learning';
import { isPeerStudy } from './peerStudies';
import { pathsStartingAt } from './pathBranches';

type Filter = 'all' | CommunityResource['kind'];
const insightPositions = [[15, 22], [85, 22], [14, 51], [86, 51], [50, 7]];
const kindLabel = { study: 'Study', reflection: 'Insight', tutorial: 'Tutorial' };

export default function ReferenceCommunity({ artId, session, votes, ownNotes, showPeerStudies, onPath, onVote, onNote, onOverview, onMyPath, onFindPath }: {
  artId: string;
  session: Session;
  votes: string[];
  ownNotes: { id: string; artId?: string; text: string }[];
  showPeerStudies: boolean;
  onPath: (index: number) => void;
  onVote: (id: string) => void;
  onNote: (text: string) => void;
  onOverview: () => void;
  onMyPath: () => void;
  onFindPath: (nodeId?: string) => void;
}) {
  const art = artById[artId];
  const feature = communityFeatures[featureForArt(art)];
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const [lessonSteps, setLessonSteps] = useState<{ time: number; title: string; text: string }[]>([]);
  const allResources = useMemo(() => {
    const resources = resourcesForArt(artId);
    if (session.practice && session.input?.artId === artId) resources.push({ id: 'your-related-study', kind: 'study', parentArtId: artId, title: session.practice.title, person: 'You', image: session.practice.image, provenance: session.practice.sample ? 'Your saved illustrative demo study' : 'Your private practice', text: session.practice.note || 'Return to your own marks. What is different from the reference?', likes: 0 });
    ownNotes.filter(note => note.artId === artId).slice(-2).forEach(note => resources.push({ id: note.id, kind: 'reflection', title: 'Your small discovery', person: 'You', provenance: 'Private note · saved on this device', text: note.text, likes: 0 }));
    return resources;
  }, [artId, ownNotes, session.practice, session.input?.artId]);
  const resources = allResources.filter(resource => showPeerStudies || !isPeerStudy(resource));
  const visible = resources.filter(resource => filter === 'all' || resource.kind === filter);
  const current = resources.find(resource => resource.id === selected);
  const relatedPaths = pathsStartingAt(artId);
  const currentPath = current?.kind === 'study' ? relatedPaths.find(path => path.nodes.includes(current.id)) : null;
  const studies = visible.filter(resource => resource.kind === 'study');
  function position(resource: CommunityResource) {
    if (resource.kind === 'study') return [(studies.indexOf(resource) + 1) / (studies.length + 1) * 100, 79];
    if (resource.kind === 'tutorial') return [86, 51];
    const index = visible.filter(item => item.kind === 'reflection').indexOf(resource);
    return insightPositions[index % insightPositions.length];
  }
  useEffect(() => {
    if (!showPeerStudies && filter === 'study') setFilter('all');
  }, [showPeerStudies, filter]);
  useEffect(() => {
    let cancelled = false;
    fetch('/tutorials/manifest.json').then(response => response.json()).then(data => {
      if (!cancelled) setLessonSteps(data.lessons.find((lesson: { artId: string }) => lesson.artId === artId)?.steps || []);
    }).catch(() => { /* The video itself includes the timed teaching captions. */ });
    return () => { cancelled = true; };
  }, [artId]);
  function selectResource(id: string | null) {
    if (id && pathsStartingAt(id).length) { onFindPath(id); return; }
    setSelected(id); setShowOriginal(false); detailRef.current?.scrollTo({ top: 0 });
  }

  return <section className="reference-community" aria-label={`Community around ${art.title}`}>
    <header className="reference-community-heading"><div><button onClick={onOverview}><ArrowLeft size={13} />All learning themes</button><h1>{art.title}</h1><p>{feature.title}<span>·</span>One reference, many ways of learning</p></div><button className="hub-my-path" onClick={relatedPaths.length ? () => onFindPath(artId) : onMyPath}><Route size={14} />{relatedPaths.length ? `${relatedPaths.length} learning paths` : 'My path'}<ArrowRight size={13} /></button></header>
    <div className="hub-layout"><main className="hub-main"><nav className="hub-filters" aria-label="Filter connected notes">{(['all', 'study', 'reflection', 'tutorial'] as Filter[]).map(kind => <button className={filter === kind ? 'active' : ''} key={kind} onClick={() => setFilter(kind)}>{kind === 'all' ? 'All notes' : kind === 'study' ? 'Studies' : kind === 'reflection' ? 'Insights' : 'Tutorials'}<span>{kind === 'all' ? resources.length : resources.filter(resource => resource.kind === kind).length}</span></button>)}</nav>
      <div className="reference-note-graph" data-reference-id={artId} aria-label={`Image-centered graph for ${art.title}`}>
        <div className="reference-graph-halo" />
        <svg className="reference-note-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{visible.map(resource => { const [x, y] = position(resource); const study = resource.kind === 'study'; return <path key={resource.id} data-parent-art={study ? artId : undefined} d={study ? `M 50 46 Q 50 60 ${x} 68` : `M 50 31 Q ${(50 + x) / 2} ${(31 + y) / 2 - 3} ${x} ${y}`} className={`${selected === resource.id ? 'selected' : ''} ${study ? 'peer-child-edge' : ''}`} />; })}</svg>
        <button className={`reference-center ${!current ? 'selected' : ''}`} onClick={() => onFindPath(artId)} aria-label={`Show paths from ${art.title}`} title="Show paths starting at this reference"><span><img src={art.image} alt={art.title} /><i><Compass size={11} />Shared reference</i></span><strong>{art.title}</strong><small>{art.artist}</small><small className="reference-path-hint">Click to see paths from here</small></button>
        {studies.length > 0 && <span className="study-branch-label">Studies of this reference</span>}
        {!showPeerStudies && !studies.length && <p className="peer-studies-hidden-note">Peer studies are hidden.<br />Enable “Peer studies” to compare attempts.</p>}
        {visible.map(resource => { const [x, y] = position(resource); return <button key={resource.id} data-parent-art={resource.kind === 'study' ? resource.parentArtId : undefined} className={`connected-note note-${resource.kind} ${selected === resource.id ? 'selected' : ''} ${currentPath && selected === resource.id ? 'resource-endpoint' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => selectResource(resource.id)} aria-label={`Open ${kindLabel[resource.kind].toLowerCase()}: ${resource.title}`}>
          {resource.kind === 'study' ? <><span className="connected-study-image"><img className={resource.imageClass} src={resource.image} alt={resource.title} /><i>{resource.person === 'You' ? 'Your study' : resource.provenance.startsWith('AI') ? 'AI demo' : resource.provenance.startsWith('User-supplied') ? 'Demo study' : 'Exercise'}</i></span><strong>{resource.title}</strong><small>{resource.person}</small>{currentPath && selected === resource.id && <b className="resource-end-label">END</b>}</> : resource.kind === 'tutorial' ? <><span className="connected-video-image"><img src={art.image} alt="" /><Play size={19} fill="currentColor" /><i>0:12</i></span><strong>Observe, try, compare</strong><small>Video tutorial · demo</small></> : <><span className="connected-quote"><Quote size={13} /><strong>{resource.title}</strong></span><small>{resource.person} · {resource.person === 'You' ? 'Private' : 'Demo insight'}</small></>}
        </button>; })}
      </div>
      <footer className="hub-legend"><span><i className="dot lilac" />Practice</span><span><i className="dot lime" />Insight</span><span><i className="dot sand" />Tutorial</span><small>Connected to this image</small></footer>
    </main><aside ref={detailRef} className="hub-detail" aria-label="Connected note details">
      {current ? <>
        <div className="panel-eyebrow">{kindLabel[current.kind]}<button className="icon-button" aria-label="Back to reference details" onClick={() => selectResource(null)}><X size={15} /></button></div>
        {current.kind === 'tutorial' ? <video key={current.src} src={current.src} poster={art.image} controls playsInline preload="metadata" aria-label={`Tutorial video for ${art.title}`} /> : current.kind === 'study' ? <div className="hub-study-preview" data-parent-art={artId}><img className={!showOriginal ? current.imageClass : ''} src={showOriginal ? art.image : current.image} alt={showOriginal ? 'Original reference' : current.title} /><button onClick={() => setShowOriginal(!showOriginal)}><ImageIcon size={11} />{showOriginal ? 'Show study' : 'Show reference'}</button></div> : <Quote className="hub-large-quote" size={30} />}
        <span className="hub-provenance">{current.provenance}</span><h2>{current.title}</h2><div className="hub-person"><span className="avatar tiny">{current.person === 'You' ? 'Y' : current.person.split(' ').map(word => word[0]).join('')}</span><span>{current.person}</span></div><p className="hub-detail-copy">{current.text}</p>
        {currentPath && <p className="hub-endpoint-copy">End node · no recorded continuation from here.</p>}{currentPath && <button className="primary-button full related-path-action" onClick={() => onPath(currentPath.index)}><Route size={14} />Follow this learning path<ArrowRight size={13} /></button>}
        {current.kind === 'tutorial' && <ol className="hub-lesson-steps">{lessonSteps.map(step => <li key={step.time}><span>0:{String(step.time).padStart(2, '0')}</span><strong>{step.title}</strong><p>{step.text}</p></li>)}</ol>}
        {current.person !== 'You' && <button className={`hub-helpful ${votes.includes(current.id) ? 'active' : ''}`} onClick={() => onVote(current.id)}><Heart size={14} fill={votes.includes(current.id) ? 'currentColor' : 'none'} />{current.likes + Number(votes.includes(current.id))}<span>Helpful · demo</span></button>}
      </> : <>
        <span className="panel-eyebrow">A SHARED STARTING POINT</span><img className="hub-reference-preview" src={art.image} alt={art.title} /><h2>{art.title}</h2><p className="hub-credit">{art.credit}</p><p className="hub-detail-copy">Compare different attempts, read what someone noticed, and take a question into your next study.</p><div className="hub-counts"><span><Paintbrush size={14} />{resources.filter(resource => resource.kind === 'study').length} studies</span><span><Lightbulb size={14} />{resources.filter(resource => resource.kind === 'reflection').length} insights</span><span><Play size={14} />{resources.filter(resource => resource.kind === 'tutorial').length} tutorial</span></div><button className="primary-button full" onClick={() => onFindPath(artId)}><Route size={14} />Find a learning path<ArrowRight size={13} /></button><p className="hub-demo-note">Community people, notes, and learning paths are illustrative. Supplied and generated study images are labeled.</p>
      </>}
      {relatedPaths.length > 0 && <section className="reference-learning-paths" aria-label={`Learning paths from ${art.title}`}><h3>{relatedPaths.length} paths from this reference</h3>{relatedPaths.map(path => { const outcome = seedGraph.nodes.find(node => node.id === path.nodes[path.nodes.length - 1])!; return <button key={path.id} onClick={() => onPath(path.index)} aria-label={`Follow path: ${path.title}`}>
        {showPeerStudies && outcome.image ? <img data-parent-art={outcome.parentArtId} src={outcome.image} alt="" /> : <span><Route size={17} /></span>}<div><strong>{path.title}</strong><small>{path.name} · {path.nodes.length - path.nodes.indexOf(artId)} steps</small></div><ArrowRight size={12} />
      </button>; })}</section>}
      <form className="hub-add-note" onSubmit={event => { event.preventDefault(); if (!draft.trim()) return; onNote(draft.trim()); setDraft(''); }}><label htmlFor="hub-discovery">What did you notice?</label><textarea id="hub-discovery" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1000} rows={2} placeholder="Leave a small discovery about this image…" /><button disabled={!draft.trim()}><Plus size={12} />Save my note<Check size={12} /></button></form>
    </aside></div>
  </section>;
}
