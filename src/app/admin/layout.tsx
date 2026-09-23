import { PanelChrome } from "@/components/panels/panel-chrome";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelChrome role="admin">{children}</PanelChrome>;
}
