'use client';

import React from 'react';
import { ImageUploader, ImageUploaderValue } from '@/components/ui/image-uploader';

export type UploadState = 'IDLE' | 'SELECTED' | 'VALIDATING' | 'UPLOADING' | 'SAVING' | 'SUCCESS' | 'ERROR';

interface ProductImageUploadProps {
  productId?: string;
  currentImageUrl?: string;
  currentImagePath?: string;
  currentImageAlt?: string;
  onImageChange: (data: { imageUrl: string; imagePath: string; imageAlt?: string }) => void;
  disabled?: boolean;
}

/**
 * ProductImageUpload — Thin wrapper around the unified reusable ImageUploader component.
 */
export function ProductImageUpload({
  productId,
  currentImageUrl = '',
  currentImagePath = '',
  currentImageAlt = '',
  onImageChange,
  disabled = false,
}: ProductImageUploadProps) {
  return (
    <ImageUploader
      value={currentImageUrl}
      imagePath={currentImagePath}
      imageAlt={currentImageAlt}
      folder="products"
      entityId={productId}
      label="Product Image"
      description="JPG, PNG, WEBP up to 5MB"
      disabled={disabled}
      showAltInput={true}
      autoUpload={true}
      onChange={(val: ImageUploaderValue) => {
        onImageChange({
          imageUrl: val.imageUrl,
          imagePath: val.imagePath,
          imageAlt: val.imageAlt,
        });
      }}
    />
  );
}
