"""Run with python3 tests/security_static.py; no third-party packages required."""
import csv
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

class Security(unittest.TestCase):
    def test_all_application_pages(self):
        pages = [p for p in ROOT.rglob('*.html') if 'lib' not in p.relative_to(ROOT).parts]
        self.assertEqual(len(pages), 33)
        for path in pages:
            with self.subTest(page=str(path.relative_to(ROOT))):
                parsed = Page()
                parsed.feed(path.read_text(encoding='utf-8'))
                policies = [a['content'] for t, a in parsed.tags if t == 'meta' and a.get('http-equiv', '').lower() == 'content-security-policy']
                self.assertEqual(len(policies), 1)
                directives = {part.strip().split()[0]: part.strip().split()[1:] for part in policies[0].split(';') if part.strip()}
                self.assertEqual(directives['default-src'], ["'none'"])
                self.assertEqual(directives['script-src'], ["'self'"])
                for directive in ['object-src', 'frame-src', 'base-uri', 'form-action']:
                    self.assertEqual(directives[directive], ["'none'"])
                self.assertIn(('meta', {'name': 'referrer', 'content': 'no-referrer'}), parsed.tags)
                for tag, attrs in parsed.tags:
                    self.assertFalse(any(k.startswith('on') or k == 'srcdoc' for k in attrs), tag)
                    if tag == 'a':
                        self.assertNotRegex(attrs.get('href', '').lower(), r'^\s*(javascript|data|vbscript):')
                    if tag in ['script', 'link']:
                        url = attrs.get('src' if tag == 'script' else 'href', '')
                        self.assertTrue(url, 'Inline scripts are prohibited')
                        parts = urlsplit(url)
                        self.assertFalse(parts.scheme or parts.netloc, url)
                        self.assertTrue((path.parent / unquote(parts.path)).is_file(), url)
                        if tag == 'script':
                            self.assertNotIn('lib/', url)
                source = path.read_text(encoding='utf-8')
                self.assertNotRegex(source, r'(?i)@import\s+["\x27]?(?:http:|//)')

    def test_statistics_preserve_csv(self):
        source = (ROOT / 'service/servicecard.html').read_text(encoding='utf-8')
        from html import unescape
        for name, field in [('titles', 'title'), ('locations', 'location'), ('words', 'word')]:
            table = re.search(rf'<table id="statistics-{name}".*?</table>', source, re.S).group()
            actual = [(unescape(a), unescape(b)) for a, b in re.findall(r'<tr><td>(.*?)</td><td>(.*?)</td></tr>', table, re.S)]
            with (ROOT / f'service/top30_{name}.csv').open(encoding='utf-8', newline='') as data:
                expected = [(row[field], row['count']) for row in csv.DictReader(data)]
            self.assertEqual(actual, expected)

    def test_application_scripts_have_no_html_sinks(self):
        for name in ['service/cards.js', 'service/list.js', 'service/top31.js', 'service/statistics.js', 'story/slides.js']:
            source = (ROOT / name).read_text(encoding='utf-8')
            self.assertNotRegex(source, r'innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new\s+Function\b')

if __name__ == '__main__':
    unittest.main()
