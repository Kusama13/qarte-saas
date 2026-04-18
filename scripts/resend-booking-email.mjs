/**
 * One-off script: Resend booking notification email for a specific slot
 * Usage: SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/resend-booking-email.mjs <slotId>
 */

const SUPABASE_URL = 'https://deaoytdanrsacmabnnpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const slotId = process.argv[2];

if (!SUPABASE_KEY || !RESEND_KEY) {
  console.error('Missing env vars. Run with: SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/resend-booking-email.mjs <slotId>');
  process.exit(1);
}
if (!slotId) {
  console.error('Usage: node scripts/resend-booking-email.mjs <slotId>');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// 1. Fetch slot + merchant
const slotRes = await fetch(
  `${SUPABASE_URL}/rest/v1/merchant_planning_slots?id=eq.${slotId}&select=*,merchants(shop_name,user_id,locale,deposit_percent,deposit_amount,deposit_link,deposit_link_2,deposit_link_label,deposit_link_2_label)`,
  { headers }
);
const slots = await slotRes.json();
if (!slots.length) { console.error('Slot not found'); process.exit(1); }
const slot = slots[0];
const merchant = slot.merchants;
console.log(`Slot: ${slot.slot_date} ${slot.start_time} — client: ${slot.client_name}`);

// 2. Fetch merchant email via admin API
const userRes = await fetch(
  `${SUPABASE_URL}/auth/v1/admin/users/${merchant.user_id}`,
  { headers }
);
const userData = await userRes.json();
const merchantEmail = userData?.email;
if (!merchantEmail) { console.error('Merchant email not found'); process.exit(1); }
console.log(`Sending to: ${merchantEmail}`);

// 3. Fetch services for this slot
const servicesRes = await fetch(
  `${SUPABASE_URL}/rest/v1/planning_slot_services?slot_id=eq.${slotId}&select=service_name,price,duration_minutes`,
  { headers }
);
const services = await servicesRes.json();

const totalDuration = services.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);

// 4. Build deposit info
const depositLink = merchant.deposit_link;
const deposit = depositLink ? {
  link: depositLink,
  percent: merchant.deposit_percent || null,
  amount: merchant.deposit_amount ? Number(merchant.deposit_amount) : null,
} : null;

// 5. Build email HTML manually (simplified — no React renderer in plain Node)
const locale = merchant.locale || 'fr';
const isEn = locale === 'en';
const formattedDate = new Date(slot.slot_date + 'T12:00:00').toLocaleDateString(
  isEn ? 'en-US' : 'fr-FR',
  { weekday: 'long', day: 'numeric', month: 'long' }
);
const serviceList = services.map(s => s.service_name).join(', ') || '—';

const subject = isEn
  ? `New booking — ${slot.client_name}`
  : `Nouvelle reservation — ${slot.client_name}`;

const html = `
<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f6f9fc;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:40px">
  <h1 style="color:#1a1a1a;font-size:24px">${isEn ? 'New booking!' : 'Nouvelle réservation !'}</h1>
  <p style="color:#4a5568">${isEn ? `Hi ${merchant.shop_name}, ${slot.client_name} just booked an appointment.` : `Bonjour ${merchant.shop_name}, ${slot.client_name} vient de réserver un créneau depuis ta vitrine en ligne.`}</p>
  <div style="background:#F0F4FF;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #C7D2FE">
    <p style="color:#4338CA;font-size:14px;font-weight:700;text-transform:uppercase;margin:0 0 12px">
      ${isEn ? 'Booking details' : 'Détails de la réservation'}
    </p>
    <p style="color:#374151;margin:0 0 6px"><strong>${isEn ? 'Date:' : 'Date :'}</strong> ${formattedDate}</p>
    <p style="color:#374151;margin:0 0 6px"><strong>${isEn ? 'Time:' : 'Heure :'}</strong> ${slot.start_time}</p>
    <p style="color:#374151;margin:0 0 6px"><strong>${isEn ? 'Services:' : 'Prestations :'}</strong> ${serviceList}</p>
    <p style="color:#374151;margin:0 0 6px"><strong>${isEn ? 'Duration:' : 'Durée :'}</strong> ${totalDuration}min</p>
    <p style="color:#374151;margin:0 0 6px"><strong>${isEn ? 'Price:' : 'Prix :'}</strong> ${totalPrice}€</p>
    <p style="color:#374151;margin:0"><strong>${isEn ? 'Phone:' : 'Téléphone :'}</strong> ${slot.client_phone || '—'}</p>
  </div>
  ${deposit?.amount ? `
  <div style="background:#FEF3C7;border-radius:12px;padding:16px;margin:0 0 24px;border:1px solid #F59E0B;text-align:center">
    <p style="color:#92400E;font-size:14px;font-weight:600;margin:0 0 4px">
      ${isEn ? `Deposit requested: ${deposit.amount}€` : `Acompte demandé : ${deposit.amount}€`}
    </p>
    <p style="color:#78350F;font-size:13px;margin:0">
      ${isEn ? `Remaining: ${totalPrice - deposit.amount}€` : `Solde restant dû : ${totalPrice - deposit.amount}€`}
    </p>
  </div>` : ''}
  <div style="text-align:center;margin:32px 0">
    <a href="https://getqarte.com/dashboard/planning" style="background:#4b0082;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">
      ${isEn ? 'View in planning' : 'Voir dans le planning'}
    </a>
  </div>
  <p style="color:#4a5568">${isEn ? 'The Qarte team' : "L'équipe Qarte"}</p>
</div>
</body></html>`;

// 6. Send via Resend
const sendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'Qarte <notifications@getqarte.com>',
    to: merchantEmail,
    reply_to: 'support@getqarte.com',
    subject,
    html,
  }),
});
const sendData = await sendRes.json();
if (sendRes.ok) {
  console.log(`✓ Email sent successfully (id: ${sendData.id})`);
} else {
  console.error('✗ Send failed:', sendData);
}
