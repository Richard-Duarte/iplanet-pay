#!/usr/bin/env node
import assert from "node:assert/strict";

function ticketsFromContributedCents(cents, perTicket = 10_000) {
  return Math.floor(cents / perTicket);
}

function pickWeightedWinner(entries) {
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

function daysUntilNextRaffle(from = new Date()) {
  const target = new Date(from);
  target.setMonth(from.getMonth() + 1);
  target.setDate(1);
  target.setHours(0, 0, 0, 0);
  if (target <= from) target.setMonth(target.getMonth() + 1);
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / 86_400_000));
}

function calcWithdrawalAmounts(totalPaidCents, feePct = 30) {
  const fee = Math.round((totalPaidCents * feePct) / 100);
  return { fee_amount_cents: fee, refund_amount_cents: totalPaidCents - fee };
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

test("fichas: R$100 = 1 ticket", () => {
  assert.equal(ticketsFromContributedCents(0), 0);
  assert.equal(ticketsFromContributedCents(9999), 0);
  assert.equal(ticketsFromContributedCents(10000), 1);
  assert.equal(ticketsFromContributedCents(25000), 2);
});

test("sorteio: weighted winner from pool", () => {
  const w = pickWeightedWinner([
    { userId: "a", name: "A", tickets: 1 },
    { userId: "b", name: "B", tickets: 99 },
  ]);
  assert.ok(w);
  assert.ok(["a", "b"].includes(w.userId));
});

test("days until raffle is non-negative", () => {
  assert.ok(daysUntilNextRaffle() >= 0);
});

test("withdrawal 70/30 split", () => {
  const { fee_amount_cents, refund_amount_cents } = calcWithdrawalAmounts(100000, 30);
  assert.equal(fee_amount_cents, 30000);
  assert.equal(refund_amount_cents, 70000);
});

console.log(`\n${passed} test(s) passed.`);
