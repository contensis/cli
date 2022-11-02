import { Command } from 'commander';
import { Logger } from '~/util/logger';
import { LIB_VERSION } from '~/version';
import { connect } from './connect';
import { create } from './create';
import { makeGetCommand } from './get';
import { list } from './list';
import { login } from './login';
import { remove } from './remove';
import { set } from './set';

const commands = () => {
  const program = new Command()
    .name('contensis')
    .version(LIB_VERSION)
    .configureOutput({
      writeErr: str => {
        return str.toLowerCase().includes('error')
          ? Logger.error(`commands.writeErr ${str}`)
          : str.trim() && Logger.help(str);
      },
    })
    .exitOverride()
    .showHelpAfterError(true);

  program.addCommand(connect.copyInheritedSettings(program));
  program.addCommand(makeGetCommand().copyInheritedSettings(program));
  program.addCommand(list.copyInheritedSettings(program));
  program.addCommand(login.copyInheritedSettings(program));
  program.addCommand(create.copyInheritedSettings(program));
  program.addCommand(set.copyInheritedSettings(program));
  program.addCommand(remove.copyInheritedSettings(program));

  return program;
};

export default commands;
