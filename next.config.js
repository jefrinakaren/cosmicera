/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'earthobservatory.nasa.gov' },
      { hostname: '*.nasa.gov' }
    ]
  }
};
module.exports = nextConfig;
