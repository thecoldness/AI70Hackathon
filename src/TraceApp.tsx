import { useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, Download, Heart, HelpCircle, Pause, Play, Route, X } from 'lucide-react';
import { artById } from './data';
import type { Session } from './data';
import { personalThreads } from './learning';
import type { PersonalStep } from './learning';
import type { PrivateNote, TraceView } from './state';
import { TraceMark, Wordmark } from './TabletFrame';
import { PersonalPaths } from './PersonalPaths';
import { ReferenceCommunity } from './ReferenceCommunity';
import { Atlas } from './Atlas';

interface Props {
  session: Session;
  view: TraceView;
  communityArtId: string | null;
  atlasFrom: string | null;
  votes: Record<string, boolean>;
  hideOthers: boolean;
  onToggleHideOthers: () => void;
  notes: PrivateNote[];
  onExit: () => void;
  onStart: () => void;
  onTogglePause: () => void;
  onDownload: () => void;
  onSetView: (v: TraceView) => void;
  onOpenArt: (artId: string) => void;
  onAllThemes: () => void;
  onFindPath: (fromArtId: string) => void;
  onPractice: (step: PersonalStep) => void;
  onVote: (id: string) => void;
  onSaveNote: (artId: string, text: string) => void;
  onDeleteLog: (id: string) => void;
  onToggleShare: (id: string) => void;
}

export function TraceApp(p: Props) {
  const { session } = p;
  const [help, setHelp] = useState(false);
  const threads = personalThreads(session);
  const hasGoal = !!session.input;

  return (
    <div className="trace">
      <header className="trace-top">
        <button className="icon-btn" onClick={p.onExit} aria-label="Back to Home Screen"><ArrowLeft size={19} /></button>
        <Wordmark size={21} />
        <span className="trace-sub">Your learning journal</span>
        <span className="spacer" />
        {session.endedAt && !session.started && <span className="trace-state done"><i />Path complete</span>}
        {session.started && (
          <span className={`trace-state ${session.paused ? 'paused' : ''}`}>
            <i />{session.paused ? 'Paused' : hasGoal ? `${threads.length} ${threads.length === 1 ? 'path' : 'paths'} · ${session.captures.length} references` : 'Listening for your choice'}
          </span>
        )}
        {session.started && <button className="icon-btn" onClick={p.onTogglePause} aria-label={session.paused ? 'Resume Trace' : 'Pause Trace'} title={session.paused ? 'Resume' : 'Pause recording'}>{session.paused ? <Play size={16} /> : <Pause size={16} />}</button>}
        {hasGoal && <button className="icon-btn" onClick={p.onDownload} aria-label="Download your journey" title="Download your journey (JSON)"><Download size={16} /></button>}
        <button className="icon-btn" onClick={() => setHelp(h => !h)} aria-label="How Trace works"><HelpCircle size={17} /></button>
      </header>
      {help && (
        <div className="help-pop">
          <button className="icon-btn" onClick={() => setHelp(false)} aria-label="Close"><X size={14} /></button>
          <strong className="serif">What Trace does — and doesn't.</strong>
          <p>Trace keeps only what you tap: a goal, references, the studies you choose to save. It groups them by what you seem to be learning, using simple tag rules — no model, no account, nothing leaves this browser.</p>
          <p>People, notes and paths in Community are illustrative demo content.</p>
        </div>
      )}

      {!hasGoal ? <Intro session={session} onStart={p.onStart} onExit={p.onExit} /> : (
        <div className="trace-main">
          <div className={`trace-hero ${p.view === 'community' ? 'compact' : ''}`}>
            <div>
              <span className="eyebrow">Learn through the paths we leave</span>
              <h1 className="serif">{p.view === 'path' ? 'Your learning, in parallel.' : p.communityArtId ? 'One image, many ways in.' : 'A map of ways to see.'}</h1>
              <p>{p.view === 'path' ? 'Each question leaves a path of its own.' : 'Shape, colour, marks and spatial relationships.'}</p>
            </div>
            <nav className="trace-tabs">
              <button className={p.view === 'community' ? 'on' : ''} onClick={() => p.onSetView('community')}><Compass size={15} /> Community</button>
              <button className={p.view === 'path' ? 'on' : ''} onClick={() => p.onSetView('path')}><Route size={15} /> My path <i>{threads.length}</i></button>
            </nav>
          </div>
          <div className="trace-view">
            {p.view === 'path' && <PersonalPaths session={session} onReference={p.onOpenArt} onPractice={p.onPractice} onDeleteLog={p.onDeleteLog} onToggleShare={p.onToggleShare} onStartNew={p.onStart} />}
            {p.view === 'community' && p.communityArtId && (
              <ReferenceCommunity artId={p.communityArtId} session={session} votes={p.votes} notes={p.notes} hideOthers={p.hideOthers} onToggleHideOthers={p.onToggleHideOthers}
                onVote={p.onVote} onSaveNote={text => p.onSaveNote(p.communityArtId!, text)}
                onAllThemes={p.onAllThemes} onMyPath={() => p.onSetView('path')} onFindPath={() => p.onFindPath(p.communityArtId!)}
                onComparePractice={() => p.onPractice({ id: session.practice!.id, artId: p.communityArtId!, kind: 'study', title: '', image: '', platform: '', visit: 0 })} />
            )}
            {p.view === 'community' && !p.communityArtId && <Atlas hideOthers={p.hideOthers} myPaths={(session.journal || []).filter(e => e.shared !== false).map(e => ({ id: e.id, title: e.title, path: e.path, study: e.image }))} goalArtId={session.input?.artId || null} fromArtId={p.atlasFrom} onOpenArt={p.onOpenArt} />}
          </div>
        </div>
      )}
    </div>
  );
}

function Intro({ session, onStart, onExit }: { session: Session; onStart: () => void; onExit: () => void }) {
  return (
    <div className="intro">
      <div className="intro-copy">
        <span className="eyebrow">Your learning, quietly connected</span>
        <span className="intro-mark"><TraceMark size={30} color="#f6e9df" /></span>
        {!session.started ? <>
          <h1 className="serif">The things you notice<br />become the things you know.</h1>
          <p>Found something you want to understand? Start a session, return to that artwork, and choose it as your learning goal.</p>
          <button className="btn primary lg" onClick={onStart}>Start learning session <ArrowRight size={16} /></button>
        </> : <>
          <h1 className="serif">Keep following<br />your curiosity.</h1>
          <p>Trace is running quietly. Go back to Instagram or Pinterest, open the work that caught your eye, and tap <b>Set as learning goal</b>. Nothing is chosen for you.</p>
          <button className="btn primary lg" onClick={onExit}>Go to Home Screen <ArrowRight size={16} /></button>
        </>}
        <span className="intro-promise"><Heart size={13} /> You choose what to keep. Your understanding stays yours.</span>
      </div>
      <div className="intro-art" aria-hidden>
        <img className="card-a" src={artById['kfp-goal'].image} alt="" />
        <img className="card-b" src={artById['zoo-city'].image} alt="" />
        <div className="intro-note serif">A reference.<br />A question.<br />A path of your own.</div>
      </div>
    </div>
  );
}
