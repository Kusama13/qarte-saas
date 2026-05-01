/**
 * Rendu Satori du bon cadeau — clone du template "spa hammam" :
 * format A6 paysage, split 62/38 (texte/visuel), bandeau crème central avec
 * services/montant en serif italic, ornement étoile à 8 branches en haut à
 * droite, ligne pointillée pour le nom du destinataire, infos résa en bas.
 *
 * La zone visuelle droite affiche l'image custom uploadée par le merchant
 * (mig 144) si présente, sinon un ton plus clair de la primary.
 *
 * Un seul layout JSX → SVG → 2 sorties :
 *   - PDF A6 paysage imprimable (300 dpi, 1748×1240px)
 *   - PNG paysage pour l'email destinataire (1240×880px)
 */

import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { PDFDocument } from 'pdf-lib';
import { loadGiftCardFonts } from './gift-card-fonts';
import { amountInWords } from './amount-in-words';
import { displayPhoneNumber } from './utils';

const PRINT_W = 1748;
const PRINT_H = 1240;
const EMAIL_W = 1240;
const EMAIL_H = 880;

// Palette fixe (modèle hammam) — on n'utilise pas les couleurs du merchant
// pour l'instant, ça fait trop lourd à customiser en V1.
const PALETTE = {
  rose: '#DDB5A8',       // zone gauche (dusty rose / terracotta)
  roseDeep: '#B5806E',   // zone droite (terracotta franc, contraste lisible avec rose)
  cream: '#F5EAD4',      // accent crème (bandeau central, hairlines)
  creamLight: '#FAF1DD', // bandeau crème (léger)
  ink: '#3D2515',        // brun foncé (texte principal)
  inkSoft: '#6B4A35',    // brun moyen (sous-titres / labels) — assez sombre pour 4.5:1 sur rose
};

export interface GiftCardRenderParams {
  shopName: string;
  shopPhone?: string | null;
  shopCountry?: string;        // FR/BE/CH — pour formatter le tel correctement
  shopSlug?: string | null;
  autoBookingEnabled?: boolean;
  amountFormatted: string;
  amountValue?: number | null;
  servicesLabel?: string | null;
  serviceNames?: string[];
  senderFirstName: string;
  senderLastName?: string | null;
  recipientFirstName: string;
  recipientLastName?: string | null;
  senderMessage?: string | null;
  code: string;
  expiresAtFormatted: string;
  locale?: 'fr' | 'en';
}

// ──────────────── TEXT HELPERS ────────────────

function clampMessage(msg: string, max = 110): string {
  if (msg.length <= max) return msg;
  return msg.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}
function fullName(first: string, last?: string | null): string {
  return last ? `${first} ${last}` : first;
}
function autoShrinkRecipient(name: string): number {
  const len = name.length;
  if (len <= 10) return 84;
  if (len <= 16) return 66;
  if (len <= 22) return 52;
  return 42;
}
function buildBookingLine(params: GiftCardRenderParams): string | null {
  // Renvoie juste les coordonnées brutes (le préfixe "Pour réserver :" est
  // ajouté côté template pour éviter la redondance "Pour réserver : Réserve…")
  const { shopPhone, shopSlug, shopCountry, autoBookingEnabled } = params;
  const url = autoBookingEnabled && shopSlug ? `getqarte.com/p/${shopSlug}` : null;
  // displayPhoneNumber requiert le pays merchant pour formater BE/CH correctement
  const phone = shopPhone ? displayPhoneNumber(shopPhone, (shopCountry || 'FR') as 'FR' | 'BE' | 'CH') : null;
  if (!url && !phone) return null;
  if (url && phone) return `${url}  ·  ${phone}`;
  return url || phone;
}

// ──────────────── JSX ────────────────

interface LayoutSize {
  width: number;
  height: number;
  scale: number;
}

