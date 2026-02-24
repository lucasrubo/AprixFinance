/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  turbopack: {},
  eslint: {
    // Biome é usado no lugar do ESLint; desativa a verificação nativa do Next.js
    ignoreDuringBuilds: true,
  },
};

// Only load next-pwa in production to avoid Turbopack conflicts in dev
if (!isDev) {
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
  });
  module.exports = withPWA(nextConfig);
} else {
  module.exports = nextConfig;
}
