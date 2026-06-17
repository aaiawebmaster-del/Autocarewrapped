import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { mockWrappedApiPlugin } from './server/vite-plugin'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    mockWrappedApiPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false,
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lottie-web') || id.includes('node_modules/lottie-react')) {
            return 'lottie-vendor';
          }
          if (id.includes('driving-animation-background.json')) return 'lottie-driving';
          if (id.includes('gps-navigation-map.json')) return 'lottie-gps-map';
          if (
            id.includes('car-battery.json') ||
            id.includes('wheel-alignment-service.json') ||
            id.includes('imports/tire.json')
          ) {
            return 'lottie-hood';
          }
          if (id.includes('FullDiagnosticsPanel')) return 'diagnostics';
          if (id.includes('JourneyNavMapAnimation')) return 'journey-map';
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
