'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Phone,
  MapPin,
  Mail,
  Save,
  Check,
  Loader2,
} from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validateFrenchPhone } from '@/lib/utils';
import { SHOP_TYPES, type ShopType } from '@/types';
import type { Merchant } from '@/types';

const shopTypeOptions = Object.entries(SHOP_TYPES).map(([value, label]) => ({
  value,
  label,
}));

export default function SettingsPage() {
  const router = useRouter();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    shopName: '',
    shopType: '' as ShopType | '',
    shopAddress: '',
    phone: '',
  });
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/merchant');
        return;
      }

      setUserEmail(user.email || '');

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setMerchant(data);
        setFormData({
          shopName: data.shop_name || '',
          shopType: data.shop_type || '',
          shopAddress: data.shop_address || '',
          phone: data.phone || '',
        });
      }
      setLoading(false);
    };

    fetchMerchant();
  }, [router]);

  const handleSave = async () => {
    setError('');

    if (!formData.shopName.trim()) {
      setError('Le nom du commerce est requis');
      return;
    }

    if (!validateFrenchPhone(formData.phone)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    if (!merchant) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('merchants')
        .update({
          shop_name: formData.shopName,
          shop_type: formData.shopType,
          shop_address: formData.shopAddress || null,
          phone: formData.phone,
        })
        .eq('id', merchant.id);

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Paramètres
          </h1>
          <p className="mt-1 text-gray-500 font-medium">
            Gérez les informations et les accès de votre commerce
          </p>
        </div>
        <Button
          onClick={handleSave}
          loading={saving}
          disabled={saved}
          className={`px-6 h-12 rounded-2xl transition-all duration-300 shadow-lg ${
            saved
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Enregistré
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 mb-8 text-sm font-medium text-red-700 bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      <div className="p-8 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl shadow-indigo-100/50">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
            <Store className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Informations du commerce
          </h2>
        </div>

        <div className="space-y-6">
          <div className="group transition-all">
            <Input
              label="Nom du commerce"
              placeholder="Ex: Boulangerie Martin"
              value={formData.shopName}
              onChange={(e) =>
                setFormData({ ...formData, shopName: e.target.value })
              }
              required
              className="bg-white/50 border-gray-200 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="relative group">
            <Input
              label="Adresse email"
              type="email"
              value={userEmail}
              disabled
              className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            />
            <Mail className="absolute w-4 h-4 text-gray-400 right-4 top-[42px]" />
            <p className="mt-1.5 text-xs text-gray-400">
              L&apos;adresse email ne peut pas être modifiée pour le moment
            </p>
          </div>

          <Select
            label="Type de commerce"
            placeholder="Sélectionnez le type..."
            options={shopTypeOptions}
            value={formData.shopType}
            onChange={(e) =>
              setFormData({ ...formData, shopType: e.target.value as ShopType })
            }
            required
            className="bg-white/50 border-gray-200"
          />

          <div className="relative group">
            <Input
              label="Téléphone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              className="bg-white/50 border-gray-200 pl-4"
            />
            <Phone className="absolute w-4 h-4 text-gray-400 right-4 top-[42px] group-focus-within:text-indigo-500 transition-colors" />
          </div>

          <div className="relative group">
            <Input
              label="Adresse"
              placeholder="123 rue du Commerce, Paris"
              value={formData.shopAddress}
              onChange={(e) =>
                setFormData({ ...formData, shopAddress: e.target.value })
              }
              className="bg-white/50 border-gray-200"
            />
            <MapPin className="absolute w-4 h-4 text-gray-400 right-4 top-[42px] group-focus-within:text-indigo-500 transition-colors" />
          </div>
        </div>
      </div>

      <div className="mt-8 p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl shadow-indigo-100/30">
        <h2 className="mb-8 text-xl font-bold text-gray-900">
          Informations du compte
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/50 border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Identifiant unique</p>
            <p className="text-sm text-indigo-600 font-mono font-medium">{merchant?.slug}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/50 border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Date d&apos;inscription</p>
            <p className="text-sm text-gray-700 font-medium">
              {new Date(merchant?.created_at || '').toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-8 bg-red-50/50 backdrop-blur-sm rounded-3xl border border-red-100/50 shadow-lg shadow-red-100/20">
        <h2 className="mb-2 text-xl font-bold text-red-900">
          Zone de danger
        </h2>
        <p className="mb-6 text-sm text-red-700 leading-relaxed">
          La suppression du compte est irréversible. Toutes vos données,
          points de fidélité clients et historiques seront définitivement supprimés.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors shadow-md shadow-red-200"
        >
          Demander la suppression de mon compte
        </a>
      </div>
    </div>
  );
}
