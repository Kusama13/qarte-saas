'use client';

import { useState } from 'react';
import { Mail, Check, Loader2, Pencil, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { validateEmail } from '@/lib/utils';
import type { Merchant } from '@/types';

interface EmailSectionProps {
  merchant: Merchant;
  customerId: string;
  initialEmail: string | null;
}

export default function EmailSection({ merchant, customerId, initialEmail }: EmailSectionProps) {
  const t = useTranslations('emailSection');
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [editing, setEditing] = useState(initialEmail === null);
  const [draft, setDraft] = useState(initialEmail || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = draft.trim().toLowerCase();
    if (!validateEmail(trimmed)) {
      setError(t('invalid'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/customers/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, email: trimmed }),
      });
      if (res.ok) {
        setEmail(trimmed);
        setEditing(false);
      } else {
        setError(t('saveError'));
      }
    } catch {
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setDraft(email || '');
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(email || '');
    setError(null);
    setEditing(false);
  };

  const p = merchant.primary_color || '#4b0082';

  return (
    <div className="rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100/80 overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${p}10` }}
          >
            <Mail className="w-5 h-5" style={{ color: p }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{t('title')}</p>
            <p className="text-xs text-gray-500">{t(merchant.auto_booking_enabled ? 'subtitle' : 'subtitleNoBooking')}</p>
          </div>
          {!editing && email && (
            <button
              onClick={startEdit}
              aria-label={t('edit')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {editing ? (
          <>
            <input
              type="email"
              value={draft}
              onChange={e => { setDraft(e.target.value); setError(null); }}
              placeholder={t('placeholder')}
              autoComplete="email"
              maxLength={254}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 transition-colors mb-2"
              style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
            />
            {error && <p className="text-xs text-red-500 font-medium mb-2">{error}</p>}
            <div className="flex gap-2">
              {email && (
                <button
                  onClick={cancelEdit}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> {t('cancel')}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!draft.trim() || saving}
                className="flex-1 py-2 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> {t('save')}</>}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-700 font-medium break-all">{email}</p>
        )}
      </div>
    </div>
  );
}
