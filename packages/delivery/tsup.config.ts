import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  // Declarations come from tsc; tsup's rollup-plugin-dts breaks on TypeScript 7.
  dts: false,
  outDir: 'dist',
  clean: true,
  splitting: false,
  treeshake: true,
  sourcemap: true,
  tsconfig: './tsconfig.json',
  external: ['nodemailer', '@aws-sdk/client-sesv2', 'zod'],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node20';
  },
});
