/** @type {import('next').NextConfig} */
//const isGithubPages = process.env.CAPACITOR_BUILD !== 'true' && process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: '', // Keep this empty for local Capacitor builds
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;