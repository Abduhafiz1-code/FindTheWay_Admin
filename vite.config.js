import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// FindTheWay_Admin — platforma boshqaruv paneli.
// Boshqa loyihalar bilan to'qnashmasligi uchun 5176-port.
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    port: 5176,
    strictPort: false,
  },
})
