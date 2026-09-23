import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { IndicacoesPanel } from "@/components/referrals/indicacoes-panel";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getMyReferralCode,
  getReferralBonusCents,
  listMyReferrals,
} from "@/lib/referrals/queries";

export const metadata = { title: "Indicações" };

export default async function IndicacoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/app/indicacoes");

  const [{ referral_code, referred_by }, { referrals }, bonusCents] =
    await Promise.all([
      getMyReferralCode(user.id),
      listMyReferrals(user.id),
      getReferralBonusCents(),
    ]);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    `${proto}://${host}`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Programa"
        title="Indicações"
        description="Convide amigos e acompanhe recompensas."
      />
      <IndicacoesPanel
        referralCode={referral_code}
        referredBy={referred_by}
        referrals={referrals}
        bonusCents={bonusCents}
        origin={origin}
      />
    </div>
  );
}
