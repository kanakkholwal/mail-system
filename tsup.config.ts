import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry points for all exports
  entry: {
    // Main entry point
    index: 'emails/index.ts',
    
    // Core utilities
    renderer: 'emails/renderer.tsx',
    registry: 'emails/registry.ts',
    // Note: helper.ts excluded - it depends on project-specific config
    
    // Templates
    'templates/welcome-verify/index': 'emails/templates/welcome-verify/index.tsx',
    'templates/welcome-verify/schema': 'emails/templates/welcome-verify/schema.ts',
    'templates/reset-password/index': 'emails/templates/reset-password/index.tsx',
    'templates/reset-password/schema': 'emails/templates/reset-password/schema.ts',
    
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
  
  // Generate TypeScript declaration files with fixed config
  dts: {
    resolve: true,
  },
  
  // Don't split into chunks (better for library distribution)
  splitting: false,
  
  // Generate source maps for debugging (set to false to reduce size by ~40%)
  sourcemap: process.env.BUILD_MODE === 'production' ? false : true,
  
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
  
  // TypeScript config override
  tsconfig: './tsconfig.json',
  
  // ESBuild options
  esbuildOptions(options) {
    // Enable JSX automatic runtime
    options.jsx = 'automatic';
    
    // Target modern Node.js
    options.platform = 'node';
    options.target = 'node18';
  },
  
  // Minify production builds (reduces size significantly)
  minify: process.env.BUILD_MODE === 'production',
  
  // Keep original file names in output
  keepNames: true,
  
  // Tree shaking
  treeshake: true,
  
  // Silence warnings
  silent: false,
  
});