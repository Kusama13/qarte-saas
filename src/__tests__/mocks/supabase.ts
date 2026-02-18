import { vi } from 'vitest';

// In-memory database for tests
export const testDb = {
  merchants: [] as any[],
  customers: [] as any[],
  loyalty_cards: [] as any[],
  visits: [] as any[],
  redemptions: [] as any[],
  banned_numbers: [] as any[],
  point_adjustments: [] as any[],
  vouchers: [] as any[],
  referrals: [] as any[],
  member_programs: [] as any[],
  member_cards: [] as any[],
  push_subscriptions: [] as any[],
  scheduled_push: [] as any[],
  offers: [] as any[],
  push_history: [] as any[],
  contact_messages: [] as any[],
};

// Reset test database
export function resetTestDb() {
  for (const key of Object.keys(testDb) as (keyof typeof testDb)[]) {
    testDb[key] = [];
  }
}

// Helper to generate UUIDs
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Create test data helpers ───────────────────────────────────────

export function createTestMerchant(overrides: Partial<any> = {}) {
  const merchant = {
    id: generateUUID(),
    user_id: generateUUID(),
    shop_name: 'Test Shop',
    scan_code: 'TEST123',
    stamps_required: 10,
    reward_description: 'Free coffee',
    loyalty_mode: 'visit',
    primary_color: '#000000',
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_status: 'trialing',
    shield_enabled: true,
    tier2_enabled: false,
    referral_program_enabled: false,
    referral_reward_referred: null,
    referral_reward_referrer: null,
    country: 'FR',
    ...overrides,
  };
  testDb.merchants.push(merchant);
  return merchant;
}

