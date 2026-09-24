import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ConfiguracoesForm } from "@/components/profile/configuracoes-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyReferralCode } from "@/lib/referrals/queries";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/app/configuracoes");

  const { referral_code } = await getMyReferralCode(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        showBack
        backFallback="/app"
        eyebrow="Conta"
        title="Configurações"
        description="Foto, dados, senha e chave Pix."
      />
      <ConfiguracoesForm
        fullName={user.full_name}
        email={user.email}
        phone={user.phone ?? null}
        avatarUrl={user.avatar_url ?? null}
        pixKey={user.pix_key ?? null}
        pixKeyType={user.pix_key_type ?? null}
        referralCode={referral_code}
      />
    </div>
  );
}
