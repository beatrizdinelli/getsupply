import { useEffect, useState } from "react";
import { ArrowRight, Check, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/getsupply-design-system/components/ui/card";
import { Input } from "@workspace/getsupply-design-system/components/ui/input";
import {
  createConnectOnboarding,
  getConnectStatus,
  registerSupplier,
  type SupplierRegistrationInput,
} from "../lib/stripe-payments";

const initialForm: SupplierRegistrationInput = {
  company: "",
  cnpj: "",
  categories: "",
  capacity: "",
  moq: "",
  region: "",
};

export function SupplierRegistration() {
  const [form, setForm] = useState(initialForm);
  const [checking, setChecking] = useState(
    new URLSearchParams(window.location.search).has("stripe"),
  );
  const [connected, setConnected] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!checking) return;
    getConnectStatus()
      .then((status) => setConnected(status.connected))
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível verificar sua conta.",
        ),
      )
      .finally(() => setChecking(false));
  }, [checking]);

  const update = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const openOnboarding = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { url } = await createConnectOnboarding();
      window.location.assign(url);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível abrir o Stripe.",
      );
      setSubmitting(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await registerSupplier(form);
      const { url } = await createConnectOnboarding();
      window.location.assign(url);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir o cadastro.",
      );
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-10 text-center">
          <CreditCard className="mx-auto h-9 w-9 text-primary" />
          <h1 className="mt-4 font-serif text-3xl">
            Verificando sua conta Stripe
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Aguarde enquanto confirmamos os dados de recebimento.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (connected) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-10 text-center">
          <Check className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-serif text-3xl">
            Recebimentos habilitados
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sua conta Stripe Connect está pronta para receber os pagamentos das
            propostas aceitas.
          </p>
          <Link href="/suppliers" className="mt-6 inline-flex">
            <Button>Conhecer o catálogo</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const returningFromStripe = new URLSearchParams(window.location.search).has(
    "stripe",
  );
  if (returningFromStripe) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Finalize sua conta de recebimento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            O Stripe ainda precisa de algumas informações antes de liberar os
            repasses.
          </p>
          {error && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            onClick={openOnboarding}
            disabled={submitting}
          >
            {submitting ? "Abrindo Stripe..." : "Continuar no Stripe"}
            <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-primary">Para fornecedores</p>
      <h1 className="mt-2 font-serif text-4xl">
        Cadastre-se e receba com segurança.
      </h1>
      <p className="mt-3 leading-7 text-muted-foreground">
        Depois do cadastro, você preencherá seus dados bancários diretamente no
        Stripe. A GetSupply não armazena essas informações.
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Dados do fornecedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Empresa
              <Input
                required
                name="company"
                value={form.company}
                onChange={update}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              CNPJ
              <Input
                required
                name="cnpj"
                value={form.cnpj}
                onChange={update}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Categorias
              <Input
                name="categories"
                placeholder="Caixas, rótulos..."
                value={form.categories}
                onChange={update}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Capacidade mensal
              <Input
                name="capacity"
                placeholder="Ex.: 50 mil unidades"
                value={form.capacity}
                onChange={update}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Pedido mínimo (MOQ)
              <Input name="moq" value={form.moq} onChange={update} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Região
              <Input
                required
                name="region"
                value={form.region}
                onChange={update}
              />
            </label>
            {error && (
              <p
                className="text-sm font-medium text-destructive sm:col-span-2"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              className="sm:col-span-2"
              size="lg"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Preparando sua conta..."
                : "Cadastrar e conectar ao Stripe"}
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}