import { SupplierCard } from '../../components/ui/supplier-card';
import { Guidelines } from '../parts';

export function SupplierCardDemo() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Grade de fornecedores
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SupplierCard
            name="Embalix Soluções em Embalagens"
            category="Caixas de papelão"
            rating={4.7}
            reviewCount={38}
            moq="500 un."
            verified
            location="São Paulo, SP"
          />
          <SupplierCard
            name="PackPro Brasil"
            category="Sacolas e bags"
            rating={4.2}
            reviewCount={14}
            moq="200 un."
            location="Rio de Janeiro, RJ"
          />
          <SupplierCard
            name="Flexpack"
            category="Embalagens flexíveis"
            rating={3.8}
            reviewCount={7}
            moq="1.000 un."
            verified
            location="Curitiba, PR"
          />
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sem avaliações ainda
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SupplierCard
            name="Novo Fornecedor Ltda."
            category="Embalagens de vidro"
            moq="100 un."
            location="Campinas, SP"
            actionLabel="Ver perfil"
          />
        </div>
      </section>

      <section className="border-t pt-6">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Mostre sempre categoria e MOQ — são os dois filtros que o comprador usa antes de clicar.',
            },
            {
              kind: 'do',
              text: 'Use o badge "Verificado" apenas para fornecedores curados pela equipe GetSupply.',
            },
            {
              kind: 'dont',
              text: 'Não omita o botão de ação — o card inteiro leva ao perfil, mas o CTA torna a intenção explícita.',
            },
            {
              kind: 'dont',
              text: 'Não use fotos de produto genéricas no thumbnail — prefira a identidade visual do fornecedor.',
            },
          ]}
        />
      </section>
    </div>
  );
}
