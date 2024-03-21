import figlet from 'figlet';
import inquirer from 'inquirer';
import inquirerPrompt from 'inquirer-command-prompt';
import commands from './commands';
import { LogMessages } from './localisation/en-GB';
import CredentialProvider from './providers/CredentialProvider';
import { appRootDir } from './providers/file-provider';
import ContensisCli, { cliCommand } from './services/ContensisCliService';
import { Logging } from './util';
import { logError, Logger } from './util/logger';
import { LIB_VERSION } from './version';

class ContensisShell {
  private currentEnvironment!: string;
  private emptyInputCounter: number = 0;
  private env!: EnvironmentCache;
  private firstStart = true;
  private userId: string = '';
  private log = Logger;
  private messages = LogMessages;

  private refreshEnvironment = () => {
    // Reload any persisted changes from the disk cache
    const {
      cache: { currentEnvironment = '', environments = {} },
    } = new ContensisCli([]);
    // console.log(`refreshing env w/${currentEnvironment}`);
    this.currentEnvironment = currentEnvironment;
    this.env = environments[currentEnvironment];

    // Reload logging here to support changing language
    Logging('en-GB').then(({ messages, Log }) => {
      this.log = Log;
      this.messages = messages;
    });
  };

  constructor() {
    this.refreshEnvironment();
    inquirerPrompt.setConfig({
      history: {
        save: true,
        folder: appRootDir,
        limit: 100,
        blacklist: ['quit'],
      },
    });

    const { log, messages } = this;

    figlet.text(
      messages.app.contensis(),
      {
        font: 'Block',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: process.stdout.columns,
        whitespaceBreak: true,
      },
      (err, data) => {
        if (err) {
          log.error(messages.app.unknownError());
          console.dir(err);
          return;
        }
        console.log(log.successText(data));
        console.log(log.infoText(messages.app.startup(LIB_VERSION)));
        console.log(log.helpText(messages.app.help()));

        this.start().catch(ex => log.error(ex));
      }
    );
  }

  restart = async () => {
    this.firstStart = false;
    this.log.line(); // add a line so we can see where the shell has been restarted
    await this.start();
  };

  start = async () => {
    this.refreshEnvironment();
    this.userId = '';
    const { currentEnvironment, env, log, messages } = this;

    if (env?.lastUserId) {
      const [credsErr, credentials] = await new CredentialProvider(
        {
          userId: env.lastUserId,
          alias: currentEnvironment,
        },
        env.passwordFallback
      ).Init();
      if (credsErr && !credentials.current) {
        log.error(credsErr.message);
      }
      if (credentials.current) {
        if (this.firstStart) {
          const token = await cliCommand(['login', env.lastUserId]).Login(
            env.lastUserId,
            {
              promptPassword: false,
              silent: true,
            }
          );
          if (token) {
            this.userId = env.lastUserId;
            if (!env.currentProject) log.warning(messages.projects.tip());
          }
          this.firstStart = false;
          this.refreshEnvironment();
        } else {
          this.userId = env.lastUserId;
        }
      }
    }
    await this.contensisPrompt();
  };

  contensisPrompt = async (): Promise<any> => {
    const { currentEnvironment, env, log, messages, userId } = this;

    const availableCommands = [
      {
        filter: (str: string) => {
          return str.replace(/ \[.*$/, '');
        },
      },
      'connect',
      'list envs',
      'quit',
    ];

    if (currentEnvironment)
      availableCommands.push('login', 'list projects', 'set project');
    if (userId)
      availableCommands.push(
        'copy field',
        'create key',
        'create project',
        'create role',
        'diff models',
        'execute block action release',
        'execute block action makelive',
        'execute block action rollback',
        'execute block action markasbroken',
        'get assets',
        'get block',
        'get block logs',
        'get contenttype',
        'get component',
        'get entries',
        'get nodes',
        'get model',
        'get project',
        'get proxy',
        'get renderer',
        'get role',
        'get token',
        'get version',
        'get webhook',
        'get workflow',
        'import contenttypes',
        'import components',
        'import entries',
        'import models',
        'import nodes',
        'list blocks',
        'list contenttypes',
        'list components',
        'list keys',
        'list models',
        'list proxies',
        'list renderers',
        'list roles',
        'list webhooks',
        'list workflows',
        'push block',
        'remove components',
        'remove contenttypes',
        'remove key',
        'remove entries',
        'remove nodes',
        'remove role',
        'set project name',
        'set project description',
        'set role name',
        'set role description',
        'set role assignments',
        'set role enabled',
        'set role permissions'
      );

    const prompt = inquirer.createPromptModule();
    prompt.registerPrompt('command', inquirerPrompt);
    return prompt([
      {
        type: 'command',
        name: 'cmd',
        autoCompletion: availableCommands.sort(),
        autocompletePrompt: log.infoText(messages.app.autocomplete()),
        message: `${userId ? `${userId}@` : ''}${currentEnvironment || ''}>`,
        context: 0,
        validate: (val: string) => {
          if (!val) this.emptyInputCounter++;
          if (this.emptyInputCounter > 1)
            console.log(this.log.infoText(this.messages.app.suggestions()));
          if (val) {
            this.emptyInputCounter = 0;
            return true;
          }
        },
        prefix: `${env?.currentProject || log.infoText('contensis')}`,
        short: true,
      },
    ])
      .then(async (answers: { cmd: string }) => {
        if (answers.cmd === 'quit') {
          this.quit();
        } else {
          try {
            if (answers.cmd) {
              const program = commands();
              await program.parseAsync(
                answers.cmd
                  .match(/"[^"]+"|[^\s]+/g)
                  ?.map(e => e.replace(/"(.+)"/, '$1')),
                {
                  from: 'user',
                }
              );
            }
          } catch (ex: any) {
            const str = ex.toString();
            if (!str.includes('CommanderError'))
              logError(
                ex,
                `Shell ${
                  ex instanceof Error
                    ? ex.toString()
                    : JSON.stringify(ex, null, 2)
                }`
              );
          } finally {
            return this.contensisPrompt();
          }
        }
      })
      .catch((err: Error) => {
        log.error(err.message);
        this.quit();
      });
  };

  quit = (error?: Error) => {
    const { log, messages } = this;
    process.removeAllListeners('exit');

    if (error) {
      log.error(error.message);
      process.exit(1);
    } else {
      log.success(messages.app.quit());
      process.exitCode = 0;
      process.exit(0);
    }
  };
}

let globalShell: ContensisShell;

export const shell = () => {
  // Return a benign function for shell().restart() when used in cli context
  // as some commands need to restart the shell to show an updated prompt
  // after successful connect / login / set project
  if (typeof process.argv?.[2] !== 'undefined')
    return {
      quit: ContensisCli.quit,
      restart() {},
    } as any;
  if (!globalShell) globalShell = new ContensisShell();
  return globalShell;
};

process.on('uncaughtException', function (err) {
  // Handle the error safely
  console.log(err);
});

process.on('SIGINT', () => {
  Logger.warning('received SIGINT');
  shell().quit();
  // setTimeout(() => {
  // }, 2000);
});

process.on('SIGTERM', () => {
  Logger.warning('received SIGTERM');
  shell().quit();
});

process.stdin.on('data', key => {
  if ((key as any) == '\u0003') {
    console.log('');
    Logger.info(`[CTRL]+[C] detected, exiting shell...`);
    shell().quit();
  }
});

// process.env.http_proxy = 'http://127.0.0.1:8888';
