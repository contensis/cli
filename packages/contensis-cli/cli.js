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

/** enterprise-fetch v2 uses the native node fetch if available which
 *  does not work with Management API file uploads correctly,
 * so we force it to fallback to use the older `node-fetch` implementation
 * which the Management API is deisgned to work with.
 * Native fetch shows this when uploading an asset: 

content-length: 17

[object FormData]
 * where node-fetch show this
Content-Length: 53427

----------------------------220769149404052112875897
Content-Disposition: form-data; name="file"; filename="default-meta1.jpg"
Content-Type: image/jpeg

...binary data...
*/
globalThis.fallbackFetch = true;

/**
 * Run cli command or launch shell
 */
if (process.argv.length > 2)
  // run cli if args provided
  require('./dist');
// run shell
else require('./dist/shell').shell();
