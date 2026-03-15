'use client';

import { useInView } from '@/hooks/useInView';
import { useTranslations } from 'next-intl';

/* ─── Types ──────────────────────────────────────────── */

interface ChatMsg {
  from: 'qarte' | 'them';
  text: string;
  time?: string;
  timeBreak?: string;
}

interface Testimonial {
  name: string;
  initials: string;
  dayLabel: string;
  messages: ChatMsg[];
}

/* ─── Data builder ────────────────────────────────────── */

function buildTestimonials(t: (key: string) => string): Testimonial[] {
  return [
    {
      name: t('t1Name'),
      initials: t('t1Initials'),
      dayLabel: t('t1Day'),
      messages: [
        { from: 'qarte', text: t('t1Q'), time: t('t1QTime') },
        { from: 'them', text: t('t1R1'), timeBreak: t('t1R1Time') },
        { from: 'them', text: t('t1R2') },
        { from: 'them', text: t('t1R3') },
        { from: 'them', text: t('t1R4'), time: t('t1R4Time') },
      ],
    },
    {
      name: t('t2Name'),
      initials: t('t2Initials'),
      dayLabel: t('t2Day'),
      messages: [
        { from: 'qarte', text: t('t2Q'), time: t('t2QTime') },
        { from: 'them', text: t('t2R1'), timeBreak: t('t2R1Time') },
        { from: 'them', text: t('t2R2') },
        { from: 'them', text: t('t2R3'), time: t('t2R3Time') },
      ],
    },
    {
      name: t('t3Name'),
      initials: t('t3Initials'),
      dayLabel: t('t3Day'),
      messages: [
        { from: 'qarte', text: t('t3Q'), time: t('t3QTime') },
        { from: 'them', text: t('t3R1'), timeBreak: t('t3R1Time') },
        { from: 'them', text: t('t3R2') },
        { from: 'them', text: t('t3R3') },
        { from: 'them', text: t('t3R4'), time: t('t3R4Time') },
      ],
    },
    {
      name: t('t4Name'),
      initials: t('t4Initials'),
      dayLabel: t('t4Day'),
      messages: [
        { from: 'qarte', text: t('t4Q'), time: t('t4QTime') },
        { from: 'them', text: t('t4R1'), timeBreak: t('t4R1Time') },
        { from: 'them', text: t('t4R2') },
        { from: 'them', text: t('t4R3') },
        { from: 'them', text: t('t4R4'), time: t('t4R4Time') },
      ],
    },
  ];
}

/* ─── WhatsApp double check ──────────────────────────── */

function DoubleCheck() {
  return (
    <svg
      className="w-[16px] h-[11px] text-[#53BDEB]"
      viewBox="0 0 16 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1,5.5 3.5,9 10,1.5" />
      <polyline points="5,5.5 7.5,9 14,1.5" />
    </svg>
  );
}

/* ─── WhatsApp Chat ──────────────────────────────────── */

function WhatsAppChat({ data, onlineLabel }: { data: Testimonial; onlineLabel: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
      {/* Header */}
      <div className="bg-[#008069] px-3 py-2 flex items-center gap-2.5">
        <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <div className="w-8 h-8 rounded-full bg-[#DFE5E7] flex items-center justify-center text-[#54656F] text-[11px] font-bold">
          {data.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13.5px] font-medium leading-tight truncate">{data.name}</p>
          <p className="text-[#a5d6d0] text-[10.5px] leading-tight">{onlineLabel}</p>
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" /></svg>
          <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
        </div>
      </div>

      {/* Chat body */}
      <div className="bg-[#ECE5DD] px-2.5 py-3 flex flex-col gap-[3px]">
        {/* Day chip */}
        <div className="flex justify-center mb-1.5">
          <span className="bg-[#E1F2FB] text-[#54656F] text-[10.5px] px-3 py-[3px] rounded-md shadow-sm font-medium">
            {data.dayLabel}
          </span>
        </div>

        {data.messages.map((msg, i) => {
          const isQarte = msg.from === 'qarte';
          const hasTime = !!msg.time;
          return (
            <div key={i}>
              {/* Time gap spacer */}
              {msg.timeBreak && (
                <div className="h-3" />
              )}

              <div className={`flex ${isQarte ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-2 py-1 shadow-sm ${
                  isQarte
                    ? 'bg-[#D9FDD3] rounded-lg rounded-tr-[3px]'
                    : 'bg-white rounded-lg rounded-tl-[3px]'
                }`}>
                  <p className="text-[13.5px] text-[#111B21] leading-[19px]">
                    {msg.text}
                    {hasTime && <span className="inline-block w-[62px]" />}
                  </p>
                  {hasTime && (
                    <div className="flex items-center justify-end gap-0.5 -mt-[14px] mb-0.5">
                      <span className="text-[10.5px] text-[#667781]">{msg.time}</span>
                      {isQarte && <DoubleCheck />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section ────────────────────────────────────────── */

export function TestimonialsSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('testimonials');
  const testimonials = buildTestimonials(t);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white">

      <div ref={ref} className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleBold')}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6 items-start">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className={`transition-all duration-500 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: isInView ? `${i * 100}ms` : '0ms' }}
            >
              <WhatsAppChat data={testimonial} onlineLabel={t('online')} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
