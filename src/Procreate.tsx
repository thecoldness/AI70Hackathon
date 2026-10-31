import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Brush, Eye, EyeOff, Lightbulb, Plus, Quote, Sparkles, Undo2, Upload } from 'lucide-react';
import { artById } from './data';
import type { Session } from './data';
import { relevantReferenceIds, suggestForPath } from './learning';

export interface Stroke { color: string; width: number; points: [number, number][] }
/** `revealArt` is the reference shown as the faint demo layer; it follows whichever reference you are viewing. */
export interface ProcreateState { strokes: Stroke[]; imported: string | null; revealed: boolean; revealArt: string | null; dirty: boolean }

export const emptyProcreate = (): ProcreateState => ({ strokes: [], imported: null, revealed: false, revealArt: null, dirty: false });

const W = 1200, H = 800;
const palette = ['#2d3a4a', '#6f8fb0', '#e6c37a', '#f4efe4'];
const widths = [4, 9, 18];

const toPath = (s: Stroke) => s.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

/** Downscale a data-URL image (keeps aspect), for small stored copies such as learning-log thumbnails. */
export async function shrinkImage(src: string, max: number): Promise<string> {
  const img = await new Promise<HTMLImageElement | null>(resolve => {
    const el = new Image(); el.onload = () => resolve(el); el.onerror = () => resolve(null); el.src = src;
  });
  if (!img) return src;
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', .8);
}

/** True when the canvas holds something the learner made: strokes or an image they imported. */
export const hasOwnWork = (state: ProcreateState) => state.strokes.length > 0 || !!state.imported;

/**
 * Flatten only the learner's own work — an imported image and/or their strokes — onto paper.
 * The demo layer is a tracing guide and is never saved. Stroke-only studies are trimmed to what was drawn.
 */
