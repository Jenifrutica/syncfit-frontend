/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export (S3 + CloudFront): every page is a client component and the
  // session lives in localStorage, so no Node server is needed.
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
