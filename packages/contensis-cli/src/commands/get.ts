import { Argument, Command, Option } from 'commander';
import { merge } from 'lodash';
import { cliCommand } from '~/services/ContensisCliService';
import {
  addGlobalOptions,
  assetTypes,
  contentTypes,
  delivery,
  entryId,
  exportOption,
  latest,
  mapContensisOpts,
  noCache,
  requiredBy,
  versionStatus,
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
    .command('proxy')
    .description('get a proxy')
    .argument('<proxyId>', 'id of the proxy to get')
    .addHelpText(
      'after',
      `
  Example call:
    > get proxy b8b6958f-6ae2-41d5-876a-abc86755fd7b
  `
    )
    .action(async (proxyId: string, opts) => {
      await cliCommand(['get', 'proxy', proxyId], opts).PrintProxies(proxyId);
    });

  program
    .command('renderer')
    .description('get a renderer')
    .argument('<rendererId>', 'id of the renderer to get')
    .addHelpText(
      'after',
      `
Example call:
  > get renderer contensis-website
`
    )
    .action(async (rendererId: string, opts) => {
      await cliCommand(['get', 'renderer', rendererId], opts).PrintRenderers(
        rendererId
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
    .command('workflow')
    .description('get a workflow')
    .argument('<workflowNameOrId>', 'id or name of the workflow to get')
    .addHelpText(
      'after',
      `
Example call:
  > get workflow "Approval workflow"
`
    )
    .action(async (workflowNameOrId: string, opts) => {
      await cliCommand(
        ['get', 'workflow', workflowNameOrId],
        opts
      ).PrintWorkflow(workflowNameOrId);
    });

  program
    .command('model')
    .description('get a content model')
    .argument('<contentTypeId...>', 'ids of the content models to get')
    .addOption(requiredBy)
    .addOption(exportOption)
    .addOption(noCache)
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
        opts,
        mapContensisOpts(opts)
      ).PrintContentModels(modelIds, opts);
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
      )
      .addOption(latest)
      .addOption(versionStatus)
      .addOption(delivery);

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
    .action(async (search: string, opts) => {
      // Maintaining a separate command for assets vs entries
      // allows us to offer up more options when dealing with just assets
      await cliCommand(
        ['get', 'assets'],
        opts,
        mapContensisOpts({ dataFormat: 'asset', search, ...opts })
      ).GetEntries();
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
    .action(async (search: string, opts, cmd) => {
      await cliCommand(
        ['get', 'entries'],
        opts,
        mapContensisOpts({ search, ...opts })
      ).GetEntries({
        withDependents: opts.dependents,
      });
    });

  program
    .command('nodes')
    .description('get nodes')
    .argument('[root]', 'get node(s) from the specified path e.g. /blog', '/')
    .option(
      '-d --depth <depth>',
      'get nodes with children to a specified depth',
      '1'
    )
    .addHelpText(
      'after',
      `
Example call:
  > get nodes /blog --depth 1
`
    )
    .action(async (root: string, opts) => {
      await cliCommand(['get', 'nodes'], opts, mapContensisOpts(opts)).GetNodes(
        root,
        opts.depth
      );
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
  > get block contensis-website feature-branch 3
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
