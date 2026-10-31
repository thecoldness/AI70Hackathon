import type { ReactNode } from 'react';
import { BatteryFull, Wifi } from 'lucide-react';
import type { TabletApp } from './state';

/** The Trace mark: one continuous line that loops once and lands on a dot — a path you leave. */
export function TraceMark({ size = 22, color = 'var(--clay)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 17c3.2 0 4.4-9 8-9 2.6 0 2.6 4.6.4 4.6-2 0-1.6-4.6 2.4-4.6 3 0 3.6 4 6.2 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20.2" cy="12" r="1.9" fill={color} />
    </svg>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <TraceMark size={size * 1.15} />
      <span>trace</span>
    </span>
  );
}

export function AppIcon({ app, size = 'lg' }: { app: Exclude<TabletApp, 'home'>; size?: 'lg' | 'sm' }) {
  return (
    <span className={`app-icon icon-${app} ${size}`} aria-hidden>
      {app === 'trace' && <TraceMark size={size === 'lg' ? 34 : 26} color="#f6e9df" />}
      {app === 'instagram' && (
        <svg viewBox="0 0 24 24" width="56%" height="56%" fill="none" stroke="#fff" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.3" cy="6.7" r="1" fill="#fff" stroke="none" />
        </svg>
      )}
      {app === 'pinterest' && <span className="pin-p">P</span>}
      {app === 'procreate' && (
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4.5l5 5L10 19H5v-5z" /><path d="M12.5 6.5l5 5" />
        </svg>
      )}
    </span>
  );
}

interface FrameProps {
  app: TabletApp;
  statusPill: string | null;
  onStatusPill: () => void;
  onHome: () => void;
  children: ReactNode;
}

export function TabletFrame({ app, statusPill, onStatusPill, onHome, children }: FrameProps) {
  const darkBar = app === 'procreate';
  return (
    <div className="ipad-device">
      <span className="ipad-camera" aria-hidden />
      <div className={`ipad-screen app-${app}`}>
        <div className={`status-bar ${darkBar ? 'dark' : ''} ${app === 'home' ? 'on-wallpaper' : ''}`}>
          <span><b>9:41</b>&nbsp;&nbsp;Sat Oct 31</span>
          {statusPill
            ? <button className="status-pill" onClick={onStatusPill} title="Open Trace"><i />{statusPill}</button>
            : <span className="status-quiet">Your learning, connected</span>}
          <span className="status-right"><Wifi size={13} strokeWidth={2.2} /> 100% <BatteryFull size={17} strokeWidth={1.6} /></span>
        </div>
        <div className="screen-body">{children}</div>
        <button className={`home-gesture ${darkBar ? 'dark' : ''}`} onClick={onHome} aria-label="Go to Home Screen"><span /></button>
      </div>
    </div>
  );
}
