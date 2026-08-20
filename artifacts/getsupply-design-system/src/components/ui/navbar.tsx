import { useState } from 'react';
import { Menu, Package, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

// ---------------------------------------------------------------------------
// Navbar — GetSupply primary navigation
// ---------------------------------------------------------------------------

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarProps {
  links?: NavLink[];
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { label: 'Fornecedores', href: '#' },
  { label: 'Meus RFQs',    href: '#' },
  { label: 'Propostas',    href: '#' },
  { label: 'Como funciona', href: '#' },
];

export function Navbar({
  links = DEFAULT_LINKS,
  ctaLabel = 'Criar RFQ',
  onCta,
  className,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={cn('border-b bg-background', className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* ── Wordmark ─────────────────────────────── */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2 font-bold tracking-tight text-foreground"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </span>
          GetSupply
        </a>

        {/* ── Desktop nav ──────────────────────────── */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => e.preventDefault()}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                link.active
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* ── CTA + mobile toggle ───────────────────── */}
        <div className="flex items-center gap-2">
          <Button className="hidden sm:flex" onClick={onCta}>
            {ctaLabel}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────── */}
      {mobileOpen && (
        <div className="border-t bg-background px-4 pb-4 md:hidden">
          <nav className="mt-3 flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                }}
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                  link.active
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {link.label}
              </a>
            ))}
            <Button
              className="mt-2"
              onClick={() => {
                setMobileOpen(false);
                onCta?.();
              }}
            >
              {ctaLabel}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
