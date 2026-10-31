import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Brush, Compass, Eye, EyeOff, Heart, Image as ImageIcon, PenLine, Play, Quote, Route, X } from 'lucide-react';
import { artById } from './data';
import type { Session } from './data';
import { communityFeatures, featureForId, resourcesForArt } from './learning';
import type { CommunityResource } from './learning';
import type { PrivateNote } from './state';

interface Lesson { artId: string; src: string; title: string; steps: { time: number; title: string; text: string }[] }
let lessonsPromise: Promise<Record<string, Lesson>> | null = null;
function loadLessons() {
  lessonsPromise ??= fetch('/tutorials/manifest.json')
    .then(r => r.json())
    .then((m: { lessons: Lesson[] }) => Object.fromEntries(m.lessons.map(l => [l.artId, l])))
    .catch(() => ({}));
  return lessonsPromise;
}

type Kind = CommunityResource['kind'] | 'mine' | 'note';
interface Item { id: string; kind: Kind; title: string; person: string; image?: string; imageClass?: string; provenance: string; text: string; likes: number; src?: string; sample?: boolean }

const slots: [number, number][] = [[20, 21], [79, 21], [12, 55], [39, 84], [78, 79], [90, 49], [50, 13], [13, 82], [63, 14]];
const CX = 50, CY = 47;
const filters: { id: 'all' | 'study' | 'reflection' | 'tutorial'; label: string }[] = [
  { id: 'all', label: 'All notes' }, { id: 'study', label: 'Studies' }, { id: 'reflection', label: 'Insights' }, { id: 'tutorial', label: 'Tutorials' },
];

interface Props {
  artId: string;
  session: Session;
  votes: Record<string, boolean>;
  notes: PrivateNote[];
  hideOthers: boolean;
  onToggleHideOthers: () => void;
  onVote: (id: string) => void;
  onSaveNote: (text: string) => void;
  onAllThemes: () => void;
  onMyPath: () => void;
  onFindPath: () => void;
  onComparePractice: () => void;
}

