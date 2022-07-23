import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { format, output } from './globalOptions';

export const makeGetCommand = () => {
  const program = new Command().command('get');
  program.command('tea').action(() => {
    console.log('get tea');
  });
  program.command('coffee').action(() => {
    console.log('get coffee');
  });
  program
    .command('contenttype')
    .argument('<contentTypeId>', 'the API id of the content type to get')
    .action(async (contentTypeId: string) => {
      await cliCommand(['get', 'contenttype']).PrintContentType(contentTypeId);
    });
  program
    .command('component')
    .argument('<componentId>', 'the API id of the component to get')
    .action(async (componentId: string) => {
      await cliCommand(['get', 'contenttype']).PrintComponent(componentId);
    });
  program
    .command('entries')
    .argument(
      '[search phrase]',
      'get entries with the search phrase, use quotes for multiple words'
    )
    .option('-id --id <id...>', 'the entry id to get')
    .option(
      '-d, --dependents',
      'find and return any dependencies of all found entries'
    )
    .option(
      '-f, --fields <fields...>',
      'limit the output fields on returned entries'
    )
    .option(
      '-q, --zenql <zenql>',
      'get entries with a supplied ZenQL statement'
    )
    .addOption(format)
    .addOption(output)
    .action(async (phrase: string, opts, cmd) => {
      // console.log('phrase: ', phrase, '\nopts:', JSON.stringify(opts, null, 2));
      // console.log('opts:', JSON.stringify(opts, null, 2));
      await cliCommand(['get', 'entries'], {
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
        format: opts.format,
        output: opts.output,
        withDependents: opts.dependents,
      });
    });
  return program;
};

export const get = makeGetCommand();
