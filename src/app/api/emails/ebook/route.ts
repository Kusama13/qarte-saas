import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { EbookEmail } from '@/emails';
import { resend, EMAIL_FROM, EMAIL_REPLY_TO, EMAIL_HEADERS } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const html = await render(EbookEmail({}));
    const text = await render(EbookEmail({}), { plainText: true });

    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      replyTo: EMAIL_REPLY_TO,
      subject: 'Votre guide de fidélisation est prêt',
      html,
      text,
      headers: EMAIL_HEADERS,
    });

    if (error) {
      console.error('Error sending ebook email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ebook email error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
