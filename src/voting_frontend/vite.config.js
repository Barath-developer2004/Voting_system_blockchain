import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import EnvironmentPlugin from 'vite-plugin-environment';

export default defineConfig({
    plugins: [
        react(),
        EnvironmentPlugin({
            NODE_ENV: '',
            DFX_NETWORK: '',
            CANISTER_ID: '',
            CANISTER_ID_VOTING_BACKEND: '',
            CANISTER_ID_VOTING_FRONTEND: '',
            CANISTER_ID_INTERNET_IDENTITY: ''
        })
    ],
    define: {
        'global': 'window',
        'process.env': {}
    },
    server: {
        proxy: {
            '/api': 'http://localhost:4943',
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
});
