import { allArtworks, artById, artworks, notesForArt } from './data';
import type { Artwork, JournalEntry, Practice, Session } from './data';
import { libraryFeature, libraryFeatureRoots } from './library';
import type { LibraryCluster, LibraryFeature } from './library';

export type LearningFocus = 'world-design' | 'painted-color';
export type FeatureGroup = 'character' | 'depth' | 'marks' | 'light' | LibraryFeature;

export const learningFocuses = {
  'world-design': { title: 'Character & world design', color: '#dbd8ac', question: 'How do shape, expression, and spatial layers build a believable world?', cues: ['silhouette', 'shape', 'depth', 'composition'] },
  'painted-color': { title: 'Painterly color & brushwork', color: '#a9cdd6', question: 'How do marks, edges, and color relationships guide the eye?', cues: ['color relationships', 'brushwork', 'soft edges', 'painted marks'] },
};

export const communityFeatures = {
  character: { title: 'Stylized character design', subject: 'Shape, gesture & expression', root: 'kfp-outpost', color: '#e5ca9c', x: 284, y: 83, labelX: 240, labelY: 25 },
  depth: { title: 'Cinematic depth & composition', subject: 'Silhouette, scale & atmosphere', root: 'kfp-goal', color: '#a9ceca', x: 1049, y: 338, labelX: 680, labelY: 160 },
  marks: { title: 'Color dabs & visual rhythm', subject: 'Color contrast & directional marks', root: 'starry', color: '#d6e8ad', x: -5, y: 686, labelX: 65, labelY: 400 },
  light: { title: 'Soft light & color relationships', subject: 'Soft edges, reflections & warm / cool', root: 'lilies', color: '#afa6de', x: 743, y: 899, labelX: 490, labelY: 535 },
  line: { title: 'Line, gesture & the figure', subject: 'Contour, weight & line of action', root: libraryFeatureRoots.line, color: '#9a6b4f', x: 1650, y: 180, labelX: 1250, labelY: -60 },
  shape: { title: 'Shape language & silhouette', subject: 'Basic shapes, readability & proportion', root: libraryFeatureRoots.shape, color: '#5f8f8a', x: 1560, y: 900, labelX: 1400, labelY: 590 },
  graphic: { title: 'Graphic style & stylized worlds', subject: 'Flat colour, pattern & stylization', root: libraryFeatureRoots.graphic, color: '#b5546b', x: 1150, y: 1480, labelX: 800, labelY: 1020 },
};

// Explicit feature-tag inference for this interactive demo; no live model call.
export function focusForArt(art: Artwork): LearningFocus {
  return art.tags.some(tag => ['pigment', 'brushwork', 'painted-marks', 'soft-edge'].includes(tag)) ? 'painted-color' : 'world-design';
}
export function featureForArt(art: Artwork): FeatureGroup {
  if (art.cluster in libraryFeature) return libraryFeature[art.cluster as LibraryCluster];
  if (focusForArt(art) === 'painted-color') return art.tags.some(tag => ['dabs', 'brushwork', 'directional-marks'].includes(tag)) ? 'marks' : 'light';
  return art.tags.some(tag => ['character', 'gesture', 'expression'].includes(tag)) ? 'character' : 'depth';
}
export function featureForId(artId: string) { return featureForArt(artById[artId]); }

export interface PersonalStep {
  id: string;
  artId: string;
  kind: 'goal' | 'reference' | 'study' | 'reflection';
  title: string;
  image: string;
  platform: string;
  visit: number;
  note?: string;
}
export interface PersonalThread { id: LearningFocus; steps: PersonalStep[]; primary: boolean }

