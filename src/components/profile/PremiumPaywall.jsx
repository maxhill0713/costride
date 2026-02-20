import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PremiumPaywall({ isPremium = false }) {
  if (isPremium) return null;

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center z-20 group cursor-pointer">
      <div className="text-center space-y-3">
        <Lock className="w-8 h-8 text-white mx-auto" />
        <p className="text-sm font-semibold text-white">Premium Feature</p>
        <Link to={createPageUrl('Premium')}>
          <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0">
            <Sparkles className="w-4 h-4" />
            Learn More
          </Button>
        </Link>
      </div>
    </div>
  );
}