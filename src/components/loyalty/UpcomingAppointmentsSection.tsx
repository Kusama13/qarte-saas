'use client';

import { Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { formatTime } from '@/lib/utils';

interface AppointmentSlot {
  id: string;
  slot_date: string;
  start_time: string;
  deposit_confirmed?: boolean | null;
  planning_slot_services: Array<{
    service_id: string;
    service: { name: string } | null;
  }>;
}

interface UpcomingAppointmentsSectionProps {
  appointments: AppointmentSlot[];
  merchantColor: string;
  shopName: string;
}

export default function UpcomingAppointmentsSection({
  appointments,
  merchantColor,
  shopName,
}: UpcomingAppointmentsSectionProps) {
  const t = useTranslations('customerCard');
  const locale = useLocale();

  if (appointments.length === 0) return null;

  const formatLongDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100/80 overflow-hidden mb-4"
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2.5"
        style={{ backgroundColor: `${merchantColor}08` }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${merchantColor}15` }}
        >
          <Calendar className="w-4 h-4" style={{ color: merchantColor }} />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{t('upcomingAppointments')}</h3>
      </div>

      {/* Appointments list */}
      <div className="px-4 py-3 space-y-2.5">
        {appointments.map((appt) => {
          const serviceNames = appt.planning_slot_services
            .map(s => s.service?.name)
            .filter(Boolean)
            .join(', ');

          return (
            <div
              key={appt.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80"
              style={{ borderLeft: `3px solid ${merchantColor}` }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {formatLongDate(appt.slot_date)}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {formatTime(appt.start_time, locale)}
                </p>
                {serviceNames && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{serviceNames}</p>
                )}
                {appt.deposit_confirmed === false && (
                  <p className="text-[11px] font-semibold text-amber-600 mt-1">{t('depositPending')}</p>
                )}
                {appt.deposit_confirmed === true && (
                  <p className="text-[11px] font-semibold text-emerald-600 mt-1">{t('depositOk')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer contact message */}
      <div className="px-4 pb-3">
        <p className="text-[11px] text-gray-400 text-center italic">
          {t('contactToModify', { shop: shopName })}
        </p>
      </div>
    </motion.div>
  );
}
