/**
 * GiftCardPDF — Template A5 imprimable du bon cadeau.
 *
 * Style "papier cadeau premium" inspiré du modal récap : fond ivoire
 * texturé, liseré dashed couleur merchant, typo serif pour le montant /
 * prestation, sceau "BON CADEAU" en haut, code GIFT-XXXXXX en mono en bas.
 *
 * Rendu via @react-pdf/renderer côté serveur, retourne un Buffer.
 */

import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import * as React from 'react';

interface GiftCardPDFProps {
  shopName: string;
  shopAddress?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  // Cadeau
  amountFormatted: string;
  servicesLabel?: string | null;
  serviceNames?: string[];
  // Personnes
  senderFullName: string;
  recipientFullName: string;
  senderMessage?: string | null;
  // Validité
  code: string;
  expiresAtFormatted: string;
  locale?: 'fr' | 'en';
}

export function GiftCardPDF({
  shopName,
  shopAddress,
  primaryColor = '#4b0082',
  secondaryColor = '#ec4899',
  amountFormatted,
  servicesLabel,
  serviceNames,
  senderFullName,
  recipientFullName,
  senderMessage,
  code,
  expiresAtFormatted,
  locale = 'fr',
}: GiftCardPDFProps) {
  const isEn = locale === 'en';
  const styles = makeStyles(primaryColor, secondaryColor);

  return (
    <Document title={`Bon cadeau ${shopName} ${code}`} author="Qarte">
      <Page size="A5" style={styles.page}>
        {/* Liseré décoratif intérieur */}
        <View style={styles.borderFrame} />

        <View style={styles.content}>
          {/* Sceau */}
          <View style={styles.sealRow}>
            <View style={styles.sealBox}>
              <Text style={styles.sealText}>
                ✦ {isEn ? 'GIFT CARD' : 'BON CADEAU'} ✦
              </Text>
            </View>
          </View>

          {/* Salon en haut */}
          <Text style={styles.shopName}>{shopName}</Text>
          {shopAddress ? <Text style={styles.shopAddress}>{shopAddress}</Text> : null}

          {/* Contenu principal — montant ou prestations */}
          <View style={styles.giftContent}>
            {servicesLabel ? (
              <>
                {(serviceNames || []).map((name, idx) => (
                  <Text key={idx} style={styles.serviceLine}>
                    {name}
                  </Text>
                ))}
                <Text style={styles.amountSmall}>
                  {isEn ? 'Value' : 'Valeur'} {amountFormatted}
                </Text>
              </>
            ) : (
              <Text style={styles.amountBig}>{amountFormatted}</Text>
            )}
          </View>

          {/* Pour / De la part de */}
          <View style={styles.namesBlock}>
            <Text style={styles.nameLabel}>{isEn ? 'FOR' : 'POUR'}</Text>
            <Text style={styles.nameValue}>{recipientFullName}</Text>
            <Text style={[styles.nameLabel, { marginTop: 10 }]}>
              {isEn ? 'OFFERED BY' : 'OFFERT PAR'}
            </Text>
            <Text style={styles.nameValue}>{senderFullName}</Text>
          </View>

          {/* Mot perso */}
          {senderMessage ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>"{senderMessage}"</Text>
            </View>
          ) : null}

          {/* Spacer pour pousser footer en bas */}
          <View style={{ flexGrow: 1 }} />

          {/* Code + validité */}
          <View style={styles.footer}>
            <View style={styles.codeBlock}>
              <Text style={styles.codeLabel}>{isEn ? 'REFERENCE' : 'RÉFÉRENCE'}</Text>
              <Text style={styles.codeValue}>{code}</Text>
            </View>
            <View style={styles.validBlock}>
              <Text style={styles.codeLabel}>{isEn ? 'VALID UNTIL' : 'VALABLE JUSQU\'AU'}</Text>
              <Text style={styles.validValue}>{expiresAtFormatted}</Text>
            </View>
          </View>

          {/* Powered by */}
          <Text style={styles.poweredBy}>getqarte.com</Text>
        </View>
      </Page>
    </Document>
  );
}

function makeStyles(primary: string, secondary: string) {
  return StyleSheet.create({
    page: {
      backgroundColor: '#fdf9ee',
      padding: 28,
      position: 'relative',
    },
    borderFrame: {
      position: 'absolute',
      top: 14,
      left: 14,
      right: 14,
      bottom: 14,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: `${primary}55`,
      borderRadius: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center',
    },
    sealRow: {
      marginTop: 10,
      marginBottom: 14,
    },
    sealBox: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: `${primary}12`,
    },
    sealText: {
      fontSize: 9,
      fontWeight: 'bold',
      letterSpacing: 2,
      color: primary,
    },
    shopName: {
      fontSize: 13,
      fontWeight: 'bold',
      letterSpacing: 1.5,
      color: primary,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    shopAddress: {
      fontSize: 9,
      color: '#9ca3af',
      marginBottom: 22,
    },
    giftContent: {
      alignItems: 'center',
      marginVertical: 18,
    },
    amountBig: {
      fontFamily: 'Times-Roman',
      fontSize: 64,
      color: '#1a1a1a',
      letterSpacing: -2,
      marginVertical: 8,
    },
    serviceLine: {
      fontFamily: 'Times-Roman',
      fontSize: 22,
      color: '#1a1a1a',
      marginVertical: 1,
      textAlign: 'center',
    },
    amountSmall: {
      fontSize: 10,
      color: '#9ca3af',
      fontStyle: 'italic',
      marginTop: 8,
    },
    namesBlock: {
      alignItems: 'center',
      marginVertical: 18,
    },
    nameLabel: {
      fontSize: 8,
      letterSpacing: 1.2,
      color: '#9ca3af',
      fontWeight: 'bold',
      marginBottom: 3,
    },
    nameValue: {
      fontSize: 14,
      color: '#1f2937',
      fontWeight: 'bold',
    },
    messageBox: {
      width: '85%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: `${secondary}10`,
      borderLeftWidth: 2,
      borderLeftColor: secondary,
      borderRadius: 4,
      marginTop: 10,
    },
    messageText: {
      fontSize: 11,
      color: '#374151',
      fontStyle: 'italic',
      textAlign: 'center',
      lineHeight: 1.5,
    },
    footer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: 14,
      borderTopWidth: 0.5,
      borderTopColor: `${primary}30`,
      marginBottom: 6,
    },
    codeBlock: {
      alignItems: 'flex-start',
    },
    validBlock: {
      alignItems: 'flex-end',
    },
    codeLabel: {
      fontSize: 7,
      letterSpacing: 1,
      color: '#9ca3af',
      fontWeight: 'bold',
      marginBottom: 2,
    },
    codeValue: {
      fontFamily: 'Courier',
      fontSize: 12,
      color: '#1f2937',
      fontWeight: 'bold',
      letterSpacing: 1.5,
    },
    validValue: {
      fontSize: 11,
      color: '#1f2937',
      fontWeight: 'bold',
    },
    poweredBy: {
      fontSize: 7,
      color: '#9ca3af',
      textAlign: 'center',
      marginTop: 4,
    },
  });
}

export default GiftCardPDF;
