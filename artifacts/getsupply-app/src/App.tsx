// @ts-nocheck
import { useEffect, useState, type ReactNode } from "react";
import {
  Link,
  Redirect,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
  useParams,
} from "wouter";
import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { ptBR } from "@clerk/localizations";
import { ChatWidget } from "./components/ChatWidget";
import { PaymentSuccess } from "./components/PaymentSuccess";
import { ProposalCheckoutWidget } from "./components/ProposalCheckoutWidget";
import { SupplierRegistration } from "./components/SupplierRegistration";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  Home as HomeIcon,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  UserCircle,
  X,
} from "lucide-react";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/getsupply-design-system/components/ui/card";
import { Input } from "@workspace/getsupply-design-system/components/ui/input";
import { Textarea } from "@workspace/getsupply-design-system/components/ui/textarea";
import { Badge } from "@workspace/getsupply-design-system/components/ui/badge";
import { SupplierCard } from "@workspace/getsupply-design-system/components/ui/supplier-card";
import { StatusBadge } from "@workspace/getsupply-design-system/components/ui/status-badge";
import {
  createEvaluation,
  createProposal,
  createRfq,
  getRfq,
  listEvaluations,
  listProposals,
} from "@workspace/api-client-react";
import type { Evaluation } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "bottom" as const,
  },
  variables: {
    colorPrimary: "hsl(var(--primary))",
    colorForeground: "hsl(var(--foreground))",
    colorMutedForeground: "hsl(var(--muted-foreground))",
    colorDanger: "hsl(var(--destructive))",
    colorBackground: "hsl(var(--card))",
    colorInput: "hsl(var(--background))",
    colorInputForeground: "hsl(var(--foreground))",
    colorNeutral: "hsl(var(--border))",
    fontFamily: "var(--font-sans)",
    borderRadius: "var(--radius)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border shadow-sm",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-serif",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground",
    footerActionLink: "text-primary font-semibold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-chart-4",
    alertText: "text-destructive",
    logoBox: "mb-3",
    logoImage: "h-10",
    socialButtonsBlockButton: "border-input bg-background text-foreground",
    formButtonPrimary: "bg-primary text-primary-foreground",
    formFieldInput: "border-input bg-background text-foreground",
    footerAction: "bg-transparent",
    dividerLine: "bg-border",
    alert: "border-destructive/30 bg-destructive/10",
    otpCodeFieldInput: "border-input text-foreground",
    formFieldRow: "text-foreground",
    main: "gap-5",
  },
};

const clerkLocalization = {
  ...ptBR,
  signIn: {
    ...ptBR.signIn,
    start: {
      ...ptBR.signIn?.start,
      title: "Bem-vindo de volta",
      subtitle: "Entre para acessar suas cotações",
    },
  },
  signUp: {
    ...ptBR.signUp,
    start: {
      ...ptBR.signUp?.start,
      title: "Crie sua conta",
      subtitle: "Comece a encontrar fornecedores verificados",
    },
  },
};

type Supplier = {
  id: string;
  companyName: string;
  cnpj: string;
  imageUrl: string;
  imageAlt: string;
  categories: string[];
  region: string;
  moq: string;
  capacity: string;
  rating: number;
  reviews: number;
  verified: boolean;
  description: string;
};
type Proposal = {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  price: number;
  leadTime: string;
  moq: string;
  note: string;
  status: string;
};

