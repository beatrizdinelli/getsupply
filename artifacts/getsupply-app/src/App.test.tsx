import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createRfq } from "@workspace/api-client-react";
import App from "./App";

vi.mock("@clerk/react", () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
  Show: ({
    when,
    children,
  }: {
    when: "signed-in" | "signed-out";
    children: ReactNode;
  }) => (when === "signed-in" ? children : null),
  SignIn: () => null,
  SignUp: () => null,
  useClerk: () => ({ signOut: vi.fn() }),
}));

const acceptedProposal = {
  id: "proposal-accepted",
  rfqId: "rfq-journey",
  supplierId: "s1",
  supplierName: "Papelaria Aurora",
  price: 1250,
  leadTime: "2030-12-10",
  moq: "500 un.",
  note: "Frete incluso",
  status: "accepted",
};

const pendingProposal = {
  ...acceptedProposal,
  id: "proposal-pending",
  supplierName: "Norte Flex",
  status: "pending",
};

const listProposalsMock = vi.hoisted(() => vi.fn());

const { state, listEvaluations, createEvaluation } = vi.hoisted(() => {
  const state = {
    persistedEvaluation: null as {
      id: string;
      proposalId: string;
      score: number;
      comment?: string;
    } | null,
  };
  const listEvaluations = vi.fn(async (proposalId: string) =>
    state.persistedEvaluation?.proposalId === proposalId
      ? [state.persistedEvaluation]
      : [],
  );
  const createEvaluation = vi.fn(
    async (proposalId: string, input: { score: number; comment?: string }) => {
      state.persistedEvaluation = {
        id: "evaluation-1",
        proposalId,
        ...input,
      };
      return state.persistedEvaluation;
    },
  );
  return { state, listEvaluations, createEvaluation };
});

const { rejectProposal, createProposalCheckout, acceptProposal } = vi.hoisted(() => ({
  rejectProposal: vi.fn(),
  createProposalCheckout: vi.fn(),
  acceptProposal: vi.fn(),
}));

vi.mock("./lib/stripe-payments", () => ({
  rejectProposal,
  createProposalCheckout,
  acceptProposal,
}));

vi.mock("@workspace/api-client-react", () => ({
  chatSupplier: vi.fn(),
  createEvaluation,
  createProposal: vi.fn(),
  createRfq: vi.fn(),
  getRfq: vi.fn(async () => ({
    id: "rfq-journey",
    title: "Caixas para lançamento",
    category: "Caixas",
    specification: "Caixas kraft personalizadas",
    quantity: "500 unidades",
    deadline: "2030-12-20",
    region: "São Paulo - SP",
    createdAt: "2030-01-01T00:00:00.000Z",
    status: "received",
    supplierIds: ["s1", "s2"],
  })),
  listEvaluations,
  listProposals: listProposalsMock,
}));

