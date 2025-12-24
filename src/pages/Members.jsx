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
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-lime-400" />
              Members
            </h1>
            <p className="text-zinc-400 mt-1">{members.length} gym warriors</p>
          </div>
          <Button
            onClick={() => setShowAddMember(true)}
            className="bg-lime-400 hover:bg-lime-500 text-zinc-900 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Members Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No members yet</p>
            <p className="text-sm">Add your first gym member to get started!</p>
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
                  <Card className="bg-zinc-900 border-zinc-800 p-5 hover:border-zinc-700 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 p-0.5 flex-shrink-0">
                        <div className="w-full h-full rounded-2xl bg-zinc-900 flex items-center justify-center overflow-hidden">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-lime-400">
                              {member.name?.charAt(0)?.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-white truncate">{member.name}</h3>
                            {member.nickname && (
                              <p className="text-zinc-400 text-sm">"{member.nickname}"</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteMember(member)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex gap-2 mt-3 flex-wrap">
                          {member.weight_class && (
                            <Badge className={`${weightClassColors[member.weight_class]} border capitalize`}>
                              {member.weight_class.replace('_', ' ')}
                            </Badge>
                          )}
                          {member.join_date && (
                            <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(member.join_date), 'MMM yyyy')}
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Dumbbell className="w-4 h-4 text-zinc-500" />
                            <span className="text-white font-medium">{stats.totalLifts}</span>
                            <span className="text-zinc-500">lifts</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Trophy className="w-4 h-4 text-orange-400" />
                            <span className="text-white font-medium">{stats.prs}</span>
                            <span className="text-zinc-500">PRs</span>
                          </div>
                          {stats.bestLift > 0 && (
                            <div className="flex items-center gap-1.5 text-sm ml-auto">
                              <span className="text-zinc-500">Best:</span>
                              <span className="text-lime-400 font-bold">{stats.bestLift}lb</span>
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
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Member</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to remove {deleteMember?.name} from the gym? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMemberMutation.mutate(deleteMember?.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}