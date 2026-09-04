import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

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

vi.mock("@workspace/api-client-react", () => ({
  chatSupplier: vi.fn(),
  createBuyerSession: vi.fn(),
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
  listProposals: vi.fn(async () => [acceptedProposal, pendingProposal]),
}));

beforeEach(() => {
  state.persistedEvaluation = null;
  listEvaluations.mockClear();
  createEvaluation.mockClear();
  window.history.replaceState({}, "", "/rfqs/rfq-journey");
});

afterEach(cleanup);

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