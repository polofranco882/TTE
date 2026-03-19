
import fitz
import os
import shutil
import sys

# Paths
pdf_path = r"C:\Desarollo\book -cover1pdf2.pdf"
cwd_output = "final-login-bg.png"
final_output_dir = r"C:\APP_WEB\TTE\frontend\public\assets"
final_output_path = os.path.join(final_output_dir, "final-login-bg.png")

print(f"PDF Path: {pdf_path}")
print(f"Final Output Dir: {final_output_dir}")
print(f"Final Output Path: {final_output_path}")

# Check PDF
if not os.path.exists(pdf_path):
    print("ERROR: PDF path does not exist!")
    sys.exit(1)

# Create Dir
if not os.path.exists(final_output_dir):
    print(f"Creating directory: {final_output_dir}")
    try:
        os.makedirs(final_output_dir)
    except Exception as e:
        print(f"Error creating directory: {e}")
        # Try to continue?
else:
    print("Directory exists.")

# Convert
print("Converting PDF...")
try:
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    pix = page.get_pixmap()
    pix.save(cwd_output)
    print(f"Saved locally to {cwd_output}")
    doc.close()
except Exception as e:
    print(f"Conversion Error: {e}")
    sys.exit(1)

# Copy
print(f"Copying to {final_output_path}...")
try:
    shutil.copy(cwd_output, final_output_path)
    print("Copy successful!")
except Exception as e:
    print(f"Copy Error: {e}")
    sys.exit(1)

print("DONE.")