function ProposalEvaluation({ proposal }: { proposal: Proposal }) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    listEvaluations(proposal.id)
      .then((items) => {
        if (active) setEvaluation(items[0] ?? null);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar a avaliação.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [proposal.id]);

  const submit = async (event: any) => {
    event.preventDefault();
    if (!score) {
      setError("Escolha uma nota de 1 a 5.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const saved = await createEvaluation(proposal.id, {
        score,
        comment: comment.trim() || undefined,
      });
      setEvaluation(saved);
    } catch {
      setError("Não foi possível salvar a avaliação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="mt-4 border-t pt-4 text-xs text-muted-foreground" data-testid={`status-evaluation-loading-${proposal.id}`}>Carregando avaliação...</p>;
  }

  if (evaluation) {
    return <div className="mt-4 border-t pt-4" data-testid={`evaluation-saved-${proposal.id}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Sua avaliação</p><div className="flex" aria-label={`${evaluation.score} de 5 estrelas`}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= evaluation.score ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />)}</div></div>{evaluation.comment && <p className="mt-2 text-sm leading-6 text-muted-foreground" data-testid={`text-evaluation-comment-${proposal.id}`}>{evaluation.comment}</p>}</div>;
  }

  return <form onSubmit={submit} className="mt-4 space-y-3 border-t pt-4" data-testid={`form-evaluation-${proposal.id}`}><div><p className="text-sm font-semibold">Avalie esta proposta</p><p className="mt-1 text-xs text-muted-foreground">Como foi sua experiência com esta escolha?</p></div><div className="flex gap-1" role="group" aria-label="Nota da proposta">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => { setScore(value); setError(""); }} className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`} aria-pressed={score === value} data-testid={`button-score-${proposal.id}-${value}`}><Star className={`h-6 w-6 transition-colors ${value <= score ? "fill-primary text-primary" : "text-muted-foreground/40 hover:text-primary"}`} /></button>)}</div><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Conte o que pesou na sua decisão (opcional)" className="min-h-20" maxLength={500} data-testid={`input-evaluation-comment-${proposal.id}`} />{error && <p className="text-xs font-medium text-destructive" role="alert" data-testid={`status-evaluation-error-${proposal.id}`}>{error}</p>}<Button type="submit" size="sm" disabled={submitting} data-testid={`button-save-evaluation-${proposal.id}`}>{submitting ? "Salvando..." : "Salvar avaliação"}</Button></form>;
}
type RFQ = {
  id: string;
  title: string;
  category: string;
  specification: string;
  quantity: string;
  deadline: string;
  region: string;
  createdAt: string;
  status: "waiting" | "received" | "delayed" | "closed";
  supplierIds: string[];
};

const seedSuppliers: Supplier[] = [
  { id: "s1", companyName: "Papelaria Aurora", cnpj: "12.345.678/0001-01", imageUrl: "/suppliers/cardboard-boxes.jpg", imageAlt: "Caixas de papelão produzidas pela Papelaria Aurora", categories: ["Caixas", "Papel"], region: "São Paulo, SP", moq: "500 unidades", capacity: "Até 50 mil/mês", rating: 4.9, reviews: 28, verified: true, description: "Especialistas em caixas rígidas e embalagens de papel para marcas que estão começando." },
  { id: "s2", companyName: "Norte Flex", cnpj: "23.456.789/0001-02", imageUrl: "/suppliers/flexible-packaging-products.webp", imageAlt: "Linha de embalagens flexíveis impressas da Norte Flex", categories: ["Sacolas", "Flexíveis"], region: "Blumenau, SC", moq: "1.000 unidades", capacity: "Até 100 mil/mês", rating: 4.8, reviews: 19, verified: true, description: "Impressão flexográfica com acabamento cuidadoso e lotes sob medida." },
  { id: "s3", companyName: "Ateliê do Rótulo", cnpj: "34.567.890/0001-03", imageUrl: "/suppliers/label-rolls.jpg", imageAlt: "Bobinas de rótulos adesivos do Ateliê do Rótulo", categories: ["Rótulos", "Adesivos"], region: "Belo Horizonte, MG", moq: "300 unidades", capacity: "Até 80 mil/mês", rating: 4.7, reviews: 42, verified: true, description: "Rótulos e adesivos premium, com atenção especial a cores e materiais especiais." },
  { id: "s4", companyName: "Casa da Embalagem", cnpj: "45.678.901/0001-04", imageUrl: "/suppliers/custom-gift-box.png", imageAlt: "Caixa personalizada para kits da Casa da Embalagem", categories: ["Caixas", "Kits"], region: "Curitiba, PR", moq: "250 unidades", capacity: "Até 20 mil/mês", rating: 4.6, reviews: 14, verified: true, description: "Pequenas tiragens e montagem de kits para lançamentos e datas especiais." },
];
function Logo() {
  return <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Package className="h-4 w-4" /></span>GetSupply</Link>;
}

function AuthControls({ mobile = false }: { mobile?: boolean }) {
  const { signOut } = useClerk();
  return <>
    <Show when="signed-out">
      <Link href="/sign-in" className={mobile ? "" : "text-sm text-muted-foreground"} aria-label={mobile ? "Entrar" : undefined}>
        {mobile ? <UserCircle className="h-5 w-5 text-primary" /> : "Entrar"}
      </Link>
    </Show>
    <Show when="signed-in">
      <button type="button" onClick={() => signOut({ redirectUrl: basePath || "/" })} className={mobile ? "" : "text-sm text-muted-foreground hover:text-foreground"} aria-label={mobile ? "Sair" : undefined}>
        {mobile ? <UserCircle className="h-5 w-5 text-primary" /> : "Sair"}
      </button>
    </Show>
  </>;
}

