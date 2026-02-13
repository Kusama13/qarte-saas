import { render } from '@react-email/render';
import WelcomeEmail from '../src/emails/WelcomeEmail.js';

async function main() {
  const html = await render(WelcomeEmail({ shopName: 'Test Qarte', trialDays: 15 }));
  process.stdout.write(html);
}

main().catch(err => { console.error(err); process.exit(1); });
