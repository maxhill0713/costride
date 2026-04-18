function ReactionsModal({ open, onClose, reactions, reactedUsers, currentUserId, friends, sentFriendRequests, onAddFriend }) {
  const [search, setSearch] = useState('');
  const [localPendingIds, setLocalPendingIds] = useState(new Set());
  if (!open) return null;

  const friendIds = new Set((friends || []).map(f => f.friend_id));
  const sentIds = new Set((sentFriendRequests || []).map(r => r.friend_id));

  const sanitised = search.replace(/[^a-zA-Z0-9_.\ ]/g, '').slice(0, 30);
  const filtered = reactedUsers.filter(user => {
    const name = user.display_name || user.full_name || user.username || '';
    return name.toLowerCase().includes(sanitised.toLowerCase());
  });

  const friendReactors = filtered.filter(u => friendIds.has(u.id) || u.id === currentUserId);
  const communityReactors = filtered.filter(u => !friendIds.has(u.id) && u.id !== currentUserId);

  const renderUser = (user) => {
    const variant = reactions[user.id];
    const isSelf = user.id === currentUserId;
    const isFriend = friendIds.has(user.id);
    const isPending = sentIds.has(user.id) || localPendingIds.has(user.id);
    const displayName = isSelf ? 'You' : (user.display_name || user.full_name || user.username || 'Unknown');

    return (
      <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
        <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, marginLeft: -2 }}>
          {variant === 'sunglasses'
            ? <div className="relative w-full h-full flex items-center justify-center">
                <img src={STREAK_ICON_URL} alt="streak" className="w-full h-full" style={{ objectFit: 'contain' }} />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 64 64">
                  <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                  <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
                  <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
                </svg>
              </div>
            : <img src={STREAK_ICON_URL} alt="streak" className="w-full h-full" style={{ objectFit: 'contain' }} />}
        </div>
        <span className="text-sm text-slate-200 font-semibold flex-1 min-w-0 truncate">{displayName}</span>
        {!isSelf && !isFriend && (
          isPending ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'linear-gradient(to bottom, #1a1f35, #0f1220)', border: '1px solid rgba(99,102,241,0.3)', color: 'rgba(165,180,252,0.85)', letterSpacing: '0.04em' }}>
              Pending
            </span>
          ) : (
            <button
              onClick={() => {
                if (onAddFriend) onAddFriend(user);
                setLocalPendingIds(prev => new Set([...prev, user.id]));
              }}
              className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg active:translate-y-[2px] active:shadow-none transition-all duration-100"
              style={{
                background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 40%, #2563eb 100%)',
                border: '1px solid rgba(147,197,253,0.4)',
                boxShadow: '0 3px 0 0 #1a3fa8, 0 5px 12px rgba(0,0,100,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}>
              <UserPlus className="w-3.5 h-3.5 text-white" />
            </button>
          )
        )}
      </div>
    );
  };

  const SectionHeader = ({ label }) => (
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2 pt-2 pb-1">
      {label}
    </p>
  );

  const showSections = !sanitised;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '-100px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10005,
          background: 'rgba(2,6,23,0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-white text-center">
            {Object.keys(reactions).length} Reactions
          </h3>
        </div>
        <div className="px-3 pb-2">
          <div
            className="flex items-center gap-2 px-3 rounded-xl bg-white/10 border border-white/20"
            style={{ paddingTop: '7px', paddingBottom: '7px' }}
          >
            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value.replace(/[^a-zA-Z0-9_.\ ]/g, '').slice(0, 30))}
              placeholder="Search by name..."
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ fontSize: '16px' }}
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-300 text-sm"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-80 px-3 pb-4">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">No reactions found</p>
          ) : showSections ? (
            <>
              {friendReactors.length > 0 && (
                <>
                  <SectionHeader label="Friends" />
                  {friendReactors.map(renderUser)}
                  {communityReactors.length > 0 && (
                    <div className="mx-2 my-2 border-t border-white/[0.07]" />
                  )}
                </>
              )}
              {communityReactors.length > 0 && (
                <>
                  <SectionHeader label="Community" />
                  {communityReactors.map(renderUser)}
                </>
              )}
            </>
          ) : (
            filtered.map(renderUser)
          )}
        </div>
      </div>
    </>
  );
}