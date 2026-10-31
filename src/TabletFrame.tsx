import type { ReactNode } from 'react';
import { ArrowRight, BatteryFull, Heart, Instagram, Paintbrush, RotateCcw, Sparkles, Wifi } from 'lucide-react';
import type { Session } from './data';
import { artById } from './data';

export type TabletApp = 'home' | 'trace' | 'instagram' | 'pinterest' | 'procreate';

export function TraceMark() {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 28 19 8l3 23L33 12M7 20h27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function AppIcon({ app }: { app: Exclude<TabletApp, 'home'> }) {
  return <span className={`ipad-app-icon icon-${app}`}>
    {app === 'trace' ? <TraceMark /> : app === 'instagram' ? <Instagram strokeWidth={1.6} /> : app === 'pinterest' ? <span>P</span> : <><span className="procreate-spectrum" /><Paintbrush strokeWidth={1.9} /></>}
  </span>;
}

const apps: { id: Exclude<TabletApp, 'home'>; name: string }[] = [
  { id: 'trace', name: 'Trace' }, { id: 'instagram', name: 'Instagram' }, { id: 'pinterest', name: 'Pinterest' }, { id: 'procreate', name: 'Procreate' },
];

export default function TabletFrame({ app, session, onLaunch, onHome, onReset, onAbout, children, overlays }: {
  app: TabletApp;
  session: Session;
  onLaunch: (app: Exclude<TabletApp, 'home'>) => void;
  onHome: () => void;
  onReset: () => void;
  onAbout: () => void;
  children: ReactNode;
  overlays: ReactNode;
}) {
  const input = session.input ? artById[session.input.artId] : null;
  const phase = !session.started ? 0 : !input ? 1 : !session.practice ? 2 : 3;
  return <div className="tablet-stage">
    <div className="tablet-presentation-heading"><button className="stage-brand" onClick={onAbout}><TraceMark /><span>trace<span>.</span></span><small>A learning companion, quietly in the background.</small></button><div className="demo-stage-actions"><span>iPad concept demo</span><button onClick={onReset} aria-label="Reset iPad demo" title="Reset iPad demo"><RotateCcw size={15} /></button></div></div>
    <div className="ipad-device"><span className="ipad-camera" /><div className={`ipad-screen app-${app}`}>
      <div className={`ipad-statusbar ${app === 'home' ? 'home-statusbar' : ''}`}><span>9:41 <small>Sat Oct 31</small></span><button className={`background-pill ${session.started ? 'running' : ''}`} onClick={() => onLaunch('trace')} aria-label="Open Trace background status">{session.started && <span />}{session.started ? session.paused ? 'Trace paused' : 'Trace is running in the background' : 'Your learning, connected'}</button><span className="status-icons"><Wifi size={13} /><span>100%</span><BatteryFull size={20} /></span></div>
      <div className="ipad-content" key={app}>
        {app === 'home' ? <main className="ipad-home"><div className="wallpaper-orb orb-one" /><div className="wallpaper-orb orb-two" /><div className="wallpaper-orb orb-three" />
          <div className="home-widgets"><div className="home-time-widget"><span>Saturday, October 31</span><strong>9:41</strong><p>A little curiosity.<br />A path of your own.</p></div><button className={`home-learning-widget ${input ? 'has-input' : ''}`} onClick={() => onLaunch('trace')}>
            <span className="widget-kicker"><Sparkles size={12} />{session.started ? 'YOUR LEARNING JOURNEY' : 'A SPACE FOR DISCOVERY'}</span>
            {input ? <><img src={input.image} alt={input.title} /><div className="home-widget-detail"><strong>{input.title}</strong><span>{session.captures.length} references · {session.practice ? '1 study saved' : 'your next study awaits'}</span><small>Open your learning atlas<ArrowRight size={12} /></small></div></> : <><h2>{session.started ? 'Keep following your eye.' : 'What would you like to understand?'}</h2><p>{session.started ? 'Open Instagram and choose the artwork you want to learn from.' : 'Start in Trace. Explore the apps you love. Leave a trail of discovery.'}</p><span className="widget-link">{session.started ? 'Session running' : 'Begin with Trace'}<ArrowRight size={13} /></span></>}
          </button></div>
          <nav className="home-app-grid" aria-label="iPad apps">{apps.map(item => <button key={item.id} onClick={() => onLaunch(item.id)} aria-label={`Open ${item.name}`}><span className="home-icon-wrap"><AppIcon app={item.id} />{item.id === 'trace' && session.started && <i className="app-running-indicator" />}</span><span>{item.name}</span></button>)}</nav>
          <div className="home-page-dots"><i /><i /></div><nav className="ipad-dock" aria-label="iPad dock">{apps.map(item => <button key={item.id} onClick={() => onLaunch(item.id)} aria-label={`Launch ${item.name} from dock`}><AppIcon app={item.id} /><span className={item.id === 'trace' && session.started ? 'dock-active-dot' : ''} /></button>)}<div className="dock-divider" /><button className="dock-journal" onClick={() => onLaunch('trace')} aria-label="Open learning journal"><Heart size={24} /><span /></button></nav>
        </main> : children}
      </div>
      <button className={`ipad-home-button ${app === 'home' ? 'on-home' : ''}`} onClick={onHome} aria-label="Go to Home Screen"><span /></button>
      {overlays}
    </div></div>
    <div className="tablet-story-footer"><span>WHAT MUST REMAIN HUMAN?</span><div>{['Start a session', 'Choose your input', 'Collect & practice', 'Reflect & explore'].map((label, index) => <span key={label} className={index <= phase ? 'complete' : ''}><i />{label}</span>)}</div><button onClick={onAbout}>Your choices. Your practice. Your understanding.<ArrowRight size={12} /></button></div>
  </div>;
}
