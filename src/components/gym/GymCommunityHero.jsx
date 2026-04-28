import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Activity, Trophy, Dumbbell, MapPin, BadgeCheck, Crown, Edit } from 'lucide-react';

const CARD_STYLE = { background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 2px 12px rgba(0,0,0,0.35)' };

export default function GymCommunityHero({
  gym,
  activeTab,
  setActiveTab,
  isGymOwner,
  isMember,
  isGhostGym,
  viewAsMember,
  setViewAsMember,
  isCoach,
  onEditHero,
  onMakeOfficial,
  onJoinGym,
  isJoining
}) {
  const tabTriggerClass = "whitespace-nowrap ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-slate-900/80 backdrop-blur-md text-slate-400 font-bold rounded-full px-2.5 py-1 flex items-center gap-1 justify-center border border-slate-600/40 shadow-[0_3px_0_0_#0d1220,inset_0_1px_0_rgba(255,255,255,0.08)] data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:via-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-[11.5px] transform-gpu";

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {gym?.image_url ?
        <img src={gym.image_url} alt={gym?.name} className="w-full h-full object-cover" style={{ opacity: 0.55 }} loading="eager" fetchPriority="high" /> :
        <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,4,10,0.3) 0%, rgba(2,4,10,0.0) 40%, rgba(2,4,10,0.75) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,4,10,0.5) 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 px-4 pt-3 pb-0" style={{ minHeight: '110px' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className={`font-black text-white drop-shadow-lg ${(gym?.name?.length || 0) > 28 ? 'text-base' : (gym?.name?.length || 0) > 18 ? 'text-lg' : 'text-xl'}`}>{gym?.name || ''}</h1>
              {gym?.verified && <BadgeCheck className="w-4 h-4 text-blue-400 flex-shrink-0 drop-shadow" />}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-white/60 text-[11px] flex items-center gap-1"><MapPin className="w-3 h-3" />{gym?.city}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {gym && isGhostGym && isMember && !isGymOwner &&
            <button onClick={onMakeOfficial} className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-white bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_2px_0_0_#5b21b6,0_4px_14px_rgba(120,40,220,0.35)] active:shadow-none active:translate-y-[2px] active:scale-95 transition-all duration-100" style={{ fontSize: '10.2px' }}>
              <Crown className="w-3 h-3" />Make Official
            </button>
            }
            {!isMember && !isGymOwner &&
            <button onClick={onJoinGym} disabled={isJoining} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_3px_0_0_#5b21b6,0_6px_20px_rgba(120,40,220,0.4)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
              {isJoining ? 'Joining...' : 'Join Gym'}
            </button>
            }
            {isGymOwner &&
            <button onClick={onEditHero} className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
              <Edit className="w-3 h-3 inline mr-1" />Edit Hero
            </button>
            }
            {isGymOwner &&
            <button onClick={() => setViewAsMember(!viewAsMember)} className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-white/90 active:scale-95 transition-transform">
              {viewAsMember ? '👤 Member' : '👑 Owner'}
            </button>
            }
            {isCoach && !isGymOwner &&
            <div className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'rgba(59,130,246,0.7)' }}>🎓 Coach</div>
            }
          </div>
        </div>
      </div>

      <div className="relative z-10 pt-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <TabsList className="flex bg-transparent py-2 h-auto gap-1.5" style={{ minWidth: '100%', paddingLeft: '12px', paddingRight: '12px' }}>
          <div className="flex gap-1.5">
            <TabsTrigger value="home" className={tabTriggerClass}><Home className="w-3.5 h-3.5" /><span>Home</span></TabsTrigger>
            <TabsTrigger value="activity" className={tabTriggerClass}><Activity className="w-3.5 h-3.5" /><span>Activity</span></TabsTrigger>
            <TabsTrigger value="challenges" className={tabTriggerClass}><Trophy className="w-3.5 h-3.5" /><span>Challenges</span></TabsTrigger>
            <TabsTrigger value="classes" className={tabTriggerClass}><Dumbbell className="w-3.5 h-3.5" /><span>Classes</span></TabsTrigger>
          </div>
        </TabsList>
      </div>
    </div>
  );
}