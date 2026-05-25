"""
Parse Grade 1 kanji entries from the extracted kanji-guide.md.
Outputs a structured JSON for planning flashcard categories.
"""
import fitz, re, os, json

PDF = os.path.join(os.path.dirname(__file__), "..",
    "The Complete Guide to Japanese Kanji.pdf")

doc = fitz.open(PDF)

# Grade 1: pages 48-65 (0-indexed: 47-64)
# We'll use the dict mode to get better text positioning

entries = []
CJK = re.compile(r'[一-鿿]')

# Extract text from grade 1 pages
grade1_text = ""
for i in range(47, 65):
    page = doc[i]
    txt = page.get_text("text")
    grade1_text += txt + "\n"
doc.close()

# Parse using the patterns visible in the text:
# The key patterns are:
# 1. Reading line: "ON1, ON2, kun1, kun2" (ON in caps, kun in lowercase)
# 2. Meaning line: English meaning(s)
# 3. Stroke count: "N stroke(s)"
# 4. The kanji character itself (single CJK char on its own line)
# 5. JLPT level: L3, L4, L5
# 6. Entry number: single digit or two digits
# 7. Mnemonic: line starting with "Mnemonic:"
# 8. Example compounds: "KANJI reading   meaning"

# Strategy: find all "N stroke(s)" markers as entry anchors,
# then work backwards/forwards to get the rest.

lines = grade1_text.split("\n")

# Find entry blocks by looking for the stroke count pattern
stroke_indices = []
for i, line in enumerate(lines):
    m = re.match(r'^(\d+)\s+strokes?$', line.strip())
    if m:
        stroke_indices.append((i, int(m.group(1))))

print(f"Found {len(stroke_indices)} stroke-count markers")

# For each stroke marker, look backwards for readings and kanji
for idx, (stroke_line, stroke_count) in enumerate(stroke_indices):
    # Look backwards from stroke line for:
    # - meaning line (right before strokes)
    # - readings line (before meaning)
    # - kanji character

    # Get surrounding context
    start = max(0, stroke_line - 8)
    context = lines[start:stroke_line]

    # The meaning is typically the line right before "N strokes"
    meaning_line = lines[stroke_line - 1].strip() if stroke_line > 0 else ""

    # Readings are typically 1-2 lines before meaning
    reading_line = ""
    for j in range(stroke_line - 2, max(stroke_line - 5, -1), -1):
        candidate = lines[j].strip()
        # Readings have ON (caps) and/or kun (lowercase) separated by commas
        if candidate and re.search(r'[A-Z]{2,}', candidate):
            reading_line = candidate
            break

    # Find the kanji character - single CJK char on its own line, near the stroke count
    kanji = ""
    for j in range(stroke_line + 1, min(stroke_line + 4, len(lines))):
        candidate = lines[j].strip()
        if len(candidate) == 1 and CJK.match(candidate):
            kanji = candidate
            break
    if not kanji:
        # Try before
        for j in range(stroke_line - 1, max(stroke_line - 8, -1), -1):
            candidate = lines[j].strip()
            if len(candidate) == 1 and CJK.match(candidate):
                kanji = candidate
                break

    # JLPT level
    jlpt = ""
    for j in range(stroke_line + 1, min(stroke_line + 5, len(lines))):
        m = re.match(r'^L([345])$', lines[j].strip())
        if m:
            jlpt = f"N{m.group(1)}"
            break

    # Entry number
    entry_num = ""
    for j in range(stroke_line + 1, min(stroke_line + 6, len(lines))):
        m = re.match(r'^(\d{1,3})$', lines[j].strip())
        if m:
            num = int(m.group(1))
            if 1 <= num <= 80:
                entry_num = num
                break

    # Mnemonic
    mnemonic = ""
    for j in range(stroke_line + 1, min(stroke_line + 40, len(lines))):
        if lines[j].strip().startswith("Mnemonic:"):
            mnemonic = lines[j].strip().replace("Mnemonic:", "").strip()
            # May continue on next line
            if j + 1 < len(lines) and lines[j+1].strip() and not re.match(r'^[A-Z]', lines[j+1].strip()):
                mnemonic += " " + lines[j+1].strip()
            break

    # Example compounds (3 per entry typically)
    examples = []
    for j in range(stroke_line - 15, stroke_line):
        if j < 0:
            continue
        line = lines[j].strip()
        # Pattern: "KANJI reading   meaning" or "KANJI   reading   meaning"
        # Examples look like: "一月 ICHIGATSU   January" or "雨雲 amagumo   rain cloud"
        m2 = re.match(r'^([一-鿿ぁ-んァ-ヶー]+)\s+(\S+)\s{2,}(.+)$', line)
        if m2:
            examples.append({
                "word": m2.group(1),
                "reading": m2.group(2),
                "meaning": m2.group(3).strip()
            })

    # Parse readings into on/kun
    on_readings = []
    kun_readings = []
    if reading_line:
        parts = re.split(r',\s*', reading_line)
        for part in parts:
            part = part.strip()
            if not part:
                continue
            if part[0].isupper() or part == part.upper():
                on_readings.append(part)
            else:
                kun_readings.append(part)

    if kanji:
        entry = {
            "num": entry_num,
            "kanji": kanji,
            "on": on_readings,
            "kun": kun_readings,
            "meaning": meaning_line,
            "strokes": stroke_count,
            "jlpt": jlpt,
            "mnemonic": mnemonic,
            "examples": examples[:3],
        }
        entries.append(entry)

# Sort by entry number
entries.sort(key=lambda e: int(e.get("num", 999)) if e.get("num") else 999)

print(f"\nParsed {len(entries)} Grade 1 entries:\n")
for e in entries:
    print(f"  #{e.get('num','?'):>2} {e['kanji']}  "
          f"ON={','.join(e['on'][:2])}  kun={','.join(e['kun'][:2])}  "
          f"\"{e['meaning']}\"  {e['strokes']}st  {e['jlpt']}  "
          f"ex:{len(e['examples'])}")

# Save as JSON for reference
OUT = os.path.join(os.path.dirname(__file__), "..", "grade1-kanji.json")
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)
print(f"\nSaved to {OUT}")
