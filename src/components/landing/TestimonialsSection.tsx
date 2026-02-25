'use client';

import { useInView } from '@/hooks/useInView';

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

/* ─── Data ────────────────────────────────────────────── */

const testimonials: Testimonial[] = [
  {
    name: 'Lunzia Studio',
    initials: 'LS',
    dayLabel: 'SAMEDI',
    messages: [
      { from: 'qarte', text: "Salut ! Ca fait 3 mois que vous êtes sur Qarte, vous pouvez nous faire un petit retour ? 🙏", time: '14:32' },
      { from: 'them', text: "Franchement au top 🔥", timeBreak: '16:45' },
      { from: 'them', text: "Mes clientes perdait toujours leurs cartes avant" },
      { from: 'them', text: "Maintenant tout est sur leur tel elles adorent la notif quand la pose offerte est dispo 💅" },
      { from: 'them', text: "ah et merci pour les stickers ils sont trop beaux 😍", time: '16:47' },
    ],
  },
  {
    name: 'Doux Regard',
    initials: 'DR',
    dayLabel: 'JEUDI',
    messages: [
      { from: 'qarte', text: "Hello ! 6 semaines sur Qarte, vous en pensez quoi ? 😊", time: '16:48' },
      { from: 'them', text: "Ah oui j'adore", timeBreak: '19:12' },
      { from: 'them', text: "Honnêtement en 2 semaines j'avais deja recupéré le prix de l'abonnement" },
      { from: 'them', text: "Y'a une cliente qui est revenue 3 fois juste pour remplir sa carte 😂", time: '19:13' },
    ],
  },
  {
    name: 'Nour Beauté',
    initials: 'NB',
    dayLabel: 'MARDI',
    messages: [
      { from: 'qarte', text: "Hey ! 2 mois sur Qarte, on peut avoir votre retour ? 🙏", time: '11:20' },
      { from: 'them', text: "Le truc qui change tout c'est la notif auto", timeBreak: '14:33' },
      { from: 'them', text: "Mes clientes me disent \"ah oui faut que je revienne\" 😂" },
      { from: 'them', text: "Honnêtement j'aurais du prendre avant" },
      { from: 'them', text: "D'ailleurs merci Camélia elle repond super vite a mes questions 🙏", time: '14:35' },
    ],
  },
  {
    name: 'Le Comptoir du Visage',
    initials: 'CV',
    dayLabel: 'MERCREDI',
    messages: [
      { from: 'qarte', text: "Bonjour ! Bientôt 2 mois sur Qarte, comment ça se passe pour vous ? 😊", time: '09:47' },
      { from: 'them', text: "Coucou !", timeBreak: '13:02' },
      { from: 'them', text: "Très contente moi je galérais avec les cartes en carton mes clientes les oubliait tout le temps" },
      { from: 'them', text: "La c'est simple elles scan et c'est bon" },
      { from: 'them', text: "Et en plus elles recoivent une notif quand elles ont la récompense 👏", time: '13:04' },
    ],
  },
];

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

function WhatsAppChat({ data }: { data: Testimonial }) {
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
          <p className="text-[#a5d6d0] text-[10.5px] leading-tight">en ligne</p>
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

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-white">

      <div ref={ref} className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Elles en parlent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              mieux que nous
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Des vraies conversations, sans filtre.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6 items-start">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`transition-all duration-500 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: isInView ? `${i * 100}ms` : '0ms' }}
            >
              <WhatsAppChat data={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
