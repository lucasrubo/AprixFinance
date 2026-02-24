import { ThemeProvider } from "@/shared/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import "./globals.css";

import { VercelAnalyticsAndSpeed } from "@/shared/components/vercel-analytics-speed";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "var(--background)",
};

export const metadata: Metadata = {
  title: "AprixFinance",
  description: "Plataforma de gestão financeira pessoal com IA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AprixFinance",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", sizes: "152x152", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Detecta e aplica o tema ANTES do primeiro paint — elimina o flash de branco */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Loading overlay — cobre a tela enquanto o JS hidrata */}
        <div id="app-loader" aria-hidden="true">
          <div className="loader-ring" />
        </div>
        <script
          dangerouslySetInnerHTML={{
            // Não remove o nó do DOM — só esconde via CSS.
            // Remover causaria hydration mismatch pois o React ainda espera encontrá-lo.
            __html: `(function(){function h(){var l=document.getElementById('app-loader');if(l){l.style.opacity='0';l.style.pointerEvents='none';}}if(document.readyState==='complete'){setTimeout(h,200)}else{window.addEventListener('load',function(){setTimeout(h,200)})}})()`,
          }}
        />
        <ThemeProvider />
        {children}
        <VercelAnalyticsAndSpeed />
      </body>
    </html>
  );
}
