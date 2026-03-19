export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        // needed to avoid cross-origin issues on canvas extraction
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { width: number; height: number; x: number; y: number },
    rotation = 0
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return "";
    }

    // set canvas size to match the image
    canvas.width = image.width;
    canvas.height = image.height;

    // Put image on canvas
    ctx.translate(image.width / 2, image.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
        return "";
    }

    // Set cropped canvas to the cropped size
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    // Draw the cropped portion from original canvas to the new one
    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // As Blob to base64 or blob URL
    return new Promise((resolve) => {
        croppedCanvas.toBlob((file) => {
            if (file) {
                // Returns a Blob URL. It can be uploaded to server or directly placed in src.
                // For long term persistence, reading as DataURL is safer for JSON files.
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
            } else {
                resolve("");
            }
        }, 'image/png');
    });
}
