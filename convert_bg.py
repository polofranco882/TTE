
import fitz  # PyMuPDF
import sys
import os

pdf_path = r"C:\Desarollo\book -cover1pdf2.pdf"
output_path = r"final-login-bg.png"
final_path = r"C:\APP_WEB\TTE\frontend\src\assets\final-login-bg.png"

def convert_pdf_to_png():
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        sys.exit(1)
        
    display_path = os.path.dirname(output_path)
    if display_path and not os.path.exists(display_path):
        os.makedirs(display_path)

    try:
        doc = fitz.open(pdf_path)
        if doc.page_count < 1:
            print("Error: PDF has no pages")
            return
            
        page = doc.load_page(0)  # first page
        pix = page.get_pixmap() # 2x zoom for better quality
        pix.save(output_path)
        print(f"Saved locally to {output_path}")
        
        # Ensure destination directory exists
        final_dir = os.path.dirname(final_path)
        if not os.path.exists(final_dir):
            os.makedirs(final_dir)
            
        # Move to final destination
        import shutil
        if os.path.exists(final_path):
            os.remove(final_path)
        shutil.move(output_path, final_path)
        print(f"Moved to {final_path}")
        
    except Exception as e:
        print(f"Error converting PDF: {e}")
        sys.exit(1)

if __name__ == "__main__":
    convert_pdf_to_png()
