import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const makeRemoveCommand = () => {
  const remove = new Command()
    .command('remove')
    .showHelpAfterError(true)
    .exitOverride();

  remove
    .command('project')
    .argument('<projectId>', 'the project id to delete')
    .usage('<projectId>')
    .action(async (projectId, opts) => {
      const project = await cliCommand(
        ['remove', 'project', projectId],
        opts
      ).SetProject(projectId);
      if (project) await shell().start();
    });
  remove
    .command('key')
    .argument('<id>', 'the id of the API key to delete')
    .usage('<id>')
    .addHelpText(
      'after',
      `
Example call:
  > remove key 4ceb9575-28d3-4d5b-a77b-5e5221e603dd
`
    )
    .action(async (id, opts) => {
      await cliCommand(['remove', 'key', id], opts).RemoveApiKey(id);
    });
  return remove;
};
