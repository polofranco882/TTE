export interface OptimizeResult {
    base64: string;
    mimeType: string;
    size: number;
    width: number;
    height: number;
}

export const optimizeImageFile = (
    file: File, 
    maxWidth: number = 1920, 
    maxHeight: number = 1080, 
    quality: number = 0.8
): Promise<OptimizeResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate the new dimensions while maintaining aspect ratio
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export as WebP for optimal compression
                const outputMime = 'image/webp';
                const base64Data = canvas.toDataURL(outputMime, quality);
                
                // Calculate approximate Base64 string payload size in bytes
                const sizeInBytes = Math.round((base64Data.length * 3) / 4);

                resolve({
                    base64: base64Data,
                    mimeType: outputMime,
                    size: sizeInBytes,
                    width,
                    height
                });
            };
            
            img.onerror = () => reject(new Error('Failed to load image for optimization'));
            if (event.target?.result) {
                img.src = event.target.result as string;
            } else {
                reject(new Error('File reader failed to read result'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};
