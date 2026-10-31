import { ArrowRight, Bookmark, Heart, Images, Sparkles } from 'lucide-react';
import { artById } from './data';
import type { Session } from './data';
import type { TabletApp } from './state';
import { AppIcon } from './TabletFrame';

type Launchable = Exclude<TabletApp, 'home'>;
const apps: { id: Launchable; label: string }[] = [
  { id: 'trace', label: 'Trace' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'procreate', label: 'Procreate' },
];

export function HomeScreen({ session, recent, onLaunch }: { session: Session; recent: Launchable[]; onLaunch: (app: Launchable) => void }) {
  const goal = session.input ? artById[session.input.artId] : null;
  return (
    <div className="home">
      <div className="home-top">
        <div className="home-clock">
          <div className="date">Saturday, October 31</div>
          <div className="time">9:41</div>
          <div className="line">A little curiosity.<br />A path of your own.</div>
        </div>
        <button className="widget" onClick={() => onLaunch(!session.started || goal ? 'trace' : 'instagram')}>
          <span className="eyebrow"><Sparkles size={11} style={{ verticalAlign: -1 }} /> &nbsp;Trace</span>
          {!session.started && !goal && <>
            <h3>Let curiosity come first.</h3>
            <p>Wander through Instagram or Pinterest. When a work makes you want to learn, start a session in Trace.</p>
            <span className="widget-link">Explore Instagram <ArrowRight size={14} /></span>
          </>}
          {session.started && !goal && <>
            <h3>Return to the work that caught your eye.</h3>
            <p>Trace is listening only for what you choose. Open that artwork again, on either app, and set it as your learning goal.</p>
            <span className="widget-link">Back to Instagram <ArrowRight size={14} /></span>
          </>}
          {goal && <>
            <div className="widget-goal" style={{ marginTop: 10 }}>
              <img src={goal.image} alt="" />
              <div><strong>{goal.title}</strong><span>Your learning goal · {goal.artist}</span></div>
            </div>
            <div className="widget-stats">
              <span><Heart size={12} /> {session.captures.length} references</span>
              <span>{session.practice ? <><Bookmark size={12} /> Study saved</> : <><Images size={12} /> No study yet</>}</span>
            </div>
            <span className="widget-link">{session.endedAt && !session.started ? 'Path complete · read your learning log' : 'Open your learning map'} <ArrowRight size={14} /></span>
          </>}
        </button>
      </div>
      <div className="home-apps">
        {apps.map(app => (
          <button key={app.id} className="home-app" onClick={() => onLaunch(app.id)}>
            <AppIcon app={app.id} />
            {app.id === 'trace' && session.started && !session.paused && <span className="running" title="Running in the background" />}
            {app.label}
          </button>
        ))}
      </div>
      <div className="dock">
        {apps.map(app => (
          <button key={app.id} onClick={() => onLaunch(app.id)} aria-label={`Open ${app.label}`}>
            <AppIcon app={app.id} size="sm" />
            {recent.includes(app.id) && <span className="dot" />}
          </button>
        ))}
        <span className="divider" />
        <button className="journal-tile" onClick={() => onLaunch('trace')} aria-label="Open your journal in Trace"><Heart size={20} /></button>
      </div>
    </div>
  );
}
