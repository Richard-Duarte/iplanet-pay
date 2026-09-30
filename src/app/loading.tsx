import { ExperiencePreloader } from "@/components/ui/experience-preloader";

/** Fallback ao navegar para rotas públicas sem loading.tsx próprio (ex.: /). */
export default function RootLoading() {
  return <ExperiencePreloader variant="landing" className="min-h-screen" />;
}
