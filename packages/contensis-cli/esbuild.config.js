const fs = require('fs');
const { rimraf } = require('rimraf');
const esbuild = require('esbuild');
const chalk = require('chalk');
const { globPlugin } = require('esbuild-plugin-glob');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { replaceTscAliasPaths } = require('tsc-alias');

// embed the current package version into the build
// (package.json is the single source of truth; this used to be a `prebuild`
// npm lifecycle script, which lerna/yarn builds never fire - see release 1.7.0)
const { version } = require('./package.json');
fs.writeFileSync('./src/version.ts', `export const LIB_VERSION = ${JSON.stringify(version)};\n`);

const completed = `${chalk.green('[contensis-cli]')} Build successful 👍\n`;

console.time(completed);
console.time(' - rimraf complete');

rimraf('./dist').then(() => {
  console.timeEnd(' - rimraf complete');
  console.time(' - esbuild complete');
  esbuild
    .build({
      entryPoints: ['src/index.ts', 'src/shell.ts'],
      outdir: 'dist',
      bundle: true,
      minify: false,
      platform: 'node',
      format: 'cjs',
      sourcemap: true,
      // needs to be node12 to transform dynamic imports into requires
      // so the bundles are compatible with the pkg exe builds
      target: 'node12',
      plugins: [globPlugin(), nodeExternalsPlugin({
        allowList: [/^@inquirer\//],
        dependencies: true,
        forceExternalList: ['enterprise-fetch']
        // forceExternalList: ['keytar', '@action-validator/core', 'figlet', 'node-fetch', 'enterprise-fetch']
      })],
    })
    .then(() => {
      console.timeEnd(' - esbuild complete');
      console.time(' - replace alias paths');
      replaceTscAliasPaths();
      console.timeEnd(' - replace alias paths');
      console.timeEnd(completed);
    });
});
