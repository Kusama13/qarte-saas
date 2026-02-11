'use client';

import { useInView } from '@/hooks/useInView';

/* ─── Types ──────────────────────────────────────────── */

interface ChatMsg {
  from: 'qarte' | 'them';
  text: string;
  time?: string;
  timeBreak?: string; // time separator shown BEFORE this message (shows delay)
}

interface Testimonial {
  platform: 'whatsapp' | 'imessage' | 'instagram';
  name: string;
  initials: string;
  dayLabel: string;
  messages: ChatMsg[];
  handle?: string;
  readStatus?: string;
}

/* ─── Data (noms du bandeau défilant) ────────────────── */

const testimonials: Testimonial[] = [
  {
    platform: 'whatsapp',
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
    platform: 'imessage',
    name: 'Doux Regard',
    initials: 'DR',
    dayLabel: 'Jeudi 16:48',
    readStatus: 'Lu',
    messages: [
      { from: 'qarte', text: "Hello ! 6 semaines sur Qarte, vous en pensez quoi ? 😊" },
      { from: 'them', text: "Ah oui j'adore", timeBreak: '19:12' },
      { from: 'them', text: "Honnêtement en 2 semaines j'avais deja recupéré le prix de l'abonnement" },
      { from: 'them', text: "Y'a une cliente qui est revenue 3 fois juste pour remplir sa carte 😂" },
    ],
  },
  {
    platform: 'instagram',
    name: 'Nour Beauté',
    handle: 'nour.beaute',
    initials: 'NB',
    dayLabel: '',
    messages: [
      { from: 'qarte', text: "Hey ! 2 mois sur Qarte, on peut avoir votre retour ? 🙏" },
      { from: 'them', text: "Le truc qui change tout c'est la notif auto", timeBreak: 'jeu. 14:33' },
      { from: 'them', text: "Mes clientes me disent \"ah oui faut que je revienne\" 😂" },
      { from: 'them', text: "Honnêtement j'aurais du prendre avant" },
      { from: 'them', text: "D'ailleurs merci Camélia elle repond super vite a mes questions 🙏" },
    ],
  },
  {
    platform: 'whatsapp',
    name: 'La Canopée des Sens',
    initials: 'CS',
    dayLabel: 'HIER',
    messages: [
      { from: 'qarte', text: "Coucou ! 4 mois avec Qarte, ca se passe comment de votre côté ? 😊", time: '11:03' },
      { from: 'them', text: "Au début j'avai peur que mes clientes de 50+ ans galèrent", timeBreak: '14:22' },
      { from: 'them', text: "En fait elles scannent le QR avec l'appareil photo et c'est tout" },
      { from: 'them', text: "Même ma mère y arrive 😅" },
      { from: 'them', text: "Par contre je retrouve plus mon code de parainage vous pouvez me le renvoyer ?", time: '14:25' },
    ],
  },
  {
    platform: 'imessage',
    name: 'Autres Regards',
    initials: 'AR',
    dayLabel: 'Vendredi 17:21',
    readStatus: 'Lu 19:48',
    messages: [
      { from: 'qarte', text: "Salut ! 2 mois avec Qarte, un petit retour ? 🙏" },
      { from: 'them', text: "J'ai mis 10 min a tout configurer franchement", timeBreak: '19:43' },
      { from: 'them', text: "Le côté zero papier ca correspond a l'image du salon 🌿" },
      { from: 'them', text: "Et les push notifs ca marche trop bien mes clientes reviennent plus souvent" },
    ],
  },
  {
    platform: 'whatsapp',
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

/* ─── Scatter layout (desktop only) ──────────────────── */

const scatterClasses = [
  'md:-rotate-[2deg] md:z-10',
  'md:rotate-[1.5deg] md:z-20 md:mt-10',
  'md:rotate-[1deg] md:z-30 md:-mt-8',
  'md:-rotate-[1.2deg] md:z-20 md:-mt-10',
  'md:-rotate-[0.8deg] md:z-10 md:-mt-6',
  'md:rotate-[1.8deg] md:z-30 md:-mt-12',
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

/* ─── WhatsApp ───────────────────────────────────────── */

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

/* ─── iMessage ───────────────────────────────────────── */

function IMessageChat({ data }: { data: Testimonial }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-white">
      {/* Header */}
      <div className="px-3 pt-2 pb-2.5 border-b border-[#C6C6C8]/40 bg-[#F2F2F7]">
        <div className="flex items-center justify-between mb-1.5">
          <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[10px] text-[#8E8E93] font-medium">iMessage</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-[#C7C7CC] flex items-center justify-center text-white text-[15px] font-semibold">
            {data.initials}
          </div>
          <p className="text-[13px] font-semibold text-black mt-1">{data.name}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-3 py-3 flex flex-col gap-[5px]">
        {data.dayLabel && (
          <p className="text-[11px] text-[#8E8E93] text-center mb-1">{data.dayLabel}</p>
        )}

        {data.messages.map((msg, i) => {
          const isQarte = msg.from === 'qarte';
          return (
            <div key={i}>
              {/* Time gap label */}
              {msg.timeBreak && (
                <p className="text-[11px] text-[#8E8E93] text-center my-2">{msg.timeBreak}</p>
              )}

              <div className={`flex ${isQarte ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-3 py-[6px] rounded-[18px] ${
                  isQarte
                    ? 'bg-[#007AFF] text-white rounded-br-[6px]'
                    : 'bg-[#E9E9EB] text-black rounded-bl-[6px]'
                }`}>
                  <p className="text-[15.5px] leading-[20px]">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}

        {data.readStatus && (
          <p className="text-[10.5px] text-[#8E8E93] text-right mr-1 mt-0.5">{data.readStatus}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Instagram DM ───────────────────────────────────── */

function InstagramChat({ data }: { data: Testimonial }) {
  const lastThemIdx = (() => {
    for (let i = data.messages.length - 1; i >= 0; i--) {
      if (data.messages[i].from === 'them') return i;
    }
    return -1;
  })();

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 bg-white">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-2.5 border-b border-[#DBDBDB]/60">
        <svg className="w-5 h-5 text-[#262626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#262626]">
              {data.initials}
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] bg-[#1CD14F] rounded-full border-[1.5px] border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#262626] leading-tight truncate">{data.handle || data.name}</p>
          <p className="text-[11px] text-[#8E8E93] leading-tight">Active maintenant</p>
        </div>
        <div className="flex items-center gap-3 text-[#262626]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        </div>
      </div>

      {/* Messages */}
      <div className="px-3 py-3 flex flex-col gap-[5px]">
        {data.messages.map((msg, i) => {
          const isQarte = msg.from === 'qarte';
          const isLastThem = i === lastThemIdx;

          return (
            <div key={i}>
              {/* Time gap label */}
              {msg.timeBreak && (
                <p className="text-[10.5px] text-[#8E8E93] text-center my-2">{msg.timeBreak}</p>
              )}

              {isQarte ? (
                <div className="flex justify-end">
                  <div className="max-w-[75%] px-3 py-2 bg-[#3797F0] text-white rounded-[22px] rounded-br-[6px]">
                    <p className="text-[14px] leading-[18px]">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start items-end gap-1.5">
                  {isLastThem ? (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-[1px] flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[6px] font-bold text-[#262626]">
                        {data.initials}
                      </div>
                    </div>
                  ) : (
                    <div className="w-5 flex-shrink-0" />
                  )}
                  <div className="max-w-[75%] px-3 py-2 bg-[#EFEFEF] text-[#262626] rounded-[22px] rounded-bl-[6px]">
                    <p className="text-[14px] leading-[18px]">{msg.text}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <p className="text-[10.5px] text-[#8E8E93] text-right mr-1 mt-0.5">Vu</p>
      </div>
    </div>
  );
}

/* ─── Dispatcher ─────────────────────────────────────── */

function ChatCard({ data }: { data: Testimonial }) {
  switch (data.platform) {
    case 'whatsapp':
      return <WhatsAppChat data={data} />;
    case 'imessage':
      return <IMessageChat data={data} />;
    case 'instagram':
      return <InstagramChat data={data} />;
  }
}

/* ─── Section ────────────────────────────────────────── */

export function TestimonialsSection() {
  const { ref, isInView } = useInView();

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white" />

      <div ref={ref} className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            On leur a demandé{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              ce qu&apos;elles en pensent
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Leurs retours, dans leurs mots.
          </p>
        </div>

        {/* Grille éparpillée de captures */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-5 md:gap-y-0 items-start">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`relative transition-all duration-500 cursor-default md:hover:!rotate-0 md:hover:scale-[1.02] md:hover:!z-50 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              } ${scatterClasses[i]}`}
              style={{ transitionDelay: isInView ? `${i * 100}ms` : '0ms' }}
            >
              <ChatCard data={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
