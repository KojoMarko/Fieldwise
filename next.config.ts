
import type {NextConfig} from 'next';
import { config } from 'dotenv';
import withPWAInit from "@ducanh2912/next-pwa";

config();

const withPWA = withPWAInit({
  dest: "public",
  // This prevents the PWA package from causing a restart loop in development.
  reloadOnOnline: false,
  swcMinify: true,
  // By disabling in dev, we avoid the restart loop. PWA will still work in production.
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https'
        ,
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
