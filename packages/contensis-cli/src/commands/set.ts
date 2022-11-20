import { Argument, Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const makeSetCommand = () => {
  const set = new Command()
    .command('set')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();
  set
    .command('project')
    .argument('<projectId>', 'the project id to work with')
    .usage('<projectId>')
    .addHelpText('after', `\n`)
    .action(async projectId => {
      const project = cliCommand(['set', 'project', projectId]).SetProject(
        projectId
      );
      if (project) await shell().restart();
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
