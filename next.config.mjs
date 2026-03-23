/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_ACTIONS ? '/preipo-marketplace' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
