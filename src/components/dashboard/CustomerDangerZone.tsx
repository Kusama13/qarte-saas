'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Trash2, Ban } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPhoneLabel } from '@/lib/utils';

export interface CustomerDangerZoneProps {
  mode: 'delete' | 'ban';
  loyaltyCardId: string;
  phoneNumber: string;
  customerName: string;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}

export function CustomerDangerZone({
  mode,
  loyaltyCardId,
  phoneNumber,
  customerName,
  onCancel,
  onSuccess,
}: CustomerDangerZoneProps) {
  const t = useTranslations('customerDanger');
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!confirm) {
      setError(mode === 'delete' ? t('confirmDeletion') : t('confirmBan'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/customers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'delete'
            ? { loyalty_card_id: loyaltyCardId, ban_number: false }
            : { loyalty_card_id: loyaltyCardId, ban_number: true, phone_number: phoneNumber, customer_name: customerName },
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (mode === 'delete' ? t('deleteError') : t('banError')));
      onSuccess(mode === 'delete' ? t('deleteSuccess') : t('banSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : (mode === 'delete' ? t('deleteError') : t('banError')));
    } finally {
      setSubmitting(false);
    }
  };

  const isDelete = mode === 'delete';

  return (
    <div className="space-y-3">
      <div className={`flex items-start gap-2 p-2.5 rounded-lg ${isDelete ? 'bg-red-50' : 'bg-orange-50'}`}>
        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isDelete ? 'text-red-600' : 'text-orange-600'}`} />
        <p className={`text-xs leading-relaxed ${isDelete ? 'text-red-700' : 'text-orange-700'}`}>
          {isDelete ? t('deleteDesc') : t('banBlocks', { phone: formatPhoneLabel(phoneNumber) })}
          {isDelete && <> · <span className="font-semibold">{t('irreversible')}</span></>}
        </p>
      </div>

      <label className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${isDelete ? 'bg-red-50/60 hover:bg-red-100' : 'bg-orange-50/60 hover:bg-orange-100'}`}>
        <input
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
          className={`w-4 h-4 rounded border-gray-300 ${isDelete ? 'text-red-600 focus:ring-red-500' : 'text-orange-600 focus:ring-orange-500'}`}
        />
        <span className={`text-xs font-medium ${isDelete ? 'text-red-700' : 'text-orange-700'}`}>
          {isDelete ? t('deleteCheck') : t('banCheck')}
        </span>
      </label>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {t('cancel')}
        </button>
        <Button
          onClick={submit}
          loading={submitting}
          disabled={!confirm}
          className={`flex-1 text-sm ${isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
        >
          {isDelete
            ? <><Trash2 className="w-4 h-4 mr-1.5" />{t('deleteButton')}</>
            : <><Ban className="w-4 h-4 mr-1.5" />{t('banButton')}</>}
        </Button>
      </div>
    </div>
  );
}
