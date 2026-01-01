import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  envPrefix: 'REACT_APP_', // Allow REACT_APP_ prefix like Create React App
})
