import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Bookmark, Check, ExternalLink, Eye, Heart, MoreHorizontal, Search, Target, X } from 'lucide-react';
import { allArtworks, artById, clusters } from './data';
import { libraryCollections } from './library';
import type { LibraryCluster } from './library';
import type { Artwork, Cluster, Platform, Session } from './data';
import { isRecorded } from './state';
import type { BrowseState } from './state';
import { TraceMark } from './TabletFrame';

interface Props {
  platform: Platform;
  browse: BrowseState;
  setBrowse: (patch: Partial<BrowseState>) => void;
  session: Session;
  onRecord: (artId: string) => void;
  onHint: (msg: string) => void;
  onExit: () => void;
}

const pinterestTabs: { id: string; label: string }[] = [
  { id: 'for-you', label: 'For you' },
  { id: 'kungfu', label: 'Kung Fu Panda' },
  { id: 'zootopia', label: 'Zootopia' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'vangogh', label: 'Van Gogh' },
  { id: 'monet', label: 'Monet' },
  ...(Object.entries(libraryCollections) as [LibraryCluster, typeof libraryCollections[LibraryCluster]][]).map(([id, c]) => ({ id, label: c.name })),
  { id: 'saved', label: 'Saved' },
];

// The suggested demo order sits at the top of the mixed feed, interleaving two learning questions.
// After that, three pieces from each added collection, interleaved so no single collection dominates.
const forYouOrder = ['kfp-goal', 'starry', 'zoo-city', 'lilies', 'kfp-light', 'zoo-light', 'frozen-anna', 'cypresses', 'kfp-atmosphere', 'garden', 'frozen-arendelle', 'cafe', 'zoo-atmosphere', 'kfp-shapes', 'sunrise', 'frozen-elsa', 'kfp-outpost', 'kfp-action',
  ...[1, 2, 3].flatMap(n => Object.keys(libraryCollections).map(key => `${key}-${String(n).padStart(2, '0')}`))];

function matches(art: Artwork, q: string) {
  const s = q.trim().toLowerCase();
  return !s || [art.title, art.artist, art.collection, ...art.tags].some(v => v.toLowerCase().includes(s));
}

