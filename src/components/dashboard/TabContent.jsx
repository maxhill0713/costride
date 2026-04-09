import React, { useMemo, useState, useRef, useEffect } from 'react';
import { format, subDays, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import {
  Trophy, BarChart2, Calendar, ChevronRight, TrendingUp, TrendingDown,
  Heart, MessageCircle, MoreHorizontal, Trash2, CheckCircle, Plus,
  Users, Flame, HelpCircle, ChevronLeft, List,
} from 'lucide-react';
import { AppButton } from '@/components/ui/AppButton';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppProgressBar } from '@/components/ui/AppProgressBar';
import { cn } from '@/lib/utils';

/* ─── PRIMITIVES ─── */
function Av({ name = '', size = 28, src = null }) {
  const letters = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const hue = (name.charCodeAt(0) || 72) % 360;
  if (src) return (
    <img src={src} alt={name} className="rounded-full object-cover shrink-0"
         style={{ width: size, height: size }}
         onError={e => { e.currentTarget.style.display = 'none'; }} />
  );
  return (
    <div className="flex items-center justify-center shrink-0 font-extrabold"
         style={{ width: size, height: size, borderRadius: size * 0.28,
                  background: `hsl(${hue},38%,16%)`,
                  border: `1.5px solid hsl(${hue},38%,24%)`,
                  fontSize: size * 0.32,
                  color: `hsl(${hue},60%,60%)` }}>
      {letters}
    </div>
  );
}

