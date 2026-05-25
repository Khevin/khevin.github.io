"""Final cleanup: aggressively strip [N] + any trailing garbage."""
import json, re, os

PATH = os.path.join(os.path.dirname(__file__), "..", "heisig-data.js")

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

m = re.search(r'const HEISIG = ({.*?});', content, re.DOTALL)
data = json.loads(m.group(1))

for kanji, entry in data.items():
    if "story" not in entry:
        continue
    s = entry["story"]
    # Kill any [NUMBER] followed by anything that isn't a full sentence
    s = re.sub(r'\s*\[\d+\].*$', '', s)
    # Kill trailing non-sentence chars
    s = s.strip()
    # Make sure it ends on a sentence boundary
    if s and s[-1] not in '.!?"…"\'':
        last = max(s.rfind('.'), s.rfind('!'), s.rfind('?'), s.rfind('"'))
        if last > len(s) * 0.5:
            s = s[:last+1]
    entry["story"] = s

# Spot check
for k in ["書", "日", "口", "木", "町", "村"]:
    if k in data and "story" in data[k]:
        print(f"{k}: {data[k]['story'][-80:]}")

js_out = "/* Heisig RTK1 4th Ed. data for deck kanji -- auto-extracted */\n"
js_out += "const HEISIG = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"

with open(PATH, "w", encoding="utf-8") as f:
    f.write(js_out)
print(f"\nDone.")
