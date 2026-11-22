import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await sql`SELECT prune_store_traffic()`;
    return NextResponse.json({ ok: true, retentionDays: 90 });
  } catch (error) {
    console.error('ForgePilot cleanup failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 503 });
  }
}
