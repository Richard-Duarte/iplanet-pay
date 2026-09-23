import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PerfilForm } from "@/components/profile/perfil-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyReferralCode } from "@/lib/referrals/queries";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { referral_code } = await getMyReferralCode(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        showBack
        eyebrow="Conta"
        title="Perfil"
        description="Seus dados e preferências."
      />
      <PerfilForm
        fullName={user.full_name}
        email={user.email}
        phone={user.phone ?? null}
        role={user.role}
        referralCode={referral_code}
      />
    </div>
  );
}
