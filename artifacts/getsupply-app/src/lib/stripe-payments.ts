const apiBase = `${window.location.origin}/api`;

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível concluir a operação.");
  }
  return payload as T;
}

export type SupplierRegistrationInput = {
  company: string;
  cnpj: string;
  categories: string;
  capacity: string;
  moq: string;
  region: string;
};

export function registerSupplier(input: SupplierRegistrationInput) {
  return apiRequest<{ id: string; registered: true }>("/suppliers/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createConnectOnboarding() {
  return apiRequest<{ url: string }>("/suppliers/connect/onboarding", {
    method: "POST",
  });
}

export function getConnectStatus() {
  return apiRequest<{ connected: boolean; detailsSubmitted: boolean }>(
    "/suppliers/connect/status",
  );
}

export function createProposalCheckout(proposalId: string) {
  return apiRequest<{ url: string }>(
    `/proposals/${encodeURIComponent(proposalId)}/checkout`,
    { method: "POST" },
  );
}