function buildJSX(params: GiftCardRenderParams, size: LayoutSize) {
  const {
    shopName,
    amountFormatted, amountValue, servicesLabel, serviceNames,
    senderFirstName, senderLastName, recipientFirstName, recipientLastName,
    senderMessage, code, expiresAtFormatted,
    locale = 'fr',
  } = params;

  const isEn = locale === 'en';
  const s = size.scale;
  const px = (v: number) => Math.round(v * s);

  const recipientFull = fullName(recipientFirstName, recipientLastName);
  const senderFull = fullName(senderFirstName, senderLastName);
  const recipientSize = autoShrinkRecipient(recipientFull);
  const amountWords = amountValue != null ? amountInWords(amountValue, locale) : null;
  const messageClamped = senderMessage ? clampMessage(senderMessage) : null;
  const bookingLine = buildBookingLine(params);

  // V1 : palette fixe hammam (cf. PALETTE en haut). primary/secondary du
  // merchant ignorés pour l'instant — on rebranchera quand le tab Design
  // sera ré-exposé côté UI.
  const ink = PALETTE.ink;
  const inkSoft = PALETTE.inkSoft;

  // Labels FR / EN
  const titleLabel = isEn ? 'Gift voucher' : 'Bon cadeau';
  const offeredToLabel = isEn ? 'This gift is for' : 'Ce cadeau est offert à';
  const bookHintLabel = isEn ? 'To book your appointment' : 'Pour réserver';
  const validUntilLabel = isEn ? 'GIFT VALID UNTIL' : 'BON VALABLE JUSQU\'AU';
  const singleUseLabel = isEn ? 'SINGLE USE · NON-REFUNDABLE' : 'UTILISABLE EN UNE FOIS · NON REMBOURSABLE';

  return (
    <div
      style={{
        width: size.width,
        height: size.height,
        display: 'flex',
        position: 'relative',
        backgroundColor: PALETTE.rose,
        color: ink,
        fontFamily: 'Manrope',
      }}
    >
      {/* ───────── ZONE VISUELLE DROITE (38%) ───────── */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '38%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          backgroundColor: PALETTE.roseDeep,
          padding: `${px(60)}px ${px(70)}px`,
        }}
      >
        {/* Icône cadeau (lucide Gift) en haut à droite */}
        <svg
          width={px(120)}
          height={px(120)}
          viewBox="0 0 24 24"
          fill="none"
          stroke={ink}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block' }}
        >
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13" />
          <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
        </svg>

        {/* Petit motif feuille subtil en bas à droite (rappel beauté/nature) */}
        <svg
          width={px(60)}
          height={px(60)}
          viewBox="0 0 24 24"
          fill="none"
          stroke={ink}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block', opacity: 0.32 }}
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.5c.5 4.5-1 8.5-4 12-2 2-4 3-7 3-1.4 0-2.7-.5-3.7-1.5" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
      </div>


      {/* ───────── ZONE TEXTE GAUCHE ───────── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '62%',
          display: 'flex',
          flexDirection: 'column',
          padding: `${px(70)}px ${px(90)}px`,
        }}
      >
        {/* Titre "Bon cadeau" */}
        <div
          style={{
            fontFamily: 'BodoniModa',
            fontWeight: 400,
            fontSize: px(112),
            color: ink,
            lineHeight: 0.95,
          }}
        >
          {titleLabel}
        </div>
        <div
          style={{
            fontFamily: 'Manrope',
            fontSize: px(34),
            letterSpacing: px(5),
            color: ink,
            fontWeight: 500,
            marginTop: px(16),
            textTransform: 'uppercase',
          }}
        >
          {shopName}
        </div>

        {/* Destinataire */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: px(54),
          }}
        >
          <div
            style={{
              fontFamily: 'Manrope',
              fontSize: px(32),
              color: ink,
            }}
          >
            {`${offeredToLabel} :`}
          </div>
          <div
            style={{
              fontFamily: 'BodoniModa',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: px(recipientSize),
              color: ink,
              lineHeight: 1.1,
              marginTop: px(14),
              borderBottom: `${px(2)}px dashed ${inkSoft}`,
              paddingBottom: px(16),
            }}
          >
            {recipientFull}
          </div>
        </div>

        {/* Spacer flex */}
        <div style={{ flex: 1, display: 'flex' }} />

        {/* Bas de zone : résa + valable jusqu'au + code */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {bookingLine && (
            <div
              style={{
                fontFamily: 'Manrope',
                fontSize: px(30),
                color: ink,
                lineHeight: 1.45,
                marginBottom: px(14),
                fontWeight: 500,
              }}
            >
              {`${bookHintLabel} : ${bookingLine}`}
            </div>
          )}
          <div
            style={{
              fontFamily: 'Manrope',
              fontSize: px(26),
              letterSpacing: px(2.8),
              color: ink,
              fontWeight: 600,
              marginTop: px(8),
            }}
          >
            {`${validUntilLabel} ${expiresAtFormatted}`}
          </div>
          <div
            style={{
              fontFamily: 'Manrope',
              fontSize: px(20),
              letterSpacing: px(2.2),
              color: inkSoft,
              fontWeight: 500,
              marginTop: px(6),
            }}
          >
            {singleUseLabel}
          </div>
          <div
            style={{
              fontFamily: 'JetBrainsMono',
              fontSize: px(26),
              color: ink,
              letterSpacing: px(1.8),
              marginTop: px(10),
              fontWeight: 400,
            }}
          >
            {code}
          </div>
        </div>
      </div>

      {/* ───────── BANDEAU CRÈME CENTRAL ───────── */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: PALETTE.creamLight,
          padding: `${px(40)}px ${px(70)}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: `0 ${px(14)}px ${px(40)}px rgba(0, 0, 0, 0.16)`,
        }}
      >
        {servicesLabel ? (
          <>
            <div
              style={{
                fontFamily: 'BodoniModa',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: px(46),
                color: PALETTE.ink,
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: px(1400),
              }}
            >
              {servicesLabel}
            </div>
            {serviceNames && serviceNames.length > 1 && (
              <div
                style={{
                  fontFamily: 'Manrope',
                  fontSize: px(22),
                  color: PALETTE.inkSoft,
                  letterSpacing: px(0.6),
                  marginTop: px(10),
                  textAlign: 'center',
                  maxWidth: px(1400),
                }}
              >
                {serviceNames.slice(0, 5).join(' · ')}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {amountWords && (
              <div
                style={{
                  fontFamily: 'BodoniModa',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: px(50),
                  color: PALETTE.ink,
                  lineHeight: 1,
                }}
              >
                {amountWords}
              </div>
            )}
            <div
              style={{
                fontFamily: 'Manrope',
                fontSize: px(26),
                fontWeight: 500,
                color: PALETTE.inkSoft,
                letterSpacing: px(2),
                marginTop: px(10),
              }}
            >
              {amountFormatted}
            </div>
          </div>
        )}
        {messageClamped && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: px(26),
              paddingTop: px(22),
              borderTop: `1px solid ${PALETTE.rose}`,
              width: '85%',
            }}
          >
            <div
              style={{
                fontFamily: 'Spectral',
                fontStyle: 'italic',
                fontSize: px(34),
                color: PALETTE.ink,
                textAlign: 'center',
                lineHeight: 1.4,
                maxWidth: px(1400),
                fontWeight: 400,
              }}
            >
              {`« ${messageClamped} »`}
            </div>
            <div
              style={{
                fontFamily: 'Manrope',
                fontSize: px(26),
                fontWeight: 600,
                color: PALETTE.ink,
                marginTop: px(14),
                letterSpacing: px(1.2),
              }}
            >
              {senderFull}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────── EXPORTS ────────────────

/**
 * Génère le SVG une seule fois à résolution PRINT puis dérive PDF + PNG email
 * via 2 passes Resvg distinctes (chaque resvg.render() est rapide ; c'est le
 * satori() qui coûte ~200-400ms). On évite ainsi un 2e satori complet.
 */
async function renderPrintSvg(params: GiftCardRenderParams): Promise<string> {
  const fonts = await loadGiftCardFonts();
  return satori(buildJSX(params, { width: PRINT_W, height: PRINT_H, scale: 1 }), {
    width: PRINT_W,
    height: PRINT_H,
    fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: f.style })),
  });
}

export async function renderGiftCardPng(
  params: GiftCardRenderParams,
  target: 'print' | 'email',
): Promise<Buffer> {
  const svg = await renderPrintSvg(params);
  const targetWidth = target === 'print' ? PRINT_W : EMAIL_W;
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: targetWidth } });
  return Buffer.from(resvg.render().asPng());
}

/**
 * Génère PDF + PNG email à partir d'UN seul rendu Satori (le PDF embed le PNG
 * print, le PNG email est le même SVG rastérisé à plus petite taille).
 */
export async function renderGiftCardPdfAndEmailPng(
  params: GiftCardRenderParams,
): Promise<{ pdf: Buffer; emailPng: Buffer }> {
  const svg = await renderPrintSvg(params);
  const printPng = Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: PRINT_W } }).render().asPng());
  const emailPng = Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: EMAIL_W } }).render().asPng());

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Bon cadeau — ${params.shopName}`);
  pdf.setAuthor(params.shopName);
  pdf.setCreator('Qarte');
  // A6 paysage : 148mm × 105mm (1pt = 1/72 inch)
  const A6 = { w: 419.53, h: 297.64 };
  const page = pdf.addPage([A6.w, A6.h]);
  const image = await pdf.embedPng(printPng);
  page.drawImage(image, { x: 0, y: 0, width: A6.w, height: A6.h });
  return { pdf: Buffer.from(await pdf.save()), emailPng };
}

export async function renderGiftCardPdf(params: GiftCardRenderParams): Promise<Buffer> {
  const { pdf } = await renderGiftCardPdfAndEmailPng(params);
  return pdf;
}
