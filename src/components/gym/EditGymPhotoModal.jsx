import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EditGymPhotoModal({ open, onClose, gym, onSave, isLoading }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(gym?.image_url || null);
  const [file, setFile] = useState(null);

  const handleFileSelect = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (evt) => setPreview(evt.target?.result);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onSave(result.file_url);
      setFile(null);
      setPreview(null);
      onClose();
    } catch (error) {
      toast.error('Failed to upload image');
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onSave(null);
    setFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Edit Gym Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : gym?.image_url ? (
            <div className="relative">
              <img src={gym.image_url} alt="Current" className="w-full h-48 object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">Current Photo</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-48 bg-slate-800 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No photo yet</p>
              </div>
            </div>
          )}

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <div className="w-full py-3 rounded-lg border-2 border-dashed border-blue-500/40 bg-blue-500/5 flex items-center justify-center gap-2 hover:bg-blue-500/10 transition-colors">
              <Upload className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">Choose Image</span>
            </div>
          </label>

          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1">
              Cancel
            </Button>
            {gym?.image_url && !file && (
              <Button
                onClick={handleRemove}
                variant="outline"
                className="flex-1 text-red-400 hover:bg-red-500/10">
                Remove
              </Button>
            )}
            {file && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Save Photo'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}