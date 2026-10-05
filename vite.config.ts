import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readdir, readFile } from 'node:fs/promises';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), {
      // Existing UI and cached profiles use these stable URLs rather than imports.
      name: 'emit-ui-images',
      apply: 'build',
      async generateBundle() {
        const imageDirectory = path.resolve(import.meta.dirname, 'src/assets/images');
        for (const file of await readdir(imageDirectory)) {
          this.emitFile({
            type: 'asset',
            fileName: `src/assets/images/${file}`,
            source: await readFile(path.join(imageDirectory, file)),
          });
        }
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
