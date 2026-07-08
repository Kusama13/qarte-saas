'use client';

import { Link } from '@/i18n/navigation';
import { Hand, Check, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ScanConfirmVisitScreenProps {
  firstName: string;
  shopName: string;
  primaryColor: string;
  /** Lien vers la carte (voir ses points sans gagner de tampon). */
  viewCardHref: string;
  submitting?: boolean;
  onValidate: () => void;
  onNotYou: () => void;
}

/**
 * Écran de confirmation de visite pour une cliente reconnue. Remplace l'ancien crédit
 * automatique : ouvrir le lien n'ajoute plus de tampon — il faut valider explicitement.
 * « Voir ma carte » permet de consulter ses points sans rien créditer.
 */
export default function ScanConfirmVisitScreen({
  firstName,
  shopName,
  primaryColor,
  viewCardHref,
  submitting,
  onValidate,
  onNotYou,
}: ScanConfirmVisitScreenProps) {
  const t = useTranslations('scanConfirm');
  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 overflow-hidden text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl" style={{ backgroundColor: `${primaryColor}15` }}>
          <Hand className="w-10 h-10" style={{ color: primaryColor }} />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-1">{t('hello', { name: firstName })}</h2>
        <p className="text-gray-500 mb-8">{t('subtitle', { shop: shopName })}</p>

        <button
          type="button"
          onClick={onValidate}
          disabled={submitting}
          className="w-full h-14 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-3 transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          <Check className="w-5 h-5" strokeWidth={2.5} />
          {submitting ? t('validating') : t('validate')}
        </button>

        <Link
          href={viewCardHref}
          className="w-full h-14 rounded-2xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          {t('viewCard')}
        </Link>

        <button
          type="button"
          onClick={onNotYou}
          className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t('notYou')}
        </button>
      </div>
    </div>
  );
}
