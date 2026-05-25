"""
Extract The Complete Guide to Japanese Kanji into markdown.
Preserves the full text organized by grade sections.

Output: nihongo/kanji-guide.md
"""
import fitz, re, os

PDF = os.path.join(os.path.dirname(__file__), "..",
    "The Complete Guide to Japanese Kanji.pdf")
OUT = os.path.join(os.path.dirname(__file__), "..", "kanji-guide.md")

doc = fitz.open(PDF)
total = len(doc)
print(f"Opened PDF: {total} pages")

# Grade sections with their page ranges (from TOC on page 7)
SECTIONS = [
    (48, 65, "The 80 First-Grade Characters"),
    (66, 104, "The 160 Second-Grade Characters"),
    (105, 153, "The 200 Third-Grade Characters"),
    (154, 208, "The 200 Fourth-Grade Characters"),
    (209, 259, "The 185 Fifth-Grade Characters"),
    (260, 306, "The 181 Sixth-Grade Characters"),
    (307, 645, "The Remaining 1130 Characters"),
    (646, 682, "Readings Index"),
]

md = []
md.append("# The Complete Guide to Japanese Kanji\n")
md.append("*Christopher Seeley & Kenneth G. Henshall — Tuttle Publishing, 2016*\n")
md.append("Auto-extracted reference for the nihongo study app.\n")
md.append("---\n")

for start_page, end_page, section_title in SECTIONS:
    md.append(f"\n## {section_title}\n")
    md.append(f"*(Pages {start_page}–{end_page})*\n")

    for page_num in range(start_page - 1, end_page):  # 0-indexed
        if page_num >= total:
            break
        page = doc[page_num]
        txt = page.get_text("text")
        if not txt.strip():
            continue

        # Clean up the text
        txt = txt.replace('\xad', '')  # soft hyphens
        txt = txt.replace('​', '')  # zero-width space

        # Add page marker
        md.append(f"\n---\n*Page {page_num + 1}*\n")
        md.append(txt.strip())
        md.append("")

    print(f"  Extracted: {section_title} (pp. {start_page}-{end_page})")

doc.close()

# Write output
content = "\n".join(md)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(content)

# Report size
size_kb = os.path.getsize(OUT) / 1024
print(f"\nWritten to {OUT} ({size_kb:.0f} KB)")
