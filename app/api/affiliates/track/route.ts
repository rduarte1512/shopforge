import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code, storeId } = await request.json();

    if (!code || !storeId) {
      return NextResponse.json(
        { error: 'Missing code or storeId' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Buscar o link de afiliado
    const { data: link, error: linkError } = await supabase
      .from('affiliate_links')
      .select('id, store_id, name, active, click_count')
      .eq('code', code.toUpperCase())
      .eq('store_id', storeId)
      .eq('active', true)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Invalid affiliate code' },
        { status: 404 }
      );
    }

    // Incrementar click_count
    const { error: updateError } = await supabase
      .from('affiliate_links')
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq('id', link.id);

    if (updateError) {
      console.error('Error updating click count:', updateError);
    }

    // Registrar clique
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    await supabase.from('affiliate_clicks').insert({
      affiliate_link_id: link.id,
      user_agent: userAgent,
      referrer: referer,
    });

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