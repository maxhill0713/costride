import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function EditHeroImageModal({ open, onClose, currentImageUrl, onSave, isLoading }) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '');
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (url) => {
      setImageUrl(url);
      setUploading(false);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleSave = () => {
    onSave(imageUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            Edit Hero Background
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Current Image</Label>
            {imageUrl ? (
              <div className="mt-2 relative">
                <img 
                  src={imageUrl} 
                  alt="Hero preview" 
                  className="w-full h-48 object-cover rounded-2xl"
                />
              </div>
            ) : (
              <div className="mt-2 h-48 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center">
                <p className="text-white font-bold">Default Gradient</p>
              </div>
            )}
          </div>

          <div>
            <Label>Upload New Image</Label>
            <label className="block mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium text-gray-700">
                  {uploading ? 'Uploading...' : 'Click to upload new hero image'}
                </p>
              </div>
            </label>
          </div>

          <div>
            <Label>Or paste image URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-2xl mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isLoading || uploading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl"
            >
              {isLoading ? 'Saving...' : 'Save Background'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="rounded-2xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}