function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loc] = useLocation();
  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><Logo /><button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button><nav className="hidden items-center gap-1 md:flex"><Link href="/" className={`rounded-full px-4 py-2 text-sm ${loc === "/" ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground"}`}>Início</Link><Link href="/suppliers" className={`rounded-full px-4 py-2 text-sm ${loc.startsWith("/suppliers") ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground"}`}>Fornecedores</Link></nav><span className="hidden md:block"><AuthControls /></span></div>{open && <nav className="border-t px-4 py-2 md:hidden"><Link href="/" className="block border-b py-3 text-sm" onClick={() => setOpen(false)}>Início</Link><Link href="/suppliers" className="block border-b py-3 text-sm" onClick={() => setOpen(false)}>Fornecedores</Link></nav>}</header><main className="mx-auto max-w-6xl px-4 py-8">{children}</main></div>;
}

function Home() {
  const suppliers = seedSuppliers;
  const steps = [["1", "Descubra o que precisa", "Especifique materiais, medidas e quantidades no seu pedido."], ["2", "Receba propostas", "Fornecedores verificados enviam orçamentos diretamente para você."], ["3", "Compare e escolha", "Avalie preço, prazo e avaliações para fazer a melhor escolha."]];
  return <div className="min-h-screen bg-background pb-20 text-foreground md:pb-0"><header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-10"><Logo /><nav className="hidden items-center gap-1 md:flex"><Link href="/" className="rounded-full bg-secondary px-4 py-2 text-sm font-medium">Início</Link><Link href="/suppliers" className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Fornecedores</Link></nav><Link href="/login" className="hidden text-sm text-muted-foreground md:block">Entrar</Link><Link href="/login" className="md:hidden" aria-label="Abrir perfil"><UserCircle className="h-5 w-5 text-primary" /></Link></div></header><main className="mx-auto max-w-2xl px-4 py-5 md:max-w-6xl md:px-10 md:py-10"><section className="grid items-center gap-8 md:grid-cols-2 md:gap-14"><div className="order-2 md:order-1"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">GetSupply para sua marca</p><h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">Encontre fornecedores de embalagens <span className="font-serif italic font-normal">sem perder tempo.</span></h1><p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground md:text-base">Conectamos você a fornecedores confiáveis para criar embalagens bonitas, no volume certo e dentro do seu prazo.</p><Link href="/rfqs/new" className="mt-6 inline-flex"><Button size="lg" className="rounded-xl px-7"><Plus />Solicitar cotação</Button></Link></div><div className="warehouse-hero order-1 h-56 rounded-2xl md:order-2 md:h-80" role="img" aria-label="Galpão de embalagens com caixas prontas para envio" /></section><section className="mt-12 md:mt-20"><div className="text-center"><h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Como funciona</h2><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">Três passos simples para encontrar a embalagem perfeita.</p></div><div className="mt-6 grid gap-3 md:grid-cols-3 md:gap-5">{steps.map(([number, title, copy]) => <Card key={number} className="border-0 bg-card shadow-sm"><CardContent className="p-5 md:p-6"><span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm font-semibold text-primary">{number}</span><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{copy}</p></CardContent></Card>)}</div></section><section className="mt-12 md:mt-20"><div className="flex items-end justify-between"><div><h2 className="text-2xl font-semibold tracking-tight">Fornecedores em destaque</h2><p className="mt-1 text-xs text-muted-foreground">Parceiros de confiança prontos para atender sua demanda.</p></div><Link href="/suppliers" className="hidden text-xs font-semibold text-primary sm:block">Ver todos <ArrowRight className="ml-1 inline h-3 w-3" /></Link></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{suppliers.map((s) => <Link href={`/suppliers/${s.id}`} key={s.id}><Card className="overflow-hidden transition-transform hover:-translate-y-0.5"><img src={s.imageUrl} alt={s.imageAlt} className="h-32 w-full object-cover" loading="lazy" /><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">{s.companyName}</h3><p className="mt-1 text-[11px] text-muted-foreground">{s.categories.join(" · ")}</p></div><span className="flex items-center gap-1 text-xs font-semibold text-primary"><Star className="h-3 w-3 fill-primary" />{s.rating}</span></div><p className="mt-3 text-[11px] text-muted-foreground">MOQ mínimo: <b className="text-foreground">{s.moq}</b></p><Button variant="outline" size="sm" className="mt-4 w-full">Ver perfil</Button></CardContent></Card></Link>)}</div></section></main><nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t bg-background/95 px-2 backdrop-blur md:hidden"><Link href="/" className="flex flex-col items-center justify-center gap-1 text-primary"><HomeIcon className="h-4 w-4" /><span className="text-[10px] font-semibold">Início</span></Link><Link href="/rfqs/new" className="flex flex-col items-center justify-center gap-1 text-muted-foreground"><FileText className="h-4 w-4" /><span className="text-[10px]">Cotações</span></Link><Link href="/login" className="flex flex-col items-center justify-center gap-1 text-muted-foreground"><MessageCircle className="h-4 w-4" /><span className="text-[10px]">Mensagens</span></Link><Link href="/login" className="flex flex-col items-center justify-center gap-1 text-muted-foreground"><UserCircle className="h-4 w-4" /><span className="text-[10px]">Perfil</span></Link></nav></div>;
}

function Field({ label, name, placeholder, type = "text", value, onChange }: any) {
  return <label className="block space-y-2 text-sm font-medium">{label}<Input name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} className="mt-1" /></label>;
}

