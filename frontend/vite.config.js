import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceDirectory = fileURLToPath(new URL('./src', import.meta.url))

const PUBLIC_SITE_URL = (
  process.env.VITE_PUBLIC_SITE_URL ||
  'https://safehouse-pull.emergent.host'
).replace(/\/+$/, '')

function injectPublicSiteUrl() {
  return {
    name: 'inject-public-site-url',
    transformIndexHtml(html) {
      return html.replaceAll('__PUBLIC_SITE_URL__', PUBLIC_SITE_URL)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectPublicSiteUrl()],
  resolve: {
    alias: {
      '@': path.resolve(sourceDirectory),
    },
  },
  build: {
    // Rolldown menganalisis simbol yang terpakai lalu meneruskannya ke
    // minifier CSS (lightningcss) untuk membuang rule "tak terpakai".
    // Aplikasi ini punya banyak selector yang dibuat saat runtime â€” kelas
    // Leaflet (.leaflet-control-attribution, .leaflet-bottom.leaflet-right)
    // dan atribut body[data-chat-dock] dari ChatbotFab â€” sehingga mekanisme
    // itu menghapus gaya yang justru dipakai halaman. Matikan analisisnya.
    cssTreeshake: false,
    cssMinify: false,
  },
})
