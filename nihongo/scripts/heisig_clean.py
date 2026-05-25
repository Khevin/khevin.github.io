"""
Clean up heisig-data.js:
1. Remove garbled PDF characters (single non-ASCII chars that aren't CJK)
2. Fix stories that clearly pulled wrong content
3. Trim trailing stroke-order artifacts
"""
import json, re, os

PATH = os.path.join(os.path.dirname(__file__), "..", "heisig-data.js")

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Extract the JSON object
m = re.search(r'const HEISIG = ({.*?});', content, re.DOTALL)
data = json.loads(m.group(1))

def clean_story(story):
    if not story:
        return story
    # Remove garbled single chars that aren't real content
    # These are PDF font artifacts like §¨©ª«¬ etc.
    story = re.sub(r'\s*[\x80-\xff§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]+\s*$', '', story)
    # Remove isolated garbled char sequences in brackets or at line boundaries
    story = re.sub(r'\s+[^\x00-\x7f]{1,3}\s+', ' ', story)
    # Remove trailing stroke order patterns like "[5] O P Q R S" or "[10] a b c"
    story = re.sub(r'\s*\[\d+\]\s*[A-Za-z\s§¨©ª«¬®°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝ]*$', '', story)
    # Remove "lesson XX" at the end
    story = re.sub(r'\s*lesson\s+\d+\s*$', '', story, flags=re.IGNORECASE)
    # Remove "Lesson XX" at the start of wrapped text
    story = re.sub(r'\s*Lesson\s+\d+\b.*$', '', story, flags=re.DOTALL)
    # Fix common ligatures
    story = story.replace('ﬁ', 'fi').replace('ﬂ', 'fl')
    # Fix PDF-specific "fi" -> "³" artifacts
    story = story.replace('³', 'fi').replace('µ', 'fl')
    # Clean up extra whitespace
    story = re.sub(r'\s+', ' ', story).strip()
    # Truncate very long stories
    if len(story) > 350:
        # Cut at last sentence boundary before 350
        cut = story[:350].rfind('.')
        if cut > 200:
            story = story[:cut+1]
        else:
            story = story[:347] + "..."
    return story

# Stories that are clearly wrong (pulled from nearby book text)
BAD_STORIES = {
    "日": True,   # Got the book introduction instead
    "口": True,   # Got book preface text
    "木": True,   # Got shellfish story (wrong frame match)
    "本": True,   # Got cavity/dentist story (wrong frame match)
    "林": True,   # Got tribute/tax story (wrong frame match)
    "森": True,   # Got paragraph story (wrong frame match)
    "体": True,   # Got cocoon/child story (wrong for 体)
    "姉": True,   # Got market story (same frame as 市??!)
}

# Replace with correct concise stories from Heisig
CORRECT_STORIES = {
    "日": "This character is meant to represent the sun. Recalling an old TV set, the arrow running through it can be seen as an aerial. [4]",
    "口": "Like a squared-off O, this kanji is a pictograph of the mouth. [3]",
    "木": "A pictograph of a tree: the trunk running through the center with branches at the top and roots at the bottom. [4]",
    "本": "The arrow at the root of the tree (木) points to the 'root' or 'origin' of a book. [5]",
    "林": "Two trees side by side = a grove of trees. [8]",
    "森": "Three trees stacked = a dense forest. [12]",
    "体": "A person (イ) next to a book/origin (本): the 'body' is the root of a person. [7]",
    "姉": "A woman (女) who is in the marketplace (市) = elder sister. [8]",
}

for kanji, entry in data.items():
    if "story" in entry:
        if kanji in BAD_STORIES:
            entry["story"] = CORRECT_STORIES.get(kanji, entry["story"])
        else:
            entry["story"] = clean_story(entry["story"])
        # Remove empty stories
        if not entry["story"] or len(entry["story"]) < 15:
            del entry["story"]

# Verify we still have 書
assert "書" in data, "Missing 書!"
print(f"書: frame={data['書']['frame']}, keyword={data['書']['keyword']}")
if "story" in data["書"]:
    print(f"  story: {data['書']['story'][:100]}...")

# Count stories
with_story = sum(1 for e in data.values() if "story" in e)
print(f"\n{len(data)} entries, {with_story} with stories")

# Write cleaned output
js_out = "/* Heisig RTK1 4th Ed. data for deck kanji -- auto-extracted */\n"
js_out += "const HEISIG = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"

with open(PATH, "w", encoding="utf-8") as f:
    f.write(js_out)

print(f"Cleaned and written to {PATH}")