function NewRfq() {
  const [, setLoc] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Caixas", specification: "", quantity: "", deadline: "", region: "Sudeste" });
  const update = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e: any) => { e.preventDefault(); setSubmitting(true); try { const r = await createRfq(form); setLoc(`/rfqs/${r.id}`); } finally { setSubmitting(false); } };
  return <Shell><Link href="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground"><ChevronLeft className="mr-1 h-4 w-4" />Voltar</Link><div className="mx-auto max-w-2xl"><p className="text-sm font-medium text-primary">Novo pedido</p><h1 className="mt-2 font-serif text-4xl">Conte o que você está imaginando.</h1><p className="mt-3 text-muted-foreground">Quanto mais contexto, melhores serão as propostas que chegam até você.</p><Card className="mt-8"><CardContent className="p-6 sm:p-8"><form onSubmit={submit} className="space-y-6"><Field label="Nome do projeto" name="title" placeholder="Ex.: Caixas para coleção de inverno" value={form.title} onChange={update} /><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium">Categoria<select name="category" value={form.category} onChange={update} className="mt-2 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option>Caixas</option><option>Potes</option><option>Rótulos</option><option>Sacos</option></select></label><Field label="Quantidade" name="quantity" placeholder="Ex.: 1.200 unidades" value={form.quantity} onChange={update} /></div><label className="block space-y-2 text-sm font-medium">Especificações<Textarea name="specification" value={form.specification} onChange={update} placeholder="Materiais, dimensões, acabamentos, cores..." className="mt-2 min-h-28" /></label><div className="grid gap-5 sm:grid-cols-2"><Field label="Prazo desejado" name="deadline" type="date" value={form.deadline} onChange={update} /><Field label="Região de entrega" name="region" placeholder="Ex.: Sudeste" value={form.region} onChange={update} /></div><label className="block rounded-lg border border-dashed p-4 text-sm text-muted-foreground"><FileText className="mr-2 inline h-4 w-4" />Anexar desenho técnico (opcional)<input type="file" className="mt-2 block w-full text-xs" /></label><Button type="submit" disabled={submitting} className="w-full" size="lg">{submitting ? "Salvando..." : "Criar RFQ"} <ArrowRight /></Button></form></CardContent></Card></div></Shell>;
}

function Suppliers() {
  const suppliers = seedSuppliers;
  const [q, setQ] = useState("");
  const list = suppliers.filter((s) => `${s.companyName} ${s.categories.join(" ")} ${s.region}`.toLowerCase().includes(q.toLowerCase()));
  return <Shell><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Fornecedores GetSupply</p><h1 className="mt-2 font-serif text-4xl">Fornecedores que<br /><i>entendem o começo.</i></h1></div><div className="relative sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar fornecedor" className="pl-9" /></div></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((s) => <SupplierCard key={s.id} name={s.companyName} category={s.categories[0]} rating={s.rating} reviewCount={s.reviews} moq={s.moq} thumbnailUrl={s.imageUrl} thumbnailAlt={s.imageAlt} verified={s.verified} location={s.region} actionLabel="Ver perfil" onAction={() => window.location.href = `/suppliers/${s.id}`} />)}</div>{!list.length && <Card className="mt-8"><CardContent className="p-10 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">Nenhum fornecedor encontrado</h2><p className="mt-1 text-sm text-muted-foreground">Tente buscar por outra categoria ou região.</p></CardContent></Card>}</Shell>;
}

