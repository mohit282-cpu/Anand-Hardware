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
      message: 'Please upload a JPG, PNG, or WEBP image under 5MB.',
    };
  }

  // Reject SVG / Executables / ZIP explicitly
  if (
    mime.includes('svg') ||
    file.name.endsWith('.svg') ||
    file.name.endsWith('.exe') ||
    file.name.endsWith('.zip') ||
    file.name.endsWith('.pdf')
  ) {
    return { valid: false, message: 'Please upload a JPG, PNG, or WEBP image under 5MB.' };
  }

  // Validate File Size (5 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      message: `Image is too large (${sizeMb} MB). Maximum size is 5MB.`,
    };
  }

  return { valid: true };
}

/**
 * Optimize / Compress Product Image using browser HTML5 Canvas API.
 * Converts to WebP format, resizes max dimension to 1200px, 85% quality.
 */
export async function compressProductImage(file: File, maxDimension = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
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
 * Ensure storage bucket 'product-images' exists in Supabase.
 * Attempts automatic creation if missing.
 */
export async function ensureBucketExists(bucketName = BUCKET_NAME): Promise<boolean> {
  try {
    const { data: bucket, error: getErr } = await supabase.storage.getBucket(bucketName);
    if (!bucket || getErr) {
      const { error: createErr } = await supabase.storage.createBucket(bucketName, {
        public: true,
      });
      if (createErr) {
        console.warn(`Bucket '${bucketName}' auto-creation failed:`, createErr.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('Bucket check error:', err);
    return false;
  }
}

/**
 * Generic upload image function for any folder (products, categories, business, etc.)
 */
export async function uploadStorageImage(
  file: File,
  folder = 'products',
  entityId?: string
): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.message || 'Invalid image file.');
  }

  // Compress image
  const compressedBlob = await compressProductImage(file);

  // Generate unique file path
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
  const subFolder = entityId ? entityId.replace(/[^a-zA-Z0-9_-]/g, '') : 'general';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filePath = `${sanitizedFolder}/${subFolder}/${timestamp}-${randomStr}.webp`;

  // Attempt 1: Direct Upload
  let { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, compressedBlob, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: true,
  });

  // If Bucket Not Found, attempt automatic creation and retry
  if (error && (error.message?.toLowerCase().includes('bucket not found') || (error as any).statusCode === 404)) {
    console.warn(`Bucket ${BUCKET_NAME} not found. Attempting automatic creation...`);
    await ensureBucketExists(BUCKET_NAME);

    const retry = await supabase.storage.from(BUCKET_NAME).upload(filePath, compressedBlob, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: true,
    });

    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    console.error('Supabase storage upload error:', error);
    const errMsg = error?.message || `Bucket ${BUCKET_NAME} not found.`;

    if (errMsg.toLowerCase().includes('bucket not found')) {
      throw new Error(
        `Bucket '${BUCKET_NAME}' does not exist in Supabase Storage. Please execute supabase/schema.sql or create a public bucket named '${BUCKET_NAME}' in your Supabase Dashboard under Storage -> New Bucket.`
      );
    }
    throw new Error(`Failed to upload image: ${errMsg}`);
  }

  // Get Public Access URL
  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    imageUrl: publicUrlData.publicUrl,
    imagePath: data.path,
  };
}

/**
 * Upload product image to Supabase Storage (backward compatible wrapper).
 */
export async function uploadProductImage(file: File, productId?: string): Promise<UploadResult> {
  return uploadStorageImage(file, 'products', productId);
}

/**
 * Delete image from Supabase Storage.
 */
export async function deleteProductImage(imagePath: string): Promise<void> {
  if (!imagePath) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([imagePath]);
  if (error) {
    console.error('Supabase storage deletion error:', error);
    throw new Error(`Failed to delete image file: ${error.message}`);
  }
}

export const deleteStorageImage = deleteProductImage;

/**
 * Replace existing image safely:
 * 1. Upload new image.
 * 2. Return new image URL & path.
 * 3. Clean up old image path if provided.
 */
export async function replaceStorageImage(
  file: File,
  folder = 'products',
  entityId?: string,
  oldImagePath?: string
): Promise<UploadResult> {
  const newUpload = await uploadStorageImage(file, folder, entityId);

  // Clean up old image asynchronously if old path exists and differs
  if (oldImagePath && oldImagePath !== newUpload.imagePath) {
    deleteStorageImage(oldImagePath).catch(err => {
      console.warn('Failed to delete old storage file:', err);
    });
  }

  return newUpload;
}

export async function replaceProductImage(
  productId: string,
  newFile: File,
  oldImagePath?: string
): Promise<UploadResult> {
  return replaceStorageImage(newFile, 'products', productId, oldImagePath);
}
