import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, ChevronRight, UserPlus, CheckCircle, X, MoreVertical, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const sanitiseUsernameQuery = (v) =>
  v
    .replace(/[^a-zA-Z0-9_.\- ]/g, '')
    .slice(0, 30);

function FriendsSection({
  showFriendsModal,
  setShowFriendsModal,
  showAddFriendModal,
  setShowAddFriendModal,
  confirmRemoveFriend,
  setConfirmRemoveFriend,
  friendMenuOpen,
  setFriendMenuOpen,
  pendingMenuOpen,
  setPendingMenuOpen,
  friendSearchQuery,
  setFriendSearchQuery,
  friendsListSearchQuery,
  setFriendsListSearchQuery,
  sentFriendRequests,
  friendUsersList,
  friendRequests,
  friends,
  friendsWithActivity,
  filteredSearchResults,
  acceptFriendMutation,
  rejectFriendMutation,
  removeFriendMutation,
  cancelFriendMutation,
  addFriendMutation,
}) {
  return (
    <>
      {/* ── Friends Modal ── */}
      {showFriendsModal && (
        <>
          <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowFriendsModal(false)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-12 w-11/12 max-w-2xl h-1/2 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
            <div className="px-3 py-1 flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search friends..."
                  value={friendsListSearchQuery}
                  onChange={e => setFriendsListSearchQuery(sanitiseUsernameQuery(e.target.value))}
                  maxLength={30}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  style={{ fontSize: '16px' }}
                  className="pl-8 bg-white/10 border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:border-blue-400 text-white placeholder:text-slate-300 rounded-xl text-sm h-9"
                />
              </div>
              <Button onClick={() => { setShowAddFriendModal(true); setShowFriendsModal(false); }}
                className="bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent h-8 w-8 p-0 flex-shrink-0 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px]">
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">

              {/* ── Sent / pending requests ── */}
              {sentFriendRequests.filter(req => {
                const u = friendUsersList.find(u => u.id === req.friend_id);
                return (u?.full_name || req.friend_name || '').toLowerCase().includes(friendsListSearchQuery.toLowerCase());
              }).map(request => {
                const u = friendUsersList.find(u => u.id === request.friend_id);
                const name = u?.display_name || u?.full_name || request.friend_name || 'User';
                const sentMs = Date.now() - new Date(request.created_date).getTime();
                const sentHours = Math.floor(sentMs / (1000 * 60 * 60));
                const sentDays = Math.floor(sentMs / (1000 * 60 * 60 * 24));
                const timeAgo = sentDays >= 3 ? `${sentDays}d ago` : sentHours <= 0 ? 'Just now' : `${sentHours}h ago`;
                return (
                  <div key={`sent-${request.id}`} className="px-2.5 py-2 rounded-lg flex items-center gap-2 relative bg-slate-700/40">
                    <div className="flex items-center gap-2 min-w-0" style={{ flex: '0 1 auto' }}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {u?.avatar_url
                          ? <img src={u.avatar_url} alt={name} className="w-full h-full object-cover" />
                          : <span className="text-[10px] font-semibold text-white">{name?.charAt(0)?.toUpperCase()}</span>}
                      </div>
                      <p className="font-semibold text-white text-xs truncate max-w-[90px]">{name}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                        style={{
                          background: 'linear-gradient(to bottom, #1a1f35, #0f1220)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          color: 'rgba(165,180,252,0.85)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                          letterSpacing: '0.04em',
                        }}>
                        Pending
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{timeAgo}</span>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingMenuOpen(pendingMenuOpen === request.friend_id ? null : request.friend_id);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-600/60 active:scale-90 transition-all duration-100 outline-none focus:outline-none focus-visible:outline-none [&::after]:hidden [&::before]:hidden">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {pendingMenuOpen === request.friend_id && (
                          <>
                            <div className="fixed inset-0 z-[10001]" onClick={() => setPendingMenuOpen(null)} />
                            <div className="absolute right-0 top-8 z-[10002] bg-slate-800 border border-slate-700/50 rounded-lg shadow-[0_3px_0_0_#1e293b,0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden min-w-[110px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingMenuOpen(null);
                                  cancelFriendMutation.mutate(request.friend_id);
                                }}
                                disabled={cancelFriendMutation.isPending}
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors disabled:opacity-50">
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── Incoming friend requests ── */}
              {friendRequests.filter(req => {
                const u = friendUsersList.find(u => u.id === req.user_id);
                return (u?.full_name || req.user_name || '').toLowerCase().includes(friendsListSearchQuery.toLowerCase());
              }).map(request => {
                const u = friendUsersList.find(u => u.id === request.user_id);
                const name = u?.display_name || u?.full_name || request.user_name || request.friend_name;
                return (
                  <div key={request.id} className="p-3 rounded-lg bg-slate-700/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {u?.avatar_url ? <img src={u.avatar_url} alt={name} className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-white">{name?.charAt(0)?.toUpperCase()}</span>}
                      </div>
                      <p className="font-semibold text-white text-xs truncate">{name}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="icon" onClick={() => acceptFriendMutation.mutate(request.user_id)} className="bg-green-600 hover:bg-green-700 text-white h-7 w-7"><CheckCircle className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => rejectFriendMutation.mutate(request.user_id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-7 w-7"><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                );
              })}

              {/* ── Accepted friends list ── */}
              {friends.length === 0 && friendRequests.length === 0 && sentFriendRequests.length === 0
                ? <p className="text-center text-slate-400 text-sm py-8">No friends yet</p>
                : friendsWithActivity.filter(friend => {
                    const u = friendUsersList.find(u => u.id === friend.friend_id);
                    return (u?.full_name || friend.friend_name || '').toLowerCase().includes(friendsListSearchQuery.toLowerCase());
                  }).map(friend => {
                    const u = friendUsersList.find(u => u.id === friend.friend_id);
                    const name = u?.display_name || u?.full_name || friend.friend_name;
                    return (
                      <div key={friend.id} className="p-2 rounded-lg bg-slate-700/40 flex items-center justify-between gap-2 relative">
                        <Link to={createPageUrl('UserProfile') + `?id=${friend.friend_id}`} className="flex items-center gap-2 flex-1 min-w-0" onClick={() => setShowFriendsModal(false)}>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {u?.avatar_url ? <img src={u.avatar_url} alt={name} className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-white">{name?.charAt(0)?.toUpperCase()}</span>}
                          </div>
                          <p className="font-semibold text-white text-xs truncate">{name}</p>
                        </Link>
                        <div className="relative flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); setFriendMenuOpen(friendMenuOpen === friend.id ? null : friend.id); }} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-600/60 active:scale-90 transition-all duration-100 outline-none focus:outline-none focus-visible:outline-none [&::after]:hidden [&::before]:hidden">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {friendMenuOpen === friend.id && (
                            <>
                              <div className="fixed inset-0 z-[10001]" onClick={() => setFriendMenuOpen(null)} />
                              <div className="absolute right-0 top-8 z-[10002] bg-slate-800 border border-slate-700/50 rounded-lg shadow-[0_3px_0_0_#1e293b,0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden min-w-[110px]">
                                <button onClick={(e) => { e.stopPropagation(); setFriendMenuOpen(null); const u2 = friendUsersList.find(u => u.id === friend.friend_id); setConfirmRemoveFriend({ id: friend.friend_id, name: u2?.full_name || friend.friend_name }); }} className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors">
                                  Remove
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </>
      )}

      {/* ── Add Friend Modal ── */}
      {showAddFriendModal && (
        <>
          <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-sm" onClick={() => { setShowAddFriendModal(false); setFriendSearchQuery(''); }} />
          <Card className="fixed left-1/2 -translate-x-1/2 top-12 w-11/12 max-w-2xl h-1/2 z-[9999] flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white overflow-hidden">
            <div className="px-3 py-1 flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-[calc(50%-2.5px)] w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search by username..."
                  value={friendSearchQuery}
                  onChange={e => setFriendSearchQuery(sanitiseUsernameQuery(e.target.value))}
                  maxLength={30}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  style={{ fontSize: '16px' }}
                  className="pl-8 bg-white/10 border border-white/20 text-white placeholder:text-slate-300 rounded-xl text-sm h-9"
                />
              </div>
              <button onClick={() => { setShowAddFriendModal(false); setShowFriendsModal(true); setFriendSearchQuery(''); }} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white active:scale-90 active:opacity-60 transition-all duration-100 transform-gpu flex-shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {friendSearchQuery.trim().length >= 2 && (
                filteredSearchResults.length === 0
                  ? <p className="text-center text-slate-400 text-sm py-8">No users found</p>
                  : filteredSearchResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? <img src={user.avatar_url} alt={user.display_name || user.full_name} className="w-full h-full object-cover rounded-full" /> : <span className="text-sm font-semibold text-white">{(user.display_name || user.full_name)?.charAt(0)?.toUpperCase()}</span>}
                          </div>
                          <div><div className="font-semibold text-white text-sm">{user.display_name || user.full_name}</div><div className="text-xs text-slate-400">{user.username ? `@${user.username}` : ''}</div></div>
                        </div>
                        <Button size="sm" onClick={() => { addFriendMutation.mutate(user, { onSuccess: () => { setShowAddFriendModal(false); setShowFriendsModal(true); } }); }} disabled={addFriendMutation.isPending} className="bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-[0_2px_0_0_#1a3fa8,0_4px_12px_rgba(59,130,246,0.25)] active:shadow-none active:translate-y-[2px] active:scale-95 transition-all duration-100">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
              )}
            </div>
          </Card>
        </>
      )}

      {/* ── Confirm Remove Friend ── */}
      {confirmRemoveFriend && (
        <>
          <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={() => setConfirmRemoveFriend(null)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
            <h3 className="text-xl font-black text-white mb-2">Remove {confirmRemoveFriend.name}?</h3>
            <p className="text-slate-300 text-sm mb-6">Are you sure you want to remove them as a friend? You'll no longer see each other's activity.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemoveFriend(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                Cancel
              </button>
              <button
                onClick={() => { removeFriendMutation.mutate(confirmRemoveFriend.id); setConfirmRemoveFriend(null); }}
                disabled={removeFriendMutation.isPending}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d,0_6px_16px_rgba(200,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50">
                {removeFriendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Remove'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default React.memo(FriendsSection);