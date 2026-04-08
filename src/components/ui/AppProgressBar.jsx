import { cn } from '@/lib/utils';

export function AppProgressBar({ value = 0, colorClass = 'bg-blue-500', className }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full h-2 bg-gray-800 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-300 ease-in-out', colorClass)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
