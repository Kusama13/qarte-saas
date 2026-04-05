'use client';

import { CalendarDays, Hourglass, Check, Clock } from 'lucide-react';
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
      className="mb-4"
    >
      <div
        className="bg-white rounded-2xl p-3.5"
        style={{
          border: `2px solid ${merchantColor}`,
          boxShadow: `0 4px 16px -4px ${merchantColor}30`,
        }}
      >
        {/* Header compact */}
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${merchantColor}15` }}
          >
            <CalendarDays className="w-3.5 h-3.5" style={{ color: merchantColor }} />
          </div>
          <h3 className="text-[13px] font-bold text-gray-900">{t('upcomingAppointments')}</h3>
        </div>

        {/* Appointments list */}
        <div className="space-y-2 mb-2.5">
          {appointments.map((appt) => {
            const serviceNames = appt.planning_slot_services
              .map(s => s.service?.name)
              .filter((n): n is string => !!n);

            return (
              <div
                key={appt.id}
                className="rounded-lg px-3 py-2"
                style={{ backgroundColor: `${merchantColor}08`, border: `1px solid ${merchantColor}1a` }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                    <p className="text-[13px] font-black text-gray-900 capitalize leading-tight tracking-tight">
                      {formatLongDate(appt.slot_date)}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-[12px] font-bold" style={{ color: merchantColor }}>
                      <Clock className="w-3 h-3" />
                      {formatTime(appt.start_time, locale)}
                    </span>
                  </div>
                  {appt.deposit_confirmed === false && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 shrink-0">
                      <Hourglass className="w-2.5 h-2.5 text-amber-700" />
                      <span className="text-[10px] font-bold text-amber-800">{t('depositPending')}</span>
                    </span>
                  )}
                  {appt.deposit_confirmed === true && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-700" />
                      <span className="text-[10px] font-bold text-emerald-800">{t('depositOk')}</span>
                    </span>
                  )}
                </div>
                {serviceNames.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {serviceNames.map((name, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                        <span
                          className="mt-[5px] w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: merchantColor }}
                        />
                        <span className="truncate">{name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100">
          {t('contactToModify', { shop: shopName })}
        </p>
      </div>
    </motion.div>
  );
}
