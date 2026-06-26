import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Для GitHub Pages приложение живёт по подпути /zapisi-klientov/.
// На корневых хостингах (Netlify) база остаётся '/'.
const base = process.env.GH_PAGES ? '/zapisi-klientov/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Записи клиентов',
        short_name: 'Записи',
        description: 'Учёт записей клиентов на макияж и причёски',
        lang: 'ru',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#fff5f8',
        theme_color: '#e89bb4',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
