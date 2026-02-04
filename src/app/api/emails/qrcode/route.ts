import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { QRCodeEmail } from '@/emails';
import { resend, EMAIL_FROM, EMAIL_REPLY_TO, EMAIL_HEADERS } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email, menuUrl, businessName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const html = await render(QRCodeEmail({
      menuUrl: menuUrl || undefined,
      businessName: businessName || undefined,
    }));
    const text = await render(QRCodeEmail({
      menuUrl: menuUrl || undefined,
      businessName: businessName || undefined,
    }), { plainText: true });

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      replyTo: EMAIL_REPLY_TO,
      subject: 'Votre QR code menu est prêt',
      html,
      text,
      headers: EMAIL_HEADERS,
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
