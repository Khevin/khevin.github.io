"""Debug: dump pages from The Complete Guide to Japanese Kanji to understand structure."""
import fitz, os, sys

PDF = os.path.join(os.path.dirname(__file__), "..",
    "The Complete Guide to Japanese Kanji.pdf")

doc = fitz.open(PDF)
print(f"Total pages: {len(doc)}")

# Dump first few content pages to understand format
for i in range(0, 30):
    page = doc[i]
    txt = page.get_text("text")
    if txt.strip():
        print(f"\n{'='*70}")
        print(f"PAGE {i+1}")
        print(f"{'='*70}")
        # Encode safely for Windows console
        safe = txt[:3000].encode('ascii', 'replace').decode('ascii')
        print(safe)
doc.close()
