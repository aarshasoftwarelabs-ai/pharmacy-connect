import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    plugins: [react()],
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-icons': ['lucide-react'],
                    'vendor-motion': ['framer-motion'],
                },
            },
        },
    },
    server: {
        port: 5173,
        host: true,
    },
});
