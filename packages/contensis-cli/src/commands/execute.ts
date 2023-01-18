import { Argument, Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';

export const makeExecuteCommand = () => {
  const execute = new Command()
    .command('execute')
    .description('execute block actions')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  const block = execute
    .command('block')
    .description('execute block command to invoke block actions');

  const action = block
    .command('action')
    .description('execute block action command to invoke block actions');

  const blockIdArg = new Argument(
    '<block-id>',
    'the name of the block to perform action with'
  );
  const blockVersionArg = new Argument(
    '<version>',
    'the block version to perform action with'
  );

  action
    .command('release')
    .description('release a block version')
    .addArgument(blockIdArg)
    .addArgument(blockVersionArg)
    .usage('<block-id> <version>')
    .addHelpText(
      'after',
      `
Example call:
  > execute block action release contensis-app 3\n`
    )
    .action(async (blockId: string, version: string, opts) => {
      await cliCommand(
        ['execute', 'block', 'action', 'release', blockId],
        opts
      ).ExecuteBlockAction('release', blockId, version);
    });

  action
    .command('makelive')
    .description('make a block version live')
    .addArgument(blockIdArg)
    .addArgument(blockVersionArg)
    .usage('<block-id> <version>')
    .addHelpText(
      'after',
      `
Example call:
  > execute block action makelive contensis-app 3\n`
    )
    .action(async (blockId: string, version: string, opts) => {
      await cliCommand(
        ['execute', 'block', 'action', 'makelive', blockId],
        opts
      ).ExecuteBlockAction('makeLive', blockId, version);
    });

  action
    .command('rollback')
    .description('rollback a live block version to last live version')
    .addArgument(blockIdArg)
    .addArgument(blockVersionArg)
    .usage('<block-id> <version>')
    .addHelpText(
      'after',
      `
Example call:
  > execute block action rollback contensis-app 3\n`
    )
    .action(async (blockId: string, version: string, opts) => {
      await cliCommand(
        ['execute', 'block', 'action', 'rollback', blockId],
        opts
      ).ExecuteBlockAction('rollback', blockId, version);
    });

  action
    .command('markasbroken')
    .description('mark a block version as broken')
    .addArgument(blockIdArg)
    .addArgument(blockVersionArg)
    .usage('<block-id> <version>')
    .addHelpText(
      'after',
      `
Example call:
  > execute block action markasbroken contensis-app 3\n`
    )
    .action(async (blockId: string, version: string, opts) => {
      await cliCommand(
        ['execute', 'block', 'action', 'markasbroken', blockId],
        opts
      ).ExecuteBlockAction('markAsBroken', blockId, version);
    });

  return execute;
};
