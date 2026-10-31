// Generated from the user-supplied reference zip (10 folders, 495 images).
// Images were resized to ≤1280px JPEG under public/art/library/<collection>/<nn>.jpg.
// No titles or sources came with them, so each is numbered and credited as a user-supplied reference.
import type { Artwork } from './data';

export type LibraryCluster = 'mucha' | 'schiele' | 'klimt' | 'gesture' | 'klaus' | 'kfpdev' | 'shapelang' | 'silhouette' | 'spiderverse' | 'wolfwalkers';

/** Which learning-theme cluster each collection belongs to in the Community atlas. */
export type LibraryFeature = 'line' | 'shape' | 'graphic';
export const libraryFeature: Record<LibraryCluster, LibraryFeature> = {
  mucha: 'line', schiele: 'line', klimt: 'line', gesture: 'line',
  shapelang: 'shape', silhouette: 'shape', kfpdev: 'shape',
  spiderverse: 'graphic', wolfwalkers: 'graphic', klaus: 'graphic',
};
/** The two or three images that stand for each new theme cluster in the atlas; everything else draws as a dot. */
export const libraryHighlights: Record<LibraryFeature, string[]> = {
  line: ['schiele-01', 'mucha-01', 'gesture-01'],
  shape: ['shapelang-01', 'silhouette-01', 'kfpdev-01'],
  graphic: ['spiderverse-01', 'wolfwalkers-01', 'klaus-01'],
};
/** The image each new theme cluster is anchored on. */
export const libraryFeatureRoots: Record<LibraryFeature, string> = { line: 'schiele-01', shape: 'shapelang-01', graphic: 'spiderverse-01' };

interface LibraryCollection { name: string; artist: string; collection: string; account: string; description: string; tags: string[]; sizes: [number, number][] }

