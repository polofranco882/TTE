
import fitz  # PyMuPDF
import sys
import os

pdf_path = r"C:\Desarollo\book -cover1pdf2.pdf"
output_path = r"cover-book1-v2.png"
final_path = r"C:\APP_WEB\TTE\frontend\src\assets\cover-book1-v2.png"

def convert_cover():
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        # fallback if file doesn't exist (for testing if user path is wrong)
        return
        
    display_path = os.path.dirname(output_path)
    if display_path and not os.path.exists(display_path):
        os.makedirs(display_path)
        
    try:
        doc = fitz.open(pdf_path)
        if doc.page_count < 1:
            print("Error: PDF has no pages")
            return
            
        page = doc.load_page(0) 
        # High quality export
        pix = page.get_pixmap() 
        pix.save(output_path)
        print(f"Saved locally to {output_path}")

        # Move to final destination
        import shutil
        shutil.move(output_path, final_path)
        print(f"Moved to {final_path}")
        
    except Exception as e:
        print(f"Error converting PDF: {e}")

if __name__ == "__main__":
    convert_cover()
