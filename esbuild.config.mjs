import { default as chalk } from 'chalk';
import { build } from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { rimraf } from 'rimraf';

const completed = `${chalk.green('[contensis-cli]')} Build successful 👍\n`;

console.time(completed);
console.time(' - rimraf complete');

// TODO: the bundle is non-functional due to external dependent assets
/** Build the CLI into a single bundle for use with Node SEA */
rimraf('./bundle').then(() => {
  console.timeEnd(' - rimraf complete');
  console.time(' - esbuild complete');
  build({
    entryPoints: ['./packages/contensis-cli/cli.js'],
    bundle: true,
    outdir: 'bundle',
    minify: false,
    platform: 'node',
    format: 'cjs',
    sourcemap: true,
    loader: {
      '.node': 'file',
    },
    // needs to be node12 to transform dynamic imports into requires
    // so the bundles are compatible with the pkg exe builds
    // target: 'node12',
    plugins: [
      copy({
        // this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
        // if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
        resolveFrom: 'cwd',
        assets: [
          {
            from: ['node_modules/figlet/fonts/Block.flf'],
            to: ['./bundle/fonts'],
          },
        ],
      }),
    ],
  }).then(() => {
    console.timeEnd(' - esbuild complete');
    console.timeEnd(completed);
  });
});
