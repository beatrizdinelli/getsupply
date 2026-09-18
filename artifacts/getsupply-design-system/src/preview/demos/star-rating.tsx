import { useState } from 'react';
import { StarRating, StarRatingInput } from '../../components/ui/star-rating';
import { Stack } from '../parts';

export function StarRatingDemo() {
  const [rating, setRating] = useState(0);

  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="Exibição (display)">
        {[
          { value: 5,   label: '5.0 — Excelente' },
          { value: 4.7, label: '4.7 — Ótimo' },
          { value: 3.5, label: '3.5 — Bom' },
          { value: 1.2, label: '1.2 — Ruim' },
          { value: 0,   label: '0 — Sem avaliações' },
        ].map(({ value, label }) => (
          <div key={label} className="flex items-center gap-3">
            <StarRating value={value} size="md" />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </Stack>

      <Stack label="Tamanhos">
        <div className="flex items-center gap-4">
          <StarRating value={4.5} size="sm" />
          <span className="text-xs text-muted-foreground">sm</span>
        </div>
        <div className="flex items-center gap-4">
          <StarRating value={4.5} size="md" />
          <span className="text-xs text-muted-foreground">md</span>
        </div>
        <div className="flex items-center gap-4">
          <StarRating value={4.5} size="lg" />
          <span className="text-xs text-muted-foreground">lg</span>
        </div>
      </Stack>

      <Stack label="Input interativo">
        <div className="space-y-2">
          <StarRatingInput value={rating} onChange={setRating} size="lg" />
          <p className="text-sm text-muted-foreground">
            {rating === 0
              ? 'Clique para avaliar'
              : `Avaliação: ${rating} estrela${rating > 1 ? 's' : ''}`}
          </p>
        </div>
      </Stack>
    </div>
  );
}
