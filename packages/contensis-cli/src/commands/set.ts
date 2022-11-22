import { Argument, Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const makeSetCommand = () => {
  const set = new Command()
    .command('set')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  const project = set
    .command('project')
    .argument('<projectId>', 'the project id to work with')
    .usage('<projectId>')
    .addHelpText('after', `\n`)
    .action(async projectId => {
      const nextProjectId = cliCommand([
        'set',
        'project',
        projectId,
      ]).SetProject(projectId);
      if (nextProjectId) await shell().restart();
    });

  project
    .command('name')
    .argument('<"Project name">', 'update the current project name')
    .usage('<"Project name">')
    .addHelpText(
      'after',
      `
Example call:
  > set project name "Project name"\n`
    )
    .action(async (name: string, opts) => {
      const success = await cliCommand(
        ['set', 'project', 'name'],
        opts
      ).UpdateProject({
        name,
      });
      if (success) await shell().restart();
    });

  project
    .command('description')
    .argument(
      '<"Project description">',
      'update the current project description'
    )
    .usage('<"Project description">')
    .addHelpText(
      'after',
      `
Example call:
  > set project description "Description of project"\n`
    )
    .action(async (description: string, opts) => {
      const success = await cliCommand(
        ['set', 'project', 'description'],
        opts
      ).UpdateProject({
        description,
      });
      if (success) await shell().restart();
    });

  set
    .command('version')
    .addArgument(
      new Argument('<versionStatus>', 'content version status')
        .choices(['latest', 'published'])
        .default('latest')
    )
    .usage('<latest/published>')
    .addHelpText('after', `\n`)
    .action(async versionStatus => {
      const success = cliCommand(['set', 'version', versionStatus]).SetVersion(
        versionStatus
      );
      if (success) await shell().restart();
    });

  return set;
};
