import { redirect } from "next/navigation";

export const metadata = { title: "Perfil" };

export default function PerfilRedirectPage() {
  redirect("/app/configuracoes");
}
