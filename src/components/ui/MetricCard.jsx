import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MetricCard({ title, value, subtext, trend, className }) {
  const isUp   = trend?.direction === 'up';
  const isDown = trend?.direction === 'down';

  return (
    <div
      className={cn(
        'p-4 sm:p-5 rounded-xl bg-[#0a0f1e] border border-white/[0.04]',
        'flex flex-col shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]',
        className,
      )}
    >
      <p className="text-[10px] sm:text-[11px] text-slate-600 font-bold uppercase tracking-[0.09em]">
        {title}
      </p>

      <div className="flex items-end justify-between gap-2 mt-2 flex-wrap">
        <span className="text-[22px] sm:text-[28px] font-extrabold text-slate-100 leading-none tracking-[-0.03em]">
          {value}
        </span>

        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
              isUp   && 'text-emerald-500 bg-emerald-500/[0.08] border-emerald-500/[0.20]',
              isDown && 'text-red-500 bg-red-500/[0.08] border-red-500/[0.22]',
            )}
          >
            {isUp   && <TrendingUp  size={10} strokeWidth={2.5} />}
            {isDown && <TrendingDown size={10} strokeWidth={2.5} />}
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[10px] sm:text-[11px] text-slate-600 mt-1 leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}
