
import os

pdf_path = r"C:\Desarollo\book -cover1pdf2.pdf"
output_path = r"C:\APP_WEB\TTE\frontend\public\assets\bg-login.png"

print(f"Checking PDF Path: {pdf_path}")
if os.path.exists(pdf_path):
    print("PDF EXISTS")
else:
    print("PDF NOT FOUND")

print(f"Checking Output Path Dir: {os.path.dirname(output_path)}")
if os.path.exists(os.path.dirname(output_path)):
    print("OUTPUT DIR EXISTS")
else:
    print("OUTPUT DIR NOT FOUND")
    
# Check specific directory listing
parent_dir = r"C:\Desarollo"
if os.path.exists(parent_dir):
    print(f"Listing {parent_dir}:")
    for f in os.listdir(parent_dir):
        if "cover1" in f:
            print(f"Found candidate: {f}")
else:
    print(f"Parent dir {parent_dir} NOT FOUND")
