import React, { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Users, UserX, Search, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ITEM_HEIGHT = 72;

function MemberRow({ member, isBanned, onBan, onUnban }) {
  return (
    <Card className={`p-4 ${isBanned ? 'bg-red-50 border-red-200' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900">{member.user_name}</h4>
            {isBanned
              ? <Badge className="bg-red-500 text-white text-xs">Banned</Badge>
              : <Badge variant="outline" className="text-xs">{member.check_in_count} check-ins</Badge>
            }
          </div>
          {!isBanned && (
            <p className="text-xs text-gray-500 mt-1">
              Last visit: {new Date(member.last_check_in).toLocaleDateString()}
            </p>
          )}
        </div>
        {isBanned ? (
          <Button
            onClick={() => onUnban(member.user_id)}
            size="sm"
            variant="outline"
            className="rounded-2xl border-green-500 text-green-600 hover:bg-green-50"
          >
            Unban
          </Button>
        ) : (
          <Button
            onClick={() => onBan(member.user_id)}
            size="sm"
            variant="destructive"
            className="rounded-2xl"
          >
            <UserX className="w-3 h-3 mr-1" />
            Ban
          </Button>
        )}
      </div>
    </Card>
  );
}

function VirtualMemberList({ members, bannedIds, onBan, onUnban, height }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height, overflowY: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vItem => {
          const member = members[vItem.index];
          const isBanned = bannedIds.includes(member.user_id);
          return (
            <div
              key={vItem.key}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vItem.start}px)`, paddingBottom: 8 }}
            >
              <MemberRow member={member} isBanned={isBanned} onBan={onBan} onUnban={onUnban} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ManageMembersModal({ open, onClose, gym, onBanMember, onUnbanMember }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', gym?.id],
    queryFn: async () => {
      const allCheckIns = await base44.entities.CheckIn.list('-check_in_date');
      return allCheckIns.filter(c => c.gym_id === gym?.id);
    },
    enabled: !!gym && open
  });

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

  // Show virtual list when more than 20 members, plain list below that
  const useVirtual = activeMembers.length > 20;

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
            {activeMembers.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-500 text-sm">No active members found</p>
              </Card>
            ) : useVirtual ? (
              <VirtualMemberList
                members={activeMembers}
                bannedIds={bannedMembers}
                onBan={onBanMember}
                onUnban={onUnbanMember}
                height={Math.min(activeMembers.length * ITEM_HEIGHT, 320)}
              />
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeMembers.map((member) => (
                  <MemberRow key={member.user_id} member={member} isBanned={false} onBan={onBanMember} onUnban={onUnbanMember} />
                ))}
              </div>
            )}
          </div>

          {banned.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-500" />
                Banned Members ({banned.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {banned.map((member) => (
                  <MemberRow key={member.user_id} member={member} isBanned={true} onBan={onBanMember} onUnban={onUnbanMember} />
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
