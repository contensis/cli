import { Command, Option } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import {
  assetTypes,
  commit,
  concurrency,
  contentTypes,
  entryId,
  ignoreErrors,
  latest,
  mapContensisOpts,
  noCache,
  noPublish,
  outputDetail,
  saveEntries,
  stopLevel,
  versionStatus,
  zenql,
} from './globalOptions';

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
    .addOption(noCache)
    .addOption(commit)
    .option(
      '-nod --no-defaults',
      'ignore any default entries or nodes attached to content types or fields'
    )
    .option('-nov --no-validations', 'import fields with validations removed')
    .option(
      '-preserve --preserve-guids',
      'import any default entries or nodes using the same id as the source'
    )
    .addOption(ignoreErrors)
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

  program
    .command('entries')
    .description('import entries')
    .argument(
      '[search phrase]',
      'get entries with the search phrase, use quotes for multiple words'
    )
    .addOption(entryId)
    .addOption(zenql)
    .addOption(contentTypes)
    .addOption(assetTypes)
    .addOption(latest)
    .addOption(versionStatus)
    .addOption(stopLevel)
    .addOption(commit)
    .option(
      '-preserve --preserve-guids',
      'include this flag when you are importing entries that you have previously exported and wish to update'
    )
    .addOption(concurrency)
    .addOption(outputDetail)
    .addOption(ignoreErrors)
    .addOption(noCache)
    .addOption(noPublish)
    .addOption(saveEntries)
    .addHelpText(
      'after',
      `
Example call:
  > import entries --source-cms example-dev --source-project-id microsite --zenql "sys.contentTypeId = blog"
  > import entries --from-file myImportData.json --preserve-guids
`
    )
    .action(async (search: string, opts, cmd) => {
      await cliCommand(
        ['import', 'entries'],
        opts,
        mapContensisOpts({ search, ...opts })
      ).ImportEntries({
        commit: opts.commit,
        fromFile: opts.fromFile,
        logOutput: opts.outputDetail,
        saveEntries: opts.saveEntries,
      });
    });

  // TODO: add options to import one an array of nodes? nodeIds: string[]
  program
    .command('nodes')
    .description('import nodes')
    .argument('[root]', 'import nodes from the specified path e.g. /blog', '/')
    .addOption(
      new Option(
        '-d --depth <depth>',
        'import nodes with children to a specified depth'
      ).argParser(parseInt)
    )
    .option(
      '-preserve --preserve-guids',
      'include this flag when you are importing nodes that you have previously exported and wish to update'
    )
    .addOption(ignoreErrors)
    .addOption(commit)
    .addOption(
      new Option(
        '-od --output-detail <outputDetail>',
        'how much detail to output from the import'
      )
        .choices(['errors', 'changes', 'all'])
        .default('errors')
    )
    .option(
      '-ol --output-limit <outputLimit>',
      'expand or limit the number of records output to the console',
      '200'
    )
    .addHelpText(
      'after',
      `
Example call:
  > import nodes /blog --source-alias example-alias --source-project-id example-project
  > import nodes --from-file site-backup.json --preserve-guids
`
    )
    .action(async (root: string, opts) => {
      await cliCommand(
        ['import', 'nodes'],
        opts,
        mapContensisOpts({ paths: root.split(' '), ...opts })
      ).ImportNodes({
        commit: opts.commit,
        fromFile: opts.fromFile,
        logOutput: opts.outputDetail,
        logLimit: Number(opts.outputLimit),
      });
    });

  program
    .command('taggroups')
    .description('import taggroups')
    .argument('[query]', 'apply a filter')
    .option('-i --id <ids...>', 'limit to the supplied tag group id(s)')
    .addOption(commit)
    .option(
      '-preserve --preserve-guids',
      'include this flag when you are importing tags that you have previously exported and wish to update'
    )
    .addOption(concurrency)
    .addOption(ignoreErrors)
    .option(
      '--save',
      "save the tag groups we're migrating instead of the migration preview (used with --output)"
    )
    .addHelpText(
      'after',
      `
  Example call:
    > import taggroups --source-cms example-dev --source-project-id microsite --zenql "sys.contentTypeId = blog"
    > import taggroups --from-file myImportData.json --preserve-guids
  `
    )
    .action(async (query: string, opts) => {
      await cliCommand(
        ['import', 'taggroups'],
        opts,
        mapContensisOpts(opts)
      ).ImportTagGroups({
        commit: opts.commit,
        fromFile: opts.fromFile,
        getBy: {
          id: opts.id?.length === 1 ? opts.id[0] : undefined,
          ids: opts.id?.length > 1 ? opts.id : undefined,
          q: query,
        },
        save: opts.save,
      });
    });

  program
    .command('tags')
    .description('import tags')
    .option('-in --group <groupId>', 'id of the tag group containing tags')
    .option('--label <label>', 'filter by tags that match this label')
    .option('-l --language <language>', 'find tags in the supplied language')
    .option('-i --id <ids...>', 'limit to the supplied tag group id(s)')
    .addOption(commit)
    .option(
      '-preserve --preserve-guids',
      'include this flag when you are importing tags that you have previously exported and wish to update'
    )
    .addOption(concurrency)
    .addOption(ignoreErrors)
    .option(
      '--save',
      "save the tags we're migrating instead of the migration preview (used with --output)"
    )
    .addHelpText(
      'after',
      `
    Example call:
      > import tags --source-cms example-dev --source-project-id microsite --group example
      > import tags --from-file myImportData.json --preserve-guids
    `
    )
    .action(async opts => {
      await cliCommand(
        ['import', 'tags'],
        opts,
        mapContensisOpts(opts)
      ).ImportTags({
        commit: opts.commit,
        fromFile: opts.fromFile,
        getBy: {
          groupId: opts.group,
          id: opts.id?.length === 1 ? opts.id[0] : undefined,
          ids: opts.id?.length > 1 ? opts.id : undefined,
          label: opts.label,
          language: opts.language,
        },
        save: opts.save,
      });
    });

  program
    .command('webhooks')
    .description('import webhooks')
    .argument('[name]', 'import webhooks with this name')
    .option('-i --id <ids...>', 'limit to the supplied webhook id(s)')
    .option('--enabled', 'import enabled webhooks only')
    .option('--disabled', 'import disabled webhooks only')
    .addOption(commit)
    .addOption(
      new Option(
        '-od --output-detail <outputDetail>',
        'how much detail to output from the import'
      )
        .choices(['errors', 'changes', 'all'])
        .default('changes')
    )
    .addHelpText(
      'after',
      `
    Example call:
      > import webhooks --source-cms example-dev --source-project-id microsite
      > import webhooks --from-file myImportData.json
    `
    )
    .action(async (name, opts) => {
      await cliCommand(
        ['import', 'webhooks'],
        opts,
        mapContensisOpts({ ...opts, id: opts.ids, search: name })
      ).ImportWebhooks({
        commit: opts.commit,
        fromFile: opts.fromFile,
        logOutput: opts.outputDetail,
        enabled: opts.enabled,
        disabled: opts.disabled,
      });
    });

  return program;
};

export const get = makeImportCommand();
