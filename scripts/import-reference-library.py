#!/usr/bin/env python3
"""Import the supplied reference collections into Trace's static library.

Usage: python scripts/import-reference-library.py /path/to/reference-folders
Requires Pillow. Images retain their aspect ratio and are never enlarged.
Animated sources are represented by their first frame, recorded in credits.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from hashlib import sha256
import json
from pathlib import Path

from PIL import Image, ImageOps


COLLECTIONS = {
    "Alphonse Mucha": ("mucha", "Alphonse Mucha", ["ornament", "line", "pigment", "pattern"]),
    "Egon Schiele": ("schiele", "Egon Schiele", ["expressive-line", "gesture", "pigment"]),
    "Gesture Drawing": ("gesture", "Gesture Drawing", ["expressive-line", "gesture", "anatomy"]),
    "Gustav Klimt": ("klimt", "Gustav Klimt", ["expressive-line", "gesture", "pigment", "line"]),
    "Klaus Concept Art": ("klaus", "Klaus", ["shape", "depth", "atmosphere", "light"]),
    "Kungfu Panda Concept Art": ("kungfu-library", "Kung Fu Panda", ["character", "shape", "expression", "gesture"]),
    "Shape Language Character Design": ("shape-language", "Shape Language", ["character", "shape", "expression", "silhouette"]),
    "Silhouette 2D Design": ("silhouette", "Silhouette Design", ["character", "silhouette", "shape", "composition"]),
    "Spider-Verse Concept Art": ("spiderverse", "Spider-Verse", ["character", "shape", "expression", "gesture"]),
    "Wolfwalkers Cartoon Saloon": ("wolfwalkers", "Wolfwalkers", ["shape", "depth", "atmosphere", "light"]),
}

# A contact-sheet review separates character studies from environmental studies
# in these mixed collections. Filenames, rather than array positions, keep the
# classifications stable if more references are added later.
CHARACTER_OVERRIDES = {
    "klaus": {
        "03a2d340647458a32b53f410818812eb.jpg", "0a61fdc523df6004329f0a7fcd516cf6.jpg",
        "0bacde2c5075a5d7dd351e75b033beea.gif", "125c9c61cae7aa63c0f161bfe41d83b9.jpg",
        "2d9341ae2499d2ae050fd27f8dc68e51.jpg", "2dfcd4f880aa4b2056f3f1e1f03c7ed1.jpg",
        "38efbe6158f60442464255f63aa3bc93.png", "39da791df39d68df4675d5cb71fd2f3a.jpg",
        "43bce91fa0d51a9d6e74d56060253fd8.jpg", "51dab811e2894c157fac7b41c5d8678b.jpg",
        "6ae84b5439e8fd909a2e259ef3bee4b3.jpg", "794926d55e8f1d49ecc6826b557fc115.jpg",
        "856006b281d4bb3ebcfad6eed9886f36.jpg", "a261269a0942f13c32d50eacc801002a.jpg",
        "c8b418f5f0005f4cb34890afb2d4381d.jpg", "e00424a0e693ab88ded6f23e05584c29.jpg",
        "f67f03995ded09da5316d88791f26a65.jpg", "f86aab497983e3a9f7ede842c253d4ad.jpg",
        "ffb239f66cb427857b0a21f6e421b955.jpg",
    },
    "wolfwalkers": {
        "0544c3e89c57c13316527395e0b63d7f.jpg", "05c31197d7f463ceb760ea4958f42e51.png",
        "086f94d41a3ca731ed9a3f7976c9a560.jpg", "212f21e5fe23d6bc575d824f715489b0.jpg",
        "4136a3aa081103c12ac95bbf92d01589.jpg", "47fa91636d5d838843c8cc7b5877be4e.jpg",
        "504a818cecc9f14c882c78f9b84019ca.png", "59d429a2ef7a577d1827f6716c9113c4.jpg",
        "73d674005d7dffa0dcb3114c6c093bcf.jpg", "7719970335338e405f47f03751b18acc.jpg",
        "8254369b1ef8cdaaa394f2d5eb9be5a2.jpg", "870c17980f7c5fe1f7041effbd70302e.jpg",
        "8ab09168fddb0a761dbca82976d22307.jpg", "90d978550bc0f00ade220f92818f31d6.jpg",
        "963255cd0f49bbabd13fbaac48b5125d.png", "9e65a412044fc9c9a589c6d15e5139af.jpg",
        "ae7864cec0ee08aa8b98cb3bb4cc9cb6.png", "b23329ed9cdb97aa33ab70f51e27fa7f.jpg",
        "b36bf7d7cadd872b6e996dbb3d542054.jpg", "c5334753d4ba4c5ab98e252e73b073ec.png",
        "c621f052d5d5c33e52315d1d76a17176.jpg", "da23612ce45bb1982a94f3b842cbe872.png",
        "f0eade7979a5d11789d8c07d5a5c7082.jpg", "f66b5c4e103a4d9b0051d5827de5429b.jpg",
        "f95b5c38725b473612c291143702a78f.jpg", "fefec4e87e0a5abd51d3e1a27e000de7.jpg",
    },
}

ENVIRONMENT_OVERRIDES = {
    "kungfu-library": {
        "kfp_01.jpg", "kfp_03.jpg", "kfp_07.jpg", "kfp_11.jpg", "kfp_12.jpg",
        "kfp_14.jpg", "kfp_15.jpg", "kfp_18.jpg", "kfp_21.jpg",
    },
    "spiderverse": {
        "23cc1bf5cde6000e17c24578414245fc.jpg", "3458f4481c932113a01a362a7eda0dd0.jpg",
        "432d5b9b88259b0888f29e6bec02ccae.jpg", "599df2940aa5cdc1eee0335f4ed4823d.jpg",
        "7e5c4efbb8dd9c5973731495dbe98699.jpg", "8d80809d53f2d3b0634bc151ce709226.jpg",
        "953726601f51f542f6ab9bd1641d49d5.jpg", "be2d699287118346a079d193f9ca05d4.jpg",
        "c65a6b7a5ebb36f82c2707e084cefd11.jpg", "ccfa51d8b40467cb32c79f7bda59e9dd.jpg",
        "d4ba55bdc64340a51ebaa885af33c3f1.jpg", "dd71631e6d0213e84019041a10e7fe7f.jpg",
        "e5d23ba3fb1e8f2a106dc3741a838a23.jpg", "fa28ca8e46b70e1085dc3806f5d04fc6.jpg",
    },
}

EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Directory containing the named reference collection folders")
    parser.add_argument("--project", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--max-edge", type=int, default=1100)
    parser.add_argument("--quality", type=int, default=78)
    args = parser.parse_args()
    if args.max_edge <= 0 or not 1 <= args.quality <= 100:
        parser.error("max-edge must be positive and quality must be between 1 and 100")
    input_root = args.input.resolve()
    output_root = args.project.resolve() / "public" / "art" / "library"
    output_root.mkdir(parents=True, exist_ok=True)
    artworks = []
    credits = []
    source_hashes = defaultdict(list)
    total_input_bytes = 0
    seen_ids = set()

    for folder, (cluster, label, default_tags) in COLLECTIONS.items():
        source_folder = input_root / folder
        if not source_folder.is_dir():
            raise FileNotFoundError(f"Missing reference collection: {folder}")
        source_files = sorted(path for path in source_folder.iterdir()
                              if path.is_file() and path.suffix.lower() in EXTENSIONS
                              and not path.name.startswith("."))
        if not source_files:
            raise ValueError(f"No images in reference collection: {folder}")
        (output_root / cluster).mkdir(exist_ok=True)
        for index, source in enumerate(source_files, start=1):
            digest = sha256(source.read_bytes()).hexdigest()
            artwork_id = f"library-{cluster}-{digest[:12]}"
            # Preserve multiple source entries even if identical within a folder.
            if artwork_id in seen_ids:
                artwork_id += "-" + sha256(source.name.encode()).hexdigest()[:6]
            seen_ids.add(artwork_id)
            relative_image = Path(cluster) / f"{artwork_id}.webp"
            destination = output_root / relative_image
            with Image.open(source) as original:
                original_format = original.format
                original_dimensions = list(original.size)
                frame_count = getattr(original, "n_frames", 1)
                original.seek(0)
                image = ImageOps.exif_transpose(original)
                has_alpha = image.mode in ("RGBA", "LA") or "transparency" in image.info
                image = image.convert("RGBA" if has_alpha else "RGB")
                image.thumbnail((args.max_edge, args.max_edge), Image.Resampling.LANCZOS)
                image.save(destination, "WEBP", quality=args.quality, method=6)
                output_dimensions = list(image.size)
            # Read each encoded file back, so the generated catalogue never points
            # at a corrupt or incomplete import output.
            with Image.open(destination) as result:
                result.load()
                assert result.format == "WEBP"
                assert max(result.size) <= args.max_edge
                assert list(result.size) == output_dimensions
            tags = list(default_tags)
            if source.name in CHARACTER_OVERRIDES.get(cluster, set()):
                tags = ["character", "shape", "expression", "gesture"]
            elif source.name in ENVIRONMENT_OVERRIDES.get(cluster, set()):
                tags = ["shape", "depth", "atmosphere", "light", "composition"]
            artworks.append({
                "id": artwork_id,
                "title": f"{label} · Reference {index:02d}",
                "artist": "User-provided reference collection",
                "image": "/art/library/" + relative_image.as_posix(),
                "cluster": cluster,
                "year": "Undated reference",
                "tags": tags,
                "collection": folder,
                "credit": f"User-provided {folder} reference collection. Source filename preserved in the library credits.",
                "sourceUrl": "/art/library/credits.json",
            })
            relative_source = source.relative_to(input_root).as_posix()
            source_hashes[digest].append(relative_source)
            total_input_bytes += source.stat().st_size
            credits.append({
                "artworkId": artwork_id,
                "collection": folder,
                "sourceFile": relative_source,
                "sourceSha256": digest,
                "sourceFormat": original_format,
                "sourceDimensions": original_dimensions,
                "sourceFrames": frame_count,
                "representation": "First frame of an animated source" if frame_count > 1 else "Still image",
                "renderedFrame": 0,
                "image": "/art/library/" + relative_image.as_posix(),
                "outputDimensions": output_dimensions,
                "outputBytes": destination.stat().st_size,
            })

    manifest = {
        "description": "Reference collections supplied by the user for the Trace demo. Collection labels describe the supplied folders; individual original titles and creator credits were not provided.",
        "processing": {"format": "WebP", "maximumLongEdge": args.max_edge, "quality": args.quality,
                       "aspectRatio": "Preserved", "animatedSources": "First frame only"},
        "imageCount": len(artworks),
        "collections": dict(Counter(art["collection"] for art in artworks)),
        "sourceBytes": total_input_bytes,
        "outputBytes": sum(entry["outputBytes"] for entry in credits),
        "duplicateSourceGroups": [sources for sources in source_hashes.values() if len(sources) > 1],
        "entries": credits,
    }
    write_json(output_root / "credits.json", manifest)
    write_json(args.project.resolve() / "src" / "supplied-artworks.json", artworks)
    print(json.dumps({"images": len(artworks), "sourceBytes": total_input_bytes,
                      "webpBytes": manifest["outputBytes"],
                      "animatedSources": sum(entry["sourceFrames"] > 1 for entry in credits),
                      "duplicateSourceGroups": len(manifest["duplicateSourceGroups"]),
                      "roots": {cluster: next(art["id"] for art in artworks if art["cluster"] == cluster)
                                for cluster, _, _ in COLLECTIONS.values()}}, indent=2))


if __name__ == "__main__":
    main()
