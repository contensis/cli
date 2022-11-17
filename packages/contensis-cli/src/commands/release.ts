import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';

export const makeReleaseCommand = () => {
  const release = new Command()
    .command('release')
    .showHelpAfterError(true)
    .exitOverride();

  release
    .command('block')
    .argument('<block-id>', 'the name of the block to release')
    .argument('<version>', 'the block version to release')
    .usage('<block-id> <version>')
    .addHelpText(
      'after',
      `
Example call:
  > release block contensis-app 3\n`
    )
    .action(async (blockId: string, version: string, opts) => {
      await cliCommand(['release', 'block', blockId], opts).ReleaseBlock(
        blockId,
        version
      );
    });

  return release;
};
