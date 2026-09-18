import { Package, MapPin, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import { StarRating } from './star-rating';

// ---------------------------------------------------------------------------
// SupplierCard — the primary browsing unit in GetSupply
// ---------------------------------------------------------------------------

export interface SupplierCardProps {
  name: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  moq?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  verified?: boolean;
  location?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SupplierCard({
  name,
  category,
  rating = 0,
  reviewCount,
  moq,
  thumbnailUrl,
  thumbnailAlt,
  verified = false,
  location,
  actionLabel = 'Enviar RFQ',
  onAction,
  className,
}: SupplierCardProps) {
  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm',
        'transition-shadow duration-200 hover:shadow-md',
        className,
      )}
    >
      {/* ── Thumbnail ─────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={thumbnailAlt ?? name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {verified && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <CheckCircle className="h-3 w-3 text-chart-4" />
            Verificado
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Name + category */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-snug text-card-foreground">
              {name}
            </h3>
            {location && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {location}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 text-[11px]">
            {category}
          </Badge>
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={rating} size="sm" />
            <span className="text-sm font-semibold text-card-foreground">
              {rating.toFixed(1)}
            </span>
            {reviewCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                ({reviewCount} avaliações)
              </span>
            )}
          </div>
        )}

        {/* MOQ */}
        {moq && (
          <p className="text-xs text-muted-foreground">
            MOQ mínimo:{' '}
            <span className="font-medium text-card-foreground">{moq}</span>
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          <Button className="w-full" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
