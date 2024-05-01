#!/usr/bin/env node
// console.log(process.argv);

/**
 * Activate additional console output
 */
// process.env.debug = 'true';

/**
 * Polyfills to load before the CLI
 */
if (!globalThis.crypto) {
  // Versions of Node < 20 do not have crypto attached to global by default
  // and this is required by @contensis/html-canvas package
  const crypto = require('node:crypto');
  globalThis.crypto = crypto.webcrypto;
}

/**
 * Run cli command or launch shell
 */
if (process.argv.length > 2)
  // run cli if args provided
  require('./dist');
// run shell
else require('./dist/shell').shell();
