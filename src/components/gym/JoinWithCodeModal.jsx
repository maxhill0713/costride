import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const createPageUrl = (pageName) => `/${pageName}`;

const ANIMATION_STYLES = `
  @keyframes modalIn {
    0%   { transform: translateY(24px) scale(0.93); opacity: 0; }
    100% { transform: translateY(0px)  scale(1.0);  opacity: 1; }
  }
  @keyframes modalOut {
    0%   { transform: translateY(0px)  scale(1.0);  opacity: 1; }
    100% { transform: translateY(18px) scale(0.93); opacity: 0; }
  }
  @keyframes backdropIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes backdropOut { from { opacity: 1; } to { opacity: 0; } }

  @keyframes charPop {
    0%   { transform: scale(0.4) translateY(6px); opacity: 0; }
    55%  { transform: scale(1.2) translateY(-3px); opacity: 1; }
    80%  { transform: scale(0.94) translateY(1px); }
    100% { transform: scale(1.0) translateY(0px);  opacity: 1; }
  }

  @keyframes slotFill {
    0%   { background: rgba(51,65,85,0.5); border-color: rgba(100,116,139,0.4); }
    40%  { background: rgba(6,182,212,0.28); border-color: rgba(6,182,212,1); box-shadow: 0 0 0 3px rgba(6,182,212,0.2); }
    100% { background: rgba(6,182,212,0.15); border-color: rgba(6,182,212,0.7); box-shadow: none; }
  }

  @keyframes errorShake {
    0%,100% { transform: translateX(0); }
    15%  { transform: translateX(-8px); }
    35%  { transform: translateX(7px); }
    50%  { transform: translateX(-5px); }
    70%  { transform: translateX(4px); }
    85%  { transform: translateX(-2px); }
  }
  @keyframes errorIn {
    0%   { transform: translateY(-8px) scale(0.96); opacity: 0; }
    65%  { transform: translateY(2px)  scale(1.01); opacity: 1; }
    100% { transform: translateY(0)    scale(1);    opacity: 1; }
  }

  @keyframes btnBounce {
    0%   { transform: scale(1); }
    25%  { transform: scale(0.92) translateY(3px); }
    55%  { transform: scale(1.05) translateY(-3px); }
    78%  { transform: scale(0.98); }
    100% { transform: scale(1); }
  }

  @keyframes itemIn {
    0%   { transform: translateY(12px); opacity: 0; }
    65%  { transform: translateY(-2px); opacity: 1; }
    100% { transform: translateY(0);    opacity: 1; }
  }

  .modal-enter    { animation: modalIn    280ms cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
  .modal-exit     { animation: modalOut   200ms cubic-bezier(0.4,0,1,1)     forwards; }
  .backdrop-enter { animation: backdropIn  280ms ease forwards; }
  .backdrop-exit  { animation: backdropOut 200ms ease forwards; }
  .error-shake    { animation: errorShake  420ms cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
  .error-in       { animation: errorIn     300ms cubic-bezier(0.22,1,0.36,1) forwards; }
  .btn-bounce     { animation: btnBounce   360ms cubic-bezier(0.22,1,0.36,1) forwards; }
  .item-in        { opacity: 0; animation: itemIn 380ms cubic-bezier(0.22,1,0.36,1) forwards; }
`;

function useAnimationStyles() {
  useEffect(() => {
    const id = 'join-modal-anim-styles';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = ANIMATION_STYLES;
      document.head.appendChild(tag);
    }
  }, []);
}

// Individual animated slot
function CodeSlot({ char, index, prevLength, currentLength }) {
  const filled = !!char;
  const charKey = filled ? `${char}-${index}-${currentLength}` : `empty-${index}`;

  return (
    <div
      style={{
        width: 40, height: 48,
        borderRadius: 12,
        border: '2px solid',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 900,
        color: '#e2f8ff',
        animation: filled ? `slotFill 300ms ease forwards` : undefined,
        background: filled ? 'rgba(6,182,212,0.15)' : 'rgba(51,65,85,0.5)',
        borderColor: filled ? 'rgba(6,182,212,0.7)' : 'rgba(100,116,139,0.4)',
        transition: 'background 200ms, border-color 200ms',
      }}
    >
      {filled && (
        <span key={charKey} style={{ display: 'inline-block', animation: 'charPop 280ms cubic-bezier(0.22,1,0.36,1) forwards' }}>
          {char}
        </span>
      )}
    </div>
  );
}

function CodeDisplay({ code }) {
  const [prevLength, setPrevLength] = useState(0);
  useEffect(() => { setPrevLength(code.length); }, [code]);

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '6px 0' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <CodeSlot key={i} char={code[i] || ''} index={i} prevLength={prevLength} currentLength={code.length} />
      ))}
    </div>
  );
}

