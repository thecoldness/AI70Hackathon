import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Bookmark, Brush, Check, Eye, Heart, Lock, Play, X } from 'lucide-react';
import { artById, notesForArt } from './data';
import type { Session } from './data';
import { peerStudiesForArt, relevantReferenceIds } from './learning';
import { PathStrip } from './PathStrip';

/** Shared dialog shell: Esc and the scrim close it; focus moves inside and stays there. */
function Dialog({ label, className, onClose, children }: { label: string; className: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, input, textarea, video, a[href]');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, []);
  return (
    <div className="scrim" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal aria-label={label} className={`dialog ${className}`} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function SaveStudyModal({ image, sample, session, onNotNow, onSave }: {
  image: string; sample: boolean; session: Session; onNotNow: () => void; onSave: (title: string, refs: string[], note: string) => void;
}) {
  const options = relevantReferenceIds(session);
  const [title, setTitle] = useState(session.practice ? 'Another try' : 'My first shape & light study');
  const [refs, setRefs] = useState<string[]>(options);
  const [note, setNote] = useState('');
  const toggle = (id: string) => setRefs(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id]);
  return (
    <Dialog label="Add this study to your learning path?" className="save" onClose={onNotNow}>
      <button className="icon-btn dialog-x" onClick={onNotNow} aria-label="Close"><X size={17} /></button>
      <span className="eyebrow">Trace · your learning path</span>
      <h2 className="serif">Add this study to your learning path?</h2>
      <p className="dialog-sub">You've left Procreate. Saving adds this practice to the path that led to it, completes the path, and writes a private learning log — only if you want it to.</p>
      <div className="save-study">
        <img src={image} alt="Your study" />
        <label>
          <span>Name your study</span>
          <input value={title} onChange={e => setTitle(e.target.value)} />
          <em>{sample ? 'Includes illustrative demo study · private' : 'Only what you drew · private'}</em>
        </label>
      </div>
      <span className="save-label">Which references in this path helped?</span>
      <div className="save-refs">
        {options.map(id => (
          <button key={id} className={refs.includes(id) ? 'on' : ''} onClick={() => toggle(id)} aria-pressed={refs.includes(id)}>
            <img src={artById[id].image} alt="" />{artById[id].title}{refs.includes(id) && <Check size={13} />}
          </button>
        ))}
      </div>
      <span className="save-label">The path it joins</span>
      <PathStrip artIds={options.filter(id => id === options[0] || refs.includes(id))} study={image} studyTitle={title} />
      <span className="save-label">What did you notice? <em>Optional, and in your own words.</em></span>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="I separated foreground and distance before adding the warm focal point…" />
      <p className="save-private"><Lock size={12} /> Your path and study will appear in Community (you can remove them from My path). Your learning log and note stay private; to write the log, Trace sends this path's titles, tags and your note (no images) to Claude.</p>
      <div className="dialog-actions">
        <button className="btn" onClick={onNotNow}>Not now</button>
        <button className="btn primary" disabled={!title.trim()} onClick={() => onSave(title.trim(), refs, note.trim())}><Bookmark size={14} /> Yes, add to my path</button>
      </div>
    </Dialog>
  );
}

export function CompareModal({ artId, session, votes, hideOthers, onVote, onClose, onOpenCommunity }: {
  artId: string; session: Session; votes: Record<string, boolean>; hideOthers: boolean; onVote: (id: string) => void; onClose: () => void; onOpenCommunity: (artId: string) => void;
}) {
  const art = artById[artId];
  // Studies other people made of this same image (never reference-based exercises).
  const others = peerStudiesForArt(artId);
  const practice = session.practice && (session.input?.artId === artId || session.practice.references.includes(artId)) ? session.practice : null;
  const notes = notesForArt(artId);
  return (
    <Dialog label="Compare your study" className="compare" onClose={onClose}>
      <header className="compare-head">
        <div>
          <span className="eyebrow">Same starting point. Different discoveries.</span>
          <h2 className="serif">Look again. What do you notice?</h2>
          <p className="dialog-sub">Compare choices, read a reflection, and take one new question into your next study.</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </header>
      <div className="compare-body">
        <div className="compare-gallery">
          <div className="compare-pair">
          <figure>
            <figcaption><i className="ref" /> The reference</figcaption>
            <div className="frame"><img src={art.image} alt={art.title} /></div>
            <strong>{art.title}</strong><span>{art.artist}</span>
          </figure>
          <figure>
            <figcaption><i className="mine" /> Your study</figcaption>
            {practice
              ? <div className="frame"><img src={practice.image} alt={practice.title} /></div>
              : <div className="frame empty"><Brush size={20} /><span>No study for this reference yet.<br />Try one in Procreate.</span></div>}
            <strong>{practice ? practice.title : 'Your turn'}</strong><span>{practice ? (practice.sample ? 'Includes illustrative demo study' : 'Your own work') : '—'}</span>
          </figure>
          </div>
          <section className="compare-others">
            <div className="compare-others-head"><i className="other" /> Other people's studies of this image <span className="count">{hideOthers ? '–' : others.length}</span></div>
            {hideOthers
              ? <p className="compare-empty">Studies by others are hidden. You chose to look on your own first.</p>
              : others.length === 0
                ? <p className="compare-empty">No one else has shared a study of {art.title} yet.</p>
                : <div className="others-grid">
                    {others.map((o, k) => (
                      <figure key={o.id} style={{ animationDelay: `${k * 70}ms` }}>
                        <div className="frame"><img src={o.image} alt={o.title} /><span className="badge frame-badge">{o.provenance.startsWith('AI') ? 'AI demo study' : 'Line study'}</span></div>
                        <strong>{o.title}</strong><span>{o.person} · {o.provenance}</span>
                      </figure>
                    ))}
                  </div>}
          </section>
        </div>
        <aside className="compare-notes">
          <div className="compare-notes-head"><strong>Notes from the process</strong><span className="count">{notes.length}</span></div>
          <span className="rc-prov">Illustrative peer reflections · around {art.title}</span>
          {practice?.note && (
            <article className="note mine"><div className="note-who"><span className="avatar you">You</span>Your reflection</div><p className="serif">“{practice.note}”</p></article>
          )}
          {notes.map(n => (
            <article key={n.id} className="note">
              <div className="note-who"><span className="avatar" style={{ background: n.color }}>{n.initials}</span>{n.name}<span className="demo-tag">Demo</span></div>
              <h4 className="serif">{n.title}</h4>
              <p>{n.text}</p>
              <button className={`rc-vote ${votes[n.id] ? 'on' : ''}`} onClick={() => onVote(n.id)}><Heart size={13} fill={votes[n.id] ? 'currentColor' : 'none'} /> {n.likes + (votes[n.id] ? 1 : 0)} · Helpful</button>
            </article>
          ))}
          <button className="tutorial-link" onClick={() => onOpenCommunity(artId)}><Play size={13} fill="currentColor" /> Watch the 12-second lesson <ArrowRight size={13} /></button>
        </aside>
      </div>
      <footer className="compare-foot">
        <Eye size={18} />
        <div><strong>Your interpretation comes first.</strong><span>Where does your eye move? What would you try differently next time?</span></div>
      </footer>
    </Dialog>
  );
}
