"""
Fill the missing Heisig RTK1 4th Ed. entries for our curriculum.

Strategy: I (the developer) supply a `missing_kanji -> keyword` map
based on confident recall of the standard RTK1 keywords. The script
walks the PDF, finds the frame number that pairs with each keyword,
then extracts the mnemonic story for that frame. Output merges into
heisig-data.js (preserving existing entries) and regenerates
heisig-reference.md.

Radicals (亻 扌 廾 飠) are not in standard RTK1 (they're primitive
elements, not numbered frames), so we skip them here — they get their
explanation from the radical-card descEn/descJa fields in data.js.
"""
import fitz, re, os, json, sys

# Force UTF-8 stdout so we can print Japanese on the Windows console.
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

ROOT = os.path.join(os.path.dirname(__file__), "..")
PDF  = os.path.join(ROOT, "James W. Heisig - Remembering Kanji 4º Edition - Vol 1.pdf")
DATA_JS = os.path.join(ROOT, "heisig-data.js")
REF_MD  = os.path.join(ROOT, "heisig-reference.md")

# ── kanji -> Heisig keyword (RTK1 4th Ed canonical) ────────────────
# These keywords are stable across editions and well-known to RTK
# learners. The frame number is discovered by scanning the PDF for
# the line "<frame>\n<keyword>".
MISSING_KEYWORDS = {
    # Numbers / measure
    "万": "ten thousand",
    "分": "part",
    "半": "half",
    "千": None,            # already in data
    # Directions
    "北": "north",
    "南": "south",
    "東": "east",
    "西": "west",
    # Time
    "今": "now",
    "前": "in front",
    "後": "behind",
    "昼": "daytime",
    "時": "time",
    "朝": "morning",
    "夜": "evening",
    # Verbs & action
    "仕": "attend",
    "何": "what",
    "働": "work",
    "切": "cut",
    "取": "take",
    "受": "accept",
    "売": "sell",
    "帰": "homecoming",
    "引": "pull",
    "待": "wait",
    "忙": "busy",
    "思": "think",
    "打": "strike",
    "押": "push",
    "持": "hold",
    "来": "coming",
    "止": "stop",
    "知": "know",
    "聞": "hear",
    "行": "going",
    "言": "say",
    "記": "scribe",
    "話": "tale",
    "語": "word",
    "読": "read",
    "買": "buy",
    "走": "run",
    "閉": "closed",
    "飲": "drink",
    "飼": "domesticate",
    "食": "eat",
    "来": "come",                # 4th-ed uses bare "come"
    "館": "guesthouse",           # 4th-ed keyword (not "manor")
    # Qualities
    "新": "new",
    "古": "old",
    "多": "many",
    "少": "few",
    "弱": "weak",
    "強": "strong",
    "短": "short",
    "遅": "slow",
    "長": "long",
    "高": "tall",
    # Family / society
    "双": "pair",
    "卵": "egg",
    # Places & buildings
    "守": "guard",
    "安": "relax",
    "室": "room",
    "家": "house",
    "宿": "inn",
    "店": "shop",
    "館": "manor",
    "駅": "station",
    # Color
    "色": "colour",       # 4th ed uses British spelling for some keywords
    "紫": "purple",
    "緑": "green",
    "黄": "yellow",
    "黒": "black",
    # Food & drink
    "肉": "meat",
    "米": "rice",
    "酒": "sake",
    "茶": "tea",
    "飯": "meal",
    # Animals
    "牛": "cow",
    "猫": "cat",
    "馬": "horse",
    "鳥": "bird",
    "豚": "pork",
    "魚": "fish",
    "蛸": "octopus",
    "鶏": "chicken",
    # Misc / single-frame nominal
    "弁": "valve",
    "弊": "abuse",
    "葬": "interment",
    "来": "come",                # appended override (kept as last-wins dup key)
}

