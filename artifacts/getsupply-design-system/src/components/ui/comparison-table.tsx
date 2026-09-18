import { Clock, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// ComparisonTable — side-by-side proposal view for the RFQ decision flow
// ---------------------------------------------------------------------------

export interface Proposal {
  id: string;
  supplierName: string;
  unitPrice: number;
  currency?: string;
  leadTimeDays: number;
  moq: number;
  moqUnit?: string;
  notes?: string;
}

export interface ComparisonTableProps {
  proposals: Proposal[];
  /** Label displayed above the table. */
  title?: string;
  className?: string;
}

export function ComparisonTable({
  proposals,
  title,
  className,
}: ComparisonTableProps) {
  if (proposals.length === 0) return null;

  const bestPrice    = Math.min(...proposals.map((p) => p.unitPrice));
  const bestLeadTime = Math.min(...proposals.map((p) => p.leadTimeDays));

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
      {title && (
        <div className="border-b px-5 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              {['Fornecedor', 'Preço/un.', 'Prazo', 'MOQ', 'Observações'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => {
              const isBestPrice = p.unitPrice === bestPrice;
              const isBestTime  = p.leadTimeDays === bestLeadTime;

              return (
                <tr
                  key={p.id}
                  className="border-b last:border-b-0 transition-colors hover:bg-muted/25"
                >
                  {/* Supplier */}
                  <td className="px-4 py-3 font-medium text-card-foreground">
                    {p.supplierName}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'flex items-center gap-1.5 font-semibold tabular-nums',
                        isBestPrice ? 'text-chart-4' : 'text-card-foreground',
                      )}
                    >
                      {p.currency ?? 'R$'}&nbsp;{p.unitPrice.toFixed(2)}
                      {isBestPrice && (
                        <TrendingDown
                          className="h-3.5 w-3.5 shrink-0 text-chart-4"
                          aria-label="Menor preço"
                        />
                      )}
                    </span>
                  </td>

                  {/* Lead time */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'flex items-center gap-1.5 tabular-nums',
                        isBestTime
                          ? 'font-semibold text-chart-2'
                          : 'text-card-foreground',
                      )}
                    >
                      {p.leadTimeDays}&nbsp;dias
                      {isBestTime && (
                        <Clock
                          className="h-3.5 w-3.5 shrink-0 text-chart-2"
                          aria-label="Menor prazo"
                        />
                      )}
                    </span>
                  </td>

                  {/* MOQ */}
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {p.moq.toLocaleString('pt-BR')}&nbsp;{p.moqUnit ?? 'un.'}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.notes ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 border-t px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-chart-4" />
          Menor preço
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-chart-2" />
          Menor prazo
        </span>
      </div>
    </div>
  );
}
