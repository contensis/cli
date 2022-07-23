import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const connect = new Command()
  .command('connect')
  .argument('<alias>', 'the Contensis Cloud alias to connect with')
  .usage('<alias>')
  .addHelpText(
    'after',
    `
Example call:
  > connect example-dev`
  )
  .action(async alias => {
    await cliCommand(['connect', alias]).Connect(alias);
    await shell().start();
  });
