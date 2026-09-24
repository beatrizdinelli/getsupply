import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    name: 'Notificações por e-mail',
    description:
      'Avisa o fornecedor sobre novos pedidos de cotação e o comprador sobre novas propostas.',
    reach: 9,
    impact: 2,
    confidence: 0.8,
    effort: 1.5,
  },
  {
    name: 'Painel de curadoria do operador',
    description:
      'Permite à equipe escolher manualmente quais fornecedores recebem cada pedido de cotação.',
    reach: 10,
    impact: 3,
    confidence: 0.8,
    effort: 3,
  },
  {
    name: 'Comparador de propostas com resumo por IA',
    description:
      'Compara propostas lado a lado e resume diferenças de preço, prazo e MOQ.',
    reach: 9,
    impact: 2,
    confidence: 0.6,
    effort: 3,
  },
  {
    name: 'Verificação de CNPJ do fornecedor',
    description:
      'Valida o CNPJ no cadastro para que o selo "verificado" tenha lastro real.',
    reach: 5,
    impact: 2,
    confidence: 0.7,
    effort: 2,
  },
  {
    name: 'Anexo de arte ou especificação técnica',
    description:
      'Permite anexar arquivos ao pedido de cotação para detalhar a necessidade.',
    reach: 6,
    impact: 1,
    confidence: 0.8,
    effort: 2,
  },
]
  .map((f) => ({
    ...f,
    score: (f.reach * f.impact * f.confidence) / f.effort,
  }))
  .sort((a, b) => b.score - a.score);

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar
        </Link>
        <h1 className="font-serif text-4xl">Próximas 5 features</h1>
        <p className="mt-3 text-muted-foreground">
          Priorizadas por score RICE: (Alcance × Impacto × Confiança) ÷ Esforço.
          Alcance de 1 a 10, impacto de 0,25 a 3, esforço em pessoa-semanas.
        </p>
        <ol className="mt-8 space-y-4">
          {features.map((f, i) => (
            <li key={f.name}>
              <Card>
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {i + 1}. {f.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Alcance {f.reach} · Impacto {f.impact} · Confiança{' '}
                      {Math.round(f.confidence * 100)}% · Esforço {f.effort}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {f.score.toFixed(1)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
