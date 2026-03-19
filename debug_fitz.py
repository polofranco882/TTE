
try:
    import fitz
    print(f"Fitz File: {fitz.__file__}")
    print(f"Fitz Dir: {dir(fitz)}")
    print(f"Fitz Version: {fitz.__doc__}")
except Exception as e:
    print(e)
