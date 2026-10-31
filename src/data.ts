export type Platform = 'Pinterest' | 'Instagram';
export type Cluster = 'kungfu' | 'zootopia' | 'vangogh' | 'monet';
export type NodeKind = 'artwork' | 'reference' | 'study' | 'reflection' | 'tutorial';

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  image: string;
  cluster: Cluster;
  year: string;
  tags: string[];
  collection: string;
  credit: string;
  sourceUrl: string;
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
  input?: Capture | null;
  started: boolean;
  paused: boolean;
  artist: Cluster;
  goal: string;
  captures: Capture[];
  practice: Practice | null;
}

export const artworks: Artwork[] = [
  {
    "id": "kfp-goal",
    "title": "Misty Coast",
    "artist": "Felicia Chen",
    "image": "/art/concept/kungfu-0000.jpg",
    "cluster": "kungfu",
    "year": "2024",
    "tags": [
      "shape",
      "light",
      "depth",
      "atmosphere",
      "landscape"
    ],
    "collection": "Kung Fu Panda 4",
    "credit": "Felicia Chen · DreamWorks Animation",
    "sourceUrl": "https://felicia-chen.com/kungfupanda4"
  },
  {
    "id": "kfp-shapes",
    "title": "Mountain Shape Studies",
    "artist": "Felicia Chen",
    "image": "/art/concept/kungfu-mtn.jpg",
    "cluster": "kungfu",
    "year": "2024",
    "tags": [
      "shape",
      "silhouette",
      "mountain",
      "composition"
    ],
    "collection": "Kung Fu Panda 4",
    "credit": "Felicia Chen · DreamWorks Animation",
    "sourceUrl": "https://felicia-chen.com/kungfupanda4"
  },
  {
    "id": "kfp-light",
    "title": "Sunlit Harbor Chase",
    "artist": "Felicia Chen",
    "image": "/art/concept/kungfu-dockchase.jpg",
    "cluster": "kungfu",
    "year": "2024",
    "tags": [
      "light",
      "color",
      "warm",
      "cool",
      "composition"
    ],
    "collection": "Kung Fu Panda 4",
    "credit": "Felicia Chen · DreamWorks Animation",
    "sourceUrl": "https://felicia-chen.com/kungfupanda4"
  },
  {
    "id": "kfp-atmosphere",
    "title": "Tavern in Warm Backlight",
    "artist": "Felicia Chen",
    "image": "/art/concept/kungfu-tavernaftermath.jpg",
    "cluster": "kungfu",
    "year": "2024",
    "tags": [
      "atmosphere",
      "light",
      "silhouette",
      "depth"
    ],
    "collection": "Kung Fu Panda 4",
    "credit": "Felicia Chen · DreamWorks Animation",
    "sourceUrl": "https://felicia-chen.com/kungfupanda4"
  },
  {
    "id": "kfp-action",
    "title": "Tavern Action Composition",
    "artist": "Felicia Chen",
    "image": "/art/concept/kungfu-tavernfight.jpg",
    "cluster": "kungfu",
    "year": "2024",
    "tags": [
      "composition",
      "action",
      "color",
      "contrast"
    ],
    "collection": "Kung Fu Panda 4",
    "credit": "Felicia Chen · DreamWorks Animation",
    "sourceUrl": "https://felicia-chen.com/kungfupanda4"
  },
  {
    "id": "kfp-outpost",
    "title": "Cliffside Color Key",
    "artist": "Felicia Chen",
    "image": "/art/concept/kungfu-outpost.jpg",
    "cluster": "kungfu",
    "year": "2024",
    "tags": [
      "landscape",
      "light",
      "shape",
      "depth"
    ],
    "collection": "Kung Fu Panda 4",
    "credit": "Felicia Chen · DreamWorks Animation",
    "sourceUrl": "https://felicia-chen.com/kungfupanda4"
  },
  {
    "id": "zoo-city",
    "title": "City in Layers",
    "artist": "Walt Disney Animation Studios",
    "image": "/art/concept/zootopia-city.jpg",
    "cluster": "zootopia",
    "year": "2016",
    "tags": [
      "composition",
      "light",
      "color",
      "depth",
      "environment"
    ],
    "collection": "Zootopia",
    "credit": "© Disney",
    "sourceUrl": "https://www.disneyanimation.com/process/visual-development/"
  },
  {
    "id": "zoo-light",
    "title": "Station in Warm Light",
    "artist": "Matthias Lechner",
    "image": "/art/concept/zootopia-station-light.jpg",
    "cluster": "zootopia",
    "year": "2016",
    "tags": [
      "composition",
      "light",
      "color",
      "depth",
      "environment"
    ],
    "collection": "Zootopia",
    "credit": "© Disney · Matthias Lechner",
    "sourceUrl": "https://www.matthiaslechner.com/zootopia.html"
  },
  {
    "id": "zoo-atmosphere",
    "title": "Tundra Town",
    "artist": "Walt Disney Animation Studios",
    "image": "/art/concept/zootopia-tundra-town.jpg",
    "cluster": "zootopia",
    "year": "2016",
    "tags": [
      "composition",
      "light",
      "color",
      "depth",
      "environment"
    ],
    "collection": "Zootopia",
    "credit": "© Disney",
    "sourceUrl": "https://www.disneyanimation.com/process/visual-development/"
  },
  {
    "id": "starry",
    "title": "The Starry Night",
    "artist": "Vincent van Gogh",
    "image": "/art/vangogh-starry.jpg",
    "cluster": "vangogh",
    "year": "1889",
    "tags": [
      "movement",
      "night",
      "brushwork",
      "color"
    ],
    "collection": "Van Gogh",
    "credit": "Vincent van Gogh · Public domain",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"
  },
  {
    "id": "cypresses",
    "title": "Wheat Field with Cypresses",
    "artist": "Vincent van Gogh",
    "image": "/art/vangogh-cypresses.jpg",
    "cluster": "vangogh",
    "year": "1889",
    "tags": [
      "movement",
      "brushwork",
      "landscape"
    ],
    "collection": "Van Gogh",
    "credit": "Vincent van Gogh · Public domain",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Wheat_Field_with_Cypresses_-_Google_Art_Project.jpg"
  },
  {
    "id": "cafe",
    "title": "Café Terrace at Night",
    "artist": "Vincent van Gogh",
    "image": "/art/vangogh-cafe.jpg",
    "cluster": "vangogh",
    "year": "1888",
    "tags": [
      "night",
      "color",
      "light",
      "contrast"
    ],
    "collection": "Van Gogh",
    "credit": "Vincent van Gogh · Public domain",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Terrasse_des_Caf%C3%A9s_an_der_Place_du_Forum_in_Arles_am_Abend1.jpeg"
  },
  {
    "id": "lilies",
    "title": "Water Lilies",
    "artist": "Claude Monet",
    "image": "/art/monet-lilies.jpg",
    "cluster": "monet",
    "year": "1922",
    "tags": [
      "light",
      "water",
      "color",
      "reflection"
    ],
    "collection": "Monet",
    "credit": "Claude Monet · Public domain",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg"
  },
  {
    "id": "sunrise",
    "title": "Impression, Sunrise",
    "artist": "Claude Monet",
    "image": "/art/monet-sunrise.jpg",
    "cluster": "monet",
    "year": "1872",
    "tags": [
      "light",
      "water",
      "atmosphere",
      "color"
    ],
    "collection": "Monet",
    "credit": "Claude Monet · Public domain",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Claude_Monet,_Impression,_soleil_levant.jpg"
  },
  {
    "id": "garden",
    "title": "The Artist’s Garden at Giverny",
    "artist": "Claude Monet",
    "image": "/art/monet-garden.jpg",
    "cluster": "monet",
    "year": "1900",
    "tags": [
      "light",
      "color",
      "flowers"
    ],
    "collection": "Monet",
    "credit": "Claude Monet · Public domain",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Claude_Monet_The_Artist%27s_Garden_at_Giverny.jpg"
  }
];

