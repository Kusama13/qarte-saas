import { describe, it, expect } from 'vitest';
import { creditBookingLoyalty, revokeBookingLoyalty } from '../booking-loyalty';

/**
 * Stub Supabase chaînable minimal. Résout chaque requête selon (table, opération) via `cfg`.
 * Enregistre les inserts / updates / deletes pour assertions.
 */
function makeStub(cfg: Record<string, unknown>) {
  const calls = {
    inserts: [] as Array<{ table: string; payload: Record<string, unknown> }>,
    updates: [] as Array<{ table: string; payload: Record<string, unknown> }>,
    deletes: [] as Array<{ table: string }>,
  };

  function resolveSingle(table: string, op: string) {
    if (table === 'merchant_planning_slots') return { data: cfg.slot ?? null, error: null };
    if (table === 'merchants') return { data: cfg.merchant ?? null, error: null };
    if (table === 'visits') return { data: cfg.visitMaybe ?? null, error: null };
    if (table === 'loyalty_cards') {
      if (op === 'insert') return { data: cfg.cardInsert ?? { id: 'card-new', current_stamps: 0, current_amount: 0 }, error: cfg.cardInsertError ?? null };
      return { data: cfg.card ?? null, error: null };
    }
    return { data: null, error: null };
  }
  function resolveTerminal(table: string, op: string) {
    if (table === 'visits' && op === 'insert') return { error: cfg.visitInsertError ?? null };
    if (table === 'visits' && op === 'delete') return { error: null };
    if (table === 'visits') return { count: cfg.sameDayCount ?? 0, error: null }; // dedup count
    if (table === 'loyalty_cards' && op === 'update') return { error: cfg.cardUpdateError ?? null };
    return { error: null };
  }

  function builder(table: string) {
    let op = 'select';
    const b: Record<string, unknown> = {
      select: () => b,
      insert: (payload: Record<string, unknown>) => { op = 'insert'; calls.inserts.push({ table, payload }); return b; },
      update: (payload: Record<string, unknown>) => { op = 'update'; calls.updates.push({ table, payload }); return b; },
      delete: () => { op = 'delete'; calls.deletes.push({ table }); return b; },
      eq: () => b,
      gte: () => b,
      lt: () => b,
      order: () => b,
      limit: () => b,
      maybeSingle: () => Promise.resolve(resolveSingle(table, op)),
      single: () => Promise.resolve(resolveSingle(table, op)),
      then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolveTerminal(table, op)).then(resolve),
    };
    return b;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { admin: { from: (table: string) => builder(table) } as any, calls };
}

const ATTENDED_SLOT = {
  id: 'slot-1', merchant_id: 'm1', customer_id: 'c1', total_price: 45,
  slot_date: '2026-06-12', start_time: '14:00', attendance_status: 'attended',
  primary_slot_id: null, client_name: 'Sophie',
};
const VISIT_MERCHANT = { id: 'm1', loyalty_mode: 'visit', booking_earns_loyalty: true, stamps_required: 10, country: 'FR' };

