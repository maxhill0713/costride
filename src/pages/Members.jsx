import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Plus, Trophy, Dumbbell, Trash2, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import AddMemberModal from '@/components/members/AddMemberModal';

const weightClassColors = {
  lightweight: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  middleweight: 'bg-green-500/20 text-green-400 border-green-500/30',
  heavyweight: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  super_heavyweight: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function Members() {
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [deleteMember, setDeleteMember] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list('-created_date')
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list()
  });

  const addMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.GymMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowAddMember(false);
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => base44.entities.GymMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setDeleteMember(null);
    }
  });

  const getMemberStats = (memberId) => {
    const memberLifts = lifts.filter(l => l.member_id === memberId);
    const prs = memberLifts.filter(l => l.is_pr).length;
    const bestLift = memberLifts.length > 0 
      ? Math.max(...memberLifts.map(l => l.weight_lbs)) 
      : 0;
    return { totalLifts: memberLifts.length, prs, bestLift };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Members
            </h1>
            <p className="text-gray-600 mt-1 font-medium">{members.length} gym warriors 💪</p>
          </div>
          <Button
            onClick={() => setShowAddMember(true)}
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold shadow-md rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Members Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border-2 border-gray-100">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-700">No members yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your first gym member to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member, index) => {
              const stats = getMemberStats(member.id);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white border-2 border-gray-100 p-5 hover:border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-white">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 truncate">{member.name}</h3>
                            {member.nickname && (
                              <p className="text-gray-500 text-sm font-medium">"{member.nickname}"</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteMember(member)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex gap-2 mt-3 flex-wrap">
                          {member.weight_class && (
                            <Badge className={`${weightClassColors[member.weight_class]} border capitalize font-semibold`}>
                              {member.weight_class.replace('_', ' ')}
                            </Badge>
                          )}
                          {member.join_date && (
                            <Badge variant="outline" className="border-gray-200 text-gray-600 font-medium">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(member.join_date), 'MMM yyyy')}
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Dumbbell className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-bold">{stats.totalLifts}</span>
                            <span className="text-gray-500">lifts</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Trophy className="w-4 h-4 text-orange-500" />
                            <span className="text-gray-900 font-bold">{stats.prs}</span>
                            <span className="text-gray-500">PRs</span>
                          </div>
                          {stats.bestLift > 0 && (
                            <div className="flex items-center gap-1.5 text-sm ml-auto">
                              <span className="text-gray-500">Best:</span>
                              <span className="bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent font-black">{stats.bestLift}lb</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        onSave={(data) => addMemberMutation.mutate(data)}
        isLoading={addMemberMutation.isPending}
      />

      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 text-xl font-bold">Delete Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to remove {deleteMember?.name} from the gym? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 border-2 border-gray-200 text-gray-700 hover:bg-gray-200 rounded-2xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMemberMutation.mutate(deleteMember?.id)}
              className="bg-red-500 hover:bg-red-600 rounded-2xl font-semibold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}