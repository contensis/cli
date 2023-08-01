import { Argument, Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const makeSetCommand = () => {
  const set = new Command()
    .command('set')
    .description('set command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  const project = set
    .command('project')
    .description('set current working project')
    .argument('<projectId>', 'the project id to work with')
    .usage('<projectId>')
    .addHelpText(
      'after',
      `
Example call:
  > set project website\n`
    )
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
    .description('update project name')
    .argument('<"Project name">', 'update the current project name')
    .usage('<"Project name">')
    .addHelpText(
      'after',
      `
Example call:
  > set project name "Project name"\n`
    )
    .action(async (name: string, opts) => {
      await cliCommand(['set', 'project', 'name'], opts).UpdateProject({
        name,
      });
    });

  project
    .command('description')
    .description('update project description')
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
      await cliCommand(['set', 'project', 'description'], opts).UpdateProject({
        description,
      });
    });

  const role = set.command('role').description('update a role');

  role
    .command('name')
    .description('update role name')
    .argument('<"Role name">', 'update the existing role name')
    .argument('<"New name">', 'the new name for the role')
    .usage('<"Role name"> <"New name">')
    .addHelpText(
      'after',
      `
Example call:
  > set role name "Existing name" "New role name"\n`
    )
    .action(async (roleNameOrId: string, newName: string, opts) => {
      await cliCommand(['set', 'role', 'name'], opts).UpdateRole(roleNameOrId, {
        name: newName,
      });
    });

  role
    .command('description')
    .description('update role description')
    .argument('<"Role name" or id>', 'the existing role name or id to update')
    .argument('<"New description">', 'the new description for the role')
    .usage('<"Role name"> <"New description">')
    .addHelpText(
      'after',
      `
Example call:
  > set role description "Existing role" "New role description"\n`
    )
    .action(async (roleNameOrId: string, description: string, opts) => {
      await cliCommand(['set', 'role', 'description'], opts).UpdateRole(
        roleNameOrId,
        {
          description,
        }
      );
    });

  role
    .command('enabled')
    .description('enable or disable a role')
    .argument('<"Role name" or id>', 'the existing role name or id to update')
    .usage('<"Role name"> --disabled')
    .option('--disabled', 'disable the role', false)
    .addHelpText(
      'after',
      `
Example call:
  > set role enabled "Existing role"\n
  > set role enabled "Other role" --disabled\n`
    )
    .action(async (roleNameOrId: string, opts) => {
      await cliCommand(
        ['set', 'role', opts.disabled ? 'disabled' : 'enabled'],
        opts
      ).UpdateRole(roleNameOrId, {
        enabled: !opts.disabled,
      });
    });

  role
    .command('assignments')
    .description('assign users, groups or keys to a role')
    .argument('<"Role name" or id>', 'the role name or id to update')
    .option(
      '-users --assign-users [assign-users...]',
      'the user id(s) to assign'
    )
    .option(
      '-groups --assign-groups [assign-groups...]',
      'the groups name(s) to assign'
    )
    .option('-keys --assign-keys [assign-keys...]', 'the key name(s) to assign')
    .addHelpText(
      'after',
      `
Example call:
  > set role assignments "My role" --assign-users admin \n`
    )
    .action(async (roleNameOrId: string, opts) => {
      await cliCommand(['set', 'role', 'assignments'], opts).UpdateRole(
        roleNameOrId,
        {
          assignments: {
            apiKeys: opts.assignKeys || undefined,
            groups: opts.assignGroups || undefined,
            users: opts.assignUsers || undefined,
          },
        }
      );
    });

  role
    .command('permissions')
    .description('add entry permissions to a role')
    .argument('<"Role name" or id>', 'the role name or id to update')
    .option(
      '-contenttypes --content-type-ids [content-type-id...]',
      'any content type ids to add permissions for'
    )
    .option(
      '--entry-actions [entry-actions...]',
      'the entry actions to add to the role permissions'
    )
    .option(
      '--entry-languages [entry-languages...]',
      'the entry languages to add to the role permissions'
    )
    .addHelpText(
      'after',
      `
Example call:
  > set role permissions "My role" --content-type-id blogs -- \n`
    )
    .action(async (roleNameOrId: string, opts) => {
      await cliCommand(['set', 'role', 'permissions'], opts).UpdateRole(
        roleNameOrId,
        {
          permissions: {
            entries: opts.contentTypeIds?.map((id: string) => ({
              id,
              actions: opts.entryActions || [],
              languages: opts.entryLanguages || [],
            })),
          },
        }
      );
    });

  set
    .command('version')
    .description('set content version')
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
