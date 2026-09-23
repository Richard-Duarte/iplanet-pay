import { redirect } from "next/navigation";

/** Staff descontinuado — apenas cliente e admin. */
export default function StaffLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  redirect("/entrar");
}
