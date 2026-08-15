// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState<'pipeline' | 'pricing' | 'users' | 'stocks' | 'system'>('pipeline');
  const [loading, setLoading] = useState(false);

  // DB Data States
  const [pipelineLogs, setPipelineLogs] = useState<any[]>([]);
  const [pricingParams, setPricingParams] = useState({ view_weight: '0.4', like_weight: '0.3', chart_weight: '0.3' });
  const [users, setUsers] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPipelineData(),
      fetchUsers(),
      fetchStocks()
    ]);
    setLoading(false);
  };

  // 1. Pipeline Operations (collector.py)
  const fetchPipelineData = async () => {
    const { data: logs } = await supabase.from('pipeline_logs').select('*').order('created_at', { ascending: false }).limit(10);
    if (logs) setPipelineLogs(logs);
  };

  const triggerManualCollector = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke('trigger-collector');
    setLoading(false);
    if (error) alert(`수집 트리거 실패: ${error.message}`);
    else alert('⚡ collector.py 데이터 수집 작업이 성공적으로 시작되었습니다.');
  };

  // 2. Pricing Engine Controls (pricing_engine.py)
  const savePricingParameters = async () => {
    const { error } = await supabase.from('system_config').upsert({ id: 'pricing_weights', value: pricingParams });
    if (error) alert(`설정 저장 실패: ${error.message}`);
    else alert('가치 산정 알고리즘 가중치가 적용되었습니다.');
  };

  const overrideStockPrice = async (stockId: string) => {
    const newPrice = prompt('새로운 수동 조정 주가를 입력하세요 (KRW):');
    if (!newPrice) return;
    
    const { error } = await supabase.from('stocks').update({ price: parseFloat(newPrice), is_overridden: true }).eq('id', stockId);
    if (error) alert(`보정 실패: ${error.message}`);
    else {
      alert('주가가 성공적으로 보정되었습니다.');
      fetchStocks();
    }
  };

  // 3. User & Corporation Balance
  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    if (data) setUsers(data);
  };

  const grantSeedMoney = async (userId: string, amount: number) => {
    const { error } = await supabase.rpc('add_user_balance', { user_id: userId, amount_to_add: amount });
    if (error) alert(`시드머니 지급 실패: ${error.message}`);
    else {
      alert(`${amount.toLocaleString()} KRW 시드머니가 지급되었습니다.`);
      fetchUsers();
    }
  };

  // 4. Stock & Lockup Control (D-7 Lockup)
  const fetchStocks = async () => {
    const { data } = await supabase.from('stocks').select('*');
    if (data) setStocks(data);
  };

  const toggleLockup = async (stockId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('stocks').update({ lockup_active: !currentStatus }).eq('id', stockId);
    if (error) alert(`락업 변경 실패: ${error.message}`);
    else fetchStocks();
  };

  // 5. System Broadcast & Push Notification
  const sendPushNotification = async () => {
    if (!pushTitle || !pushBody) return alert('제목과 내용을 모두 입력하세요.');
    const { error } = await supabase.from('notifications').insert([{ title: pushTitle, body: pushBody, target: 'ALL' }]);
    if (error) alert(`발송 실패: ${error.message}`);
    else {
      alert('📢 전체 사용자 푸시 알림이 발송되었습니다.');
      setPushTitle(''); setPushBody('');
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-xl font-bold text-sky-400 mb-8">SoundStock Executive</h1>
          <nav className="space-y-2">
            <button
              onClick={() => setCurrentTab('pipeline')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${currentTab === 'pipeline' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              🔄 파이프라인/수집
            </button>
            <button
              onClick={() => setCurrentTab('pricing')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${currentTab === 'pricing' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              📈 가격 엔진 제어
            </button>
            <button
              onClick={() => setCurrentTab('users')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${currentTab === 'users' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              👥 주식회사(유저) 관리
            </button>
            <button
              onClick={() => setCurrentTab('stocks')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${currentTab === 'stocks' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              🎵 종목 & 락업(D-7)
            </button>
            <button
              onClick={() => setCurrentTab('system')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${currentTab === 'system' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              📢 공지 & 푸시 알림
            </button>
          </nav>
        </div>
        <button
          onClick={fetchInitialData}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
        >
          🔄 Live DB 동기화
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-lg font-semibold text-blue-600 animate-pulse">Supabase 데이터 동기화 중...</div>
          </div>
        ) : (
          <>
            {/* Tab 1: Pipeline Operations */}
            {currentTab === 'pipeline' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">데이터 수집 및 파이프라인 Operations</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">수동 수집 실행 (Manual Trigger)</h3>
                  <button
                    onClick={triggerManualCollector}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg transition"
                  >
                    ⚡ 즉시 collector.py 수집 실행
                  </button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">최근 파이프라인 실행 로그</h3>
                  <div className="space-y-3">
                    {pipelineLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs font-bold rounded mr-3 ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.status || 'INFO'}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{log.message || '데이터 수집 완료'}</span>
                        </div>
                        <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Pricing Engine Control */}
            {currentTab === 'pricing' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">가치 산정 알고리즘 제어 (pricing_engine.py)</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 max-w-xl">
                  <h3 className="text-lg font-bold">가중치 변수 수정</h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">조회수 가중치 (View Weight)</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded-lg"
                      value={pricingParams.view_weight}
                      onChange={(e) => setPricingParams({ ...pricingParams, view_weight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">좋아요 가중치 (Like Weight)</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded-lg"
                      value={pricingParams.like_weight}
                      onChange={(e) => setPricingParams({ ...pricingParams, like_weight: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={savePricingParameters}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    파라미터 적용
                  </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold mb-4">이상치 종목 가격 수동 보정 (Override)</h3>
                  <div className="divide-y">
                    {stocks.map((stock) => (
                      <div key={stock.id} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{stock.title}</p>
                          <p className="text-xs text-slate-500">{stock.artist} | 현재가: ₩{stock.price?.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => overrideStockPrice(stock.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded transition"
                        >
                          가격 수동 수정
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: User & Corporation Management */}
            {currentTab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">주식회사(사용자) 현황 및 예수금 제어</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="divide-y">
                    {users.map((user) => (
                      <div key={user.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-base">{user.company_name || user.name || '무명 주식회사'}</p>
                          <p className="text-xs text-slate-500">{user.email} | 보유 현금: ₩{user.balance?.toLocaleString() || 0}</p>
                        </div>
                        <button
                          onClick={() => grantSeedMoney(user.id, 1000000)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition"
                        >
                          +1,000,000 KRW 지급
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Stocks & Lockup Management */}
            {currentTab === 'stocks' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">상장 종목 & 매도 락업(D-7) 제어</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="divide-y">
                    {stocks.map((stock) => (
                      <div key={stock.id} className="py-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold">{stock.title}</p>
                          <p className="text-xs text-slate-500">{stock.artist} | 락업 상태: {stock.lockup_active ? '🔒 락업 중 (매도 제한)' : '🔓 해제됨'}</p>
                        </div>
                        <button
                          onClick={() => toggleLockup(stock.id, stock.lockup_active)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded transition ${stock.lockup_active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                        >
                          {stock.lockup_active ? '락업 해제' : '락업 설정'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Broadcast & Notifications */}
            {currentTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">시스템 공지 및 푸시 알림 발송</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-xl space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">알림 제목</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded-lg"
                      placeholder="예: 신규 음악 주식 상장 안내"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">알림 내용</label>
                    <textarea
                      className="w-full border p-2 rounded-lg h-24"
                      placeholder="앱 사용자 전체에게 전달할 메시지를 입력하세요."
                      value={pushBody}
                      onChange={(e) => setPushBody(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={sendPushNotification}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg transition"
                  >
                    전체 푸시 알림 발송
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}