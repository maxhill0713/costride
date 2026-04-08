import { cn } from '@/lib/utils';

const variants = {
  primary:   'bg-blue-600 text-white hover:bg-blue-500 border border-transparent',
  secondary: 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700',
  outline:   'bg-transparent text-white border border-gray-800 hover:border-gray-600 hover:bg-white/[0.04]',
  danger:    'bg-transparent text-red-400 border border-red-500/40 hover:border-red-500/70 hover:bg-red-500/10',
};

const sizes = {
  sm: 'h-7  px-3 text-xs  gap-1.5',
  md: 'h-9  px-4 text-sm  gap-2',
  lg: 'h-11 px-5 text-base gap-2',
};

export function AppButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg',
        'transition-colors duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
