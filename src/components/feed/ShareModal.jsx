import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Link as LinkIcon, MessageCircle, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareModal({ open, onClose, post }) {
  const shareUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
    onClose();
  };

  const handleShare = (platform) => {
    let url = '';
    const text = `Check out this workout from ${post.member_name}!`;
    
    switch(platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Share</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-2">
          <Button
            onClick={handleCopyLink}
            className="w-full justify-start gap-3 h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Copy className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-semibold">Copy Link</span>
          </Button>

          <Button
            onClick={() => handleShare('whatsapp')}
            className="w-full justify-start gap-3 h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-semibold">Share to WhatsApp</span>
          </Button>

          <Button
            onClick={() => handleShare('twitter')}
            className="w-full justify-start gap-3 h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-semibold">Share to Twitter</span>
          </Button>

          <Button
            onClick={() => handleShare('email')}
            className="w-full justify-start gap-3 h-14 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 rounded-2xl"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <span className="font-semibold">Share via Email</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}