import { Button, Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

interface PlansLaunchEmailProps {
  shopName: string;
  /** Current price label as displayed on Stripe (e.g. "19€/mois", "240€/an"). */
  currentPrice: string;
  locale?: EmailLocale;
}

export function PlansLaunchEmail({ shopName, currentPrice, locale = 'fr' }: PlansLaunchEmailProps) {
  const t = getEmailT(locale);
  return (
    <BaseLayout preview={t('plansLaunch.preview', { shopName })} locale={locale}>
      <Heading style={heading}>{t('plansLaunch.heading')}</Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('plansLaunch.greeting', { shopName }) }} />
      <Text style={paragraph}>{t('plansLaunch.intro')}</Text>

      <Section style={reassureBox}>
        <Text style={reassureBadge}>{t('plansLaunch.badgeReassure')}</Text>
        <Text style={reassureTitle}>{t('plansLaunch.reassureTitle')}</Text>
        <Text style={reassureText} dangerouslySetInnerHTML={{ __html: t('plansLaunch.reassureText', { currentPrice }) }} />
      </Section>

      <Text style={subheading}>{t('plansLaunch.whatChangesTitle')}</Text>

      <Section style={tierBox}>
        <Text style={tierName}>{t('plansLaunch.tierAllInName')}</Text>
        <Text style={tierPrice}>{t('plansLaunch.tierAllInPrice')}</Text>
        <Text style={tierDesc}>{t('plansLaunch.tierAllInDesc')}</Text>
      </Section>

      <Section style={tierBoxAlt}>
        <Text style={tierName}>{t('plansLaunch.tierFidelityName')}</Text>
        <Text style={tierPrice}>{t('plansLaunch.tierFidelityPrice')}</Text>
        <Text style={tierDesc}>{t('plansLaunch.tierFidelityDesc')}</Text>
      </Section>

      <Text style={paragraph}>{t('plansLaunch.actionText')}</Text>

      <Section style={buttonContainer}>
        <Button style={buttonPrimary} href="https://getqarte.com/dashboard/subscription">
          {t('plansLaunch.cta')}
        </Button>
      </Section>

      <Text style={signature}>{t('plansLaunch.signature')}</Text>
    </BaseLayout>
  );
}

const heading = { color: '#1a1a1a', fontSize: '24px', fontWeight: '700', lineHeight: '1.3', margin: '0 0 24px 0' };
const subheading = { color: '#1a1a1a', fontSize: '18px', fontWeight: '700', margin: '24px 0 12px 0' };
const paragraph = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px 0' };
const reassureBox = { backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '20px 24px', margin: '8px 0 24px 0', borderLeft: '4px solid #059669' };
const reassureBadge = { color: '#059669', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 8px 0' };
const reassureTitle = { color: '#065f46', fontSize: '17px', fontWeight: '700', margin: '0 0 8px 0' };
const reassureText = { color: '#065f46', fontSize: '15px', lineHeight: '1.6', margin: '0' };
const tierBox = { backgroundColor: '#faf5ff', borderRadius: '12px', padding: '20px 24px', margin: '0 0 12px 0', borderLeft: '4px solid #7c3aed' };
const tierBoxAlt = { backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '20px 24px', margin: '0 0 24px 0', borderLeft: '4px solid #94a3b8' };
const tierName = { color: '#1a1a1a', fontSize: '17px', fontWeight: '700', margin: '0 0 4px 0' };
const tierPrice = { color: '#7c3aed', fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0' };
const tierDesc = { color: '#4a5568', fontSize: '14px', lineHeight: '1.6', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '16px 0 28px 0' };
const buttonPrimary = { backgroundColor: '#7c3aed', borderRadius: '8px', color: '#ffffff', fontSize: '15px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, padding: '12px 28px' };
const signature = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '24px 0 0 0' };

export default PlansLaunchEmail;