export const artById = Object.fromEntries(artworks.map(art => [art.id, art])) as Record<string, Artwork>;

export const clusters: Record<Cluster, { name: string; profileTitle: string; account: string; description: string; subject: string; color: string; root: string; x: number; y: number; labelX: number; labelY: number }> = {
  "kungfu": {
    "name": "Kung Fu Panda",
    "profileTitle": "Felicia Chen",
    "account": "felicia.chen",
    "description": "Kung Fu Panda 4 · Visual development & environment design",
    "subject": "Shape, light & atmosphere",
    "color": "#e5ca9c",
    "root": "kfp-goal",
    "x": 430,
    "y": 330,
    "labelX": 285,
    "labelY": 105
  },
  "zootopia": {
    "name": "Zootopia",
    "profileTitle": "Zootopia · Concept art",
    "account": "zootopia.visdev",
    "description": "Zootopia · World-building, composition & color",
    "subject": "Worlds, scale & composition",
    "color": "#a9ceca",
    "root": "zoo-city",
    "x": 825,
    "y": 485,
    "labelX": 735,
    "labelY": 280
  },
  "vangogh": {
    "name": "Vincent van Gogh",
    "profileTitle": "Vincent van Gogh",
    "account": "vincent.vangogh",
    "description": "Paintings, details, and ways of seeing",
    "subject": "Movement & brushwork",
    "color": "#d6e8ad",
    "root": "starry",
    "x": 180,
    "y": 590,
    "labelX": 55,
    "labelY": 390
  },
  "monet": {
    "name": "Claude Monet",
    "profileTitle": "Claude Monet",
    "account": "claude.monet",
    "description": "Paintings, light, and color relationships",
    "subject": "Light & atmosphere",
    "color": "#afa6de",
    "root": "lilies",
    "x": 555,
    "y": 700,
    "labelX": 440,
    "labelY": 520
  }
};

