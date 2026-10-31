import type { CSSProperties } from 'react';
import { ArrowRight, Compass, Lightbulb, Paintbrush, Quote, Sparkles } from 'lucide-react';
import { learningFocuses, personalThreads } from './learning';
import type { Session } from './data';

export default function PersonalPaths({ session, onReference, onPractice, onDraw }: { session: Session; onReference: (artId: string) => void; onPractice: () => void; onDraw: () => void }) {
  const threads = personalThreads(session);
  return <section className="personal-paths" aria-label="Your separate learning paths">
    <div className="path-organization"><span><Sparkles size={15} />{threads.length > 1 ? `${threads.length} learning paths, found in one session` : 'Your first learning path is taking shape'}</span><small>Grouped by learning focus · demo</small></div>
    <p className="path-organization-copy">Your visit order is preserved within each path. References with a different learning focus get their own thread.</p>
    <div className="parallel-paths">{threads.map((thread, index) => {
      const focus = learningFocuses[thread.id];
      return <article className="learning-track" data-focus={thread.id} key={thread.id} style={{ '--track-color': focus.color } as CSSProperties}>
        <header className="track-heading"><span className="track-index">0{index + 1}</span><div><small>{thread.primary ? 'YOUR STARTING QUESTION' : 'A PARALLEL QUESTION'}</small><h2>{focus.title}</h2><p>{focus.subtitle}</p></div><span className="track-count">{thread.steps.length} nodes</span></header>
        <div className="track-question"><Lightbulb size={12} /><span>{focus.question}</span></div>
        <div className="track-sequence">{thread.steps.map((step, stepIndex) => <div className="track-step-wrap" key={step.id}>
          {stepIndex > 0 && <ArrowRight className="track-connection" size={16} />}
          <button className={`personal-node ${step.kind === 'goal' ? 'goal-node' : ''} ${step.kind === 'study' ? 'practice-node' : ''}`} onClick={() => step.kind === 'study' || step.kind === 'reflection' ? onPractice() : onReference(step.artId)} aria-label={step.kind === 'study' ? `Open your practice ${step.title}` : step.kind === 'reflection' ? 'Read your practice reflection' : `Explore community for ${step.title}`}>
            <span className="personal-node-image">{step.kind === 'reflection' ? <Quote size={26} /> : <img src={step.image} alt={step.title} />}<i>{step.kind === 'goal' ? 'Goal' : step.kind === 'study' ? 'Your practice' : `Visit ${step.visit}`}</i>{step.kind === 'study' && <Paintbrush size={13} className="node-kind-marker" />}</span>
            <strong>{step.title}</strong><small>{step.platform}</small>
          </button>
        </div>)}</div>
        <footer className="track-cues"><span>Shared focus</span>{focus.cues.slice(0, 3).map(cue => <i key={cue}>{cue}</i>)}</footer>
      </article>;
    })}</div>
    <div className="my-path-actions"><span><Compass size={14} />Select a reference to explore its community of studies, notes, and tutorials.</span>{session.practice && <button onClick={onPractice}><Paintbrush size={14} />View your practice<ArrowRight size={14} /></button>}<button onClick={onDraw}><Paintbrush size={14} />Continue practice<ArrowRight size={14} /></button></div>
  </section>;
}
