import { Command } from 'commander';
import { cliCommand } from '~/services/ContensisCliService';
import { shell } from '~/shell';

export const login = new Command()
  .command('login')
  .argument('<user/clientId>', 'the username to login with')
  .argument(
    '[password]',
    'the password to use to login with (optional/insecure)'
  )
  .option(
    '-s --sharedSecret <sharedSecret>',
    'the shared secret to use when logging in with a client id'
  )
  .usage('<user/clientId> [password] [-s <sharedSecret>]')
  .addHelpText(
    'after',
    `
Example call:
  > login myuserid\n  -- or --\n  > login {clientId} -s {sharedSecret}`
  )
  .action(async (user, password, opts) => {
    const token = await cliCommand(['login', user]).Login(user, {
      password,
      sharedSecret: opts.sharedSecret,
    });
    if (token) await shell().start();
  });