export const sampleNotes = [
  { id: 'note-mina', name: 'Mina L.', initials: 'ML', color: '#c4ceaa', title: 'Three big shapes before any detail.', text: 'I kept copying the tiny rocks. When I reduced the scene to foreground, middle ground, and distance, I understood why the space felt so deep.', likes: 28, artId: 'kfp-goal' },
  { id: 'note-kai', name: 'Kai R.', initials: 'KR', color: '#a6bbcf', title: 'A little warm light can carry the scene.', text: 'I made every part equally bright. Keeping most of the scene cool and quiet made the small warm lights feel much more intentional.', likes: 19, artId: 'kfp-goal' },
  { id: 'note-jules', name: 'Jules A.', initials: 'JA', color: '#d7bfae', title: 'A different world can answer the same question.', text: 'I compared a Zootopia environment with this landscape. Both used overlapping shapes to lead my eye, even though the buildings and colors were completely different.', likes: 13, artId: 'kfp-goal' },
];

export function notesForArt(artId: string) {
  const cluster = artById[artId]?.cluster;
  const content = cluster === 'zootopia' ? [
    ['Follow the path through the city.', 'I blocked the road and the largest buildings first. That helped me see the route my eye took before I added windows or characters.'],
    ['Warm and cool colors organize the space.', 'My first study used too many colors at the same strength. Separating warm light from cool shadows made the depth much clearer.'],
    ['Scale is a choice, not just a measurement.', 'Comparing the animals with the surrounding shapes helped me understand how the environment can make a character feel small, safe, or overwhelmed.'],
  ] : cluster === 'monet' ? [
    ['Look for color before naming the object.', 'I stopped naming the leaves and water and looked for warm and cool patches. The color relationships became easier to see.'],
    ['Soft edges need a few firm ones.', 'My first version was soft everywhere. Keeping a few edges clear gave the rest more room to breathe.'],
    ['A quick study helped me notice the light.', 'Trying the same small patch twice taught me more than polishing one version.'],
  ] : cluster === 'vangogh' ? [
    ['Follow the direction, not just the outline.', 'I noticed which way each group of marks was pointing. Copying the direction gave me a clearer question for the next attempt.'],
    ['Start with the large light and dark shapes.', 'I began with detail and lost the balance. A smaller study helped me see the larger relationships first.'],
    ['Fewer colors helped me compare.', 'Using a small palette made it easier to notice where my version differed.'],
  ] : sampleNotes.map(note => [note.title, note.text]);
  return sampleNotes.map((note, i) => ({ ...note, id: `${artId}-${note.id}`, artId, title: content[i][0], text: content[i][1] }));
}

