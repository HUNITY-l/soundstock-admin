import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 클라이언트 사이드 (RLS 적용)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 서버 사이드 / API Route 전용 (Service Role - RLS 우회 관리자 권한)
export const getServiceSupabase = () => {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(SUPABASE_URL, SERVICE_KEY);
};