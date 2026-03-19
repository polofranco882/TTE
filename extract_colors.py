
import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    from PIL import Image
except ImportError:
    install('Pillow')
    from PIL import Image

try:
    from sklearn.cluster import KMeans
except ImportError:
    install('scikit-learn')
    from sklearn.cluster import KMeans

import numpy as np

def extract_colors(image_path, n_colors=5):
    try:
        image = Image.open(image_path)
        image = image.resize((150, 150))  # Resize for faster processing
        img_array = np.array(image)
        # Reshape to list of pixels (h*w, 3) if RGB or (h*w, 4) if RGBA
        if img_array.shape[2] == 4:
            img_array = img_array[:, :, :3]
        
        pixels = img_array.reshape(-1, 3)

        kmeans = KMeans(n_clusters=n_colors, random_state=42)
        kmeans.fit(pixels)
        
        colors = kmeans.cluster_centers_
        hex_colors = ['#{:02x}{:02x}{:02x}'.format(int(c[0]), int(c[1]), int(c[2])) for c in colors]
        return hex_colors
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    image_path = r"C:\Users\user\.gemini\antigravity\brain\2a8f296a-832a-4709-9e55-0847ae9b9326\coloresTTE.png"
    print(extract_colors(image_path))
