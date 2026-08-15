import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, amount, type, reason } = await req.json();
    const supabaseAdmin = getServiceSupabase();

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('cash_balance, company_name')
      .eq('id', userId)
      .single();

    if (userError || !user) throw new Error('유저를 찾을 수 없습니다.');

    const adjustment = type === 'ADD' ? amount : -amount;
    const newBalance = Math.max(0, user.cash_balance + adjustment);

    await supabaseAdmin
      .from('users')
      .update({ cash_balance: newBalance })
      .eq('id', userId);

    await supabaseAdmin.from('balance_logs').insert({
      user_id: userId,
      change_amount: adjustment,
      balance_after: newBalance,
      reason: reason || '관리자 수동 지급/차감',
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}