const people = ['Mina L.', 'Kai R.', 'Jules A.', 'Noor S.', 'Alex T.', 'Sam W.'];

export function makeSeedGraph(): { nodes: AtlasNode[]; links: AtlasLink[] } {
  const nodes: AtlasNode[] = artworks.map(art => ({ id: art.id, kind: clusters[art.cluster].root === art.id ? 'artwork' : 'reference', cluster: art.cluster, title: art.title, artId: art.id, likes: art.id === 'kfp-goal' ? 48 : art.id === 'zoo-city' ? 37 : 8 + artworks.indexOf(art) * 2 }));
  const links: AtlasLink[] = [];
  for (const [key, cluster] of Object.entries(clusters) as [Cluster, typeof clusters[Cluster]][]) {
    const refs = artworks.filter(art => art.cluster === key);
    for (const ref of refs) if (ref.id !== cluster.root) links.push({ source: cluster.root, target: ref.id, kind: 'reference' });
    const count = key === 'kungfu' ? 12 : key === 'zootopia' ? 8 : 6;
    const lead = key === 'zootopia' || key === 'monet' ? 'Jules A.' : 'Mina L.';
    for (let i = 0; i < count; i++) {
      const ref = refs[i % refs.length];
      const id = `${key}-study-${i}`;
      const person = i === 0 || i === 2 ? lead : i === 1 || i === 3 ? 'Kai R.' : people[i % people.length];
      const titles = key === 'kungfu' ? ['Blocking the big shapes', 'A warm & cool study', 'A world with depth', 'A quieter balance'] : key === 'zootopia' ? ['A city in three layers', 'A study of warm light', 'Finding a way through', 'A new sense of scale'] : ['Following the rhythm', 'A study in color', 'Finding the light', 'Looking a little closer'];
      nodes.push({ id, kind: 'study', cluster: key, title: titles[i % 4], artId: ref.id, person, likes: Math.max(2, 26 - i * 2), sample: true });
      links.push({ source: ref.id, target: id, kind: 'practice' });
      if (i % 2 === 0) {
        const reflection = notesForArt(ref.id)[(i / 2) % 3];
        const noteId = `${key}-reflection-${i}`;
        nodes.push({ id: noteId, kind: 'reflection', cluster: key, title: reflection.title, artId: ref.id, person, note: reflection.text, likes: 8 + i });
        links.push({ source: id, target: noteId, kind: 'reflection' });
      }
      if (i > 1) links.push({ source: `${key}-study-${i - 2}`, target: id, kind: 'practice' });
    }
  }
  nodes.push({ id: 'tutorial-shapes', kind: 'tutorial', cluster: 'kungfu', title: 'Seeing a world in three value groups', artId: 'kfp-goal', likes: 18, note: 'A demo lesson outline: identify three large value groups, make a small study, and compare how your shapes guide the eye.' });
  links.push({ source: 'kfp-goal', target: 'tutorial-shapes', kind: 'reference' });
  links.push({ source: 'kfp-atmosphere', target: 'zoo-city', kind: 'reference' });
  links.push({ source: 'zoo-atmosphere', target: 'lilies', kind: 'reference' });
  links.push({ source: 'starry', target: 'kfp-light', kind: 'reference' });
  return { nodes, links };
}

export const seedGraph = makeSeedGraph();

