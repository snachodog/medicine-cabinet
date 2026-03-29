import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const commitHash = (() => {
  if (process.env.COMMIT_HASH) return process.env.COMMIT_HASH.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();

const stampSw = {
  name: 'stamp-sw',
  closeBundle() {
    const swPath = resolve(__dirname, 'dist/sw.js');
    try {
      const src = readFileSync(swPath, 'utf-8');
      writeFileSync(swPath, src.replace("'mc-v1'", `'mc-${commitHash}'`));
    } catch {
      // sw.js not present in dev mode
    }
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), stampSw],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      }
    }
  }
})
