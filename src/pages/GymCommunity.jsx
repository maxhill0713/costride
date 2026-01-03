import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft, Calendar, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PostCard from '../components/feed/PostCard';
import LeaderboardCard from '../components/leaderboard/LeaderboardCard';
import EventCard from '../components/events/EventCard';
import CreateEventModal from '../components/events/CreateEventModal';

export default function GymCommunity() {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: async () => {
      const gyms = await base44.entities.Gym.list();
      return gyms.find(g => g.id === gymId);
    },
    enabled: !!gymId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list()
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date')
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-weight_lbs')
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', gymId],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.list('-event_date');
      return allEvents.filter(e => e.gym_id === gymId);
    },
    enabled: !!gymId
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.Event.create({
      ...eventData,
      gym_id: gymId,
      gym_name: gym?.name,
      attendees: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gymId] });
      setShowCreateEvent(false);
    }
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, currentAttendees }) => 
      base44.entities.Event.update(eventId, {
        attendees: currentAttendees + 1
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gymId] });
    }
  });

  // Filter top lifts for this gym's members (simplified - in real app would link members to gyms)
  const topLifts = lifts.slice(0, 10).map(lift => {
    const member = members.find(m => m.id === lift.member_id);
    return { ...lift, member };
  });

  if (gymLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gym...</p>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-gray-600 mb-4">Gym not found</p>
          <Link to={createPageUrl('Gyms')}>
            <Button>Back to Gyms</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {gym.image_url ? (
          <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-cyan-500">
            <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-cyan-500"></div>
        )}
        
        <Link to={createPageUrl('Gyms')} className="absolute top-4 left-4">
          <Button variant="ghost" className="bg-white/90 backdrop-blur hover:bg-white rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-black">{gym.name}</h1>
                  {gym.verified && (
                    <BadgeCheck className="w-6 h-6 text-green-400" />
                  )}
                </div>
                <p className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  {gym.address || gym.city}
                </p>
              </div>
              {gym.price && (
                <div className="text-right bg-white/20 backdrop-blur px-4 py-2 rounded-2xl">
                  <div className="text-2xl font-black">£{gym.price}</div>
                  <div className="text-xs">/month</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center bg-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-black text-gray-900">{gym.members_count || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Members</p>
          </Card>
          <Card className="p-4 text-center bg-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-black text-gray-900">{gym.rating || 0}</span>
            </div>
            <p className="text-sm text-gray-600">Rating</p>
          </Card>
          <Card className="p-4 text-center bg-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-black text-gray-900">{lifts.length}</span>
            </div>
            <p className="text-sm text-gray-600">PRs</p>
          </Card>
        </div>

        {/* Reward Offer */}
        {gym.reward_offer && (
          <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-orange-900 text-lg">{gym.reward_offer}</p>
                  <p className="text-sm text-orange-700">Special offer for new members!</p>
                </div>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl">
                Claim Offer
              </Button>
            </div>
          </Card>
        )}

        {/* Leaderboard Rewards */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-purple-900">Leaderboard Rewards</h3>
              <p className="text-sm text-purple-700">Compete and win exclusive rewards!</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-black text-white">1</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">1st Place</p>
                <p className="text-sm text-gray-600">Free month membership + £50 sports voucher</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-300 rounded-2xl">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center font-black text-white">2</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">2nd Place</p>
                <p className="text-sm text-gray-600">50% off membership + £25 sports voucher</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 border-2 border-orange-300 rounded-2xl">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-black text-white">3</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">3rd Place</p>
                <p className="text-sm text-gray-600">25% off membership + £10 sports voucher</p>
              </div>
            </div>
          </div>
        </Card>



        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white border-2 border-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="leaderboard" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Challenges
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Events
            </TabsTrigger>
            <TabsTrigger value="feed" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Feed
            </TabsTrigger>
            <TabsTrigger value="info" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-3">
            {topLifts.length === 0 ? (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No lifts recorded yet</p>
              </Card>
            ) : (
              topLifts.map((lift, idx) => (
                <LeaderboardCard
                  key={lift.id}
                  rank={idx + 1}
                  member={lift.member}
                  lift={lift}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="challenges">
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 p-6">
                <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-orange-600" />
                  Gym Challenges
                </h3>
                <p className="text-gray-600 mb-4">
                  Create challenges for your members or challenge other gyms to compete!
                </p>
                <Link to={createPageUrl('Challenges')}>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-2xl">
                    View All Challenges
                  </Button>
                </Link>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
              <Button
                onClick={() => setShowCreateEvent(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
            
            {events.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">No upcoming events</p>
                <Button
                  onClick={() => setShowCreateEvent(true)}
                  variant="outline"
                  className="mt-2"
                >
                  Create First Event
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={(eventId) => {
                      const event = events.find(e => e.id === eventId);
                      rsvpMutation.mutate({ eventId, currentAttendees: event.attendees || 0 });
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            {posts.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No posts yet</p>
              </Card>
            ) : (
              posts.slice(0, 10).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => {}}
                  onComment={() => {}}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="info">
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Gym Information</h3>
              
              {gym.type && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Type</p>
                  <Badge className="capitalize text-sm">{gym.type}</Badge>
                </div>
              )}

              {gym.equipment && gym.equipment.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-3">Equipment Available</p>
                  <div className="grid grid-cols-2 gap-2">
                    {gym.equipment.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-purple-50 border-2 border-purple-200 rounded-2xl">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-purple-900">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gym.amenities && gym.amenities.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-3">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {gym.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gym.address && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Location</p>
                  <p className="text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {gym.address}
                  </p>
                  {gym.postcode && (
                    <p className="text-gray-600 text-sm mt-1 ml-6">{gym.postcode}</p>
                  )}
                </div>
              )}

              {gym.distance_km && (
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Distance</p>
                  <p className="text-gray-900">{gym.distance_km} km away</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <CreateEventModal
          open={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
          onSave={(data) => createEventMutation.mutate(data)}
          gym={gym}
          isLoading={createEventMutation.isPending}
        />
      </div>
    </div>
  );
}