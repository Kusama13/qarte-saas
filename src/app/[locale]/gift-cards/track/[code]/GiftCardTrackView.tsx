'use client';

import { Gift, CheckCircle2, Clock, Hourglass, X, Download, Sparkles } from 'lucide-react';

interface TrackData {
  code: string;
  status: 'pending_payment' | 'active' | 'used' | 'cancelled' | 'expired';
  amount: number;
  amountFormatted: string;
  kind: 'amount' | 'services';
  servicesLabel: string | null;
  serviceNames: string[];
  senderFirstName: string;
  recipientFirstName: string;
  createdAt: string;
  paidAt: string | null;
  usedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  pdfUrl: string | null;
  scheduledSendAt: string | null;
  notifiedAt: string | null;
  shop: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    locale: 'fr' | 'en';
  };
}

function formatDate(iso: string | null, locale: 'fr' | 'en'): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function GiftCardTrackView({ data }: { data: TrackData }) {
  const isEn = data.shop.locale === 'en';
  const p = data.shop.primaryColor;
  const s = data.shop.secondaryColor;

  const giftLabel = data.servicesLabel || data.amountFormatted;
  const senderName = data.senderFirstName;
  const recipientName = data.recipientFirstName;

  const StatusBadge = () => {
    if (data.status === 'pending_payment') {
      const days = daysSince(data.createdAt);
      const left = Math.max(0, 3 - days);
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-bold">
          <Hourglass className="w-3.5 h-3.5" />
          {isEn
            ? left > 0 ? `Awaiting payment · ${left}d left` : 'Awaiting payment'
            : left > 0 ? `Paiement en attente · ${left}j` : 'Paiement en attente'}
        </div>
      );
    }
    if (data.status === 'active') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isEn ? 'Active' : 'Actif'}
        </div>
      );
    }
    if (data.status === 'used') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 text-sm font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          {isEn ? `Used by ${recipientName}` : `Utilisé par ${recipientName}`}
        </div>
      );
    }
    if (data.status === 'cancelled') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
          <X className="w-3.5 h-3.5" />
          {isEn ? 'Cancelled' : 'Annulé'}
        </div>
      );
    }
    if (data.status === 'expired') {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
          <Clock className="w-3.5 h-3.5" />
          {isEn ? 'Expired' : 'Expiré'}
        </div>
      );
    }
    return null;
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: `radial-gradient(ellipse at top, ${p}10 0%, transparent 60%), #fafafa`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Header brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${p} 0%, ${s} 100%)` }}
          >
            <Gift className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{data.shop.name}</span>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">
              {isEn ? 'Gift card' : 'Bon cadeau'}
            </p>
            {data.kind === 'services' ? (
              <>
                <p className="text-2xl font-bold text-gray-900 leading-tight px-2">{giftLabel}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {isEn ? 'Value' : 'Valeur'} {data.amountFormatted}
                </p>
              </>
            ) : (
              <p className="text-5xl font-bold text-gray-900 tracking-tight">{giftLabel}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {isEn ? `For ${recipientName}, from ${senderName}` : `Pour ${recipientName}, de la part de ${senderName}`}
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <StatusBadge />
          </div>

          {/* Timeline états */}
          <div className="space-y-3 mb-6">
            <TimelineEvent
              done
              label={isEn ? 'Order placed' : 'Commande passée'}
              date={formatDate(data.createdAt, data.shop.locale)}
            />
            <TimelineEvent
              done={!!data.paidAt}
              label={isEn ? 'Payment confirmed' : 'Paiement confirmé'}
              date={data.paidAt ? formatDate(data.paidAt, data.shop.locale) : null}
              hint={!data.paidAt && data.status === 'pending_payment' ? (isEn ? 'Waiting for the salon to confirm' : 'On attend que le salon confirme') : null}
            />
            {/* Étape envoi planifié — visible uniquement si scheduled */}
            {data.scheduledSendAt && (
              <TimelineEvent
                done={!!data.notifiedAt}
                label={isEn ? `Sent to ${recipientName}` : `Envoi à ${recipientName}`}
                date={data.notifiedAt ? formatDate(data.notifiedAt, data.shop.locale) : null}
                hint={!data.notifiedAt && data.status === 'active' ? (isEn ? `Scheduled for ${formatDate(data.scheduledSendAt, data.shop.locale)}` : `Prévu le ${formatDate(data.scheduledSendAt, data.shop.locale)}`) : null}
              />
            )}
            <TimelineEvent
              done={!!data.usedAt}
              label={isEn ? 'Used by recipient' : 'Utilisé par le destinataire'}
              date={data.usedAt ? formatDate(data.usedAt, data.shop.locale) : null}
              hint={data.status === 'active' && (!data.scheduledSendAt || data.notifiedAt) ? (isEn ? `${recipientName} can use it anytime` : `${recipientName} peut l'utiliser quand elle veut`) : null}
            />
          </div>

          {/* Code référence */}
          <div className="rounded-xl bg-gray-50 px-4 py-3 mb-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              {isEn ? 'Reference' : 'Référence'}
            </p>
            <code className="text-base font-mono font-bold text-gray-900 tracking-widest">
              {data.code}
            </code>
          </div>

          {/* Validité */}
          {data.status === 'active' && data.expiresAt && (
            <p className="text-xs text-gray-500 text-center mb-4">
              {isEn ? 'Valid until' : 'Valable jusqu\'au'} {formatDate(data.expiresAt, data.shop.locale)}
            </p>
          )}

          {/* Téléchargement PDF */}
          {data.pdfUrl && (
            <a
              href={data.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${p} 0%, ${s} 100%)` }}
            >
              <Download className="w-4 h-4" />
              {isEn ? 'Download PDF' : 'Télécharger le PDF'}
            </a>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          {isEn ? 'Powered by ' : 'Propulsé par '}
          <a href="https://getqarte.com" className="font-semibold hover:text-gray-600">getqarte.com</a>
        </p>
      </div>
    </main>
  );
}

function TimelineEvent({
  done, label, date, hint,
}: {
  done: boolean;
  label: string;
  date: string | null;
  hint?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-500'}`}>{label}</p>
        {date && <p className="text-xs text-gray-500">{date}</p>}
        {hint && !date && <p className="text-xs text-gray-400 italic">{hint}</p>}
      </div>
    </div>
  );
}
