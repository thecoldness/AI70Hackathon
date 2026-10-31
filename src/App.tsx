import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Compass, Download, ExternalLink, Eye, Heart, Instagram, Layers, Lightbulb, MoreHorizontal, MousePointer2, Network, Paintbrush, Pause, Play, Plus, Quote, RotateCcw, Route, Search, Settings2, Sparkles, Upload, Video, X } from 'lucide-react';
import Atlas from './Atlas';
import { artById, artworks, clusters, initialSession, learningPaths, notesForArt, sampleNotes, seedGraph } from './data';
import type { Artwork, AtlasNode, Cluster, Platform, Session } from './data';

type View = 'atlas' | 'pinterest' | 'instagram' | 'studio';
type Modal = 'start' | 'save' | 'compare' | 'about' | 'tutorial' | null;
interface StoredData { session: Session; votes: string[]; notes: { text: string; id: string; artId?: string }[] }
const storageKey = 'trace-learning-atlas-v1';

function restore(): StoredData {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (parsed?.session && clusters[parsed.session.artist as Cluster] && Array.isArray(parsed.session.captures)) return parsed;
  } catch { /* A fresh demo is available even if browser storage is unavailable. */ }
  return { session: initialSession(), votes: [], notes: [] };
}

function Logo({ small = false }: { small?: boolean }) {
  return <div className={`brand ${small ? 'small-brand' : ''}`}><svg width="31" height="31" viewBox="0 0 40 40" aria-hidden="true"><path d="M7 28 19 8l3 23L33 12M7 20h27" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" /></svg>{!small && <span>trace<span className="brand-period">.</span></span>}</div>;
}

function PinterestIcon({ size = 18 }: { size?: number }) {
  return <span className="pinterest-icon" style={{ width: size, height: size, fontSize: size * 0.85 }}>P</span>;
}

