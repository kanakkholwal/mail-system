import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: false,
  // The workspace packages are bundled so the deployed output is one file plus
  // runtime deps, with no reliance on a sibling package's build artefacts.
  noExternal: ['@better-mailer/emails', '@better-mailer/delivery'],
  external: ['react', 'react/jsx-runtime', '@unlayer/react-elements', 'zod', 'hono', '@hono/node-server', 'nodemailer'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.platform = 'node';
    options.target = 'node20';
  },
});
