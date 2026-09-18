import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// StarRating — display only
// ---------------------------------------------------------------------------

export interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StarRating({ value, max = 5, size = 'md', className }: StarRatingProps) {
  const cls = SIZE[size];
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} de ${max} estrelas`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(value);
        const partial = !filled && i < value;
        const fill = value % 1;
        return (
          <span key={i} className="relative inline-flex shrink-0">
            {/* empty track */}
            <Star className={cn(cls, 'text-muted-foreground/25')} fill="currentColor" />
            {/* filled overlay */}
            {(filled || partial) && (
              <Star
                className={cn(cls, 'absolute inset-0 text-chart-1')}
                fill="currentColor"
                style={partial ? { clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` } : undefined}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StarRatingInput — interactive
// ---------------------------------------------------------------------------

export interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const INPUT_SIZE: Record<NonNullable<StarRatingInputProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRatingInput({
  value,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  className,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cls = INPUT_SIZE[size];
  const active = hovered ?? value;

  return (
    <div
      className={cn('flex items-center gap-0.5', disabled && 'pointer-events-none opacity-50', className)}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const lit = i < active;
        return (
          <button
            key={i}
            type="button"
            onClick={() => !disabled && onChange(i + 1)}
            onMouseEnter={() => !disabled && setHovered(i + 1)}
            className="cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Avaliar ${i + 1} de ${max}`}
          >
            <Star
              className={cn(
                cls,
                'transition-colors duration-100',
                lit ? 'text-chart-1' : 'text-muted-foreground/25',
              )}
              fill="currentColor"
            />
          </button>
        );
      })}
    </div>
  );
}