# For kanji whose RTK1 4th-Ed keyword contains accented characters or
# PDF-ligature artifacts that defeat the keyword-match path, look up
# by frame number directly.
DIRECT_FRAMES = {
    "酒": (1428, "saké"),         # accent breaks the keyword regex
    "色": (1753, "color"),        # US spelling in 4th ed
    "魚": (171,  "fish"),         # ligature 'fi' -> '�sh' in PDF
    "館": (1481, "guesthouse"),    # 4th-ed keyword
    # 蛸 (octopus) not in standard RTK1 — skip entirely
}

# Primitive radicals — no RTK1 frame entry. Skip cleanly.
RADICAL_SKIP = {"亻", "扌", "廾", "飠"}

def is_frame_line(s):
    s = s.strip()
    return bool(re.match(r'^\d{1,4}$', s)) and 1 <= int(s) <= 2200

def load_pdf_lines():
    doc = fitz.open(PDF)
    lines = []
    for page in doc:
        for line in page.get_text("text").split("\n"):
            lines.append(line)
    doc.close()
    return lines

def normalize_keyword_artifacts(s):
    """Map PDF ligature artifacts back to ASCII so keyword matches survive.
       PyMuPDF's text extraction breaks 'fi'/'fl' ligatures into a private-
       use char that displays as '�' or '³' — we patch them in BOTH the
       PDF text AND the candidate keyword before comparing."""
    # The common ligature artifacts in this PDF
    s = (s.replace("�sh", "fish")
           .replace("�nd", "find")
           .replace("�rst", "first")
           .replace("�re", "fire")
           .replace("�ne", "fine")
           .replace("�ve", "five")
           .replace("�t", "fit")
           .replace("�x", "fix")
           .replace("�ag", "flag")
           .replace("�ow", "flow")
           .replace("�oor", "floor")
           .replace("�oat", "float")
           .replace("�uid", "fluid")
           .replace("�ush", "flush")
           .replace("�our", "flour")
           .replace("�ute", "flute"))
    return s

def find_frame_for_keyword(lines, keyword):
    """Find the frame number whose 'frame -> keyword' pair matches.
       The PDF layout is:  <frame_num>\\n<keyword>\\n<glyph>\\n<story>"""
    candidates = []
    target = keyword.strip()
    for i in range(len(lines) - 2):
        if not is_frame_line(lines[i]):
            continue
        next_nonblank = None
        for j in range(i+1, min(i+4, len(lines))):
            if lines[j].strip():
                next_nonblank = lines[j].strip()
                break
        if next_nonblank is None:
            continue
        # Compare both raw and ligature-normalized forms
        if next_nonblank == target or normalize_keyword_artifacts(next_nonblank) == target:
            candidates.append((int(lines[i].strip()), i))
    return candidates[0] if candidates else (None, None)

