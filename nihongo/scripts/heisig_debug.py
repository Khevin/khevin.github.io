"""Debug: dump a few pages of the Heisig PDF to see what text extraction yields."""
import fitz, os

PDF = os.path.join(os.path.dirname(__file__), "..",
    "James W. Heisig - Remembering Kanji 4º Edition - Vol 1.pdf")

doc = fitz.open(PDF)
# Dump pages 30-50 (where kanji entries typically start)
for i in range(25, 55):
    page = doc[i]
    txt = page.get_text("text")
    if txt.strip():
        print(f"\n{'='*60}")
        print(f"PAGE {i+1}")
        print(f"{'='*60}")
        print(txt[:2000])
doc.close()
