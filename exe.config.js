const exe = require('@angablue/exe');
const packageJson = require('./packages/contensis-cli/package.json');

const build = exe({
  entry: '.',
  out: './bin/contensis-cli.exe',
  pkg: ['--public-packages', '"*"', '--public', '--compress', 'GZip'], // Specify extra pkg arguments
  version: packageJson.version,
  target: 'latest-win-x64',
  icon: './assets/icon.ico', // Application icons must be in .ico format
  properties: {
    FileDescription: 'Contensis CLI',
    ProductName: 'Contensis CLI',
    LegalCopyright: 'Zengenti Ltd',
    OriginalFilename: 'contensis-cli.exe',
  },
});

build.then(() => console.log('Windows x64 exe build completed'));
