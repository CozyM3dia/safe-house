import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceDirectory = fileURLToPath(new URL('./src', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
    cssMinify: true,
  },
})
