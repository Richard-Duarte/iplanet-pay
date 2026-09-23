import { PageHeader } from "@/components/ui/page-header";
import { WhatsappAdminPanel } from "@/components/admin/whatsapp-admin-panel";
import { listWhatsappTemplates } from "@/lib/whatsapp/admin";
import { whatsappConfigured } from "@/lib/whatsapp/client";

export const metadata = { title: "WhatsApp" };

export default async function AdminWhatsappPage() {
  const { templates, error } = await listWhatsappTemplates();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Comunicação"
        title="WhatsApp"
        description="Templates, broadcast e fila de disparo (stub sem chaves Meta)."
        backFallback="/admin"
      />
      {error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : (
        <WhatsappAdminPanel
          templates={templates}
          apiConfigured={whatsappConfigured()}
        />
      )}
    </div>
  );
}
