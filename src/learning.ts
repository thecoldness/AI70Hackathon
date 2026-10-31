import { artById, notesForArt } from './data';
import type { Artwork, Session } from './data';

export type LearningFocus = 'world-design' | 'painted-color';
export type FeatureGroup = 'character' | 'depth' | 'marks' | 'light';

export const learningFocuses = {
  'world-design': { title: 'Character & world design', subtitle: 'Silhouette, shape & spatial depth', color: '#dbd8ac', question: 'How do shape, expression, and spatial layers build a believable world?', cues: ['silhouette', 'shape', 'depth', 'composition'] },
  'painted-color': { title: 'Painterly color & brushwork', subtitle: 'Brushwork, color relationships & light', color: '#a9cdd6', question: 'How do marks, edges, and color relationships guide the eye?', cues: ['color relationships', 'brushwork', 'soft edges', 'painted marks'] },
};

export const communityFeatures = {
  character: { title: 'Stylized character design', subtitle: 'Character design', subject: 'Shape, gesture & expression', root: 'kfp-outpost', color: '#e5ca9c', x: 380, y: 255, labelX: 240, labelY: 25 },
  depth: { title: 'Cinematic depth & composition', subtitle: 'Depth & composition', subject: 'Silhouette, scale & atmosphere', root: 'kfp-goal', color: '#a9ceca', x: 830, y: 405, labelX: 680, labelY: 160 },
  marks: { title: 'Color dabs & visual rhythm', subtitle: 'Color & brushwork', subject: 'Color contrast & directional marks', root: 'starry', color: '#d6e8ad', x: 210, y: 610, labelX: 65, labelY: 400 },
  light: { title: 'Soft light & color relationships', subtitle: 'Light & color', subject: 'Soft edges, reflections & warm / cool', root: 'lilies', color: '#afa6de', x: 650, y: 735, labelX: 490, labelY: 535 },
};

// Explicit feature-tag inference for this interactive demo; no live model call.
export function focusForArt(art: Artwork): LearningFocus {
  return art.tags.some(tag => ['pigment', 'brushwork', 'painted-marks', 'soft-edge'].includes(tag)) ? 'painted-color' : 'world-design';
}
export function featureForArt(art: Artwork): FeatureGroup {
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
const generatedStudies: Record<string, { image: string; title: string; person: string; text: string }[]> = {
  'kfp-goal': [
    { image: '/studies/kfp-depth-study.png', title: 'A study in three spatial layers', person: 'Mina L.', text: 'I simplified the coast into near, middle, and far shapes before painting the temple. The quieter distance made the foreground feel much closer.' },
    { image: '/studies/kfp-color-study.png', title: 'Trying a different temperature', person: 'Kai R.', text: 'I kept the arrangement of the cliffs but tried a warmer sky against cool water. Comparing the two palettes gave me a more specific question about mood.' },
  ],
  starry: [{ image: '/studies/starry-color-study.png', title: 'Short marks, a smaller palette', person: 'Jules A.', text: 'I used a few blues and small yellow accents. I noticed that the direction and spacing of each mark changed the movement more than extra detail did.' }],
  lilies: [{ image: '/studies/lilies-light-study.png', title: 'Finding the light in color patches', person: 'Noor S.', text: 'I painted warm and cool patches before naming any lily pads. Keeping most edges soft helped the few firmer shapes hold my attention.' }],
};
export function studiesForArt(artId: string): CommunityResource[] {
  const art = artById[artId];
  const generated = (generatedStudies[artId] || []).map((study, i) => ({ ...study, id: `${artId}-peer-study-${i}`, kind: 'study' as const, provenance: 'AI-generated demo study · fictional learner', likes: 24 - i * 5 }));
  if (generated.length >= 2) return generated;
  return [...generated, ...Array.from({ length: 2 - generated.length }, (_, i) => ({ id: `${artId}-value-exercise-${i}`, kind: 'study' as const, title: i ? 'An edge and color comparison' : 'A simple value comparison', person: 'Trace exercise', image: art.image, imageClass: i ? 'analysis-color' : 'analysis-values', provenance: 'Reference-based analysis · demo exercise', text: i ? 'Compare the strength of the largest color relationships. Which area should hold the clearest edge?' : 'A grayscale view of this reference makes the large light and dark shapes easier to compare. Try your own small study, then return to the original.', likes: 12 - i * 3 }))];
}
export function resourcesForArt(artId: string): CommunityResource[] {
  return [
    ...studiesForArt(artId),
    ...notesForArt(artId).map(note => ({ id: note.id, kind: 'reflection' as const, title: note.title, person: note.name, provenance: 'Illustrative peer insight · demo', text: note.text, likes: note.likes })),
    { id: `${artId}-tutorial`, kind: 'tutorial', title: 'Observe, try, compare', person: 'Trace visual lesson', image: artById[artId].image, provenance: '12-second silent tutorial · demo', text: 'A short, playable visual exercise around this exact reference: notice the large relationships, try a simplified study, and compare your choices.', likes: 18, src: `/tutorials/${artId}-study.mp4` },
  ];
}