export function SocialApp({ platform, browse, setBrowse, session, onRecord, onHint, onExit }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollPos = useRef(browse.scroll);
  const ig = platform === 'Instagram';
  const focused = browse.focusedArt ? artById[browse.focusedArt] : null;

  // Restore this app's own scroll position, and remember it when leaving.
  useLayoutEffect(() => { if (scroller.current) scroller.current.scrollTop = browse.scroll; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => setBrowse({ scroll: scrollPos.current }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const feed = useMemo(() => {
    let list: Artwork[];
    if (ig) {
      list = browse.artist ? allArtworks.filter(a => a.cluster === browse.artist) : allArtworks.filter(a => clusters[a.cluster].showOnInstagram !== false);
    } else if (browse.feedFilter === 'saved') {
      const ids = [session.input?.artId, ...session.captures.map(c => c.artId)].filter(Boolean) as string[];
      list = [...new Set(ids)].map(id => artById[id]);
    } else if (browse.feedFilter === 'for-you') {
      list = forYouOrder.map(id => artById[id]);
    } else {
      list = allArtworks.filter(a => a.cluster === browse.feedFilter);
    }
    return list.filter(a => matches(a, browse.query));
  }, [ig, browse.artist, browse.feedFilter, browse.query, session]);

  const artistEntries = (Object.entries(clusters) as [Cluster, typeof clusters[Cluster]][]).filter(([, c]) => c.showOnInstagram !== false);
  const goalArt = session.input ? artById[session.input.artId] : null;

  return (
    <div className={`social ${ig ? 'ig' : 'pin'}`}>
      <div className="social-scroll" ref={scroller} onScroll={e => { scrollPos.current = e.currentTarget.scrollTop; }}>
        <header className="social-top">
          <button className="icon-btn" onClick={onExit} aria-label="Back to Home Screen"><ArrowLeft size={19} /></button>
          {ig
            ? <span className="ig-logo">Instagram</span>
            : <span className="pin-logo"><span className="pin-badge">P</span>Pinterest</span>}
          <label className="social-search">
            <Search size={15} />
            <input value={browse.query} onChange={e => setBrowse({ query: e.target.value })} placeholder="Search artists and inspiration" />
          </label>
          <span className="demo-tag">Demo</span>
          <button className="icon-btn" aria-label="Saved" onClick={() => !ig && setBrowse({ feedFilter: 'saved', focusedArt: null })}><Bookmark size={18} /></button>
        </header>

        {ig && !browse.artist && (
          <section className="ig-artists">
            {artistEntries.map(([key, c]) => (
              <button key={key} onClick={() => setBrowse({ artist: key, focusedArt: null })}>
                <span className="ring"><img src={artById[c.root].image} alt="" /></span>
                <span>{c.account}</span>
              </button>
            ))}
          </section>
        )}
        {ig && browse.artist && (
          <section className="ig-profile">
            <button className="icon-btn" onClick={() => setBrowse({ artist: null, focusedArt: null })} aria-label="All artists"><ArrowLeft size={16} /></button>
            <span className="ring big"><img src={artById[clusters[browse.artist].root].image} alt="" /></span>
            <div>
              <strong>{clusters[browse.artist].account}</strong>
              <span className="serif">{clusters[browse.artist].profileTitle}</span>
              <p>{clusters[browse.artist].description}</p>
            </div>
            <div className="ig-counts"><b>{feed.length}</b> posts</div>
          </section>
        )}

        {!ig && (
          <section className="pin-intro">
            <h2 className="serif">Ideas for your next small study.</h2>
            <p>{goalArt ? `Following your curiosity from ${goalArt.title}.` : 'Animation concept art and paintings, side by side.'}</p>
            <nav className="pin-tabs">
              {pinterestTabs.map(t => (
                <button key={t.id} className={browse.feedFilter === t.id ? 'on' : ''} onClick={() => setBrowse({ feedFilter: t.id })}>{t.label}</button>
              ))}
            </nav>
          </section>
        )}

        {feed.length === 0 && <p className="social-empty">{browse.feedFilter === 'saved' ? 'Nothing kept yet. Open a painting and tap the heart to keep it.' : 'No artwork matches that search.'}</p>}
        <div className={ig ? 'ig-grid' : 'pin-grid'}>
          {feed.map((art, i) => (
            <button key={art.id} className="feed-card" onClick={() => setBrowse({ focusedArt: art.id })}>
              <span className="feed-img" style={ig ? undefined : { aspectRatio: art.ratio ? Math.min(1.6, Math.max(.6, art.ratio)) : [0.82, 1.2, 0.95, 1.35, 1.05][i % 5] }}>
                <img src={art.image} alt={art.title} loading="lazy" />
                {isRecorded(session, art.id, platform) && <span className="kept"><Check size={11} /> Kept</span>}
              </span>
              {!ig && <span className="feed-meta"><strong>{art.title}</strong><span>{art.collection} · {art.artist}</span><MoreHorizontal size={14} /></span>}
            </button>
          ))}
        </div>
      </div>

      {focused && <ArtDetail art={focused} platform={platform} onClose={() => setBrowse({ focusedArt: null })} session={session} />}
      <CaptureFab platform={platform} session={session} focused={focused} onRecord={onRecord} onHint={onHint} />
    </div>
  );
}

function ArtDetail({ art, platform, session, onClose }: { art: Artwork; platform: Platform; session: Session; onClose: () => void }) {
  const ig = platform === 'Instagram';
  const isGoal = session.input?.artId === art.id;
  return (
    <div className="detail-scrim" onClick={onClose}>
      <article className="detail" onClick={e => e.stopPropagation()} role="dialog" aria-label={art.title}>
        <div className="detail-img"><img src={art.image} alt={art.title} /></div>
        <div className="detail-side">
          <button className="icon-btn detail-x" onClick={onClose} aria-label="Close image"><X size={18} /></button>
          <span className="detail-handle">{ig ? <span className="ig-dot" /> : <span className="pin-badge sm">P</span>}{ig ? clusters[art.cluster].account : `Pinned from ${clusters[art.cluster].account}`}</span>
          <h2 className="serif">{art.title}</h2>
          <p className="detail-by">{art.artist} · {art.collection}</p>
          <div className="detail-tags">{art.tags.map(t => <span key={t} className="chip">{t}</span>)}</div>
          <hr />
          <div className="detail-prompt">
            <Eye size={17} />
            <div>
              <h4 className="serif">{isGoal ? 'Your learning goal.' : session.input ? 'Does this answer the same question?' : 'What would you like to learn?'}</h4>
              <p>{isGoal ? 'Everything you keep from here connects back to this work.' : session.started && !session.input ? 'Tap the learning button to make this your first node.' : 'Look first. Keep it only if it helps you see something new.'}</p>
            </div>
          </div>
          <footer className="detail-credit">
            {art.credit}<br />
            {art.sourceUrl ? <a href={art.sourceUrl} target="_blank" rel="noreferrer">Original artwork & credit <ExternalLink size={10} /></a> : 'Source not recorded'} · Simulated {platform} post
          </footer>
        </div>
      </article>
    </div>
  );
}

/** The floating capture button. It only exists while a Trace session runs, and only ever acts on a tap. */
function CaptureFab({ platform, session, focused, onRecord, onHint }: { platform: Platform; session: Session; focused: Artwork | null; onRecord: (artId: string) => void; onHint: (msg: string) => void }) {
  if (!session.started) return null;
  let label: string, hint: string, mode: 'goal' | 'keep' | 'done' | 'idle' | 'paused';
  if (session.paused) { mode = 'paused'; label = 'Trace is paused'; hint = 'Resume in Trace to keep references'; }
  else if (!focused) { mode = 'idle'; label = session.input ? 'Open a painting to keep it' : 'Open the work you loved'; hint = `${session.captures.length + (session.input ? 1 : 0)} notes in your learning journal`; }
  else if (isRecorded(session, focused.id, platform)) { mode = 'done'; label = session.input?.artId === focused.id ? 'Your learning goal' : 'Kept in your journal'; hint = 'Already recorded'; }
  else if (!session.input) { mode = 'goal'; label = 'Set as learning goal'; hint = 'The first node starts with your choice'; } else { mode = 'keep'; label = 'Like and keep reference'; hint = `Adds a visit to your ${platform} trail`; }
  return (
    <div className={`fab-wrap ${mode}`}>
      <div className="fab-bubble"><strong>{label}</strong><span>{hint}</span></div>
      <button className="fab" onClick={() => {
        // Never a dead button: either record, or say why not.
        if (mode === 'goal' || mode === 'keep' || mode === 'paused') return focused ? onRecord(focused.id) : onHint('Trace is paused. Resume it in Trace to keep references.');
        if (mode === 'done') return onHint(label === 'Your learning goal' ? 'This is already your learning goal.' : 'Already in your journal.');
        onHint('Open a painting first, then tap the heart to keep it.');
      }} aria-label={label}>
        {mode === 'goal' ? <Target size={23} /> : mode === 'done' ? <Check size={22} /> : <Heart size={22} fill={mode === 'keep' ? 'none' : undefined} />}
        <span className="fab-mark"><TraceMark size={11} color="#fff" /></span>
      </button>
    </div>
  );
}