export default function App() {
  const [saved] = useState(restore);
  const [session, setSession] = useState<Session>(saved.session);
  const [votes, setVotes] = useState<string[]>(saved.votes || []);
  const [ownNotes, setOwnNotes] = useState<StoredData['notes']>(saved.notes || []);
  const [view, setView] = useState<View>('atlas');
  const [mode, setMode] = useState<'community' | 'personal'>('community');
  const [modal, setModal] = useState<Modal>(null);
  const [artistChoice, setArtistChoice] = useState<Cluster>('vangogh');
  const [goal, setGoal] = useState(initialSession().goal);
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
  const [focusedArt, setFocusedArt] = useState<Artwork | null>(null);
  const [query, setQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState('For you');
  const [atlasFilter, setAtlasFilter] = useState<'all' | 'popular' | 'quiet'>('all');
  const [toast, setToast] = useState('');
  const [activePath, setActivePath] = useState<number | null>(null);
  const [traceAnchor, setTraceAnchor] = useState<string | null>(null);
  const [pathStep, setPathStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [demoControls, setDemoControls] = useState(false);
  const [compareArt, setCompareArt] = useState('starry');
  const [compareStudy, setCompareStudy] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [practiceNote, setPracticeNote] = useState('');
  const [practiceTitle, setPracticeTitle] = useState('My first brushwork study');
  const [practiceRefs, setPracticeRefs] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [referenceDataUrl, setReferenceDataUrl] = useState('');
  const [sampleVisible, setSampleVisible] = useState(false);
  const [strokes, setStrokes] = useState<{ d: string; color: string; size: number }[]>([]);
  const [brushColor, setBrushColor] = useState('#ebd56a');
  const [brushSize, setBrushSize] = useState(8);
  const drawing = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const recording = session.started && !session.paused;
  const rootArt = artById[clusters[session.artist].root];
  const path = useMemo(() => {
    if (activePath === null) return null;
    const whole = learningPaths[activePath];
    const from = traceAnchor ? Math.max(0, whole.nodes.indexOf(traceAnchor)) : 0;
    return { ...whole, nodes: whole.nodes.slice(from), captions: whole.captions.slice(from) };
  }, [activePath, traceAnchor]);
  const selectedArt = selectedNode ? artById[selectedNode.artId] : rootArt;
  const comparisonNotes = notesForArt(compareArt);
  const visibleOwnNotes = ownNotes.filter(note => (note.artId || 'starry') === compareArt);
  useEffect(() => {
    let cancelled = false;
    setReferenceDataUrl('');
    fetch(rootArt.image).then(response => response.blob()).then(blob => {
      const reader = new FileReader();
      reader.onload = () => { if (!cancelled) setReferenceDataUrl(reader.result as string); };
      reader.readAsDataURL(blob);
    }).catch(() => { /* A blank drawing canvas remains available offline. */ });
    return () => { cancelled = true; };
  }, [rootArt.image]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ session, votes, notes: ownNotes })); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }, [session, votes, ownNotes]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!playing || !path) return;
    const timer = setInterval(() => setPathStep(step => {
      if (step >= path.nodes.length - 1) { setPlaying(false); return step; }
      return step + 1;
    }), 1600);
    return () => clearInterval(timer);
  }, [playing, path]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setModal(null); setFocusedArt(null); return; }
      if ((event.metaKey || event.ctrlKey) && event.key === '1') { event.preventDefault(); setView('atlas'); }
      if ((event.metaKey || event.ctrlKey) && event.key === '2') { event.preventDefault(); setView('studio'); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),input,textarea,select,a[href]') || [])].filter(element => element.offsetParent !== null);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const elements = focusable(); const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    dialog?.addEventListener('keydown', trap);
    return () => { dialog?.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [modal]);

  function changeView(next: View) { setView(next); setFocusedArt(null); setQuery(''); setFeedFilter('For you'); }

  function startJourney() {
    setSession({ ...initialSession(), started: true, artist: artistChoice, goal: goal.trim() || initialSession().goal });
    setMode('personal'); setView('pinterest'); setModal(null); setSelectedNode(null); setActivePath(null); setTraceAnchor(null); setPlaying(false); setPathStep(-1); setUploadedImage(null); setStrokes([]); setSampleVisible(false); setPracticeNote('');
    setToast('Your journey has started. Collect what catches your eye.');
  }

  function recordArt(art: Artwork, platform: Platform) {
    if (!session.started) { setModal('start'); return; }
    if (session.paused) { setToast('Recording is paused. Resume your journey to add a reference.'); return; }
    if (session.captures.some(capture => capture.artId === art.id && capture.platform === platform)) { setToast('This image is already in your path.'); return; }
    setSession(old => ({ ...old, captures: [...old.captures, { id: crypto.randomUUID(), artId: art.id, platform, time: new Date().toISOString() }] }));
    setToast(`${art.title} added to your learning path`);
  }

  function inspectNode(node: AtlasNode) {
    if (traceAnchor && !path && node.kind === 'study') {
      const index = learningPaths.findIndex(p => p.nodes.includes(traceAnchor) && p.nodes.includes(node.id) && p.nodes.indexOf(node.id) > p.nodes.indexOf(traceAnchor));
      if (index >= 0) { beginPath(index, true, traceAnchor); return; }
      setToast('No recorded route to this study in the demo. Choose one of the connected examples.');
    }
    setSelectedNode(node);
    if (node.kind === 'tutorial') setModal('tutorial');
    if (path?.nodes.includes(node.id)) setPathStep(path.nodes.indexOf(node.id));
  }

  function beginPath(index: number, autoplay = false, anchor: string | null = null) {
    setTraceAnchor(anchor);
    setActivePath(index); setPathStep(0); setPlaying(autoplay); setView('atlas'); setMode('community');
    setSelectedNode(seedGraph.nodes.find(node => node.id === learningPaths[index].nodes[0]) || null);
  }

  function chooseDestination() {
    setTraceAnchor(selectedNode?.artId || rootArt.id); setSelectedNode(null); setActivePath(null); setPlaying(false); setMode('community'); setView('atlas');
    setToast('Choose another learner’s study to see a recorded path from your reference.');
  }

  function openCompare(artId = selectedNode?.artId || rootArt.id) { setCompareArt(artId); setCompareStudy(0); setModal('compare'); }

  function openSave() {
    if (!session.started) { setModal('start'); return; }
    if (!uploadedImage && strokes.length === 0 && !sampleVisible) { setToast('Draw a few strokes, import your work, or preview the sample study first.'); return; }
    setPracticeRefs([...new Set(session.captures.map(capture => capture.artId))]);
    setModal('save');
  }

  function practiceImage() {
    if (!strokes.length) return uploadedImage || rootArt.image;
    const paths = strokes.map(stroke => `<path d="${stroke.d}" stroke="${stroke.color}" stroke-width="${stroke.size}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    const background = uploadedImage || (sampleVisible ? referenceDataUrl : '');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="720" viewBox="0 0 1000 720"><rect width="1000" height="720" fill="#24384a"/>${background ? `<image href="${background}" width="1000" height="720" preserveAspectRatio="xMidYMid slice"/>` : ''}${paths}</svg>`)}`;
  }

  function savePractice() {
    const practice = { id: 'my-study', image: practiceImage(), title: practiceTitle.trim() || 'My brushwork study', note: practiceNote.trim(), references: practiceRefs, sample: !uploadedImage && (sampleVisible || strokes.length === 0) };
    setSession(old => ({ ...old, practice }));
    setView('atlas'); setMode('personal'); setModal(null); setActivePath(null); setPlaying(false);
    setSelectedNode({ id: practice.id, kind: 'study', cluster: session.artist, title: practice.title, artId: rootArt.id, person: 'You', likes: 0, image: practice.image, sample: practice.sample });
    setToast('A study, and the steps behind it. Saved to your path.');
  }

  function resetDemo() {
    setSession(initialSession()); setView('atlas'); setMode('community'); setSelectedNode(null); setActivePath(null); setTraceAnchor(null); setPathStep(-1); setPlaying(false); setModal(null); setFocusedArt(null); setStrokes([]); setUploadedImage(null); setSampleVisible(false); setPracticeNote(''); setOwnNotes([]); setVotes([]); setToast('Demo reset. A fresh path is waiting.');
  }

  function downloadJourney() {
    const blob = new Blob([JSON.stringify({ project: 'Trace', dataset: 'Interactive concept demo', session, notes: ownNotes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'trace-my-learning-path.json'; a.click(); URL.revokeObjectURL(url); setToast('Your learning path has been exported.');
  }

  function goScene(scene: number) {
    setFocusedArt(null); setModal(null);
    if (scene === 0) { setModal('start'); return; }
    if (scene === 1) { if (!session.started) { setModal('start'); return; } changeView('pinterest'); }
    if (scene === 2) { changeView('studio'); setSampleVisible(true); }
    if (scene === 3) openCompare(rootArt.id);
    if (scene === 4) { changeView('atlas'); setMode('community'); setSelectedNode(null); setActivePath(null); }
    if (scene === 5) beginPath(0, true);
  }

  function renderPanel() {
    if (traceAnchor && !path) {
      const origin = artById[traceAnchor];
      const available = learningPaths.map((p, index) => ({ ...p, index })).filter(p => p.nodes.includes(traceAnchor) && p.nodes.indexOf(traceAnchor) < p.nodes.length - 1);
      return <aside className="detail-panel destination-panel"><div className="panel-eyebrow">FROM YOUR STARTING POINT<button className="icon-button" aria-label="Cancel destination selection" onClick={() => setTraceAnchor(null)}><X size={16} /></button></div><div className="trace-origin"><img src={origin.image} alt={origin.title} /><span><small>SHARED REFERENCE</small><strong>{origin.title}</strong></span></div><h2>Where could this lead?</h2><p className="panel-copy">Choose a study on the graph, or explore one below. Follow the references, attempts, and reflections that connected it to your starting point.</p><div className="destination-list">{available.map(p => { const outcome = seedGraph.nodes.find(n => n.id === p.nodes[p.nodes.length - 1])!; return <button key={p.id} className="destination-card" onClick={() => beginPath(p.index, true, traceAnchor)}><img className="study-filter filter-1" src={artById[outcome.artId].image} alt="Illustrative outcome study" /><span><strong>{p.title}</strong><small>{p.name} · {p.nodes.length - p.nodes.indexOf(traceAnchor)} steps</small></span><ArrowRight size={14} /></button>; })}</div>{!available.length && <p className="small-muted">No shared path has been recorded from this reference in the demo. Try one of the three main artist works.</p>}<div className="human-note"><Route size={19} /><p>Follow someone’s actual sequence.<br /><strong>Make your own choices along the way.</strong></p></div></aside>;
    }
    if (path) return <aside className="detail-panel path-panel">
      <div className="panel-eyebrow">A LEARNER’S PATH<button className="icon-button" aria-label="Close learning path" onClick={() => { setActivePath(null); setTraceAnchor(null); setPlaying(false); setPathStep(-1); }}><X size={16} /></button></div>
      <div className="person-line"><span className="avatar">{path.initials}</span><div><strong>{path.name}</strong><small>Illustrative learner · {path.nodes.length} steps</small></div></div>
      <h2>{path.title}</h2><p className="panel-copy">{path.description}</p>
      <button className="primary-button full" onClick={() => { if (pathStep === path.nodes.length - 1) setPathStep(0); setPlaying(!playing); }}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Pause this path' : pathStep === path.nodes.length - 1 ? 'Replay the journey' : 'Follow the journey'}</button>
      <div className="path-timeline">{path.nodes.map((id, index) => { const node = seedGraph.nodes.find(node => node.id === id)!; const art = artById[node.artId]; return <button key={id} className={`timeline-step ${index === pathStep ? 'current' : ''} ${index <= pathStep ? 'passed' : ''}`} onClick={() => { setPathStep(index); setSelectedNode(node); setPlaying(false); }}><span className="step-number">{index + 1}</span><img src={art.image} alt="" className={node.sample ? 'study-filter filter-1' : ''} /><span><small>{node.kind === 'artwork' ? 'Starting point' : node.kind}</small><strong>{node.title}</strong></span>{index < pathStep && <Check size={13} />}</button>; })}</div>
      <div className="insight-card"><Quote size={18} /><p>{path.captions[Math.max(0, pathStep)]}</p></div>
      <p className="small-muted">A recorded sequence of choices. Explore it at your own pace.</p><div className="alternate-paths"><span>Another way from here</span>{learningPaths.map((p, i) => i !== activePath && <button key={p.id} onClick={() => beginPath(i)}>{p.title}<ArrowRight size={13} /></button>)}</div>
    </aside>;

    if (selectedNode) {
      const isOwn = selectedNode.person === 'You';
      return <aside className="detail-panel">
        <div className="panel-eyebrow">{isOwn ? 'YOUR PRACTICE' : selectedNode.kind === 'artwork' ? 'A STARTING POINT' : selectedNode.kind.toUpperCase()}<button className="icon-button" aria-label="Close artwork details" onClick={() => setSelectedNode(null)}><X size={16} /></button></div>
        <div className={`panel-art ${selectedNode.sample ? 'sample-art' : ''}`}><img src={selectedNode.image || selectedArt.image} alt={selectedNode.title} className={selectedNode.sample ? 'study-filter filter-1' : ''} />{selectedNode.sample && <span className="image-badge">Illustrative demo study</span>}</div>
        <div className="art-meta"><span>{selectedNode.kind === 'study' ? selectedNode.person : selectedArt.artist}</span><span>{selectedNode.kind === 'study' ? 'Practice' : selectedArt.year}</span></div>
        <h2>{selectedNode.title}</h2>
        {selectedNode.kind === 'reflection' && <p className="quote-copy">“{selectedNode.note}”</p>}
        {isOwn && session.practice?.note && <div className="personal-note"><Quote size={15} /><p>{session.practice.note}</p></div>}
        <div className="tag-row">{selectedArt.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>
        <div className="panel-divider" />
        <h3>{isOwn ? 'A new perspective on your study' : 'See what others discovered'}</h3><p className="panel-copy">Compare attempts at the same work. Notice a different choice. Find your next question.</p>
        <button className="primary-button full" onClick={() => openCompare(selectedNode.artId)}><Layers size={16} />{isOwn ? 'Compare & reflect' : 'Explore studies & insights'}<ArrowRight size={16} /></button>
        <button className="secondary-button full" onClick={chooseDestination}><Route size={16} />Find a path from here</button>
        <div className="mini-insight"><span className="avatar tiny">ML</span><p>“{sampleNotes[0].title}”<small>From a sample learner’s reflection</small></p></div>
      </aside>;
    }

    return <aside className="detail-panel welcome-panel"><div className="panel-eyebrow">A LITTLE CURIOSITY GOES A LONG WAY<Sparkles size={14} /></div>
      <div className="welcome-art"><img src={rootArt.image} alt={rootArt.title} /><div className="welcome-art-caption"><span>A starting point</span><strong>{rootArt.title}</strong></div><span className="corner-mark"><Sparkles size={18} /></span></div>
      <h2>{session.started ? 'Your eye. Your hand. Your understanding.' : 'Follow your curiosity.'}</h2>
      <p className="panel-copy">{session.started ? session.goal : 'Start with a work you love. Collect what speaks to you. See where your own practice takes you.'}</p>
      <button className="primary-button full" onClick={() => session.started ? changeView(session.captures.length > 1 ? 'studio' : 'pinterest') : setModal('start')}>{session.started ? session.captures.length > 1 ? <Paintbrush size={16} /> : <Plus size={16} /> : <Plus size={16} />}{session.started ? session.captures.length > 1 ? 'Make a small study' : 'Collect a reference' : 'Start a learning journey'}<ArrowRight size={16} /></button>
      <div className="panel-divider" /><h3>Many ways to understand.</h3><p className="panel-copy">The same starting point can lead to very different discoveries.</p>
      {learningPaths.slice(0, 2).map((p, index) => <button className="path-preview" key={p.id} onClick={() => beginPath(index, true)}><span className={`avatar ${index ? 'blue-avatar' : ''}`}>{p.initials}</span><span><strong>{p.title}</strong><small>{p.name} · {p.nodes.length} steps</small></span><ArrowRight size={15} /></button>)}
      <div className="human-note"><span className="human-note-icon"><Lightbulb size={17} /></span><p>AI connects the dots.<br /><strong>You make the discoveries.</strong></p></div>
    </aside>;
  }

  function renderBrowser() {
    const instagram = view === 'instagram';
    const platform: Platform = instagram ? 'Instagram' : 'Pinterest';
    let feed = instagram ? [...artworks.slice(2, 6), artworks[0], artworks[9], ...artworks.slice(6, 9), artworks[10], artworks[11], artworks[1]] : [...artworks];
    if (query.trim()) feed = feed.filter(art => `${art.title} ${art.artist} ${art.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
    if (feedFilter === 'Following' || feedFilter === 'Brushwork') feed = feed.filter(art => art.cluster === session.artist);
    if (feedFilter === 'Saved') feed = feed.filter(art => session.captures.some(capture => capture.artId === art.id));
    const captured = focusedArt && session.captures.some(capture => capture.artId === focusedArt.id && capture.platform === platform);
    return <section className={`reference-browser ${instagram ? 'instagram-browser' : 'pinterest-browser'}`}>
      <div className="mock-browser-bar"><button className="icon-button" aria-label="Back to atlas" onClick={() => changeView('atlas')}><ArrowLeft size={15} /></button><span className="browser-dot" /><div className="mock-url"><span className="url-lock">⌑</span>{instagram ? 'instagram.com / explore' : 'pinterest.com / ideas / painting'}</div><span className="demo-pill">Demo reference space</span><MoreHorizontal size={16} /></div>
      <div className="platform-header">{instagram ? <span className="instagram-wordmark">Instagram</span> : <span className="pinterest-brand"><PinterestIcon size={29} />Pinterest</span>}<label className="platform-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={instagram ? 'Search artists, works, inspiration' : 'Search your next inspiration'} /></label><button className="platform-account" title="Return to your learning atlas" onClick={() => changeView('atlas')}>Y</button></div>
      <div className="feed-tabs">{(instagram ? ['For you', 'Following', 'Saved'] : ['For you', 'Brushwork', 'Color & light', 'Saved']).map(tab => <button key={tab} className={feedFilter === tab ? 'active' : ''} onClick={() => { setFeedFilter(tab); if (tab === 'Color & light') setQuery('color'); else setQuery(''); }}>{tab}</button>)}</div>
      <div className="reference-intro"><span>{instagram ? 'A different space. A new connection.' : 'A place to follow your eye.'}</span><p>{recording ? 'Open an image, then use the floating Trace button to keep it in your path.' : session.paused ? 'Your journey is paused. Resume whenever you’re ready.' : 'Start a journey to collect references with Trace.'}</p></div>
      {instagram ? <div className="instagram-grid">{feed.map((art, index) => <button className="instagram-tile" key={art.id} onClick={() => setFocusedArt(art)}><img src={art.image} alt={art.title} loading="lazy" /><span className="tile-overlay"><Heart size={19} />{12 + index * 3}<span>{art.title}</span></span>{session.captures.some(capture => capture.artId === art.id) && <span className="tile-saved"><Check size={13} /></span>}</button>)}</div> : <div className="masonry">{feed.map((art, index) => <button className="pin-card" key={art.id} onClick={() => setFocusedArt(art)}><div className={`pin-image pin-ratio-${index % 4}`}><img src={art.image} alt={art.title} loading="lazy" /><span className="pin-save">Explore</span>{session.captures.some(capture => capture.artId === art.id) && <span className="pin-collected"><Check size={13} />In your path</span>}</div><strong>{art.title}</strong><span>{art.artist}<MoreHorizontal size={16} /></span></button>)}</div>}
      {feed.length === 0 && <div className="empty-state"><Search size={25} /><h3>No references here yet.</h3><p>{feedFilter === 'Saved' ? 'Record an image with Trace and it will appear here.' : 'Try searching for brushwork, light, or an artist’s name.'}</p></div>}
      {focusedArt && <div className="reference-focus"><button className="focus-close icon-button" aria-label="Close image" onClick={() => setFocusedArt(null)}><X size={19} /></button><div className="reference-focus-image"><img src={focusedArt.image} alt={focusedArt.title} /></div><div className="reference-focus-info"><span className="source-label">{instagram ? <Instagram size={15} /> : <PinterestIcon size={15} />}{platform} reference</span><h2>{focusedArt.title}</h2><p>{focusedArt.artist} · {focusedArt.year}</p><div className="tag-row">{focusedArt.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="focus-question"><Eye size={18} /><p>What caught your eye?<br /><span>A color, a rhythm, a small detail?</span></p></div><p className="focus-source-note">Public-domain artwork in a simulated platform page.</p></div></div>}
      {session.started && session.captures.length > 0 && <button className="reference-path-link" onClick={() => { changeView('atlas'); setMode('personal'); setActivePath(null); setSelectedNode(null); }}><Route size={13} />{session.captures.length} references connected<ArrowRight size={13} /></button>}
      {session.started ? <button className={`trace-float ${captured ? 'recorded' : ''} ${!focusedArt || session.paused ? 'waiting' : ''}`} onClick={() => focusedArt ? recordArt(focusedArt, platform) : setToast('Open an image first, then record the one you want to study.')} disabled={!!captured || session.paused}><Logo small /><span><strong>{captured ? 'Added to your path' : session.paused ? 'Journey paused' : focusedArt ? 'Record this reference' : 'Choose an image to record'}</strong><small>{captured ? 'Your learning trail is taking shape' : 'Keep the things you want to learn from'}</small></span>{captured ? <Check size={20} /> : <Plus size={20} />}</button> : null}
    </section>;
  }

  function renderStudio() {
    return <section className="studio"><div className="studio-heading"><div><span className="eyebrow">YOUR PRACTICE SPACE</span><h1>A small study. A new understanding.</h1><p>Take something you noticed and try it with your own hand.</p></div><button className="secondary-button" onClick={() => fileInput.current?.click()}><Upload size={16} />Import your work</button></div>
      <div className="studio-workspace"><div className="studio-reference"><div className="studio-section-label"><Eye size={14} />YOUR REFERENCE</div><img src={rootArt.image} alt={rootArt.title} /><strong>{rootArt.title}</strong><small>{rootArt.artist}</small><div className="studio-question"><Quote size={17} /><p>{session.goal}</p></div><div className="collected-stack"><span>Also in your path</span>{session.captures.slice(0, 4).map(capture => <button key={capture.id} onClick={() => { setFocusedArt(artById[capture.artId]); setView(capture.platform.toLowerCase() as View); }}><img src={artById[capture.artId].image} alt={artById[capture.artId].title} /><span>{artById[capture.artId].title}</span></button>)}</div></div>
        <div className="drawing-app"><div className="drawing-toolbar"><span className="drawing-app-name"><Paintbrush size={16} />Practice canvas</span><div className="brush-controls">{['#ebd56a', '#b5c9d9', '#628ca9', '#263e51'].map(color => <button key={color} className={`color-swatch ${brushColor === color ? 'active' : ''}`} style={{ background: color }} aria-label={`Use ${color} brush`} onClick={() => setBrushColor(color)} />)}<button className="brush-width" title="Change brush width" onClick={() => setBrushSize(old => old === 8 ? 16 : old === 16 ? 4 : 8)}><Paintbrush size={14} />{brushSize}</button><button className="icon-button" aria-label="Undo last stroke" onClick={() => { if (strokes.length) setStrokes(old => old.slice(0, -1)); else { setUploadedImage(null); setSampleVisible(false); } }}><RotateCcw size={16} /></button></div></div>
          <div className={`drawing-surface ${sampleVisible ? 'show-sample' : ''}`}>
            {(uploadedImage || sampleVisible) && <img className={sampleVisible && !uploadedImage ? 'study-filter filter-2' : ''} src={uploadedImage || rootArt.image} alt={uploadedImage ? 'Your imported artwork' : 'Illustrative sample study'} />}
            <svg viewBox="0 0 1000 720" aria-label="Drawing canvas. Drag to paint your own study." className="drawing-ink"
              onPointerDown={event => { drawing.current = true; const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width * 1000; const y = (event.clientY - rect.top) / rect.height * 720; setStrokes(old => [...old, { d: `M ${x.toFixed(1)} ${y.toFixed(1)} l 0.1 0.1`, color: brushColor, size: brushSize }]); event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={event => { if (!drawing.current) return; const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width * 1000; const y = (event.clientY - rect.top) / rect.height * 720; setStrokes(old => old.map((stroke, index) => index === old.length - 1 ? { ...stroke, d: `${stroke.d} L ${x.toFixed(1)} ${y.toFixed(1)}` } : stroke)); }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }}>
              {strokes.map((stroke, i) => <path key={i} d={stroke.d} fill="none" stroke={stroke.color} strokeWidth={stroke.size} strokeLinecap="round" strokeLinejoin="round" />)}
            </svg>
            {!uploadedImage && !sampleVisible && strokes.length === 0 && <div className="canvas-empty"><Paintbrush size={32} strokeWidth={1} /><h3>Make your own marks.</h3><p>Draw here, import a study, or use the<br />sample to walk through this demo.</p><button className="canvas-sample-button" onClick={() => setSampleVisible(true)}>Preview sample study<ArrowRight size={14} /></button></div>}
            {sampleVisible && !uploadedImage && <span className="sample-canvas-label">Illustrative demo study · not a learner outcome</span>}
          </div><div className="drawing-bottom"><span>{uploadedImage ? 'Your imported artwork' : sampleVisible ? 'Demo practice canvas' : `${strokes.length} brushstrokes · take your time`}</span><span>Observe. Try. Notice.</span></div>
        </div>
      </div><div className="studio-footer"><span><Lightbulb size={17} />The drawing is yours. Trace keeps the steps around it.</span><button className="primary-button" onClick={openSave}><Plus size={17} />Add this study to my path<ArrowRight size={17} /></button></div>
    </section>;
  }

  return <div className="app-shell">
    <aside className="sidebar"><button className="brand-button" aria-label="Trace home" onClick={() => { changeView('atlas'); setSelectedNode(null); }}><Logo /></button><div className="brand-tagline">THE ART OF LEARNING</div>
      <div className="sidebar-section-label">YOUR WORKSPACE</div><nav className="main-nav"><button className={view === 'atlas' ? 'active' : ''} onClick={() => changeView('atlas')}><Network size={18} />Learning atlas<span className="nav-shortcut">⌘ 1</span></button><button className={view === 'studio' ? 'active' : ''} onClick={() => changeView('studio')}><Paintbrush size={18} />My practice{session.practice && <span className="nav-count">1</span>}</button></nav>
      <div className="sidebar-section-label spaces-label">REFERENCE SPACES<span>DEMO</span></div><nav className="space-nav"><button className={view === 'pinterest' ? 'active' : ''} onClick={() => changeView('pinterest')}><PinterestIcon />Pinterest<ArrowDownLeft size={13} /></button><button className={view === 'instagram' ? 'active' : ''} onClick={() => changeView('instagram')}><Instagram size={18} />Instagram<ArrowDownLeft size={13} /></button></nav>
      <div className="sidebar-rule" /><div className="sidebar-section-label">THIS JOURNEY{session.started && <span className={`recording-light ${session.paused ? 'paused' : ''}`} />}</div>
      {session.started ? <div className="journey-sidebar"><div className="journey-target"><img src={rootArt.image} alt="" /><div><strong>{clusters[session.artist].name}</strong><small>Your starting point</small></div></div><p className="journey-goal">{session.goal}</p><div className="journey-progress"><span>{session.captures.length} references</span><span>{session.practice ? '1 study' : '0 studies'}</span></div><div className="capture-list">{session.captures.slice(-4).map(capture => <button key={capture.id} onClick={() => { changeView(capture.platform.toLowerCase() as View); setFocusedArt(artById[capture.artId]); }}><span className="capture-dot" /><span>{artById[capture.artId].title}</span><small>{capture.platform === 'Pinterest' ? 'P' : 'IG'}</small></button>)}</div><button className="journey-pause" onClick={() => setSession(old => ({ ...old, paused: !old.paused }))}>{session.paused ? <Play size={13} /> : <Pause size={13} />}{session.paused ? 'Resume journey' : 'Pause recording'}</button></div> : <div className="no-journey"><div className="empty-path-mark"><span /><span /><span /></div><p>A reference. A question.<br />A path of your own.</p><button onClick={() => setModal('start')}>Begin a journey<Plus size={13} /></button></div>}
      <div className="sidebar-bottom"><button className="sidebar-help" onClick={() => setModal('about')}><CircleHelp size={16} />What stays human?<ArrowRight size={13} /></button><div className="sidebar-footer"><span className="footer-mark">70</span><div>AI AT DARTMOUTH<small>Interactive concept demo</small></div></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumb">Workspace<ChevronRight size={12} /><span>{view === 'atlas' ? 'Learning atlas' : view === 'studio' ? 'My practice' : 'Reference spaces'}</span>{(view === 'pinterest' || view === 'instagram') && <><ChevronRight size={12} /><span>{view === 'pinterest' ? 'Pinterest' : 'Instagram'}</span></>}</div><div className="topbar-actions"><span className="private-label"><span />Private workspace</span><button className={`icon-button demo-controls-button ${demoControls ? 'active' : ''}`} title="Toggle presentation controls" aria-label="Toggle presentation controls" onClick={() => setDemoControls(old => !old)}><Video size={17} /></button><button className="icon-button" title="Reset demo" aria-label="Reset demo" onClick={resetDemo}><RotateCcw size={16} /></button><button className="user-avatar" aria-label="About this demo" onClick={() => setModal('about')}>Y</button></div></header>
      {view === 'atlas' ? <div className="atlas-layout"><main className="atlas-main"><div className="atlas-heading"><div><span className="eyebrow">LEARN THROUGH THE PATHS WE LEAVE</span><h1>{mode === 'personal' && session.started ? 'Your curiosity, connected.' : 'Every study starts somewhere.'}</h1><p>{mode === 'personal' && session.started ? session.goal : 'References. Practice. Reflection. A shared map of learning.'}</p></div><button className="round-button" aria-label="Export learning path" title="Export your learning path" onClick={downloadJourney}><Download size={17} /></button></div><div className="atlas-toolbar"><div className="segmented"><button className={mode === 'community' ? 'active' : ''} onClick={() => setMode('community')}><Compass size={14} />Community atlas</button><button className={mode === 'personal' ? 'active' : ''} onClick={() => { setMode('personal'); setActivePath(null); setTraceAnchor(null); setPlaying(false); }}><Route size={14} />My path{session.captures.length > 0 && <span>{session.captures.length}</span>}</button></div><label className="atlas-filter"><Settings2 size={14} /><select aria-label="Filter graph paths" value={atlasFilter} onChange={event => setAtlasFilter(event.target.value as typeof atlasFilter)}><option value="all">All paths</option><option value="popular">Popular paths</option><option value="quiet">Less traveled</option></select><ChevronDown size={12} /></label></div>
          <Atlas session={session} mode={mode} selectedId={selectedNode?.id || null} onSelect={inspectNode} pathNodes={path?.nodes || []} pathStep={pathStep} filter={atlasFilter} />
          <div className="atlas-bottom-bar"><span><i className="online-dot" />Illustrative community atlas</span><button onClick={() => setModal('about')}>Learning is more than the finished piece<ArrowRight size={12} /></button></div>
        </main>{renderPanel()}</div> : view === 'studio' ? renderStudio() : renderBrowser()}
      {demoControls && <div className="presentation-controls"><span><Video size={13} />WALKTHROUGH</span>{['Begin', 'Collect', 'Practice', 'Reflect', 'Explore', 'Follow a path'].map((label, index) => <button key={label} onClick={() => goScene(index)}><small>{index + 1}</small>{label}</button>)}<button className="presentation-close" aria-label="Close presentation controls" onClick={() => setDemoControls(false)}><X size={14} /></button></div>}
    </div>
    {toast && <div className="toast" role="status"><span><Check size={14} /></span>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={13} /></button></div>}
    {storageWarning && <div className="storage-warning" role="status">Browser storage is full. Your current session still works; export your path before closing.</div>}
    <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 3 * 1024 * 1024) { setToast('Please use an image smaller than 3 MB for this demo.'); return; } const reader = new FileReader(); reader.onload = () => { setUploadedImage(reader.result as string); setSampleVisible(false); setStrokes([]); setView('studio'); setToast('Your artwork is ready. Save it when you’re ready.'); }; reader.readAsDataURL(file); event.target.value = ''; }} />

    {modal && <div className={`modal-backdrop ${modal === 'compare' ? 'compare-backdrop' : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}><section className={`modal modal-${modal}`} role="dialog" aria-modal="true" aria-label={modal === 'start' ? 'Start a learning journey' : modal === 'save' ? 'Save your practice' : modal === 'compare' ? 'Compare studies and reflect' : modal === 'tutorial' ? 'Directional brushwork lesson' : 'About Trace'}><button className="modal-close icon-button" aria-label="Close dialog" onClick={() => setModal(null)}><X size={20} /></button>
      {modal === 'start' && <><div className="modal-brand"><Logo small /><span>A NEW LEARNING JOURNEY</span></div><h2>What draws you in?</h2><p className="modal-intro">Choose a starting point. Bring a question.<br />The rest is a path you’ll make yourself.</p><div className="artist-options">{(Object.entries(clusters) as [Cluster, typeof clusters[Cluster]][]).map(([key, cluster]) => <button className={`artist-option ${artistChoice === key ? 'chosen' : ''}`} key={key} onClick={() => { setArtistChoice(key); setGoal(key === 'monet' ? 'How can color capture the feeling of light?' : key === 'hokusai' ? 'How can lines make a still image feel in motion?' : initialSession().goal); }}><img src={artById[cluster.root].image} alt={cluster.name} /><span>{cluster.name}</span><small>{cluster.subject}</small>{artistChoice === key && <i><Check size={13} /></i>}</button>)}</div><label className="field-label" htmlFor="learning-question">A question you want to explore</label><textarea id="learning-question" className="goal-input" value={goal} onChange={event => setGoal(event.target.value)} rows={2} maxLength={200} /><div className="session-consent"><MousePointer2 size={17} /><p>You choose what to keep.<br /><span>Only images you record with the floating button enter your path.</span></p></div><button className="primary-button full large" onClick={startJourney}>Start my journey<ArrowRight size={18} /></button></>}
      {modal === 'save' && <><span className="eyebrow">KEEP THE PRACTICE, AND THE PROCESS</span><h2>Add this study to your path?</h2><p className="modal-intro">Save what you made alongside what helped you see.</p><div className="save-study-preview"><img src={practiceImage()} className={!uploadedImage && sampleVisible ? 'study-filter filter-2' : ''} alt="Practice to save" /><div><label className="field-label" htmlFor="study-title">Name your study</label><input id="study-title" value={practiceTitle} maxLength={100} onChange={event => setPracticeTitle(event.target.value)} /><span>{!uploadedImage && sampleVisible ? 'Illustrative demo study' : 'Your own practice'} · Private</span></div></div><label className="field-label">Which references helped?</label><div className="reference-choices">{[...new Set([rootArt.id, ...session.captures.map(capture => capture.artId)])].map(id => <button key={id} className={practiceRefs.includes(id) ? 'chosen' : ''} onClick={() => setPracticeRefs(old => old.includes(id) ? old.filter(ref => ref !== id) : [...old, id])}><img src={artById[id].image} alt={artById[id].title} /><span>{artById[id].title}</span><i>{practiceRefs.includes(id) ? <Check size={12} /> : <Plus size={12} />}</i></button>)}</div><label className="field-label" htmlFor="practice-reflection">What did you notice? <span>Optional, and in your own words.</span></label><textarea id="practice-reflection" rows={3} placeholder="Something you tried, a surprise, a question for next time…" value={practiceNote} onChange={event => setPracticeNote(event.target.value)} maxLength={1000} /><div className="modal-actions"><button className="secondary-button" onClick={() => setModal(null)}>Keep practicing</button><button className="primary-button" onClick={savePractice}><Bookmark size={16} />Save to my learning path</button></div></>}
      {modal === 'compare' && <><div className="comparison-header"><span className="eyebrow">SAME STARTING POINT. DIFFERENT DISCOVERIES.</span><h2>Look again. What do you notice?</h2><p>Compare choices, read a reflection, and take a new question into your next study.</p></div><div className="comparison-body"><div className="comparison-gallery"><div className="comparison-art original"><div className="comparison-label"><span className="dot lime" />THE REFERENCE</div><div className="comparison-image"><img src={artById[compareArt]?.image || rootArt.image} alt="Original reference artwork" /></div><strong>{artById[compareArt]?.title || rootArt.title}</strong><small>{artById[compareArt]?.artist || rootArt.artist}</small></div><div className="comparison-art"><div className="comparison-label"><span className="dot lilac" />YOUR STUDY</div><div className="comparison-image">{session.practice ? <img src={session.practice.image} className={session.practice.sample ? 'study-filter filter-2' : ''} alt="Your saved practice" /> : <div className="compare-empty"><Paintbrush size={26} /><span>Your next experiment<br />belongs here.</span><button onClick={() => { setModal(null); changeView('studio'); }}>Make a study<ArrowRight size={13} /></button></div>}</div><strong>{session.practice?.title || 'A space for your own attempt'}</strong><small>{session.practice?.sample ? 'Illustrative demo study' : session.practice ? 'You · Private practice' : 'Draw or import your work'}</small></div><div className="comparison-art"><div className="comparison-label"><span className="dot sand" />ANOTHER PERSPECTIVE<button className="icon-button" aria-label="Previous sample study" onClick={() => setCompareStudy(old => (old + 2) % 3)}><ChevronLeft size={14} /></button><button className="icon-button" aria-label="Next sample study" onClick={() => setCompareStudy(old => (old + 1) % 3)}><ChevronRight size={14} /></button></div><div className="comparison-image"><img src={artById[compareArt]?.image || rootArt.image} className={`study-filter filter-${compareStudy}`} alt="Illustrative study variation using the reference artwork" /><span className="image-badge">Demo illustration</span></div><strong>{['Following the rhythm', 'Finding the dark shapes', 'A smaller palette'][compareStudy]}</strong><small>{comparisonNotes[compareStudy].name} · Illustrative learner</small></div><div className="comparison-prompt"><Eye size={18} /><div><strong>Your interpretation comes first.</strong><span>Where does your eye move? What would you try differently?</span></div><button onClick={() => { setModal(null); changeView('studio'); }} className="secondary-button">Try another study<ArrowRight size={14} /></button></div></div><aside className="reflections-panel"><div className="reflections-heading"><h3>Notes from the process</h3><span>{3 + visibleOwnNotes.length}</span></div><p className="small-muted">Illustrative peer reflections · around {artById[compareArt]?.title || rootArt.title}</p>{[...comparisonNotes].sort((a, b) => (b.likes + Number(votes.includes(b.id))) - (a.likes + Number(votes.includes(a.id)))).map(note => <article className="reflection-card" key={note.id}><div className="reflection-author"><span className="avatar tiny" style={{ background: note.color }}>{note.initials}</span><strong>{note.name}</strong><span>Demo</span></div><h4>{note.title}</h4><p>{note.text}</p><button className={`helpful-button ${votes.includes(note.id) ? 'voted' : ''}`} onClick={() => setVotes(old => old.includes(note.id) ? old.filter(id => id !== note.id) : [...old, note.id])}><Heart size={13} fill={votes.includes(note.id) ? 'currentColor' : 'none'} />{note.likes + Number(votes.includes(note.id))}<span>Helpful</span></button></article>)}{visibleOwnNotes.map(note => <article className="reflection-card own-reflection" key={note.id}><div className="reflection-author"><span className="avatar tiny">Y</span><strong>You</strong><span>Private</span></div><p>{note.text}</p></article>)}<div className="add-reflection"><label htmlFor="new-reflection">Leave a small discovery</label><textarea id="new-reflection" rows={2} value={newNote} maxLength={1000} onChange={event => setNewNote(event.target.value)} placeholder="What helped you see something new?" /><button disabled={!newNote.trim()} onClick={() => { setOwnNotes(old => [...old, { id: crypto.randomUUID(), text: newNote.trim(), artId: compareArt }]); setNewNote(''); setToast('Your reflection is saved privately in this demo.'); }}>Save my reflection<ArrowRight size={13} /></button></div><button className="lesson-card" onClick={() => setModal('tutorial')}><span><Video size={18} /></span><div><strong>A closer look at brushwork</strong><small>Related lesson · demo outline</small></div><ArrowRight size={14} /></button></aside></div></>}
      {modal === 'about' && <><div className="modal-brand"><Logo small /><span>WHAT MUST REMAIN HUMAN?</span></div><h2>The learning happens in you.</h2><p className="about-lead">AI can keep the trail.<br />You do the seeing, trying, and understanding.</p><div className="about-roles"><div><span><Sparkles size={17} />What the system carries</span><p>References, sources, connections, and access to other people’s recorded learning paths.</p></div><div><span><Paintbrush size={17} />What stays with you</span><p>Your questions. Your choices. Your practice. The meaning you find in the differences.</p></div></div><div className="demo-disclosure"><strong>About this working demo</strong><p>Pinterest and Instagram are simulated pages. Community profiles, studies, notes, and popularity are illustrative. Recording, drawing, uploading, saving, comparing, and path replay work locally. No external agent or live AI model is connected.</p><p>Reference artwork is public domain. Study illustrations reuse reference images with visual treatments; they are not evidence of human learning.</p><a href="/art/credits.json" target="_blank" rel="noreferrer">Artwork sources & credits<ExternalLink size={12} /></a></div><button className="primary-button full" onClick={() => setModal(null)}>Back to exploring<ArrowRight size={16} /></button></>}
      {modal === 'tutorial' && <><span className="eyebrow">A RELATED LEARNING NOTE</span><h2>Look at the direction of the marks.</h2><div className="lesson-preview"><img src={rootArt.image} alt={rootArt.title} /><span><Video size={26} />Demo lesson outline</span></div><p className="modal-intro">A placeholder for a teacher’s video or a learner’s walkthrough, connected to this reference.</p><ol className="lesson-steps"><li>Choose one small patch of sky. Follow its strokes with your eye.</li><li>Make a short study using a few directional marks.</li><li>Compare the movement you intended with what you actually see.</li></ol><button className="primary-button full" onClick={() => { setModal(null); changeView('studio'); }}>Take a question into practice<ArrowRight size={16} /></button></>}
    </section></div>}
  </div>;
}
