import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';

export const makeGetCommand = () => {
  const program = new Command()
    .command('get')
    .showHelpAfterError(true)
    .exitOverride();

  program.command('tea').action(() => {
    console.log('get tea');
  });
  program.command('coffee').action(() => {
    console.log('get coffee');
  });

  program
    .command('contenttype')
    .argument('<contentTypeId>', 'the API id of the content type to get')
    .addHelpText(
      'after',
      `
Example call:
  > get contenttype {contentTypeId} -o content-type-backup.json
`
    )
    .action(async (contentTypeId: string, opts) => {
      await cliCommand(['get', 'contenttype'], opts).PrintContentType(
        contentTypeId
      );
    });
  program
    .command('component')
    .argument('<componentId>', 'the API id of the component to get')
    .addHelpText(
      'after',
      `
Example call:
  > get component {componentId} -o component-backup.json
`
    )
    .action(async (componentId: string, opts) => {
      await cliCommand(['get', 'contenttype'], opts).PrintComponent(
        componentId
      );
    });
  program
    .command('entries')
    .argument(
      '[search phrase]',
      'get entries with the search phrase, use quotes for multiple words'
    )
    .option('-i --id <id...>', 'the entry id to get')
    .option(
      '-d, --dependents',
      'find and return any dependencies of all found entries'
    )
    .option(
      '-fi, --fields <fields...>',
      'limit the output fields on returned entries'
    )
    .option(
      '-q, --zenql <zenql>',
      'get entries with a supplied ZenQL statement'
    )
    .addHelpText(
      'after',
      `
Example call:
  > get entries --zenql "sys.contentTypeId = blog" --fields entryTitle entryDescription sys.id --output ./blog-posts.csv --format csv
`
    )
    .action(async (phrase: string, opts, cmd) => {
      // console.log('phrase: ', phrase, '\nopts:', JSON.stringify(opts, null, 2));
      // console.log('opts:', JSON.stringify(opts, null, 2));
      await cliCommand(['get', 'entries'], opts, {
        query:
          opts.id || phrase || opts.fields
            ? {
                fields: opts.fields,
                includeIds: opts.id,
                searchTerm: phrase,
              }
            : undefined,
        zenQL: opts.zenql,
      }).GetEntries({
        withDependents: opts.dependents,
      });
    });

  return program;
};

export const get = makeGetCommand();
