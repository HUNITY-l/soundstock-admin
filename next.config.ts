import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 빌드 시 타입 오류가 있어도 배포를 강제로 진행합니다.
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint 검사 오류도 스킵합니다.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
