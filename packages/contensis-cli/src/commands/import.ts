import { Command, Option } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { commit, getEntryOptions, mapContensisOpts } from './globalOptions';

export const makeImportCommand = () => {
  const program = new Command()
    .command('import')
    .description('import command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  program
    .command('models')
    .description('import complete content models')
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
    .description('import content types')
    .argument(
      '[contentTypeIds...]',
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
    .description('import components')
    .argument(
      '[componentIds...]',
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

  getEntryOptions(
    program
      .command('entries')
      .description('import entries')
      .argument(
        '[search phrase]',
        'get entries with the search phrase, use quotes for multiple words'
      )
  )
    .addOption(commit)
    .option(
      '-preserve --preserve-guids',
      'include this flag when you are importing entries that you have previously exported and wish to update'
    )
    .addOption(
      new Option(
        '-oe --output-entries <outputEntries>',
        'which details of the entries included in the import to output'
      )
        .choices(['errors', 'changes', 'all'])
        .default('errors')
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
      ).ImportEntries({
        commit: opts.commit,
        fromFile: opts.fromFile,
        logOutput: opts.outputEntries,
      });
    });

  // TODO: add options to import one an array of nodes? nodeIds: string[]
  program
    .command('nodes')
    .description('import nodes')
    .option(
      '-preserve --preserve-guids',
      'include this flag when you are importing nodes that you have previously exported and wish to update'
    )
    .addOption(commit)
    .addOption(
      new Option(
        '-on --output-nodes <outputNodes>',
        'how much detail to output from the nodes import'
      )
        .choices(['errors', 'changes', 'all'])
        .default('errors')
    )
    .addHelpText(
      'after',
      `
Example call:
  > import nodes --from-file site-backup.json
  > import nodes --source-alias example-alias --source-project-id example-project
`
    )
    .action(async opts => {
      await cliCommand(
        ['import', 'nodes'],
        opts,
        mapContensisOpts({ ...opts })
      ).ImportNodes({
        commit: opts.commit,
        fromFile: opts.fromFile,
        logOutput: opts.outputNodes,
      });
    });

  return program;
};

export const get = makeImportCommand();
