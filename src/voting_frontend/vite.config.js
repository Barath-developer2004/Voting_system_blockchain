import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from dfx-generated .env at project root
function loadDfxEnv() {
    const envVars = {};
    try {
        const envPath = resolve(__dirname, '../../.env');
        const envContent = readFileSync(envPath, 'utf-8');
        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove surrounding quotes
                if ((value.startsWith("'") && value.endsWith("'")) ||
                    (value.startsWith('"') && value.endsWith('"'))) {
                    value = value.slice(1, -1);
                }
                envVars[key] = value;
            }
        }
    } catch (e) {
        console.warn('Could not load .env from project root:', e.message);
    }
    return envVars;
}

const dfxEnv = loadDfxEnv();

// Fail loudly if critical env vars are missing during production build
const isProductionBuild = (dfxEnv.DFX_NETWORK === 'ic') || (process.env.NODE_ENV === 'production');
if (isProductionBuild) {
    if (!dfxEnv.CANISTER_ID_VOTING_BACKEND) {
        throw new Error(
            '\n\n❌ BUILD ERROR: CANISTER_ID_VOTING_BACKEND is not set.\n' +
            '   Run: dfx deploy --network ic && bash generate-env.sh\n'
        );
    }
    if (!dfxEnv.DFX_NETWORK) {
        throw new Error(
            '\n\n❌ BUILD ERROR: DFX_NETWORK is not set in .env file.\n' +
            '   Run: bash generate-env.sh after deploying.\n'
        );
    }
}

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({ include: ['buffer', 'stream', 'crypto', 'util'] }),
    ],
    define: {
        'global': 'globalThis',
        // Inject canister IDs and network info as build-time constants
        'process.env.DFX_NETWORK': JSON.stringify(dfxEnv.DFX_NETWORK || 'local'),
        'process.env.CANISTER_ID_VOTING_BACKEND': JSON.stringify(dfxEnv.CANISTER_ID_VOTING_BACKEND || ''),
        'process.env.CANISTER_ID_VOTING_FRONTEND': JSON.stringify(dfxEnv.CANISTER_ID_VOTING_FRONTEND || ''),
        'process.env.CANISTER_ID_INTERNET_IDENTITY': JSON.stringify(dfxEnv.CANISTER_ID_INTERNET_IDENTITY || ''),
        'process.env.CANISTER_ID': JSON.stringify(dfxEnv.CANISTER_ID || ''),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
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
