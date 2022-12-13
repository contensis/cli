import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';

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
    .action(opts => {
      cliCommand(['list', 'envs'], opts).PrintEnvironments();
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
    .addHelpText(
      'after',
      `
Example call:
  > list models
`
    )
    .action(async opts => {
      await cliCommand(['list', 'models'], opts).PrintContentModels();
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
        id,
        name
      );
    });
  return list;
};
