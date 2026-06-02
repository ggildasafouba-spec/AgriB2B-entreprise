/** @type {import('next').NextConfig} */
const nextConfig = {
  // En production sur Vercel, pas besoin de 'standalone' (Vercel gère le build)
  // En Docker, on garde standalone
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  async headers() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
    ];
  },
  async rewrites() {
    // En production : NEXT_PUBLIC_API_URL pointe directement vers le backend déployé
    // En local/Docker : on utilise le proxy
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
};

module.exports = nextConfig;
