/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost:9001" },
      { hostname: "s3-file-service-dev-masum.s3.eu-central-1.amazonaws.com" },
    ],
  },
};

export default nextConfig;
