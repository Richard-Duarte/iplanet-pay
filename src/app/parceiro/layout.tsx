import { PanelChrome } from "@/components/panels/panel-chrome";

export default function ParceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelChrome role="parceiro">{children}</PanelChrome>;
}
