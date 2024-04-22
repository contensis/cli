import { Command } from 'commander';
import { CopyField } from 'migratortron';
import { cliCommand } from '~/services/ContensisCliService';
import {
  commit,
  concurrency,
  delivery,
  entryId,
  ignoreErrors,
  mapContensisOpts,
  outputEntries,
  zenql,
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
      'apply a liquidjs template (surrounded by double quotes) to modify the copied field content'
    )
    .addOption(commit)
    .addOption(concurrency)
    .addOption(ignoreErrors)
    .addOption(outputEntries)
    .addOption(delivery)
    .addOption(entryId)
    .addOption(zenql)
    .usage('<contentTypeId> <fieldId> <destinationId> (all arguments required)')
    .addHelpText(
      'after',
      `
Example call:
  > copy field blog authorName contributors\n
  > copy field blog description kicker --template "<h2>{{ source_value }}</h2>"\n`
    )
    .action(
      async (
        contentTypeId: string,
        fieldId: string,
        destinationId: string,
        opts: any
      ) => {
        const { template, ...restOpts } = opts;
        const copyField: CopyField = {
          contentTypeId,
          fieldId,
          destinationId,
          template: opts.template,
        };

        return await cliCommand(
          ['copy', 'project', contentTypeId, fieldId, destinationId],
          opts,
          mapContensisOpts({ copyField, ...restOpts })
        ).CopyEntryField({
          commit: opts.commit,
          fromFile: opts.fromFile,
          logOutput: opts.outputEntries,
        });
      }
    );

  return copy;
};
