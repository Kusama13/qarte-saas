'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Loader2,
  X,
  Euro,
  Pencil,
  ChevronRight,
  Clock,
  LayoutList,
  Tag,
} from 'lucide-react';
import type { Merchant } from '@/types';
import type { ServiceCategory, Service } from './types';
import { formatCurrency } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface ServicesSectionProps {
  merchant: Merchant;
}

export default function ServicesSection({ merchant }: ServicesSectionProps) {
  const locale = useLocale();
  const t = useTranslations('publicPage');

  // Categories + Services
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Add service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePriceFrom, setNewServicePriceFrom] = useState(false);
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
  const [editDuration, setEditDuration] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriceFrom, setEditPriceFrom] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editNewCatName, setEditNewCatName] = useState('');
  const [editShowNewCat, setEditShowNewCat] = useState(false);
  const [editAddingCat, setEditAddingCat] = useState(false);

  // Edit category
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());


  useEffect(() => {
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
    fetchServices();
  }, [merchant]);

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

  // ── Category handlers ──
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
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
    if (!editCategoryName.trim()) return;
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
    if (!newServiceName.trim() || !newServicePrice) return;
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
          duration: newServiceDuration ? parseInt(newServiceDuration) : null,
          description: newServiceDescription.trim() || null,
          price_from: newServicePriceFrom,
        }),
      });
      const data = await res.json();
      if (res.ok && data.service) {
        setServices(prev => [...prev, data.service]);
        setNewServiceName('');
        setNewServicePrice('');
        setNewServiceDuration('');
        setNewServiceDescription('');
        setNewServicePriceFrom(false);
      }
    } catch {
      // silent
    } finally {
      setAddingService(false);
    }
  };

  const handleCreateCategoryInEdit = async () => {
    const name = editNewCatName.trim();
    if (!name) return;
    setEditAddingCat(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'category', merchant_id: merchant.id, name }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        setCategories(prev => [...prev, data.category]);
        setEditCategoryId(data.category.id);
        setEditNewCatName('');
        setEditShowNewCat(false);
      }
    } catch {
      // silent
    } finally {
      setEditAddingCat(false);
    }
  };

  const handleUpdateService = async (id: string) => {
    if (!editName.trim() || !editPrice) return;
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
          duration: editDuration ? parseInt(editDuration) : null,
          description: editDescription.trim() || null,
          price_from: editPriceFrom,
          category_id: editCategoryId,
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
  const formatDuration = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  };

  const renderServiceRow = (service: Service) => (
    <div key={service.id} className="group px-3.5 py-3 rounded-xl hover:bg-gray-50/80 transition-colors">
      {editingService === service.id ? (
        <div className="space-y-2">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            placeholder={t('svcName')}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateService(service.id)}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder={t('svcPrice')}
                className={`w-full text-sm font-bold bg-white border rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 ${editPriceFrom ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateService(service.id)}
              />
              <Euro className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="relative flex-1">
              <input
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                type="number"
                min="1"
                max="600"
                placeholder={t('svcDuration')}
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              <Clock className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <button
              type="button"
              role="switch"
              aria-checked={editPriceFrom}
              onClick={() => setEditPriceFrom(!editPriceFrom)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${editPriceFrom ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${editPriceFrom ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-[12px] transition-colors ${editPriceFrom ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>{t('svcFromLabel')}</span>
          </label>
          <input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder={t('svcDescOpt')}
            className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium">{t('svcIn')}</span>
            <button
              onClick={() => setEditCategoryId(null)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                !editCategoryId
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {t('svcNoCat')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setEditCategoryId(cat.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                  editCategoryId === cat.id
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
            {editShowNewCat ? (
              <div className="flex items-center gap-1">
                <input
                  value={editNewCatName}
                  onChange={(e) => setEditNewCatName(e.target.value)}
                  placeholder={t('svcCatPlaceholder')}
                  className="text-[11px] bg-white border border-indigo-300 rounded-full px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 max-w-[140px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCategoryInEdit();
                    if (e.key === 'Escape') { setEditShowNewCat(false); setEditNewCatName(''); }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleCreateCategoryInEdit}
                  disabled={editAddingCat || !editNewCatName.trim()}
                  className="p-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  {editAddingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => { setEditShowNewCat(false); setEditNewCatName(''); }}
                  className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              categories.length < 10 && (
                <button
                  onClick={() => setEditShowNewCat(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  {t('svcAddCat')}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <button onClick={() => setEditingService(null)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
              {t('svcCancel')}
            </button>
            <button onClick={() => handleUpdateService(service.id)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {t('svcSave')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-700 truncate">{service.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {service.duration && (
                <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDuration(service.duration)}
                </span>
              )}
              {service.description && (
                <span className="text-[11px] text-gray-400 truncate max-w-[200px]">{service.description}</span>
              )}
            </div>
          </div>
          <p className="text-[13px] font-bold text-gray-900 shrink-0 tabular-nums">
            {service.price_from && <span className="text-[11px] font-normal text-gray-400 mr-0.5">{t('svcFrom')} </span>}
            {formatCurrency(Number(service.price), merchant.country, locale)}
          </p>
          <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setEditingService(service.id);
                setEditName(service.name);
                setEditPrice(String(service.price));
                setEditDuration(service.duration ? String(service.duration) : '');
                setEditDescription(service.description || '');
                setEditPriceFrom(service.price_from || false);
                setEditCategoryId(service.category_id || null);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => handleDeleteService(service.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <LayoutList className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-gray-700">{t('servicesSection')}</span>
        {services.length > 0 && (
          <span className="text-xs text-gray-400">
            {services.length} {services.length > 1 ? t('svcPlural') : t('svcSingular')}
          </span>
        )}
      </div>
      <div>
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
                  placeholder={t('svcCatPlaceholder')}
                  className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  autoFocus
                />
                <button
                  onClick={handleAddCategory}
                  disabled={addingCategory || !newCategoryName.trim()}
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : t('svcAdd')}
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
                          <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover/cat:opacity-100 transition-opacity">
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
                          <p className="text-xs text-gray-400 py-3 italic">{t('svcNoneInCat')}</p>
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
                  <p className="text-sm font-bold text-gray-400 mb-2">{t('svcOther')}</p>
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
                <p className="text-sm font-medium text-gray-400">{t('svcNone')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('svcNoneHint')}</p>
              </div>
            )}

            {/* Add new service */}
            {services.length < 50 && (
              <div className={`mt-5 pt-5 border-t border-gray-100 ${services.length === 0 && categories.length === 0 ? 'mt-0 pt-0 border-0' : ''}`}>
                <p className="text-xs font-semibold text-gray-500 mb-2.5">{t('svcAddTitle')}</p>
                <div className="space-y-2">
                  <input
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder={t('svcNamePlaceholder')}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                  />
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('svcPrice')}
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddService()}
                      />
                      <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="relative flex-1">
                      <input
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(e.target.value)}
                        type="number"
                        min="1"
                        max="600"
                        placeholder={t('svcDuration')}
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                      />
                      <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={newServicePriceFrom}
                      onClick={() => setNewServicePriceFrom(!newServicePriceFrom)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${newServicePriceFrom ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${newServicePriceFrom ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <span className={`text-[12px] transition-colors ${newServicePriceFrom ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>{t('svcFromLabel')}</span>
                  </label>
                  <input
                    value={newServiceDescription}
                    onChange={(e) => setNewServiceDescription(e.target.value)}
                    placeholder={t('svcDescOpt')}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white transition-all"
                  />
                  <button
                    onClick={handleAddService}
                    disabled={addingService || !newServiceName.trim() || !newServicePrice}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {addingService ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {t('svcAddBtn')}
                  </button>
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-[11px] text-gray-400 font-medium">{t('svcIn')}</span>
                    <button
                      onClick={() => setNewServiceCategoryId(null)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all ${
                        !newServiceCategoryId
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {t('svcNoCat')}
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
            {/* Add category button — inside collapsible */}
            {!showAddCategory && categories.length < 10 && (
              <button
                onClick={() => setShowAddCategory(true)}
                className="mt-4 flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 hover:border-indigo-200 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('svcAddCat')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
