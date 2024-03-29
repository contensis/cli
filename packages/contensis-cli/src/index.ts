import commands from './commands';
import { logError } from './util/logger';
import ContensisCli from './services/ContensisCliService';

// This is the CLI part of the app
const program = commands();
program
  .parseAsync(process.argv)
  .then(() => {
    ContensisCli.quit();
  })
  .catch((err: any) => {
    if (err && !err.name?.includes('CommanderError'))
      logError(err, `CLI ${err.toString()}`);
    ContensisCli.quit(err);
  });