export function personalThreads(session: Session): PersonalThread[] {
  const threads = new Map<LearningFocus, PersonalThread>();
  const events = [...(session.input ? [session.input] : []), ...session.captures];
  events.forEach((capture, index) => {
    const art = artById[capture.artId];
    if (!art) return;
    const focus = focusForArt(art);
    if (!threads.has(focus)) threads.set(focus, { id: focus, steps: [], primary: focus === focusForArt(artById[session.input?.artId || capture.artId]) });
    threads.get(focus)!.steps.push({ id: capture === session.input ? art.id : `capture-${capture.id}`, artId: art.id, kind: capture === session.input ? 'goal' : 'reference', title: art.title, image: art.image, platform: capture.platform, visit: index + 1 });
  });
  if (session.practice && session.input) {
    const focus = focusForArt(artById[session.input.artId]);
    const thread = threads.get(focus);
    thread?.steps.push({ id: session.practice.id, artId: session.input.artId, kind: 'study', title: session.practice.title, image: session.practice.image, platform: 'Procreate', visit: events.length + 1, note: session.practice.note });
    if (session.practice.note) thread?.steps.push({ id: 'my-reflection', artId: session.input.artId, kind: 'reflection', title: 'Your small discovery', image: '', platform: 'Your reflection', visit: events.length + 2, note: session.practice.note });
  }
  return [...threads.values()];
}

export function relevantReferenceIds(session: Session): string[] {
  if (!session.input) return [];
  const focus = focusForArt(artById[session.input.artId]);
  return [...new Set([session.input.artId, ...session.captures.filter(capture => focusForArt(artById[capture.artId]) === focus).map(capture => capture.artId)])];
}

const listOf = (xs: string[]) => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/**
 * Write a private learning-log entry for a saved study, from the recorded path only:
 * where it started, the references marked as helpful, what they share, what was set aside
 * for another question, the learner's own words, and one next thing to look at.
 */
/** The text facts behind a log entry — exactly what is sent to Claude (no images). Mirrors server/journal.ts. */
export interface JournalFacts {
  question: string;
  goal: { title: string; artist: string; collection: string; tags: string[]; platform: string; time: string };
  helpful: { title: string; artist: string; tags: string[]; platform: string; time: string }[];
  sharedTags: string[];
  setAside: { titles: string[]; question: string } | null;
  study: { title: string; note: string };
  nextLook: { title: string; shared: string[] } | null;
}