describe('creditBookingLoyalty', () => {
  it('skips when the merchant option is off', async () => {
    const { admin, calls } = makeStub({ slot: ATTENDED_SLOT, merchant: { ...VISIT_MERCHANT, booking_earns_loyalty: false } });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('skipped');
    expect(calls.inserts).toHaveLength(0);
  });

  it('skips when the slot has no linked customer (walk-in)', async () => {
    const { admin } = makeStub({ slot: { ...ATTENDED_SLOT, customer_id: null }, merchant: VISIT_MERCHANT });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('skipped');
  });

  it('skips a filler slot (primary_slot_id set)', async () => {
    const { admin } = makeStub({ slot: { ...ATTENDED_SLOT, primary_slot_id: 'p1' }, merchant: VISIT_MERCHANT });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('skipped');
  });

  it('skips when the slot is not attended', async () => {
    const { admin } = makeStub({ slot: { ...ATTENDED_SLOT, attendance_status: 'no_show' }, merchant: VISIT_MERCHANT });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('skipped');
  });

  it('returns already when the slot was already credited', async () => {
    const { admin, calls } = makeStub({ slot: ATTENDED_SLOT, merchant: VISIT_MERCHANT, visitMaybe: { id: 'v-existing' } });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('already');
    expect(calls.inserts).toHaveLength(0);
  });

  it('skips (dedup) when the customer already has a confirmed visit that day', async () => {
    const { admin, calls } = makeStub({ slot: ATTENDED_SLOT, merchant: VISIT_MERCHANT, visitMaybe: null, sameDayCount: 1 });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('skipped');
    expect(calls.inserts.filter((c) => c.table === 'visits')).toHaveLength(0);
  });

  it('credits +1 stamp in visit mode', async () => {
    const { admin, calls } = makeStub({
      slot: ATTENDED_SLOT, merchant: VISIT_MERCHANT, visitMaybe: null, sameDayCount: 0,
      card: { id: 'card-1', current_stamps: 3, current_amount: 0 },
    });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('credited');
    const visitInsert = calls.inserts.find((c) => c.table === 'visits');
    expect(visitInsert?.payload).toMatchObject({ source: 'booking', planning_slot_id: 'slot-1', points_earned: 1, status: 'confirmed', amount_spent: null });
    const cardUpdate = calls.updates.find((c) => c.table === 'loyalty_cards');
    expect(cardUpdate?.payload.current_stamps).toBe(4);
    expect(cardUpdate?.payload).not.toHaveProperty('current_amount');
  });

  it('credits the service price in cagnotte mode', async () => {
    const { admin, calls } = makeStub({
      slot: ATTENDED_SLOT, merchant: { ...VISIT_MERCHANT, loyalty_mode: 'cagnotte' }, visitMaybe: null, sameDayCount: 0,
      card: { id: 'card-1', current_stamps: 2, current_amount: 100 },
    });
    expect(await creditBookingLoyalty(admin, 'slot-1')).toBe('credited');
    const visitInsert = calls.inserts.find((c) => c.table === 'visits');
    expect(visitInsert?.payload.amount_spent).toBe(45);
    const cardUpdate = calls.updates.find((c) => c.table === 'loyalty_cards');
    expect(cardUpdate?.payload.current_stamps).toBe(3);
    expect(cardUpdate?.payload.current_amount).toBe(145);
  });
});

describe('revokeBookingLoyalty', () => {
  it('is a no-op when the slot never credited a point', async () => {
    const { admin, calls } = makeStub({ visitMaybe: null });
    expect(await revokeBookingLoyalty(admin, 'slot-1')).toBe('none');
    expect(calls.deletes).toHaveLength(0);
  });

  it('decrements the card (floor 0) and deletes the visit', async () => {
    const { admin, calls } = makeStub({
      visitMaybe: { id: 'v1', loyalty_card_id: 'card-1', points_earned: 1, amount_spent: 45, status: 'confirmed' },
      card: { id: 'card-1', current_stamps: 4, current_amount: 145 },
    });
    expect(await revokeBookingLoyalty(admin, 'slot-1')).toBe('revoked');
    const cardUpdate = calls.updates.find((c) => c.table === 'loyalty_cards');
    expect(cardUpdate?.payload.current_stamps).toBe(3);
    expect(cardUpdate?.payload.current_amount).toBe(100);
    expect(calls.deletes.find((c) => c.table === 'visits')).toBeTruthy();
  });

  it('never drives the card below zero', async () => {
    const { admin, calls } = makeStub({
      visitMaybe: { id: 'v1', loyalty_card_id: 'card-1', points_earned: 1, amount_spent: 45, status: 'confirmed' },
      card: { id: 'card-1', current_stamps: 0, current_amount: 0 },
    });
    expect(await revokeBookingLoyalty(admin, 'slot-1')).toBe('revoked');
    const cardUpdate = calls.updates.find((c) => c.table === 'loyalty_cards');
    expect(cardUpdate?.payload.current_stamps).toBe(0);
    expect(cardUpdate?.payload.current_amount).toBe(0);
  });
});
