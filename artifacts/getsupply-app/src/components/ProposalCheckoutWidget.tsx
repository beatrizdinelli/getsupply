import { useEffect, useState } from "react";
import { CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { listProposals } from "@workspace/api-client-react";
import type { Proposal } from "@workspace/api-client-react";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/getsupply-design-system/components/ui/card";
import { createProposalCheckout } from "../lib/stripe-payments";

export function ProposalCheckoutWidget() {
  const match = window.location.pathname.match(/\/rfqs\/(rfq-\d+|\d+)$/);
  const rfqId = match?.[1];
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!rfqId) return;
    listProposals(rfqId)
      .then((items) =>
        setProposals(items.filter((proposal) => proposal.status === "sent")),
      )
      .catch(() => setProposals([]));
  }, [rfqId]);

  if (!rfqId || proposals.length === 0) return null;

  const checkout = async (proposalId: string) => {
    setPaying(proposalId);
    setError("");
    try {
      const { url } = await createProposalCheckout(proposalId);
      window.location.assign(url);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível iniciar o pagamento.",
      );
      setPaying(null);
    }
  };

  return (
    <Card className="fixed bottom-5 left-5 z-40 hidden w-80 shadow-lg lg:block">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Pagar proposta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs leading-5 text-muted-foreground">
          O Stripe transfere 90% ao fornecedor e retém a comissão de 10% da
          GetSupply.
        </p>
        {proposals.map((proposal) => (
          <div className="rounded-lg border p-3" key={proposal.id}>
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="font-medium">{proposal.supplierName}</span>
              <strong className="text-primary">
                R$ {proposal.price.toLocaleString("pt-BR")}
              </strong>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              disabled={paying !== null}
              onClick={() => checkout(proposal.id)}
            >
              {paying === proposal.id ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <CreditCard />
              )}
              {paying === proposal.id ? "Abrindo..." : "Escolher e pagar"}
            </Button>
          </div>
        ))}
        {error && (
          <p className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}