export async function composeStudy(state: ProcreateState): Promise<string> {
  let box = { x: 0, y: 0, w: W, h: H };
  if (!state.imported && state.strokes.length) {
    const pts = state.strokes.flatMap(s => s.points.map(([x, y]) => [x, y, s.width / 2] as const));
    const pad = 40;
    const x0 = Math.max(0, Math.min(...pts.map(p => p[0] - p[2])) - pad), x1 = Math.min(W, Math.max(...pts.map(p => p[0] + p[2])) + pad);
    const y0 = Math.max(0, Math.min(...pts.map(p => p[1] - p[2])) - pad), y1 = Math.min(H, Math.max(...pts.map(p => p[1] + p[2])) + pad);
    // Keep a sensible minimum so a single small mark doesn't become a sliver.
    const w = Math.max(x1 - x0, 360), h = Math.max(y1 - y0, 240);
    box = { x: Math.max(0, Math.min(W - w, (x0 + x1 - w) / 2)), y: Math.max(0, Math.min(H - h, (y0 + y1 - h) / 2)), w, h };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(box.w); canvas.height = Math.round(box.h);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(-box.x, -box.y);
  if (state.imported) {
    const img = await new Promise<HTMLImageElement | null>(resolve => {
      const el = new Image(); el.onload = () => resolve(el); el.onerror = () => resolve(null); el.src = state.imported!;
    });
    if (img) {
      const k = Math.min(W / img.width, H / img.height);
      const w = img.width * k, h = img.height * k;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    }
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of state.strokes) {
    ctx.strokeStyle = s.color; ctx.lineWidth = s.width;
    ctx.stroke(new Path2D(toPath(s)));
  }
  return canvas.toDataURL('image/jpeg', .86);
}

interface Props {
  state: ProcreateState;
  setState: (fn: (s: ProcreateState) => ProcreateState) => void;
  session: Session;
  onLeave: () => void;
  onToast: (msg: string) => void;
}

export function Procreate({ state, setState, session, onLeave, onToast }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState({ color: palette[0], width: widths[1] });
  const goal = session.input ? artById[session.input.artId] : null;
  const refs = relevantReferenceIds(session).filter(id => id !== goal?.id).map(id => artById[id]);
  const suggestions = suggestForPath(session);
  // A suggestion can stand in as the reference while you draw; it is never recorded on its own.
  const [viewing, setViewing] = useState<string | null>(state.revealArt && state.revealArt !== goal?.id ? state.revealArt : null);
  const shown = viewing ? artById[viewing] : goal;
  // Switching references also switches the demo layer, so the goal never lingers behind another reference.
  const view = (id: string | null) => {
    const next = id === viewing ? null : id;
    setViewing(next);
    setState(s => s.revealed ? { ...s, revealArt: next || goal?.id || null } : s);
  };
  const hasLayer = !!state.imported || state.revealed;
  const layerArt = state.revealArt ? artById[state.revealArt] : goal;

  const point = (e: ReactPointerEvent): [number, number] => {
    const r = svg.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  const down = (e: ReactPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { color, width } = tool;
    setState(s => ({ ...s, dirty: true, strokes: [...s.strokes, { color, width, points: [point(e)] }] }));
  };
  const move = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    const p = point(e);
    setState(s => {
      const strokes = s.strokes.slice();
      const last = strokes[strokes.length - 1];
      strokes[strokes.length - 1] = { ...last, points: [...last.points, p] };
      return { ...s, strokes };
    });
  };
  const importFile = (f?: File) => {
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) return onToast('Use a PNG, JPEG or WebP image.');
    if (f.size > 3 * 1024 * 1024) return onToast('That image is over 3 MB. Try a smaller export.');
    const reader = new FileReader();
    reader.onload = () => setState(s => ({ ...s, imported: String(reader.result), revealed: false, dirty: true }));
    reader.readAsDataURL(f);
  };

  return (
    <div className="procreate">
      <header className="pc-top">
        <button className="pc-gallery" onClick={onLeave}>Gallery</button>
        <strong>Procreate</strong>
        <span className="pc-sim">Simulated practice canvas</span>
        <button className="icon-btn" onClick={() => file.current?.click()} aria-label="Import your own image"><Upload size={18} /></button>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }} />
      </header>
      <div className="pc-body">
        <aside className="pc-side">
          <span className="pc-label"><Eye size={13} /> {viewing ? 'Suggested reference' : 'Your reference'}</span>
          {goal && shown ? <>
            <img className="pc-ref" src={shown.image} alt={shown.title} />
            <strong>{shown.title}</strong>
            <span className="pc-by">{shown.artist}</span>
            {viewing && <button className="pc-back" onClick={() => view(null)}><ArrowLeft size={12} /> Back to your goal</button>}
            <hr />
            <Quote size={18} className="pc-quote" />
            <p className="pc-question serif">{session.goal}</p>
            {refs.length > 0 && <>
              <span className="pc-label">Also in your path</span>
              {refs.map(r => (
                <button key={r.id} className={`pc-also ${viewing === r.id ? 'on' : ''}`} onClick={() => view(r.id)} title="Use as your reference while drawing">
                  <img src={r.image} alt="" /><span>{r.title}</span>
                </button>
              ))}
            </>}
            {suggestions.length > 0 && <>
              <span className="pc-label pc-suggest-label"><Sparkles size={12} /> Suggested for this path</span>
              {suggestions.map(s => (
                <button key={s.art.id} className={`pc-suggest ${viewing === s.art.id ? 'on' : ''}`} onClick={() => view(s.art.id)}
                  title="Use as your reference while drawing">
                  <img src={s.art.thumb || s.art.image} alt="" />
                  <span><strong>{s.art.title}</strong><em>Shares {s.shared.join(' · ')}</em></span>
                </button>
              ))}
            </>}
          </> : <p className="pc-empty">No learning goal yet. You can still sketch freely — Trace only offers to keep a study once you've chosen a goal.</p>}
        </aside>
        <section className="pc-canvas-wrap">
          <div className="pc-toolbar">
            <span className="pc-label"><Brush size={13} /> Practice canvas</span>
            <span className="spacer" />
            {palette.map(c => (
              <button key={c} className={`swatch ${tool.color === c ? 'on' : ''}`} style={{ background: c }} aria-label={`Colour ${c}`}
                onClick={() => setTool(t => ({ ...t, color: c }))} />
            ))}
            <button className="pc-width" onClick={() => setTool(t => ({ ...t, width: widths[(widths.indexOf(t.width) + 1) % widths.length] }))} aria-label="Brush width">
              <Brush size={14} /> {tool.width}
            </button>
            <button className="icon-btn" onClick={() => setState(s => ({ ...s, strokes: s.strokes.slice(0, -1), dirty: true }))} aria-label="Undo"><Undo2 size={16} /></button>
            {hasLayer
              ? <button className="pc-layer" onClick={() => setState(s => ({ ...s, imported: null, revealed: false, revealArt: null, dirty: true }))} title="Remove the background image; your strokes stay"><EyeOff size={13} /> Remove background</button>
              : shown && <button className="pc-layer" onClick={() => setState(s => ({ ...s, revealed: true, revealArt: shown.id }))} title="Show the current reference faintly behind your drawing (never saved)"><Eye size={13} /> Demo layer</button>}
          </div>
          <div className="pc-canvas">
            {state.imported && <img src={state.imported} alt="Your imported study" />}
            {!state.imported && state.revealed && layerArt && <img src={layerArt.image} className="demo-study" alt="Illustrative demo study" />}
            <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }}>
              {state.strokes.map((s, i) => <path key={i} d={toPath(s)} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
            </svg>
            {!state.imported && state.revealed && <span className="pc-demo-badge">Guide layer · not saved with your study</span>}
            {!state.imported && !state.revealed && state.strokes.length === 0 && (
              <div className="pc-placeholder">
                <p className="serif">Start with three big shapes.</p>
                <span>Draw with your pointer, import your own study, or</span>
                {shown && <button className="btn sm" onClick={() => setState(s => ({ ...s, revealed: true, revealArt: shown.id }))}>Reveal demo study</button>}
              </div>
            )}
          </div>
          <div className="pc-foot"><span>Demo practice canvas</span><span>Observe. Try. Notice.</span></div>
        </section>
      </div>
      <footer className="pc-bottom">
        <Lightbulb size={16} />
        <span>The drawing is yours. Trace only keeps the steps around it.</span>
        <span className="spacer" />
        <button className="btn pc-finish" onClick={onLeave}><Plus size={15} /> Finish & leave Procreate <ArrowRight size={15} /></button>
      </footer>
    </div>
  );
}
