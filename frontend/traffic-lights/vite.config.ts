import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/Traffic_Lights_AVSystem/',
  plugins: [react()],
})
