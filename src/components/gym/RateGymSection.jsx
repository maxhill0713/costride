import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function RateGymSection({ gym, currentUser }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const queryClient = useQueryClient();

  const { data: userRating } = useQuery({
    queryKey: ['userRating', currentUser?.id, gym?.id],
    queryFn: async () => {
      if (!currentUser || !gym) return null;
      const ratings = await base44.entities.GymRating.filter({ 
        user_id: currentUser.id, 
        gym_id: gym.id 
      });
      return ratings[0] || null;
    },
    enabled: !!currentUser && !!gym
  });

  const { data: allRatings = [] } = useQuery({
    queryKey: ['gymRatings', gym?.id],
    queryFn: async () => {
      if (!gym) return [];
      return await base44.entities.GymRating.filter({ gym_id: gym.id });
    },
    enabled: !!gym
  });

  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating, review }) => {
      if (userRating) {
        // Update existing rating
        return await base44.entities.GymRating.update(userRating.id, { rating, review });
      } else {
        // Create new rating
        return await base44.entities.GymRating.create({
          gym_id: gym.id,
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          rating,
          review
        });
      }
    },
    onSuccess: async () => {
      // Recalculate gym average rating
      const ratings = await base44.entities.GymRating.filter({ gym_id: gym.id });
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      
      // Update gym rating
      await base44.entities.Gym.update(gym.id, { rating: avgRating });
      
      queryClient.invalidateQueries({ queryKey: ['userRating', currentUser.id, gym.id] });
      queryClient.invalidateQueries({ queryKey: ['gymRatings', gym.id] });
      queryClient.invalidateQueries({ queryKey: ['gym', gym.id] });
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      
      toast.success('Rating submitted successfully!');
      setRating(0);
      setReview('');
    },
    onError: () => {
      toast.error('Failed to submit rating');
    }
  });

  React.useEffect(() => {
    if (userRating) {
      setRating(userRating.rating);
      setReview(userRating.review || '');
    }
  }, [userRating]);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    submitRatingMutation.mutate({ rating, review });
  };

  return (
    <Card id="gym-rating-section" className="bg-white p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Rate This Gym</h3>
      
      {/* Current Average Rating */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-yellow-600">{gym.rating?.toFixed(1) || '0.0'}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(gym.rating || 0)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{allRatings.length}</p>
            <p className="text-xs text-gray-500">ratings</p>
          </div>
        </div>
      </div>

      {/* User Rating Form */}
      {currentUser && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {userRating ? 'Update Your Rating' : 'Your Rating'}
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Review (Optional)</p>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this gym..."
              className="min-h-24"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitRatingMutation.isPending || rating === 0}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl"
          >
            {submitRatingMutation.isPending 
              ? 'Submitting...' 
              : userRating 
              ? 'Update Rating' 
              : 'Submit Rating'}
          </Button>
        </div>
      )}

      {/* Recent Reviews */}
      {allRatings.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Recent Reviews</h4>
          <div className="space-y-3">
            {allRatings.slice(0, 5).map((ratingItem) => (
              <div key={ratingItem.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900 text-sm">{ratingItem.user_name}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= ratingItem.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {ratingItem.review && (
                  <p className="text-sm text-gray-600">{ratingItem.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}