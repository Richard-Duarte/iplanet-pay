import { PanelChrome } from "@/components/panels/panel-chrome";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelChrome role="staff">{children}</PanelChrome>;
}
