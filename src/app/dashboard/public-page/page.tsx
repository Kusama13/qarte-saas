'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Camera,
  Plus,
  Trash2,
  Loader2,
  X,
  Euro,
  Pencil,
  MapPin,
  CalendarDays,
  ChevronRight,
  LayoutList,
  Tag,
  GripVertical,
} from 'lucide-react';
import { Input } from '@/components/ui';
import { getSupabase } from '@/lib/supabase';
import { useMerchant } from '@/contexts/MerchantContext';
import { compressOfferImage } from '@/lib/image-compression';

interface ServiceCategory {
  id: string;
  name: string;
  position: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  position: number;
  category_id: string | null;
}

export default function PublicPageDashboard() {
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
  const supabase = getSupabase();

  // Help modal
  const [showHelp, setShowHelp] = useState(false);
  // Link copy
  const [copied, setCopied] = useState(false);

  // Shop name + Address + booking
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [savedInfo, setSavedInfo] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; position: number }>>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);

  // Welcome offer
  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeDescription, setWelcomeDescription] = useState('');
  const [showWelcomeHelp, setShowWelcomeHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Categories + Services
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Add service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategoryId, setNewServiceCategoryId] = useState<string | null>(null);
  const [addingService, setAddingService] = useState(false);

  // Add category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Edit service
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Edit category
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (merchantLoading || !merchant) return;

    setWelcomeEnabled(merchant.welcome_offer_enabled || false);
    setWelcomeDescription(merchant.welcome_offer_description || '');
    setShopName(merchant.shop_name || '');
    setAddress(merchant.shop_address || '');
    setBookingUrl(merchant.booking_url || '');

    const fetchPhotos = async () => {
      const { data } = await supabase
        .from('merchant_photos')
        .select('id, url, position')
        .eq('merchant_id', merchant.id)
        .order('position');
      if (data) setPhotos(data);
    };

    const fetchServices = async () => {
      try {
        const res = await fetch(`/api/services?merchantId=${merchant.id}`);
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories || []);
          setServices(data.services || []);
        }
      } catch {
        // silent
      } finally {
        setServicesLoading(false);
      }
    };

    fetchPhotos();
    fetchServices();
  }, [merchant, merchantLoading, supabase]);

  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = { uncategorized: [] };
    for (const cat of categories) {
      grouped[cat.id] = [];
    }
    for (const svc of services) {
      if (svc.category_id && grouped[svc.category_id]) {
        grouped[svc.category_id].push(svc);
      } else {
        grouped.uncategorized.push(svc);
      }
    }
    return grouped;
  }, [categories, services]);

  const pageUrl = merchant?.slug ? `https://getqarte.com/p/${merchant.slug}` : '';

  const handleCopy = () => {
    if (!pageUrl) return;
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Save address + booking ──
  const handleSaveInfo = async () => {
    if (!merchant) return;
    setSavingInfo(true);
    try {
      const normalizedUrl = bookingUrl.trim()
        ? (/^https?:\/\//i.test(bookingUrl.trim()) ? bookingUrl.trim() : `https://${bookingUrl.trim()}`)
        : null;

      const { error } = await supabase
        .from('merchants')
        .update({
          shop_name: shopName.trim() || null,
          shop_address: address.trim() || null,
          booking_url: normalizedUrl,
        })
        .eq('id', merchant.id);

      if (!error) {
        await refetch();
        setSavedInfo(true);
        setTimeout(() => setSavedInfo(false), 3000);
      }
    } catch {
      // silent
    } finally {
      setSavingInfo(false);
    }
  };

  // ── Photos handlers ──
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !merchant) return;

    const takenPositions = new Set(photos.map(p => p.position));
    const availablePositions = [1, 2, 3, 4, 5, 6].filter(p => !takenPositions.has(p));
    const filesToUpload = Array.from(files).slice(0, availablePositions.length);

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const position = availablePositions[i];
      setUploadingPhoto(position);
      try {
        const compressed = await compressOfferImage(file);
        const formData = new FormData();
        formData.append('file', compressed);
        formData.append('merchantId', merchant.id);
        formData.append('position', String(position));

        const res = await fetch('/api/photos', { method: 'POST', body: formData });
        const result = await res.json();
        if (res.ok && result.photo) {
          setPhotos(prev => [...prev.filter(p => p.position !== position), result.photo].sort((a, b) => a.position - b.position));
        }
      } catch (error) {
        console.error('Photo upload error:', error);
      }
    }
    setUploadingPhoto(null);
    e.target.value = '';
  };

  const handlePhotoDelete = async (photoId: string) => {
    if (!merchant) return;
    try {
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, merchantId: merchant.id }),
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      }
    } catch (error) {
      console.error('Photo delete error:', error);
    }
  };

  // ── Welcome offer save ──
  const handleSaveWelcome = async () => {
    if (!merchant) return;
    if (welcomeEnabled && !welcomeDescription.trim()) return;

    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/merchants/referral-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchant.id,
          referral_program_enabled: merchant.referral_program_enabled,
          referral_reward_referrer: merchant.referral_reward_referrer,
          referral_reward_referred: merchant.referral_reward_referred,
          welcome_offer_enabled: welcomeEnabled,
          welcome_offer_description: welcomeEnabled ? welcomeDescription.trim() : null,
        }),
      });

      if (!res.ok) {
        setSaveError('Erreur lors de la sauvegarde');
        return;
      }

      await refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  // ── Category handlers ──
  const handleAddCategory = async () => {
    if (!merchant || !newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          merchant_id: merchant.id,
          name: newCategoryName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        setCategories(prev => [...prev, data.category]);
        setNewCategoryName('');
        setShowAddCategory(false);
      }
    } catch {
      // silent
    } finally {
      setAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!merchant || !editCategoryName.trim()) return;
    try {
      const res = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          id,
          merchant_id: merchant.id,
          name: editCategoryName.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        setCategories(prev => prev.map(c => c.id === id ? data.category : c));
        setEditingCategory(null);
      }
    } catch {
      // silent
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!merchant) return;
    try {
      const res = await fetch('/api/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', id, merchant_id: merchant.id }),
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id));
        setServices(prev => prev.map(s => s.category_id === id ? { ...s, category_id: null } : s));
      }
    } catch {
      // silent
    }
  };

  // ── Service handlers ──
  const handleAddService = async () => {
    if (!merchant || !newServiceName.trim() || !newServicePrice) return;
    const price = parseFloat(newServicePrice);
    if (isNaN(price) || price < 0) return;

    setAddingService(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'service',
          merchant_id: merchant.id,
          category_id: newServiceCategoryId,
          name: newServiceName.trim(),
          price,
        }),
      });
      const data = await res.json();
      if (res.ok && data.service) {
        setServices(prev => [...prev, data.service]);
        setNewServiceName('');
        setNewServicePrice('');
      }
    } catch {
      // silent
    } finally {
      setAddingService(false);
    }
  };

  const handleUpdateService = async (id: string) => {
    if (!merchant || !editName.trim() || !editPrice) return;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) return;

    try {
      const res = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'service',
          id,
          merchant_id: merchant.id,
          name: editName.trim(),
          price,
        }),
      });
      const data = await res.json();
      if (res.ok && data.service) {
        setServices(prev => prev.map(s => s.id === id ? data.service : s));
        setEditingService(null);
      }
    } catch {
      // silent
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!merchant) return;
    try {
      const res = await fetch('/api/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'service', id, merchant_id: merchant.id }),
      });
      if (res.ok) {
        setServices(prev => prev.filter(s => s.id !== id));
      }
    } catch {
      // silent
    }
  };

  const toggleCategoryCollapse = (id: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Render service row ──
  const renderServiceRow = (service: Service) => (
    <div key={service.id} className="group flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-gray-50/80 transition-colors">
      {editingService === service.id ? (
        <>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            placeholder="Nom"
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateService(service.id)}
            autoFocus
          />
          <div className="relative w-24">
            <input
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              className="w-full text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateService(service.id)}
            />
            <Euro className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
          <button onClick={() => handleUpdateService(service.id)} className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEditingService(null)} className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-700 truncate">{service.name}</p>
          </div>
          <p className="text-[13px] font-bold text-gray-900 shrink-0 tabular-nums">
            {Number(service.price).toFixed(2).replace('.', ',')} &euro;
          </p>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setEditingService(service.id);
                setEditName(service.name);
                setEditPrice(String(service.price));
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => handleDeleteService(service.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (merchantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 p-6 rounded-2xl bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-7 h-7 text-violet-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                Ma Page
              </h1>
              <p className="mt-1 text-sm text-gray-500 font-medium">
                Personnalise ta page publique visible par tes futurs clients
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-200 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Attire de nouveaux clients</h3>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Ta page publique est ta vitrine en ligne. Plus elle est soign&eacute;e, plus elle attire de nouveaux clients.
            </p>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">1</span>
                <p>Remplis <span className="font-semibold text-gray-900">chaque section</span> avec soin : nom, adresse, photos, prestations.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">2</span>
                <p>Active l&apos;<span className="font-semibold text-gray-900">offre de bienvenue</span> pour donner une raison de venir.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">3</span>
                <p>Partage le <span className="font-semibold text-gray-900">lien de ta page</span> sur tes r&eacute;seaux et en bio Instagram.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
                <p>Ta page <span className="font-semibold text-gray-900">remonte sur Google</span> et attire des clients, m&ecirc;me quand tu ne fais rien.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      {/* ── LIEN PAGE PUBLIQUE ── */}
      {merchant?.slug && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Lien de ta page</h2>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 truncate">
              getqarte.com/p/{merchant.slug}
            </div>
            <button
              onClick={handleCopy}
              className={`shrink-0 px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                copied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <a
              href={`/p/${merchant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-3 rounded-xl font-semibold text-sm bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Voir
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-2.5">
            Partage ce lien sur tes réseaux sociaux, ta bio Instagram, ou en lien de réservation
          </p>
        </div>
      )}

      {/* ── INFOS PRATIQUES ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Infos pratiques</h2>
            <p className="text-xs text-gray-400">Visibles sur ta page publique</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nom du salon</label>
            <Input
              placeholder="Mon Salon, Chez Marie..."
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="h-11"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Adresse</label>
            <Input
              placeholder="12 rue de la Paix, 75002 Paris"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1.5 block flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              Lien de réservation
            </label>
            <Input
              placeholder="https://calendly.com/monsalon ou lien Planity, Treatwell..."
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-gray-400 mt-1">Si rempli, un bouton &quot;Prendre rendez-vous&quot; apparaîtra sur ta page</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveInfo}
            disabled={savingInfo}
            className={`px-5 py-2.5 font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 text-sm ${
              savedInfo ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savedInfo ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* ── OFFRE DE BIENVENUE ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Offre de bienvenue</h2>
          </div>
          <button
            onClick={() => setShowWelcomeHelp(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Comment ca marche ?
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Activer l&apos;offre de bienvenue</p>
            <p className="text-xs text-gray-500 mt-0.5">Les nouveaux visiteurs verront l&apos;offre sur ta page publique</p>
          </div>
          <button
            role="switch"
            aria-checked={welcomeEnabled}
            onClick={() => setWelcomeEnabled(!welcomeEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
              welcomeEnabled ? 'bg-violet-600' : 'bg-gray-200'
            }`}
          >
            <span className={`pointer-events-none absolute top-[2px] left-[2px] h-6 w-6 rounded-full bg-white shadow-md transition-transform ${welcomeEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {welcomeEnabled && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Description de l&apos;offre <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="Ex: -20% sur votre premiere visite"
                value={welcomeDescription}
                onChange={(e) => setWelcomeDescription(e.target.value)}
                className="h-11"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['-10% sur la 1ere visite', '-20% sur la 1ere visite', 'Un soin offert'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setWelcomeDescription(s)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{saveError}</div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveWelcome}
            disabled={saving || (welcomeEnabled && !welcomeDescription.trim())}
            className={`px-5 py-2.5 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm ${
              saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* ── PHOTOS ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
            <Camera className="w-4 h-4 text-pink-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Mes réalisations</h2>
            <p className="text-xs text-gray-400">6 photos max — visibles sur ta page publique</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((position) => {
            const photo = photos.find(p => p.position === position);
            const isUploading = uploadingPhoto === position;
            return (
              <div key={position} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group">
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                  </div>
                ) : photo ? (
                  <>
                    <img src={photo.url} alt={`Réalisation ${position}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button
                      type="button"
                      onClick={() => handlePhotoDelete(photo.id)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-indigo-300 transition-colors">
                    <Plus className="w-5 h-5 text-gray-300" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PRESTATIONS ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <LayoutList className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Tarifs et prestations</h2>
              <p className="text-xs text-gray-400">
                {services.length > 0
                  ? `${services.length} prestation${services.length > 1 ? 's' : ''}${categories.length > 0 ? ` · ${categories.length} catégorie${categories.length > 1 ? 's' : ''}` : ''}`
                  : 'Affiche tes services sur ta page publique'
                }
              </p>
            </div>
          </div>
          {!showAddCategory && categories.length < 10 && (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 hover:border-indigo-200 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter une catégorie
            </button>
          )}
        </div>

        <div className="p-6 pt-4">
          {servicesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : (
            <>
              {/* Add category inline */}
              {showAddCategory && (
                <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <Tag className="w-4 h-4 text-indigo-500 shrink-0" />
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la catégorie (ex: Coupes, Soins, Coloration...)"
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    autoFocus
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategoryName.trim()}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
                  </button>
                  <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className="p-2 rounded-lg text-gray-400 hover:bg-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Categories with their services */}
              <div className="space-y-4">
                {categories.map((cat) => {
                  const catServices = servicesByCategory[cat.id] || [];
                  const isCollapsed = collapsedCategories.has(cat.id);
                  return (
                    <div key={cat.id}>
                      {/* Category header */}
                      <div className="flex items-center gap-2.5 mb-2 group/cat">
                        <button onClick={() => toggleCategoryCollapse(cat.id)} className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors">
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
                        </button>
                        {editingCategory === cat.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              className="flex-1 text-sm font-semibold bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                              autoFocus
                            />
                            <button onClick={() => handleUpdateCategory(cat.id)} className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                              <Check className="w-3 h-3" />
                            </button>
                            <button onClick={() => setEditingCategory(null)} className="p-1.5 rounded-lg bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">{cat.name}</p>
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-md tabular-nums">{catServices.length}</span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setEditingCategory(cat.id); setEditCategoryName(cat.name); }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Services in category */}
                      {!isCollapsed && (
                        <div className="ml-3 pl-4 border-l-2 border-indigo-200">
                          {catServices.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                              {catServices.map(renderServiceRow)}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 py-3 italic">Aucune prestation dans cette catégorie</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Uncategorized services */}
              {servicesByCategory.uncategorized.length > 0 && (
                <div className={categories.length > 0 ? 'mt-4' : ''}>
                  {categories.length > 0 && (
                    <p className="text-sm font-bold text-gray-400 mb-2">Autres</p>
                  )}
                  <div className={`divide-y divide-gray-50 ${categories.length > 0 ? 'ml-3 pl-4 border-l-2 border-gray-200' : 'rounded-xl border border-gray-100 overflow-hidden'}`}>
                    {servicesByCategory.uncategorized.map(renderServiceRow)}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {services.length === 0 && categories.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <LayoutList className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Aucune prestation</p>
                  <p className="text-xs text-gray-400 mt-1">Ajoute tes services et tarifs ci-dessous</p>
                </div>
              )}

              {/* Add new service */}
              {services.length < 50 && (
                <div className={`mt-5 pt-5 border-t border-gray-100 ${services.length === 0 && categories.length === 0 ? 'mt-0 pt-0 border-0' : ''}`}>
                  <p className="text-xs font-semibold text-gray-500 mb-2.5">Ajouter une prestation</p>
                  <div className="flex items-center gap-2">
                    <input
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="Nom de la prestation"
                      className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                    />
                    <div className="relative w-24">
                      <input
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Prix"
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                      />
                      <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <button
                      onClick={handleAddService}
                      disabled={addingService || !newServiceName.trim() || !newServicePrice}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                    >
                      {addingService ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Ajouter
                    </button>
                  </div>
                  {categories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[11px] text-gray-400 font-medium">dans</span>
                      <button
                        onClick={() => setNewServiceCategoryId(null)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                          !newServiceCategoryId
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        Sans catégorie
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setNewServiceCategoryId(cat.id)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                            newServiceCategoryId === cat.id
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── WELCOME HELP MODAL ── */}
      {showWelcomeHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowWelcomeHelp(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Comment ca marche ?</h3>
              <button onClick={() => setShowWelcomeHelp(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Un nouveau client découvre ton offre', desc: 'Il visite ta page Qarte et voit l\'offre de bienvenue' },
                { step: '2', title: 'Il s\'inscrit et reçoit un bon', desc: 'Il crée son compte en 30 secondes et obtient son bon de réduction' },
                { step: '3', title: 'Il le présente lors de sa visite', desc: 'Il montre son bon depuis son téléphone et tu le valides' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-bold text-sm flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowWelcomeHelp(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