beforeEach(() => {
  listProposalsMock.mockImplementation(async () => [acceptedProposal, pendingProposal]);
  createProposalCheckout.mockReset();
  state.persistedEvaluation = null;
  listEvaluations.mockClear();
  createEvaluation.mockClear();
  window.history.replaceState({}, "", "/rfqs/rfq-journey");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

test("a avaliação salva reaparece após recarregar e propostas não aceitas não exibem o formulário", async () => {
  const user = userEvent.setup();
  const firstPage = render(<App />);

  const form = await screen.findByTestId("form-evaluation-proposal-accepted");
  expect(
    screen.queryByTestId("form-evaluation-proposal-pending"),
  ).toBeNull();

  await user.click(
    screen.getByTestId("button-score-proposal-accepted-5"),
  );
  await user.type(
    screen.getByTestId("input-evaluation-comment-proposal-accepted"),
    "Ótima qualidade e entrega no prazo.",
  );
  await user.click(
    screen.getByTestId("button-save-evaluation-proposal-accepted"),
  );

  await waitFor(() => expect(form.isConnected).toBe(false));
  expect(createEvaluation).toHaveBeenCalledWith("proposal-accepted", {
    score: 5,
    comment: "Ótima qualidade e entrega no prazo.",
  });

  firstPage.unmount();
  render(<App />);

  expect(
    await screen.findByTestId("evaluation-saved-proposal-accepted"),
  ).toBeTruthy();
  expect(
    screen.getByLabelText("5 de 5 estrelas"),
  ).toBeTruthy();
  expect(
    screen.getByTestId("text-evaluation-comment-proposal-accepted").textContent,
  ).toBe("Ótima qualidade e entrega no prazo.");
  expect(
    screen.queryByTestId("form-evaluation-proposal-pending"),
  ).toBeNull();
  expect(listEvaluations).toHaveBeenCalledTimes(2);
});
test("o formulário de RFQ mostra o erro devolvido pela API", async () => {
  const user = userEvent.setup();
  vi.mocked(createRfq)
    .mockRejectedValueOnce(
      Object.assign(new Error("HTTP 400"), {
        status: 400,
        data: { error: "Quantidade ou prazo inválido." },
      }),
    )
    .mockRejectedValueOnce(
      Object.assign(new Error("HTTP 500"), {
        status: 500,
        data: { error: "Erro interno. Tente novamente." },
      }),
    );
  window.history.replaceState({}, "", "/rfqs/new");
  render(<App />);

  const submit = await screen.findByRole("button", { name: /Criar RFQ/ });
  await user.click(submit);
  expect((await screen.findByTestId("status-rfq-error")).textContent).toBe(
    "Quantidade ou prazo inválido.",
  );
  expect(window.location.pathname).toBe("/rfqs/new");

  await user.click(submit);
  await waitFor(() =>
    expect(screen.getByTestId("status-rfq-error").textContent).toBe(
      "Não foi possível criar a RFQ. Tente novamente.",
    ),
  );

  await user.type(screen.getByPlaceholderText("Ex.: 1.200 unidades"), "1");
  expect(screen.queryByTestId("status-rfq-error")).toBeNull();
});

test("o comprador recusa uma proposta em aberto com motivo", async () => {
  const user = userEvent.setup();
  rejectProposal.mockResolvedValueOnce({ ...pendingProposal, status: "rejected" });
  render(<App />);

  expect(await screen.findByTestId("button-pay-proposal-pending")).toBeTruthy();
  expect(screen.queryByTestId("button-pay-proposal-accepted")).toBeNull();

  await user.click(screen.getByTestId("button-reject-proposal-pending"));
  await user.type(
    screen.getByTestId("input-reject-reason-proposal-pending"),
    "Prazo longo demais",
  );
  await user.click(screen.getByTestId("button-confirm-reject-proposal-pending"));

  expect(rejectProposal).toHaveBeenCalledWith("proposal-pending", "Prazo longo demais");
  const card = screen.getByTestId("card-proposal-proposal-pending");
  await waitFor(() => expect(card.textContent).toContain("Recusada"));
  expect(screen.queryByTestId("button-pay-proposal-pending")).toBeNull();
});

test("mostra o erro quando o pagamento não pode começar", async () => {
  const user = userEvent.setup();
  createProposalCheckout.mockRejectedValueOnce(
    new Error("O fornecedor ainda não habilitou recebimentos pelo Stripe."),
  );
  render(<App />);

  await user.click(await screen.findByTestId("button-pay-proposal-pending"));
  expect(
    (await screen.findByTestId("status-decision-error-proposal-pending")).textContent,
  ).toBe("O fornecedor ainda não habilitou recebimentos pelo Stripe.");
});

test("sem Stripe, o comprador aceita a proposta sem passar pelo checkout", async () => {
  const user = userEvent.setup();
  vi.stubEnv("VITE_STRIPE_CONNECT_DISABLED", "true");
  acceptProposal.mockResolvedValueOnce({ ...pendingProposal, status: "accepted" });
  render(<App />);

  const accept = await screen.findByTestId("button-pay-proposal-pending");
  expect(accept.textContent).toContain("Aceitar proposta");
  const loadsBefore = listProposalsMock.mock.calls.length;
  await user.click(accept);

  expect(acceptProposal).toHaveBeenCalledWith("proposal-pending");
  expect(createProposalCheckout).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(listProposalsMock.mock.calls.length).toBeGreaterThan(loadsBefore),
  );
});
