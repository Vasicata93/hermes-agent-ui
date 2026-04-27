import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  console.log('GEMINI_API_KEY exists:', !!env.GEMINI_API_KEY);
  return {
    plugins: [
      react(),
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   injectRegister: 'auto',
      //   devOptions: {
      //       enabled: true
      //   },
      //   includeAssets: ['logo.svg'],
      //   manifest: {
      //     name: 'Perplex Clone',
      //     short_name: 'Perplex',
      //     description: 'A high-fidelity clone of Perplex AI featuring local-first data storage and multi-model support.',
      //     theme_color: '#202222',
      //     background_color: '#191A1A',
      //     display: 'standalone',
      //     orientation: 'portrait',
      //     scope: '/',
      //     start_url: '/',
      //     lang: 'en',
      //     icons: [
      //       {
      //         src: 'logo.svg',
      //         sizes: '64x64 32x32 24x24 16x16 192x192 512x512',
      //         type: 'image/svg+xml',
      //         purpose: 'any'
      //       },
      //       {
      //         src: 'logo.svg',
      //         sizes: '192x192 512x512',
      //         type: 'image/svg+xml',
      //         purpose: 'maskable'
      //       }
      //     ]
      //   },
      //   workbox: {
      //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      //   }
      // })
    ],
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});