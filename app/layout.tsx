import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SoundStock Admin Console',
  description: '사운드스톡 통합 관리자 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-900 text-slate-100 min-h-screen font-sans">{children}</body>
    </html>
  );
}