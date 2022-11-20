import { Argument, Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { url } from '~/util';
import { commit, mapContensisOpts } from './globalOptions';

export const makeImportCommand = () => {
  const program = new Command()
    .command('import')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  program
    .command('models')
    .argument('[modelIds...]', 'ids of the content models to import (optional)')
    .addOption(commit)
    .addHelpText(
      'after',
      `
Example call:
  > import models blogPost --from-file contentmodels-backup.json
  > import models --source-alias example-dev
`
    )
    .action(async (modelIds: string[], opts) => {
      await cliCommand(
        ['import', 'models', modelIds.join(' ')],
        opts,
        mapContensisOpts({ modelIds, ...opts })
      ).ImportContentModels({
        fromFile: opts.fromFile,
        commit: opts.commit,
      });
    });

  program
    .command('contenttypes')
    .argument(
      '[contentTypeIds]',
      'Optional list of API id(s) of the content type(s) to import'
    )
    .addOption(commit)
    .addHelpText(
      'after',
      `
Example call:
  > import contenttypes {contentTypeIds} --from-file contenttypes-backup.json
  > import contenttypes {contentTypeIds} --source-alias example-dev
`
    )
    .action(async (contentTypeIds: string[], opts) => {
      await cliCommand(
        ['import', 'contenttypes'],
        opts,
        mapContensisOpts({ contentTypeIds, ...opts })
      ).ImportContentTypes(
        {
          fromFile: opts.fromFile,
          commit: opts.commit,
        },
        contentTypeIds
      );
    });

  program
    .command('components')
    .argument(
      '[componentIds]',
      'Optional list of API id(s) of the component(s) to import'
    )
    .addOption(commit)
    .addHelpText(
      'after',
      `
Example call:
  > import components {componentIds} --from-file component-backup.json
  > import components {componentIds} --source-alias example-dev
`
    )
    .action(async (componentIds: string[], opts) => {
      await cliCommand(
        ['import', 'component'],
        opts,
        mapContensisOpts({ componentIds, ...opts })
      ).ImportComponents(
        {
          fromFile: opts.fromFile,
          commit: opts.commit,
        },
        componentIds
      );
    });

  program
    .command('entries')
    .argument(
      '[search phrase]',
      'get entries with the search phrase, use quotes for multiple words'
    )
    .addOption(commit)
    .option(
      '-preserve, --preserve-guids',
      'include this flag when you are importing entries that you have previously exported and wish to update'
    )
    .addHelpText(
      'after',
      `
Example call:
  > import entries --source-cms example-dev --source-project-id microsite --zenql "sys.contentTypeId = blog"
`
    )
    .action(async (phrase: string, opts, cmd) => {
      await cliCommand(
        ['import', 'entries'],
        opts,
        mapContensisOpts({ phrase, ...opts })
      ).ImportEntries({ commit: opts.commit, fromFile: opts.fromFile });
    });

  return program;
};

export const get = makeImportCommand();
