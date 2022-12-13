import { Command } from 'commander';
import { Project } from 'contensis-core-api';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';
import { isUuid } from '~/util';

export const makeCreateCommand = () => {
  const create = new Command()
    .command('create')
    .description('create command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  create
    .command('project')
    .description('create a new project')
    .argument('<projectId>', 'the id of the project to create')
    .argument('<name>', 'the name of the project to create')
    .argument('[description]', 'optional description of the project')
    .option(
      '-l, --language',
      'the default language of the project to create',
      'en-GB'
    )
    .option(
      '-langs, --supported-languages <langs...>',
      'space separated list of other supported languages'
    )
    .usage(
      'projectId "Project name" ["Description of project"] --language en-GB --supported-languages es-ES de-DE nl-NL'
    )
    .addHelpText('after', `\n`)
    .action(
      async (projectId: string, name: string, description = '', opts: any) => {
        const createProject: Project = {
          id: projectId,
          name,
          description,
          primaryLanguage: opts.language,
          supportedLanguages: opts.supportedLanguages || [],
        };

        const project = await cliCommand(
          ['create', 'project', projectId],
          opts
        ).CreateProject(createProject);
        if (project) await shell().restart();
      }
    );

  create
    .command('key')
    .description('create a new api key')
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

  create
    .command('role')
    .description('create a new role')
    .argument('<"Role name">', 'the name of the role to create')
    .argument('["Role description">', 'the description of the role')
    .option('--disabled', 'do not enable the created role', false)
    .addHelpText(
      'after',
      `
Example call:
  > create role "My role" "This role is for testing" --disabled \n`
    )
    .action(async (roleName: string, description: string, opts) => {
      await cliCommand(['create', 'role', roleName], opts).CreateRole({
        name: roleName,
        description,
        enabled: !opts.disabled,
        assignments: { apiKeys: [], groups: [], users: [] },
        permissions: { contentTypes: [], entries: [] },
      });
    });

  return create;
};
