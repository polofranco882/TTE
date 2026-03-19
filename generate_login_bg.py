
import fitz
import os
import sys

# Configuration
# Correcting the extension from .pdgf to .pdf
pdf_source = r"C:\Desarollo\book -cover1pdf2.pdf"
output_dir = r"C:\APP_WEB\TTE\frontend\src\assets"
output_filename = "final-login-bg.png"
output_path = os.path.join(output_dir, output_filename)

print(f"Source PDF: {pdf_source}")
print(f"Output Path: {output_path}")

# 1. Verify Source Exists
if not os.path.exists(pdf_source):
    print(f"ERROR: Source file not found: {pdf_source}")
    # Try case insensitive search or fuzzy match if needed, but for now strict.
    sys.exit(1)

# 2. Ensure Output Directory Exists
if not os.path.exists(output_dir):
    print(f"Creating output directory: {output_dir}")
    try:
        os.makedirs(output_dir)
    except Exception as e:
        print(f"ERROR creating directory: {e}")
        sys.exit(1)

# 3. Convert and Save
try:
    print("Opening PDF...")
    doc = fitz.open(pdf_source)
    if doc.page_count < 1:
        print("ERROR: PDF has no pages.")
        sys.exit(1)
        
    page = doc.load_page(0)
    print("Rendering page...")
    pix = page.get_pixmap() # Default resolution
    
    # Save locally first to avoid path issues with C bindings
    local_output = "temp_login_bg.png"
    print(f"Saving locally to {local_output}...")
    pix.save(local_output)
    
    # Move to final destination
    print(f"Moving to {output_path}...")
    import shutil
    if os.path.exists(output_path):
        os.remove(output_path)
    shutil.move(local_output, output_path)
    print("SUCCESS: Image generated and moved.")
    
except Exception as e:
    print(f"ERROR during conversion: {e}")
    sys.exit(1)