function SupplierProfile() {
  const { id } = useParams();
  const suppliers = seedSuppliers;
  const s = suppliers.find((x) => x.id === id) || suppliers[0];
  return <Shell><Link href="/suppliers" className="mb-6 inline-flex items-center text-sm text-muted-foreground"><ChevronLeft className="mr-1 h-4 w-4" />Fornecedores</Link><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><Card><img src={s.imageUrl} alt={s.imageAlt} className="h-56 w-full rounded-t-xl object-cover sm:h-72" /><CardContent className="p-6 sm:p-9"><div><div className="flex items-center gap-2"><h1 className="font-serif text-4xl">{s.companyName}</h1>{s.verified && <ShieldCheck className="h-5 w-5 text-primary" />}</div><p className="mt-1 text-muted-foreground">{s.region} · CNPJ {s.cnpj}</p><div className="mt-3 flex items-center gap-2"><Star className="h-4 w-4 fill-primary text-primary" /><b>{s.rating}</b><span className="text-sm text-muted-foreground">({s.reviews} avaliações)</span></div></div><p className="mt-9 max-w-2xl leading-7 text-muted-foreground">{s.description}</p><h2 className="mt-9 text-lg font-semibold">O que fazem bem</h2><div className="mt-3 flex flex-wrap gap-2">{s.categories.map((c) => <Badge variant="secondary" key={c}>{c}</Badge>)}</div></CardContent></Card><Card className="h-fit"><CardHeader><CardTitle>Dados rápidos</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><Info label="Pedido mínimo" value={s.moq} /><Info label="Capacidade" value={s.capacity} /><Info label="Região" value={s.region} /><Link href="/rfqs/new" className="block pt-3"><Button className="w-full"><Send />Criar um RFQ</Button></Link></CardContent></Card></div></Shell>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b pb-3"><span className="text-muted-foreground">{label}</span><b className="text-right">{value}</b></div>;
}

