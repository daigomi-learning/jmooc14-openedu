"""Rebuild the static statistics tables from the archived CSV files."""
import csv
import html
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
page = ROOT / 'service/servicecard.html'
source = page.read_text(encoding='utf-8')
for name, field in [('titles', 'title'), ('locations', 'location'), ('words', 'word')]:
    with (ROOT / f'service/top30_{name}.csv').open(encoding='utf-8', newline='') as data:
        rows = list(csv.DictReader(data))
    contents = '\n'.join(
        '                        <tr><td>' + html.escape(row[field]) + '</td><td>' +
        html.escape(row['count']) + '</td></tr>' for row in rows
    )
    pattern = rf'(<table id="statistics-{name}".*?<tbody>).*?(</tbody>)'
    source, count = re.subn(pattern, lambda match: match[1] + '\n' + contents + '\n                    ' + match[2], source, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected one statistics table: {name}')
page.write_text(source, encoding='utf-8')
