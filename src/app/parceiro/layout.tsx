import { redirect } from "next/navigation";

/** Parceiro descontinuado — apenas cliente e admin. */
export default function ParceiroLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  redirect("/entrar");
}
