import { Navbar } from '../../components/ui/navbar';
import { Stack } from '../parts';

export function NavbarDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="Padrão — nenhum link ativo">
        <div className="overflow-hidden rounded-lg border">
          <Navbar />
        </div>
      </Stack>

      <Stack label="Com link ativo">
        <div className="overflow-hidden rounded-lg border">
          <Navbar
            links={[
              { label: 'Fornecedores', href: '#', active: true },
              { label: 'Meus RFQs',    href: '#' },
              { label: 'Propostas',    href: '#' },
              { label: 'Como funciona', href: '#' },
            ]}
          />
        </div>
      </Stack>

      <Stack label="CTA customizado">
        <div className="overflow-hidden rounded-lg border">
          <Navbar
            ctaLabel="Acessar plataforma"
            links={[
              { label: 'Fornecedores', href: '#' },
              { label: 'Para marcas',  href: '#' },
              { label: 'Blog',         href: '#' },
            ]}
          />
        </div>
      </Stack>
    </div>
  );
}
