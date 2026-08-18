'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, RefreshCw, CheckCircle2, AlertCircle, FileImage, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, uploadProductImage, replaceProductImage, deleteProductImage } from '@/lib/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type UploadState = 'IDLE' | 'SELECTED' | 'VALIDATING' | 'UPLOADING' | 'SAVING' | 'SUCCESS' | 'ERROR';

interface ProductImageUploadProps {
  productId?: string;
  currentImageUrl?: string;
  currentImagePath?: string;
  currentImageAlt?: string;
  onImageChange: (data: { imageUrl: string; imagePath: string; imageAlt?: string }) => void;
  disabled?: boolean;
}

export function ProductImageUpload({
  productId,
  currentImageUrl = '',
  currentImagePath = '',
  currentImageAlt = '',
  onImageChange,
  disabled = false,
}: ProductImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>(currentImageUrl);
  const [imagePath, setImagePath] = useState<string>(currentImagePath);
  const [imageAlt, setImageAlt] = useState<string>(currentImageAlt);
  const [uploadState, setUploadState] = useState<UploadState>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; sizeFormatted: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setStatusMessage(validation.message || 'Invalid image file.');
      return;
    }

    setSelectedFileMeta({
      name: file.name,
      sizeFormatted: formatFileSize(file.size),
    });

    try {
      setUploadState('UPLOADING');
      setStatusMessage('Optimizing & uploading image to Supabase Storage...');

      let result;
      if (imagePath && productId) {
        result = await replaceProductImage(productId, file, imagePath);
      } else {
        result = await uploadProductImage(file, productId);
      }

      setImageUrl(result.imageUrl);
      setImagePath(result.imagePath);
      setUploadState('SUCCESS');
      setStatusMessage('Product image uploaded successfully!');

      onImageChange({
        imageUrl: result.imageUrl,
        imagePath: result.imagePath,
        imageAlt: imageAlt || file.name.replace(/\.[^/.]+$/, ''),
      });
    } catch (err: any) {
      console.error('Image upload failed:', err);
      const msg = err.message || 'Unable to upload image.';
      setUploadState('ERROR');

      if (msg.includes('product-images') || msg.includes('Bucket') || msg.includes('row-level security') || msg.includes('policy')) {
        // Create local object URL fallback so user can still preview image
        const localPreviewUrl = URL.createObjectURL(file);
        setImageUrl(localPreviewUrl);
        onImageChange({
          imageUrl: localPreviewUrl,
          imagePath: '',
          imageAlt: imageAlt || file.name.replace(/\.[^/.]+$/, ''),
        });
        setStatusMessage(`Storage RLS policy block detected. Using local preview. To allow storage uploads, run SQL storage policy from supabase/schema.sql in Supabase SQL Editor.`);
      } else {
        setStatusMessage(msg);
      }
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

    if (imagePath) {
      try {
        setStatusMessage('Removing image from storage...');
        await deleteProductImage(imagePath);
      } catch (err) {
        console.warn('Failed to delete storage file:', err);
      }
    }

    setImageUrl('');
    setImagePath('');
    setImageAlt('');
    setSelectedFileMeta(null);
    setUploadState('IDLE');
    setStatusMessage('');

    onImageChange({ imageUrl: '', imagePath: '', imageAlt: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExternalUrlChange = (url: string) => {
    setImageUrl(url);
    onImageChange({ imageUrl: url, imagePath: '', imageAlt });
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploadState === 'UPLOADING'}
      />

      {/* STATUS BANNER */}
      {statusMessage && (
        <div
          className={`flex items-center space-x-2 p-3 rounded-lg text-sm font-medium ${
            uploadState === 'ERROR'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : uploadState === 'SUCCESS'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {uploadState === 'ERROR' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {uploadState === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {(uploadState === 'UPLOADING' || uploadState === 'VALIDATING') && (
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* IMAGE PREVIEW CARD OR UPLOAD DROP ZONE */}
      {imageUrl ? (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* THUMBNAIL */}
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0 shadow-sm group">
              <Image
                src={imageUrl}
                alt={imageAlt || 'Product Preview'}
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>

            {/* METADATA & ACTIONS */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-1.5">
                <FileImage className="w-4 h-4 text-emerald-700" />
                <span>{selectedFileMeta?.name || 'Product Image'}</span>
              </h4>

              {selectedFileMeta && (
                <p className="text-xs text-gray-500">Optimized WebP • {selectedFileMeta.sizeFormatted}</p>
              )}

              <div className="text-xs text-gray-400 truncate max-w-md">
                Path: {imagePath || 'External URL'}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || uploadState === 'UPLOADING'}
                  className="h-8 gap-1.5 text-xs"
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
                  className="h-8 gap-1.5 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ALT TEXT INPUT */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Image Alt Text (SEO)</label>
            <Input
              type="text"
              placeholder="e.g. CPVC Heavy Pressure Pipe 1 inch Panchakanya"
              value={imageAlt}
              onChange={e => {
                setImageAlt(e.target.value);
                onImageChange({ imageUrl, imagePath, imageAlt: e.target.value });
              }}
              disabled={disabled || uploadState === 'UPLOADING'}
              className="text-xs h-8"
            />
          </div>
        </div>
      ) : (
        /* DRAG & DROP UPLOAD ZONE */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-600 bg-emerald-50/50 scale-[1.01]'
              : 'border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-400'
          } ${disabled || uploadState === 'UPLOADING' ? 'pointer-events-none opacity-60' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-sm">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">📷 Upload Product Image</p>
              <p className="text-xs text-gray-500 mt-1">Click to browse or drag & drop image here</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Supported formats: JPG, PNG, WebP (Max 5 MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EXTERNAL IMAGE URL FALLBACK */}
      {!imagePath && (
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Or paste External Image URL (Fallback)
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={e => handleExternalUrlChange(e.target.value)}
              disabled={disabled || uploadState === 'UPLOADING'}
              className="text-xs h-9"
            />
            {imageUrl && !imagePath && (
              <Button type="button" variant="ghost" size="sm" onClick={handleRemoveImage} className="h-9 text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
