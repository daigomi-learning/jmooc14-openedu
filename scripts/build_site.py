"""Export only the site's runtime files; never publish the repository wholesale.

Usage: python3 scripts/build_site.py /path/to/a/new/public-directory
"""
import argparse
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = (
    '*.html', 'contents/CC/*', 'contents/ga004-week-*/*.pdf',
    'flipped/*.html', 'flipped/*.pdf', 'quiz/*.html',
    'service/*.html', 'service/*.js', 'service/*.json', 'service/*.csv',
    'service/*.png', 'service/*.jpg', 'service/screenshot/*.png',
    'story/*.html', 'story/story.css', 'story/slides.js',
    'images/*.png', 'images/*.jpg', 'stylesheets/*.css',
    'lib/bootstrap/css/bootstrap.min.css', 'lib/bootstrap/fonts/*',
)

def build(destination):
    destination = Path(destination).resolve()
    if destination.exists():
        raise ValueError('Destination must not exist; choose a new directory.')
    files = sorted({p for pattern in PATTERNS for p in ROOT.glob(pattern) if p.is_file()})
    for source in files:
        if source.is_symlink() or source.resolve() != source.absolute():
            raise ValueError(f'Symbolic links are not publishable: {source.relative_to(ROOT)}')
    destination.mkdir(parents=True)
    for source in files:
        target = destination / source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    (destination / '.nojekyll').touch()
    return len(files)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    print(f'Exported {build(args.destination)} runtime files to {args.destination}')
