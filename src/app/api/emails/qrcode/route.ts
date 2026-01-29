import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { QRCodeEmail } from '@/emails';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { email, menuUrl, businessName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!resend) {
      console.log('Resend not configured, skipping email send');
      return NextResponse.json({ success: true, skipped: true });
    }

    const html = await render(QRCodeEmail({
      menuUrl: menuUrl || undefined,
      businessName: businessName || undefined,
    }));

    const { error } = await resend.emails.send({
      from: 'Qarte <noreply@getqarte.com>',
      to: email,
      replyTo: 'contact@getqarte.com',
      subject: '📱 Votre QR code menu est pret !',
      html,
    });

    if (error) {
      console.error('Error sending QR code email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QR code email error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