function RfqDetail() {
  const { id } = useParams();
  const suppliers = seedSuppliers;
  const [r, setR] = useState<RFQ | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [form, setForm] = useState({ supplierId: "s1", price: "", leadTime: "", moq: "", note: "" });
  useEffect(() => { if (!id) return; Promise.all([getRfq(id), listProposals(id)]).then(([rfq, items]) => { setR(rfq); setProposals(items); }); }, [id]);
  if (!r) return <Shell><p className="py-16 text-center text-sm text-muted-foreground">Carregando RFQ...</p></Shell>;
  const invited = r.supplierIds.length ? suppliers.filter((s) => r.supplierIds.includes(s.id)) : suppliers;
  const submit = async (e: any) => { e.preventDefault(); const supplier = suppliers.find((s) => s.id === form.supplierId)!; const proposal = await createProposal(r.id, { supplierId: supplier.id, supplierName: supplier.companyName, price: Number(form.price), leadTime: form.leadTime, moq: form.moq, note: form.note }); setProposals([proposal, ...proposals]); setR({ ...r, status: "received" }); setForm({ ...form, price: "", leadTime: "", moq: "", note: "" }); };
  return <Shell><Link href="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground"><ChevronLeft className="mr-1 h-4 w-4" />Visão geral</Link><div><div className="flex gap-2"><Badge variant="secondary">{r.category}</Badge><StatusBadge status={r.status} /></div><h1 className="mt-3 font-serif text-4xl">{r.title}</h1><p className="mt-2 text-muted-foreground">{r.quantity} · prazo {r.deadline} · {r.region}</p></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Especificações</CardTitle></CardHeader><CardContent><p className="text-sm leading-7 text-muted-foreground">{r.specification}</p><h3 className="mt-7 text-sm font-semibold">Fornecedores convidados ({invited.length})</h3><div className="mt-3 space-y-2">{invited.map((s) => <Link href={`/suppliers/${s.id}`} className="flex items-center justify-between rounded-lg bg-secondary/60 p-3 text-sm" key={s.id}><span className="font-medium">{s.companyName}</span><span className="text-muted-foreground">{s.rating} <Star className="inline h-3 w-3 fill-primary text-primary" /></span></Link>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Propostas recebidas</CardTitle></CardHeader><CardContent className="space-y-3">{proposals.map((p) => <div className="rounded-lg border p-4" key={p.id} data-testid={`card-proposal-${p.id}`}><div className="flex justify-between"><b>{p.supplierName}</b><strong className="text-primary">R$ {p.price.toLocaleString("pt-BR")}</strong></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span><Clock3 className="mr-1 inline h-3 w-3" />{p.leadTime}</span><span>MOQ {p.moq}</span></div>{p.note && <p className="mt-3 text-sm text-muted-foreground">{p.note}</p>}{p.status === "accepted" && <ProposalEvaluation proposal={p} />}</div>)}{!proposals.length && <p className="py-6 text-sm text-muted-foreground">As propostas aparecerão aqui quando os fornecedores responderem.</p>}</CardContent></Card></div><Card className="mt-6"><CardHeader><CardTitle>Enviar uma proposta de demonstração</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 sm:grid-cols-5"><select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="h-9 rounded-md border bg-transparent px-3 text-sm">{invited.map((s) => <option value={s.id} key={s.id}>{s.companyName}</option>)}</select><Input required placeholder="Preço total (R$)" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /><Input required aria-label="Prazo de entrega" type="date" value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} /><Input required placeholder="MOQ (un.)" value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} /><Button type="submit"><Send />Enviar</Button></form></CardContent></Card></Shell>;
}

function Apply() {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ company: "", cnpj: "", categories: "", capacity: "", moq: "", region: "" });
  const update = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
  if (done) return <Shell><Card className="mx-auto max-w-lg"><CardContent className="p-10 text-center"><Check className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 font-serif text-3xl">Recebemos seu cadastro.</h1><p className="mt-3 text-muted-foreground">Nossa equipe vai analisar os detalhes e entrar em contato em breve.</p><Link href="/suppliers" className="mt-6 inline-flex"><Button>Conhecer fornecedores</Button></Link></CardContent></Card></Shell>;
  return <Shell><div className="mx-auto max-w-2xl"><p className="text-sm font-medium text-primary">Para fornecedores</p><h1 className="mt-2 font-serif text-4xl">Faça parte da nossa prateleira.</h1><p className="mt-3 text-muted-foreground">Conte sobre sua operação. Procuramos parceiros cuidadosos, transparentes e bons no que fazem.</p><Card className="mt-8"><CardContent className="grid gap-5 p-6 sm:grid-cols-2">{<Field label="Empresa" name="company" value={form.company} onChange={update} />}<Field label="CNPJ" name="cnpj" value={form.cnpj} onChange={update} /><Field label="Categorias" name="categories" placeholder="Caixas, rótulos..." value={form.categories} onChange={update} /><Field label="Capacidade mensal" name="capacity" placeholder="Ex.: 50 mil unidades" value={form.capacity} onChange={update} /><Field label="Pedido mínimo (MOQ)" name="moq" value={form.moq} onChange={update} /><Field label="Região" name="region" value={form.region} onChange={update} /><Button className="sm:col-span-2" size="lg" onClick={() => setDone(true)}>Enviar cadastro <ArrowRight /></Button></CardContent></Card></div></Shell>;
}

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function ProtectedPage({ children }: { children: ReactNode }) {
  return <>
    <Show when="signed-in">{children}</Show>
    <Show when="signed-out"><Redirect to="/sign-in" /></Show>
  </>;
}

function HomeRedirect() {
  return <>
    <Show when="signed-in"><Redirect to="/suppliers" /></Show>
    <Show when="signed-out"><Home /></Show>
  </>;
}

function AppRoutes() {
  return <>
    <Switch>
      <Route path="/login">{() => <Redirect to="/sign-in" />}</Route>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/rfqs/new">{() => <ProtectedPage><NewRfq /></ProtectedPage>}</Route>
      <Route path="/rfqs/:id">{() => <ProtectedPage><RfqDetail /></ProtectedPage>}</Route>
      <Route path="/payments/success">{() => <ProtectedPage><Shell><PaymentSuccess /></Shell></ProtectedPage>}</Route>
      <Route path="/suppliers/:id" component={SupplierProfile} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/supplier/apply">{() => <ProtectedPage><Shell><SupplierRegistration /></Shell></ProtectedPage>}</Route>
      <Route path="/" component={HomeRedirect} />
      <Route>
        <Shell>
          <Card>
            <CardContent className="p-10 text-center">
              <X className="mx-auto" />
              <h1 className="mt-3 font-serif text-3xl">Página não encontrada</h1>
              <Link href="/" className="mt-5 inline-flex"><Button>Voltar ao início</Button></Link>
            </CardContent>
          </Card>
        </Shell>
      </Route>
    </Switch>
    <Show when="signed-in"><ProposalCheckoutWidget /><ChatWidget /></Show>
  </>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={clerkLocalization}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  ><AppRoutes /></ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;