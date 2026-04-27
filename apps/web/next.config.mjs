/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Standalone-output для Docker-deploy (issue #320 [devops:vika]):
  // Next.js собирает минимальный self-contained bundle в .next/standalone/.
  // outputFileTracingRoot — указываем корень monorepo, чтобы tracing подтянул
  // пакеты из pnpm-workspace (packages/shared/dist/).
  output: 'standalone',
  experimental: {
    typedRoutes: true,
    outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  },
};

export default nextConfig;
