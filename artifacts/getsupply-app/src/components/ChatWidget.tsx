// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  MessageCircle,
  X,
  Send,
  ShieldCheck,
  MapPin,
  Package,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import { Input } from "@workspace/getsupply-design-system/components/ui/input";
import { Badge } from "@workspace/getsupply-design-system/components/ui/badge";
import { Skeleton } from "@workspace/getsupply-design-system/components/ui/skeleton";
import { ScrollArea } from "@workspace/getsupply-design-system/components/ui/scroll-area";
import {
  chatSupplier,
} from "@workspace/api-client-react";
import type { SupplierSuggestion } from "@workspace/api-client-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "user" | "assistant";

interface ChatMsg {
  id: string;
  role: Role;
  content: string;
  suppliers?: SupplierSuggestion[];
  error?: boolean;
}

// ---------------------------------------------------------------------------
// Supplier suggestion card (inside the chat panel)
// ---------------------------------------------------------------------------

function ChatSupplierCard({
  supplier,
}: {
  supplier: SupplierSuggestion;
}) {
  return (
    <article className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Package className="h-3.5 w-3.5 text-secondary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight">
            {supplier.name}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground leading-tight mt-0.5">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {supplier.region}
          </p>
        </div>
        {supplier.verified && (
          <div className="flex items-center gap-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground shrink-0">
            <ShieldCheck className="h-2.5 w-2.5 text-chart-4" />
            Verificado
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {supplier.category}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            MOQ:{" "}
            <span className="font-semibold text-foreground">
              {supplier.standardMoq.toLocaleString("pt-BR")} un.
            </span>
          </span>
        </div>

        {/* RFQ action — explicit user-initiated only */}
        <Link
          href="/rfqs/new"
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition-opacity hover:opacity-80"
        >
          <Send className="h-3 w-3" />
          Criar RFQ para este fornecedor
        </Link>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state for a message being composed
// ---------------------------------------------------------------------------

function AssistantTyping() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3.5 w-1/2" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : msg.error
            ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-sm"
            : "bg-secondary text-secondary-foreground rounded-bl-sm"
        }`}
      >
        {msg.error && (
          <span className="mr-1.5 inline-flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
          </span>
        )}
        {msg.content}
      </div>

      {/* Supplier suggestions */}
      {msg.suppliers && msg.suppliers.length > 0 && (
        <div className="w-full max-w-[90%] space-y-2">
          {msg.suppliers.map((s) => (
            <ChatSupplierCard key={s.id} supplier={s} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main chat widget
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá. Sou o assistente GetSupply. Descreva o que você precisa — tipo de embalagem, quantidade estimada e região — e vou sugerir fornecedores verificados.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change or panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [messages, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    // Build history from current messages (exclude the welcome msg from history
    // but keep subsequent turns). We send only user/assistant text turns.
    const history = messages
      .filter((m) => m.id !== "welcome" && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const request = {
        history,
        message: text,
      };
      const response = await chatSupplier(request);

      const assistantMsg: ChatMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: response.message,
        suppliers: response.suppliers,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMsg = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content:
          "Não consegui processar sua mensagem. Tente novamente em instantes.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = input.trim().length > 0 && !loading;

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar assistente" : "Abrir assistente GetSupply"}
        aria-expanded={open}
        className={`
          fixed bottom-6 right-6 z-50
          flex h-13 w-13 items-center justify-center
          rounded-full bg-primary text-primary-foreground
          shadow-lg border border-primary-border
          transition-transform duration-200
          hover:scale-105 active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          md:bottom-8 md:right-8
        `}
        style={{ height: "3.25rem", width: "3.25rem" }}
      >
        {open ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>

      {/* ── Chat panel ─────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-label="Assistente GetSupply"
        aria-modal="false"
        className={`
          fixed bottom-24 right-6 z-50
          flex flex-col
          w-[calc(100vw-3rem)] max-w-sm
          rounded-2xl border bg-card text-card-foreground shadow-xl
          md:bottom-28 md:right-8
          transition-all duration-200 origin-bottom-right
          ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
        `}
        style={{ maxHeight: "min(600px, calc(100dvh - 9rem))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 shrink-0">
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">
              Assistente GetSupply
            </p>
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mt-0.5">
              {"SUGESTÕES GERADAS POR IA \u2014 A DECISÃO FINAL É SUA"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fechar chat"
            onClick={() => setOpen(false)}
            className="shrink-0 h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="flex flex-col gap-4 p-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Loading state */}
            {loading && (
              <div className="flex items-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-secondary px-3 py-2.5">
                  <AssistantTyping />
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t px-3 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o que precisa..."
              disabled={loading}
              className="flex-1 text-sm"
              maxLength={2000}
              aria-label="Mensagem para o assistente"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!canSend}
              aria-label="Enviar mensagem"
              className="shrink-0 h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
