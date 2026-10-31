#!/usr/bin/env python3
"""Build the local Trace demonstration micro-lessons with ffmpeg (no Python packages).

Each original is shown in full. A temporary grayscale inspection and composition
frame are teaching annotations, not replacement artwork or a claimed human lesson.
Run from any directory: python3 scripts/build-demo-lessons.py [optional-art-id ...]
Requires ffmpeg / ffprobe and Arial (macOS defaults; FONT_REGULAR/FONT_BOLD override).
"""
import concurrent.futures
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'tutorials'
FFMPEG = shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg'
FFPROBE = shutil.which('ffprobe') or '/opt/homebrew/bin/ffprobe'
FONT = os.environ.get('FONT_REGULAR', '/System/Library/Fonts/Supplemental/Arial.ttf')
BOLD = os.environ.get('FONT_BOLD', '/System/Library/Fonts/Supplemental/Arial Bold.ttf')
WIDTH, HEIGHT, FPS, DURATION = 960, 540, 12, 12

# Original teaching prompts written for this simulation. No teacher endorsement
# or relationship to the original artists is implied.
LESSONS = {
 'kfp-goal': [
  ('Group the coast into three shapes', 'Find the dark cliff, pale mist and distant horizon. Sketch those masses before adding detail.'),
  ('Separate near from far', 'In grayscale, compare the darkest foreground with the softer distant forms. Keep that value gap in your study.'),
  ('Let edges describe the mist', 'Restore color. Keep distant edges soft and reserve sharp accents for the foreground. Try a 60-second thumbnail.')],
 'kfp-shapes': [
  ('Read the mountain silhouettes', 'Trace each outer contour with your eyes. Compare wide bases, narrow peaks and the empty spaces between them.'),
  ('Test the value groups', 'Ignore small textures. Can the mountain layers still read as separate flat shapes in grayscale?'),
  ('Design one new silhouette', 'Keep the same large-to-small rhythm, but invent a different peak. Compare its negative spaces with the reference.')],
 'kfp-light': [
  ('Find the light direction', 'Follow the brightest planes around the harbor. Mark one light arrow before drawing individual buildings.'),
  ('Keep a clear focal contrast', 'Use the grayscale view to locate the strongest light-dark boundary. Simplify weaker background contrasts.'),
  ('Compare warm and cool planes', 'Return to color. Separate sunlit warm planes from cooler shadows, then paint a small three-color study.')],
 'kfp-atmosphere': [
  ('Read the tavern as silhouettes', 'Find the large dark structures against the backlight. Draw their outline first, with no interior detail.'),
  ('Protect the bright opening', 'In grayscale, compare the bright opening to the darkest framing shapes. Keep that relationship simple.'),
  ('Control the glowing edges', 'Return to color. Soften edges near the warm light; keep only a few dark foreground edges crisp.')],
 'kfp-action': [
  ('Follow the action diagonals', 'Look for the main slanted shapes carrying movement through the tavern. Reduce them to three directional marks.'),
  ('Check the focal value pattern', 'In grayscale, find where the strongest contrast pulls your eye. Make quieter areas simpler in your thumbnail.'),
  ('Vary busy and quiet areas', 'Restore color. Compare dense detail with open areas. Leave one calm region so the action remains readable.')],
 'kfp-outpost': [
  ('Block the cliff and outpost', 'Compare the building mass with the cliff underneath it. Place their largest shapes before drawing windows.'),
  ('Separate the distance layers', 'Inspect the grayscale view. Compare foreground, middle ground and sky as three value families.'),
  ('Choose a limited color key', 'Return to color. Pick one dominant cool family and one warm accent, then paint the scene in five shapes.')],
 'zoo-city': [
  ('Organize the city by scale', 'Find foreground, middle ground and distant skyline. Compare the size changes rather than counting buildings.'),
  ('Build a readable value map', 'Squint at the grayscale city. Group neighboring buildings into large light and dark masses.'),
  ('Use depth before detail', 'Restore color. Compare distant saturation and edge sharpness with the foreground. Apply that change to a thumbnail.')],
 'zoo-light': [
  ('Track the station perspective', 'Follow the long architectural lines toward their meeting area. Establish that structure before adding signs.'),
  ('Locate the brightest route', 'In grayscale, find how the light leads through the station. Preserve that path in a three-value sketch.'),
  ('Balance warm light and shadow', 'Return to color. Compare sunlit surfaces with shaded planes. Save your strongest warmth for the focal area.')],
 'zoo-atmosphere': [
  ('Find the big winter shapes', 'Separate the skyline, snow and street into large silhouettes. Notice how their shapes overlap.'),
  ('Measure atmospheric contrast', 'In grayscale, compare the nearest darks with the softer distance. Reduce contrast as shapes recede.'),
  ('Keep snow color varied', 'Return to color. Compare cool shadow snow with warmer light. Avoid using one white for every surface.')],
 'frozen-arendelle': [
  ('Place the town inside its landscape', 'Compare the town scale with mountains and water. Block those large relationships before roof details.'),
  ('Group the winter values', 'In grayscale, separate the darkest structures from pale snow and atmosphere. Keep the distant layers simple.'),
  ('Study warm accents in cold light', 'Return to color. Find small warm accents against the cool landscape. Use them sparingly in a quick study.')],
 'frozen-elsa': [
  ('Read the pose and silhouette', 'Follow the head tilt, shoulder line and outer shape. Sketch the gesture before facial features or costume detail.'),
  ('Check the face and hair masses', 'In grayscale, compare the large face, hair and clothing shapes. Keep their proportions readable without small lines.'),
  ('Choose expression-bearing edges', 'Restore color. Compare the angles of brows, eyes and mouth. Change one angle in your own study and compare the mood.')],
 'frozen-anna': [
  ('Start with the head gesture', 'Notice the head tilt and the relationship of shoulders to face. Draw a simple action line before adding features.'),
  ('Compare large facial proportions', 'In grayscale, compare the face outline, hair mass and spacing of features. Use light construction shapes first.'),
  ('Test one expression change', 'Return to color. Compare brow and mouth angles. Try a small variation, then ask which marks changed the expression most.')],
 'starry': [
  ('Follow the sky movement', 'Trace the broad arcs through the sky. Plan their direction before painting individual dabs or stars.'),
  ('Separate light from dark masses', 'In grayscale, compare bright sky paths with the dark cypress and village. Preserve these large value groups.'),
  ('Make dabs follow the form', 'Restore color. Use short directional strokes in blue and yellow families. Compare where the direction changes.')],
 'cypresses': [
  ('Compare field, tree and sky rhythms', 'Follow the horizontal field, rising cypress and curling clouds. Give each area a distinct stroke direction.'),
  ('Check the tree silhouette', 'In grayscale, compare the dark tree against its surroundings. Keep that silhouette clear before adding texture.'),
  ('Vary the short color dabs', 'Return to color. Compare yellow-green field marks with cooler sky marks. Use varied dabs instead of a single flat fill.')],
 'cafe': [
  ('Find the cafe perspective', 'Follow the terrace edges into the street. Sketch the large perspective wedge before tables or cobblestones.'),
  ('Protect the bright cafe shape', 'In grayscale, compare the lit canopy with the dark street. Keep the main value contrast stronger than small details.'),
  ('Compare yellow with blue', 'Restore color. Observe warm cafe light against cool night colors. Try the same contrast with a limited palette.')],
 'lilies': [
  ('Group the floating color patches', 'Separate large water reflections from smaller lily shapes. Place their spacing before painting individual petals.'),
  ('Look for quiet value changes', 'In grayscale, compare the subtle dark and light patches. Avoid outlining every lily with the same hard edge.'),
  ('Let adjacent colors build the water', 'Return to color. Compare blue, green and violet patches. Paint beside earlier marks and keep some edges soft.')],
 'sunrise': [
  ('Simplify boats and horizon', 'Place the horizon and boat silhouettes as a few broad shapes. Keep the distant industrial detail secondary.'),
  ('Compare the sun in grayscale', 'Notice how the sun value compares with the haze. Ask how much its color, rather than outline, attracts your eye.'),
  ('Use one small warm accent', 'Restore color. Compare orange against muted blue-gray water. Keep broken reflection marks small and horizontal.')],
 'garden': [
  ('Find the garden depth rhythm', 'Follow the planted rows into the distance. Compare the broad foreground color patches with smaller distant marks.'),
  ('Group the shaded passages', 'In grayscale, locate the darker trees and path. Let these large groups organize the busy flower texture.'),
  ('Suggest flowers with color patches', 'Return to color. Place neighboring greens, violets and warm accents. Soften distant edges instead of drawing every flower.')],
}