def extract_story(lines, frame_line_idx):
    """Given the line index of the frame number, collect story lines
       until the next frame number / primitive marker / hard-stop.

       PDF layout per kanji entry:
         <frame>     ← frame_line_idx
         <keyword>
         <glyph>     ← 1-3 char line; PyMuPDF often renders this as
                       garbage ('5', 'M', '³', '�', etc) — even when it
                       LOOKS like a digit it isn't a real frame.
         <story...>
         <next frame>
    """
    n = len(lines)
    # Step 1: skip the frame line + any blanks until we hit the keyword
    j = frame_line_idx + 1
    while j < n and not lines[j].strip():
        j += 1
    # Step 2: skip the keyword line itself
    j += 1
    # Step 3: skip blank lines after keyword
    while j < n and not lines[j].strip():
        j += 1
    # Step 4: skip the glyph line UNCONDITIONALLY when it's short.
    # The glyph is rendered in a private-use font so PyMuPDF spits out
    # 1-3 chars of garbage — sometimes a digit, sometimes a letter,
    # sometimes a question mark. Never confuse this for a frame.
    if j < n and len(lines[j].strip()) <= 3:
        j += 1
    # Step 5: skip any blank lines before the story body
    while j < n and not lines[j].strip():
        j += 1
    story_lines = []
    while j < n and len(story_lines) < 30:
        s = lines[j].strip()
        if is_frame_line(s):
            break
        if s.startswith("* As a primitive"):
            break
        if s.startswith("lesson "):
            break
        if s:
            story_lines.append(s)
        j += 1
    story = " ".join(story_lines)
    story = re.sub(r'\s+', ' ', story)
    # Normalize various PDF artifacts. PyMuPDF maps the 'fi' / 'fl'
    # ligatures to garbage codepoints — patch them back to ASCII so the
    # story text reads cleanly.
    story = (story
        .replace("ﬁ", "fi").replace("ﬂ", "fl")
        .replace("³", "fi")   # PDF artifact for 'fi'
        .replace("µ", "fl")   # PDF artifact for 'fl'
        .replace("²", "fi")   # alt artifact seen in 4th ed
        .replace("’", "'").replace("‘", "'")
        .replace("“", '"').replace("”", '"')
        .replace("—", " — ")  # space em-dashes
        .replace("• ", "")    # drop bullets
        .replace("�", "")    # drop unrenderable glyph artifacts
    )
    # Re-join soft-hyphen line-wraps the PDF kept ("fol- lowing" → "following").
    story = re.sub(r"(\w)-\s+(\w)", r"\1\2", story)
    # Collapse double spaces introduced by replacements
    story = re.sub(r"\s+", " ", story).strip()
    # Strip a trailing "[N]" stroke-count marker — visually distracting
    story = re.sub(r"\s*\[\d+\]\s*$", "", story)
    # Strip trailing garbage chars left over after ligature stripping
    story = re.sub(r"\s+[^a-zA-Z0-9.,!?\"'()\- ]+$", "", story)
    # Truncate
    if len(story) > 700:
        story = story[:697] + "..."
    return story

