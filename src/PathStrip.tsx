import { ChevronRight } from 'lucide-react';
import { artById } from './data';

/** A compact thumbnail strip of one learning path: goal → references → the study it led to. */
export function PathStrip({ artIds, study, studyTitle }: { artIds: string[]; study?: string; studyTitle?: string }) {
  return (
    <ol className="path-strip">
      {artIds.map((id, i) => (
        <li key={id}>
          {i > 0 && <ChevronRight size={12} className="ps-arrow" />}
          <figure title={artById[id].title}>
            <img src={artById[id].thumb || artById[id].image} alt="" />
            {i === 0 && <span className="ps-tag">Goal</span>}
          </figure>
        </li>
      ))}
      {study && (
        <li>
          <ChevronRight size={12} className="ps-arrow" />
          <figure className="ps-study" title={studyTitle}>
            <img src={study} alt="" />
            <span className="ps-tag">Your study</span>
          </figure>
        </li>
      )}
    </ol>
  );
}
