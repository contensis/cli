import { Command } from 'commander';
import { UpdateField } from 'migratortron';
import { cliCommand } from '~/services/ContensisCliService';
import {
  commit,
  concurrency,
  entryId,
  ignoreErrors,
  latest,
  mapContensisOpts,
  noCache,
  noPublish,
  outputDetail,
  saveEntries,
  versionStatus,
  zenql,
} from './globalOptions';

export const makeUpdateCommand = () => {
  const update = new Command()
    .command('update')
    .description('update command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  update
    .command('field')
    .description('find and replace within entry fields')
    .argument('<fieldId>', 'the id of the field to update')
    .argument(
      '<find>',
      'the string to find within each entry/field (surround a phrase in double quotes)'
    )
    .argument(
      '<replace>',
      'the string to replace with (surround a phrase in double quotes)'
    )
    .addOption(commit)
    .addOption(concurrency)
    .addOption(ignoreErrors)
    .addOption(outputDetail.default('changes'))
    .addOption(noCache)
    .addOption(noPublish)
    .option(
      '--search <phrase>',
      'get entries with the search phrase, use quotes for multiple words'
    )
    .addOption(entryId)
    .addOption(zenql)
    .addOption(latest)
    .addOption(versionStatus)
    .addOption(saveEntries)
    .usage('<fieldId> <find> <replace> (all arguments required)')
    .addHelpText(
      'after',
      `
Example call:
  > update field authorName "Emma Smith" "Emma Davies" --zenql "sys.contentTypeId=blog"\n`
    )
    .action(
      async (fieldId: string, find: string, replace: string, opts: any) => {
        const updateField: UpdateField = {
          fieldId,
          find,
          replace,
        };

        return await cliCommand(
          ['update', 'field', fieldId, find, replace],
          opts,
          mapContensisOpts({ updateField, ...opts })
        ).UpdateEntryField({
          commit: opts.commit,
          fromFile: opts.fromFile,
          logOutput: opts.outputDetail,
          saveEntries: opts.saveEntries,
        });
      }
    );

  return update;
};