export function createTestCustomer(overrides: Partial<any> = {}) {
  const customer = {
    id: generateUUID(),
    phone_number: '0612345678',
    first_name: 'Test',
    last_name: 'User',
    merchant_id: overrides.merchant_id || generateUUID(),
    birth_month: null,
    birth_day: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.customers.push(customer);
  return customer;
}

export function createTestLoyaltyCard(overrides: Partial<any> = {}) {
  const card = {
    id: generateUUID(),
    customer_id: overrides.customer_id || generateUUID(),
    merchant_id: overrides.merchant_id || generateUUID(),
    current_stamps: 0,
    stamps_target: 10,
    last_visit_date: null,
    referral_code: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.loyalty_cards.push(card);
  return card;
}

export function createTestVoucher(overrides: Partial<any> = {}) {
  const voucher = {
    id: generateUUID(),
    loyalty_card_id: overrides.loyalty_card_id || generateUUID(),
    merchant_id: overrides.merchant_id || generateUUID(),
    customer_id: overrides.customer_id || generateUUID(),
    reward_description: 'Free item',
    is_used: false,
    used_at: null,
    expires_at: null,
    source: 'referral',
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.vouchers.push(voucher);
  return voucher;
}

export function createTestReferral(overrides: Partial<any> = {}) {
  const referral = {
    id: generateUUID(),
    merchant_id: overrides.merchant_id || generateUUID(),
    referrer_customer_id: overrides.referrer_customer_id || generateUUID(),
    referrer_card_id: overrides.referrer_card_id || generateUUID(),
    referred_customer_id: overrides.referred_customer_id || generateUUID(),
    referred_card_id: overrides.referred_card_id || generateUUID(),
    referred_voucher_id: overrides.referred_voucher_id || generateUUID(),
    referrer_voucher_id: null,
    status: 'pending',
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.referrals.push(referral);
  return referral;
}

export function createTestMemberProgram(overrides: Partial<any> = {}) {
  const program = {
    id: generateUUID(),
    merchant_id: overrides.merchant_id || generateUUID(),
    name: 'Programme VIP',
    description: 'Programme de fidélité VIP',
    duration_months: 12,
    price: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.member_programs.push(program);
  return program;
}

export function createTestMemberCard(overrides: Partial<any> = {}) {
  const card = {
    id: generateUUID(),
    program_id: overrides.program_id || generateUUID(),
    customer_id: overrides.customer_id || generateUUID(),
    merchant_id: overrides.merchant_id || generateUUID(),
    valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.member_cards.push(card);
  return card;
}

export function createTestOffer(overrides: Partial<any> = {}) {
  const offer = {
    id: generateUUID(),
    merchant_id: overrides.merchant_id || generateUUID(),
    title: 'Offre spéciale',
    description: '-20% sur tout',
    is_active: true,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.offers.push(offer);
  return offer;
}

export function createTestPushSubscription(overrides: Partial<any> = {}) {
  const sub = {
    id: generateUUID(),
    customer_id: overrides.customer_id || generateUUID(),
    endpoint: `https://push.example.com/${generateUUID()}`,
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.push_subscriptions.push(sub);
  return sub;
}

// ─── Parse relation joins ───────────────────────────────────────────

function parseRelations(selectFields: string): Array<{ alias: string; table: string }> {
  const relations: Array<{ alias: string; table: string }> = [];
  const seen = new Set<string>();
  let match;

  // Pattern 1: alias:table(...) or alias:table!inner(...)
  // e.g. "customer:customers (*)" or "program:member_programs!inner (merchant_id)"
  const aliasedPattern = /(\w+):(\w+)(?:!inner)?\s*\([^)]*\)/g;
  while ((match = aliasedPattern.exec(selectFields)) !== null) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      relations.push({ alias: match[1], table: match[2] });
    }
  }

  // Pattern 2: table!inner(...) without alias
  // e.g. "merchants!inner(user_id)"
  const innerPattern = /(?<![:\w])(\w+)!inner\s*\([^)]*\)/g;
  while ((match = innerPattern.exec(selectFields)) !== null) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      relations.push({ alias: match[1], table: match[1] });
    }
  }

  return relations;
}

// ─── Mock Supabase query builder ────────────────────────────────────

function createQueryBuilder(table: keyof typeof testDb) {
  const filters: Array<{ field: string; op: string; value: any }> = [];
  let selectFields = '*';
  let isSingle = false;
  let isMaybeSingle = false;
  let isCount = false;
  let isHead = false;
  let insertData: any = null;
  let updateData: any = null;
  let isDelete = false;
  let relations: Array<{ alias: string; table: string }> = [];

  const builder: any = {
    select(fields: string = '*', options?: { count?: string; head?: boolean }) {
      selectFields = fields;
      relations = parseRelations(fields);
      if (options?.count === 'exact') isCount = true;
      if (options?.head) isHead = true;
      return builder;
    },
    eq(field: string, value: any) {
      filters.push({ field, op: 'eq', value });
      return builder;
    },
    neq(field: string, value: any) {
      filters.push({ field, op: 'neq', value });
      return builder;
    },
    in(field: string, values: any[]) {
      filters.push({ field, op: 'in', value: values });
      return builder;
    },
    gte(field: string, value: any) {
      filters.push({ field, op: 'gte', value });
      return builder;
    },
    gt(field: string, value: any) {
      filters.push({ field, op: 'gt', value });
      return builder;
    },
    lte(field: string, value: any) {
      filters.push({ field, op: 'lte', value });
      return builder;
    },
    lt(field: string, value: any) {
      filters.push({ field, op: 'lt', value });
      return builder;
    },
    is(field: string, value: any) {
      filters.push({ field, op: 'is', value });
      return builder;
    },
    not(field: string, op: string, value: any) {
      filters.push({ field, op: `not_${op}`, value });
      return builder;
    },
    single() {
      isSingle = true;
      return builder;
    },
    maybeSingle() {
      isMaybeSingle = true;
      return builder;
    },
    insert(newData: any) {
      insertData = newData;
      return builder;
    },
    update(newData: any) {
      updateData = newData;
      return builder;
    },
    delete() {
      isDelete = true;
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },

    // Execute the query
    then(resolve: (result: any) => void) {
      let result = [...(testDb[table] || [])];

      // Helper: resolve a possibly-dotted field value on an item.
      // For "program.merchant_id", look up the related table via
      // the relation alias "program" and return the field from the related row.
      function resolveField(item: any, field: string): any {
        if (!field.includes('.')) return item[field];
        const [relAlias, relField] = field.split('.');
        // Find the matching relation declared in the select
        const rel = relations.find((r) => r.alias === relAlias);
        if (rel) {
          const relatedTable = testDb[rel.table as keyof typeof testDb];
          if (relatedTable) {
            const fk = `${relAlias}_id`;
            const singularFk = relAlias.endsWith('s') ? `${relAlias.slice(0, -1)}_id` : fk;
            const fkValue = item[fk] ?? item[singularFk];
            const related = relatedTable.find((r: any) => r.id === fkValue);
            return related ? related[relField] : undefined;
          }
        }
        return undefined;
      }

      // Apply filters
      for (const filter of filters) {
        result = result.filter((item) => {
          const fieldValue = resolveField(item, filter.field);
          switch (filter.op) {
            case 'eq': return fieldValue === filter.value;
            case 'neq': return fieldValue !== filter.value;
            case 'in': return filter.value.includes(fieldValue);
            case 'gte': return new Date(fieldValue) >= new Date(filter.value);
            case 'gt': return new Date(fieldValue) > new Date(filter.value);
            case 'lte': return new Date(fieldValue) <= new Date(filter.value);
            case 'lt': return new Date(fieldValue) < new Date(filter.value);
            case 'is': return fieldValue === filter.value;
            case 'not_eq': return fieldValue !== filter.value;
            case 'not_is': return fieldValue !== filter.value;
            default: return true;
          }
        });
      }

      // Apply relations (joins)
      if (relations.length > 0) {
        result = result.map((item) => {
          const itemWithRelations = { ...item };
          for (const rel of relations) {
            const relatedTable = testDb[rel.table as keyof typeof testDb];
            if (relatedTable) {
              const foreignKey = `${rel.alias}_id`;
              // Also try singular form (e.g., "customers" -> "customer_id")
              const singularForeignKey = rel.alias.endsWith('s') ? `${rel.alias.slice(0, -1)}_id` : foreignKey;
              const fkValue = item[foreignKey] ?? item[singularForeignKey];
              const relatedItem = relatedTable.find((r: any) => r.id === fkValue);
              itemWithRelations[rel.alias] = relatedItem || null;
            }
          }
          return itemWithRelations;
        });
      }

      // Handle insert
      if (insertData) {
        const newItem = { id: generateUUID(), ...insertData, created_at: new Date().toISOString() };
        testDb[table].push(newItem);
        resolve({ data: newItem, error: null });
        return;
      }

      // Handle update
      if (updateData) {
        result.forEach((item) => {
          Object.assign(item, updateData);
        });
        if (isSingle) {
          if (result.length === 0) {
            resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });
          } else {
            resolve({ data: result[0], error: null });
          }
        } else if (isMaybeSingle) {
          resolve({ data: result[0] || null, error: null });
        } else {
          resolve({ data: result, error: null });
        }
        return;
      }

      // Handle delete
      if (isDelete) {
        testDb[table] = testDb[table].filter(
          (item) => !result.some((r) => r.id === item.id)
        );
        resolve({ data: null, error: null });
        return;
      }

      // Handle count
      if (isCount) {
        resolve({ count: result.length, data: isHead ? null : result, error: null });
        return;
      }

      // Handle single
      if (isSingle) {
        if (result.length === 0) {
          resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' } });
        } else if (result.length > 1) {
          resolve({ data: null, error: { code: 'PGRST116', message: 'Multiple rows found' } });
        } else {
          resolve({ data: result[0], error: null });
        }
        return;
      }

      // Handle maybeSingle
      if (isMaybeSingle) {
        resolve({ data: result[0] || null, error: null });
        return;
      }

      resolve({ data: result, error: null });
    },
  };

  return builder;
}

