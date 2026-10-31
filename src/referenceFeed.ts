import { artworks, clusters } from './data';
import type { Artwork, Platform } from './data';

// Shuffle once, deterministically: each app feels mixed while returning to an
// app preserves the references and scroll position the learner was looking at.
function rank(value: string) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function buildFeed(platform: Platform): Artwork[] {
  const groups = Object.keys(clusters)
    .filter(key => platform !== 'Instagram' || clusters[key as keyof typeof clusters].showOnInstagram !== false)
    .sort((a, b) => rank(platform + a) - rank(platform + b))
    .map(key => artworks.filter(art => art.cluster === key).sort((a, b) => rank(platform + a.id) - rank(platform + b.id)));
  return Array.from({ length: Math.max(...groups.map(group => group.length)) }, (_, index) =>
    groups.flatMap(group => group[index] ? [group[index]] : [])).flat();
}

export const referenceFeeds = { Instagram: buildFeed('Instagram'), Pinterest: buildFeed('Pinterest') };
