"""Debug: dump the first grade kanji pages to understand entry structure."""
import fitz, os

PDF = os.path.join(os.path.dirname(__file__), "..",
    "The Complete Guide to Japanese Kanji.pdf")

doc = fitz.open(PDF)

# Page 48 = index 47 in 0-based. Let's check pages 47-55
for i in range(47, 58):
    page = doc[i]
    txt = page.get_text("text")
    if txt.strip():
        print(f"\n{'='*70}")
        print(f"PAGE {i+1}")
        print(f"{'='*70}")
        print(txt[:4000])

doc.close()
