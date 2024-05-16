import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { mapContensisOpts, noCache } from './globalOptions';

export const makeDiffCommand = () => {
  const diff = new Command()
    .command('diff')
    .description('diff command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  diff
    .command('models')
    .description('differences with content models')
    .argument(
      '[model-ids...]',
      'ids of any content types or components to diff (optional)'
    )
    .addOption(noCache)
    .usage('[model-ids...]')
    .addHelpText(
      'after',
      `
Example call:
  > diff models blogPost\n`
    )
    .action(async (modelIds: string[] = [], opts) => {
      await cliCommand(
        ['diff', 'models', modelIds.join(' ')],
        opts,
        mapContensisOpts({ modelIds, ...opts })
      ).DiffModels(
        {
          ...opts,
        },
        modelIds
      );
    });

  return diff;
};
