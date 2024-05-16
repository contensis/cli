import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { mapContensisOpts, noCache } from './globalOptions';

export const makeListCommand = () => {
  const list = new Command()
    .command('list')
    .description('list command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
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
      ).PrintContentModels();
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

  return list;
};
