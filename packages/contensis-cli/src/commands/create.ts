import { Command } from 'commander';
import { Project } from 'contensis-core-api';
import { addGlobalOptions, commit } from './globalOptions';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';
import { toApiId } from '~/util/api-ids';

export const makeCreateCommand = () => {
  const create = new Command()
    .command('create')
    .description('create command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .enablePositionalOptions()
    .exitOverride();

  create
    .command('project')
    .description('create a new project')
    .argument('<projectId>', 'the id of the project to create')
    .argument('<name>', 'the name of the project to create')
    .argument('[description]', 'optional description of the project')
    .option(
      '-l --language <language>',
      'the default language of the project to create',
      'en-GB'
    )
    .option(
      '-langs --supported-languages <langs...>',
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
          deliverySysExclusions: [],
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

  create
    .command('taggroup')
    .description('create a new tag group')
    .argument('<groupId>', 'the API id of the tag group to create')
    .argument('<"Name">', 'the name of the tag group to create')
    .argument('["Description"]', 'a description for the tag group')
    .option(
      '--tags <tagNames...>',
      'a list of tag names to create under the new tag group'
    )
    .addOption(commit)
    .addHelpText(
      'after',
      `
  Example call:
    > create taggroup example "Example tags" "This group is a test" 
    > create taggroup topics "Topics" --tags Books Faces History Places Spelling \n`
    )
    .action(
      async (groupId: string, name: string, description: string, opts) => {
        const tagGroup = {
          id: groupId,
          name,
          description,
        };

        await cliCommand(
          ['create', 'taggroup', groupId, name],
          opts
        ).ImportTagGroups({
          commit: opts.commit,
          data: [tagGroup],
          tags: opts.tags?.map((label: string) => ({
            groupId,
            label: { 'en-GB': label },
            value: toApiId(label, 'camelCase', true),
          })),
        });
      }
    );

  const tags = create
    .command('tags')
    .description('create new tags in a tag group')
    .argument('<"Label"...>', 'create tag(s) with label(s)')
    .passThroughOptions()
    .option('-in --group <groupId>', 'create tags in this tag group')
    .addOption(commit)
    .addHelpText(
      'after',
      `
    Example call:
      > create tags "Test tag" --group example
      > create tags Books Faces History Places Spelling -in topics \n`
    )
    .action(async (tagLabels: string[], opts) => {
      const groupId = opts.group;
      const cli = cliCommand(['create', 'tags', ...tagLabels], opts);

      const language =
        cli.env.projects.find(p => p.id === cli.env.currentProject)
          ?.primaryLanguage || 'en-GB';

      await cli.ImportTags({
        commit: opts.commit,
        data: tagLabels.map(label => ({
          groupId,
          label: { [language]: label },
          value: toApiId(label, 'camelCase', true),
        })),
      });
    });

  tags
    .command('in')
    .description('create new tags in a tag group')
    .argument('<groupId>', 'create tag(s) in this tag group')
    .argument('<"Label"...>', 'create tag(s) with label(s)')
    .addOption(commit)
    .addHelpText(
      'after',
      `
    Example call:
      > create tags in example "Tag 1" "Second Tag" Third
      > create tags ih topics Books Faces History Places Spelling \n`
    )
    .action(async (groupId: string, tagLabels: string[], opts, cmd) => {
      // workaround for opts.commit being always false
      // read the (shared) options that were parsed by the parent cmd
      // https://github.com/tj/commander.js/issues/476#issuecomment-1675757628
      const parentOptions = cmd.optsWithGlobals();

      const cli = cliCommand(['create', 'tags', 'in', groupId, ...tagLabels], {
        ...opts,
        ...parentOptions,
      });

      const language =
        cli.env.projects.find(p => p.id === cli.env.currentProject)
          ?.primaryLanguage || 'en-GB';

      await cli.ImportTags({
        commit: parentOptions.commit,
        data: tagLabels.map(label => ({
          groupId,
          label: { [language]: label },
          value: toApiId(label, 'camelCase', true),
        })),
      });
    });

  // Add global opts for inner sub-commands
  addGlobalOptions(tags);

  return create;
};
