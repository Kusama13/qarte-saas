'use client';

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1, // Max 1MB after compression
  maxWidthOrHeight: 1920, // Max dimension
  useWebWorker: true, // Use web worker for non-blocking
};

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const mergedOptions = { ...defaultOptions, ...options };

  // Skip compression for small files (< 500KB) and non-compressible formats
  if (file.size < 500 * 1024) {
    return file;
  }

  // Skip compression for GIFs (to preserve animation)
  if (file.type === 'image/gif') {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: mergedOptions.useWebWorker,
    });

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed, using original:', error);
    return file;
  }
}

/**
 * Compress an image for logo upload (smaller max size)
 */
export async function compressLogo(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5, // 500KB max for logos
    maxWidthOrHeight: 512, // Logos don't need to be huge
  });
}

/**
 * Compress an image for offer/marketing images
 */
export async function compressOfferImage(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 1, // 1MB max for offer images
    maxWidthOrHeight: 1200,
  });
}