export const libraryCollections: Record<LibraryCluster, LibraryCollection> = {
  mucha: { name: "Alphonse Mucha", artist: "Alphonse Mucha", collection: "Art Nouveau", account: "alphonse.mucha", description: "Posters, ornament & the flowing figure", tags: ["line", "ornament", "pattern", "character", "composition"], sizes: [[720, 1280], [528, 1280], [720, 1280], [675, 1200], [538, 1280], [446, 1024], [964, 1280], [239, 600], [518, 1280], [475, 1034], [440, 1008], [698, 1280], [576, 1024], [349, 800], [605, 950], [763, 1280], [549, 1280], [518, 1280], [500, 750], [450, 835], [554, 1136], [500, 867], [900, 1280], [524, 1280], [720, 1280], [666, 1280], [853, 1280], [717, 1280], [711, 1000], [525, 1280], [534, 1280], [420, 1024], [625, 1200], [882, 1280], [512, 1280], [328, 557], [857, 1200], [781, 1280], [673, 1280], [440, 1008], [720, 1280], [637, 1023], [500, 974], [889, 1280], [535, 1280]] },
  schiele: { name: "Egon Schiele", artist: "Egon Schiele", collection: "Figure & line", account: "egon.schiele", description: "Angular line, gesture & expression", tags: ["line", "gesture", "expression", "character", "figure"], sizes: [[731, 1280], [771, 1080], [800, 1258], [540, 324], [750, 932], [519, 799], [960, 960], [474, 752], [422, 700], [700, 1207], [319, 500], [853, 1280], [640, 926], [777, 1036], [1021, 1280], [870, 1280], [961, 1280], [883, 1280], [736, 551], [515, 807], [512, 680], [736, 977], [1080, 1080], [720, 1280], [1280, 669], [527, 800], [1065, 1280], [640, 1212], [806, 1200], [736, 1080], [500, 749], [520, 750], [900, 1200], [647, 960], [360, 514], [564, 791], [592, 1280], [1028, 1280], [474, 638], [737, 1024], [500, 687]] },
  klimt: { name: "Gustav Klimt", artist: "Gustav Klimt", collection: "Drawings", account: "gustav.klimt", description: "Figure drawings and quiet contour", tags: ["line", "figure", "gesture", "expression", "character"], sizes: [[894, 1280], [803, 1280], [309, 741], [979, 1280], [720, 1280], [526, 765], [601, 960], [668, 1000], [800, 1220], [900, 1200], [527, 800], [994, 1280], [455, 632], [736, 1111], [631, 948], [530, 778], [795, 1200], [748, 1280], [500, 762], [864, 1232], [848, 1264], [720, 1109], [822, 1280], [735, 1172], [800, 1208], [736, 1021], [648, 1000], [1000, 600], [690, 1280], [525, 810], [714, 1106], [503, 720], [615, 960], [291, 500], [751, 1280], [497, 756], [1021, 1280], [328, 512], [1080, 1280], [320, 437], [853, 1280], [461, 600], [390, 600], [780, 1000], [526, 765]] },
  gesture: { name: "Gesture Drawing", artist: "Various artists", collection: "Gesture Drawing", account: "gesture.daily", description: "Poses, rhythm & line of action", tags: ["gesture", "figure", "line", "action", "character"], sizes: [[720, 1280], [500, 667], [818, 1280], [433, 649], [600, 900], [800, 1280], [474, 646], [749, 1000], [720, 1280], [835, 1280], [492, 849], [960, 1280], [450, 584], [651, 1228], [1280, 1160], [853, 1280], [853, 1280], [605, 1062], [784, 1168], [540, 960], [960, 1280], [756, 1280], [848, 1264], [662, 1280], [897, 1200], [594, 985], [770, 1208], [730, 1095], [342, 692], [639, 725], [736, 881], [661, 1280], [229, 500], [789, 1200], [675, 1200], [915, 1280], [640, 966], [806, 1280], [674, 1047], [600, 900], [373, 552], [562, 1280], [947, 1280], [736, 1200], [720, 1280], [592, 800]] },
  klaus: { name: "Klaus", artist: "SPA Studios artists", collection: "Klaus", account: "klaus.visdev", description: "Klaus \u00b7 Lighting, colour & character", tags: ["light", "atmosphere", "color", "character", "depth"], sizes: [[1000, 582], [768, 291], [642, 740], [540, 320], [640, 320], [1200, 674], [956, 515], [1000, 1125], [1000, 544], [736, 981], [1200, 699], [768, 497], [1280, 747], [736, 1104], [1024, 664], [800, 496], [1280, 829], [1280, 692], [480, 720], [1000, 598], [1280, 699], [1200, 674], [854, 480], [1229, 1280], [655, 468], [1280, 720], [1132, 712], [520, 1200], [905, 1280], [800, 457], [960, 505], [1000, 512], [640, 360], [1200, 674], [1280, 802], [600, 338], [720, 1280], [1088, 1280], [1280, 670], [600, 1004], [1280, 692], [728, 1092], [1280, 1280], [740, 1280], [735, 414], [720, 1280], [1200, 690], [1024, 663], [1280, 829], [1280, 694]] },
  kfpdev: { name: "Kung Fu Panda \u00b7 Character", artist: "DreamWorks Animation artists", collection: "Kung Fu Panda", account: "kfp.character", description: "Kung Fu Panda \u00b7 Character development sheets", tags: ["character", "shape", "expression", "gesture"], sizes: [[1000, 1068], [1280, 828], [500, 319], [688, 1223], [735, 976], [1022, 1125], [896, 1280], [735, 1033], [825, 969], [941, 1280], [596, 842], [984, 651], [905, 1280], [675, 1200], [852, 1280], [1023, 662], [596, 842], [753, 1062], [905, 1280], [400, 314], [1200, 675], [1280, 824], [564, 870], [900, 662], [766, 567], [820, 1280], [905, 1280], [974, 952], [1000, 813], [830, 438], [1266, 1280], [720, 1076], [999, 1280], [640, 429], [1280, 960], [750, 906], [719, 984], [559, 361], [1280, 761], [725, 907], [1280, 717], [1264, 820], [736, 552], [657, 432], [1280, 720], [1280, 1005], [576, 388], [500, 323], [1280, 831], [736, 412], [491, 500], [1280, 912], [1197, 629], [630, 513], [1280, 846], [1027, 441], [549, 1006], [365, 237], [735, 408], [1280, 815], [587, 1280], [1280, 900], [1050, 1280], [980, 445], [905, 1280], [1280, 826], [735, 290], [486, 1280], [720, 1280], [500, 323]] },
  shapelang: { name: "Shape Language", artist: "Various artists", collection: "Shape Language", account: "shape.language", description: "Character design through basic shapes", tags: ["shape", "character", "silhouette", "expression"], sizes: [[1080, 1080], [1177, 1280], [1027, 1280], [1011, 1280], [1200, 1200], [628, 1049], [1080, 1080], [1280, 859], [736, 1117], [684, 893], [736, 736], [681, 834], [992, 1280], [735, 1280], [937, 939], [736, 715], [576, 1280], [537, 1280], [764, 1280], [608, 1280], [730, 569], [1032, 1280], [1000, 1050], [902, 1280], [705, 931], [1026, 1280], [984, 1280], [685, 1280], [1000, 1000], [351, 358], [736, 568], [720, 1280], [1200, 662], [736, 736], [926, 1280], [1000, 714], [907, 1200], [792, 792], [900, 746], [720, 1280], [736, 738], [828, 814], [389, 750], [937, 780], [519, 1280], [545, 1280], [360, 720], [659, 1280]] },
  silhouette: { name: "Silhouette Design", artist: "Various artists", collection: "Silhouette Design", account: "silhouette.lab", description: "Reading a character from its outline", tags: ["silhouette", "shape", "character", "gesture"], sizes: [[853, 1280], [480, 640], [350, 571], [819, 1280], [1200, 1200], [400, 400], [796, 1280], [659, 1280], [1080, 1080], [1251, 1280], [1200, 1140], [736, 1117], [800, 1280], [749, 1065], [563, 563], [698, 1280], [736, 735], [1205, 1276], [495, 640], [1280, 905], [681, 834], [720, 1280], [547, 845], [720, 1280], [1280, 883], [445, 604], [736, 1030], [781, 689], [705, 931], [1280, 876], [715, 1280], [500, 446], [800, 698], [1280, 653], [685, 1280], [736, 952], [512, 1280], [736, 1104], [631, 1280], [1012, 1012], [640, 1280], [1000, 1000], [907, 1200], [735, 1226], [1254, 1280], [736, 738], [989, 1280], [996, 1280], [512, 1280], [360, 720]] },
  spiderverse: { name: "Spider-Verse", artist: "Sony Pictures Animation artists", collection: "Spider-Verse", account: "spiderverse.visdev", description: "Spider-Verse \u00b7 Graphic colour & character", tags: ["character", "color", "graphic", "contrast", "expression"], sizes: [[740, 740], [674, 733], [1200, 1200], [998, 1033], [1109, 1022], [536, 1280], [500, 500], [720, 1280], [1080, 796], [754, 1200], [1280, 720], [1050, 1143], [622, 1280], [1000, 852], [1280, 782], [854, 1280], [646, 646], [500, 502], [538, 1280], [1109, 1020], [536, 1280], [1200, 1072], [1176, 1280], [727, 896], [721, 1200], [1000, 1239], [1024, 1024], [1280, 1160], [876, 656], [768, 836], [1176, 1280], [1280, 965], [1280, 1036], [768, 836], [541, 1280], [719, 1200], [631, 566], [620, 1280], [680, 740], [527, 1280], [1200, 450], [753, 1280], [536, 1280], [1200, 1200], [1050, 1143], [675, 1200], [720, 1280], [675, 1024], [759, 1280], [1280, 785]] },
  wolfwalkers: { name: "Wolfwalkers", artist: "Cartoon Saloon", collection: "Wolfwalkers", account: "wolfwalkers.saloon", description: "Wolfwalkers \u00b7 Line, pattern & model sheets", tags: ["line", "shape", "pattern", "character", "environment"], sizes: [[1280, 905], [1079, 649], [1000, 588], [614, 243], [1000, 416], [1024, 724], [736, 414], [1023, 1200], [1079, 688], [1200, 849], [1280, 682], [1080, 642], [1000, 706], [1080, 1080], [720, 1280], [1280, 682], [1080, 1080], [1280, 828], [724, 724], [1024, 649], [1200, 1175], [720, 1280], [720, 1280], [300, 410], [1000, 562], [1000, 541], [1000, 588], [1280, 692], [720, 1280], [800, 1092], [1080, 1080], [960, 594], [720, 720], [1280, 905], [564, 293], [1000, 512], [1000, 557], [1280, 905], [800, 450], [720, 1280], [1280, 720], [1000, 588], [815, 456], [1280, 591], [830, 1280], [1080, 1080], [1280, 692], [720, 1280], [743, 441], [720, 1280]] },
};

export const libraryArtworks: Artwork[] = (Object.entries(libraryCollections) as [LibraryCluster, LibraryCollection][]).flatMap(([key, c]) =>
  c.sizes.map(([w, h], i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      id: `${key}-${n}`,
      title: `${c.collection} · ${n}`,
      artist: c.artist,
      image: `/art/library/${key}/${n}.jpg`,
      thumb: `/art/library-thumbs/${key}/${n}.jpg`,
      cluster: key,
      year: '',
      tags: c.tags,
      collection: c.collection,
      credit: `${c.artist} · user-supplied reference`,
      sourceUrl: '',
      ratio: w / h,
    };
  }),
);
