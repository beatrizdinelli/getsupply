const apiBase = `${window.location.origin}/api`;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
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

export type SupplierProfile = {
  id: string;
  company: string;
  cnpj: string;
  cnpjVerified: boolean;
  region: string;
  capacity: string;
  moq: number | null;
  categories: string;
  logoUrl: string | null;
  stripeOnboardingComplete: boolean;
};

export type SupplierProfileUpdate = {
  region?: string;
  capacity?: string;
  moq?: string;
  categories?: string;
};

export type SupplierProposal = {
  id: string;
  rfqId: string;
  price: number;
  leadTime: string;
  moq: number;
  note: string;
  status: "sent" | "accepted" | "rejected";
};

export type SupplierRfq = {
  id: string;
  title: string;
  category: string;
  specification: string;
  quantity: string;
  deadline: string;
  region: string;
  createdAt: string;
  status: "waiting" | "received" | "delayed" | "closed";
  myProposal: SupplierProposal | null;
};

export type NewProposalInput = {
  price: number;
  leadTime: string;
  moq: string;
  note?: string;
};

export function getSupplierProfile() {
  return apiRequest<SupplierProfile>("/suppliers/me");
}

export function updateSupplierProfile(input: SupplierProfileUpdate) {
  return apiRequest<SupplierProfile>("/suppliers/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listSupplierRfqs() {
  return apiRequest<SupplierRfq[]>("/suppliers/me/rfqs");
}

export function createSupplierProposal(rfqId: string, input: NewProposalInput) {
  return apiRequest<SupplierProposal>(
    `/suppliers/me/rfqs/${encodeURIComponent(rfqId)}/proposals`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function uploadSupplierLogo(file: File): Promise<{ logoUrl: string }> {
  const response = await fetch(`${apiBase}/suppliers/me/logo`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": file.type },
    body: file,
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    logoUrl?: string;
  };
  if (!response.ok || !payload.logoUrl) {
    throw new Error(payload.error || "Não foi possível enviar a imagem.");
  }
  return { logoUrl: payload.logoUrl };
}
