import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PostCard from '../components/feed/PostCard';
import LeaderboardCard from '../components/leaderboard/LeaderboardCard';

export default function GymCommunity() {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');

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

        {/* Details */}
        <Card className="p-6 mb-6 bg-white">
          <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
          
          {gym.type && (
            <div className="mb-4">
              <Badge className="capitalize text-sm">{gym.type}</Badge>
            </div>
          )}

          {gym.equipment && gym.equipment.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-500 uppercase mb-2">Equipment</p>
              <div className="flex flex-wrap gap-2">
                {gym.equipment.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {gym.amenities && gym.amenities.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {gym.amenities.map((amenity, idx) => (
                  <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border-2 border-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="leaderboard" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="feed" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Feed
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Members
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

          <TabsContent value="members" className="space-y-3">
            {members.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No members yet</p>
              </Card>
            ) : (
              members.slice(0, 20).map((member) => (
                <Card key={member.id} className="p-4 bg-white hover:border-blue-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-bold">{member.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{member.name}</p>
                        {member.nickname && (
                          <p className="text-sm text-gray-500">{member.nickname}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-full">
                      Follow
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}