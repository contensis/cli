import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const makeCreateCommand = () => {
  const create = new Command()
    .command('create')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  create
    .command('project')
    .argument('<projectId>', 'the id of the project to create')
    .usage('<projectId>')
    .addHelpText('after', `\n`)
    .action(async (projectId: string, opts: any) => {
      const project = await cliCommand(
        ['create', 'project', projectId],
        opts
      ).SetProject(projectId);
      if (project) await shell().restart();
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
    .action(async (name: string, description: string, opts: any) => {
      await cliCommand(['create', 'key', name], opts).CreateApiKey(
        name,
        description
      );
    });

  return create;
};
