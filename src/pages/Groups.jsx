import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CreateGroupModal from '../components/groups/CreateGroupModal';

export default function Groups() {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-member_count')
  });

  const createGroupMutation = useMutation({
    mutationFn: (groupData) => base44.entities.Group.create({
      ...groupData,
      creator_id: currentUser?.id,
      members: [currentUser?.id],
      member_count: 1
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowCreateGroup(false);
    }
  });

  const joinGroupMutation = useMutation({
    mutationFn: ({ groupId, members }) =>
      base44.entities.Group.update(groupId, {
        members: [...members, currentUser?.id],
        member_count: members.length + 1
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  const categoryColors = {
    running: 'bg-blue-100 text-blue-800',
    weightlifting: 'bg-orange-100 text-orange-800',
    yoga: 'bg-purple-100 text-purple-800',
    crossfit: 'bg-red-100 text-red-800',
    cycling: 'bg-green-100 text-green-800',
    boxing: 'bg-yellow-100 text-yellow-800',
    general: 'bg-gray-100 text-gray-800'
  };

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGroups = groups.filter(g => g.members?.includes(currentUser?.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Groups & Clubs</h1>
            <p className="text-gray-600">Connect with people who share your interests</p>
          </div>
          <Button
            onClick={() => setShowCreateGroup(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl bg-white"
          />
        </div>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Groups</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map(group => (
                <Card key={group.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                  {group.image_url ? (
                    <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 mb-4">
                      <img src={group.image_url} alt={group.name} className="w-full h-full object-cover rounded-2xl" />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 mb-4 flex items-center justify-center">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <Badge className={`${categoryColors[group.category]} mb-3`}>
                    {group.category}
                  </Badge>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{group.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.member_count} members
                    </span>
                    <Button variant="outline" className="rounded-full">
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Groups */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Discover Groups
          </h2>
          {filteredGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No groups found</p>
              <Button
                onClick={() => setShowCreateGroup(true)}
                variant="outline"
              >
                Create First Group
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(group => {
                const isMember = group.members?.includes(currentUser?.id);
                return (
                  <Card key={group.id} className="p-6 bg-white hover:shadow-lg transition-shadow">
                    {group.image_url ? (
                      <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 mb-4">
                        <img src={group.image_url} alt={group.name} className="w-full h-full object-cover rounded-2xl" />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 mb-4 flex items-center justify-center">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <Badge className={`${categoryColors[group.category]} mb-3`}>
                      {group.category}
                    </Badge>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{group.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.member_count} members
                      </span>
                      {!isMember && (
                        <Button
                          onClick={() => joinGroupMutation.mutate({ groupId: group.id, members: group.members || [] })}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                        >
                          Join
                        </Button>
                      )}
                      {isMember && (
                        <Badge className="bg-green-100 text-green-800">Joined</Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <CreateGroupModal
          open={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onSave={(data) => createGroupMutation.mutate(data)}
          isLoading={createGroupMutation.isPending}
        />
      </div>
    </div>
  );
}