"""
Walk the PDF and extract every (frame_number, keyword) pair found in
the form  "<N>\\n<keyword>\\n<garbage glyph char>\\n<story...>".

Writes scripts/heisig-frame-keywords.json — a flat {frame: keyword} map.
We then manually pin each missing kanji to a keyword (which we DO know
from RTK1) and look up its frame from this map.
"""
import fitz, re, os, json

ROOT = os.path.join(os.path.dirname(__file__), "..")
PDF  = os.path.join(ROOT, "James W. Heisig - Remembering Kanji 4º Edition - Vol 1.pdf")
OUT  = os.path.join(ROOT, "scripts", "heisig-frame-keywords.json")

def is_frame_line(s):
    s = s.strip()
    return bool(re.match(r'^\d{1,4}$', s)) and 1 <= int(s) <= 2200

KEYWORD_RE = re.compile(r"^[a-z][a-z0-9 \-/,'’()]*$")

def looks_like_keyword(s):
    s = s.strip()
    if not s: return False
    if len(s) > 50: return False
    return bool(KEYWORD_RE.match(s))

doc = fitz.open(PDF)
lines = []
for page in doc:
    for line in page.get_text("text").split("\n"):
        lines.append(line)
doc.close()
print(f"PDF lines: {len(lines)}")

# Walk the lines; whenever we see <frame>\n<keyword>\n<something else>,
# record. Reject duplicates if we've already seen this frame with a
# keyword (PDFs often list frame numbers in indexes too — those are
# followed by another number, not a keyword).
frame_to_keyword = {}
for i in range(len(lines) - 2):
    s = lines[i].strip()
    if not is_frame_line(s):
        continue
    frame = int(s)
    # The next non-empty line should look like a keyword
    nxt = None
    for j in range(i+1, min(i+4, len(lines))):
        t = lines[j].strip()
        if t:
            nxt = t
            break
    if nxt and looks_like_keyword(nxt) and frame not in frame_to_keyword:
        frame_to_keyword[frame] = nxt

# Save
ordered = {str(k): frame_to_keyword[k] for k in sorted(frame_to_keyword.keys())}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(ordered, f, ensure_ascii=False, indent=2)
print(f"Wrote {len(ordered)} frame->keyword pairs to {OUT}")
print()
# Print sample
print("Sample (first 25):")
for k in sorted(frame_to_keyword.keys())[:25]:
    print(f"  {k:5d}  {frame_to_keyword[k]}")
print("\nSample (frames 700-720):")
for k in range(700, 720):
    if k in frame_to_keyword:
        print(f"  {k:5d}  {frame_to_keyword[k]}")