// ─── Mock auth token store ──────────────────────────────────────────

let mockAuthTokenUsers: Record<string, { id: string; email?: string; user_metadata?: any }> = {};

export function setMockAuthToken(token: string, user: { id: string; email?: string; user_metadata?: any }) {
  mockAuthTokenUsers[token] = user;
}

export function clearMockAuthTokens() {
  mockAuthTokenUsers = {};
}

// ─── Mock Supabase admin client ─────────────────────────────────────

export const mockSupabaseAdmin: any = {
  from: (table: string) => createQueryBuilder(table as keyof typeof testDb),
  auth: {
    getUser: async (token?: string) => {
      if (token && mockAuthTokenUsers[token]) {
        return { data: { user: mockAuthTokenUsers[token] }, error: null };
      }
      return { data: { user: null }, error: { message: 'Invalid token' } };
    },
    admin: {
      getUserById: async (userId: string) => {
        return { data: { user: { id: userId, email: `${userId}@test.com`, user_metadata: {} } }, error: null };
      },
      updateUserById: async (userId: string, updates: any) => {
        return { data: { user: { id: userId, ...updates } }, error: null };
      },
    },
  },
};

// ─── Mock authenticated user for route handler client ───────────────

let mockAuthUser: { id: string; email?: string } | null = null;

export function setMockAuthUser(user: { id: string; email?: string } | null) {
  mockAuthUser = user;
}

export const mockSupabaseWithAuth: any = {
  from: (table: string) => createQueryBuilder(table as keyof typeof testDb),
  auth: {
    getUser: async () => {
      if (!mockAuthUser) {
        return { data: { user: null }, error: { message: 'Not authenticated' } };
      }
      return { data: { user: mockAuthUser }, error: null };
    },
    admin: {
      getUserById: async (userId: string) => {
        return { data: { user: { id: userId, email: `${userId}@test.com` } }, error: null };
      },
    },
  },
};

// ─── Mock the modules ───────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => mockSupabaseAdmin,
  createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
  createServerClient: () => mockSupabaseAdmin,
  supabase: mockSupabaseAdmin,
}));
