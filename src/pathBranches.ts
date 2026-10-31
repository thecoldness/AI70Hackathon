import { learningPaths } from './data';

export type PathBranch = typeof learningPaths[number] & { index: number; endId: string };
export const pathColors = ['#d7edaa', '#b5d9f2', '#ecc58f', '#d3b6e8'];

// A node starts only the remaining part of a recorded history. Image ownership
// and graph proximity never create a new learning route.
export function pathsStartingAt(nodeId: string): PathBranch[] {
  return learningPaths.flatMap((path, index) => {
    const from = path.nodes.indexOf(nodeId);
    if (from < 0 || from === path.nodes.length - 1) return [];
    return [{ ...path, index, nodes: path.nodes.slice(from), captions: path.captions.slice(from), endId: path.nodes[path.nodes.length - 1] }];
  });
}
