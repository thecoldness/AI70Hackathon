import { communityFeatures, featureForId } from './learning';
import type { AtlasNode } from './data';
import { isPeerStudy } from './peerStudies';

export const previewsPerGroup = 3;

export function overviewPreviewIds(nodes: AtlasNode[]): Set<string> {
  const previews = new Set<string>();
  for (const [key, group] of Object.entries(communityFeatures)) {
    const candidates = nodes.filter(node => featureForId(node.artId) === key && node.kind !== 'reflection' && !isPeerStudy(node));
    const root = candidates.find(node => node.id === group.root);
    const picked = [root].filter((node): node is AtlasNode => !!node);
    const ranked = candidates.filter(node => !picked.includes(node)).sort((a, b) => b.likes - a.likes || a.id.localeCompare(b.id));
    // Prefer a different image for each preview before filling any open slots.
    for (const node of ranked) {
      if (picked.length >= previewsPerGroup) break;
      if (!picked.some(item => item.artId === node.artId)) picked.push(node);
    }
    for (const node of picked.slice(0, previewsPerGroup)) previews.add(node.id);
  }
  return previews;
}
