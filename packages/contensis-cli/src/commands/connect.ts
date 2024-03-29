import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';
import { project } from './globalOptions';

export const makeConnectCommand = () => {
  const connect = new Command()
    .command('connect')
    .description('connect to a Contensis instance')
    .argument('<alias>', 'the Contensis Cloud alias to connect with')
    .addOption(project)
    .usage('<alias>')
    .addHelpText(
      'after',
      `
Example call:
  > connect example-dev`
    )
    .action(async (alias, opts) => {
      await cliCommand(['connect', alias], { ...opts, alias }).Connect(alias);
      await shell().restart();
    });
  return connect;
};
