'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, RefreshCw, CheckCircle2, AlertCircle, FileImage, Image as ImageIcon } from 'lucide-react';
import {
  validateImageFile,
  uploadStorageImage,
  replaceStorageImage,
  deleteStorageImage,
} from '@/lib/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type UploadState = 'IDLE' | 'SELECTED' | 'VALIDATING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';

export interface ImageUploaderValue {
  imageUrl: string;
  imagePath: string;
  imageAlt?: string;
  pendingFile?: File | null;
}

export interface ImageUploaderProps {
  value?: string; // current imageUrl
  imagePath?: string; // current imagePath
  imageAlt?: string; // current imageAlt
  onChange?: (val: ImageUploaderValue) => void;
  onRemove?: () => void;
  folder?: string; // e.g. 'products', 'categories', 'business'
  entityId?: string;
  label?: string; // e.g. "Product Image", "Category Image", "Business Logo"
  description?: string;
  disabled?: boolean;
  showAltInput?: boolean;
  autoUpload?: boolean;
  className?: string;
}

export function ImageUploader({
  value = '',
  imagePath = '',
  imageAlt = '',
  onChange,
  onRemove,
  folder = 'products',
  entityId,
  label = 'Image',
  description = 'JPG, PNG, WEBP up to 5MB',
  disabled = false,
  showAltInput = true,
  autoUpload = true,
  className = '',
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(value);
  const [currentPath, setCurrentPath] = useState<string>(imagePath);
  const [altText, setAltText] = useState<string>(imageAlt);
  const [uploadState, setUploadState] = useState<UploadState>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; sizeFormatted: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when external props change (e.g. form reset or editing another item)
  useEffect(() => {
    setImageUrl(value);
    setCurrentPath(imagePath);
    setAltText(imageAlt);
    if (!value) {
      setFileMeta(null);
      setUploadState('IDLE');
      setStatusMessage('');
    }
  }, [value, imagePath, imageAlt]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFileSelect = async (file: File) => {
    if (disabled || uploadState === 'UPLOADING') return;

    setUploadState('VALIDATING');
    setStatusMessage('Validating image file...');

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadState('ERROR');
      setStatusMessage(validation.message || 'Please upload a JPG, PNG, or WEBP image under 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileMeta({
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
    });

    if (!autoUpload) {
      // Local preview mode
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      setUploadState('SELECTED');
      setStatusMessage('Image selected. Click Save to complete upload.');
      onChange?.({
        imageUrl: localUrl,
        imagePath: '',
        imageAlt: altText || file.name.replace(/\.[^/.]+$/, ''),
        pendingFile: file,
      });
      return;
    }

    try {
      setUploadState('UPLOADING');
      setStatusMessage('Optimizing & uploading image to Supabase Storage...');

      let result;
      if (currentPath) {
        result = await replaceStorageImage(file, folder, entityId, currentPath);
      } else {
        result = await uploadStorageImage(file, folder, entityId);
      }

      setImageUrl(result.imageUrl);
      setCurrentPath(result.imagePath);
      setUploadState('SUCCESS');
      setStatusMessage(`${label} uploaded successfully!`);

      const computedAlt = altText || file.name.replace(/\.[^/.]+$/, '');
      onChange?.({
        imageUrl: result.imageUrl,
        imagePath: result.imagePath,
        imageAlt: computedAlt,
        pendingFile: null,
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      const msg = err.message || 'Unable to upload image. Please try again.';
      setUploadState('ERROR');

      // Create fallback object URL so user can complete form even if storage RLS blocks upload
      const localPreviewUrl = URL.createObjectURL(file);
      setImageUrl(localPreviewUrl);
      const computedAlt = altText || file.name.replace(/\.[^/.]+$/, '');
      onChange?.({
        imageUrl: localPreviewUrl,
        imagePath: '',
        imageAlt: computedAlt,
        pendingFile: file,
      });
      setStatusMessage(`Storage upload notice: Using local preview. (${msg})`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileSelect(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = async () => {
    if (disabled || uploadState === 'UPLOADING') return;

    if (currentPath && autoUpload) {
      try {
        setStatusMessage('Removing image from storage...');
        await deleteStorageImage(currentPath);
      } catch (err) {
        console.warn('Failed to delete storage file:', err);
      }
    }

    setImageUrl('');
    setCurrentPath('');
    setAltText('');
    setFileMeta(null);
    setUploadState('IDLE');
    setStatusMessage('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onChange?.({ imageUrl: '', imagePath: '', imageAlt: '', pendingFile: null });
    onRemove?.();
  };

  const handleExternalUrlChange = (url: string) => {
    setImageUrl(url);
    setCurrentPath('');
    onChange?.({ imageUrl: url, imagePath: '', imageAlt: altText, pendingFile: null });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploadState === 'UPLOADING'}
        aria-label={`Upload ${label}`}
      />

      {/* STATUS BANNER */}
      {statusMessage && (
        <div
          className={`flex items-center space-x-2 p-3 rounded-xl text-xs font-medium ${
            uploadState === 'ERROR'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : uploadState === 'SUCCESS'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {uploadState === 'ERROR' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          {uploadState === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {(uploadState === 'UPLOADING' || uploadState === 'VALIDATING') && (
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* IMAGE PREVIEW CARD OR UPLOAD DROP ZONE */}
      {imageUrl ? (
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* THUMBNAIL */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-sm flex items-center justify-center">
              <Image
                src={imageUrl}
                alt={altText || label || 'Image Preview'}
                fill
                className="object-contain p-2"
                unoptimized
                onError={() => setImageUrl('')}
              />
            </div>

            {/* METADATA & ACTIONS */}
            <div className="flex-1 space-y-2 text-center sm:text-left min-w-0">
              <h4 className="text-xs font-bold text-navy-950 flex items-center justify-center sm:justify-start gap-1.5 truncate">
                <FileImage className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="truncate">{fileMeta?.name || `${label} Preview`}</span>
              </h4>

              {fileMeta && (
                <p className="text-[11px] text-slate-500 font-mono">Optimized WebP • {fileMeta.sizeFormatted}</p>
              )}

              {currentPath && (
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">
                  Path: {currentPath}
                </p>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploadState === 'UPLOADING'}
                  aria-label="Replace image"
                  className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-slate-200 hover:bg-slate-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Image</span>
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={disabled || uploadState === 'UPLOADING'}
                  aria-label="Remove image"
                  className="h-8 text-xs font-semibold gap-1.5 rounded-xl"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ALT TEXT INPUT */}
          {showAltInput && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Image Alt Text (SEO Description)
              </label>
              <Input
                type="text"
                placeholder={`Describe ${label.toLowerCase()} for accessibility...`}
                value={altText}
                onChange={e => {
                  setAltText(e.target.value);
                  onChange?.({ imageUrl, imagePath: currentPath, imageAlt: e.target.value });
                }}
                disabled={disabled || uploadState === 'UPLOADING'}
                className="text-xs h-8 rounded-xl bg-white border-slate-200"
              />
            </div>
          )}
        </div>
      ) : (
        /* DRAG & DROP UPLOAD ZONE */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={`Upload ${label}`}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            dragActive
              ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-400'
          } ${disabled || uploadState === 'UPLOADING' ? 'pointer-events-none opacity-60' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-sm border border-brand-100">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy-950">
                {dragActive ? 'Drop image here' : `Upload ${label}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Drag & drop image here or <span className="text-brand-600 font-semibold underline">Browse Files</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{description}</p>
            </div>
          </div>
        </div>
      )}

      {/* EXTERNAL IMAGE URL FALLBACK */}
      {!currentPath && !imageUrl && (
        <div className="pt-2">
          <details className="text-[11px] text-slate-500 cursor-pointer">
            <summary className="font-semibold hover:text-brand-600 transition">Or paste external image URL</summary>
            <div className="mt-2 flex gap-2">
              <Input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={e => handleExternalUrlChange(e.target.value)}
                disabled={disabled || uploadState === 'UPLOADING'}
                className="text-xs h-8 rounded-xl bg-white border-slate-200"
              />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
