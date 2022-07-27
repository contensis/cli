import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';

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
