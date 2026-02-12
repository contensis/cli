import { Argument, Command, Option } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const makeSetCommand = () => {
  const set = new Command()
    .command('set')
    .description('set command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  const node = set.command('node').description('update a site view node');

  node
    .command('entry')
    .description('assign an entry to a node')
    .argument('<"node path or id">', 'the path or id of the node to update')
    .argument('<entryId>', 'the new entry id to assign to the node')
    .usage('<"node path or id"> <entryId>')
    .addHelpText(
      'after',
      `
Example call:
  > set node entry /path 1502f64e-e9b1-436b-b62f-e273f639ecb6\n`
    )
    .action(async (nodePathOrId: string, entryId: string, opts) => {
      await cliCommand(['set', 'node', 'entry'], opts).CreateOrUpdateNode(
        nodePathOrId,
        { entryId }
      );
    });

  node
    .command('renderer')
    .description('assign a renderer to a node')
    .argument('<"node path or id">', 'the path or id of the node to update')
    .argument('<rendererUuid>', 'the renderer uuid to assign to the node')
    .option(
      '--is-partial-match-root',
      'should the renderer be used as the partial match root for the node',
      false
    )
    .usage('<"node path or id"> <rendererUuid>')
    .addHelpText(
      'after',
      `
Example call:
  > set node renderer /path 1502f64e-e9b1-436b-b62f-e273f639ecb6 --is-partial-match-root\n`
    )
    .action(async (nodePathOrId: string, rendererId: string, opts) => {
      await cliCommand(['set', 'node', 'renderer'], opts).CreateOrUpdateNode(
        nodePathOrId,
        {
          renderer: {
            id: rendererId,
            isPartialMatchRoot: opts.isPartialMatchRoot,
          },
        }
      );
    });

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
    .addOption(
      new Option(
        '--block-actions [block-actions...]',
        'the block actions to add to the role permissions'
      ).choices([
        'push',
        'release',
        'manageLive',
        'manualStartStop',
        'markAsBroken',
        'delete',
        'view',
        '*',
      ])
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
            blocks: opts.blockActions
              ? { actions: opts.blockActions }
              : undefined,
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
