import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Users, UserX, Search, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ManageMembersModal({ open, onClose, gym, onBanMember, onUnbanMember }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all check-ins for this gym to identify members
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', gym?.id],
    queryFn: async () => {
      const allCheckIns = await base44.entities.CheckIn.list('-check_in_date');
      return allCheckIns.filter(c => c.gym_id === gym?.id);
    },
    enabled: !!gym && open
  });

  // Get unique members from check-ins
  const uniqueMembers = checkIns.reduce((acc, checkIn) => {
    if (!acc.find(m => m.user_id === checkIn.user_id)) {
      acc.push({
        user_id: checkIn.user_id,
        user_name: checkIn.user_name,
        check_in_count: checkIns.filter(c => c.user_id === checkIn.user_id).length,
        last_check_in: checkIn.check_in_date
      });
    }
    return acc;
  }, []);

  const bannedMembers = gym?.banned_members || [];

  const filteredMembers = uniqueMembers.filter(member => 
    member.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeMembers = filteredMembers.filter(m => !bannedMembers.includes(m.user_id));
  const banned = filteredMembers.filter(m => bannedMembers.includes(m.user_id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Manage Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="pl-10 rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-black text-blue-600">{activeMembers.length}</div>
              <div className="text-sm text-gray-600">Active Members</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-black text-red-600">{banned.length}</div>
              <div className="text-sm text-gray-600">Banned Members</div>
            </Card>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Active Members ({activeMembers.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeMembers.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-gray-500 text-sm">No active members found</p>
                </Card>
              ) : (
                activeMembers.map((member) => (
                  <Card key={member.user_id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{member.user_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {member.check_in_count} check-ins
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Last visit: {new Date(member.last_check_in).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => onBanMember(member.user_id)}
                        size="sm"
                        variant="destructive"
                        className="rounded-2xl"
                      >
                        <UserX className="w-3 h-3 mr-1" />
                        Ban
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {banned.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-500" />
                Banned Members ({banned.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {banned.map((member) => (
                  <Card key={member.user_id} className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900">{member.user_name}</h4>
                          <Badge className="bg-red-500 text-white text-xs">Banned</Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => onUnbanMember(member.user_id)}
                        size="sm"
                        variant="outline"
                        className="rounded-2xl border-green-500 text-green-600 hover:bg-green-50"
                      >
                        Unban
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" className="rounded-2xl">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}