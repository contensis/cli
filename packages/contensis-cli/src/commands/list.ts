import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { format, output } from './globalOptions';

// projects
// content types
// components
// api keys
// roles
// webhooks

export const list = new Command().command('list');

list.command('envs').action(() => {
  cliCommand(['list', 'envs']).PrintEnvironments();
});
list.command('projects').action(async () => {
  await cliCommand(['list', 'projects']).PrintProjects();
});
list.command('contenttypes').action(async () => {
  await cliCommand(['list', 'contenttypes']).PrintContentTypes();
});
list.command('components').action(async () => {
  await cliCommand(['list', 'components']).PrintComponents();
});
list.command('keys').action(async () => {
  await cliCommand(['list', 'keys']).PrintApiKeys();
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
