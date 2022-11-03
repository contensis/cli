import { Command, Option } from 'commander';

const output = new Option(
  '-o, --output <output>',
  'save output to a file e.g. --output ./output.txt'
);

const format = new Option(
  '-f, --format <format>',
  'format output as csv, json, xml or table (default)'
).choices(['csv', 'json', 'xml', 'table']);

const alias = new Option(
  '-a --alias <alias>',
  'the cloud CMS alias to connect your request with'
);

export const project = new Option(
  '-p --projectId <projectId>',
  'the projectId to make your request with'
);

const user = new Option(
  '-u --user <user>',
  'the username to authenticate your request with'
);
const password = new Option(
  '-pw --password <password>',
  'the password to use to login with (optional/insecure)'
);
const clientId = new Option(
  '-id --clientId <clientId>',
  'the clientId to authenticate your request with'
);
const sharedSecret = new Option(
  '-s --sharedSecret <sharedSecret>',
  'the shared secret to use when logging in with a client id'
);

export const addConnectOptions = (program: Command) =>
  program.addOption(alias.hideHelp()).addOption(project.hideHelp());

export const addAuthenticationOptions = (program: Command) =>
  program
    .addOption(user.hideHelp())
    .addOption(password.hideHelp())
    .addOption(clientId.hideHelp())
    .addOption(sharedSecret.hideHelp());

const addOutputAndFormatOptions = (program: Command) =>
  program.addOption(output).addOption(format);

export const addGlobalOptions = (program: Command) => {
  for (const command of program.commands) {
    addOutputAndFormatOptions(command);
    addConnectOptions(command);
    addAuthenticationOptions(command);
  }
  return program;
};