function pathParts(session: Session, practice: Practice) {
  const goal = artById[session.input!.artId];
  const focus = focusForArt(goal);
  const helpful = session.captures.filter(c => practice.references.includes(c.artId) && focusForArt(artById[c.artId]) === focus);
  const path = [goal.id, ...new Set(helpful.map(c => c.artId))];
  const parallel = session.captures.filter(c => focusForArt(artById[c.artId]) !== focus);
  const tagCount = new Map<string, number>();
  for (const id of path) for (const t of artById[id].tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
  const shared = [...tagCount].filter(([, n]) => n > 1 || path.length === 1).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  const next = suggestForPath(session, 1)[0];
  return { goal, helpful, path, parallel, shared, next };
}

export function journalFacts(session: Session, practice: Practice): JournalFacts {
  const { goal, helpful, parallel, shared, next } = pathParts(session, practice);
  return {
    question: session.goal,
    goal: { title: goal.title, artist: goal.artist, collection: goal.collection, tags: goal.tags, platform: session.input!.platform, time: session.input!.time },
    helpful: helpful.map(c => ({ title: artById[c.artId].title, artist: artById[c.artId].artist, tags: artById[c.artId].tags, platform: c.platform, time: c.time })),
    sharedTags: shared,
    setAside: parallel.length ? { titles: [...new Set(parallel.map(c => artById[c.artId].title))], question: learningFocuses[focusForArt(artById[parallel[0].artId])].title } : null,
    study: { title: practice.title, note: practice.note },
    nextLook: next ? { title: next.art.title, shared: next.shared } : null,
  };
}

export function makeJournalEntry(session: Session, practice: Practice, image: string): JournalEntry {
  const { goal, helpful, path, parallel, shared, next } = pathParts(session, practice);
  const paragraphs = [
    `You started from ${goal.title} by ${goal.artist}, found on ${session.input!.platform} at ${session.input!.time}, with one question: ${session.goal}`,
    helpful.length
      ? `Along the way you kept ${helpful.length} ${helpful.length === 1 ? 'reference' : 'references'} that helped: ${listOf(helpful.map(c => `${artById[c.artId].title} (${c.platform}, ${c.time})`))}.`
      : 'This time you worked from the goal alone, without other references.',
    shared.length ? `What ties this path together: ${listOf(shared)}. That is the thread your study was pulling on.` : '',
    parallel.length ? `You also noticed ${listOf([...new Set(parallel.map(c => artById[c.artId].title))])}. They ask a different question (${learningFocuses[focusForArt(artById[parallel[0].artId])].title.toLowerCase()}), so they wait in their own path.` : '',
    `Then you made “${practice.title}”${practice.sample ? ', drawing over the illustrative demo layer' : ''}.`,
    practice.note ? `In your words: “${practice.note}”` : 'You didn’t write a reflection this time — you can come back to it.',
    next ? `A next look: ${next.art.title}, which shares ${listOf(next.shared)} with this path.` : '',
  ].filter(Boolean);
  return { id: `log-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), title: practice.title, image, sample: practice.sample, note: practice.note, path, paragraphs, nextArtId: next?.art.id, author: 'template' };
}

export interface Suggestion { art: Artwork; shared: string[] }

/**
 * Two artworks to look at next, from what is already in the goal's path.
 * Tags that recur across the path count more; the goal's own learning theme adds a bonus.
 * Nothing already kept is suggested, and the two picks come from different collections.
 * Plain tag arithmetic — no model, and nothing is recorded until the learner keeps it.
 */
export function suggestForPath(session: Session, count = 2): Suggestion[] {
  if (!session.input) return [];
  const goal = artById[session.input.artId];
  const pathIds = relevantReferenceIds(session);
  const seen = new Set([...pathIds, ...session.captures.map(c => c.artId)]);
  const weight = new Map<string, number>();
  for (const id of pathIds) for (const tag of artById[id].tags) weight.set(tag, (weight.get(tag) || 0) + 1);
  const scored = allArtworks
    .filter(a => !seen.has(a.id))
    .map(art => {
      const shared = art.tags.filter(t => weight.has(t)).sort((a, b) => weight.get(b)! - weight.get(a)!);
      const tagScore = shared.reduce((t, tag) => t + weight.get(tag)!, 0) / Math.sqrt(art.tags.length);
      const theme = (featureForArt(art) === featureForArt(goal) ? 1 : 0) + (focusForArt(art) === focusForArt(goal) ? .5 : 0);
      return { art, shared, score: tagScore + theme };
    })
    .filter(s => s.shared.length > 0)
    .sort((a, b) => b.score - a.score);
  const picks: Suggestion[] = [];
  for (const s of scored) {
    if (picks.some(p => p.art.collection === s.art.collection)) continue;
    picks.push({ art: s.art, shared: s.shared.slice(0, 2) });
    if (picks.length === count) break;
  }
  return picks;
}

export interface CommunityResource {
  id: string;
  kind: 'study' | 'reflection' | 'tutorial';
  title: string;
  person: string;
  image?: string;
  imageClass?: string;
  provenance: string;
  text: string;
  likes: number;
  src?: string;
}
const generatedStudies: Record<string, { image: string; title: string; person: string; text: string; provenance?: string }[]> = {
  'kfp-goal': [
    { image: '/studies/kfp-depth-study.png', title: 'A study in three spatial layers', person: 'Mina L.', text: 'I simplified the coast into near, middle, and far shapes before painting the temple. The quieter distance made the foreground feel much closer.' },
    { image: '/studies/kfp-color-study.png', title: 'Trying a different temperature', person: 'Kai R.', text: 'I kept the arrangement of the cliffs but tried a warmer sky against cool water. Comparing the two palettes gave me a more specific question about mood.' },
  ],
  starry: [{ image: '/studies/starry-color-study.png', title: 'Short marks, a smaller palette', person: 'Jules A.', text: 'I used a few blues and small yellow accents. I noticed that the direction and spacing of each mark changed the movement more than extra detail did.' }],
  // Three line studies of the owl sheet, each a different hand. Made by local image processing of the
  // reference (scripts/owl_studies.py), not by a person — labelled as demo work by fictional learners.
  'kfpdev-01': [
    { image: '/studies/kfpdev-01-study-graphite.jpg', title: 'Finding the flight pose', person: 'Mina L.', provenance: 'Generated line study · fictional learner · demo', text: 'I started with a circle for the head and a long arc through both wings. Once that arc felt right, the feathers were just rhythm along it.' },
    { image: '/studies/kfpdev-01-study-ink.jpg', title: 'One clean contour', person: 'Kai R.', provenance: 'Generated line study · fictional learner · demo', text: 'I copied only the standing owl and kept every line the same weight. It showed me how much the belt and the feet carry the character.' },
    { image: '/studies/kfpdev-01-study-gesture.jpg', title: 'Both owls in two minutes', person: 'Jules A.', provenance: 'Generated line study · fictional learner · demo', text: 'I drew both poses fast and loose. Comparing them side by side, the wings tell you who is resting and who is about to move.' },
  ],
  lilies: [{ image: '/studies/lilies-light-study.png', title: 'Finding the light in color patches', person: 'Noor S.', text: 'I painted warm and cool patches before naming any lily pads. Keeping most edges soft helped the few firmer shapes hold my attention.' }],
};
/** Studies made by (fictional) people — never the reference-based analysis exercises. */
export function peerStudiesForArt(artId: string) {
  return (generatedStudies[artId] || []).map((study, i) => ({ ...study, id: `${artId}-peer-study-${i}`, provenance: study.provenance || 'AI-generated demo study · fictional learner' }));
}
export function studiesForArt(artId: string): CommunityResource[] {
  const art = artById[artId];
  const generated = (generatedStudies[artId] || []).map((study, i) => ({ ...study, id: `${artId}-peer-study-${i}`, kind: 'study' as const, provenance: study.provenance || 'AI-generated demo study · fictional learner', likes: 24 - i * 5 }));
  if (generated.length >= 2) return generated;
  return [...generated, ...Array.from({ length: 2 - generated.length }, (_, i) => ({ id: `${artId}-value-exercise-${i}`, kind: 'study' as const, title: i ? 'An edge and color comparison' : 'A simple value comparison', person: 'Trace exercise', image: art.image, imageClass: i ? 'analysis-color' : 'analysis-values', provenance: 'Reference-based analysis · demo exercise', text: i ? 'Compare the strength of the largest color relationships. Which area should hold the clearest edge?' : 'A grayscale view of this reference makes the large light and dark shapes easier to compare. Try your own small study, then return to the original.', likes: 12 - i * 3 }))];
}
export function resourcesForArt(artId: string): CommunityResource[] {
  // Demo lessons exist only for the 18 seed references; never show a video that can't play.
  const hasLesson = artworks.some(a => a.id === artId);
  return [
    ...studiesForArt(artId),
    ...notesForArt(artId).map(note => ({ id: note.id, kind: 'reflection' as const, title: note.title, person: note.name, provenance: 'Illustrative peer insight · demo', text: note.text, likes: note.likes })),
    ...(hasLesson ? [{ id: `${artId}-tutorial`, kind: 'tutorial' as const, title: 'Observe, try, compare', person: 'Trace visual lesson', image: artById[artId].image, provenance: '12-second silent tutorial · demo', text: 'A short, playable visual exercise around this exact reference: notice the large relationships, try a simplified study, and compare your choices.', likes: 18, src: `/tutorials/${artId}-study.mp4` }] : []),
  ];
}