export const learningPaths = [
  { id: 'mina-world', name: 'Mina L.', initials: 'ML', title: 'Making a world feel deep', description: 'From a Kung Fu Panda landscape to a study of shape and light.', nodes: ['kfp-goal', 'kfp-shapes', 'kungfu-study-0', 'kungfu-reflection-0', 'kfp-light', 'kungfu-study-2'], captions: ['Started with a question: what makes this world feel deep?', 'Looked at how the artist simplified mountain shapes.', 'Tried a first study using three large value groups.', 'Noticed that spatial layers mattered more than tiny details.', 'Compared warm light against cool surrounding shapes.', 'Tried again, with a clearer focal point and quieter distance.'] },
  { id: 'jules-worlds', name: 'Jules A.', initials: 'JA', title: 'A detour from mountains to a city', description: 'Following the same question through Kung Fu Panda and Zootopia.', nodes: ['kfp-goal', 'kfp-atmosphere', 'zoo-city', 'zootopia-study-0', 'zootopia-reflection-0', 'zoo-light', 'zootopia-study-2'], captions: ['Began with the layered shapes in a Kung Fu Panda environment.', 'Compared another setting with strong foreground silhouettes.', 'Found a Zootopia city using a similar route for the eye.', 'Tried blocking the city into simple spatial layers.', 'Noticed how the largest shapes lead attention.', 'Compared the way a station frames a small character.', 'Returned to practice with a new understanding of depth and scale.'] },
  { id: 'kai-color', name: 'Kai R.', initials: 'KR', title: 'Letting a small light lead', description: 'Another route through the same starting artwork.', nodes: ['kfp-goal', 'kfp-light', 'kungfu-study-1', 'kfp-atmosphere', 'kungfu-study-3'], captions: ['Started from the same misty coast.', 'Looked for warm and cool relationships in the harbor.', 'Made a small color study.', 'Compared the warm backlight in a different environment.', 'Tried a second study with a quieter palette.'] },
  { id: 'jules-city', name: 'Jules A.', initials: 'JA', title: 'Finding a path through the city', description: 'Architecture, warm light, and a sense of scale.', nodes: ['zoo-city', 'zoo-light', 'zootopia-study-0', 'zootopia-reflection-0', 'zoo-atmosphere', 'zootopia-study-2'], captions: ['Started by noticing the curving route through the city.', 'Compared a framed architectural interior.', 'Blocked a first study with a few large shapes.', 'Recorded an observation about visual direction.', 'Looked at cool atmosphere and small warm lights.', 'Tried the idea again in another setting.'] },
  { id: 'mina-paint', name: 'Mina L.', initials: 'ML', title: 'Following a painted rhythm', description: 'A quieter branch through traditional painting.', nodes: ['starry', 'cypresses', 'vangogh-study-0', 'vangogh-reflection-0', 'cafe', 'vangogh-study-2'], captions: ['Started from a night sky.', 'Compared directional marks in a landscape.', 'Made a small study.', 'Recorded a first observation.', 'Compared the balance of warm and cool light.', 'Tried a more deliberate arrangement of marks.'] },
  { id: 'jules-light', name: 'Jules A.', initials: 'JA', title: 'Following the feeling of light', description: 'A different way of seeing color relationships.', nodes: ['lilies', 'garden', 'monet-study-0', 'monet-reflection-0', 'sunrise', 'monet-study-2'], captions: ['Noticed light on the water.', 'Compared similar colors in a garden.', 'Tried a first color study.', 'Recorded what changed between attempts.', 'Looked at atmosphere made with a few marks.', 'Returned to practice with a smaller palette.'] },
];

// Explicit illustrative learning histories, never a generated graph shortest path.
for (const path of learningPaths) {
  path.nodes.slice(1).forEach((id, i) => {
    const source = path.nodes[i];
    if (!seedGraph.links.some(link => link.source === source && link.target === id)) seedGraph.links.push({ source, target: id, kind: 'reference' });
  });
}

export function initialSession(): Session {
  return { started: false, paused: false, input: null, artist: 'kungfu', goal: 'How do shape and light make a world feel alive?', captures: [], practice: null };
}
