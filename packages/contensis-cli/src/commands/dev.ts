import { Command } from 'commander';
import { devCommand } from '~/services/ContensisDevService';

export const makeDevCommand = () => {
  const dev = new Command()
    .command('dev')
    .description('dev command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  dev
    .command('init')
    .description(
      'initialise a git clone directory to connect and deploy to Contensis'
    )
    .argument(
      '[projectHome]',
      'the path of the folder to initialise',
      process.cwd()
    )
    .option(
      '--url <url>',
      'override the git url or add one to initialise a non-git folder'
    )
    .option(
      '-d --dry-run',
      'perform a dry run of the project initialisation where no changes are made'
    )
    // .option(
    //   '--commit',
    //   'commit change (will eventually be deprecated in favour of --dry-run)',
    //   true
    // )
    .addHelpText(
      'after',
      `
Example call:
  > dev init\n`
    )
    .action(async (projectHome: string, opts) => {
      // TODO: add opts for overriding project name and git url
      await devCommand(['dev', 'init', projectHome], opts).DevelopmentInit(
        projectHome,
        { ...opts, dryRun: opts.dryRun }
      );
    });

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
      await devCommand(
        ['dev', 'requests', blockIds.join(' ')],
        opts
      ).ExecRequestHandler(blockIds, opts?.args);
    });

  return dev;
};
