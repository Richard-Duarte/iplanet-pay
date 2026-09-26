import { createClient } from "@/lib/supabase/server";

export type RaffleRankingRow = {
  user_id: string;
  full_name: string;
  tickets: number;
  total_contributed_cents: number;
};

const FICHA_CENTS = 10_000;

export function ticketsFromContributedCents(cents: number, perTicket = FICHA_CENTS) {
  return Math.floor(cents / perTicket);
}

export function daysUntilNextRaffle(from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const next =
    from.getDate() >= 1
      ? new Date(year, month + 1, 1, 0, 0, 0, 0)
      : new Date(year, month, 1, 0, 0, 0, 0);
  if (from.getDate() > 1 || from.getHours() > 0) {
    /* next month day 1 */
  }
  const target = new Date(from);
  target.setMonth(from.getMonth() + (from.getDate() >= 1 ? 1 : 0));
  target.setDate(1);
  target.setHours(0, 0, 0, 0);
  if (target <= from) {
    target.setMonth(target.getMonth() + 1);
  }
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / 86_400_000));
}

export async function getUserTickets(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("user_raffle_tickets", {
    p_user_id: userId,
  });
  return typeof data === "number" ? data : 0;
}

export async function getAporteRanking(limit = 50): Promise<{
  rows: RaffleRankingRow[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contributions")
    .select("user_id, amount_cents, status")
    .eq("status", "confirmed");

  if (error) return { rows: [], error: error.message };

  const byUser = new Map<string, number>();
  for (const row of data ?? []) {
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + row.amount_cents);
  }

  const userIds = [...byUser.keys()];
  if (userIds.length === 0) return { rows: [], error: null };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameMap = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; full_name: string | null }) => [
      p.id,
      p.full_name ?? "Cliente",
    ]),
  );

  const rows = userIds
    .map((user_id) => {
      const total = byUser.get(user_id) ?? 0;
      return {
        user_id,
        full_name: nameMap.get(user_id) ?? "Cliente",
        total_contributed_cents: total,
        tickets: ticketsFromContributedCents(total),
      };
    })
    .filter((r) => r.tickets > 0)
    .sort((a, b) => b.tickets - a.tickets || b.total_contributed_cents - a.total_contributed_cents)
    .slice(0, limit);

  return { rows, error: null };
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
