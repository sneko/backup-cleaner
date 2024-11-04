import path from 'path';
import { defineConfig } from 'tsup';

const entryPattern = path.resolve(__dirname, 'src/index.ts');
const cliPattern = path.resolve(__dirname, 'src/cli/index.ts');

export default defineConfig((options) => {
  return {
    entry: [entryPattern, cliPattern],
    outDir: 'dist',
    // We decided to only package the ESM format, it should be fine since `backup-cleaner` is intended to be used as a CLI, and not directly imported into third-party code
    // Other formats can be reconsidered once Node v22 has more traction, since from this version it's allowed for CJS to import ESM modules
    format: ['esm'],
    // format: ['cjs', 'esm', 'iife'],
    globalName: 'BackupCleaner',
    minify: !options.watch,
    splitting: true,
    split: [],
    dts: true,
    sourcemap: true,
    shims: true,
    banner: {
      // Needed to bundle with ESM format (ref: https://github.com/egoist/tsup/issues/927#issuecomment-2354939322)
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
    outExtension({ format }) {
      return {
        // By default it uses `.js` extension that cannot be run in a standalone way without a package.json aside
        js: `.mjs`,
      };
    },
    clean: true,
    async onSuccess() {},
  };
});
