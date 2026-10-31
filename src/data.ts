export type Platform = 'Pinterest' | 'Instagram';
export type Cluster = 'vangogh' | 'monet' | 'hokusai';
export type NodeKind = 'artwork' | 'reference' | 'study' | 'reflection' | 'tutorial';

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  image: string;
  cluster: Cluster;
  year: string;
  tags: string[];
}

export interface AtlasNode {
  id: string;
  kind: NodeKind;
  cluster: Cluster;
  title: string;
  artId: string;
  person?: string;
  note?: string;
  likes: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  image?: string;
  sample?: boolean;
}

export interface AtlasLink {
  source: string;
  target: string;
  kind: 'reference' | 'practice' | 'reflection';
}

export interface Capture {
  id: string;
  artId: string;
  platform: Platform;
  time: string;
}

export interface Practice {
  id: string;
  image: string;
  title: string;
  note: string;
  references: string[];
  sample: boolean;
}

export interface Session {
  started: boolean;
  paused: boolean;
  artist: Cluster;
  goal: string;
  captures: Capture[];
  practice: Practice | null;
}

export const artworks: Artwork[] = [
  { id: 'starry', title: 'The Starry Night', artist: 'Vincent van Gogh', image: '/art/vangogh-starry.jpg', cluster: 'vangogh', year: '1889', tags: ['movement', 'night', 'brushwork', 'sky', 'rhythm'] },
  { id: 'cypresses', title: 'Wheat Field with Cypresses', artist: 'Vincent van Gogh', image: '/art/vangogh-cypresses.jpg', cluster: 'vangogh', year: '1889', tags: ['movement', 'brushwork', 'landscape', 'rhythm'] },
  { id: 'cafe', title: 'Café Terrace at Night', artist: 'Vincent van Gogh', image: '/art/vangogh-cafe.jpg', cluster: 'vangogh', year: '1888', tags: ['night', 'color', 'light', 'contrast'] },
  { id: 'irises', title: 'Irises', artist: 'Vincent van Gogh', image: '/art/vangogh-irises.jpg', cluster: 'vangogh', year: '1889', tags: ['color', 'rhythm', 'brushwork', 'flowers'] },
  { id: 'bedroom', title: 'The Bedroom', artist: 'Vincent van Gogh', image: '/art/vangogh-bedroom.jpg', cluster: 'vangogh', year: '1889', tags: ['perspective', 'color', 'interior'] },
  { id: 'portrait', title: 'Self-Portrait', artist: 'Vincent van Gogh', image: '/art/vangogh-portrait.jpg', cluster: 'vangogh', year: '1889', tags: ['brushwork', 'movement', 'portrait'] },
  { id: 'lilies', title: 'Water Lilies', artist: 'Claude Monet', image: '/art/monet-lilies.jpg', cluster: 'monet', year: '1922', tags: ['light', 'water', 'color', 'reflection'] },
  { id: 'sunrise', title: 'Impression, Sunrise', artist: 'Claude Monet', image: '/art/monet-sunrise.jpg', cluster: 'monet', year: '1872', tags: ['light', 'water', 'atmosphere', 'color'] },
  { id: 'garden', title: 'The Artist’s Garden at Giverny', artist: 'Claude Monet', image: '/art/monet-garden.jpg', cluster: 'monet', year: '1900', tags: ['light', 'color', 'flowers', 'garden'] },
  { id: 'wave', title: 'The Great Wave off Kanagawa', artist: 'Katsushika Hokusai', image: '/art/hokusai-wave.jpg', cluster: 'hokusai', year: 'c. 1831', tags: ['movement', 'line', 'rhythm', 'water', 'composition'] },
  { id: 'fuji', title: 'Fine Wind, Clear Morning', artist: 'Katsushika Hokusai', image: '/art/hokusai-fuji.jpg', cluster: 'hokusai', year: 'c. 1831', tags: ['composition', 'color', 'landscape', 'line'] },
  { id: 'bridge', title: 'Under Mannen Bridge at Fukagawa', artist: 'Katsushika Hokusai', image: '/art/hokusai-bridge.jpg', cluster: 'hokusai', year: 'c. 1831', tags: ['composition', 'line', 'water', 'perspective'] },
];

export const artById = Object.fromEntries(artworks.map(art => [art.id, art])) as Record<string, Artwork>;

