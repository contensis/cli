import { Command } from 'commander';
import { Logger } from '~/util/logger';
import { LIB_VERSION } from '~/version';
import { makeConnectCommand } from './connect';
import { makeCopyCommand } from './copy';
import { makeCreateCommand } from './create';
import { makeDevCommand } from './dev';
import { makeDiffCommand } from './diff';
import { makeExecuteCommand } from './execute';
import { makeGetCommand } from './get';
import {
  addAuthenticationOptions,
  addConnectOptions,
  addGlobalOptions,
  addImportOptions,
} from './globalOptions';
import { makeImportCommand } from './import';
import { makeListCommand } from './list';
import { makeLoginCommand } from './login';
import { makePushCommand } from './push';
import { makeRemoveCommand } from './remove';
import { makeSetCommand } from './set';
import { makeUpdateCommand } from './update';

const commands = () => {
  const program = new Command()
    .name('contensis')
    .version(LIB_VERSION)
    .configureOutput({
      writeErr: str => {
        return str.toLowerCase().includes('error')
          ? Logger.error(`Command ${str}`)
          : str.trim() && Logger.help(str);
      },
    })
    .addHelpText(
      'after',
      Logger.helpText`
>> Each command has its own help - for example:
  > login --help\n  > get --help
`
    )
    .exitOverride()
    .showHelpAfterError(true);

  program.addCommand(
    addAuthenticationOptions(makeConnectCommand()).copyInheritedSettings(
      program
    )
  );
  program.addCommand(
    addGlobalOptions(makeCreateCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(makeCopyCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addConnectOptions(
      addAuthenticationOptions(makeDevCommand())
    ).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(addImportOptions(makeDiffCommand())).copyInheritedSettings(
      program
    )
  );
  program.addCommand(
    addGlobalOptions(makeExecuteCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(makeGetCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(
      addImportOptions(makeImportCommand())
    ).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(makeListCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addConnectOptions(makeLoginCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(makePushCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(makeRemoveCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addConnectOptions(makeSetCommand()).copyInheritedSettings(program)
  );
  program.addCommand(
    addGlobalOptions(makeUpdateCommand()).copyInheritedSettings(program)
  );

  return program;
};

export default commands;
