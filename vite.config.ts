import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Debug logging
console.log('Vite config loading...');
console.log('Current working directory:', process.cwd());

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'debug-build',
      buildStart() {
        console.log('Build starting...');
        console.log('Resolved aliases:', {
          '@': path.resolve(__dirname, './src')
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Log all build warnings
        console.log('Build warning:', warning);
        defaultHandler(warning);
      }
    }
  }
});