export const clusters: Record<Cluster, { name: string; subject: string; color: string; root: string; x: number; y: number; labelX: number; labelY: number }> = {
  vangogh: { name: 'Vincent van Gogh', subject: 'Movement & brushwork', color: '#d6e8ad', root: 'starry', x: 575, y: 365, labelX: 455, labelY: 140 },
  monet: { name: 'Claude Monet', subject: 'Light & atmosphere', color: '#afa6de', root: 'lilies', x: 245, y: 535, labelX: 120, labelY: 365 },
  hokusai: { name: 'Katsushika Hokusai', subject: 'Rhythm & line', color: '#e5bd8e', root: 'wave', x: 835, y: 585, labelX: 765, labelY: 405 },
};

export const sampleNotes = [
  { id: 'note-mina', name: 'Mina L.', initials: 'ML', color: '#c4ceaa', title: 'Follow the direction, not the outline.', text: 'I kept copying the shape of each swirl. Things changed when I followed the direction of the strokes instead. The sky started to move.', likes: 28, artId: 'starry' },
  { id: 'note-kai', name: 'Kai R.', initials: 'KR', color: '#a6bbcf', title: 'The dark shapes hold the light.', text: 'My first study had too much yellow. Keeping the cypress and village almost black made the stars feel brighter without adding more paint.', likes: 19, artId: 'starry' },
  { id: 'note-jules', name: 'Jules A.', initials: 'JA', color: '#d7bfae', title: 'A smaller palette made me look closer.', text: 'I tried just three blues and one yellow. With fewer choices, I noticed how much of the movement comes from value and spacing.', likes: 13, artId: 'starry' },
];

const people = ['Mina L.', 'Kai R.', 'Jules A.', 'Noor S.', 'Alex T.', 'Sam W.'];

export function makeSeedGraph(): { nodes: AtlasNode[]; links: AtlasLink[] } {
  const nodes: AtlasNode[] = artworks.map(art => ({ id: art.id, kind: clusters[art.cluster].root === art.id ? 'artwork' : 'reference', cluster: art.cluster, title: art.title, artId: art.id, likes: art.id === 'starry' ? 42 : art.id === 'lilies' ? 34 : art.id === 'wave' ? 30 : 5 + artworks.indexOf(art) * 2 }));
  const links: AtlasLink[] = [];
  for (const [key, cluster] of Object.entries(clusters) as [Cluster, typeof clusters[Cluster]][]) {
    const refs = artworks.filter(art => art.cluster === key);
    for (const ref of refs) if (ref.id !== cluster.root) links.push({ source: cluster.root, target: ref.id, kind: 'reference' });
    const count = key === 'vangogh' ? 12 : key === 'monet' ? 8 : 6;
    for (let i = 0; i < count; i++) {
      const ref = refs[i % refs.length];
      const id = `${key}-study-${i}`;
      const person = (key === 'vangogh' || key === 'hokusai') && i === 2 ? 'Mina L.' : key === 'vangogh' && i === 3 ? 'Kai R.' : key === 'monet' && (i === 0 || i === 2) ? 'Jules A.' : people[i % people.length];
      nodes.push({ id, kind: 'study', cluster: key, title: ['Following the rhythm', 'A study in blue', 'Finding the light', 'Looking a little closer'][i % 4], artId: ref.id, person, likes: Math.max(2, 24 - i * 2), sample: true });
      links.push({ source: ref.id, target: id, kind: 'practice' });
      if (i % 2 === 0) {
        const noteId = `${key}-reflection-${i}`;
        const reflection = notesForArt(ref.id)[(i / 2) % 3];
        nodes.push({ id: noteId, kind: 'reflection', cluster: key, title: reflection.title, artId: ref.id, person, note: reflection.text, likes: 8 + i });
        links.push({ source: id, target: noteId, kind: 'reflection' });
      }
      if (i > 1) links.push({ source: `${key}-study-${i - 2}`, target: id, kind: 'practice' });
    }
  }
  nodes.push({ id: 'tutorial-brushwork', kind: 'tutorial', cluster: 'vangogh', title: 'Looking at directional brushwork', artId: 'starry', likes: 16, note: 'A demo lesson outline: notice stroke direction, make a small study, then compare how the eye moves through each version.' });
  links.push({ source: 'starry', target: 'tutorial-brushwork', kind: 'reference' });
  links.push({ source: 'cypresses', target: 'vangogh-study-0', kind: 'reference' });
  links.push({ source: 'cafe', target: 'vangogh-study-2', kind: 'reference' });
  links.push({ source: 'lilies', target: 'irises', kind: 'reference' });
  links.push({ source: 'wave', target: 'cypresses', kind: 'reference' });
  return { nodes, links };
}

export const seedGraph = makeSeedGraph();

