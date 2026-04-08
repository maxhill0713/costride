import { cn } from '@/lib/utils';

const variants = {
  success:  'text-emerald-400 bg-emerald-400/10',
  active:   'text-emerald-400 bg-emerald-400/10',
  warning:  'text-amber-400  bg-amber-400/10',
  'at-risk':'text-amber-400  bg-amber-400/10',
  danger:   'text-red-400    bg-red-400/10',
  dropping: 'text-red-400    bg-red-400/10',
  neutral:  'text-gray-400   bg-gray-800',
};

export function AppBadge({ variant = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium whitespace-nowrap',
        variants[variant] ?? variants.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}