export default function JoinWithCodeModal({ open, onClose, currentUser, gymCount = 0 }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [shakeInput, setShakeInput] = useState(false);
  const [btnBounce, setBtnBounce] = useState(false);
  const queryClient = useQueryClient();

  useAnimationStyles();

  useEffect(() => {
    if (open) { setExiting(false); setVisible(true); }
  }, [open]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => { setVisible(false); setExiting(false); onClose(); }, 200);
  };

  useEffect(() => {
    if (open) {
      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get('joinCode');
      if (joinCode) setCode(joinCode.toUpperCase());
    }
  }, [open]);

  const triggerShake = () => {
    setShakeInput(false);
    requestAnimationFrame(() => setShakeInput(true));
    setTimeout(() => setShakeInput(false), 440);
  };

  const joinMutation = useMutation({
    mutationFn: async (joinCode) => {
      const gyms = await base44.entities.Gym.filter({ join_code: joinCode.toUpperCase() });
      if (gyms.length === 0) throw new Error('Invalid gym code');
      const gym = gyms[0];

      // Use the count from the My Gyms page (already filtered to valid gyms)
      if (gymCount >= 3)
        throw new Error('You can only be a member of up to 3 gyms. Please leave a gym before joining a new one.');

      if (gym.banned_members?.includes(currentUser.id))
        throw new Error('You are banned from this gym');

      const existing = await base44.entities.GymMembership.filter({ user_id: currentUser.id, gym_id: gym.id, status: 'active' });
      if (existing.length > 0) throw new Error('Already a member of this gym');

      await base44.entities.GymMembership.create({
        user_id: currentUser.id, user_name: currentUser.full_name, user_email: currentUser.email,
        gym_id: gym.id, gym_name: gym.name, status: 'active',
        join_date: new Date().toISOString().split('T')[0], membership_type: 'monthly'
      });
      await base44.entities.Gym.update(gym.id, { members_count: (gym.members_count || 0) + 1 });
      // Auto-set as primary gym if user has no primary gym yet
      if (!currentUser.primary_gym_id) {
        await base44.auth.updateMe({ primary_gym_id: gym.id });
      }
      return gym;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['gymMemberships', currentUser?.id] });
    },
    onSuccess: (gym) => {
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      toast.success(`Joined ${gym.name}! 🎉`);
      handleClose();
      setTimeout(() => { window.location.href = createPageUrl('GymCommunity') + '?id=' + gym.id; }, 230);
    },
    onError: (err) => {
      setError(err.message);
      triggerShake();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError('Code must be 6 characters');
      triggerShake();
      return;
    }
    setBtnBounce(false);
    requestAnimationFrame(() => setBtnBounce(true));
    setTimeout(() => setBtnBounce(false), 380);
    joinMutation.mutate(code);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${exiting ? 'backdrop-exit' : 'backdrop-enter'}`}
      onClick={handleClose}
    >
      <Card
        className={`max-w-md w-full p-4 md:p-6 shadow-2xl shadow-black/20 rounded-3xl border ${exiting ? 'modal-exit' : 'modal-enter'}`}
        style={{
          background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top shine line */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 item-in" style={{ animationDelay: '80ms' }}>
          <h2 className="text-lg md:text-2xl font-black text-white">
            Join with Code
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <div className="item-in" style={{ animationDelay: '140ms' }}>
            <label className="text-xs md:text-sm font-bold text-slate-300 mb-2 block">
              Enter your gym's 6-character code
            </label>

            {/* Animated slot display */}
            <div className={shakeInput ? 'error-shake' : ''}>
              <CodeDisplay code={code} />
            </div>

            {/* Actual input (smaller, secondary) */}
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="FIT123"
              maxLength={6}
              className="text-center text-sm font-bold tracking-widest bg-slate-700/30 border-slate-600/40 text-white/50 rounded-xl h-8 mt-2 placeholder:text-slate-600"
              autoFocus
            />
            <p className="text-[10px] md:text-xs text-slate-400 mt-2">
              Ask your gym for their unique join code
            </p>
          </div>

          {error && (
            <div className="error-in flex items-center gap-2 p-2 md:p-3 bg-red-900/30 border border-red-600/50 rounded-xl">
              <AlertCircle className="w-4 md:w-5 h-4 md:h-5 text-red-400 flex-shrink-0" />
              <p className="text-xs md:text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="item-in" style={{ animationDelay: '200ms' }}>
            <Button
              type="submit"
              disabled={code.length !== 6 || joinMutation.isPending}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-4 py-2 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold h-10 md:h-12 rounded-xl text-sm md:text-base border border-transparent shadow-[0_4px_0_0_rgba(6,100,180,0.85),0_8px_20px_rgba(6,182,212,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[4px] transform-gpu transition-shadow duration-75 ${btnBounce ? 'btn-bounce' : ''}`}
            >
              {joinMutation.isPending ? (
                <><Loader2 className="w-4 md:w-5 h-4 md:h-5 mr-2 animate-spin" />Joining...</>
              ) : (
                <><CheckCircle className="w-4 md:w-5 h-4 md:h-5 mr-2" />Join Gym</>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-white/5 border border-white/8 rounded-xl item-in" style={{ animationDelay: '260ms' }}>
          <h3 className="text-xs md:text-sm font-bold text-slate-300 mb-2">How it works</h3>
          <ul className="text-[10px] md:text-xs text-slate-300 space-y-1">
            <li>• Get your gym's unique code</li>
            <li>• Enter it above</li>
            <li>• Instant access to the community</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}