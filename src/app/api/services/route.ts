import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';
import { MAX_SERVICES_PER_MERCHANT } from '@/lib/plan-tiers';

const SERVICE_COLUMNS = 'id, name, price, position, category_id, duration, description, price_from';

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

// ── Helper: nombre de prestations ACTIVES (quota MAX_SERVICES_PER_MERCHANT) — les archivées ne comptent pas
async function countActiveServices(supabase: Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>, merchantId: string): Promise<number> {
  const { count } = await supabase
    .from('merchant_services')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .is('archived_at', null);
  return count || 0;
}

// ── GET: Fetch categories + services for a merchant (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const wantArchived = searchParams.get('archived') === '1';

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const supabase = await createRouteHandlerSupabaseClient();

    // Liste des archivées : données owner uniquement (le GET public ne renvoie que l'actif).
    if (wantArchived) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !await verifyOwnership(supabase, merchantId, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      const { data, error } = await supabase
        .from('merchant_services')
        .select(SERVICE_COLUMNS)
        .eq('merchant_id', merchantId)
        .not('archived_at', 'is', null)
        .order('position');
      if (error) {
        logger.error('Fetch archived services error:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
      }
      return NextResponse.json({ archivedServices: data || [] });
    }

    const [categoriesResult, servicesResult] = await Promise.all([
      supabase
        .from('merchant_service_categories')
        .select('id, name, position')
        .eq('merchant_id', merchantId)
        .order('position'),
      supabase
        .from('merchant_services')
        .select(SERVICE_COLUMNS)
        .eq('merchant_id', merchantId)
        .is('archived_at', null)
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

      const activeCount = await countActiveServices(supabase, merchant_id);
      if (activeCount >= MAX_SERVICES_PER_MERCHANT) {
        return NextResponse.json({ error: `Maximum ${MAX_SERVICES_PER_MERCHANT} prestations` }, { status: 400 });
      }

      const { data: service, error } = await supabase
        .from('merchant_services')
        .insert({
          merchant_id,
          category_id: category_id || null,
          name: name.trim(),
          price,
          position: activeCount + 1,
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

const reorderServiceSchema = z.object({
  type: z.literal('service_reorder'),
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  direction: z.enum(['up', 'down']),
});

const reactivateServiceSchema = z.object({
  type: z.literal('service_reactivate'),
  id: z.string().uuid(),
  merchant_id: z.string().uuid(),
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

    const reorderServiceParsed = reorderServiceSchema.safeParse(body);
    if (reorderServiceParsed.success) {
      const { id, merchant_id, direction } = reorderServiceParsed.data;

      if (!await verifyOwnership(supabase, merchant_id, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      const { data: current, error: fetchError } = await supabase
        .from('merchant_services')
        .select('id, position, category_id')
        .eq('id', id)
        .eq('merchant_id', merchant_id)
        .single();

      if (fetchError || !current) {
        return NextResponse.json({ error: 'Prestation introuvable' }, { status: 404 });
      }

      const isUp = direction === 'up';
      // Scope au même bucket visuel (même category_id, NULL inclus), sinon une presta
      // de A swap avec B et désorganise les groupes côté UI.
      const baseNeighborQuery = supabase
        .from('merchant_services')
        .select('id, position')
        .eq('merchant_id', merchant_id)
        .filter('position', isUp ? 'lt' : 'gt', current.position)
        .order('position', { ascending: !isUp })
        .limit(1);

      const scopedNeighborQuery = current.category_id === null
        ? baseNeighborQuery.is('category_id', null)
        : baseNeighborQuery.eq('category_id', current.category_id);

      const { data: neighbor } = await scopedNeighborQuery.maybeSingle();

      if (!neighbor) {
        return NextResponse.json({ ok: true, noop: true });
      }

      const [swap1, swap2] = await Promise.all([
        supabase.from('merchant_services').update({ position: neighbor.position }).eq('id', current.id).eq('merchant_id', merchant_id),
        supabase.from('merchant_services').update({ position: current.position }).eq('id', neighbor.id).eq('merchant_id', merchant_id),
      ]);
      if (swap1.error || swap2.error) {
        logger.error('Reorder service error:', swap1.error || swap2.error);
        return NextResponse.json({ error: 'Erreur lors de la réorganisation' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    // Réactivation d'une prestation archivée (la remet sur la vitrine, en fin de liste).
    const reactivateParsed = reactivateServiceSchema.safeParse(body);
    if (reactivateParsed.success) {
      const { id, merchant_id } = reactivateParsed.data;

      if (!await verifyOwnership(supabase, merchant_id, user.id)) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }

      if (await countActiveServices(supabase, merchant_id) >= MAX_SERVICES_PER_MERCHANT) {
        return NextResponse.json({ error: `Maximum ${MAX_SERVICES_PER_MERCHANT} prestations actives` }, { status: 400 });
      }

      // Position en fin de liste : MAX(position) actif + 1 (le count ne suffit pas si la
      // numérotation a des trous après reorders/suppressions → réactivée au milieu sinon).
      const { data: last } = await supabase
        .from('merchant_services')
        .select('position')
        .eq('merchant_id', merchant_id)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: service, error } = await supabase
        .from('merchant_services')
        .update({ archived_at: null, position: (last?.position ?? 0) + 1 })
        .eq('id', id)
        .eq('merchant_id', merchant_id)
        .not('archived_at', 'is', null)
        .select()
        .single();

      // .single() sur une presta non archivée / introuvable → pas une erreur serveur.
      if (error || !service) {
        return NextResponse.json({ error: 'Prestation introuvable ou déjà active' }, { status: 404 });
      }

      return NextResponse.json({ service });
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

    if (type === 'category') {
      const { error } = await supabase
        .from('merchant_service_categories')
        .delete()
        .eq('id', id)
        .eq('merchant_id', merchant_id);
      if (error) {
        logger.error('Delete category error:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Prestation : si elle est référencée par un RDV (lien junction OU colonne legacy),
    // on ARCHIVE (la ligne reste → les RDV gardent le nom). Sinon hard delete (ménage propre).
    // Comptage via le client admin pour ne pas dépendre des RLS de planning_slot_services.
    const admin = getSupabaseAdmin();
    const [{ count: junctionCount }, { count: legacyCount }] = await Promise.all([
      admin.from('planning_slot_services').select('slot_id', { count: 'exact', head: true }).eq('service_id', id),
      admin.from('merchant_planning_slots').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant_id).eq('service_id', id),
    ]);
    const isUsed = (junctionCount || 0) > 0 || (legacyCount || 0) > 0;

    if (isUsed) {
      const { error } = await supabase
        .from('merchant_services')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .eq('merchant_id', merchant_id);
      if (error) {
        logger.error('Archive service error:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
      }
      return NextResponse.json({ success: true, archived: true });
    }

    const { error } = await supabase
      .from('merchant_services')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchant_id);
    if (error) {
      logger.error('Delete service error:', error);
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
    }
    return NextResponse.json({ success: true, archived: false });
  } catch (error) {
    logger.error('Services DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
