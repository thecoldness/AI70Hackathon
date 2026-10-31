import { artById, initialSession } from './data';
import type { Capture, Cluster, Platform, Session } from './data';

export type TabletApp = 'home' | 'trace' | 'instagram' | 'pinterest' | 'procreate';
export type TraceView = 'path' | 'community';

export interface PrivateNote { id: string; text: string; artId: string; time: string }

export interface Stored {
  session: Session;
  votes: Record<string, boolean>;
  /** The viewer chose not to see studies drawn by other people. */
  hideOthers: boolean;
  notes: PrivateNote[];
}

/** Per-app browsing memory, kept for the lifetime of the page (not persisted). */
export interface BrowseState {
  artist: Cluster | null;
  focusedArt: string | null;
  query: string;
  feedFilter: string;
  scroll: number;
}

export const STORAGE_KEY = 'trace-ipad-learning-v2';

export function emptyStored(): Stored {
  return { session: initialSession(), votes: {}, notes: [], hideOthers: false };
}

/** Restore saved state, discarding anything that refers to artwork that no longer exists. */
export function loadStored(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStored();
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const base = emptyStored();
    const s = { ...base.session, ...parsed.session };
    const valid = (c?: Capture | null) => !!c && !!artById[c.artId];
    return {
      session: {
        ...s,
        input: valid(s.input) ? s.input : null,
        captures: (s.captures || []).filter(valid),
        practice: s.practice && s.practice.references ? { ...s.practice, references: s.practice.references.filter(id => artById[id]) } : null,
        // An entry still marked 'writing' was interrupted by a reload: keep its template text.
        journal: Array.isArray(s.journal) ? s.journal.filter(e => e && Array.isArray(e.path) && e.path.every(id => artById[id])).map(e => e.author === 'writing' ? { ...e, author: 'template' as const } : e) : [],
      },
      votes: parsed.votes && typeof parsed.votes === 'object' ? parsed.votes : {},
      hideOthers: parsed.hideOthers === true,
      notes: Array.isArray(parsed.notes) ? parsed.notes.filter(n => n && artById[n.artId] && typeof n.text === 'string') : [],
    };
  } catch {
    return emptyStored();
  }
}

export function saveStored(stored: Stored) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stored)); } catch { /* storage may be full or blocked; the demo keeps working in memory */ }
}

export function clockTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function makeCapture(artId: string, platform: Platform): Capture {
  return { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, artId, platform, time: clockTime() };
}

/**
 * The only way anything enters the journal. Returns the new session, or a reason it was refused.
 * The first artwork you choose, on either app, becomes the goal; afterwards, each artId+platform is kept once.
 */
export function recordArt(session: Session, artId: string, platform: Platform): { session: Session } | { refused: string } {
  if (!session.started) return { refused: 'Start a session in Trace first.' };
  if (session.paused) return { refused: 'Trace is paused. Resume it in Trace to keep references.' };
  if (!session.input) {
    return { session: { ...session, input: makeCapture(artId, platform), artist: artById[artId].cluster } };
  }
  if (isRecorded(session, artId, platform)) return { refused: 'Already in your journal.' };
  return { session: { ...session, captures: [...session.captures, makeCapture(artId, platform)] } };
}

export function isRecorded(session: Session, artId: string, platform: Platform) {
  return session.input?.artId === artId || session.captures.some(c => c.artId === artId && c.platform === platform);
}
