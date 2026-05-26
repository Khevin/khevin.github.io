"""Print PDF lines around known frames to figure out the actual layout."""
import fitz, os, re, sys
ROOT = os.path.join(os.path.dirname(__file__), "..")
PDF  = os.path.join(ROOT, "James W. Heisig - Remembering Kanji 4º Edition - Vol 1.pdf")
doc = fitz.open(PDF)
lines = []
for page in doc:
    for line in page.get_text("text").split("\n"):
        lines.append(line)
doc.close()
print(f"total lines: {len(lines)}\n")

# Show every line in the entire PDF where the bare number "678" appears
# (frame for 鼻). Show a context window.
targets = sys.argv[1:] if len(sys.argv) > 1 else ["678", "83", "92", "767"]
for t in targets:
    print(f"=== Lines matching '{t}' (exact) ===")
    for i, ln in enumerate(lines):
        if ln.strip() == t:
            ctx = lines[max(0, i-3):i+10]
            print(f"  @line {i}:")
            for j, c in enumerate(ctx, start=max(0, i-3)):
                marker = ">>" if j == i else "  "
                print(f"   {marker} {j:5d}: {repr(c)}")
            print()
