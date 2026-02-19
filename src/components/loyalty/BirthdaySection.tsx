'use client';

import { useState, useCallback } from 'react';
import { Gift, Cake, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Merchant } from '@/types';

interface BirthdaySectionProps {
  merchant: Merchant;
  customerId: string;
  hasBirthday: boolean;
}

export default function BirthdaySection({ merchant, customerId, hasBirthday }: BirthdaySectionProps) {
  const [birthdayDay, setBirthdayDay] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [birthdaySaved, setBirthdaySaved] = useState(hasBirthday);
  const [birthdayDismissed, setBirthdayDismissed] = useState(hasBirthday);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);

  const handleSaveBirthday = useCallback(async () => {
    if (!birthdayMonth || !birthdayDay) return;
    setBirthdayError(null);

    const testDate = new Date(2000, parseInt(birthdayMonth) - 1, parseInt(birthdayDay));
    if (testDate.getMonth() !== parseInt(birthdayMonth) - 1) {
      setBirthdayError('Cette date n\u2019existe pas (ex: 31 f\u00e9vrier)');
      return;
    }

    setSavingBirthday(true);
    try {
      const res = await fetch('/api/customers/birthday', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          birth_month: parseInt(birthdayMonth),
          birth_day: parseInt(birthdayDay),
        }),
      });
      if (res.ok) {
        setBirthdaySaved(true);
        setTimeout(() => setBirthdayDismissed(true), 4000);
      }
    } catch (err) {
      console.error('Birthday save error:', err);
    } finally {
      setSavingBirthday(false);
    }
  }, [customerId, birthdayMonth, birthdayDay]);

  if (!merchant.birthday_gift_enabled || birthdayDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={birthdaySaved ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
      transition={birthdaySaved ? { delay: 3.5, duration: 0.5 } : { duration: 0.3 }}
      className="mb-4"
    >
      <div className="rounded-2xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100/80 overflow-hidden">
        <div className="p-4">
          {birthdaySaved ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                <Cake className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Date sauvegard&eacute;e !</p>
                <p className="text-xs text-gray-500">
                  Une surprise vous attendra le jour J !
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${merchant.primary_color}10` }}
                >
                  <Gift className="w-5 h-5" style={{ color: merchant.primary_color }} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Recevez un cadeau pour votre anniversaire !</p>
                  <p className="text-xs text-gray-500">Ajoutez votre date de naissance (non modifiable)</p>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <select
                  value={birthdayDay}
                  onChange={(e) => { setBirthdayDay(e.target.value); setBirthdayError(null); }}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="">Jour</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <select
                  value={birthdayMonth}
                  onChange={(e) => { setBirthdayMonth(e.target.value); setBirthdayError(null); }}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="">Mois</option>
                  {['Jan','F\u00e9v','Mar','Avr','Mai','Juin','Juil','Ao\u00fbt','Sep','Oct','Nov','D\u00e9c'].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              {birthdayError && (
                <p className="text-xs text-red-500 font-medium mb-2">{birthdayError}</p>
              )}
              <button
                onClick={handleSaveBirthday}
                disabled={!birthdayMonth || !birthdayDay || savingBirthday}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${merchant.primary_color}, ${merchant.secondary_color || merchant.primary_color})` }}
              >
                {savingBirthday ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Cake className="w-4 h-4" />
                    Enregistrer mon anniversaire
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
