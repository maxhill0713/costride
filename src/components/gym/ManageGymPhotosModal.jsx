import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function ManageGymPhotosModal({ open, onClose, gallery = [], onSave, isLoading }) {
  const [photos, setPhotos] = useState(gallery);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const result = await base44.integrations.Core.UploadFile({ file });
      return result.file_url;
    },
    onSuccess: (url) => {
      setPhotos([...photos, url]);
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

  const removePhoto = (url) => {
    setPhotos(photos.filter(p => p !== url));
  };

  const handleSave = () => {
    onSave(photos);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            Manage Gym Photos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <p className="text-lg font-bold text-gray-900">
                {uploading ? 'Uploading...' : 'Click to upload photos'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Show off your gym facilities!</p>
            </div>
          </label>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">Gallery ({photos.length} photos)</h3>
            {photos.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No photos uploaded yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={url} 
                      alt={`Gym photo ${idx + 1}`} 
                      className="w-full h-40 object-cover rounded-2xl"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhoto(url)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isLoading || uploading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl"
            >
              {isLoading ? 'Saving...' : 'Save Gallery'}
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