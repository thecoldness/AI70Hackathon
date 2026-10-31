import { useEffect, useRef } from 'react';
import { artById } from './data';
import { ArrowRight, BookOpen, Brush, Flag, Globe, Lightbulb, Lock, PenLine, Sparkles, Target, Trash2 } from 'lucide-react';
import { PathStrip } from './PathStrip';
import type { JournalEntry } from './data';
import { learningFocuses, personalThreads } from './learning';
import type { PersonalStep } from './learning';
import type { Session } from './data';

interface Props {
  session: Session;
  onReference: (artId: string) => void;
  onPractice: (step: PersonalStep) => void;
  onDeleteLog: (id: string) => void;
  onToggleShare: (id: string) => void;
  onStartNew: () => void;
}

const threadAccent = { 'world-design': 'var(--clay)', 'painted-color': 'var(--slate)' } as const;

export function PersonalPaths({ session, onReference, onPractice, onDeleteLog, onToggleShare, onStartNew }: Props) {
  const ended = !!session.endedAt && !session.started;
  const threads = personalThreads(session);
  const refCount = session.captures.length;
  const last = session.captures[session.captures.length - 1];
  const freshId = last ? `capture-${last.id}` : null;
  const root = useRef<HTMLElement>(null);

  // Bring the most recent reference into view, so a new keep is never hidden off the end of a row.
  useEffect(() => {
    root.current?.querySelector('.step.fresh')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [freshId]);
  return (
    <section className="paths" ref={root}>
      <div className="paths-head">
        <Sparkles size={16} />
        <strong>{threads.length} learning {threads.length === 1 ? 'path' : 'paths'}, found in one session</strong>
        <span className="spacer" />
        <span className="eyebrow">Grouped by learning focus · demo</span>
      </div>
      {ended && (
        <div className="path-done">
          <Flag size={16} />
          <div><strong className="serif">This path is complete.</strong><span>Saved {new Date(session.endedAt!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. Trace has stopped recording — your study and its learning log are below.</span></div>
          <button className="btn primary sm" onClick={onStartNew}>Start a new learning path <ArrowRight size={13} /></button>
        </div>
      )}
      {last && !ended && <p className="paths-latest"><span className="new-dot" /> Just kept: <b>{artById[last.artId].title}</b> from {last.platform} · Visit {refCount + 1} · {last.time}</p>}
      <p className="paths-sub">Your visit order is preserved inside each path. References that ask a different question get a thread of their own — they are never stitched into one line.</p>
      {threads.length === 0 && <p className="paths-empty">Nothing recorded yet.</p>}
      <div className="thread-grid">
        {threads.map((thread, i) => {
          const focus = learningFocuses[thread.id];
          const nodes = thread.steps.filter(s => s.kind !== 'reflection').length;
          return (
            <article key={thread.id} className="thread" style={{ ['--accent' as string]: threadAccent[thread.id] }}>
              <header>
                <span className="thread-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <span className="eyebrow">{thread.primary ? 'Your starting question' : 'A parallel question'}</span>
                  <h3 className="serif">{focus.title}</h3>
                </div>
                {ended && thread.primary ? <span className="thread-done"><Flag size={11} /> Completed</span> : <span className="thread-count">{nodes} {nodes === 1 ? 'node' : 'nodes'}</span>}
              </header>
              <p className="thread-q"><Lightbulb size={13} /> {focus.question}</p>
              <ol className="thread-steps">
                {thread.steps.map((step, j) => (
                  <li key={step.id}>
                    {j > 0 && <ArrowRight size={14} className="step-arrow" />}
                    <StepNode step={step} fresh={!ended && step.id === freshId} onClick={() => step.kind === 'goal' || step.kind === 'reference' ? onReference(step.artId) : onPractice(step)} />
                  </li>
                ))}
                {ended && thread.primary && <li><ArrowRight size={14} className="step-arrow" /><span className="step-end"><Flag size={16} /><strong>Path complete</strong></span></li>}
              </ol>
              <footer><span className="eyebrow">Shared focus</span>{focus.cues.slice(0, 3).map(c => <span key={c} className="chip">{c}</span>)}</footer>
            </article>
          );
        })}
      </div>
      {refCount > 0 && !session.practice && session.input && (
        <p className="paths-nudge"><Brush size={14} /> When you're ready, open Procreate and try a small study. Trace will ask before keeping anything.</p>
      )}
      {(session.journal?.length ?? 0) > 0 && <LearningLog entries={session.journal!} onReference={onReference} onDelete={onDeleteLog} onToggleShare={onToggleShare} />}
    </section>
  );
}

function LearningLog({ entries, onReference, onDelete, onToggleShare }: { entries: JournalEntry[]; onReference: (artId: string) => void; onDelete: (id: string) => void; onToggleShare: (id: string) => void }) {
  return (
    <section className="log">
      <header className="log-head">
        <BookOpen size={16} />
        <strong className="serif">Learning log</strong>
        <span className="log-private"><Lock size={11} /> Private · only in this browser</span>
      </header>
      {[...entries].reverse().map(e => (
        <article key={e.id} className="log-entry">
          <div className="log-top">
            <span className="eyebrow">{new Date(e.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="log-actions">
              <button className={`log-share ${e.shared !== false ? 'on' : ''}`} onClick={() => onToggleShare(e.id)} aria-pressed={e.shared !== false}
                title={e.shared !== false ? 'Remove this path from Community' : 'Show this path in Community'}>
                <Globe size={12} /> {e.shared !== false ? 'Shared to Community' : 'Share to Community'}
              </button>
              <button className="icon-btn" onClick={() => onDelete(e.id)} aria-label="Delete this log entry" title="Delete this log entry"><Trash2 size={14} /></button>
            </span>
          </div>
          <h4 className="serif">{e.title}</h4>
          <span className={`log-author ${e.author || 'template'}`}>
            {e.author === 'writing' ? <><Sparkles size={11} /> Claude is writing your log…</> : e.author === 'claude' ? <><Sparkles size={11} /> Written by Claude from your path</> : <><PenLine size={11} /> Written from your recorded steps</>}
          </span>
          <PathStrip artIds={e.path} study={e.image} studyTitle={e.title} />
          {e.paragraphs.map((p, i) => <p key={i} className={p.startsWith('In your words') ? 'log-quote' : ''}>{p}</p>)}
          {e.nextArtId && <button className="log-next" onClick={() => onReference(e.nextArtId!)}>Look at it in Community <ArrowRight size={13} /></button>}
          <footer><Lock size={11} /> Only you can see this log text. {e.shared !== false ? 'Your path and study (not this text) appear in Community.' : 'This path is not shown in Community.'}</footer>
        </article>
      ))}
    </section>
  );
}

function StepNode({ step, fresh, onClick }: { step: PersonalStep; fresh: boolean; onClick: () => void }) {
  const label = step.kind === 'goal' ? <><Target size={10} /> Goal</> : step.kind === 'reference' ? `Visit ${step.visit}` : step.kind === 'study' ? <><Brush size={10} /> Your practice</> : <><PenLine size={10} /> Reflection</>;
  return (
    <button className={`step ${step.kind} ${fresh ? 'fresh' : ''}`} onClick={onClick} title={step.kind === 'study' ? "Compare with everyone's studies of this image" : step.kind === 'reflection' ? 'Compare with the reference' : 'Open in Community'}>
      <span className="step-img">
        {step.image ? <img src={step.image} alt="" /> : <span className="step-note serif">“{step.note}”</span>}
        <span className="step-badge">{label}</span>
        {fresh && <span className="step-new">New</span>}
      </span>
      <strong>{step.title}</strong>
      <span>{step.platform}</span>
    </button>
  );
}
