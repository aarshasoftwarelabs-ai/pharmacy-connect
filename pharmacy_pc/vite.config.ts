import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const isElectron = mode === 'electron' || process.env.VITE_TARGET === 'electron';
  const plugins = [react()];

  if (isElectron) {
    const electronPlugin = (await import('vite-plugin-electron/simple')).default;
    plugins.push(
      electronPlugin({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: 'electron/preload.ts',
        },
      })
    );
  }

  return {
    base: isElectron ? './' : '/',
    plugins,
    build: {
      outDir: 'dist',
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});

