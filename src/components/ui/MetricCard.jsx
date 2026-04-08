import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MetricCard
 *
 * Props:
 *   title    — string           Card label
 *   value    — string | number  Primary metric
 *   subtext  — string           Supporting copy below the value
 *   trend    — { direction: 'up' | 'down', value: string }  Optional trend badge
 *   className — string          Forwarded to the root element via cn()
 */
export function MetricCard({ title, value, subtext, trend, className }) {
  const isUp   = trend?.direction === 'up';
  const isDown = trend?.direction === 'down';

  return (
    <div
      className={cn(
        'p-6 rounded-xl bg-gray-950 border border-gray-800',
        'flex flex-col',
        className,
      )}
    >
      {/* Title */}
      <p className="text-sm text-gray-400 font-medium">
        {title}
      </p>

      {/* Value + trend badge */}
      <div className="flex items-end justify-between gap-4 mt-2">
        <span className="text-3xl font-bold text-white leading-none tracking-tight">
          {value}
        </span>

        {trend && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md',
              isUp   && 'text-emerald-400 bg-emerald-400/10',
              isDown && 'text-red-400 bg-red-400/10',
            )}
          >
            {isUp   && <TrendingUp  size={12} strokeWidth={2.5} />}
            {isDown && <TrendingDown size={12} strokeWidth={2.5} />}
            {trend.value}
          </span>
        )}
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}