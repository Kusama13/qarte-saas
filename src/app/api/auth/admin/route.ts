import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { secretCode } = await request.json();

    const adminSecretCode = process.env.ADMIN_SECRET_CODE;

    if (!adminSecretCode) {
      console.error('ADMIN_SECRET_CODE not configured');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    if (secretCode !== adminSecretCode) {
      return NextResponse.json(
        { error: 'Invalid secret code' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
