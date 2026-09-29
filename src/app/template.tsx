/** Sem transição global — evita re-animação em toda navegação (app/admin). */
export default function Template({ children }: { children: React.ReactNode }) {
  return children;
}
