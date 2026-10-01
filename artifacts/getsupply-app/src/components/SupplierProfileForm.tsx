import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@workspace/getsupply-design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/getsupply-design-system/components/ui/card";
import { Input } from "@workspace/getsupply-design-system/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/getsupply-design-system/components/ui/avatar";
import { FileUpload } from "@workspace/getsupply-design-system/components/ui/file-upload";
import {
  getSupplierProfile,
  updateSupplierProfile,
  uploadSupplierLogo,
  type SupplierProfile,
} from "../lib/supplier-dashboard";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function SupplierProfileForm() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [form, setForm] = useState({ region: "", capacity: "", moq: "", categories: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupplierProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          region: data.region,
          capacity: data.capacity,
          moq: data.moq ? String(data.moq) : "",
          categories: data.categories,
        });
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "Não foi possível carregar seu perfil.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const update = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setSaved(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateSupplierProfile(form);
      setProfile(updated);
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível salvar as alterações.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onLogoChange = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { logoUrl } = await uploadSupplierLogo(file);
      setProfile((current) => (current ? { ...current, logoUrl } : current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Carregando seu perfil...</p>;
  }
  if (!profile) {
    return <p className="py-10 text-center text-sm text-destructive">{error || "Não foi possível carregar seu perfil."}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo da empresa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 sm:flex-row">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.logoUrl ?? undefined} alt={profile.company} />
            <AvatarFallback className="text-lg font-semibold">
              {initials(profile.company)}
            </AvatarFallback>
          </Avatar>
          <FileUpload
            className="flex-1"
            accept="image/png,image/jpeg,image/webp"
            maxSizeMB={4}
            label="Enviar logo da empresa"
            helpText="PNG, JPEG ou WebP · máximo 4 MB"
            disabled={uploading}
            onChange={onLogoChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Dados da empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Empresa
              <Input value={profile.company} disabled className="mt-1" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              CNPJ
              <Input value={profile.cnpj} disabled className="mt-1" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Região
              <Input required name="region" value={form.region} onChange={update} className="mt-1" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Categorias
              <Input
                name="categories"
                placeholder="Caixas, rótulos..."
                value={form.categories}
                onChange={update}
                className="mt-1"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Capacidade mensal
              <Input
                name="capacity"
                placeholder="Ex.: 50 mil unidades"
                value={form.capacity}
                onChange={update}
                className="mt-1"
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Pedido mínimo (MOQ)
              <Input name="moq" value={form.moq} onChange={update} className="mt-1" />
            </label>
            {error && (
              <p className="text-sm font-medium text-destructive sm:col-span-2" role="alert">
                {error}
              </p>
            )}
            {saved && !error && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary sm:col-span-2">
                <Check className="h-4 w-4" /> Perfil atualizado.
              </p>
            )}
            <Button className="sm:col-span-2" size="lg" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
