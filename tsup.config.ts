import { defineConfig } from 'tsup';

export default defineConfig({
    // Entry points for all exports
    entry: {
        // Main entry point
        index: 'emails/index.ts',

        // Core utilities
        renderer: 'emails/renderer.tsx',
        // helper: 'emails/helper.ts',
        registry: 'emails/registry.ts',

        // Templates
        'templates/welcome-verify/index': 'emails/templates/welcome-verify/index.tsx',
        'templates/reset-password/index': 'emails/templates/reset-password/index.tsx',

        // Kit components
        'kit/components/button': 'emails/kit/components/button.tsx',
        'kit/components/footer': 'emails/kit/components/footer.tsx',
        'kit/components/header': 'emails/kit/components/header.tsx',
        'kit/components/layout': 'emails/kit/components/layout.tsx',
        'kit/components/typography': 'emails/kit/components/typography.tsx',

        // Kit utilities
        'kit/tokens': 'emails/kit/tokens.ts',
        'kit/types': 'emails/kit/types.ts',
        'kit/tailwind': 'emails/kit/tailwind.ts',
    },

    // Output both CommonJS and ESM formats
    format: ['cjs', 'esm'],

    // Generate TypeScript declaration files
    dts: {
        resolve: true,
        // Resolve external types
        compilerOptions: {
            incremental: false,
            composite: false,
            declaration: true,
            declarationMap: true,
        }
    },

    // Don't split into chunks (better for library distribution)
    splitting: false,

    // Generate source maps for debugging
    sourcemap: true,

    // Clean output directory before build
    clean: true,

    // Output directory
    outDir: 'package/dist',

    // External dependencies (don't bundle these)
    external: [
        'react',
        'react-dom',
        '@react-email/components',
        '@react-email/tailwind',
        'nodemailer',
        'zod'
    ],

    // Skip node_modules from bundling
    noExternal: [],

    // ESBuild options
    esbuildOptions(options) {
        // Enable JSX automatic runtime
        options.jsx = 'automatic';

        // Target modern Node.js
        options.platform = 'node';
        options.target = 'node18';
    },

    // Minify production builds
    minify: process.env.NODE_ENV === 'production',

    // Keep original file names in output
    keepNames: true,

    // Tree shaking
    treeshake: true,
});