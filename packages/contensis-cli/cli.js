#!/usr/bin/env node
if (process.argv.length > 2)
  // run cli if args provided
  require('./dist');
// run shell
else require('./dist/shell').shell();
