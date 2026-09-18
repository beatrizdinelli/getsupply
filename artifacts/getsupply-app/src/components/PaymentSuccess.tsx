import { Check, Clock3 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import {
  Card,
  CardContent,
} from "@workspace/getsupply-design-system/components/ui/card";

export function PaymentSuccess() {
  const hasSession = new URLSearchParams(window.location.search).has(
    "session_id",
  );
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="p-10 text-center">
          {hasSession ? (
            <Check className="mx-auto h-10 w-10 text-primary" />
          ) : (
            <Clock3 className="mx-auto h-10 w-10 text-primary" />
          )}
          <h1 className="mt-4 font-serif text-3xl">
            {hasSession ? "Pagamento recebido" : "Pagamento em processamento"}
          </h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            A proposta será marcada como aceita após a confirmação do Stripe. O
            fornecedor receberá o repasse automaticamente.
          </p>
          <Link href="/suppliers" className="mt-6 inline-flex">
            <Button>Voltar ao catálogo</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}