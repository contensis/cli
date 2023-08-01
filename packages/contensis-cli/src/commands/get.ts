import { Argument, Command, Option } from 'commander';
import { merge } from 'lodash';
import { cliCommand } from '~/services/ContensisCliService';
import {
  addGlobalOptions,
  assetTypes,
  contentTypes,
  entryId,
  mapContensisOpts,
  zenql,
} from './globalOptions';

export const makeGetCommand = () => {
  const program = new Command()
    .command('get')
    .description('get command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  program
    .command('version')
    .description('get current Contensis version')
    .addHelpText(
      'after',
      `
Example call:
  > version
`
    )
    .action(async opts => {
      await cliCommand(['get', 'version'], opts).PrintContensisVersion();
    });

  program
    .command('token')
    .description('show a bearer token for the currently logged in user')
    .addHelpText(
      'after',
      `
Example call:
  > get token
`
    )
    .action(async opts => {
      await cliCommand(['get', 'token'], opts).PrintBearerToken();
    });

  program
    .command('project')
    .description('get a project')
    .argument('[projectId]', 'id of the project to get (default: current)')
    .addHelpText(
      'after',
      `
Example call:
  > get project website
`
    )
    .action(async (projectId: string, opts) => {
      await cliCommand(['get', 'project', projectId], opts).PrintProject(
        projectId
      );
    });

  program
    .command('role')
    .description('get a role')
    .argument('<roleNameOrId>', 'id or name of the role to get')
    .addHelpText(
      'after',
      `
Example call:
  > get role "entry admin"
`
    )
    .action(async (roleNameOrId: string, opts) => {
      await cliCommand(['get', 'role', roleNameOrId], opts).PrintRole(
        roleNameOrId
      );
    });

  program
    .command('webhook')
    .description('get a webhook')
    .argument('<webhookNameOrId...>', 'id or name of the webhook(s) to get')
    .addHelpText(
      'after',
      `
Example call:
  > get webhook "Slack notification"
`
    )
    .action(async (webhookNameOrId: string[], opts) => {
      await cliCommand(
        ['get', 'webhook', webhookNameOrId.join(' ')],
        opts
      ).PrintWebhookSubscriptions(webhookNameOrId);
    });

  program
    .command('model')
    .description('get a content model')
    .argument('<contentTypeId...>', 'ids of the content models to get')
    .addHelpText(
      'after',
      `
Example call:
  > get model podcast podcastLinks
`
    )
    .action(async (modelIds: string[], opts) => {
      await cliCommand(
        ['get', 'model', modelIds.join(' ')],
        opts
      ).PrintContentModels(modelIds);
    });

  program
    .command('contenttype')
    .description('get a content type')
    .argument('<contentTypeId>', 'the API id of the content type to get')
    .addHelpText(
      'after',
      `
Example call:
  > get contenttype {contentTypeId} -o content-type-backup.json
`
    )
    .action(async (contentTypeId: string, opts) => {
      await cliCommand(
        ['get', 'contenttype', contentTypeId],
        opts
      ).PrintContentType(contentTypeId);
    });

  program
    .command('component')
    .description('get a component')
    .argument('<componentId>', 'the API id of the component to get')
    .addHelpText(
      'after',
      `
Example call:
  > get component {componentId} -o component-backup.json
`
    )
    .action(async (componentId: string, opts) => {
      await cliCommand(['get', 'component', componentId], opts).PrintComponent(
        componentId
      );
    });

  const sharedGetEntryOptions = (command: Command) =>
    command
      .addOption(entryId)
      .addOption(zenql)
      .addOption(
        new Option(
          '-fi --fields <fields...>',
          'limit the output fields on returned entries'
        )
      )
      .addOption(
        new Option(
          '-ob --order-by <orderBy...>',
          'field name(s) to order the results by (prefix "-" for descending)'
        )
      );

  sharedGetEntryOptions(
    program
      .command('assets')
      .description('get asset entries')
      .argument(
        '[search phrase]',
        'get assets with the search phrase, use quotes for multiple words'
      )
      .addOption(assetTypes)
  )
    .option('-l --paths <paths...>', 'get assets under the given path(s)')
    .addHelpText(
      'after',
      `
Example call:
  > get assets --zenql "sys.contentTypeId = blog" --fields sys.id sys.properties.filePath sys.properties.filename
`
    )
    .action(async (phrase: string, opts) => {
      // Maintaining a separate command for assets vs entries
      // allows us to offer up more options when dealing with just assets
      await cliCommand(
        ['get', 'assets'],
        opts,
        mapContensisOpts({ dataFormat: 'asset', phrase, ...opts })
      ).GetEntries({});
    });

  sharedGetEntryOptions(
  program
    .command('entries')
    .description('get entries')
    .argument(
      '[search phrase]',
      'get entries with the search phrase, use quotes for multiple words'
    )
      .addOption(contentTypes)
    .option(
        '-d --dependents',
      'find and return any dependencies of all found entries'
    )
  )
    .addOption(
      new Option(
        '--data-format <dataFormat>',
        'find and return entries of a specific data format'
    )
        .choices(['entry', 'asset', 'webpage'])
        .default('entry')
    )
    .addHelpText(
      'after',
      `
Example call:
  > get entries --zenql "sys.contentTypeId = blog" --fields entryTitle entryDescription sys.id --output ./blog-posts.csv --format csv
  > get entries --content-type blog --fields entryTitle sys.version.modified --order-by -sys.version.modified
`
    )
    .action(async (phrase: string, opts, cmd) => {
      // console.log('phrase: ', phrase, '\nopts:', JSON.stringify(opts, null, 2));
      // console.log('opts:', JSON.stringify(opts, null, 2));
      await cliCommand(
        ['get', 'entries'],
        opts,
        mapContensisOpts({ phrase, ...opts })
      ).GetEntries({
        withDependents: opts.dependents,
      });
    });

  const block = program
    .command('block')
    .description('get a block or block version')
    .argument('[blockId]', 'the block to get version details for')
    .argument(
      '[branch]',
      'the branch of the block to get version details for',
      'default'
    )
    .argument(
      '[version]',
      'get a specific version of the block pushed to the specified branch'
    )
    .addHelpText(
      'after',
      `
Example call:
  > get block contensis-website
  > get block contensis-website develop latest
`
    )
    .action(async (blockId: string, branch: string, version: string, opts) => {
      await cliCommand(['get', 'block', blockId], opts).PrintBlockVersions(
        blockId,
        branch,
        version
      );
    });

  block
    .command('logs')
    .description('get logs for a block')
    .argument('[blockId]', 'the block to get version logs for')
    .argument(
      '[branch]',
      'the branch of the block to get version details for',
      'default'
    )
    .argument(
      '[version]',
      'the version of the block pushed to the branch to get logs for',
      'latest'
    )
    .addArgument(
      new Argument(
        '[dataCenter]',
        'the datacentre of the block to get logs for'
      )
        .choices(['hq', 'london', 'manchester', 'all'])
        .default('all')
    )
    .option('-t --follow', 'follow block logs in near realtime', false)
    .usage('get block logs [blockId] [branch] [version] [dataCenter]')
    .addHelpText(
      'after',
      `
Example call:
  > get block logs contensis-website default
  > get block logs contensis-website master latest london --follow
`
    )
    .action(
      async (
        blockId: string,
        branch: string,
        version: string,
        dataCenter: 'hq' | 'manchester' | 'london' | 'all',
        opts
      ) => {
        const parentOpts = block.opts() || {};
        await cliCommand(
          ['get', 'block', 'logs'],
          merge(opts, parentOpts)
        ).PrintBlockLogs(
          blockId,
          branch,
          version,
          dataCenter === 'all' ? undefined : dataCenter,
          opts.follow as boolean
        );
      }
    );

  // Add global opts for inner sub-commands
  addGlobalOptions(block);

  return program;
};

export const get = makeGetCommand();
