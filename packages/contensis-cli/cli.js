#!/usr/bin/env node
// console.log(process.argv);

// process.env.debug = 'true';

if (process.argv.length > 2)
  // run cli if args provided
  require('./dist');
// run shell
else require('./dist/shell').shell();
