import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';
import { Logger } from '~/util/logger';
import { commit, mapContensisOpts, zenql } from './globalOptions';

export const makeRemoveCommand = () => {
  const remove = new Command()
    .command('remove')
    .description('remove command')
    .addHelpText('after', `\n`)
    .showHelpAfterError(true)
    .exitOverride();

  remove
    .command('project')
    .description('remove an entire project')
    .argument('<projectId>', 'the project id to delete')
    .usage('<projectId>')
    .addHelpText('after', `\n`)
    .action(async (projectId, opts) => {
      const project = await cliCommand(
        ['remove', 'project', projectId],
        opts
      ).SetProject(projectId);
      if (project) await shell().restart();
    });

  remove
    .command('key')
    .description('remove api key')
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

  remove
    .command('role')
    .description('remove a role')
    .argument('<"Role name" or id>', 'the existing role name or id to delete')
    .addHelpText(
      'after',
      `
Example call:
  > remove role "My role"\n`
    )
    .action(async (roleNameOrId: string, opts) => {
      await cliCommand(['remove', 'role', roleNameOrId], opts).RemoveRole(
        roleNameOrId
      );
    });

  remove
    .command('components')
    .description('delete components')
    .argument('<id...>', 'the id(s) of the components to delete')
    .addOption(commit)
    .usage('<id> [--commit]')
    .addHelpText(
      'after',
      `
Example call:
  > remove components addressComponent
`
    )
    .action(async (id: string[], opts) => {
      await cliCommand(
        ['remove', 'components', id.join(' ')],
        opts
      ).RemoveComponents(id, opts.commit);
    });

  remove
    .command('contenttypes')
    .description('delete content types')
    .argument('<id...>', 'the id(s) of the content types to delete')
    .addOption(commit)
    .usage('<id> [--commit]')
    .addHelpText(
      'after',
      `
Example call:
  > remove contenttypes blogPost
`
    )
    .action(async (id: string[], opts) => {
      await cliCommand(
        ['remove', 'contenttypes', id.join(' ')],
        opts
      ).RemoveContentTypes(id, opts.commit);
    });

  const removeEntries = remove
    .command('entries')
    .description('delete entries')
    .argument(
      '[ids...]',
      'the entry id(s) to delete ...or add *** if you wish to delete all entries in all content types'
    )
    .addOption(zenql)
    .addOption(commit)
    .addHelpText(
      'after',
      `
Example call:
  > remove entries a1c25591-8c9b-50e2-96d8-f6c774fcf023 8df914cc-1da1-59d6-86e0-8ea4ebd99aaa
  > remove entries --zenql "sys.contentTypeId = test"
`
    )
    .action(async (entryIds: string[], opts) => {
      const removeAll = entryIds?.[0] === '***';

      // Remove all asterisks from args
      if (entryIds?.[0] && !entryIds[0].replace(/\*/g, '')) entryIds.pop();

      const hasArgs = !!(entryIds?.length || opts.zenql || removeAll);
      if (!hasArgs) {
        Logger.help(
          `Not enough arguments supplied\n\n${removeEntries.helpInformation()}`
        );
      } else {
        await cliCommand(
          ['remove', 'entries', entryIds.join(' ')],
          opts,
          mapContensisOpts({ entryIds, ...opts })
        ).RemoveEntries(opts.commit);
      }
    });

  remove
    .command('nodes')
    .description('delete nodes from the site view tree')
    .argument('<root>', 'remove nodes from the specified path e.g. /blog or /')
    .addOption(commit)
    .addHelpText(
      'after',
      `
Example call:
  > remove nodes /blog
`
    )
    .action(async (root: string, opts) => {
      await cliCommand(
        ['remove', 'nodes', root],
        opts,
        mapContensisOpts({ paths: root.split(' '), ...opts })
      ).RemoveNodes(opts.commit);
    });

  return remove;
};
