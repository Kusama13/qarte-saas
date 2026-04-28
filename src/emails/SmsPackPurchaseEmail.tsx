import { Button, Heading, Text, Section, Hr } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface SmsPackPurchaseEmailProps {
  shopName: string;
  packSize: number;
  bonusSms?: number;
  amountTtc: string;
  newBalance: number;
  invoiceUrl?: string | null;
  ctaUrl: string;
  locale?: EmailLocale;
}

export function SmsPackPurchaseEmail({ shopName, packSize, bonusSms = 0, amountTtc, newBalance, invoiceUrl, ctaUrl, locale = 'fr' }: SmsPackPurchaseEmailProps) {
  const t = getEmailT(locale);
  const hasBonus = bonusSms > 0;
  const totalCredited = packSize + bonusSms;

  return (
    <BaseLayout preview={t('smsPackPurchase.preview', { shopName, packSize: String(packSize) })} locale={locale}>
      <Heading style={heading}>
        {hasBonus
          ? t('smsPackPurchase.headingWithBonus', { packSize: String(packSize), bonusSms: String(bonusSms) })
          : t('smsPackPurchase.heading', { packSize: String(packSize) })}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('smsPackPurchase.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {hasBonus
          ? t('smsPackPurchase.introWithBonus', { packSize: String(packSize), bonusSms: String(bonusSms), totalCredited: String(totalCredited), amountTtc })
          : t('smsPackPurchase.intro', { packSize: String(packSize), amountTtc })}
      </Text>

      <Section style={successBox}>
        <Text style={successTitle}>{t('smsPackPurchase.balanceLabel')}</Text>
        <Text style={successAmount}>{newBalance} {t('smsPackPurchase.smsUnit')}</Text>
        <Text style={successHint}>{t('smsPackPurchase.balanceHint')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={ctaUrl}>
          {t('smsPackPurchase.cta')}
        </Button>
      </Section>

      {invoiceUrl && (
        <>
          <Hr style={hr} />
          <Text style={paragraph}>{t('smsPackPurchase.invoiceIntro')}</Text>
          <Section style={buttonContainer}>
            <Button style={secondaryButton} href={invoiceUrl}>
              {t('smsPackPurchase.invoiceCta')}
            </Button>
          </Section>
        </>
      )}

      <Text style={footerNote}>{t('smsPackPurchase.footer')}</Text>

      <Text style={signature}>{t('smsPackPurchase.signature')}</Text>
    </BaseLayout>
  );
}

const heading = { color: '#1a1a1a', fontSize: '26px', fontWeight: '700', lineHeight: '1.3', margin: '0 0 24px 0' };
const paragraph = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px 0' };
const successBox = { backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '20px 24px', margin: '24px 0', border: '2px solid #6ee7b7', textAlign: 'center' as const };
const successTitle = { color: '#065f46', fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const successAmount = { color: '#047857', fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', lineHeight: '1' };
const successHint = { color: '#065f46', fontSize: '13px', lineHeight: '1.5', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = {
  backgroundColor: '#4b0082', borderRadius: '10px', color: '#ffffff',
  fontSize: '16px', fontWeight: '700', textDecoration: 'none',
  padding: '14px 28px', display: 'inline-block',
};
const secondaryButton = {
  backgroundColor: '#ffffff', borderRadius: '10px', color: '#4b0082',
  fontSize: '14px', fontWeight: '600', textDecoration: 'none',
  padding: '12px 24px', display: 'inline-block',
  border: '1.5px solid #4b0082',
};
const hr = { borderColor: '#e5e7eb', margin: '28px 0 20px 0' };
const footerNote = { color: '#6b7280', fontSize: '13px', lineHeight: '1.6', margin: '24px 0 8px 0' };
const signature = { color: '#4a5568', fontSize: '15px', margin: '24px 0 0 0', fontStyle: 'italic' as const };
