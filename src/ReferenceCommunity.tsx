import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, Heart, Image as ImageIcon, Lightbulb, Paintbrush, Play, Plus, Quote, Route, X } from 'lucide-react';
import { artById } from './data';
import type { Session } from './data';
import { communityFeatures, featureForArt, resourcesForArt } from './learning';
import type { CommunityResource } from './learning';

type Filter = 'all' | CommunityResource['kind'];
const positions = [[20, 21], [79, 21], [12, 55], [39, 84], [78, 79], [90, 49], [50, 13], [13, 82], [63, 14]];
const kindLabel = { study: 'Study', reflection: 'Insight', tutorial: 'Tutorial' };

export default function ReferenceCommunity({ artId, session, votes, ownNotes, onVote, onNote, onOverview, onMyPath, onFindPath }: {
  artId: string;
  session: Session;
  votes: string[];
  ownNotes: { id: string; artId?: string; text: string }[];
  onVote: (id: string) => void;
  onNote: (text: string) => void;
  onOverview: () => void;
  onMyPath: () => void;
  onFindPath: () => void;
}) {
  const art = artById[artId];
  const feature = communityFeatures[featureForArt(art)];
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  const [lessonSteps, setLessonSteps] = useState<{ time: number; title: string; text: string }[]>([]);
  const resources = useMemo(() => {
    const resources = resourcesForArt(artId);
    if (session.practice && session.input?.artId === artId) resources.push({ id: 'your-related-study', kind: 'study', title: session.practice.title, person: 'You', image: session.practice.image, provenance: session.practice.sample ? 'Your saved illustrative demo study' : 'Your private practice', text: session.practice.note || 'Return to your own marks. What is different from the reference?', likes: 0 });
    ownNotes.filter(note => note.artId === artId).slice(-2).forEach(note => resources.push({ id: note.id, kind: 'reflection', title: 'Your small discovery', person: 'You', provenance: 'Private note · saved on this device', text: note.text, likes: 0 }));
    return resources;
  }, [artId, ownNotes, session.practice, session.input?.artId]);
  const visible = resources.filter(resource => filter === 'all' || resource.kind === filter);
  const current = resources.find(resource => resource.id === selected);
  useEffect(() => {
    let cancelled = false;
    fetch('/tutorials/manifest.json').then(response => response.json()).then(data => {
      if (!cancelled) setLessonSteps(data.lessons.find((lesson: { artId: string }) => lesson.artId === artId)?.steps || []);
    }).catch(() => { /* The video itself includes the timed teaching captions. */ });
    return () => { cancelled = true; };
  }, [artId]);
  function selectResource(id: string | null) { setSelected(id); setShowOriginal(false); detailRef.current?.scrollTo({ top: 0 }); }

  return <section className="reference-community" aria-label={`Community around ${art.title}`}>
    <header className="reference-community-heading"><div><button onClick={onOverview}><ArrowLeft size={13} />All learning themes</button><h1>{art.title}</h1><p>{feature.title}<span>·</span>One reference, many ways of learning</p></div><button className="hub-my-path" onClick={onMyPath}><Route size={14} />My path<ArrowRight size={13} /></button></header>
    <div className="hub-layout"><main className="hub-main"><nav className="hub-filters" aria-label="Filter connected notes">{(['all', 'study', 'reflection', 'tutorial'] as Filter[]).map(kind => <button className={filter === kind ? 'active' : ''} key={kind} onClick={() => setFilter(kind)}>{kind === 'all' ? 'All notes' : kind === 'study' ? 'Studies' : kind === 'reflection' ? 'Insights' : 'Tutorials'}<span>{kind === 'all' ? resources.length : resources.filter(resource => resource.kind === kind).length}</span></button>)}</nav>
      <div className="reference-note-graph" aria-label={`Image-centered graph for ${art.title}`}>
        <div className="reference-graph-halo" />
        <svg className="reference-note-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{visible.map((resource, index) => { const [x, y] = positions[index % positions.length]; return <path key={resource.id} d={`M 50 47 Q ${(50 + x) / 2 + (index % 2 ? 4 : -4)} ${(47 + y) / 2 - 3} ${x} ${y}`} className={selected === resource.id ? 'selected' : ''} />; })}</svg>
        <button className={`reference-center ${!selected ? 'selected' : ''}`} onClick={() => selectResource(null)} aria-label={`Reference image ${art.title}`}><span><img src={art.image} alt={art.title} /><i><Compass size={11} />Shared reference</i></span><strong>{art.title}</strong><small>{art.artist}</small></button>
        {visible.map((resource, index) => { const [x, y] = positions[index % positions.length]; return <button key={resource.id} className={`connected-note note-${resource.kind} ${selected === resource.id ? 'selected' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => selectResource(resource.id)} aria-label={`Open ${kindLabel[resource.kind].toLowerCase()}: ${resource.title}`}>
          {resource.kind === 'study' ? <><span className="connected-study-image"><img className={resource.imageClass} src={resource.image} alt={resource.title} /><i>{resource.person === 'You' ? 'Your study' : resource.provenance.startsWith('AI') ? 'AI demo' : 'Exercise'}</i></span><strong>{resource.title}</strong><small>{resource.person}</small></> : resource.kind === 'tutorial' ? <><span className="connected-video-image"><img src={art.image} alt="" /><Play size={19} fill="currentColor" /><i>0:12</i></span><strong>Observe, try, compare</strong><small>Video tutorial · demo</small></> : <><span className="connected-quote"><Quote size={13} /><strong>{resource.title}</strong></span><small>{resource.person} · {resource.person === 'You' ? 'Private' : 'Demo insight'}</small></>}
        </button>; })}
      </div>
      <footer className="hub-legend"><span><i className="dot lilac" />Practice</span><span><i className="dot lime" />Insight</span><span><i className="dot sand" />Tutorial</span><small>Connected to this image</small></footer>
    </main><aside ref={detailRef} className="hub-detail" aria-label="Connected note details">
      {current ? <>
        <div className="panel-eyebrow">{kindLabel[current.kind]}<button className="icon-button" aria-label="Back to reference details" onClick={() => selectResource(null)}><X size={15} /></button></div>
        {current.kind === 'tutorial' ? <video key={current.src} src={current.src} poster={art.image} controls playsInline preload="metadata" aria-label={`Tutorial video for ${art.title}`} /> : current.kind === 'study' ? <div className="hub-study-preview"><img className={!showOriginal ? current.imageClass : ''} src={showOriginal ? art.image : current.image} alt={showOriginal ? 'Original reference' : current.title} /><button onClick={() => setShowOriginal(!showOriginal)}><ImageIcon size={11} />{showOriginal ? 'Show study' : 'Show reference'}</button></div> : <Quote className="hub-large-quote" size={30} />}
        <span className="hub-provenance">{current.provenance}</span><h2>{current.title}</h2><div className="hub-person"><span className="avatar tiny">{current.person === 'You' ? 'Y' : current.person.split(' ').map(word => word[0]).join('')}</span><span>{current.person}</span></div><p className="hub-detail-copy">{current.text}</p>
        {current.kind === 'tutorial' && <ol className="hub-lesson-steps">{lessonSteps.map(step => <li key={step.time}><span>0:{String(step.time).padStart(2, '0')}</span><strong>{step.title}</strong><p>{step.text}</p></li>)}</ol>}
        {current.person !== 'You' && <button className={`hub-helpful ${votes.includes(current.id) ? 'active' : ''}`} onClick={() => onVote(current.id)}><Heart size={14} fill={votes.includes(current.id) ? 'currentColor' : 'none'} />{current.likes + Number(votes.includes(current.id))}<span>Helpful · demo</span></button>}
      </> : <>
        <span className="panel-eyebrow">A SHARED STARTING POINT</span><img className="hub-reference-preview" src={art.image} alt={art.title} /><h2>{art.title}</h2><p className="hub-credit">{art.credit}</p><p className="hub-detail-copy">Compare different attempts, read what someone noticed, and take a question into your next study.</p><div className="hub-counts"><span><Paintbrush size={14} />{resources.filter(resource => resource.kind === 'study').length} studies</span><span><Lightbulb size={14} />{resources.filter(resource => resource.kind === 'reflection').length} insights</span><span><Play size={14} />{resources.filter(resource => resource.kind === 'tutorial').length} tutorial</span></div><button className="primary-button full" onClick={onFindPath}><Route size={14} />Find a learning path<ArrowRight size={13} /></button><p className="hub-demo-note">Community people and notes are illustrative. Generated study images are labeled AI demos.</p>
      </>}
      <form className="hub-add-note" onSubmit={event => { event.preventDefault(); if (!draft.trim()) return; onNote(draft.trim()); setDraft(''); }}><label htmlFor="hub-discovery">What did you notice?</label><textarea id="hub-discovery" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1000} rows={2} placeholder="Leave a small discovery about this image…" /><button disabled={!draft.trim()}><Plus size={12} />Save my note<Check size={12} /></button></form>
    </aside></div>
  </section>;
}
