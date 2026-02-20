import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Info, Zap } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VolumeByDayPaywall({ volumeByDay = [] }) {
  const containerRef = useRef(null);

  return (
    <Card className="bg-black border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Target className="w-4 h-4 text-blue-400" />
        <h4 className="text-sm font-bold text-white">Volume by Split Day</h4>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs bg-slate-950 border-slate-700">
              <p>Shows total training volume for each workout day (e.g., Push, Pull, Legs). Helps balance your weekly training load.</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Scrollable Container with Blur Paywall */}
      <div className="relative">
        {/* Chart Container - Limited Height */}
        <div 
          ref={containerRef}
          className="overflow-y-auto max-h-[220px] scrollbar-hide"
          style={{
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          }}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeByDay} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                type="number" 
                stroke="#94a3b8" 
                fontSize={10}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                type="category" 
                dataKey="day" 
                stroke="#94a3b8" 
                fontSize={10}
                width={80}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="volume" 
                fill="#8b5cf6"
                radius={[0, 4, 4, 0]}
                name="Total Volume (kg)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Blur Overlay Paywall */}
        <div 
          className="absolute inset-0 pointer-events-none top-[140px]"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0.8) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        />

        {/* Learn More Button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <Link to={createPageUrl('Premium')}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50 gap-2">
              <Zap className="w-4 h-4" />
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}