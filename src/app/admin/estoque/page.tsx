import { redirect } from "next/navigation";

/** Estoque removido — estoque infinito. */
export default function EstoqueRemovedPage() {
  redirect("/admin");
}
