import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { addGlobalOptions } from './globalOptions';

// projects
// content types
// components
// api keys
// roles
// webhooks

export const list = new Command()
  .command('list')
  // .hook('preAction', (t, a) => {
  //   console.log('preAction list command');
  //   console.log('args: ', a.args);
  //   console.log('opts: ', a.opts());
  // })
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
  .action(opts => {
    cliCommand(['list', 'envs'], opts).PrintEnvironments();
  });
list.command('projects').action(async opts => {
  await cliCommand(['list', 'projects'], opts).PrintProjects();
});
list
  .command('contenttypes')
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
  .action(async (name?: string, { id, format, output }: any = {}) => {
    await cliCommand(['list', 'webhooks'], {
      format,
      output,
    }).PrintWebhookSubscriptions(id, name);
  });

addGlobalOptions(list);
