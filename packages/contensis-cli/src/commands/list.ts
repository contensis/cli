import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { format, output } from './globalOptions';

// projects
// content types
// components
// api keys
// roles
// webhooks

export const list = new Command()
  .command('list')
  .showHelpAfterError(true)
  .exitOverride();

list
  .command('envs')
  .addHelpText(
    'after',
    `
Example call:
  > list envs
`
  )
  .action(() => {
    cliCommand(['list', 'envs']).PrintEnvironments();
  });
list
  .command('projects')
  .addOption(format)
  .addOption(output)
  .action(async opts => {
    await cliCommand(['list', 'projects'], opts).PrintProjects();
  });
list
  .command('contenttypes')
  .addOption(format)
  .addOption(output)
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
  .addOption(format)
  .addOption(output)
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
  .command('keys')
  .addOption(format)
  .addOption(output)
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
  .command('webhooks')
  .argument('[name]', 'find webhooks matching the supplied name')
  .option('-id --id <id...>', 'the subscription id(s) to get')
  .addOption(format)
  .addOption(output)
  .action(async (name?: string, { id, format, output }: any = {}) => {
    await cliCommand(['list', 'webhooks'], {
      format,
      output,
    }).PrintWebhookSubscriptions(id, name);
  });
