/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // Configuração para compatibilidade com Turbopack no Next.js 16+
  turbopack: {},
};

module.exports = withPWA(nextConfig);
