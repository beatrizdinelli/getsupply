import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const api = vi.hoisted(() => ({
  registerSupplier: vi.fn(),
  createConnectOnboarding: vi.fn(),
  getConnectStatus: vi.fn(),
}));

vi.mock("../lib/stripe-payments", () => api);

async function renderForm(stripeDisabled: boolean) {
  vi.resetModules();
  if (stripeDisabled) vi.stubEnv("VITE_STRIPE_CONNECT_DISABLED", "true");
  const { SupplierRegistration } = await import("./SupplierRegistration");
  render(<SupplierRegistration />);
}

async function fillAndSubmit(buttonName: RegExp) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Empresa/), "Gráfica Teste");
  await user.type(screen.getByLabelText(/CNPJ/), "11.222.333/0001-44");
  await user.type(screen.getByLabelText(/Região/), "São Paulo, SP");
  await user.click(screen.getByRole("button", { name: buttonName }));
}

beforeEach(() => {
  api.registerSupplier.mockReset();
  api.createConnectOnboarding.mockReset();
  api.getConnectStatus.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

test("sem Stripe, salva o cadastro e mostra a confirmação sem abrir o Stripe", async () => {
  api.registerSupplier.mockResolvedValue({ id: "supplier-1", registered: true });
  await renderForm(true);

  await fillAndSubmit(/Enviar cadastro/);

  await screen.findByText("Recebemos seu cadastro.");
  expect(api.registerSupplier).toHaveBeenCalledWith(
    expect.objectContaining({
      company: "Gráfica Teste",
      cnpj: "11.222.333/0001-44",
      region: "São Paulo, SP",
    }),
  );
  expect(api.createConnectOnboarding).not.toHaveBeenCalled();
});

test("mostra o erro da API e não confirma o cadastro", async () => {
  api.registerSupplier.mockRejectedValue(new Error("Este CNPJ já possui uma conta."));
  await renderForm(true);

  await fillAndSubmit(/Enviar cadastro/);

  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toBe("Este CNPJ já possui uma conta.");
  expect(screen.queryByText("Recebemos seu cadastro.")).toBeNull();
});

test("com Stripe habilitado, segue para o onboarding do Stripe", async () => {
  api.registerSupplier.mockResolvedValue({ id: "supplier-1", registered: true });
  api.createConnectOnboarding.mockResolvedValue({ url: "#stripe" });
  await renderForm(false);

  await fillAndSubmit(/Cadastrar e conectar ao Stripe/);

  await waitFor(() => expect(api.createConnectOnboarding).toHaveBeenCalled());
  expect(screen.queryByText("Recebemos seu cadastro.")).toBeNull();
});