function DelBtn({ onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-[22px] h-[22px] flex items-center justify-center bg-transparent border border-white/[0.04] rounded-[5px] cursor-pointer transition-colors hover:border-white/[0.07]">
        <MoreHorizontal className="w-[11px] h-[11px] text-[#4b5578]" />
      </button>
      {open && (
        <div className="absolute top-[26px] right-0 z-[9999] bg-[#060d1c] border border-white/[0.07] rounded-[9px] shadow-[0_8px_28px_rgba(0,0,0,0.75)] min-w-[100px] overflow-hidden">
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-[7px] px-[13px] py-[9px] text-[11.5px] font-bold text-red-500 bg-transparent border-none cursor-pointer hover:bg-red-500/[0.07] transition-colors">
            <Trash2 className="w-[11px] h-[11px]" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── METRICS BAR ─── */
function MetricsBar({ allPosts, allMemberships, now }) {
  const weekPosts = allPosts.filter(p => new Date(p.created_date || 0) >= subDays(now, 7));
  const totalMem  = allMemberships.length;
  const totalInt  = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0);
  const engRate   = totalMem > 0 ? Math.round((totalInt / totalMem) * 100) : 0;
  const activeMem = new Set([
    ...allPosts.flatMap(p => p.likes || []),
    ...allPosts.flatMap(p => (p.comments || []).map(c => c.user_id).filter(Boolean)),
  ]).size;
  const typeMap = {};
  allPosts.forEach(p => {
    const type = (p.image_url || p.media_url) ? 'Photo' : p.poll_options ? 'Poll' : 'Text';
    typeMap[type] = (typeMap[type] || 0) + (p.likes?.length || 0) + (p.comments?.length || 0) * 2;
  });
  const bestType    = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const wkDotClass  = weekPosts.length === 0 ? 'bg-red-500' : weekPosts.length < 3 ? 'bg-amber-400' : 'bg-emerald-500';
  const engDotClass = engRate > 0 ? 'bg-emerald-500' : 'bg-[#252d45]';
  const actDotClass = activeMem > 0 ? 'bg-emerald-500' : 'bg-[#252d45]';

  const metrics = [
    { icon: Flame,     iconClass: 'text-orange-500',  label: 'Posts This Week',   display: String(weekPosts.length), sub: 'Gyms posting 3×/week see +40% retention', dotClass: wkDotClass },
    { icon: BarChart2, iconClass: 'text-blue-500',    label: 'Engagement Rate',   display: `${engRate}%`,           sub: totalMem > 0 ? `Across ${totalMem} members` : 'Add members to track', dotClass: engDotClass },
    { icon: Users,     iconClass: 'text-emerald-500', label: 'Actively Engaging', display: String(activeMem), suffix: ' Members', sub: activeMem > 0 ? 'Liked or commented recently' : 'No interactions yet', dotClass: actDotClass },
    { icon: Trophy,    iconClass: 'text-amber-400',   label: 'Top Post Type',     display: bestType, sub: allPosts.length > 0 ? 'Best for likes & saves' : 'Post to see insights', isDonut: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/[0.04] shrink-0 bg-[#0a0f1e]">
      {metrics.map((m, i) => (
        <div key={i} className={cn(
          'px-5 py-[14px] relative cursor-default transition-colors hover:bg-[#0d1225]',
          i < metrics.length - 1 && 'border-r border-white/[0.04]',
        )}>
          <div className="flex items-center gap-1.5 mb-[7px]">
            <m.icon className={cn('w-[11px] h-[11px]', m.iconClass)} />
            <span className="text-[10.5px] font-semibold text-[#4b5578] tracking-[0.01em]">{m.label}</span>
            <div className="ml-auto flex items-center gap-[5px]">
              {m.dotClass && <div className={cn('w-[5px] h-[5px] rounded-full', m.dotClass)} />}
              {m.isDonut && (
                <svg viewBox="0 0 34 34" className="w-7 h-7 -rotate-90">
                  <circle cx="17" cy="17" r="12" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                  <circle cx="17" cy="17" r="12" fill="none" stroke="#0d9488" strokeWidth="4" strokeDasharray="46 75" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
          <div className="text-[28px] font-extrabold text-[#eef2ff] tracking-[-0.035em] leading-none mb-[5px]">
            {m.display}
            {m.suffix && <span className="text-sm font-semibold text-[#8b95b3] ml-1">{m.suffix}</span>}
          </div>
          <div className="text-[10px] text-[#4b5578] leading-relaxed">{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── QUICK IDEAS ─── */
const QUICK_IDEAS = [
  { icon: Flame,  iconClass: 'text-orange-500', bgClass: 'bg-orange-500/[0.12]', borderClass: 'border-orange-500/[0.19]', ctaClass: 'text-orange-500', title: 'Motivation Monday',         desc: 'Drives comments',      cta: 'Generate post',   modal: 'post'      },
  { icon: Users,  iconClass: 'text-blue-500',   bgClass: 'bg-blue-500/[0.12]',   borderClass: 'border-blue-500/[0.19]',   ctaClass: 'text-blue-500',   title: 'Member Spotlight',          desc: 'Builds community',     cta: 'Create',          modal: 'post'      },
  { icon: Trophy, iconClass: 'text-amber-400',  bgClass: 'bg-amber-400/[0.12]',  borderClass: 'border-amber-400/[0.19]',  ctaClass: 'text-amber-400',  title: 'Start a weekend challenge', desc: 'Increases attendance', cta: 'Start challenge', modal: 'challenge' },
];

function QuickIdeas({ openModal }) {
  return (
    <div>
      <div className="flex items-center gap-[7px] mb-[11px]">
        <span className="text-[13px] font-bold text-[#eef2ff]">Quick post ideas</span>
        <HelpCircle className="w-3 h-3 text-[#4b5578]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[9px]">
        {QUICK_IDEAS.map((c, i) => (
          <div
            key={i}
            className="bg-[#0d1225] border border-white/[0.07] rounded-[11px] p-4 cursor-pointer transition-all duration-150 flex flex-col gap-4 hover:border-white/[0.14] hover:bg-[#101929] hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
            onClick={() => openModal(c.modal)}
          >
            <div className="flex items-center gap-[13px]">
              <div className={cn('w-[42px] h-[42px] rounded-[12px] shrink-0 border flex items-center justify-center', c.bgClass, c.borderClass)}>
                <c.icon className={cn('w-[19px] h-[19px]', c.iconClass)} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[#eef2ff] leading-snug mb-1">{c.title}</div>
                <div className="text-[11px] text-[#4b5578] leading-snug">{c.desc}</div>
              </div>
            </div>
            <button
              className={cn('w-full py-[10px] rounded-[7px] text-[13px] font-bold cursor-pointer bg-[#050810] border border-white/[0.07] transition-all tracking-[0.01em]', c.ctaClass)}
              onClick={e => { e.stopPropagation(); openModal(c.modal); }}
            >
              {c.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FEED CARDS ─── */
const CARD = 'bg-[#0d1225] border border-white/[0.04] rounded-2xl overflow-hidden transition-colors hover:border-white/[0.07] relative';

function FeedPostCard({ post, onDelete, isTop, totalMembers }) {
  const likes    = post.likes?.length    || 0;
  const comments = post.comments?.length || 0;
  const engRate  = totalMembers > 0 ? Math.round(((likes + comments) / totalMembers) * 100) : 0;
  const title    = post.title || (post.content || '').split('\n')[0] || '';
  const body     = post.title ? (post.content || '') : '';
  return (
    <div className={cn(CARD, isTop && 'border-blue-500/[0.22]')}>
      {isTop && <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-transparent" />}
      {isTop && (
        <div className="absolute top-[10px] left-[11px] z-[2]">
          <AppBadge variant="active">⭐ Top Post</AppBadge>
        </div>
      )}
      <div className="px-[14px] pt-3">
        <div className="flex items-center gap-2">
          <Av name={post.author_name || post.gym_name || 'G'} size={26} src={post.author_avatar || null} />
          <span className="flex-1 text-xs font-semibold text-[#8b95b3] overflow-hidden text-ellipsis whitespace-nowrap">
            {post.author_name || post.gym_name || 'Gym Post'}
          </span>
          <span className="text-[10px] text-[#4b5578] shrink-0">{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
          <DelBtn onDelete={() => onDelete(post.id)} />
        </div>
      </div>
      {title && (
        <div className="px-[14px] py-[10px]">
          <p className="text-[13.5px] font-bold text-[#eef2ff] mb-1 leading-snug">{title}</p>
          {body && <p className="text-xs text-[#8b95b3] leading-relaxed line-clamp-2">{body}</p>}
        </div>
      )}
      {(post.image_url || post.media_url) && (
        <div className="mx-[14px] mb-[10px] rounded-[8px] overflow-hidden">
          <img src={post.image_url || post.media_url} alt="" className="w-full max-h-[140px] object-cover block" onError={e => e.currentTarget.parentElement.style.display = 'none'} />
        </div>
      )}
      <div className="px-[14px] pb-[11px] pt-2 flex items-center gap-3 border-t border-white/[0.03]">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4b5578]"><Heart className="w-[11px] h-[11px]" />{likes}</span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4b5578]"><MessageCircle className="w-[11px] h-[11px]" />{comments}</span>
        {engRate > 0 && <AppBadge variant="active" className="ml-auto">{engRate}% engaged</AppBadge>}
      </div>
    </div>
  );
}

function EventCard({ event, now, onDelete }) {
  const evDate = new Date(event.event_date);
  const diff   = Math.max(0, Math.floor((evDate - now) / 86400000));
  const timingLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`;
  return (
    <div className={CARD}>
      <div className="p-[14px]">
        <div className="flex items-center gap-2 mb-[9px]">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-blue-500/[0.08] border border-blue-500/[0.13] flex items-center justify-center shrink-0">
            <Calendar className="w-[11px] h-[11px] text-blue-500" />
          </div>
          <AppBadge variant="active">Event</AppBadge>
          <AppBadge variant={diff <= 2 ? 'warning' : 'neutral'}>{timingLabel}</AppBadge>
          <div className="ml-auto"><DelBtn onDelete={() => onDelete(event.id)} /></div>
        </div>
        <p className="text-[13px] font-bold text-[#eef2ff] mb-1">{event.title}</p>
        {event.description && <p className="text-[11px] text-[#8b95b3] mb-[7px] leading-relaxed">{event.description}</p>}
        <div className="text-[10px] text-[#4b5578]">{format(evDate, 'MMM d, h:mm a')}</div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, now, onDelete }) {
  const start  = new Date(challenge.start_date), end = new Date(challenge.end_date);
  const totalD  = Math.max(1, Math.floor((end - start) / 86400000));
  const elapsed = Math.max(0, Math.floor((now - start) / 86400000));
  const rem     = Math.max(0, totalD - elapsed);
  const pct     = Math.min(100, Math.round((elapsed / totalD) * 100));
  const parts   = challenge.participants?.length || 0;
  return (
    <div className={CARD}>
      <div className="p-[14px]">
        <div className="flex items-center gap-2 mb-[9px]">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-amber-400/[0.08] border border-amber-400/[0.13] flex items-center justify-center shrink-0">
            <Trophy className="w-[11px] h-[11px] text-amber-400" />
          </div>
          <AppBadge variant="active">Challenge</AppBadge>
          <AppBadge variant={rem <= 3 ? 'warning' : 'neutral'}>{rem}d left</AppBadge>
          <div className="ml-auto"><DelBtn onDelete={() => onDelete(challenge.id)} /></div>
        </div>
        <p className="text-[13px] font-bold text-[#eef2ff] mb-[10px]">{challenge.title}</p>
        <div className="flex justify-between mb-[5px]">
          <span className="text-[11px] text-[#4b5578]">{parts} joined</span>
          <span className="text-[11px] font-bold text-blue-500">{pct}%</span>
        </div>
        <AppProgressBar value={pct} colorClass="bg-blue-500" className="h-[2px]" />
      </div>
    </div>
  );
}

function PollCard({ poll, onDelete, allMemberships }) {
  const votes = poll.voters?.length || 0;
  const total = allMemberships?.length || 0;
  const pct   = total > 0 ? Math.round((votes / total) * 100) : 0;
  return (
    <div className={CARD}>
      <div className="p-[14px]">
        <div className="flex items-center gap-2 mb-[9px]">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-blue-500/[0.08] border border-blue-500/[0.13] flex items-center justify-center shrink-0">
            <BarChart2 className="w-[11px] h-[11px] text-blue-500" />
          </div>
          <AppBadge variant="active">Poll</AppBadge>
          {pct > 0 && <AppBadge variant="neutral">{pct}% voted</AppBadge>}
          <div className="ml-auto"><DelBtn onDelete={() => onDelete(poll.id)} /></div>
        </div>
        <p className="text-[13px] font-bold text-[#eef2ff] mb-[10px]">{poll.title}</p>
        <AppProgressBar value={pct} colorClass="bg-blue-500" className="h-[2px] mb-[6px]" />
        <div className="text-[11px] text-[#4b5578]">{votes} vote{votes !== 1 ? 's' : ''}{total > 0 ? ` of ${total} members` : ''}</div>
      </div>
    </div>
  );
}

const CLS_IMGS = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=400&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  default:  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
};
function getClsType(c) {
  const n = (c.class_type || c.name || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('flow'))     return 'yoga';
  if (n.includes('strength') || n.includes('lift')) return 'strength';
  return 'default';
}
function ClassCard({ gymClass, onDelete }) {
  const type = getClsType(gymClass);
  return (
    <div className={CARD}>
      <div className="relative h-20 overflow-hidden">
        <img src={gymClass.image_url || CLS_IMGS[type]} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d1225cc]" />
        <span className="absolute top-[7px] left-[9px] text-[8.5px] font-extrabold tracking-[0.08em] uppercase text-blue-500 bg-black/50 border border-blue-500/[0.22] rounded px-[6px] py-[2px]">
          {type.toUpperCase()}
        </span>
      </div>
      <div className="px-[13px] py-[10px] pb-3">
        <div className="flex items-center justify-between gap-1.5">
          <div className="text-[13px] font-bold text-[#eef2ff] flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{gymClass.name || gymClass.title}</div>
          <DelBtn onDelete={() => onDelete(gymClass.id)} />
        </div>
        {gymClass.duration_minutes && <div className="text-[11px] text-[#4b5578] mt-[3px]">{gymClass.duration_minutes} min</div>}
        {gymClass.instructor       && <div className="text-[11px] text-[#8b95b3] mt-[3px]">{gymClass.instructor}</div>}
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ─── */
function EmptyState({ openModal, label }) {
  return (
    <div className="flex flex-col items-center py-[52px] px-5 gap-[14px] text-center">
      <div className="w-[50px] h-[50px] rounded-[14px] bg-blue-500/10 border border-blue-500/[0.22] flex items-center justify-center">
        <Flame className="w-[22px] h-[22px] text-blue-500" />
      </div>
      <div>
        <p className="text-[15px] font-extrabold text-[#eef2ff] mb-[6px]">🔥 Let's get your members engaged!</p>
        <p className="text-xs text-[#4b5578] leading-relaxed">
          {label ? `No ${label} yet.` : 'Your feed is empty. Create your first piece of content.'}
        </p>
      </div>
      <div className="flex gap-[7px] flex-wrap justify-center">
        <AppButton variant="primary"   size="sm" onClick={() => openModal('post')}><Plus className="w-[13px] h-[13px]" /> Create first post</AppButton>
        <AppButton variant="secondary" size="sm" onClick={() => openModal('challenge')}><Trophy className="w-[13px] h-[13px]" /> Start a challenge</AppButton>
        <AppButton variant="secondary" size="sm" onClick={() => openModal('poll')}><HelpCircle className="w-[13px] h-[13px]" /> Ask a question</AppButton>
      </div>
    </div>
  );
}

/* ─── CALENDAR VIEW ─── */
function CalendarView({ allPosts, events, now, openModal }) {
  const [viewMonth, setViewMonth] = useState(now);
  const ms   = startOfMonth(viewMonth), me = endOfMonth(viewMonth);
  const days   = eachDayOfInterval({ start: ms, end: me });
  const blanks = Array(getDay(ms)).fill(null);
  const DOW    = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const postDates = new Set(allPosts.map(p => format(new Date(p.created_date || 0), 'yyyy-MM-dd')));
  const evDates   = new Set(events.map(e => format(new Date(e.event_date    || 0), 'yyyy-MM-dd')));
  return (
    <div>
      <div className="flex items-center justify-between mb-[10px]">
        <button onClick={() => setViewMonth(subDays(ms, 1))} className="bg-[#0d1225] border border-white/[0.04] rounded-[5px] px-[7px] py-1 cursor-pointer text-[#8b95b3] flex transition-colors hover:border-white/[0.07]">
          <ChevronLeft className="w-3 h-3" />
        </button>
        <span className="text-xs font-bold text-[#eef2ff]">{format(viewMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setViewMonth(new Date(me.getTime() + 86400000))} className="bg-[#0d1225] border border-white/[0.04] rounded-[5px] px-[7px] py-1 cursor-pointer text-[#8b95b3] flex transition-colors hover:border-white/[0.07]">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
        {DOW.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-[#4b5578] py-[2px] tracking-[0.05em]">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[2px]">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const key     = format(day, 'yyyy-MM-dd');
          const hasPost = postDates.has(key);
          const hasEv   = evDates.has(key);
          const today   = isToday(day);
          return (
            <div key={key} className={cn(
              'h-[26px] flex items-center justify-center text-[10.5px] rounded-[5px] relative text-[#8b95b3] font-medium cursor-default transition-colors',
              today ? 'bg-blue-500 text-white font-extrabold' : 'hover:bg-[#0d1225]',
            )}>
              {format(day, 'd')}
              {(hasPost || hasEv) && !today && (
                <div className="absolute bottom-[1px] left-1/2 -translate-x-1/2 flex gap-[2px]">
                  {hasPost && <div className="w-[3px] h-[3px] rounded-full bg-blue-500" />}
                  {hasEv   && <div className="w-[3px] h-[3px] rounded-full bg-orange-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 p-[11px] rounded-[7px] bg-[#0d1225] border border-white/[0.04]">
        <div className="flex items-start gap-[7px] mb-[6px]">
          <div className="w-[5px] h-[5px] rounded-full bg-[#4b5578] mt-1 shrink-0" />
          <span className="text-[10.5px] text-[#4b5578] leading-relaxed">No content scheduled. Filling your calendar keeps members engaged.</span>
        </div>
        <div className="flex items-center gap-[6px]">
          <CheckCircle className="w-[9px] h-[9px] text-emerald-500 shrink-0" />
          <span className="text-[10px] text-[#4b5578]">Best engagement time: <span className="text-emerald-500 font-bold">5–7pm</span></span>
        </div>
      </div>

      <AppButton variant="primary" className="w-full justify-center mt-[10px] text-[11.5px]" onClick={() => openModal('post')}>
        <Plus className="w-3 h-3" /> Schedule a Post
      </AppButton>
    </div>
  );
}

/* ─── RIGHT PANEL ─── */
const SUGG_IMGS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&q=80',
  'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=120&q=80',
];
const AI_SUGGS = [
  { dotClass: 'bg-blue-500',    label: 'Motivation Monday',         sub: 'Share a motivating quote · Drives comments',       btns: [{ label: 'Generate post',  primary: true,  modal: 'post'      }, { label: 'Make it →',  primary: false, modal: 'post'      }] },
  { dotClass: 'bg-emerald-500', label: 'Post a member spotlight',   sub: 'Feature a dedicated member from your community',   btns: [{ label: 'Create',         primary: true,  modal: 'post'      }, { label: 'Refine',     primary: false, modal: 'post'      }] },
  { dotClass: 'bg-amber-400',   label: 'Start a weekend challenge', sub: 'Clearly repeat a signature event',                  btns: [{ label: 'Start challenge', primary: true, modal: 'challenge' }, { label: 'Goals',      primary: false, modal: 'challenge' }] },
];

function AISuggestions({ openModal }) {
  return (
    <div>
      <div className="flex items-center gap-[6px] mb-[10px]">
        <Flame className="w-3 h-3 text-orange-500" />
        <span className="text-xs font-bold text-[#eef2ff]">What should you post today?</span>
      </div>
      <div className="flex flex-col gap-[7px]">
        {AI_SUGGS.map((s, i) => (
          <div key={i}
            className="bg-[#050810] border border-white/[0.04] rounded-2xl p-[11px] cursor-pointer transition-all hover:border-blue-500/[0.22] hover:bg-[#0d1225]"
            onClick={() => openModal(s.btns[0].modal)}>
            <div className="flex gap-[9px] items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[5px] mb-[2px]">
                  <div className={cn('w-[5px] h-[5px] rounded-full shrink-0', s.dotClass)} />
                  <div className="text-[11.5px] font-bold text-[#eef2ff] overflow-hidden text-ellipsis whitespace-nowrap">{s.label}</div>
                </div>
                <div className="text-[9.5px] text-[#4b5578] mb-2 pl-[10px] leading-snug">{s.sub}</div>
                <div className="flex gap-[5px] pl-[10px]">
                  {s.btns.map((b, j) => (
                    <button key={j}
                      className={cn(
                        'text-[10.5px] font-bold px-[10px] py-[5px] rounded-[6px] cursor-pointer transition-all',
                        b.primary
                          ? 'bg-blue-500/10 border border-blue-500/[0.22] text-blue-500 hover:bg-blue-500 hover:text-white'
                          : 'bg-transparent border border-white/[0.04] text-[#8b95b3] hover:border-white/[0.07] hover:text-[#eef2ff]',
                      )}
                      onClick={e => { e.stopPropagation(); openModal(b.modal); }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-[44px] h-[44px] rounded-[7px] overflow-hidden shrink-0">
                <img src={SUGG_IMGS[i]} alt="" className="w-full h-full object-cover" onError={e => e.currentTarget.parentElement.style.display = 'none'} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngagementScore({ allPosts, polls, activeChallenges, now, openModal }) {
  const score = (s, e) =>
    allPosts.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; })
      .reduce((a, x) => a + (x.likes?.length || 0) + (x.comments?.length || 0), 0) +
    polls.filter(x => { const d = new Date(x.created_date || 0); return d >= s && d < e; })
      .reduce((a, x) => a + (x.voters?.length || 0), 0);
  const thisW = score(subDays(now, 7), now);
  const lastW = score(subDays(now, 14), subDays(now, 7));
  const chg   = lastW === 0 ? 0 : Math.round(((thisW - lastW) / lastW) * 100);
  const up    = chg >= 0;
  const total = allPosts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0) +
                polls.reduce((s, p)   => s + (p.voters?.length    || 0), 0) +
                activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const likes    = allPosts.reduce((s, p) => s + (p.likes?.length    || 0), 0);
  const comments = allPosts.reduce((s, p) => s + (p.comments?.length || 0), 0);
  const challP   = activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0);
  const pollV    = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);

  return (
    <div>
      <div className="flex items-center gap-[6px] mb-[10px]">
        <Flame className="w-3 h-3 text-orange-500" />
        <span className="text-xs font-bold text-[#eef2ff]">Engagement Score</span>
        <HelpCircle className="w-[10px] h-[10px] text-[#4b5578]" />
      </div>
      <div className="flex items-baseline gap-[9px] mb-[2px]">
        <span className="text-[38px] font-extrabold text-[#eef2ff] tracking-[-0.04em] leading-none">{total}</span>
        <span className={cn('flex items-center gap-[3px] text-[11px] font-bold', up ? 'text-emerald-500' : 'text-red-500')}>
          {up ? <TrendingUp className="w-[10px] h-[10px]" /> : <TrendingDown className="w-[10px] h-[10px]" />}
          {up ? '+' : ''}{chg}% this week
        </span>
      </div>
      <div className="text-[10px] text-[#4b5578] mb-[13px]">Total interactions</div>
      <div className="flex flex-col mb-[13px]">
        {[
          { l: `${likes} Likes`,       r: `${challP} Challenge Responses` },
          { l: `${comments} Comments`, r: `${pollV} Poll Votes`            },
        ].map((row, i) => (
          <div key={i} className={cn('flex justify-between text-[11px] py-[5px]', i === 0 && 'border-b border-white/[0.03]')}>
            <span className="text-[#8b95b3] font-semibold">{row.l}</span>
            <span className="text-[#4b5578]">{row.r}</span>
          </div>
        ))}
      </div>
      {total === 0 && (
        <div className="text-[10.5px] text-[#8b95b3] px-[11px] py-2 bg-amber-400/[0.07] border border-amber-400/[0.16] rounded-[7px] mb-[11px] leading-relaxed">
          Low engagement — try posting a poll question
        </div>
      )}
      <AppButton variant="primary" className="w-full justify-center text-xs" onClick={() => openModal('post')}>
        <Plus className="w-3 h-3" /> Create
      </AppButton>
    </div>
  );
}

function RightPanel({ allPosts, polls, challenges, events, activeChallenges, allMemberships, now, openModal }) {
  const [view, setView] = useState('feed');
  return (
    <>
      <div className="inline-flex gap-[2px] bg-[#0d1225] border border-white/[0.04] rounded-[7px] p-[2px]">
        <button
          className={cn('inline-flex items-center gap-1 px-[11px] py-[5px] rounded-[5px] text-[11.5px] font-semibold cursor-pointer border-none transition-all', view === 'feed' ? 'bg-blue-500 text-white' : 'bg-transparent text-[#4b5578] hover:text-[#8b95b3]')}
          onClick={() => setView('feed')}>
          <Flame className="w-[10px] h-[10px]" /> Feed
        </button>
        <button
          className={cn('inline-flex items-center gap-1 px-[11px] py-[5px] rounded-[5px] text-[11.5px] font-semibold cursor-pointer border-none transition-all', view === 'cal' ? 'bg-blue-500 text-white' : 'bg-transparent text-[#4b5578] hover:text-[#8b95b3]')}
          onClick={() => setView('cal')}>
          <Calendar className="w-[10px] h-[10px]" /> Calendar
        </button>
      </div>

      <div className="h-px bg-white/[0.03]" />

      {view === 'feed' ? (
        <>
          <AISuggestions openModal={openModal} />
          <div className="h-px bg-white/[0.03]" />
          <EngagementScore allPosts={allPosts} polls={polls} activeChallenges={activeChallenges} now={now} openModal={openModal} />
        </>
      ) : (
        <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
      )}
    </>
  );
}

/* ─── MAIN EXPORT ─── */
export default function TabContent({
  events = [], challenges = [], polls = [], posts = [], userPosts = [],
  checkIns, ci30, avatarMap,
  openModal        = () => {},
  now              = new Date(),
  allMemberships   = [],
  classes          = [],
  currentUser      = null,
  onDeletePost      = () => {},
  onDeleteEvent     = () => {},
  onDeleteChallenge = () => {},
  onDeleteClass     = () => {},
  onDeletePoll      = () => {},
  isCoach = false,
}) {
  const [activeFilter, setActiveFilter] = useState(isCoach ? 'classes' : 'gym');
  const [viewMode,     setViewMode]     = useState('feed');

  const allPosts         = [...(userPosts || []), ...(posts || [])].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const gymPosts         = allPosts.filter(p => !p.user_id || p.gym_id || p.member_id);
  const memberPosts      = allPosts.filter(p => p.user_id && !p.gym_id);
  const upcomingEvents   = events.filter(e => new Date(e.event_date) >= now);
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const totalMembers     = allMemberships.length;

  const postScores = useMemo(() => allPosts.map(p => ({ id: p.id, score: (p.likes?.length || 0) + (p.comments?.length || 0) * 2 })), [allPosts]);
  const maxScore   = Math.max(...postScores.map(p => p.score), 1);
  const topPostIds = new Set(postScores.filter(p => p.score >= maxScore * 0.7 && p.score > 0).map(p => p.id));

  const FILTERS = isCoach
    ? [{ id: 'classes', label: 'My Classes' }, { id: 'gym', label: 'Posts' }, { id: 'challenges', label: 'Challenges' }, { id: 'polls', label: 'Polls' }, { id: 'events', label: 'Events' }]
    : [{ id: 'gym', label: 'Feed' }, { id: 'members', label: 'Members' }, { id: 'challenges', label: 'Challenges' }, { id: 'classes', label: 'Classes' }, { id: 'polls', label: 'Polls' }];

  const feedItems = useMemo(() => {
    const fi = (() => {
      switch (activeFilter) {
        case 'members':    return { posts: memberPosts,   events: [],             challenges: [],               polls: [],  classes: [] };
        case 'gym':        return { posts: gymPosts,       events: [],             challenges: [],               polls: [],  classes: [] };
        case 'challenges': return { posts: [],             events: [],             challenges: activeChallenges, polls: [],  classes: [] };
        case 'classes':    return { posts: [],             events: [],             challenges: [],               polls: [],  classes };
        case 'polls':      return { posts: [],             events: [],             challenges: [],               polls,      classes: [] };
        case 'events':     return { posts: [],             events: upcomingEvents, challenges: [],               polls: [],  classes: [] };
        default:           return { posts: allPosts,       events: upcomingEvents, challenges: activeChallenges, polls,      classes };
      }
    })();
    return [
      ...fi.posts.map(p      => ({ type: 'post',      data: p, date: new Date(p.created_date || 0) })),
      ...fi.events.map(e     => ({ type: 'event',     data: e, date: new Date(e.event_date    || 0) })),
      ...fi.challenges.map(c => ({ type: 'challenge', data: c, date: new Date(c.start_date    || 0) })),
      ...fi.polls.map(p      => ({ type: 'poll',      data: p, date: new Date(p.created_date  || 0) })),
      ...fi.classes.map(c    => ({ type: 'class',     data: c, date: new Date(c.created_date  || 0) })),
    ].sort((a, b) => b.date - a.date);
  }, [activeFilter, allPosts, gymPosts, memberPosts, upcomingEvents, activeChallenges, polls, classes]);

  const renderItem = (item, i) => {
    if (item.type === 'post')      return <FeedPostCard  key={item.data.id || i} post={item.data}      onDelete={onDeletePost}      isTop={topPostIds.has(item.data.id)} totalMembers={totalMembers} />;
    if (item.type === 'event')     return <EventCard     key={item.data.id || i} event={item.data}     onDelete={onDeleteEvent}     now={now} />;
    if (item.type === 'challenge') return <ChallengeCard key={item.data.id || i} challenge={item.data} onDelete={onDeleteChallenge} now={now} />;
    if (item.type === 'poll')      return <PollCard      key={item.data.id || i} poll={item.data}      onDelete={onDeletePoll}      allMemberships={allMemberships} />;
    if (item.type === 'class')     return <ClassCard     key={item.data.id || i} gymClass={item.data}  onDelete={onDeleteClass} />;
    return null;
  };

  const currentLabel = FILTERS.find(f => f.id === activeFilter)?.label;

  return (
    <div className="flex flex-col w-full h-full min-h-[600px] overflow-hidden bg-[#050810] text-[#eef2ff]">

      {/* ── METRICS BAR ── */}
      <MetricsBar allPosts={allPosts} allMemberships={allMemberships} now={now} />

      {/* ── BODY ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_292px] flex-1 overflow-hidden min-h-0">

        {/* ══ CENTER ══ */}
        <div className="px-[22px] py-5 pb-12 overflow-y-auto flex flex-col gap-[18px] [scrollbar-width:thin] [scrollbar-color:#252d45_transparent]">

          {/* Header row */}
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="m-0 text-[17px] font-extrabold text-[#eef2ff] tracking-[-0.025em] flex-1 min-w-[160px] whitespace-nowrap">
              🔥 Let's get your members engaged!
            </h2>
            <div className="flex gap-[7px] shrink-0 flex-wrap">
              <AppButton variant="primary"   size="sm" onClick={() => openModal('post')}><Plus className="w-[13px] h-[13px]" /> Create first post</AppButton>
              <AppButton variant="secondary" size="sm" onClick={() => openModal('challenge')}><Trophy className="w-[13px] h-[13px]" /> Start a challenge</AppButton>
              <AppButton variant="secondary" size="sm" onClick={() => openModal('poll')}><HelpCircle className="w-[13px] h-[13px]" /> Ask a question</AppButton>
            </div>
          </div>

          {/* Quick post ideas */}
          <QuickIdeas openModal={openModal} />

          {/* Feed / Calendar toggle */}
          <div className="inline-flex gap-[2px] bg-[#0d1225] border border-white/[0.04] rounded-[7px] p-[2px] self-start">
            <button
              className={cn('inline-flex items-center gap-1 px-[11px] py-[5px] rounded-[5px] text-[11.5px] font-semibold cursor-pointer border-none transition-all', viewMode === 'feed' ? 'bg-blue-500 text-white' : 'bg-transparent text-[#4b5578] hover:text-[#8b95b3]')}
              onClick={() => setViewMode('feed')}>
              <List className="w-[10px] h-[10px]" /> Feed
            </button>
            <button
              className={cn('inline-flex items-center gap-1 px-[11px] py-[5px] rounded-[5px] text-[11.5px] font-semibold cursor-pointer border-none transition-all', viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-transparent text-[#4b5578] hover:text-[#8b95b3]')}
              onClick={() => setViewMode('calendar')}>
              <Calendar className="w-[10px] h-[10px]" /> Calendar
            </button>
          </div>

          {/* Calendar or Feed */}
          {viewMode === 'calendar' ? (
            <CalendarView allPosts={allPosts} events={events} now={now} openModal={openModal} />
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex items-center border-b border-white/[0.04] overflow-x-auto -mt-[6px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTERS.map(f => (
                  <button key={f.id}
                    className={cn(
                      'px-[14px] py-2 text-[12.5px] bg-transparent border-b-2 cursor-pointer transition-all -mb-px whitespace-nowrap font-medium',
                      activeFilter === f.id
                        ? 'text-[#eef2ff] border-blue-500 font-bold'
                        : 'text-[#4b5578] border-transparent hover:text-[#8b95b3]',
                    )}
                    onClick={() => setActiveFilter(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>

              {feedItems.length > 0
                ? <div className="flex flex-col gap-[9px]">{feedItems.map(renderItem)}</div>
                : <EmptyState openModal={openModal} label={currentLabel !== 'Feed' ? currentLabel : null} />
              }
            </>
          )}
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="hidden md:flex flex-col px-[15px] py-4 pb-10 overflow-y-auto gap-[13px] border-l border-white/[0.04] bg-[#0a0f1e] [scrollbar-width:thin] [scrollbar-color:#252d45_transparent]">
          <RightPanel
            allPosts={allPosts} polls={polls} challenges={challenges}
            events={events} activeChallenges={activeChallenges}
            allMemberships={allMemberships} now={now} openModal={openModal}
          />
        </div>

      </div>
    </div>
  );
}
