import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Building2, MapPin, Mail, User, Calendar, MessageSquare, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function GymRequests() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['gymRequests'],
    queryFn: async () => {
      const notifications = await base44.entities.Notification.filter({
        type: 'gym_activation_request'
      }, '-created_date');
      return notifications;
    }
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (requestId) => base44.entities.Notification.delete(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymRequests'] });
      toast.success('Request deleted');
      setProcessingId(null);
    },
    onError: () => {
      toast.error('Failed to delete request');
      setProcessingId(null);
    }
  });

  const markAsProcessedMutation = useMutation({
    mutationFn: (requestId) => base44.entities.Notification.update(requestId, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymRequests'] });
      toast.success('Marked as processed');
      setProcessingId(null);
    },
    onError: () => {
      toast.error('Failed to update request');
      setProcessingId(null);
    }
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center p-6">
        <Card className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 p-8 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-300 mb-4">This page is only accessible to administrators.</p>
          <Button onClick={() => navigate(createPageUrl('Home'))} className="bg-blue-600 hover:bg-blue-700">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Gym Activation Requests</h1>
            <p className="text-slate-400 text-sm mt-1">
              {requests.length} {requests.length === 1 ? 'request' : 'requests'} pending
            </p>
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card className="bg-slate-900/80 backdrop-blur-xl border border-white/20 p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Requests</h2>
            <p className="text-slate-400">There are no gym activation requests at the moment.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card
                key={request.id}
                className={`bg-gradient-to-br from-slate-900/80 to-slate-900/60 backdrop-blur-xl border border-white/20 p-6 ${
                  request.read ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{request.metadata?.gym_name || 'Unknown Gym'}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.created_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  {request.read ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Processed</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Gym Details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Address</p>
                        <p className="text-sm text-slate-300">
                          {request.metadata?.gym_address || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">City & Postcode</p>
                        <p className="text-sm text-slate-300">
                          {request.metadata?.gym_city || 'N/A'}, {request.metadata?.gym_postcode || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Requester Details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Requested by</p>
                        <p className="text-sm text-slate-300">{request.metadata?.requester_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Email</p>
                        <p className="text-sm text-slate-300">{request.metadata?.requester_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {request.metadata?.message && (
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Additional Message</p>
                        <p className="text-sm text-slate-300">{request.metadata.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(createPageUrl('Gyms') + `?gymId=${request.metadata?.gym_id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    View Gym
                  </Button>
                  {!request.read && (
                    <Button
                      onClick={() => {
                        setProcessingId(request.id);
                        markAsProcessedMutation.mutate(request.id);
                      }}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {processingId === request.id ? 'Processing...' : 'Mark as Processed'}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setProcessingId(request.id);
                      deleteRequestMutation.mutate(request.id);
                    }}
                    disabled={processingId === request.id}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}