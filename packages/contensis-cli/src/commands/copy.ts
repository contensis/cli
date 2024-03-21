import { Command } from 'commander';
import { CopyField } from 'migratortron';
import { cliCommand } from '~/services/ContensisCliService';
import {
  commit,
  concurrency,
  ignoreErrors,
  mapContensisOpts,
  outputEntries,
} from './globalOptions';

export const makeCopyCommand = () => {
  const copy = new Command()
    .command('copy')
    .description('copy command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  copy
    .command('field')
    .description('copy the contents of one content type field to another')
    .argument(
      '<contentTypeId>',
      'the api id of the content type containing the fields to copy'
    )
    .argument('<fieldId>', 'the id of the field to copy from')
    .argument('<destinationId>', 'the id of the field to copy to')
    .option(
      '-t --template <template>',
      'apply a liquidjs template to modify the copied field content'
    )
    .addOption(commit)
    .addOption(concurrency)
    .addOption(ignoreErrors)
    .addOption(outputEntries)
    .usage('<contentTypeId> <fieldId> <destinationId> (all arguments required)')
    .addHelpText(
      'after',
      `
Example call:
  > copy field blog authorName contributors\n`
    )
    .action(
      async (
        contentTypeId: string,
        fieldId: string,
        destinationId: string,
        opts: any
      ) => {
        const copyField: CopyField = {
          contentTypeId,
          fieldId,
          destinationId,
          template: opts.template,
        };

        return await cliCommand(
          ['copy', 'project', contentTypeId, fieldId, destinationId],
          opts,
          mapContensisOpts({ copyField })
        ).CopyEntryField({
          commit: opts.commit,
          fromFile: opts.fromFile,
          logOutput: opts.outputEntries,
        });
      }
    );

  return copy;
};
