import { useEffect, useState } from "react";
import { Clock3, Send } from "lucide-react";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import { Card, CardContent } from "@workspace/getsupply-design-system/components/ui/card";
import { Input } from "@workspace/getsupply-design-system/components/ui/input";
import { Textarea } from "@workspace/getsupply-design-system/components/ui/textarea";
import { Badge } from "@workspace/getsupply-design-system/components/ui/badge";
import { StatusBadge } from "@workspace/getsupply-design-system/components/ui/status-badge";
import {
  createSupplierProposal,
  listSupplierRfqs,
  type SupplierProposal,
  type SupplierRfq,
} from "../lib/supplier-dashboard";

function ProposalStatusBadge({ status }: { status: SupplierProposal["status"] }) {
  if (status === "accepted") return <StatusBadge status="closed" label="Aceita" />;
  if (status === "rejected") return <StatusBadge status="delayed" label="Recusada" />;
  return <StatusBadge status="waiting" label="Proposta enviada" />;
}

function NewProposalForm({
  rfqId,
  onCreated,
}: {
  rfqId: string;
  onCreated: (proposal: SupplierProposal) => void;
}) {
  const [form, setForm] = useState({ price: "", leadTime: "", moq: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Informe um preço válido.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const proposal = await createSupplierProposal(rfqId, {
        price,
        leadTime: form.leadTime,
        moq: form.moq,
        note: form.note || undefined,
      });
      onCreated(proposal);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a proposta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        Preço total (R$)
        <Input required type="number" min="0" step="0.01" name="price" value={form.price} onChange={update} />
      </label>
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        Prazo de entrega
        <Input required type="date" name="leadTime" value={form.leadTime} onChange={update} />
      </label>
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        MOQ (un.)
        <Input required name="moq" value={form.moq} onChange={update} />
      </label>
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">
        Condições comerciais (opcional)
        <Textarea name="note" value={form.note} onChange={update} className="min-h-16" />
      </label>
      {error && (
        <p className="text-xs font-medium text-destructive sm:col-span-2" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting} className="sm:col-span-2">
        {submitting ? "Enviando..." : "Enviar proposta"} <Send />
      </Button>
    </form>
  );
}

function RfqCard({ rfq, onProposalCreated }: { rfq: SupplierRfq; onProposalCreated: (rfqId: string, proposal: SupplierProposal) => void }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{rfq.category}</Badge>
          <StatusBadge status={rfq.status} />
        </div>
        <h3 className="mt-3 font-serif text-xl">{rfq.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{rfq.specification}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <span>{rfq.quantity}</span>
          <span><Clock3 className="mr-1 inline h-3 w-3" />{rfq.deadline}</span>
          <span>{rfq.region}</span>
        </div>

        {rfq.myProposal ? (
          <div className="mt-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Sua proposta</p>
              <ProposalStatusBadge status={rfq.myProposal.status} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span>R$ {rfq.myProposal.price.toLocaleString("pt-BR")}</span>
              <span><Clock3 className="mr-1 inline h-3 w-3" />{rfq.myProposal.leadTime}</span>
              <span>MOQ {rfq.myProposal.moq}</span>
            </div>
            {rfq.myProposal.note && (
              <p className="mt-2 text-sm text-muted-foreground">{rfq.myProposal.note}</p>
            )}
          </div>
        ) : (
          <NewProposalForm rfqId={rfq.id} onCreated={(proposal) => onProposalCreated(rfq.id, proposal)} />
        )}
      </CardContent>
    </Card>
  );
}

export function SupplierRfqInbox() {
  const [rfqs, setRfqs] = useState<SupplierRfq[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listSupplierRfqs()
      .then(setRfqs)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Não foi possível carregar os pedidos."),
      );
  }, []);

  const handleProposalCreated = (rfqId: string, proposal: SupplierProposal) => {
    setRfqs((current) =>
      current?.map((rfq) => (rfq.id === rfqId ? { ...rfq, myProposal: proposal } : rfq)) ?? current,
    );
  };

  if (error) {
    return <p className="py-10 text-center text-sm text-destructive">{error}</p>;
  }
  if (!rfqs) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando pedidos...</p>;
  }
  if (!rfqs.length) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <h2 className="font-semibold">Nenhum pedido na sua categoria ainda</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que um comprador criar um pedido de cotação nas suas categorias, ele aparece aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rfqs.map((rfq) => (
        <RfqCard key={rfq.id} rfq={rfq} onProposalCreated={handleProposalCreated} />
      ))}
    </div>
  );
}
