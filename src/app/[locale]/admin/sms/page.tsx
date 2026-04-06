'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare, Check } from 'lucide-react';

interface MerchantSms {
  merchant_id: string;
  shop_name: string;
  sent_this_month: number;
  free_remaining: number;
  overage_cost: number;
  period_start: string;
  period_end: string;
}

interface SmsData {
  totalAll: number;
  totalMonth: number;
  totalWeek: number;
  totalFailed: number;
  totalCost: number;
  merchants: MerchantSms[];
  globalConfig: {
    reminder_enabled: boolean;
    confirmation_enabled: boolean;
    birthday_enabled: boolean;
    referral_enabled: boolean;
  };
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminSmsPage() {
  const [data, setData] = useState<SmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/sms');
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (field: 'reminder_enabled' | 'confirmation_enabled' | 'birthday_enabled' | 'referral_enabled') => {
    if (!data) return;
    const newConfig = { ...data.globalConfig, [field]: !data.globalConfig[field] };
    setData({ ...data, globalConfig: newConfig });
    setSaving(true);
    setSaved(false);

    const res = await fetch('/api/admin/sms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (!data) {
    return <div className="text-center text-gray-400 py-20">Erreur de chargement des données</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">SMS</h1>
          <p className="text-xs text-gray-400">Suivi et configuration des SMS transactionnels</p>
        </div>
        {saved && (
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
            <Check className="w-3 h-3" /> Enregistré
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total SMS" value={data.totalAll} />
        <MetricCard label="Ce mois" value={data.totalMonth} />
        <MetricCard label="Cette semaine" value={data.totalWeek} />
        <MetricCard label="Échecs" value={data.totalFailed} sub={data.totalCost > 0 ? `Coût total: ${data.totalCost.toFixed(2)}€` : undefined} />
      </div>

      {/* Global toggles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Toggles globaux</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Rappels J-1 (18h)</p>
              <p className="text-[11px] text-gray-400">SMS de rappel la veille du RDV</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.globalConfig.reminder_enabled}
              onClick={() => handleToggle('reminder_enabled')}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${data.globalConfig.reminder_enabled ? 'bg-emerald-500' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${data.globalConfig.reminder_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Confirmations et déplacements</p>
              <p className="text-[11px] text-gray-400">SMS de confirmation après réservation, validation acompte ou déplacement de RDV</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.globalConfig.confirmation_enabled}
              onClick={() => handleToggle('confirmation_enabled')}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${data.globalConfig.confirmation_enabled ? 'bg-emerald-500' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${data.globalConfig.confirmation_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Anniversaires</p>
              <p className="text-[11px] text-gray-400">SMS de vœux + cadeau anniversaire au client</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.globalConfig.birthday_enabled}
              onClick={() => handleToggle('birthday_enabled')}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${data.globalConfig.birthday_enabled ? 'bg-emerald-500' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${data.globalConfig.birthday_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Récompenses parrainage</p>
              <p className="text-[11px] text-gray-400">SMS au parrain quand son filleul utilise sa récompense</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.globalConfig.referral_enabled}
              onClick={() => handleToggle('referral_enabled')}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${data.globalConfig.referral_enabled ? 'bg-emerald-500' : 'bg-gray-300'} ${saving ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${data.globalConfig.referral_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Per-merchant breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">SMS par merchant (cycle de facturation)</h2>
        </div>
        {data.merchants.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucun SMS envoyé ce mois</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  <th className="px-4 py-2">Merchant</th>
                  <th className="px-4 py-2">Cycle</th>
                  <th className="px-4 py-2 text-right">Envoyés</th>
                  <th className="px-4 py-2 text-right">Restant gratuit</th>
                  <th className="px-4 py-2 text-right">Dépassement</th>
                </tr>
              </thead>
              <tbody>
                {data.merchants.map(m => (
                  <tr key={m.merchant_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{m.shop_name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">
                      {new Date(m.period_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' — '}
                      {new Date(m.period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right text-gray-600">{m.sent_this_month}</td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      <span className={`font-medium ${m.free_remaining === 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {m.free_remaining}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      {m.overage_cost > 0 ? (
                        <span className="font-medium text-amber-600">{m.overage_cost.toFixed(2)}€</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
