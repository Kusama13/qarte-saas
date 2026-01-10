'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Phone,
  MapPin,
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

  useEffect(() => {
    const fetchMerchant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/merchant');
        return;
      }

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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="mt-1 text-gray-600">
            Gérez les informations de votre commerce
          </p>
        </div>
        <Button onClick={handleSave} loading={saving} disabled={saved}>
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
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-50 rounded-xl">
          {error}
        </div>
      )}

      <div className="p-6 bg-white rounded-2xl shadow-sm">
        <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
          <Store className="w-5 h-5 text-primary" />
          Informations du commerce
        </h2>

        <div className="space-y-5">
          <Input
            label="Nom du commerce"
            placeholder="Ex: Boulangerie Martin"
            value={formData.shopName}
            onChange={(e) =>
              setFormData({ ...formData, shopName: e.target.value })
            }
            required
          />

          <Select
            label="Type de commerce"
            placeholder="Sélectionnez..."
            options={shopTypeOptions}
            value={formData.shopType}
            onChange={(e) =>
              setFormData({ ...formData, shopType: e.target.value as ShopType })
            }
            required
          />

          <div className="relative">
            <Input
              label="Téléphone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
            <Phone className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
          </div>

          <div className="relative">
            <Input
              label="Adresse"
              placeholder="123 rue du Commerce, Paris"
              value={formData.shopAddress}
              onChange={(e) =>
                setFormData({ ...formData, shopAddress: e.target.value })
              }
            />
            <MapPin className="absolute w-5 h-5 text-gray-400 right-4 top-10" />
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Informations du compte
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">Identifiant unique</p>
              <p className="text-sm text-gray-500 font-mono">{merchant?.slug}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
            <div>
              <p className="font-medium text-gray-900">Date d&apos;inscription</p>
              <p className="text-sm text-gray-500">
                {new Date(merchant?.created_at || '').toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100">
        <h2 className="mb-2 text-lg font-semibold text-red-900">
          Zone de danger
        </h2>
        <p className="mb-4 text-sm text-red-700">
          La suppression du compte est irréversible. Toutes vos données seront
          définitivement supprimées.
        </p>
        <Button variant="danger">Supprimer mon compte</Button>
      </div>
    </div>
  );
}
