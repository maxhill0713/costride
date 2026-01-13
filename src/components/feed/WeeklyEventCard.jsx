import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WeeklyEventCard({ event, onRSVP }) {
  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate > new Date();
  const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-200 p-4 overflow-hidden relative">
        {isUpcoming && daysUntil <= 7 && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs animate-pulse">
            {daysUntil === 0 ? 'Today!' : `In ${daysUntil} days`}
          </Badge>
        )}

        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 text-lg">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-gray-600 mb-3">{event.description}</p>
            )}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="font-medium">{eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-medium">{eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="font-medium">{event.attendees || 0} attending</span>
              </div>
            </div>
            {isUpcoming && (
              <Button 
                onClick={() => onRSVP && onRSVP(event.id)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl h-9 text-sm font-bold"
              >
                📅 RSVP
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}