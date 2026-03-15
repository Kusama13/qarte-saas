import { sendAnnouncementMaPageEmail } from '../src/lib/email';

async function main() {
  console.log('Sending test announcement email to getqarte@gmail.com...');

  // Test avec abonné (pas de section réabonnement)
  const result = await sendAnnouncementMaPageEmail(
    'getqarte@gmail.com',
    'Salon Test',
    'salon-test',
    true
  );
  console.log('Subscribed version:', JSON.stringify(result, null, 2));

  // Petit délai
  await new Promise(r => setTimeout(r, 1000));

  // Test avec non-abonné (section réabonnement visible)
  const result2 = await sendAnnouncementMaPageEmail(
    'getqarte@gmail.com',
    'Salon Test',
    'salon-test',
    false
  );
  console.log('Non-subscribed version:', JSON.stringify(result2, null, 2));
}

main().catch(console.error);