export function ReferenceCommunity({ artId, session, votes, notes, hideOthers, onToggleHideOthers, onVote, onSaveNote, onAllThemes, onMyPath, onFindPath, onComparePractice }: Props) {
  const art = artById[artId];
  const feature = communityFeatures[featureForId(artId)];
  const [filter, setFilter] = useState<'all' | 'study' | 'reflection' | 'tutorial'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [showRef, setShowRef] = useState(false);
  const [draft, setDraft] = useState('');
  const [lessons, setLessons] = useState<Record<string, Lesson>>({});
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => { loadLessons().then(setLessons); }, []);
  useEffect(() => { setSelected(null); setFilter('all'); setDraft(''); }, [artId]);
  useEffect(() => { panel.current?.scrollTo({ top: 0 }); setShowRef(false); }, [selected, artId]);

  const allItems = useMemo<Item[]>(() => {
    const list: Item[] = resourcesForArt(artId);
    if (session.practice && session.input?.artId === artId) {
      list.push({ id: session.practice.id, kind: 'mine', title: session.practice.title, person: 'You', image: session.practice.image, provenance: session.practice.sample ? 'Your study · includes illustrative demo canvas' : 'Your study · private', text: session.practice.note || 'No reflection written yet.', likes: 0, sample: session.practice.sample });
    }
    notes.filter(n => n.artId === artId).slice(-2).forEach(n => list.push({ id: n.id, kind: 'note', title: 'Your note', person: 'You', provenance: `Private note · ${n.time}`, text: n.text, likes: 0 }));
    return list;
  }, [artId, session.practice, session.input, notes]);
  // A drawn study by someone else: not your own, and not a reference-based exercise.
  const isOthersDrawing = (i: Item) => i.kind === 'study' && !i.imageClass;
  const items = (hideOthers ? allItems.filter(i => !isOthersDrawing(i)) : allItems).slice(0, slots.length);
  const hiddenCount = hideOthers ? allItems.filter(isOthersDrawing).length : 0;

  const counts = { all: items.length, study: items.filter(i => i.kind === 'study' || i.kind === 'mine').length, reflection: items.filter(i => i.kind === 'reflection' || i.kind === 'note').length, tutorial: items.filter(i => i.kind === 'tutorial').length };
  const visible = (i: Item) => filter === 'all' || i.kind === filter || (filter === 'study' && i.kind === 'mine') || (filter === 'reflection' && i.kind === 'note');
  const current = items.find(i => i.id === selected) || items[0];

  return (
    <section className="rc">
      <header className="rc-head">
        <div className="rc-title">
          <button className="rc-back" onClick={onAllThemes}><ArrowLeft size={13} /> All learning themes</button>
          <h2 className="serif">{art.title}</h2>
          <p>{feature.title} · One reference, many ways of learning</p>
        </div>
        <div className="rc-actions">
          <button className={`btn sm toggle-others ${hideOthers ? 'on' : ''}`} aria-pressed={hideOthers} onClick={onToggleHideOthers}
            title={hideOthers ? 'Show studies drawn by other people' : 'Hide studies drawn by other people'}>
            {hideOthers ? <><EyeOff size={14} /> Show others' studies</> : <><Eye size={14} /> Hide others' studies</>}
          </button>
          <button className="btn sm" onClick={onFindPath}><Route size={14} /> Paths from here</button>
          {session.input && <button className="btn sm" onClick={onMyPath}><Compass size={14} /> My path <ArrowRight size={13} /></button>}
        </div>
        <nav className="rc-filters">
          {filters.map(f => <button key={f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>{f.label}<i>{counts[f.id]}</i></button>)}
        </nav>
      </header>
      <div className="rc-body">
        <div className="rc-graph">
          {/* One switch for people who would rather not see what others drew. */}
          {hideOthers && (
            <div className="rc-others on">
              <EyeOff size={13} /> {hiddenCount ? `${hiddenCount} ${hiddenCount === 1 ? 'study' : 'studies'} by others hidden` : "Others' studies hidden"}
              <button onClick={onToggleHideOthers}>Show</button>
            </div>
          )}
          <svg className="rc-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {items.map((item, i) => {
              const [x, y] = slots[i];
              const mx = (x + CX) / 2 + (y - CY) * .18, my = (y + CY) / 2 - (x - CX) * .18;
              return <path key={item.id} d={`M${CX} ${CY} Q${mx} ${my} ${x} ${y}`} className={`${item.kind} ${visible(item) ? '' : 'dim'} ${current?.id === item.id ? 'hot' : ''}`} />;
            })}
          </svg>
          <div className="rc-center" style={{ left: `${CX}%`, top: `${CY}%` }}>
            <span className="rc-center-frame">
              <img src={art.image} alt={art.title} />
              <span className="badge">Shared reference</span>
            </span>
            <strong className="serif">{art.title}</strong>
            <span>{art.artist}</span>
          </div>
          {items.map((item, i) => (
            <button key={item.id} className={`rc-node ${item.kind} ${visible(item) ? '' : 'dim'} ${current?.id === item.id ? 'on' : ''}`}
              style={{ left: `${slots[i][0]}%`, top: `${slots[i][1]}%` }} onClick={() => setSelected(item.id)}>
              {item.kind === 'reflection' || item.kind === 'note'
                ? <span className="rc-quote"><Quote size={11} /><span className="serif">{item.title}</span></span>
                : <span className="rc-thumb">
                    <img src={item.image} alt="" className={item.imageClass} />
                    {item.kind === 'tutorial' && <span className="rc-play"><Play size={14} fill="currentColor" /></span>}
                    {item.kind === 'tutorial' && <span className="rc-dur">0:12</span>}
                    <span className="badge">{item.kind === 'mine' ? 'Your study' : item.kind === 'tutorial' ? 'Lesson' : item.imageClass ? 'Exercise' : item.provenance.startsWith('AI') ? 'AI demo' : 'Line study'}</span>
                  </span>}
              {item.kind !== 'reflection' && item.kind !== 'note' && <strong>{item.title}</strong>}
              <span className="rc-person">{item.person}{item.kind === 'reflection' ? ' · Demo insight' : ''}</span>
            </button>
          ))}
          <footer className="rc-legend"><i className="study" /> Practice <i className="reflection" /> Insight <i className="tutorial" /> Tutorial <span className="spacer" /> Every note here connects to this one image</footer>
        </div>

        <aside className="rc-panel" ref={panel}>
          {current && <Detail item={current} art={art} showRef={showRef} setShowRef={setShowRef} lesson={lessons[artId]} voted={!!votes[current.id]} onVote={() => onVote(current.id)} onCompare={onComparePractice} onClose={() => setSelected(null)} />}
          <div className="rc-write">
            <label className="serif" htmlFor="rc-note">What did you notice?</label>
            <textarea id="rc-note" value={draft} onChange={e => setDraft(e.target.value)} placeholder={`One thing ${art.title} taught you to look for…`} rows={3} />
            <button className="btn sm dark" disabled={!draft.trim()} onClick={() => { onSaveNote(draft.trim()); setDraft(''); }}><PenLine size={13} /> Save my note</button>
            <span className="rc-private">Saved to this browser only, attached to this image.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Detail({ item, art, showRef, setShowRef, lesson, voted, onVote, onCompare, onClose }: {
  item: Item; art: { image: string; title: string }; showRef: boolean; setShowRef: (v: boolean) => void; lesson?: Lesson; voted: boolean; onVote: () => void; onCompare: () => void; onClose: () => void;
}) {
  const kindLabel = { study: 'Study', mine: 'Your study', reflection: 'Insight', note: 'Your note', tutorial: 'Tutorial' }[item.kind];
  return (
    <div className="rc-detail">
      <div className="rc-detail-top"><span className="eyebrow">{kindLabel}</span><button className="icon-btn" onClick={onClose} aria-label="Back to first item"><X size={15} /></button></div>
      {(item.kind === 'study' || item.kind === 'mine') && (
        <figure className="rc-figure">
          <img src={showRef ? art.image : item.image} alt="" className={showRef ? '' : item.imageClass} />
          <button className="rc-swap" onClick={() => setShowRef(!showRef)}><ImageIcon size={12} /> {showRef ? 'Show study' : 'Show reference'}</button>
        </figure>
      )}
      {item.kind === 'tutorial' && item.src && (
        <figure className="rc-figure video">
          <video src={item.src} poster={art.image} controls playsInline preload="metadata" />
        </figure>
      )}
      <span className="rc-prov">{item.provenance}</span>
      <h3 className="serif">{item.kind === 'tutorial' && lesson ? lesson.title : item.title}</h3>
      {item.kind !== 'tutorial' && item.kind !== 'note' && (
        <div className="rc-author"><span className="avatar">{item.person.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>{item.person}</div>
      )}
      <p className="rc-text">{item.text}</p>
      {item.kind === 'tutorial' && lesson && (
        <ol className="rc-steps">{lesson.steps.map(s => <li key={s.time}><span>0:{String(s.time).padStart(2, '0')}</span><div><strong>{s.title}</strong><p>{s.text}</p></div></li>)}</ol>
      )}
      {item.kind === 'reflection' && (
        <button className={`rc-vote ${voted ? 'on' : ''}`} onClick={onVote}><Heart size={14} fill={voted ? 'currentColor' : 'none'} /> {item.likes + (voted ? 1 : 0)} · Helpful</button>
      )}
      {item.kind === 'mine' && <button className="btn sm" onClick={onCompare}><Brush size={13} /> Compare with the reference</button>}
    </div>
  );
}
