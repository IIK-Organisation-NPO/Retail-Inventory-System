
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'prompt',

      manifest: {
        name: 'SpazaNet',
        short_name: 'SpazaNet',
        description: 'Stock, sales and group buying for rural stores.',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,gif,woff,woff2,ttf}'
        ],

        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/\.auth\//
        ]
      }
    })
  ]
})
