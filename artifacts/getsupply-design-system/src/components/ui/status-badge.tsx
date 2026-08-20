import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// StatusBadge — 4 RFQ workflow states
// ---------------------------------------------------------------------------

export type RFQStatus = 'waiting' | 'received' | 'delayed' | 'closed';

const STATUS_CONFIG: Record<
  RFQStatus,
  { label: string; chartVar: string }
> = {
  waiting:  { label: 'Aguardando proposta', chartVar: '--chart-1' },
  received: { label: 'Proposta recebida',   chartVar: '--chart-2' },
  delayed:  { label: 'Atrasado',            chartVar: '--chart-3' },
  closed:   { label: 'Fechado',             chartVar: '--chart-4' },
};

export interface StatusBadgeProps {
  status: RFQStatus;
  /** Override the default Portuguese label. */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const { label: defaultLabel, chartVar } = STATUS_CONFIG[status];
  const text = label ?? defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        backgroundColor: `hsl(var(${chartVar}) / 0.12)`,
        color:           `hsl(var(${chartVar}))`,
        borderColor:     `hsl(var(${chartVar}) / 0.28)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: `hsl(var(${chartVar}))` }}
        aria-hidden
      />
      {text}
    </span>
  );
}
