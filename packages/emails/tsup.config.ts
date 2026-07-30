import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    registry: 'src/registry.ts',
    render: 'src/render.ts',
    'kit/index': 'src/kit/index.ts',
  },
  format: ['esm', 'cjs'],
  // Declarations come from tsc; tsup's rollup-plugin-dts breaks on TypeScript 7.
  dts: false,
  outDir: 'dist',
  clean: true,
  splitting: false,
  treeshake: true,
  sourcemap: true,
  keepNames: true,
  tsconfig: './tsconfig.json',
  external: ['react', 'react/jsx-runtime', '@unlayer/react-elements', 'zod'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.platform = 'node';
    options.target = 'node20';
  },
});
