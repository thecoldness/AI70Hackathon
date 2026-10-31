import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { artById, initialSession } from './data';
import type { Platform, Session } from './data';
import { clockTime, emptyStored, loadStored, recordArt, saveStored, STORAGE_KEY } from './state';
import type { BrowseState, Stored, TabletApp, TraceView } from './state';
import { TabletFrame, Wordmark } from './TabletFrame';
import { HomeScreen } from './HomeScreen';
import { SocialApp } from './SocialApp';
import { Procreate, composeStudy, emptyProcreate, hasOwnWork, shrinkImage } from './Procreate';
import { journalFacts, makeJournalEntry } from './learning';
import { requestClaudeJournal } from './journalApi';
import type { ProcreateState } from './Procreate';
import { TraceApp } from './TraceApp';
import { CompareModal, SaveStudyModal } from './Modals';

type Launchable = Exclude<TabletApp, 'home'>;
const browseInit = (feedFilter: string): BrowseState => ({ artist: null, focusedArt: null, query: '', feedFilter, scroll: 0 });

export default function App() {
  const [stored, setStored] = useState<Stored>(loadStored);
  const [app, setApp] = useState<TabletApp>('home');
  const [recent, setRecent] = useState<Launchable[]>([]);
  const [traceView, setTraceView] = useState<TraceView>('path');
  const [communityArtId, setCommunityArtId] = useState<string | null>(null);
  const [atlasFrom, setAtlasFrom] = useState<string | null>(null);
  const [explored, setExplored] = useState(false);
  const [ig, setIg] = useState<BrowseState>(() => browseInit('for-you'));
  const [pin, setPin] = useState<BrowseState>(() => browseInit('for-you'));
  const [canvas, setCanvas] = useState<ProcreateState>(emptyProcreate);
  const [saveDraft, setSaveDraft] = useState<{ image: string; sample: boolean } | null>(null);
  const [compareArt, setCompareArt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);

  const { session, votes, notes, hideOthers } = stored;
  useEffect(() => saveStored(stored), [stored]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);
  const setSession = (fn: (s: Session) => Session) => setStored(st => ({ ...st, session: fn(st.session) }));

  const launch = (next: Launchable) => {
    if (next === 'trace' && session.input) { setTraceView('path'); setAtlasFrom(null); }
    setRecent(r => [next, ...r.filter(x => x !== next)].slice(0, 3));
    setApp(next);
  };

  const goHome = async () => {
    const leavingCanvas = app === 'procreate';
    setApp('home');
    // Only a changed canvas, inside a session with a goal, earns the question.
    if (leavingCanvas && canvas.dirty && hasOwnWork(canvas) && session.started && session.input) {
      setSaveDraft({ image: await composeStudy(canvas), sample: false });
    }
  };

  const record = (platform: Platform) => (artId: string) => {
    const result = recordArt(session, artId, platform);
    if ('refused' in result) return notify(result.refused);
    setSession(() => result.session);
    notify(session.input ? `Kept “${artById[artId].title}” · Visit ${result.session.captures.length + 1}` : `“${artById[artId].title}” is your learning goal`);
  };

  const openArt = (artId: string) => {
    setCommunityArtId(artId); setAtlasFrom(null); setTraceView('community'); setExplored(true);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), session, notes }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trace-journey.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const reset = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setStored(emptyStored()); setApp('home'); setRecent([]); setTraceView('path'); setCommunityArtId(null); setAtlasFrom(null);
    setExplored(false); setIg(browseInit('for-you')); setPin(browseInit('for-you')); setCanvas(emptyProcreate()); setSaveDraft(null); setCompareArt(null);
    notify('Demo reset. Start by exploring.');
  };

  const progress = [
    { label: 'Explore, then start', done: session.started },
    { label: 'Set a learning goal', done: !!session.input },
    { label: 'Collect & practice', done: !!session.practice },
    { label: 'Reflect & explore', done: explored },
  ];

  return (
    <main className="stage">
      <header className="stage-top">
        <Wordmark size={22} />
        <span className="tagline">A learning companion, quietly in the background.</span>
        <span className="spacer" />
        <span className="demo-label">iPad concept demo</span>
        <button className="icon-btn" onClick={reset} title="Reset demo" aria-label="Reset demo"><RotateCcw size={16} /></button>
      </header>

      <TabletFrame app={app} onHome={goHome} onStatusPill={() => launch('trace')}
        statusPill={session.started ? (session.paused ? 'Trace is paused' : 'Trace is running in the background') : null}>
        {app === 'home' && <HomeScreen session={session} recent={recent} onLaunch={launch} />}
        {app === 'instagram' && <SocialApp platform="Instagram" browse={ig} setBrowse={patch => setIg(s => ({ ...s, ...patch }))} session={session} onRecord={record('Instagram')} onHint={notify} onExit={goHome} />}
        {app === 'pinterest' && <SocialApp platform="Pinterest" browse={pin} setBrowse={patch => setPin(s => ({ ...s, ...patch }))} session={session} onRecord={record('Pinterest')} onHint={notify} onExit={goHome} />}
        {app === 'procreate' && <Procreate state={canvas} setState={setCanvas} session={session} onLeave={goHome} onToast={notify} />}
        {app === 'trace' && (
          <TraceApp session={session} view={traceView} communityArtId={communityArtId} atlasFrom={atlasFrom} votes={votes} notes={notes} hideOthers={hideOthers}
            onToggleHideOthers={() => { setStored(st => ({ ...st, hideOthers: !st.hideOthers })); notify(hideOthers ? 'Showing studies by others again.' : 'Studies by others are hidden. Show them again any time.'); }}
            onExit={goHome}
            onStart={() => { setSession(s => ({ ...initialSession(), goal: s.goal, started: true, journal: s.journal })); setCanvas(emptyProcreate()); setTraceView('path'); notify('Session started. Trace is listening only for what you choose.'); }}
            onTogglePause={() => { setSession(s => ({ ...s, paused: !s.paused })); notify(session.paused ? 'Trace resumed.' : 'Trace paused. Nothing new will be recorded.'); }}
            onDownload={download}
            onSetView={v => { setTraceView(v); if (v === 'community') setExplored(true); }}
            onOpenArt={openArt}
            onAllThemes={() => { setCommunityArtId(null); setAtlasFrom(null); }}
            onFindPath={from => { setCommunityArtId(null); setAtlasFrom(from); }}
            onPractice={step => setCompareArt(step.artId)}
            onVote={id => setStored(st => ({ ...st, votes: { ...st.votes, [id]: !st.votes[id] } }))}
            onToggleShare={id => {
              const entry = (session.journal || []).find(e => e.id === id);
              const nowShared = entry?.shared === false;
              setSession(s => ({ ...s, journal: (s.journal || []).map(e => e.id === id ? { ...e, shared: nowShared } : e) }));
              notify(nowShared ? 'Your path is now shown in Community.' : 'Removed from Community. Your log is unchanged.');
            }}
            onDeleteLog={id => { setSession(s => ({ ...s, journal: (s.journal || []).filter(e => e.id !== id) })); notify('Log entry deleted.'); }}
            onSaveNote={(artId, text) => { setStored(st => ({ ...st, notes: [...st.notes, { id: `note-${Date.now().toString(36)}`, text, artId, time: clockTime() }] })); notify('Note saved with this image.'); }}
          />
        )}

        {saveDraft && (
          <SaveStudyModal image={saveDraft.image} sample={saveDraft.sample} session={session}
            onNotNow={() => setSaveDraft(null)}
            onSave={async (title, refs, note) => {
              const practice = { id: `practice-${Date.now().toString(36)}`, image: saveDraft.image, title, note, references: refs, sample: saveDraft.sample };
              // The log keeps a small copy of the study so many entries still fit in browser storage.
              const thumb = await shrinkImage(saveDraft.image, 480);
              // Saving the study completes this path: it is logged, and Trace stops recording.
              // The template entry appears at once; Claude's version replaces it when it arrives.
              const entry = { ...makeJournalEntry(session, practice, thumb), author: 'writing' as const };
              const facts = journalFacts(session, practice);
              setSession(s => ({ ...s, practice, journal: [...(s.journal || []), entry], started: false, paused: false, endedAt: new Date().toISOString() }));
              requestClaudeJournal(facts).then(paragraphs => setSession(s => ({
                ...s,
                journal: (s.journal || []).map(e => e.id !== entry.id ? e : paragraphs ? { ...e, paragraphs, author: 'claude' } : { ...e, author: 'template' }),
              })));
              setCanvas(emptyProcreate());
              setSaveDraft(null);
              notify('Path complete. Your study and a private learning log are in Trace.');
            }} />
        )}
        {compareArt && (
          <CompareModal artId={compareArt} session={session} votes={votes} hideOthers={hideOthers}
            onVote={id => setStored(st => ({ ...st, votes: { ...st.votes, [id]: !st.votes[id] } }))}
            onClose={() => setCompareArt(null)}
            onOpenCommunity={id => { setCompareArt(null); openArt(id); }} />
        )}
        {toast && <div className="toast" role="status"><Sparkles size={14} />{toast}</div>}
      </TabletFrame>

      <footer className="stage-foot">
        <span className="question">What must remain human?</span>
        <span className="spacer" />
        <div className="progress">{progress.map(s => <span key={s.label} className={s.done ? 'done' : ''}>{s.label}</span>)}</div>
        <span className="spacer" />
        <span className="motto">Your choices. Your practice. Your understanding.</span>
        <ArrowRight size={14} />
      </footer>
    </main>
  );
}
