import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';

export const makeDevCommand = () => {
  const dev = new Command()
    .command('dev')
    .description('dev command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  dev
    .command('requests')
    .description('launch request handler for local development')
    .argument('[block-ids...]', 'ids of any blocks to develop locally')
    .option('--args <args...>', 'override or add additional args')
    .usage('[block-ids...]')
    .addHelpText(
      'after',
      `
Example call:
  > dev requests test-block-one\n`
    )
    .action(async (blockIds: string[] = [], opts) => {
      await cliCommand(
        ['dev', 'requests', blockIds.join(' ')],
        opts
      ).ExecRequestHandler(blockIds, opts?.args);
    });

  return dev;
};
