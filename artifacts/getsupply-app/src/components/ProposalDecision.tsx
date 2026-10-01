import { useState } from "react";
import { CreditCard, LoaderCircle, X } from "lucide-react";
import type { Proposal } from "@workspace/api-client-react";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import { Textarea } from "@workspace/getsupply-design-system/components/ui/textarea";
import { StatusBadge } from "@workspace/getsupply-design-system/components/ui/status-badge";
import { createProposalCheckout, rejectProposal } from "../lib/stripe-payments";

export function ProposalDecision({
  proposal,
  onChange,
}: {
  proposal: Pick<Proposal, "id"> & { status: string };
  onChange: (proposal: Proposal) => void;
}) {
  const [busy, setBusy] = useState<"pay" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (proposal.status === "accepted") {
    return <div className="mt-3"><StatusBadge status="closed" label="Paga" /></div>;
  }
  if (proposal.status === "rejected") {
    return <div className="mt-3"><StatusBadge status="delayed" label="Recusada" /></div>;
  }

  const pay = async () => {
    setBusy("pay");
    setError("");
    try {
      const { url } = await createProposalCheckout(proposal.id);
      window.location.assign(url);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível iniciar o pagamento.",
      );
      setBusy(null);
    }
  };

  const reject = async () => {
    setBusy("reject");
    setError("");
    try {
      onChange(await rejectProposal(proposal.id, reason));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível recusar a proposta.",
      );
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      {rejecting ? (
        <>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Conte ao fornecedor o motivo (opcional)"
            className="min-h-20"
            maxLength={500}
            data-testid={`input-reject-reason-${proposal.id}`}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={busy !== null}
              onClick={reject}
              data-testid={`button-confirm-reject-${proposal.id}`}
            >
              {busy === "reject" ? <LoaderCircle className="animate-spin" /> : <X />}
              {busy === "reject" ? "Recusando..." : "Confirmar recusa"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy !== null}
              onClick={() => { setRejecting(false); setError(""); }}
            >
              Voltar
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={busy !== null}
            onClick={pay}
            data-testid={`button-pay-${proposal.id}`}
          >
            {busy === "pay" ? <LoaderCircle className="animate-spin" /> : <CreditCard />}
            {busy === "pay" ? "Abrindo..." : "Aceitar e pagar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => setRejecting(true)}
            data-testid={`button-reject-${proposal.id}`}
          >
            <X />
            Recusar
          </Button>
        </div>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert" data-testid={`status-decision-error-${proposal.id}`}>
          {error}
        </p>
      )}
    </div>
  );
}
