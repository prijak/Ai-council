import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'firebase'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
  server: {
    hmr: process.env.REMOTE_DEV
      // On a remote server (VPS, Codespaces, Gitpod…) set REMOTE_DEV=1
      // so HMR inherits the host automatically — don't pin anything.
      ? true
      // Local dev: pin to avoid rotating ?token= breaking soft-refresh
      : {
          protocol: 'ws',
          host: 'localhost',
          port: 5173,
          clientPort: 5173,
        },
  },
})