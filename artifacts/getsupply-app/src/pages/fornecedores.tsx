import { Link } from 'wouter';
import { ArrowRight, Package, ShieldCheck } from 'lucide-react';
import { Button } from '@workspace/getsupply-design-system/components/ui/button';
import {
  Card,
  CardContent,
} from '@workspace/getsupply-design-system/components/ui/card';
import { usePageMeta } from '@/hooks/use-page-meta';

const steps = [
  [
    '1',
    'Cadastre sua empresa',
    'Informe categorias, capacidade mensal, pedido mínimo e região de atuação.',
  ],
  [
    '2',
    'Receba pedidos compatíveis',
    'Nossa equipe seleciona os fornecedores que recebem cada pedido de cotação.',
  ],
  [
    '3',
    'Envie sua proposta',
    'Responda com preço, prazo e pedido mínimo para o comprador comparar.',
  ],
];

const registration = [
  'Empresa e CNPJ',
  'Categorias de embalagem',
  'Capacidade mensal',
  'Pedido mínimo (MOQ)',
  'Região',
];

export default function Fornecedores() {
  usePageMeta({
    title: 'Seja fornecedor GetSupply | Receba cotações de embalagens',
    description:
      'Cadastre sua gráfica ou fábrica de embalagens, receba pedidos de cotação de marcas em crescimento e envie propostas com preço, prazo e MOQ.',
  });

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-4 w-4" />
            </span>
            GetSupply
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/"
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Início
            </Link>
            <Link
              href="/suppliers"
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Fornecedores
            </Link>
            <Link
              href="/fornecedores"
              className="rounded-full bg-secondary px-4 py-2 text-sm font-medium"
            >
              Para fornecedores
            </Link>
          </nav>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-10 md:py-10">
        <section className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="order-2 md:order-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Para fornecedores
            </p>
            <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              Receba pedidos de cotação de marcas{' '}
              <span className="font-serif font-normal italic">
                que precisam de embalagens.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground md:text-base">
              Cadastre sua empresa no GetSupply e seja considerado para pedidos
              de marcas em início de operação, no volume e no prazo que você
              consegue atender.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/supplier/apply">
                <Button size="lg" className="rounded-xl px-7">
                  Cadastrar minha empresa
                  <ArrowRight />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="rounded-xl px-7">
                  Já sou fornecedor
                </Button>
              </Link>
            </div>
          </div>
          <div
            className="warehouse-hero order-1 h-56 rounded-2xl md:order-2 md:h-80"
            role="img"
            aria-label="Galpão de embalagens com caixas prontas para envio"
          />
        </section>

        <section className="mt-12 md:mt-20">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Como funciona para fornecedores
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
              Três passos entre o cadastro e a proposta.
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-5">
            {steps.map(([number, title, copy]) => (
              <Card key={number} className="border-0 bg-card shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
                    {number}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {copy}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:mt-20 md:grid-cols-2 md:gap-5">
          <Card className="border-0 bg-card shadow-sm">
            <CardContent className="p-5 md:p-6">
              <h2 className="text-lg font-semibold tracking-tight">
                O que você informa no cadastro
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {registration.map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Nossa equipe analisa cada cadastro e entra em contato.
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-card shadow-sm">
            <CardContent className="p-5 md:p-6">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-lg font-semibold tracking-tight">
                Receba com segurança
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Depois do cadastro, você preenche seus dados bancários
                diretamente no Stripe. O GetSupply não armazena essas
                informações.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12 rounded-2xl bg-secondary/60 px-5 py-8 text-center md:mt-20 md:py-12">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Faça parte da{' '}
            <span className="font-serif font-normal italic">
              nossa prateleira.
            </span>
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Procuramos parceiros cuidadosos, transparentes e bons no que fazem.
          </p>
          <Link href="/supplier/apply" className="mt-6 inline-flex">
            <Button size="lg" className="rounded-xl px-7">
              Cadastrar minha empresa
              <ArrowRight />
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
