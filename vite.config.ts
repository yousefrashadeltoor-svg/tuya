import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev
export default defineConfig({
  plugins: [react()],
  // السطر بالأسفل يضمن تشغيل مسارات الـ CSS والـ JS والصور بشكل صحيح عند الرفع على GitHub Pages باسم tuya
  base: '/tuya/', 
})
