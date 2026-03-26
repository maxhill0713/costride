import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, MapPin, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

function EventCard({ event, onRSVP, onDelete = null, isOwner = false }) {
  return (
    <Card className="overflow-hidden bg-white border-2 border-gray-100 hover:border-blue-200 transition-colors">
      {event.image_url && (
        <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg mb-1">{event.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{event.description}</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="font-medium">
              {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>{format(new Date(event.event_date), 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-green-500" />
            <span>{event.attendees || 0} attending</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => onRSVP(event.id)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl"
            disabled={isOwner}
          >
            {isOwner ? 'Your Event' : 'RSVP'}
          </Button>
          {isOwner && onDelete && (
            <Button
              onClick={() => onDelete(event.id)}
              variant="outline"
              size="icon"
              className="border-red-500/50 hover:bg-red-500/10 hover:border-red-500"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default React.memo(EventCard);