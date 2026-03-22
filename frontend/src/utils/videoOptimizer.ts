/**
 * Video Optimizer Utility
 * 
 * Reads a video file and converts it to base64 for storage in media_assets.
 * Also extracts a thumbnail frame from the video for preview purposes.
 * 
 * NOTE: Videos are stored as base64 in the DB (same as images).
 * Recommended max size: ~50MB (larger files should use external hosting).
 */

export interface VideoOptimizeResult {
    base64: string;          // base64-encoded video content (data:video/mp4;base64,...)
    mimeType: string;        // e.g. 'video/mp4'
    size: number;            // approximate byte size
    thumbnailBase64: string; // WebP thumbnail extracted from first frame
    duration?: number;       // duration in seconds (if detectable)
    width?: number;
    height?: number;
}

const MAX_VIDEO_SIZE_MB = 50;

/** Convert a video file to base64 + extract a thumbnail frame */
export function optimizeVideoFile(file: File): Promise<VideoOptimizeResult> {
    return new Promise((resolve, reject) => {
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
            reject(new Error(`Video file too large (${fileSizeMB.toFixed(1)}MB). Max is ${MAX_VIDEO_SIZE_MB}MB. Use a YouTube/external URL for large videos.`));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read video file'));
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (!base64) { reject(new Error('Video read failed')); return; }

            // Extract thumbnail from first video frame using a hidden <video> element
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;
            video.src = base64;

            const onError = () => {
                // Couldn't extract thumbnail, return without it
                resolve({
                    base64,
                    mimeType: file.type || 'video/mp4',
                    size: Math.round((base64.length * 3) / 4),
                    thumbnailBase64: '',
                });
            };

            video.onerror = onError;
            video.onloadedmetadata = () => {
                video.currentTime = 0.5; // Seek to 0.5s for thumbnail
            };

            video.onseeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width  = Math.min(video.videoWidth,  1280);
                    canvas.height = Math.min(video.videoHeight, 720);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { resolve({ base64, mimeType: file.type, size: file.size, thumbnailBase64: '' }); return; }
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const thumbnailBase64 = canvas.toDataURL('image/webp', 0.8);
                    video.src = '';
                    resolve({
                        base64,
                        mimeType: file.type || 'video/mp4',
                        size: Math.round((base64.length * 3) / 4),
                        thumbnailBase64,
                        duration: Math.round(video.duration),
                        width: video.videoWidth,
                        height: video.videoHeight,
                    });
                } catch (e) {
                    onError();
                }
            };

            // Fallback if seeked never fires (browser restriction)
            setTimeout(() => {
                if (video.readyState < 2) onError();
            }, 5000);
        };
        reader.readAsDataURL(file);
    });
}
