import { NextResponse } from 'next/server';

// DEPRECATED: Reactivation logic is now handled by the morning cron (Section 7).
// This route is kept as a stub to avoid 404s if called directly.
export async function GET() {
  return NextResponse.json({
    deprecated: true,
    message: 'Reactivation is now handled by /api/cron/morning (Section 7)',
  });
}
