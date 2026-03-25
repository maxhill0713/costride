import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, MapPin, Users, Star, Eye, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminGyms() {
  const queryClient = useQueryClient();
  const [selectedGym, setSelectedGym] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: gyms = [], isLoading } = useQuery({
    queryKey: ['adminGyms'],
    queryFn: () => base44.entities.Gym.list('-created_date')
  });

  const updateGymMutation = useMutation({
    // SECURITY: Routed through approveRejectGym backend function which enforces
    // server-side admin role check. Previously called Gym.update() directly with
    // only a client-side role check — any user could approve gyms via direct API call.
    mutationFn: ({ id, status }) => base44.functions.invoke('approveRejectGym', { gymId: id, status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminGyms'] });
      toast.success(variables.status === 'approved' ? 'Gym approved!' : 'Gym rejected');
      setSelectedGym(null);
    }
  });

  // Only admins can access this page
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <Card className="bg-slate-800/60 border border-red-500/40 p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-300">Only administrators can access this page.</p>
        </Card>
      </div>
    );
  }

  const pendingGyms = gyms.filter(g => g.status === 'pending');
  const approvedGyms = gyms.filter(g => g.status === 'approved');
  const rejectedGyms = gyms.filter(g => g.status === 'rejected');

  const GymCard = ({ gym, showActions = true }) => (
    <Card className="bg-slate-800/60 border border-slate-600/40 overflow-hidden hover:border-blue-500/40 transition-all">
      {gym.image_url && (
        <div className="h-32 overflow-hidden">
          <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg mb-1">{gym.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <MapPin className="w-3 h-3" />
              <span>{gym.city}</span>
            </div>
          </div>
          <Badge className={
            gym.status === 'approved' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
            gym.status === 'rejected' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
            'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
          }>
            {gym.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> :
             gym.status === 'rejected' ? <XCircle className="w-3 h-3 mr-1" /> :
             <Clock className="w-3 h-3 mr-1" />}
            {gym.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {gym.owner_email && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Mail className="w-3 h-3" />
              <span>{gym.owner_email}</span>
            </div>
          )}
          {gym.address && (
            <p className="text-xs text-slate-400">{gym.address}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="px-2 py-1 bg-slate-700/50 rounded-lg">{gym.type}</span>
            {gym.price && <span>💰 {gym.price}</span>}
          </div>
        </div>

        {showActions && gym.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedGym(gym)}
              variant="outline"
              size="sm"
              className="flex-1 border-blue-500/40 text-blue-300 hover:bg-blue-500/20"
            >
              <Eye className="w-4 h-4 mr-1" />
              Review
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Gym Review Dashboard</h1>
          <p className="text-slate-400">Review and approve gym submissions</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{pendingGyms.length}</p>
                <p className="text-xs text-slate-400">Pending Review</p>
              </div>
            </div>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{approvedGyms.length}</p>
                <p className="text-xs text-slate-400">Approved</p>
              </div>
            </div>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30 p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">{rejectedGyms.length}</p>
                <p className="text-xs text-slate-400">Rejected</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-slate-800/60 border border-slate-600/40 p-1 rounded-xl mb-6">
            <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">
              Pending ({pendingGyms.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-blue-600">
              Approved ({approvedGyms.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-blue-600">
              Rejected ({rejectedGyms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <p className="text-slate-400 text-center py-8">Loading...</p>
            ) : pendingGyms.length === 0 ? (
              <Card className="bg-slate-800/40 border border-slate-600/40 p-10 text-center">
                <CheckCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">All Caught Up!</h3>
                <p className="text-slate-400">No gyms pending review</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pendingGyms.map(gym => <GymCard key={gym.id} gym={gym} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            <div className="grid md:grid-cols-2 gap-4">
              {approvedGyms.map(gym => <GymCard key={gym.id} gym={gym} showActions={false} />)}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="grid md:grid-cols-2 gap-4">
              {rejectedGyms.map(gym => <GymCard key={gym.id} gym={gym} showActions={false} />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Modal */}
      {selectedGym && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <Card className="bg-slate-800 border border-slate-600/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Review Gym Submission</h2>
              
              {selectedGym.image_url && (
                <img src={selectedGym.image_url} alt={selectedGym.name} className="w-full h-48 object-cover rounded-xl mb-4" />
              )}

              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-slate-400 uppercase">Gym Name</label>
                  <p className="text-white font-semibold">{selectedGym.name}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase">Owner Email</label>
                  <p className="text-white">{selectedGym.owner_email}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase">Location</label>
                  <p className="text-white">{selectedGym.address}, {selectedGym.city} {selectedGym.postcode}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase">Type</label>
                  <p className="text-white capitalize">{selectedGym.type}</p>
                </div>
                {selectedGym.price && (
                  <div>
                    <label className="text-xs text-slate-400 uppercase">Price</label>
                    <p className="text-white">{selectedGym.price}</p>
                  </div>
                )}
                {selectedGym.amenities && selectedGym.amenities.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 uppercase">Amenities</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedGym.amenities.map((amenity, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSelectedGym(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateGymMutation.mutate({ id: selectedGym.id, status: 'rejected' })}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={updateGymMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => updateGymMutation.mutate({ id: selectedGym.id, status: 'approved' })}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={updateGymMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}