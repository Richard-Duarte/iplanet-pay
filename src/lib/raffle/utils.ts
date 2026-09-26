export const FICHA_CENTS = 10_000;

export function ticketsFromContributedCents(cents: number, perTicket = FICHA_CENTS) {
  return Math.floor(cents / perTicket);
}

export function daysUntilNextRaffle(from = new Date()) {
  const target = new Date(from);
  target.setMonth(from.getMonth() + 1);
  target.setDate(1);
  target.setHours(0, 0, 0, 0);
  if (target <= from) {
    target.setMonth(target.getMonth() + 1);
  }
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / 86_400_000));
}

export function pickWeightedWinner(
  entries: Array<{ userId: string; name: string; tickets: number }>,
): { userId: string; name: string } | null {
  const pool = entries.filter((e) => e.tickets > 0);
  if (pool.length === 0) return null;
  const total = pool.reduce((s, e) => s + e.tickets, 0);
  let r = Math.random() * total;
  for (const e of pool) {
    r -= e.tickets;
    if (r <= 0) return { userId: e.userId, name: e.name };
  }
  const last = pool[pool.length - 1];
  return { userId: last.userId, name: last.name };
}