def main():
    print(f"Loading PDF: {PDF}")
    lines = load_pdf_lines()
    print(f"PDF lines: {len(lines)}")

    # Read existing data.js
    with open(DATA_JS, encoding="utf-8") as f:
        js_src = f.read()
    # Parse the JSON portion (everything after the first '=' up to the trailing ';')
    m = re.search(r"=\s*({.*})\s*;\s*$", js_src, re.S)
    if not m:
        print("FATAL: couldn't parse existing heisig-data.js")
        sys.exit(1)
    existing = json.loads(m.group(1))
    print(f"Existing entries: {len(existing)}")

    found = {}
    skipped_no_frame = []

    # First pass — keyword-based lookup
    for kanji, keyword in MISSING_KEYWORDS.items():
        if keyword is None:
            continue
        if kanji in existing or kanji in found:
            continue
        frame, line_idx = find_frame_for_keyword(lines, keyword)
        if frame is None:
            skipped_no_frame.append((kanji, keyword))
            continue
        story = extract_story(lines, line_idx)
        found[kanji] = {
            "frame": frame,
            "keyword": keyword,
            "story": story,
        }
        print(f"  + {kanji}  #{frame}  {keyword:24s}  {story[:60]}{'...' if len(story) > 60 else ''}")

    # Second pass — DIRECT_FRAMES override (used when keyword lookup fails
    # due to accented chars or PDF ligature artifacts in the keyword line).
    # We FORCE re-extraction for these even if the kanji already has an
    # entry — the first-pass entry may have been a stub with empty story.
    for kanji, (frame, kw_hint) in DIRECT_FRAMES.items():
        if kanji in found:
            continue
        # Locate the frame line by its standalone digit and pull the story
        line_idx = None
        for i in range(len(lines) - 2):
            if is_frame_line(lines[i]) and int(lines[i].strip()) == frame:
                # Verify this is the "intro" occurrence (next nonblank is
                # short / keyword-shaped, not just another digit/index)
                for j in range(i+1, min(i+4, len(lines))):
                    t = lines[j].strip()
                    if not t: continue
                    if is_frame_line(t): break
                    # Real intro frames have a keyword-like next line
                    line_idx = i
                    break
                if line_idx is not None:
                    break
        if line_idx is None:
            skipped_no_frame.append((kanji, f"direct frame #{frame}"))
            continue
        story = extract_story(lines, line_idx)
        found[kanji] = {
            "frame": frame,
            "keyword": kw_hint,
            "story": story,
        }
        print(f"  + {kanji}  #{frame}  {kw_hint:24s}  {story[:60]}{'...' if len(story) > 60 else ''}  (direct)")

    print()
    print(f"Found {len(found)} new entries")
    if skipped_no_frame:
        print(f"Skipped (keyword not found in PDF): {len(skipped_no_frame)}")
        for k, kw in skipped_no_frame:
            print(f"   ?  {k}  '{kw}'")

    # Third pass — re-extract stories for any existing entry where the
    # story field is empty or missing. The improved extract_story logic
    # may succeed where the first extraction failed.
    refreshed = 0
    for kanji, e in existing.items():
        if kanji in found:
            continue
        if e.get("story", "").strip():
            continue
        frame = e["frame"]
        for i in range(len(lines) - 2):
            if not (is_frame_line(lines[i]) and int(lines[i].strip()) == frame):
                continue
            # First occurrence with a keyword-shaped next line is the intro
            ok = False
            for j in range(i+1, min(i+4, len(lines))):
                t = lines[j].strip()
                if not t: continue
                if is_frame_line(t): break
                # Real intro: next line is a keyword (lowercase phrase)
                ok = True
                break
            if not ok:
                continue
            story = extract_story(lines, i)
            if story:
                existing[kanji] = {**e, "story": story}
                refreshed += 1
                print(f"  ~ {kanji}  #{frame}  refresh: {story[:60]}{'...' if len(story) > 60 else ''}")
            break
    if refreshed:
        print(f"\nRefreshed {refreshed} previously-empty stories")

    # Merge + write data.js
    merged = {**existing, **found}
    # Apply ligature cleanup to ALL story texts (old + new) so the
    # earlier ³/µ artifacts in pre-existing entries get cleaned up too.
    cleanup = lambda s: (s
        .replace("ﬁ", "fi").replace("ﬂ", "fl")
        .replace("³", "fi").replace("µ", "fl").replace("²", "fi")
        .replace("’", "'").replace("‘", "'")
        .replace("“", '"').replace("”", '"')
        .replace("�", ""))
    for e in merged.values():
        if "story" in e and e["story"]:
            s = cleanup(e["story"])
            s = re.sub(r"(\w)-\s+(\w)", r"\1\2", s)
            s = re.sub(r"\s+", " ", s).strip()
            s = re.sub(r"\s*\[\d+\]\s*$", "", s)
            s = re.sub(r"\s+[^a-zA-Z0-9.,!?\"'()\- ]+$", "", s)
            e["story"] = s
    # Order by frame for readability
    merged_sorted = dict(sorted(merged.items(), key=lambda kv: kv[1]["frame"]))
    js_out = "/* Heisig RTK1 4th Ed. data for deck kanji — auto-extracted */\n"
    js_out += "const HEISIG = " + json.dumps(merged_sorted, ensure_ascii=False, indent=2) + ";\n"
    with open(DATA_JS, "w", encoding="utf-8") as f:
        f.write(js_out)
    print(f"\nWrote {len(merged_sorted)} total entries to {DATA_JS}")

    # Regenerate reference.md
    md = ["# Heisig - Remembering the Kanji (Vol 1, 4th Ed.)", "",
          "Deck kanji reference. Frame number, keyword, and mnemonic story.", "", "---", ""]
    for kanji in sorted(merged_sorted.keys(), key=lambda k: merged_sorted[k]["frame"]):
        e = merged_sorted[kanji]
        md.append(f"### #{e['frame']} {kanji} — {e['keyword']}")
        md.append("")
        if "story" in e and e["story"]:
            md.append(e["story"])
        else:
            md.append("*(no story extracted)*")
        md.append("")
    md.append(f"---")
    md.append(f"*{len(merged_sorted)} entries.*")
    with open(REF_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(f"Wrote {REF_MD}")

if __name__ == "__main__":
    main()
