import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import {
  addGlobalOptions,
  exportOption,
  mapContensisOpts,
  noCache,
} from './globalOptions';

export const makeListCommand = () => {
  const list = new Command()
    .command('list')
    .description('list command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .enablePositionalOptions()
    .exitOverride();

  list
    .command('envs')
    .description('List all previously connected environments')
    .addHelpText(
      'after',
      `
Example call:
  > list envs
`
    )
    .action(async opts => {
      await cliCommand(['list', 'envs'], opts).PrintEnvironments();
    });

  list
    .command('projects')
    .description('print list of projects')
    .addHelpText(
      'after',
      `
Example call:
  > list projects
`
    )
    .action(async opts => {
      await cliCommand(['list', 'projects'], opts).PrintProjects();
    });

  list
    .command('models')
    .description('print list of content models')
    .addOption(exportOption)
    .addOption(noCache)
    .addHelpText(
      'after',
      `
Example call:
  > list models
`
    )
    .action(async opts => {
      await cliCommand(
        ['list', 'models'],
        opts,
        mapContensisOpts(opts)
      ).PrintContentModels([], opts);
    });

  list
    .command('contenttypes')
    .description('print list of content types')
    .addHelpText(
      'after',
      `
Example call:
  > list contenttypes -o ./output.json -f json
`
    )
    .action(async opts => {
      await cliCommand(['list', 'contenttypes'], opts).PrintContentTypes();
    });

  list
    .command('components')
    .description('print list of components')
    .addHelpText(
      'after',
      `
Example call:
  > list components -o ./output.json -f json
`
    )
    .action(async opts => {
      await cliCommand(['list', 'components'], opts).PrintComponents();
    });

  list
    .command('blocks')
    .description('print list of content blocks')
    .addHelpText(
      'after',
      `
Example call:
  > list blocks
`
    )
    .action(async opts => {
      await cliCommand(['list', 'blocks'], opts).PrintBlocks();
    });

  list
    .command('keys')
    .description('print list of API keys')
    .addHelpText(
      'after',
      `
Example call:
  > list keys
`
    )
    .action(async opts => {
      await cliCommand(['list', 'keys'], opts).PrintApiKeys();
    });

  list
    .command('proxies')
    .description('print list of proxies')
    .addHelpText(
      'after',
      `
Example call:
  > list proxies
`
    )
    .action(async opts => {
      await cliCommand(['list', 'proxies'], opts).PrintProxies();
    });

  list
    .command('renderers')
    .description('print list of renderers')
    .addHelpText(
      'after',
      `
Example call:
  > list renderers
`
    )
    .action(async opts => {
      await cliCommand(['list', 'renderers'], opts).PrintRenderers();
    });

  list
    .command('roles')
    .description('print list of roles')
    .addHelpText(
      'after',
      `
Example call:
  > list roles
`
    )
    .action(async opts => {
      await cliCommand(['list', 'roles'], opts).PrintRoles();
    });

  const tags = list
    .command('tags')
    .description('print list of tags')
    .argument('[label]', 'filter by tags that match this label')
    .passThroughOptions()
    .option('-in --group <groupId>', 'id of the tag group containing tags')
    .option('-i --id <ids...>', 'limit output to the supplied tag id(s)')
    .option('-l --language <language>', 'find tags in the supplied language')
    .option('-d --dependents', 'find and return tag groups for all found tags')
    .addHelpText(
      'after',
      `
    Example call:
      > list tags
    `
    )
    .action(async (label, opts) => {
      await cliCommand(['list', 'tags'], { ...opts, label }).PrintTags(
        {
          id: opts.id?.length === 1 ? opts.id[0] : undefined,
          ids: opts.id?.length > 1 ? opts.id : undefined,
          groupId: opts.group,
          label,
          language: opts.language,
        },
        opts.dependents
      );
    });

  tags
    .command('in')
    .description('print list of tags in a group')
    .argument('<groupId>', 'id of the tag group containing tags')
    .option('--label <label>', 'filter by tags that match this label')
    .option(
      '-l --language <language>',
      'find tags by a label in a specific language'
    )
    .addHelpText(
      'after',
      `
      Example call:
        > list tags in example
      `
    )
    .action(async (groupId: string, opts, cmd) => {
      // workaround for shared options being always unavailable
      // read the (shared) options that were parsed by the parent cmd
      // https://github.com/tj/commander.js/issues/476#issuecomment-1675757628
      const parentOptions = cmd.optsWithGlobals();

      await cliCommand(['list', 'tags', 'in'], {
        ...opts,
        ...parentOptions,
        groupId,
      }).PrintTags({
        ...opts,
        ...parentOptions,
        groupId,
      });
    });

  list
    .command('taggroups')
    .description('print list of tag groups')
    .argument('[query]', 'filter tag groups')
    .addHelpText(
      'after',
      `
  Example call:
    > list taggroups
  `
    )
    .action(async (query, opts) => {
      await cliCommand(['list', 'taggroups'], opts).PrintTagGroups(query);
    });

  list
    .command('webhooks')
    .description('print list of webhooks')
    .argument('[name]', 'find webhooks matching the supplied name')
    .option('-i --id <id...>', 'the subscription id(s) to get')
    .addHelpText('after', `\n`)
    .action(async (name?: string, { id, ...opts }: any = {}) => {
      await cliCommand(['list', 'webhooks'], opts).PrintWebhookSubscriptions(
        name ? [name] : id
      );
    });

  list
    .command('workflows')
    .description('print list of workflow definitions')
    .addHelpText(
      'after',
      `
Example call:
  > list workflows
`
    )
    .action(async opts => {
      await cliCommand(['list', 'workflows'], opts).PrintWorkflows();
    });

  // Add global opts for inner sub-commands
  addGlobalOptions(tags);

  return list;
};
