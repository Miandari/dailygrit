'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  existingUrls?: string[];
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUpload,
  maxFiles = 3,
  existingUrls = [],
  className,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<string[]>(existingUrls);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Calculate new dimensions (max 1920px wide, maintain aspect ratio)
          let { width, height } = img;
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob || file);
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const files = Array.from(event.target.files);
    if (urls.length + files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Optimize image before upload
        const optimizedBlob = await optimizeImage(file);

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('challenge-uploads')
          .upload(fileName, optimizedBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('challenge-uploads')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      const newUrls = [...urls, ...uploadedUrls];
      setUrls(newUrls);
      onUpload(newUrls);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
    onUpload(newUrls);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {urls.map((url, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
            <button
              onClick={() => removeFile(index)}
              disabled={disabled}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {urls.length < maxFiles && (
          <div className="aspect-square">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={maxFiles > 1}
              onChange={handleUpload}
              disabled={uploading || disabled}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
              className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-600">Upload Photo</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {urls.length === 0 && !uploading && (
        <p className="text-sm text-gray-500 text-center">
          <ImageIcon className="inline h-4 w-4 mr-1" />
          Add up to {maxFiles} photos to track your progress
        </p>
      )}
    </div>
  );
}