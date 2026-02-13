import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ProductUpdateEmail } from '../src/emails/index';

async function main() {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.log('NO RESEND_API_KEY'); process.exit(1); }

  const resend = new Resend(key);

  console.log('Rendering email...');
  const html = await render(ProductUpdateEmail({ shopName: 'Light on Nails Cambrai', merchantId: 'demo-onglerie', referralCode: 'QARTE-AB3K' }));
  const text = await render(ProductUpdateEmail({ shopName: 'Light on Nails Cambrai', merchantId: 'demo-onglerie', referralCode: 'QARTE-AB3K' }), { plainText: true });

  console.log('Sending email...');
  const { data, error } = await resend.emails.send({
    from: 'Qarte <notifications@getqarte.com>',
    to: 'menphis1er@gmail.com',
    subject: 'Light on Nails Cambrai, découvrez les nouveautés Qarte de la semaine',
    html,
    text,
  });

  if (error) {
    console.error('ERROR:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log('OK:', JSON.stringify(data));
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
