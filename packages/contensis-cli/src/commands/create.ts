import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const create = new Command()
  .command('create')
  .showHelpAfterError(true)
  .exitOverride();

create
  .command('project')
  .argument('<projectId>', 'the project id to create')
  .usage('<projectId>')
  .action(async projectId => {
    const project = await cliCommand([
      'create',
      'project',
      projectId,
    ]).SetProject(projectId);
    if (project) await shell().start();
  });
create
  .command('key')
  .argument('<"key name">', 'the name of the key to create')
  .argument('["description"]', 'provide a description for the key (optional)')
  .usage('<"key name"> ["description"] (both args in "double quotes")')
  .addHelpText(
    'after',
    `
Example call:
  > create key "my new key" "Created key for demonstration"\n`
  )
  .action(async (name, description) => {
    await cliCommand(['create', 'key', name]).CreateApiKey(name, description);
    // if (success) await shell().start();
  });
