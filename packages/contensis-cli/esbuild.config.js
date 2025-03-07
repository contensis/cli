const { rimraf } = require('rimraf');
const esbuild = require('esbuild');
const chalk = require('chalk');
const { globPlugin } = require('esbuild-plugin-glob');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { replaceTscAliasPaths } = require('tsc-alias');

// const watch = !!process.argv.includes('--watch');
const completed = `${chalk.green('[contensis-cli]')} Build successful 👍\n`;

console.time(completed);
console.time(' - rimraf complete');

rimraf('./dist').then(() => {
  console.timeEnd(' - rimraf complete');
  console.time(' - esbuild complete');
  esbuild
    .build({
      entryPoints: ['src/**/*.[jt]s'],
      outdir: 'dist',
      bundle: false,
      minify: false,
      platform: 'node',
      format: 'cjs',
      sourcemap: true,
      // needs to be node12 to transform dynamic imports into requires
      // so the bundles are compatible with the pkg exe builds
      target: 'node12',
      plugins: [globPlugin(), nodeExternalsPlugin()],
      // watch: watch && {
      //   onRebuild(error) {
      //     if (error) console.error('esbuild watch build failed:', error);
      //     else
      //       console.log(
      //         'esbuild watch build succeeded, waiting for changes...'
      //       );
      //   },
      // },
    })
    .then(() => {
      console.timeEnd(' - esbuild complete');
      console.time(' - replace alias paths');
      replaceTscAliasPaths();
      console.timeEnd(' - replace alias paths');
      console.timeEnd(completed);
    });
});
