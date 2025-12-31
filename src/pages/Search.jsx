import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search as SearchIcon, X, TrendingUp, Hash, Users, Dumbbell, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list()
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date')
  });

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const trendingSearches = ['Bench Press', 'Deadlift', 'Leg Day', 'PRs', 'Squat Tips'];
  const recentSearches = ['The Beast', 'Iron Lady', 'Local Gyms'];

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(p =>
    p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.member_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGyms = gyms.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search people, posts, gyms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {!searchQuery ? (
          <div className="space-y-6">
            {/* Recent Searches */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Recent</h3>
              <div className="space-y-2">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(search)}
                    className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <SearchIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-gray-900 font-medium">{search}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSearchQuery(search)}
                    className="px-4 py-2 bg-white border-2 border-gray-100 rounded-full font-semibold text-sm text-gray-900 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <Hash className="w-4 h-4 inline mr-1" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border-2 border-gray-100 p-1 rounded-2xl">
              <TabsTrigger value="all" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="people" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                People
              </TabsTrigger>
              <TabsTrigger value="posts" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Posts
              </TabsTrigger>
              <TabsTrigger value="gyms" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Gyms
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredMembers.length === 0 && filteredPosts.length === 0 && filteredGyms.length === 0 ? (
                <div className="text-center py-12">
                  <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No results found</p>
                </div>
              ) : (
                <>
                  {filteredMembers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">People</h4>
                      {filteredMembers.slice(0, 3).map(member => (
                        <Card key={member.id} className="bg-white border-2 border-gray-100 p-4 mb-2 hover:border-purple-200 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                              <span className="text-white font-bold">{member.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{member.name}</p>
                              {member.nickname && <p className="text-sm text-gray-500">{member.nickname}</p>}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                  {filteredPosts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Posts</h4>
                      {filteredPosts.slice(0, 3).map(post => (
                        <Card key={post.id} className="bg-white border-2 border-gray-100 p-4 mb-2 hover:border-purple-200 transition-colors cursor-pointer">
                          <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                          <p className="text-xs text-gray-500 mt-1">by {post.member_name}</p>
                        </Card>
                      ))}
                    </div>
                  )}
                  {filteredGyms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Gyms</h4>
                      {filteredGyms.slice(0, 3).map(gym => (
                        <Link key={gym.id} to={createPageUrl('Gyms')}>
                          <Card className="bg-white border-2 border-gray-100 p-4 mb-2 hover:border-purple-200 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                                <Dumbbell className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{gym.name}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {gym.city}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="people" className="space-y-2">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No people found</p>
                </div>
              ) : (
                filteredMembers.map(member => (
                  <Card key={member.id} className="bg-white border-2 border-gray-100 p-4 hover:border-purple-200 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-bold">{member.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.name}</p>
                          {member.nickname && <p className="text-sm text-gray-500">{member.nickname}</p>}
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-purple-500 text-white rounded-full font-semibold text-sm hover:bg-purple-600">
                        Follow
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-2">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No posts found</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <Card key={post.id} className="bg-white border-2 border-gray-100 p-4 hover:border-purple-200 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{post.member_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{post.member_name}</p>
                        <p className="text-sm text-gray-700 mt-1">{post.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="gyms" className="space-y-2">
              {filteredGyms.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No gyms found</p>
                </div>
              ) : (
                filteredGyms.map(gym => (
                  <Link key={gym.id} to={createPageUrl('Gyms')}>
                    <Card className="bg-white border-2 border-gray-100 p-4 hover:border-purple-200 transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                          <Dumbbell className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{gym.name}</h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {gym.city}
                          </p>
                          {gym.rating && (
                            <p className="text-sm text-gray-900 mt-1">⭐ {gym.rating}/5</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}