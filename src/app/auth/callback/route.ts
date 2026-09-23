import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/auth";

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let role: UserRole = "cliente";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // Safety net if trigger missed (should be rare). Never overwrite admins.
          const fullName =
            (typeof user.user_metadata?.full_name === "string" &&
              user.user_metadata.full_name) ||
            (typeof user.user_metadata?.name === "string" &&
              user.user_metadata.name) ||
            "";
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: fullName,
            role: "cliente",
          });
          role = "cliente";
        } else {
          role = (profile.role ?? "cliente") as UserRole;
        }
      }

      const dest = nextParam ?? homeForRole(role);

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${dest}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${dest}`);
      }
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/entrar?error=${encodeURIComponent("Falha ao autenticar com Google.")}`,
  );
}
