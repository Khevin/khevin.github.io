"""Regenerate heisig-reference.md from the cleaned heisig-data.js."""
import json, re, os

JS_PATH = os.path.join(os.path.dirname(__file__), "..", "heisig-data.js")
MD_PATH = os.path.join(os.path.dirname(__file__), "..", "heisig-reference.md")

with open(JS_PATH, "r", encoding="utf-8") as f:
    content = f.read()

m = re.search(r'const HEISIG = ({.*?});', content, re.DOTALL)
data = json.loads(m.group(1))

md = ["# Heisig - Remembering the Kanji (Vol 1, 4th Ed.)\n"]
md.append("Deck kanji reference. Frame number, keyword, and mnemonic story.\n")
md.append("---\n")

for kanji in sorted(data.keys(), key=lambda k: data[k]["frame"]):
    entry = data[kanji]
    md.append(f"### #{entry['frame']} {kanji} — {entry['keyword']}\n")
    if "story" in entry:
        md.append(f"{entry['story']}\n")
    else:
        md.append("*(no story extracted)*\n")

md.append(f"\n---\n\n*{len(data)} entries for deck kanji.*\n")

with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(md))

print(f"Written {len(data)} entries to {MD_PATH}")
