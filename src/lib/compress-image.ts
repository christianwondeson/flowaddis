/**
 * Shrink images before Strapi upload so nginx/Strapi 413s are less likely
 * (cms.bookaddis.com nginx often caps ~1–2MB).
 */
const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_MAX_BYTES = 1.4 * 1024 * 1024;
const JPEG_QUALITY_START = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not read image'));
        };
        img.src = url;
    });
}

async function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Image encode failed'))),
            type,
            quality,
        );
    });
}

/**
 * Returns a JPEG/WebP File under ~maxBytes when possible.
 * GIFs are passed through (animation). Tiny files are unchanged.
 */
export async function compressImageForUpload(
    file: File,
    opts?: { maxEdge?: number; maxBytes?: number },
): Promise<File> {
    const maxEdge = opts?.maxEdge ?? DEFAULT_MAX_EDGE;
    const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;

    if (!file.type.startsWith('image/')) return file;
    if (file.type === 'image/gif') return file;
    if (file.size <= maxBytes && file.size < 800_000) return file;

    if (typeof document === 'undefined') return file;

    try {
        const img = await loadImage(file);
        let { width, height } = img;
        const scale = Math.min(1, maxEdge / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;
        ctx.drawImage(img, 0, 0, width, height);

        const outType =
            file.type === 'image/png' || file.type === 'image/webp'
                ? 'image/webp'
                : 'image/jpeg';

        let quality = JPEG_QUALITY_START;
        let blob = await canvasToBlob(canvas, outType, quality);
        while (blob.size > maxBytes && quality > 0.45) {
            quality -= 0.1;
            blob = await canvasToBlob(canvas, outType, quality);
        }

        // Still huge  downscale further
        if (blob.size > maxBytes) {
            const shrink = Math.sqrt(maxBytes / blob.size);
            canvas.width = Math.max(1, Math.round(width * shrink));
            canvas.height = Math.max(1, Math.round(height * shrink));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            blob = await canvasToBlob(canvas, outType, 0.72);
        }

        if (blob.size >= file.size) return file;

        const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
        const ext = outType === 'image/webp' ? 'webp' : 'jpg';
        return new File([blob], `${base}.${ext}`, {
            type: outType,
            lastModified: Date.now(),
        });
    } catch {
        return file;
    }
}

export async function compressImagesForUpload(files: File[]): Promise<File[]> {
    return Promise.all(files.map((f) => compressImageForUpload(f)));
}
