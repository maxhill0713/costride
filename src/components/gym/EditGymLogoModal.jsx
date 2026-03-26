import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EditGymLogoModal({ open, onClose, currentLogoUrl, onSave, isLoading }) {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!logoUrl.trim()) {
      toast.error('Please upload a logo');
      return;
    }
    onSave(logoUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Gym Profile Picture</DialogTitle>
          <DialogDescription>
            This is your gym's profile logo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          {logoUrl && (
            <div className="flex justify-center">
              <img 
                src={logoUrl} 
                alt="Gym logo preview" 
                className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500"
              />
            </div>
          )}

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* URL Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Or paste image URL</label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.jpg"
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || uploading || !logoUrl}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Logo'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}