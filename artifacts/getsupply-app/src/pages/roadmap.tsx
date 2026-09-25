import { Link } from 'wouter';
import { ChevronLeft, Package } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@workspace/getsupply-design-system/components/ui/card';

type Feature = {
  name: string;
  description: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  justification: string;
};

const baseFeatures: Feature[] = [
  {
    name: 'Painel de curadoria do operador',
    description:
      'Tela interna em que a equipe escolhe quais fornecedores recebem cada pedido de cotação.',
    reach: 60,
    impact: 3,
    confidence: 0.8,
    effort: 3,
    justification:
      'Alcance 60: todo pedido passa por ela. Impacto 3: é prioridade P0 no PRD. Confiança 80%: o requisito é claro, mas a tela ainda não foi desenhada. Esforço 3: tela interna de seleção por pedido.',
  },
  {
    name: 'Verificação de CNPJ do fornecedor',
    description:
      'Valida o CNPJ no cadastro e marca o fornecedor como verificado.',
    reach: 60,
    impact: 2,
    confidence: 0.8,
    effort: 2,
    justification:
      'Alcance 60: fornecedores passam pela verificação e compradores veem o selo. Impacto 2: é um guardrail do PRD. Confiança 80%: depende de escolher uma fonte de consulta de CNPJ. Esforço 2: integração e regra de verificação.',
  },
  {
    name: 'Painel do fornecedor para responder pedidos',
    description:
      'Login e área do fornecedor para ver pedidos recebidos e enviar preço, prazo e pedido mínimo.',
    reach: 60,
    impact: 3,
    confidence: 0.8,
    effort: 4,
    justification:
      'Alcance 60: os fornecedores usam e os compradores recebem propostas reais. Impacto 3: é prioridade P0 no PRD. Confiança 80%: exige perfil de fornecedor no login, que ainda não existe. Esforço 4: login, lista de pedidos e formulário de proposta.',
  },
  {
    name: 'Anexo de arte ou especificação técnica',
    description: 'O comprador anexa arquivos ao pedido de cotação.',
    reach: 50,
    impact: 1,
    confidence: 0.8,
    effort: 2,
    justification:
      'Alcance 50: todos os compradores criam pedidos. Impacto 1: é prioridade P1 no PRD e é opcional. Confiança 80%: falta escolher onde guardar os arquivos. Esforço 2: armazenamento, envio e exibição.',
  },
  {
    name: 'Resumo comparativo de propostas com IA',
    description:
      'Texto curto, gerado por IA, que resume as diferenças entre as propostas de um mesmo pedido.',
    reach: 25,
    impact: 1,
    confidence: 0.8,
    effort: 2,
    justification:
      'Alcance 25: só vale para pedidos com duas ou mais propostas (metade dos compradores). Impacto 1: é complementar, pois preço, prazo e pedido mínimo já aparecem. Confiança 80%: depende de um provedor de IA. Esforço 2: endpoint, cache e cartão na tela.',
  },
];

const features = baseFeatures
  .map((f) => ({
    ...f,
    score:
      Math.round(((f.reach * f.impact * f.confidence) / f.effort) * 10) / 10,
  }))
  .sort((a, b) => b.score - a.score);

const maxScore = Math.max(...features.map((f) => f.score));

function formatScore(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

export default function Roadmap() {
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
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-10 md:py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Roadmap de produto
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
          Próximas 5{' '}
          <span className="font-serif font-normal italic">features</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          As cinco evoluções do GetSupply, ordenadas pela nota da matriz de
          priorização. Quanto maior a nota, maior a prioridade.
        </p>

        <ol className="mt-8 space-y-4 md:mt-10">
          {features.map((f, i) => (
            <li key={f.name}>
              <Card className="border-0 bg-card shadow-sm">
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold leading-snug md:text-lg">
                        {f.name}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {f.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Nota
                      </p>
                      <p className="text-2xl font-bold leading-none text-primary md:text-3xl">
                        {formatScore(f.score)}
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(f.score / maxScore) * 100}%` }}
                    />
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-semibold text-primary">
                      Ver cálculo e justificativa
                    </summary>
                    <p className="mt-3 text-xs text-muted-foreground">
                      ({f.reach} × {f.impact} × {Math.round(f.confidence * 100)}
                      %) ÷ {f.effort} ={' '}
                      <b className="text-foreground">{formatScore(f.score)}</b>
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {f.justification}
                    </p>
                  </details>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <section
          className="mt-8 rounded-xl bg-secondary/60 p-5 md:mt-10 md:p-6"
          aria-labelledby="metodologia"
        >
          <h2 id="metodologia" className="text-sm font-semibold">
            Como a nota é calculada
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Nota = (alcance × impacto × confiança) ÷ esforço. Impacto: 3
            altíssimo, 2 alto, 1 médio, 0,5 baixo. Confiança: 100%, 80% ou 50%.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Premissas: alcance estimado para o piloto, com 50 compradores e 10
            fornecedores (60 pessoas); esforço em pessoa-semanas. Ambos são
            estimativas da equipe. Empates seguem a prioridade do PRD.
          </p>
        </section>
      </main>
    </div>
  );
}
