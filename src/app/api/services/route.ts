import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

// ── Helper: verify merchant ownership
async function verifyOwnership(supabase: Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>, merchantId: string, userId: string) {
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// ── GET: Fetch categories + services for a merchant (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const supabase = await createRouteHandlerSupabaseClient();

    const [categoriesResult, servicesResult] = await Promise.all([
      supabase
        .from('merchant_service_categories')
        .select('id, name, position')
        .eq('merchant_id', merchantId)
        .order('position'),
      supabase
        .from('merchant_services')
        .select('id, name, price, position, category_id, duration, description, price_from')
        .eq('merchant_id', merchantId)
        .order('position'),
    ]);

    if (categoriesResult.error || servicesResult.error) {
      logger.error('Fetch services error:', categoriesResult.error || servicesResult.error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      categories: categoriesResult.data || [],
      services: servicesResult.data || [],
    });
  } catch (error) {
    logger.error('Services GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── POST: Create a category or service
const createServiceSchema = z.object({
  type: z.literal('service'),
  merchant_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100),
  price: z.number().min(0).max(99999),
  duration: z.number().int().min(1).max(600).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  price_from: z.boolean().optional(),
});

const createCategorySchema = z.object({
  type: z.literal('category'),
  merchant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();

    // Try category first
    const categoryParsed = createCategorySchema.safeParse(body);
    if (categoryParsed.success) {
      const { merchant_id, name } = categoryParsed.data;

      if (!await verifyOwnership(supabase, merchant_id, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      const { count } = await supabase
        .from('merchant_service_categories')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant_id);

      if ((count || 0) >= 10) {
        return NextResponse.json({ error: 'Maximum 10 catégories' }, { status: 400 });
      }

      const { data: category, error } = await supabase
        .from('merchant_service_categories')
        .insert({ merchant_id, name: name.trim(), position: (count || 0) + 1 })
        .select()
        .single();

      if (error) {
        logger.error('Create category error:', error);
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
      }

      return NextResponse.json({ category });
    }

    // Try service
    const serviceParsed = createServiceSchema.safeParse(body);
    if (serviceParsed.success) {
      const { merchant_id, name, price, category_id, duration, description, price_from } = serviceParsed.data;

      if (!await verifyOwnership(supabase, merchant_id, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      const { count } = await supabase
        .from('merchant_services')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant_id);

      if ((count || 0) >= 50) {
        return NextResponse.json({ error: 'Maximum 50 prestations' }, { status: 400 });
      }

      const { data: service, error } = await supabase
        .from('merchant_services')
        .insert({
          merchant_id,
          category_id: category_id || null,
          name: name.trim(),
          price,
          position: (count || 0) + 1,
          duration: duration || null,
          description: description?.trim() || null,
          price_from: price_from || false,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create service error:', error);
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
      }

      return NextResponse.json({ service });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  } catch (error) {
    logger.error('Services POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── PUT: Update a service or category
const updateServiceSchema = z.object({
  type: z.literal('service'),
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100),
  price: z.number().min(0).max(99999),
  duration: z.number().int().min(1).max(600).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  price_from: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  type: z.literal('category'),
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

const reorderCategorySchema = z.object({
  type: z.literal('category_reorder'),
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  direction: z.enum(['up', 'down']),
});

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();

    const reorderParsed = reorderCategorySchema.safeParse(body);
    if (reorderParsed.success) {
      const { id, merchant_id, direction } = reorderParsed.data;

      if (!await verifyOwnership(supabase, merchant_id, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      const { data: current, error: fetchError } = await supabase
        .from('merchant_service_categories')
        .select('id, position')
        .eq('id', id)
        .eq('merchant_id', merchant_id)
        .single();

      if (fetchError || !current) {
        return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
      }

      const isUp = direction === 'up';
      const { data: neighbor } = await supabase
        .from('merchant_service_categories')
        .select('id, position')
        .eq('merchant_id', merchant_id)
        .filter('position', isUp ? 'lt' : 'gt', current.position)
        .order('position', { ascending: !isUp })
        .limit(1)
        .maybeSingle();

      if (!neighbor) {
        return NextResponse.json({ ok: true, noop: true });
      }

      const [swap1, swap2] = await Promise.all([
        supabase.from('merchant_service_categories').update({ position: neighbor.position }).eq('id', current.id).eq('merchant_id', merchant_id),
        supabase.from('merchant_service_categories').update({ position: current.position }).eq('id', neighbor.id).eq('merchant_id', merchant_id),
      ]);
      if (swap1.error || swap2.error) {
        logger.error('Reorder category error:', swap1.error || swap2.error);
        return NextResponse.json({ error: 'Erreur lors de la réorganisation' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    const categoryParsed = updateCategorySchema.safeParse(body);
    if (categoryParsed.success) {
      const { id, merchant_id, name } = categoryParsed.data;

      if (!await verifyOwnership(supabase, merchant_id, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      const { data: category, error } = await supabase
        .from('merchant_service_categories')
        .update({ name: name.trim() })
        .eq('id', id)
        .eq('merchant_id', merchant_id)
        .select()
        .single();

      if (error) {
        logger.error('Update category error:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
      }

      return NextResponse.json({ category });
    }

    const serviceParsed = updateServiceSchema.safeParse(body);
    if (serviceParsed.success) {
      const { id, merchant_id, name, price, category_id, duration, description, price_from } = serviceParsed.data;

      if (!await verifyOwnership(supabase, merchant_id, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      const updateData: Record<string, unknown> = { name: name.trim(), price };
      if (category_id !== undefined) {
        updateData.category_id = category_id;
      }
      if (duration !== undefined) {
        updateData.duration = duration;
      }
      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }
      if (price_from !== undefined) {
        updateData.price_from = price_from;
      }

      const { data: service, error } = await supabase
        .from('merchant_services')
        .update(updateData)
        .eq('id', id)
        .eq('merchant_id', merchant_id)
        .select()
        .single();

      if (error) {
        logger.error('Update service error:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
      }

      return NextResponse.json({ service });
    }

    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  } catch (error) {
    logger.error('Services PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ── DELETE: Remove a service or category
const deleteSchema = z.object({
  type: z.enum(['service', 'category']),
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { type, id, merchant_id } = parsed.data;

    if (!await verifyOwnership(supabase, merchant_id, user.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const table = type === 'category' ? 'merchant_service_categories' : 'merchant_services';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchant_id);

    if (error) {
      logger.error(`Delete ${type} error:`, error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Services DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
