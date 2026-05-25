"""Second cleanup pass: remove trailing [N] + garbled chars from all stories."""
import json, re, os

PATH = os.path.join(os.path.dirname(__file__), "..", "heisig-data.js")

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

m = re.search(r'const HEISIG = ({.*?});', content, re.DOTALL)
data = json.loads(m.group(1))

def final_clean(story):
    if not story:
        return story
    # Remove trailing [N] + any non-word chars after
    story = re.sub(r'\s*\[\d+\]\s*[^.!?\w]*$', '', story)
    # Remove trailing isolated non-ASCII garbage chars
    story = re.sub(r'\s+[^\x00-\x7f　-鿿＀-￯]+\s*$', '', story)
    # Remove "(frame NNNN)" references
    story = story.replace('fi', 'fi').replace('fl', 'fl')
    # Trim trailing whitespace
    story = story.strip()
    # Remove trailing period-less fragments if they're garbled
    if story and story[-1] not in '.!?"…”':
        # Check if last sentence is just garbled chars
        last_period = story.rfind('.')
        if last_period > 0:
            tail = story[last_period+1:].strip()
            if tail and not any(c.isalpha() for c in tail):
                story = story[:last_period+1]
    return story

fixed = 0
for kanji, entry in data.items():
    if "story" in entry:
        old = entry["story"]
        entry["story"] = final_clean(old)
        if entry["story"] != old:
            fixed += 1
            print(f"  Fixed {kanji}: ...{entry['story'][-60:]}")

print(f"\nFixed {fixed} entries")

js_out = "/* Heisig RTK1 4th Ed. data for deck kanji -- auto-extracted */\n"
js_out += "const HEISIG = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"

with open(PATH, "w", encoding="utf-8") as f:
    f.write(js_out)
print(f"Written to {PATH}")
