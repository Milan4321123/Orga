#!/usr/bin/env python3
"""Insert <span data-lang="ne"> after every de/en span pair for which the
dictionary holds a Nepali string. Idempotent: a pair that already carries a
Nepali sibling is left alone."""
import re, json, glob, sys, os

ROOT = os.path.dirname(os.path.abspath(__file__))
DICT = json.load(open(os.path.join(ROOT, 'assets/i18n/ne.json')))

PAIR = re.compile(
    r'(<span data-lang="de">(?P<de>.*?)</span>\s*<span data-lang="en">(?P<en>.*?)</span>)'
    r'(?P<tail>\s*<span data-lang="ne">.*?</span>)?', re.S)

def run(files):
    hit = miss = skip = 0
    missing = []
    for f in files:
        s = open(f).read()
        def rep(m):
            nonlocal hit, miss, skip
            if m.group('tail'):
                skip += 1
                return m.group(0)
            en = m.group('en')
            ne = DICT.get(en)
            if ne is None:
                miss += 1
                missing.append((f, en))
                return m.group(0)
            hit += 1
            return m.group(1) + '<span data-lang="ne">' + ne + '</span>'
        out = PAIR.sub(rep, s)
        if out != s:
            open(f, 'w').write(out)
    return hit, miss, skip, missing

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, '*.html')))
    hit, miss, skip, missing = run(files)
    print(f"inserted {hit} · already present {skip} · untranslated {miss}")
    for f, en in missing[:40]:
        print("  MISSING", os.path.basename(f), "|", en[:90])
