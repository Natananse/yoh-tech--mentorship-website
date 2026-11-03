export default {
  output: 'standalone',
  distDir: process.env.YOH_BUILD_DIR || '.next',
  images: { unoptimized: true },
  experimental: { cpus: 2 },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }];
  },
};
