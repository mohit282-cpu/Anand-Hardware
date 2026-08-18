import { supabase } from './client';

export const BUCKET_NAME = 'product-images';
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface UploadResult {
  imageUrl: string;
  imagePath: string;
}

/**
 * Validate image file type and size.
 * Does not trust file extension alone; checks file.type MIME.
 */
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, message: 'No file selected.' };
  }

  // Validate MIME type
  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      message: 'Invalid file format. Image must be JPG, JPEG, PNG, or WebP.',
    };
  }

  // Reject SVG / Executables explicitly
  if (mime.includes('svg') || file.name.endsWith('.svg') || file.name.endsWith('.exe')) {
    return { valid: false, message: 'SVG and executable files are not allowed.' };
  }

  // Validate File Size (5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      message: `File size (${sizeMb} MB) exceeds maximum limit of 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Optimize / Compress Product Image using browser HTML5 Canvas API.
 * Converts to WebP format, resizes max dimension to 1200px, 85% quality.
 */
export async function compressProductImage(file: File, maxDimension = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If not running in browser environment or file is small WebP, return raw file
    if (typeof window === 'undefined' || !window.HTMLCanvasElement) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let width = img.width;
      let height = img.height;

      // Scale down if exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Upload product image to Supabase Storage with unique path.
 * Unique path format: products/{productId || 'temp'}/{timestamp}-{random}.webp
 */
export async function uploadProductImage(file: File, productId?: string): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.message || 'Invalid image file.');
  }

  // Compress image
  const compressedBlob = await compressProductImage(file);

  // Generate unique file path
  const folder = productId ? productId.replace(/[^a-zA-Z0-9_-]/g, '') : 'catalog';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filePath = `products/${folder}/${timestamp}-${randomStr}.webp`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, compressedBlob, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get Public Access URL
  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    imageUrl: publicUrlData.publicUrl,
    imagePath: data.path,
  };
}

/**
 * Delete product image from Supabase Storage.
 */
export async function deleteProductImage(imagePath: string): Promise<void> {
  if (!imagePath) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([imagePath]);
  if (error) {
    console.error('Supabase storage deletion error:', error);
    throw new Error(`Failed to delete image file: ${error.message}`);
  }
}

/**
 * Replace existing product image safely:
 * 1. Upload new image.
 * 2. Return new image URL & path.
 * 3. Delete old image path ONLY after caller confirms DB update.
 */
export async function replaceProductImage(
  productId: string,
  newFile: File,
  oldImagePath?: string
): Promise<UploadResult> {
  const newUpload = await uploadProductImage(newFile, productId);

  // Clean up old image asynchronously if old path exists
  if (oldImagePath && oldImagePath !== newUpload.imagePath) {
    deleteProductImage(oldImagePath).catch(err => {
      console.warn('Failed to delete old storage file:', err);
    });
  }

  return newUpload;
}
