/**
 * Image Capture Utilities
 * Downloads and stores images/favicons to Supabase Storage
 * Follows PRD §7: Store metadata/thumbnails locally, not external hotlinks
 */

import crypto from 'crypto';
import path from 'path';
import { supabase as supabaseClient } from './supabase';

// Simple console logger for image capture operations
const logger = {
    info: (data: any, message: string) => console.log(`[INFO] ${message}`, data),
    warn: (data: any, message: string) => console.warn(`[WARN] ${message}`, data),
    error: (data: any, message: string) => console.error(`[ERROR] ${message}`, data)
};

interface ImageCaptureResult {
    success: boolean;
    storagePath?: string;
    publicUrl?: string;
    error?: string;
}

/**
 * Download image from URL with timeout and size limits
 */
async function downloadImage(url: string, maxSizeBytes: number = 5 * 1024 * 1024): Promise<Buffer | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Stumbleable/1.0 (+https://stumbleable.app; contact@stumbleable.app)'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            logger.warn({ url, status: response.status }, 'Failed to download image');
            return null;
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > maxSizeBytes) {
            logger.warn({ url, size: contentLength }, 'Image too large');
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
            logger.warn({ url, contentType }, 'Not an image content type');
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > maxSizeBytes) {
            logger.warn({ url, size: buffer.length }, 'Image too large after download');
            return null;
        }

        return buffer;
    } catch (error) {
        logger.error({ error, url }, 'Error downloading image');
        return null;
    }
}

/**
 * Get file extension from URL or content type
 */
function getFileExtension(url: string, contentType?: string): string {
    // Try to get from content type first
    if (contentType) {
        const ext = contentType.split('/')[1];
        if (ext && ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg+xml', 'x-icon'].includes(ext)) {
            return ext === 'svg+xml' ? 'svg' : ext === 'x-icon' ? 'ico' : ext;
        }
    }

    // Fallback to URL extension
    const urlExt = path.extname(new URL(url).pathname).toLowerCase();
    if (urlExt) {
        return urlExt.substring(1); // Remove the dot
    }

    return 'jpg'; // Default fallback
}

/**
 * Generate unique filename using content hash
 */
function generateFilename(buffer: Buffer, originalUrl: string): string {
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
    const ext = getFileExtension(originalUrl);
    return `${hash}.${ext}`;
}

/**
 * Capture and store content image to Supabase Storage
 */
export async function captureContentImage(imageUrl: string, contentId: string): Promise<ImageCaptureResult> {
    try {
        logger.info({ imageUrl, contentId }, 'Capturing content image');

        // Download image
        const imageBuffer = await downloadImage(imageUrl, 5 * 1024 * 1024); // 5MB limit
        if (!imageBuffer) {
            return { success: false, error: 'Failed to download image' };
        }

        // Generate unique filename
        const filename = generateFilename(imageBuffer, imageUrl);
        const storagePath = `content-images/${filename}`;

        // Check if already exists
        const { data: existingFile } = await supabaseClient.storage
            .from('content-images')
            .list('', { search: filename });

        if (existingFile && existingFile.length > 0) {
            logger.info({ filename }, 'Image already exists in storage, reusing');
            const { data } = supabaseClient.storage
                .from('content-images')
                .getPublicUrl(filename);

            return {
                success: true,
                storagePath: filename,
                publicUrl: data.publicUrl
            };
        }

        // Upload to Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('content-images')
            .upload(filename, imageBuffer, {
                contentType: `image/${getFileExtension(imageUrl)}`,
                cacheControl: '31536000', // 1 year cache
                upsert: false
            });

        if (error) {
            logger.error({ error, imageUrl }, 'Failed to upload image to storage');
            return { success: false, error: error.message };
        }

        // Get public URL
        const { data: publicUrlData } = supabaseClient.storage
            .from('content-images')
            .getPublicUrl(filename);

        logger.info({ storagePath: data.path, publicUrl: publicUrlData.publicUrl }, 'Image captured successfully');

        return {
            success: true,
            storagePath: data.path,
            publicUrl: publicUrlData.publicUrl
        };
    } catch (error) {
        logger.error({ error, imageUrl }, 'Unexpected error capturing image');
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Capture and store favicon to Supabase Storage
 */
export async function captureFavicon(domain: string): Promise<ImageCaptureResult> {
    try {
        logger.info({ domain }, 'Capturing favicon');

        // Try multiple favicon URLs in order of preference
        const faviconUrls = [
            `https://${domain}/favicon.ico`,
            `https://www.${domain}/favicon.ico`,
            `https://${domain}/favicon.png`,
            `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
        ];

        let faviconBuffer: Buffer | null = null;
        let workingUrl = '';

        for (const url of faviconUrls) {
            faviconBuffer = await downloadImage(url, 1 * 1024 * 1024); // 1MB limit
            if (faviconBuffer) {
                workingUrl = url;
                break;
            }
        }

        if (!faviconBuffer) {
            return { success: false, error: 'Failed to download favicon from any source' };
        }

        // Generate filename based on domain
        const domainHash = crypto.createHash('md5').update(domain).digest('hex').substring(0, 8);
        const ext = getFileExtension(workingUrl);
        const filename = `${domainHash}.${ext}`;
        const storagePath = `favicons/${filename}`;

        // Check if already exists
        const { data: existingFile } = await supabaseClient.storage
            .from('favicons')
            .list('', { search: filename });

        if (existingFile && existingFile.length > 0) {
            logger.info({ filename, domain }, 'Favicon already exists in storage, reusing');
            const { data } = supabaseClient.storage
                .from('favicons')
                .getPublicUrl(filename);

            return {
                success: true,
                storagePath: filename,
                publicUrl: data.publicUrl
            };
        }

        // Upload to Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('favicons')
            .upload(filename, faviconBuffer, {
                contentType: `image/${ext === 'ico' ? 'x-icon' : ext}`,
                cacheControl: '31536000', // 1 year cache
                upsert: false
            });

        if (error) {
            logger.error({ error, domain }, 'Failed to upload favicon to storage');
            return { success: false, error: error.message };
        }

        // Get public URL
        const { data: publicUrlData } = supabaseClient.storage
            .from('favicons')
            .getPublicUrl(filename);

        logger.info({ storagePath: data.path, publicUrl: publicUrlData.publicUrl, domain }, 'Favicon captured successfully');

        return {
            success: true,
            storagePath: data.path,
            publicUrl: publicUrlData.publicUrl
        };
    } catch (error) {
        logger.error({ error, domain }, 'Unexpected error capturing favicon');
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Capture both content image and favicon for a content submission
 */
export async function captureContentMedia(
    contentId: string,
    imageUrl: string | null,
    domain: string
): Promise<{
    imageStoragePath?: string;
    imagePublicUrl?: string;
    faviconUrl?: string;
}> {
    const results: {
        imageStoragePath?: string;
        imagePublicUrl?: string;
        faviconUrl?: string;
    } = {};

    // Capture content image if provided
    if (imageUrl) {
        const imageResult = await captureContentImage(imageUrl, contentId);
        if (imageResult.success) {
            results.imageStoragePath = imageResult.storagePath;
            results.imagePublicUrl = imageResult.publicUrl;
        }
    }

    // Capture favicon
    const faviconResult = await captureFavicon(domain);
    if (faviconResult.success) {
        results.faviconUrl = faviconResult.publicUrl;
    }

    return results;
}
