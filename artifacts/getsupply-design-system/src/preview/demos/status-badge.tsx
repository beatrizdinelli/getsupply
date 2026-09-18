import { StatusBadge } from '../../components/ui/status-badge';
import { Stack, Row } from '../parts';
import { Guidelines } from '../parts';

export function StatusBadgeDemo() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="4 estados do fluxo de RFQ">
        <StatusBadge status="waiting" />
        <StatusBadge status="received" />
        <StatusBadge status="delayed" />
        <StatusBadge status="closed" />
      </Stack>

      <Stack label="Labels customizados">
        <Row>
          <StatusBadge status="waiting"  label="Em análise pela equipe" />
          <StatusBadge status="received" label="2 propostas recebidas" />
          <StatusBadge status="delayed"  label="Prazo vencido" />
          <StatusBadge status="closed"   label="Pedido confirmado" />
        </Row>
      </Stack>

      <section className="rounded-lg bg-muted/40 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Referência de cores semânticas
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { status: 'waiting',  name: 'Âmbar',   hex: '#D97706', desc: 'Aguarda ação' },
              { status: 'received', name: 'Azul',     hex: '#2563EB', desc: 'Proposta chegou' },
              { status: 'delayed',  name: 'Carmesim', hex: '#DC2626', desc: 'Prazo crítico' },
              { status: 'closed',   name: 'Verde',    hex: '#16A34A', desc: 'Ciclo encerrado' },
            ] as const
          ).map(({ status, name, hex, desc }) => (
            <div key={status} className="space-y-1.5">
              <div
                className="h-10 rounded-lg"
                style={{ backgroundColor: `${hex}1F`, border: `2px solid ${hex}50` }}
              />
              <div>
                <p className="text-xs font-semibold" style={{ color: hex }}>
                  {name}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t pt-6">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Use status badges exclusivamente para representar o estado do RFQ no funil.',
            },
            {
              kind: 'dont',
              text: 'Não use as cores de status para ações — o terracota (#C1502E) é reservado para CTAs.',
            },
            {
              kind: 'do',
              text: 'Mantenha o ponto colorido ao lado do texto — garante acessibilidade para daltônicos.',
            },
            {
              kind: 'dont',
              text: 'Não crie novos estados além dos 4 definidos sem alinhar com o time de produto.',
            },
          ]}
        />
      </section>
    </div>
  );
}