export const learningPaths = [
  { id: 'mina', name: 'Mina L.', initials: 'ML', title: 'Learning to make the sky move', description: 'From observing rhythm to trying it by hand.', nodes: ['starry', 'cypresses', 'vangogh-study-0', 'vangogh-reflection-0', 'cafe', 'vangogh-study-2'], captions: ['Started with a question: how does the sky move?', 'Looked for rhythm in a different landscape.', 'Made a first directional brushwork study.', 'Noticed that direction mattered more than outlines.', 'Studied the balance of light against dark.', 'Tried again, with fewer colors and clearer movement.'] },
  { id: 'kai', name: 'Kai R.', initials: 'KR', title: 'Finding a quieter kind of contrast', description: 'A different route through the same starting point.', nodes: ['starry', 'cafe', 'vangogh-study-1', 'portrait', 'vangogh-study-3'], captions: ['Started from the same night sky.', 'Compared warm light and deep blue shadows.', 'Tried a small palette study.', 'Looked at the rhythm around a face.', 'Made a second study with a calmer palette.'] },
  { id: 'jules', name: 'Jules A.', initials: 'JA', title: 'A detour through color', description: 'An exploratory path, with a surprising reference.', nodes: ['starry', 'irises', 'lilies', 'monet-study-0', 'monet-reflection-0', 'monet-study-2'], captions: ['Began with Van Gogh’s sky.', 'Noticed the rhythm between blue and yellow.', 'Followed that question into Monet’s water.', 'Tried the same idea with softer edges.', 'Recorded a new observation about color.', 'Returned to practice with a different understanding.'] },
  { id: 'jules-light', name: 'Jules A.', initials: 'JA', title: 'Following the feeling of light', description: 'From a patch of color to a different way of seeing.', nodes: ['lilies', 'garden', 'monet-study-0', 'monet-reflection-0', 'sunrise', 'monet-study-2'], captions: ['Started by noticing light on the water.', 'Compared the same colors in a garden.', 'Made a small study with soft edges.', 'Recorded an observation about warm and cool colors.', 'Looked at how a few marks can hold an atmosphere.', 'Tried the idea again with a smaller palette.'] },
  { id: 'mina-line', name: 'Mina L.', initials: 'ML', title: 'Finding the rhythm between lines', description: 'A study of movement, spacing, and composition.', nodes: ['wave', 'bridge', 'hokusai-study-0', 'hokusai-reflection-0', 'fuji', 'hokusai-study-2'], captions: ['Started with the movement of the wave.', 'Looked for the same rhythm in an architectural shape.', 'Made a first study of repeated contours.', 'Noticed the spaces between marks.', 'Compared a quieter composition.', 'Tried a new balance of movement and stillness.'] },
];

// These explicit sequences are the demo learners' journeys, not graph shortest paths.
for (const path of learningPaths) {
  path.nodes.slice(1).forEach((id, i) => {
    const source = path.nodes[i];
    if (!seedGraph.links.some(link => link.source === source && link.target === id)) {
      seedGraph.links.push({ source, target: id, kind: 'reference' });
    }
  });
}

export function notesForArt(artId: string) {
  if (artId === 'starry') return sampleNotes;
  const cluster = artById[artId]?.cluster;
  const content = cluster === 'monet' ? [
    ['Look for color before naming the object.', 'I stopped thinking “leaf” or “water” and tried to notice warm and cool patches. That made the relationships between colors much easier to see.'],
    ['Soft edges need a few firm ones.', 'My first version was soft everywhere. Keeping just a few edges clear gave the rest of the painting more room to breathe.'],
    ['A quick study helped me notice the light.', 'I tried the same small patch twice, with a different light color each time. Comparing them taught me more than polishing one version.'],
  ] : cluster === 'hokusai' ? [
    ['The space between lines has a rhythm.', 'I first concentrated on each contour. Then I noticed the spaces between the lines, and my next study felt much less crowded.'],
    ['Try the composition in two values.', 'Reducing the image to light and dark shapes helped me understand where my attention was going before I added detail.'],
    ['Repeat a mark, then change it.', 'Making similar marks with slightly different spacing helped me see how a small change can suggest movement.'],
  ] : [
    ['Follow the direction, not just the outline.', 'I tried to notice which way each group of marks was pointing. Copying the direction gave me a clearer question for my next attempt.'],
    ['Start with the large light and dark shapes.', 'I began with detail and lost the overall balance. A second, smaller study helped me see the larger relationships first.'],
    ['Fewer colors helped me compare.', 'Using a small palette made it easier to notice where my version differed. I could change one relationship at a time.'],
  ];
  return sampleNotes.map((note, i) => ({ ...note, id: `${artId}-${note.id}`, artId, title: content[i][0], text: content[i][1] }));
}

export function initialSession(): Session {
  return { started: false, paused: false, artist: 'vangogh', goal: 'How can brushwork make a painting feel alive?', captures: [], practice: null };
}
