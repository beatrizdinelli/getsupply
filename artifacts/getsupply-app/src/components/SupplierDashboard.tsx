import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/getsupply-design-system/components/ui/tabs";
import { SupplierProfileForm } from "./SupplierProfileForm";
import { SupplierRfqInbox } from "./SupplierRfqInbox";

export function SupplierDashboard() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-primary">Painel do fornecedor</p>
      <h1 className="mt-2 font-serif text-4xl">Sua empresa na GetSupply.</h1>
      <p className="mt-3 text-muted-foreground">
        Mantenha seu perfil atualizado e responda aos pedidos de cotação da sua categoria.
      </p>
      <Tabs defaultValue="profile" className="mt-8">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="rfqs">Cotações</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <SupplierProfileForm />
        </TabsContent>
        <TabsContent value="rfqs">
          <SupplierRfqInbox />
        </TabsContent>
      </Tabs>
    </div>
  );
}
