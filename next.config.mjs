console.log('DEBUG loading next.config.mjs');
/** @type {import('next').NextConfig} */
const base = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  generateBuildId: async () => {
    console.log('DEBUG generateBuildId invoked');
    return null;
  },
};
export default function () { return base; }
