import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { mapContensisOpts } from './globalOptions';

export const makeDiffCommand = () => {
  const release = new Command()
    .command('diff')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  release
    .command('models')
    .argument(
      '[model-ids...]',
      'ids of any content types or components to diff (optional)'
    )
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

  return release;
};
