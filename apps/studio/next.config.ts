import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Elements renders through React on the server; bundling it keeps the RSC
  // graph from trying to treat its CommonJS entry as a client module.
  serverExternalPackages: ['@unlayer/react-elements'],
  // The workspace is on TypeScript 7, whose compiler API Next cannot call directly yet.
  experimental: { useTypeScriptCli: true },
};

export default nextConfig;
