import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { StatusBadge } from '../components/ui/status-badge';
import { StarRating } from '../components/ui/star-rating';

// ── Palette ──────────────────────────────────────────────────────────────

const CORE_SWATCHES = [
  {
    name: 'Primary — Terracota',
    hex: '#C1502E',
    className: 'bg-primary',
    note: 'CTA, botões, links',
  },
  {
    name: 'Secondary — Bege claro',
    hex: '#F0E1CB',
    className: 'bg-secondary border',
    note: 'Tags, fundo de card',
  },
  {
    name: 'Background — Areia',
    hex: '#FAF5EA',
    className: 'bg-background border',
    note: 'Fundo base da página',
  },
] as const;

const SUPPORTING_SWATCHES = [
  { name: 'Foreground',   className: 'bg-foreground' },
  { name: 'Muted',        className: 'bg-muted border' },
  { name: 'Accent',       className: 'bg-accent border' },
  { name: 'Border',       className: 'bg-border' },
  { name: 'Destructive',  className: 'bg-destructive' },
] as const;

const STATUS_SWATCHES = [
  { name: 'Aguardando proposta', chartVar: '--chart-1', desc: 'Amber' },
  { name: 'Proposta recebida',   chartVar: '--chart-2', desc: 'Blue' },
  { name: 'Atrasado',            chartVar: '--chart-3', desc: 'Crimson' },
  { name: 'Fechado',             chartVar: '--chart-4', desc: 'Green' },
] as const;

// ── Typography ───────────────────────────────────────────────────────────

const TYPE_SCALE = [
  { label: 'Display', className: 'text-5xl font-bold tracking-tight' },
  { label: 'H1',      className: 'text-3xl font-bold' },
  { label: 'H2',      className: 'text-2xl font-semibold' },
  { label: 'H3',      className: 'text-xl font-semibold' },
  { label: 'H4',      className: 'text-lg font-medium' },
  { label: 'Body',    className: 'text-base' },
  { label: 'Small',   className: 'text-sm' },
  { label: 'Caption', className: 'text-xs text-muted-foreground' },
] as const;

// ── Spacing ──────────────────────────────────────────────────────────────

const SPACING_SCALE = [
  { label: '4px',  px: 4,  className: 'w-1' },
  { label: '8px',  px: 8,  className: 'w-2' },
  { label: '12px', px: 12, className: 'w-3' },
  { label: '16px', px: 16, className: 'w-4' },
  { label: '24px', px: 24, className: 'w-6' },
  { label: '32px', px: 32, className: 'w-8' },
  { label: '48px', px: 48, className: 'w-12' },
] as const;

// ── Shared components ────────────────────────────────────────────────────

function Swatch({ name, className, note }: { name: string; className: string; note?: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-14 rounded-lg ${className}`} />
      <p className="text-xs font-medium leading-tight">{name}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  return (
    <div className="space-y-4">
      {/* Core palette */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Paleta principal
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {CORE_SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Status colors at-a-glance */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status de RFQ
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status="waiting" />
          <StatusBadge status="received" />
          <StatusBadge status="delayed" />
          <StatusBadge status="closed" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Typography */}
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tipografia — Plus Jakarta Sans
          </h2>
          <div className="mt-4 space-y-2">
            {TYPE_SCALE.slice(0, 5).map((entry) => (
              <p key={entry.label} className={entry.className}>
                {entry.label}
              </p>
            ))}
          </div>
        </section>

        {/* In use */}
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Em uso
          </h2>
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">Embalix Embalagens</CardTitle>
                  <CardDescription>São Paulo, SP</CardDescription>
                </div>
                <Badge variant="secondary" className="text-[11px]">Caixas</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
              <div className="flex items-center gap-2">
                <StarRating value={4.7} size="sm" />
                <span className="text-sm font-semibold">4.7</span>
                <span className="text-xs text-muted-foreground">(38)</span>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ov-rfq">Detalhes do RFQ</Label>
                <Input id="ov-rfq" placeholder="Descreva sua embalagem..." />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button>Enviar RFQ</Button>
              <Button variant="outline">Ver perfil</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      {/* Component row */}
      <section className="space-y-3 rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Botões
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Badge>Badge</Badge>
          <Badge variant="secondary">Categoria</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Colors
// ─────────────────────────────────────────────────────────────────────────
export function ColorsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      {/* Brand */}
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Paleta de marca</h2>
          <p className="text-sm text-muted-foreground">
            Terracota (CTA), bege claro (superfícies) e areia (fundo base).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CORE_SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Semantic */}
      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Cores semânticas e superfícies</h2>
          <p className="text-sm text-muted-foreground">
            Roles para texto, fundos, bordas e conteúdo muted.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SUPPORTING_SWATCHES.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* RFQ status */}
      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Cores de status — fluxo de RFQ</h2>
          <p className="text-sm text-muted-foreground">
            Quatro estados distintos do funil, sem conflito com o terracota do CTA.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATUS_SWATCHES.map(({ name, chartVar, desc }) => (
            <div key={name} className="space-y-2">
              <div
                className="h-14 rounded-lg border"
                style={{
                  backgroundColor: `hsl(var(${chartVar}) / 0.13)`,
                  borderColor:     `hsl(var(${chartVar}) / 0.3)`,
                }}
              />
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: `hsl(var(${chartVar}))` }}
                >
                  {desc}
                </p>
                <p className="text-xs text-muted-foreground leading-snug">{name}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <StatusBadge status="waiting" />
          <StatusBadge status="received" />
          <StatusBadge status="delayed" />
          <StatusBadge status="closed" />
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Fonts
// ─────────────────────────────────────────────────────────────────────────
export function FontsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Família tipográfica
        </h2>
        <p className="mt-4 text-4xl font-bold">Plus Jakarta Sans</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Warm, friendly, and optimised for e-commerce UIs. Applied across the entire system.
        </p>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Escala tipográfica
        </h2>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-2 sm:grid-cols-[80px_1fr]">
            <span className="pt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {entry.label}
            </span>
            <p className={entry.className}>Conectando marcas a fornecedores.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────
export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Spacing */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Espaçamento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escala de 4 px base — 4, 8, 12, 16, 24, 32, 48 px.
        </p>
        <div className="mt-6 space-y-3">
          {SPACING_SCALE.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                {space.label}
              </span>
              <div
                className={`h-3 rounded-full bg-primary ${space.className}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Radius + shadow */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Raio de borda</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Base 10 px — derivados sm / md / lg / xl.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Small',      className: 'rounded-sm',  px: '8px' },
            { label: 'Medium',     className: 'rounded-md',  px: '9px' },
            { label: 'Large',      className: 'rounded-lg',  px: '10px' },
            { label: 'Extra large',className: 'rounded-xl',  px: '14px' },
          ].map((r) => (
            <div
              key={r.label}
              className={`flex h-20 flex-col justify-end border bg-muted p-3 ${r.className}`}
            >
              <span className="text-xs font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.px}</span>
            </div>
          ))}
        </div>

        <h2 className="mt-6 font-semibold">Sombras</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: 'sm',  className: 'shadow-sm' },
            { label: 'md',  className: 'shadow-md' },
            { label: 'lg',  className: 'shadow-lg' },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex h-16 items-end rounded-lg border bg-background p-2 ${s.className}`}
            >
              <span className="text-xs font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
