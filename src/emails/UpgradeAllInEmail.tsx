import {
  Button,
  Heading,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';
import { getEmailT, type EmailLocale } from './translations';

export type UpgradeTrigger = 'sms_campaign_blocked' | 'booking_request_manual';

interface UpgradeAllInEmailProps {
  shopName: string;
  trigger: UpgradeTrigger;
  /** Contexte spécifique au trigger (ex: nombre de demandes résa, nom de la campagne) */
  triggerContext?: string;
  locale?: EmailLocale;
}

/**
 * Paywall upgrade Fidélité → Tout-en-un.
 * Plan v2 §4 UpgradeAllInEmail + skill paywall-upgrade-cro.
 *
 * Structure 7 composants (headline, value demo, feature diff, pricing,
 * social proof, CTA, escape hatch).
 */
export function UpgradeAllInEmail({ shopName, trigger, triggerContext, locale = 'fr' }: UpgradeAllInEmailProps) {
  const t = getEmailT(locale);
  const triggerKey = `upgradeAllIn.triggers.${trigger}` as const;

  return (
    <BaseLayout preview={t(`${triggerKey}.preview`, { shopName, context: triggerContext || '' })} locale={locale}>
      <Heading style={heading}>
        {t(`${triggerKey}.heading`, { shopName, context: triggerContext || '' })}
      </Heading>

      <Text style={paragraph} dangerouslySetInnerHTML={{ __html: t('upgradeAllIn.greeting', { shopName }) }} />

      <Text style={paragraph}>
        {t(`${triggerKey}.hook`, { shopName, context: triggerContext || '' })}
      </Text>

      <Section style={pivotBox}>
        <Text style={pivotText}>{t('upgradeAllIn.pivot')}</Text>
      </Section>

      <Section style={diffBox}>
        <Text style={diffTitle}>{t('upgradeAllIn.diffTitle')}</Text>
        <Text style={diffLine}><strong style={diffStrong}>+</strong> {t('upgradeAllIn.diffBooking')}</Text>
        <Text style={diffLine}><strong style={diffStrong}>+</strong> {t('upgradeAllIn.diffMarketingSms')}</Text>
        <Text style={diffLine}><strong style={diffStrong}>+</strong> {t('upgradeAllIn.diffPlanning')}</Text>
        <Text style={diffLine}><strong style={diffStrong}>+</strong> {t('upgradeAllIn.diffVipPrograms')}</Text>
      </Section>

      <Section style={priceBox}>
        <Text style={priceText}>{t('upgradeAllIn.priceText')}</Text>
        <Text style={priceNote}>{t('upgradeAllIn.prorataNote')}</Text>
      </Section>

      <Section style={buttonContainer}>
        <Button
          style={button}
          href={`https://getqarte.com/dashboard/subscription?upgrade=all_in&from=email_${trigger}`}
        >
          {t('upgradeAllIn.cta')}
        </Button>
      </Section>

      <Text style={escapeText}>
        <a href="https://getqarte.com/dashboard/subscription" style={escapeLink}>{t('upgradeAllIn.escape')}</a>
      </Text>

      <Text style={signature}>{t('upgradeAllIn.signature')}</Text>
    </BaseLayout>
  );
}

const heading = { color: '#1a1a1a', fontSize: '24px', fontWeight: '600', lineHeight: '1.3', margin: '0 0 24px 0' };
const paragraph = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '0 0 16px 0' };
const pivotBox = { backgroundColor: '#fef3c7', borderRadius: '10px', padding: '14px 20px', margin: '20px 0', borderLeft: '4px solid #f59e0b' };
const pivotText = { color: '#92400e', fontSize: '15px', fontWeight: '500' as const, lineHeight: '1.5', margin: '0' };
const diffBox = { backgroundColor: '#faf5ff', borderRadius: '12px', padding: '20px 24px', margin: '24px 0', borderLeft: '4px solid #7c3aed' };
const diffTitle = { color: '#1a1a1a', fontSize: '15px', fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 14px 0' };
const diffLine = { color: '#4a5568', fontSize: '15px', lineHeight: '1.6', margin: '0 0 6px 0' };
const diffStrong = { color: '#7c3aed', fontWeight: '800' as const, marginRight: '4px' };
const priceBox = { textAlign: 'center' as const, margin: '28px 0' };
const priceText = { color: '#1a1a1a', fontSize: '20px', fontWeight: '700' as const, margin: '0 0 6px 0' };
const priceNote = { color: '#8898aa', fontSize: '13px', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '20px 0 16px 0' };
const button = { backgroundColor: '#7c3aed', borderRadius: '8px', color: '#ffffff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, padding: '14px 32px' };
const escapeText = { textAlign: 'center' as const, margin: '0 0 24px 0' };
const escapeLink = { color: '#8898aa', fontSize: '13px', textDecoration: 'underline' };
const signature = { color: '#4a5568', fontSize: '16px', lineHeight: '1.6', margin: '24px 0 0 0' };

export default UpgradeAllInEmail;
