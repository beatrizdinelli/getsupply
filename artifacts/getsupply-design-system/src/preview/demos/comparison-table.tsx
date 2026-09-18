import { ComparisonTable } from '../../components/ui/comparison-table';
import { Guidelines } from '../parts';

const PROPOSALS = [
  {
    id: '1',
    supplierName: 'Embalix',
    unitPrice: 2.40,
    currency: 'R$',
    leadTimeDays: 21,
    moq: 500,
    moqUnit: 'un.',
    notes: 'Entrega grátis em SP',
  },
  {
    id: '2',
    supplierName: 'PackPro Brasil',
    unitPrice: 1.95,
    currency: 'R$',
    leadTimeDays: 30,
    moq: 1000,
    moqUnit: 'un.',
    notes: 'Inclui arte gráfica',
  },
  {
    id: '3',
    supplierName: 'Flexpack',
    unitPrice: 2.15,
    currency: 'R$',
    leadTimeDays: 14,
    moq: 2000,
    moqUnit: 'un.',
    notes: undefined,
  },
];

const SINGLE = [
  {
    id: '1',
    supplierName: 'Único Fornecedor S.A.',
    unitPrice: 3.20,
    currency: 'R$',
    leadTimeDays: 18,
    moq: 300,
    moqUnit: 'un.',
  },
];

export function ComparisonTableDemo() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Múltiplas propostas
        </p>
        <ComparisonTable
          title="Propostas recebidas — RFQ #2024-031"
          proposals={PROPOSALS}
        />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Proposta única
        </p>
        <ComparisonTable proposals={SINGLE} />
      </section>

      <section className="border-t pt-6">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Destaque menor preço (verde) e menor prazo (azul) — o comprador decide por esses dois eixos.',
            },
            {
              kind: 'dont',
              text: 'Não use vermelho para nenhuma célula da tabela — pode ser confundido com "Atrasado".',
            },
            {
              kind: 'do',
              text: 'Mostre a legenda de ícones abaixo da tabela para reforçar o significado das marcações.',
            },
          ]}
        />
      </section>
    </div>
  );
}
