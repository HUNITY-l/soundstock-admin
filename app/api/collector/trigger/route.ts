import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { stockId } = body;
    const supabaseAdmin = getServiceSupabase();

    const { data: log, error: logError } = await supabaseAdmin
      .from('pipeline_logs')
      .insert({
        target_stock_id: stockId || null,
        status: 'RUNNING',
        triggered_by: 'ADMIN_MANUAL',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) throw logError;

    return NextResponse.json({ success: true, message: '트리거 성공', logId: log.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}