def read_artworks():
    source = (ROOT / 'src' / 'data.ts').read_text()
    match = re.search(r'export const artworks:\s*Artwork\[\]\s*=\s*(\[.*?\]);', source, re.S)
    if not match:
        raise ValueError('Could not read artworks JSON array')
    return json.loads(match.group(1))


def drawtext(path, font, size, x, y, color='white', enable=None):
    result = f"drawtext=fontfile='{font}':textfile='{path}':expansion=none:fontsize={size}:fontcolor={color}:x={x}:y={y}:line_spacing=7"
    if enable:
        result += f":enable='{enable}'"
    return result


def generate(art):
    art_id = art['id']
    if art_id not in LESSONS:
        raise ValueError(f'No authored instructional steps for {art_id}')
    output = OUT / f'{art_id}-study.mp4'
    steps = LESSONS[art_id]
    with tempfile.TemporaryDirectory(prefix='trace-lesson-') as td:
        temp = Path(td)
        def txt(name, content):
            path = temp / f'{name}.txt'
            path.write_text(content)
            return str(path)
        title = txt('title', art['title'].replace('—', '-'))
        marker = txt('marker', 'TRACE DEMO LESSON  /  3 OBSERVATION EXERCISES')
        credit = txt('credit', art['credit'])
        filters = [
            'scale=904:328:force_original_aspect_ratio=decrease:flags=lanczos',
            'pad=960:540:(ow-iw)/2:64+(328-ih)/2:color=0x151c1e',
            'setsar=1',
            "eq=saturation=0:enable='gte(t,4)*lt(t,8)'",
            'drawbox=x=0:y=0:w=960:h=59:color=0x151c1e:t=fill',
            'drawbox=x=0:y=412:w=960:h=128:color=0x151c1e:t=fill',
            'drawbox=x=24:y=412:w=912:h=1:color=0x43524f:t=fill',
            drawtext(marker, FONT, 11, 24, 9, '0xd8c28a'),
            drawtext(title, BOLD, 24, 24, 29),
            drawtext(credit, FONT, 10, 24, 397, '0xe1e6df'),
            # This outside-picture rail marks the active stage without hiding art.
            "drawbox=x=24:y=71:w=3:h=310:color=0xd8c28a:t=fill:enable='lt(t,4)'",
            "drawbox=x=933:y=71:w=3:h=310:color=0xa6c6bb:t=fill:enable='gte(t,4)*lt(t,8)'",
            "drawbox=x=24:y=71:w=3:h=310:color=0xd8c28a:t=fill:enable='gte(t,8)'",
        ]
        for i, (heading, body) in enumerate(steps):
            start, end = i * 4, (i + 1) * 4
            active = f'gte(t,{start})*lt(t,{end})'
            h = txt(f'heading-{i}', f'{i + 1:02d}  {heading}')
            b = txt(f'body-{i}', textwrap.fill(body, width=93))
            filters.extend([
                drawtext(h, BOLD, 22, 24, 428, '0xe3d2a1', active),
                drawtext(b, FONT, 18, 24, 463, '0xf0f0e8', active),
            ])
            for j in range(3):
                filters.append(f"drawbox=x={850+j*28}:y=430:w=20:h=3:color={'0xe3d2a1' if j==i else '0x4b5a56'}:t=fill:enable='{active}'")
        filters.extend(['format=yuv420p', 'setparams=range=limited'])
        command = [FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-framerate', str(FPS), '-i', str(ROOT / 'public' / art['image'].lstrip('/')), '-t', str(DURATION), '-vf', ','.join(filters), '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-color_range', 'tv', '-threads', '2', '-r', str(FPS), '-movflags', '+faststart', str(output)]
        subprocess.run(command, check=True)
    probe = json.loads(subprocess.check_output([FFPROBE, '-v', 'error', '-show_entries', 'stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate:format=duration,size', '-of', 'json', str(output)]))
    stream = probe['streams'][0]
    assert stream['codec_name'] == 'h264' and stream['pix_fmt'] == 'yuv420p', probe
    assert abs(float(probe['format']['duration']) - DURATION) < .1, probe
    assert len(probe['streams']) == 1, probe
    print(f'{art_id}: {float(probe["format"]["duration"]):.1f}s, {int(probe["format"]["size"])//1024} KiB', flush=True)
    return {
        'artId': art_id,
        'src': f'/tutorials/{art_id}-study.mp4',
        'duration': DURATION,
        'title': f'Observation study: {art["title"]}',
        'steps': [{'time': i*4, 'title': title, 'text': text} for i, (title, text) in enumerate(steps)],
        'provenance': {
            'kind': 'authored-demo-animation',
            'description': 'Silent Trace demo micro-lesson: original reference shown in full with authored observation exercises and a temporary grayscale inspection. Not an original-artist tutorial or a real instructor recording.',
            'referenceImage': art['image'],
            'referenceCredit': art['credit'],
            'referenceSourceUrl': art['sourceUrl'],
            'script': 'scripts/build-demo-lessons.py',
        },
        'video': {'codec': stream['codec_name'], 'width': stream['width'], 'height': stream['height'], 'fps': FPS, 'audio': False, 'bytes': int(probe['format']['size'])},
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    all_art = read_artworks()
    requested = set(sys.argv[1:])
    selected = [art for art in all_art if not requested or art['id'] in requested]
    if requested - {art['id'] for art in selected}:
        raise ValueError('Unknown requested artwork id')
    # Two encoders, two threads each; predictable CPU and small delivery files.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        lessons = list(pool.map(generate, selected))
    manifest_path = OUT / 'manifest.json'
    if requested and manifest_path.exists():
        previous = json.loads(manifest_path.read_text())['lessons']
        by_id = {entry['artId']: entry for entry in previous + lessons}
        lessons = [by_id[art['id']] for art in all_art if art['id'] in by_id]
    manifest = {'format': 'trace-demo-lessons-v1', 'durationSeconds': DURATION, 'disclosure': 'Instructional demo animations made for Trace. Artwork credits belong to the reference artists; no instructor endorsement is implied.', 'lessons': lessons}
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    total = sum(entry['video']['bytes'] for entry in lessons)
    print(f'{len(lessons)} lessons; total {total / 1024 / 1024:.2f} MiB; manifest: {manifest_path}', flush=True)


if __name__ == '__main__':
    main()
