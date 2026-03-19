
import fitz
import os

pdf_path = r"C:\Desarollo\book -cover1pdf2.pdf"
output = "bg.png"

try:
    print(f"CWD: {os.getcwd()}")
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    pix = page.get_pixmap()
    pix.save(output)
    print(f"Successfully saved {output}")
except Exception as e:
    print(f"Error: {e}")
