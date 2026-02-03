import { vi } from 'vitest';

// In-memory database for tests
export const testDb = {
  merchants: [] as any[],
  customers: [] as any[],
  loyalty_cards: [] as any[],
  visits: [] as any[],
  redemptions: [] as any[],
  banned_numbers: [] as any[],
};

// Reset test database
export function resetTestDb() {
  testDb.merchants = [];
  testDb.customers = [];
  testDb.loyalty_cards = [];
  testDb.visits = [];
  testDb.redemptions = [];
  testDb.banned_numbers = [];
}

// Helper to generate UUIDs
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create test data helpers
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
    created_at: new Date().toISOString(),
    ...overrides,
  };
  testDb.loyalty_cards.push(card);
  return card;
}

// Parse relation joins like "merchant:merchants(*)"
function parseRelations(selectFields: string): Array<{ alias: string; table: string }> {
  const relations: Array<{ alias: string; table: string }> = [];
  const relationPattern = /(\w+):(\w+)\(\*\)/g;
  let match;
  while ((match = relationPattern.exec(selectFields)) !== null) {
    relations.push({ alias: match[1], table: match[2] });
  }
  return relations;
}

// Mock Supabase query builder
function createQueryBuilder(table: keyof typeof testDb) {
  let data = [...testDb[table]];
  let filters: Array<{ field: string; op: string; value: any }> = [];
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
    in(field: string, values: any[]) {
      filters.push({ field, op: 'in', value: values });
      return builder;
    },
    gte(field: string, value: any) {
      filters.push({ field, op: 'gte', value });
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

    gt(field: string, value: any) {
      filters.push({ field, op: 'gt', value });
      return builder;
    },

    // Execute the query
    then(resolve: (result: any) => void) {
      let result = [...testDb[table]];

      // Apply filters
      for (const filter of filters) {
        result = result.filter((item) => {
          if (filter.op === 'eq') return item[filter.field] === filter.value;
          if (filter.op === 'in') return filter.value.includes(item[filter.field]);
          if (filter.op === 'gte') return new Date(item[filter.field]) >= new Date(filter.value);
          if (filter.op === 'gt') return new Date(item[filter.field]) > new Date(filter.value);
          return true;
        });
      }

      // Apply relations (joins)
      if (relations.length > 0) {
        result = result.map((item) => {
          const itemWithRelations = { ...item };
          for (const rel of relations) {
            const relatedTable = testDb[rel.table as keyof typeof testDb];
            if (relatedTable) {
              // Find the related item by matching the foreign key
              const foreignKey = `${rel.alias}_id`;
              const relatedItem = relatedTable.find((r: any) => r.id === item[foreignKey]);
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
        resolve({ data: result, error: null });
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

// Mock Supabase client
export const mockSupabaseAdmin = {
  from: (table: string) => createQueryBuilder(table as keyof typeof testDb),
};

// Mock the getSupabaseAdmin function
vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => mockSupabaseAdmin,
  supabase: mockSupabaseAdmin,
}));
