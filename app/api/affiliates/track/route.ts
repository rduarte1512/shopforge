import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { code, storeId } = await request.json();

    if (!code || !storeId) {
      return NextResponse.json(
        { error: 'Missing code or storeId' },
        { status: 400 }
      );
    }

    // Buscar o link de afiliado
    const { rows: links } = await sql`
      SELECT id, store_id, name, active, click_count 
      FROM affiliate_links 
      WHERE code = ${code.toUpperCase()} 
      AND store_id = ${storeId} 
      AND active = true 
      LIMIT 1
    `;
    
    const link = links[0];

    if (!link) {
      return NextResponse.json(
        { error: 'Invalid affiliate code' },
        { status: 404 }
      );
    }

    // Incrementar click_count
    await sql`
      UPDATE affiliate_links 
      SET click_count = COALESCE(click_count, 0) + 1 
      WHERE id = ${link.id}
    `;

    // Registrar clique
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    await sql`
      INSERT INTO affiliate_clicks (affiliate_link_id, user_agent, referrer)
      VALUES (${link.id}, ${userAgent}, ${referer})
    `;

    return NextResponse.json({
      success: true,
      linkId: link.id,
    });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
