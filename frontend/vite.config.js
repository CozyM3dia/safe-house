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
    rollupOptions: {
      output: {
        // Vendor stabil dipisah dari kode aplikasi: react & framer-motion
        // dipakai semua route, jadi chunk-nya di-cache browser antar halaman
        // dan antar deploy (nama file ber-hash, isi jarang berubah).
        // Kode aplikasi sendiri tetap terbelah per route via React.lazy.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) {
            return 'vendor-motion';
          }
          if (/[\\/]node_modules[\\/](zustand|@tanstack[\\/]react-query)[\\/]/.test(id)) {
            return 'vendor-state';
          }
          return undefined;
        },
      },
    },
  },
})
