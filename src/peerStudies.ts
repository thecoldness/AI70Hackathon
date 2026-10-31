export const owlReferenceId = 'library-kungfu-library-e88388dad130';

// Supplied images; the learners and their histories are illustrative demo data.
// artId is the original studied, never a collection or a neighboring reference.
export const owlStudies = [
  { id: 'owl-study-mina-gesture', artId: owlReferenceId, image: '/studies/owl/gesture.png', title: 'Gesture and wing rhythm', person: 'Mina L.', text: 'I followed the curve through the body and wings before drawing feathers. The gesture kept the pose alive while I simplified the details.', likes: 32, provenance: 'User-supplied study image · illustrative learner' },
  { id: 'owl-study-kai-contour', artId: owlReferenceId, image: '/studies/owl/contour.png', title: 'Contour and feather groups', person: 'Kai R.', text: 'I compared the outer contour and grouped the feathers into a few large shapes. The head and body still need another proportion check.', likes: 25, provenance: 'User-supplied study image · illustrative learner' },
  { id: 'owl-study-noor-memory', artId: owlReferenceId, image: '/studies/owl/memory.png', title: 'A blue-line memory study', person: 'Noor S.', text: 'I looked away and drew the largest shapes in blue. Comparing this attempt with the reference showed me which proportions I had remembered and which I had invented.', likes: 21, provenance: 'User-supplied study image · illustrative learner' },
];

export const owlInsights = [
  { id: 'owl-insight-gesture', person: 'Mina L.', title: 'One gesture connects both wings.', text: 'I traced the long movement from one wing tip through the body to the other wing before adding small marks.', likes: 20 },
  { id: 'owl-insight-silhouette', person: 'Kai R.', title: 'The outline must read before the feathers.', text: 'Reducing the owl to a flat shape helped me compare the wing span, body width, and tilt of the head.', likes: 18 },
  { id: 'owl-insight-memory', person: 'Noor S.', title: 'Draw, then compare what you remembered.', text: 'I planned a short drawing from memory to test the large shapes. The comparison would give my next attempt a specific question.', likes: 16 },
];

export const owlLearningPaths = [
  { id: 'mina-owl-gesture', name: 'Mina L.', initials: 'ML', title: 'Gesture before feathers', description: 'Follow the movement of the owl, compare a gesture reference, and try a flowing wing study.', nodes: [owlReferenceId, 'library-gesture-1c6f6e752bff', 'owl-insight-gesture', 'owl-study-mina-gesture'], captions: ['Started with the owl reference and a question about its sweeping wings.', 'Compared a gesture reference to look for a continuous line of action.', 'Noticed how one movement connects the wings and body.', 'Tried that idea in a new study of the same owl.'] },
  { id: 'kai-owl-silhouette', name: 'Kai R.', initials: 'KR', title: 'A readable silhouette', description: 'Use silhouette and shape-language references to simplify the owl into a clear contour.', nodes: [owlReferenceId, 'library-silhouette-5bcf8df50996', 'library-shape-language-8257f92854b4', 'owl-insight-silhouette', 'owl-study-kai-contour'], captions: ['Started from the same owl, looking at the outside shape.', 'Compared how simple silhouettes communicate a character.', 'Looked for large shape relationships before surface details.', 'Recorded a question about the head, body, and wing proportions.', 'Made a contour study of the original owl to test those relationships.'] },
  { id: 'noor-owl-memory', name: 'Noor S.', initials: 'NS', title: 'Remember the big shapes', description: 'Notice the essential proportions, draw from memory, and compare the result with the original.', nodes: [owlReferenceId, 'library-shape-language-d7476c6f2964', 'owl-insight-memory', 'owl-study-noor-memory'], captions: ['Chose the owl as a reference to understand, rather than just reproduce.', 'Compared a shape-language sheet to identify the largest masses.', 'Planned a short memory drawing and a later proportion check.', 'Made a blue-line study; its differences suggest what to observe next.'] },
];

export function isPeerStudy(node: { kind: string; person?: string }) {
  return node.kind === 'study' && node.person !== 'You';
}
