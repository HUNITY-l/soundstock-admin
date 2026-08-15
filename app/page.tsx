'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정 (환경 변수 또는 기본값 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface StockData {
  id?: number;
  ticker: string;
  name?: string;
  price?: number;
  momentum_score?: number;
  updated_at?: string;
}

export default function HomePage() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'high_score'>('all');

  // Supabase 데이터 가져오기
  const fetchStockData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('stocks').select('*');

      if (filter === 'high_score') {
        query = query.gte('momentum_score', 70); // 모멘텀 점수 70점 이상
      }

      const { data, error } = await query.order('momentum_score', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        // DB 연결 실패 시 샘플 데이터 제공 (화면 확인용)
        setStocks([
          { ticker: 'AAPL', name: 'Apple Inc.', price: 224.23, momentum_score: 88, updated_at: new Date().toISOString() },
          { ticker: 'NVDA', name: 'NVIDIA Corp.', price: 128.15, momentum_score: 95, updated_at: new Date().toISOString() },
          { ticker: 'MSFT', name: 'Microsoft Corp.', price: 448.30, momentum_score: 82, updated_at: new Date().toISOString() },
          { ticker: 'TSLA', name: 'Tesla Inc.', price: 254.11, momentum_score: 64, updated_at: new Date().toISOString() },
        ]);
      } else if (data && data.length > 0) {
        setStocks(data);
      } else {
        // 데이터가 없을 경우
        setStocks([]);
      }
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [filter]);

  // 검색 필터링
  const filteredStocks = stocks.filter((s) =>
    s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      {/* 헤더 영역 */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-400">Momentum Pricing Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            파이프라인 분석 데이터 및 모멘텀 기반 주식 트래킹 시스템
          </p>
        </div>
        <button
          onClick={fetchStockData}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
        >
          🔄 데이터 새로고침
        </button>
      </header>

      {/* 필터 및 검색 컨트롤 */}
      <section className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="티커 또는 종목명 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            전체 보기
          </button>
          <button
            onClick={() => setFilter('high_score')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              filter === 'high_score'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🔥 고모멘텀 (70점 이상)
          </button>
        </div>
      </section>

      {/* 데이터 리스트 / 테이블 */}
      <section className="max-w-6xl mx-auto bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <p className="animate-pulse"> 데이터를 불러오는 중입니다...</p>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            조회된 데이터가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-700/50 text-gray-300 text-sm border-b border-gray-700">
                  <th className="p-4">티커 (Ticker)</th>
                  <th className="p-4">종목명</th>
                  <th className="p-4">현재가 ($)</th>
                  <th className="p-4">모멘텀 점수</th>
                  <th className="p-4">업데이트 일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {filteredStocks.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-700/30 transition">
                    <td className="p-4 font-bold text-indigo-300">{item.ticker}</td>
                    <td className="p-4 text-gray-200">{item.name || '-'}</td>
                    <td className="p-4 text-gray-100 font-mono">
                      {item.price ? `$${item.price.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          (item.momentum_score || 0) >= 80
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : (item.momentum_score || 0) >= 50
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {item.momentum_score ?? 'N/A'} 점
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleString('ko-KR')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 푸터 */}
      <footer className="max-w-6xl mx-auto mt-12 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} Momentum Pricing System. Powered by Next.js & Supabase.
      </footer>
    </main>
  );
}