import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import inquirer from 'inquirer';
import to from 'await-to-js';
import { Component, ContentType } from 'contensis-core-api';
import { isUuid, url } from '~/util';
import SessionCacheProvider from '../providers/SessionCacheProvider';
import ContensisAuthService from './ContensisAuthService';
import CredentialProvider from '~/providers/CredentialProvider';
import { Logger } from '~/logger';
import { LogMessages } from '~/localisation/en-GB';
import { ContensisMigrationService, MigrateRequest } from 'migratortron';
import { logEntriesTable } from 'migratortron/dist/transformations/logging';
import { entriesToCsv } from '~/csv';
import { entriesToXml } from '~/xml';

type OutputFormat = 'json' | 'csv' | 'xml';

type OutputOptions = {
  format?: OutputFormat;
  output?: string;
};

class ContensisCli {
  static quit = (error?: Error) => {
    process.removeAllListeners('exit');
    process.exit(error ? 1 : 0);
  };

  cache: SessionCache;
  contensis?: ContensisMigrationService;
  contensisOpts: Partial<MigrateRequest> | { id: string } = {};
  contentTypes?: ContentType[];
  components?: Component[];
  currentEnv: string;
  currentProject: string;
  env: EnvironmentCache;
  urls:
    | {
        api: string;
        cms: string;
        liveWeb: string;
        previewWeb: string;
        iisWeb: string;
        iisPreviewWeb: string;
      }
    | undefined;
  private command: CliCommand;
  private format?: OutputFormat;
  private output?: string;
  private log = Logger;
  private messages = LogMessages;
  private session: SessionCacheProvider;

  verb: string;
  noun: string;
  thirdArg: string;

  constructor(
    args: string[],
    outputOpts?: OutputOptions,
    contensisOpts: Partial<MigrateRequest> | { id: string } = {}
  ) {
    // console.log('args: ', JSON.stringify(args, null, 2));

    const [exe, script, verb = '', noun = '', ...restArgs] = args;
    this.verb = verb?.toLowerCase();
    this.noun = noun?.toLowerCase();
    this.thirdArg = restArgs?.[0];

    const commandText = `${this.verb} ${this.noun} ${
      restArgs ? restArgs.join(' ') : ''
    }`.trim();

    this.session = new SessionCacheProvider();
    this.cache = this.session.Get();
    this.contensisOpts = contensisOpts;
    this.format = outputOpts?.format;
    this.output =
      outputOpts?.output && path.join(__dirname, '../../', outputOpts.output);

    const { currentEnvironment = '', environments = {} } = this.cache;
    const env = (this.env = environments[currentEnvironment]);
    this.currentEnv = currentEnvironment;
    this.currentProject = env?.currentProject || 'null';

    if (currentEnvironment) {
      this.urls = url(currentEnvironment, env?.currentProject || 'website');
    }

    this.command = {
      commandText,
      createdDate: new Date().toISOString(),
      createdUserId: env?.lastUserId,
    };

    if (currentEnvironment) {
      if (!env) {
        environments[currentEnvironment] = {
          history: [this.command],
          lastUserId: '',
          projects: [],
          versionStatus: 'latest',
        };
      } else {
        env.history = [this.command];
      }
    }
    if (commandText)
      this.session.Update({ environments, history: [commandText] });
  }

  PrintEnvironments = () => {
    const { log, messages } = this;
    const { currentEnvironment, environments = {} } = this.cache;
    const envKeys = Object.keys(environments);
    log.success(messages.envs.found(envKeys.length));
    for (const env of envKeys) {
      console.log(`  - ${currentEnvironment === env ? '* ' : ''}${env}`);
    }
    if (envKeys.length) console.log('');
    if (envKeys.length === 0 || !currentEnvironment) {
      log.help(messages.envs.tip());
    }
  };

  Connect = async (environment: string) => {
    const { cache, log, messages, session } = this;

    if (environment) {
      this.currentEnv = environment;
      this.env = cache.environments[environment];
      this.urls = url(environment, 'website');

      const [fetchErr, response] = await to(fetch(this.urls.cms));
      if (response && response?.status < 400) {
        log.success(messages.connect.connected(environment));

        if (this.env?.lastUserId) {
          await this.ConnectContensis();
          await this.PrintProjects();
        } else {
          log.warning(messages.projects.noList());
          log.help(messages.connect.tip());
          cache.environments[environment] = {
            versionStatus: 'published',
            history: [],
            lastUserId: '',
            projects: [],
          };
        }

        session.Update({
          currentEnvironment: environment,
          environments: cache.environments,
        });
      } else {
        // Cannot reach environment - status X
        log.error(
          messages.connect.unreachable(this.urls.cms, response?.status || 0)
        );
      }
    } else {
      // No environment alias specified
      log.error(messages.connect.noEnv());
    }
  };

  ConnectContensis = async () => {
    const { contensisOpts, currentEnv, env, log, messages } = this;
    const userId = env?.lastUserId;
    const isGuidId = userId && isUuid(userId);

    if (currentEnv && userId) {
      const [credentialError, storedCredentials] = await new CredentialProvider(
        userId,
        currentEnv
      ).Init();

      if (credentialError) {
        // Log problem with Credential Provider
        log.error(credentialError as any);
        return;
      }
      const cachedPassword = storedCredentials?.current?.password;

      if (cachedPassword) {
        this.contensis = new ContensisMigrationService({
          source: {
            url: this.urls?.cms || '',
            username: !isGuidId ? userId : undefined,
            password: !isGuidId ? cachedPassword : undefined,
            clientId: isGuidId ? userId : undefined,
            sharedSecret: isGuidId ? cachedPassword : undefined,
            project: env?.currentProject || '',
            assetHostname: this.urls?.previewWeb,
          },
          concurrency: 3,
          outputProgress: true,
          ...contensisOpts,
        });
      }
    } else {
      if (!currentEnv) log.help(messages.connect.help());
      if (!userId) log.help(messages.connect.tip());
    }
  };

  Login = async (
    userId: string,
    {
      password,
      promptPassword = true,
      sharedSecret,
      silent = false,
    }: {
      password?: string;
      promptPassword?: boolean;
      sharedSecret?: string;
      silent?: boolean;
    }
  ): Promise<string | undefined> => {
    let inputPassword = password;
    const { log, messages } = this;

    if (userId) {
      const { cache, currentEnv, env } = this;

      if (currentEnv) {
        const [credentialError, storedCredentials] =
          await new CredentialProvider(userId, currentEnv).Init();

        if (credentialError) {
          // Log problem with Credential Provider
          log.error(credentialError as any);
          return;
        }
        const cachedPassword = storedCredentials?.current?.password;

        if (
          !sharedSecret &&
          !inputPassword &&
          !cachedPassword &&
          promptPassword
        ) {
          // Password prompt
          ({ inputPassword } = await inquirer.prompt([
            {
              type: 'password',
              message: messages.login.passwordPrompt(currentEnv, userId),
              name: 'inputPassword',
              mask: '*',
              prefix: undefined,
            },
          ]));
        }

        if (sharedSecret || inputPassword || cachedPassword) {
          const auth = new ContensisAuthService({
            username: userId,
            password: inputPassword || cachedPassword,
            projectId: env?.currentProject || 'website',
            rootUrl: this.urls?.cms || '',
            clientId: userId,
            clientSecret: sharedSecret,
          });

          const [authError, bearerToken] = await to(auth.BearerToken());

          // Login successful
          if (bearerToken) {
            env.lastUserId = userId;
            env.authToken = bearerToken;
            if (!silent) {
              Logger.success(messages.login.success(currentEnv, userId));
              await this.PrintProjects();
            }
            if (inputPassword) await storedCredentials.Save(inputPassword);
          } else if (authError) {
            Logger.error(authError.toString());
            env.lastUserId = '';
            env.authToken = '';
            if (cachedPassword) {
              // Remove any bad stored credential and trigger login again
              await storedCredentials.Delete();
              return await this.Login(userId, { password, sharedSecret });
            }
          }
          this.session.Update({
            environments: cache.environments,
          });
          return env.authToken;
        } else {
          Logger.error(messages.login.passwordPrompt(currentEnv, userId));
        }
      } else {
        // No environment set, use `contensis connect {alias}` first
        Logger.error(messages.login.noEnv());
      }
    } else {
      // No user id specified
      Logger.error(messages.login.noUserId());
    }
  };

  PrintProjects = async () => {
    const { cache, currentEnv, currentProject, log, messages, session } = this;
    if (!this.contensis) await this.ConnectContensis();

    if (this.contensis) {
      // Retrieve projects list for env
      const [projectsErr, projects] = await to(
        this.contensis.projects.GetSourceProjects()
      );

      if (Array.isArray(projects)) {
        // save these projects in cache
        const currentVals = cache.environments[currentEnv] || {};
        const nextCurrentProject =
          currentProject && currentProject !== 'null'
            ? currentProject
            : projects.some(p => p.id === 'website')
            ? 'website'
            : undefined;

        cache.environments[currentEnv] = {
          ...currentVals,
          projects: projects.map(p => p.id),
          currentProject: nextCurrentProject,
        };

        // print the projects to console
        log.success(messages.projects.list());
        for (const project of projects) {
          console.log(
            `  - ${nextCurrentProject === project.id ? '* ' : ''}[${
              project.primaryLanguage
            }] ${project.id}`
          );
        }
        console.log('');

        session.Update({
          environments: cache.environments,
        });

        if (nextCurrentProject) {
          this.env = cache.environments[currentEnv];
          this.SetProject(nextCurrentProject);
        }
      }

      if (projectsErr) {
        log.error(messages.projects.noList());
        log.error(projectsErr.message);
      }
      // } else {
      //   log.warning(messages.projects.noList());
      //   log.help(messages.connect.tip());
    }
  };

  SetProject = async (projectId = '') => {
    const { cache, env, log, messages, session } = this;
    let nextProjectId: string | undefined;
    if (env?.projects.length > 0 && env?.lastUserId) {
      nextProjectId = env.projects.find(
        p => p.toLowerCase() === projectId.toLowerCase()
      );
      if (nextProjectId) {
        env.currentProject = nextProjectId;
        session.Update({
          environments: cache.environments,
        });
        log.success(messages.projects.set(projectId));
      } else {
        log.error(messages.projects.failedSet(projectId));
      }
    } else {
      // No projects for currentEnv, try logging in
      log.warning(messages.projects.noList());
      log.help(messages.connect.tip());
    }
    return nextProjectId;
  };

  SetVersion = async (versionStatus: 'latest' | 'published') => {
    const { cache, env, log, messages, session } = this;
    if (!['latest', 'published'].includes(versionStatus)) {
      log.error(messages.version.invalid(versionStatus));
      return false;
    }
    if (!env) {
      log.help(messages.version.noEnv());
      return false;
    }
    if (env?.projects.length > 0 && env?.lastUserId) {
      env.versionStatus = versionStatus;
      session.Update({
        environments: cache.environments,
      });
      log.success(messages.version.set(this.currentEnv, versionStatus));
      return true;
    } else {
      // No projects for currentEnv, try logging in
      log.warning(messages.projects.noList());
      log.help(messages.connect.tip());
      return false;
    }
  };

  HydrateContensis = async () => {
    const { log } = this;
    if (!this.contensis) await this.ConnectContensis();

    if (this.contensis) {
      // Retrieve content types list for env
      const [contensisErr, models] = await to(
        this.contensis.models.HydrateContensisRepositories()
      );

      if (contensisErr) {
        log.error(contensisErr.message);
        return contensisErr;
      }
    }
  };

  PrintApiKeys = async () => {
    const { currentEnv, log, messages } = this;
    if (!this.contensis) await this.ConnectContensis();

    if (this.contensis) {
      // Retrieve keys list for env
      const [keysErr, apiKeys] = await this.contensis.apiKeys.GetKeys();

      if (Array.isArray(apiKeys)) {
        // print the keys to console
        log.success(messages.keys.list(currentEnv));
        for (const {
          id,
          sharedSecret,
          name,
          description,
          dateModified,
          modifiedBy,
        } of apiKeys) {
          console.log(
            `  - ${name}${
              description ? ` (${description})` : ''
            } [${dateModified.toString().substring(0, 10)} ${modifiedBy}]`
          );
          console.log(`      ${id}`);
          console.log(`      ${sharedSecret}`);
        }
        console.log('');
      }

      if (keysErr) {
        log.error(messages.keys.noList(currentEnv));
        log.error(JSON.stringify(keysErr, null, 2));
      }
    }
  };

  CreateApiKey = async (name: string, description?: string) => {
    const { currentEnv, log, messages } = this;
    if (!this.contensis) await this.ConnectContensis();

    if (this.contensis) {
      const [err, key] = await this.contensis.apiKeys.CreateKey(
        name,
        description
      );

      if (key) {
        log.success(messages.keys.created(currentEnv, name));

        // print the key details to console
        console.log(
          `  - ${key.name}${
            key.description ? ` (${key.description})` : ''
          } [${key.dateModified.toString().substring(0, 10)} ${key.modifiedBy}]`
        );
        console.log(`  - id: ${key.id}`);
        console.log(`  - sharedSecret: ${key.sharedSecret}`);
      }
      console.log('');

      if (err) {
        log.error(messages.keys.failedCreate(currentEnv, name), err);
      }
    }
  };

  RemoveApiKey = async (id: string) => {
    const { currentEnv, log, messages } = this;
    if (!this.contensis) await this.ConnectContensis();

    if (this.contensis) {
      const [err, key] = await this.contensis.apiKeys.RemoveKey(id);

      if (!err) {
        log.success(messages.keys.removed(currentEnv, id));
        console.log('');
      } else {
        log.error(messages.keys.failedRemove(currentEnv, id), err);
      }
    }
  };

  GetContentTypes = async () => {
    const { currentProject, log, messages } = this;
    let err;
    if (!this.contensis) err = await this.HydrateContensis();

    if (err) log.error(messages.contenttypes.noList(currentProject));
    if (this.contensis) {
      this.contentTypes = this.contensis.models.contentTypes();
      this.components = this.contensis.models.components();
    } else {
      log.warning(messages.contenttypes.noList(currentProject));
    }
  };

  PrintContentTypes = async () => {
    const { currentProject, log, messages } = this;
    await this.GetContentTypes();
    if (this.contensis) {
      // Retrieve content types list for env
      const { contentTypes } = this;

      if (Array.isArray(contentTypes)) {
        log.success(messages.contenttypes.list(currentProject));
        for (const contentType of contentTypes) {
          const fieldsLength = contentType.fields?.length || 0;
          console.log(
            `  - ${contentType.id} [${fieldsLength} field${
              fieldsLength !== 1 ? 's' : ''
            }]`
          );
        }
        console.log('');
      }
    }
  };

  PrintContentType = async (contentTypeId: string) => {
    const { currentProject, log, messages } = this;
    await this.GetContentTypes();
    if (this.contensis) {
      // Retrieve content types list for env
      const { contentTypes } = this;

      if (Array.isArray(contentTypes)) {
        const contentType = contentTypes.find(
          c => c.id.toLowerCase() === contentTypeId.toLowerCase()
        );
        if (contentType) {
          log.success(
            messages.contenttypes.get(currentProject, contentType.id)
          );

          // console.log(JSON.stringify(contentType, null, 2));
          log.object(contentType);
        } else {
          log.error(
            messages.contenttypes.failedGet(currentProject, contentTypeId)
          );
        }
        console.log('');
      }
    }
  };

  PrintComponents = async () => {
    const { currentProject, log, messages } = this;
    await this.GetContentTypes();
    if (this.contensis) {
      // Retrieve components list for env
      const { components } = this;

      if (Array.isArray(components)) {
        log.success(messages.components.list(currentProject));
        for (const component of components) {
          const fieldsLength = component.fields?.length || 0;
          console.log(
            `  - ${component.id} [${fieldsLength} field${
              fieldsLength !== 1 ? 's' : ''
            }]`
          );
        }
        console.log('');
      }
    }
  };

  PrintComponent = async (componentId: string) => {
    const { currentProject, log, messages } = this;
    await this.GetContentTypes();
    if (this.contensis) {
      // Retrieve content types list for env
      const { components } = this;

      if (Array.isArray(components)) {
        const component = components.find(
          c => c.id.toLowerCase() === componentId.toLowerCase()
        );
        if (component) {
          log.success(messages.components.get(currentProject, component.id));

          log.object(component);
        } else {
          log.error(messages.components.failedGet(currentProject, componentId));
        }
        console.log('');
      }
    }
  };

  GetEntries = async ({
    withDependents = false,
  }: {
    withDependents?: boolean;
  }) => {
    const { currentProject, format, log, messages, output } = this;
    await this.ConnectContensis();

    if (this.contensis) {
      log.line();
      // console.log('payload: ', JSON.stringify(this.contensis.payload, null, 2));
      const entries = await this.contensis.GetEntries({ withDependents });

      if (output) {
        let writeString = '';
        if (format === 'csv') {
          writeString = entriesToCsv(entries);
        } else if (format === 'xml') {
          writeString = entriesToXml(entries);
        } else writeString = JSON.stringify(entries, null, 2);
        // write output to file
        if (writeString) {
          fs.writeFileSync(output, writeString);
          log.success(messages.app.fileOutput(format, output));
        } else {
          log.info(messages.app.noFileOutput());
        }
      } else {
        if (!format)
          logEntriesTable(
            entries,
            currentProject,
            this.contensis.payload.query?.fields
          );
        else if (format === 'csv') {
          log.info(entriesToCsv(entries));
        } else if (format === 'json')
          log.info(JSON.stringify(entries, null, 2));
      }
    } else {
      log.warning(messages.contenttypes.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  PrintWebhookSubscriptions = async (
    subscriptionIds?: string[],
    name?: string
  ) => {
    const { currentEnv, format, log, messages, output } = this;
    if (!this.contensis) await this.ConnectContensis();
    if (this.contensis) {
      // Retrieve webhooks list for env
      const [webhooksErr, webhooks] =
        await this.contensis.subscriptions.webhooks.GetSubscriptions();

      const filteredResults =
        typeof name === 'string'
          ? webhooks.filter(w =>
              w.name?.toLowerCase().includes(name.toLowerCase())
            )
          : Array.isArray(subscriptionIds)
          ? webhooks.filter(w => subscriptionIds?.some(id => id === w.id))
          : webhooks;

      if (Array.isArray(filteredResults)) {
        if (output) {
          let writeString = '';
          if (format === 'csv') {
            writeString = entriesToCsv(filteredResults as any);
          } else if (format === 'xml') {
            writeString = entriesToXml(filteredResults as any);
          } else writeString = JSON.stringify(filteredResults, null, 2);
          // write output to file
          if (writeString) {
            fs.writeFileSync(output, writeString);
            log.success(messages.app.fileOutput(format, output));
          } else {
            log.info(messages.app.noFileOutput());
          }
        } else {
          if (!format) {
            // print the keys to console
            log.success(messages.webhooks.list(currentEnv));
            for (const {
              id,
              description,
              method,
              name,
              version,
              url,
            } of filteredResults) {
              console.log(
                `  - ${name}${
                  description ? ` (${description})` : ''
                } [${version.modified.toString().substring(0, 10)} ${
                  version.modifiedBy
                }]`
              );
              console.log(`      ${id}`);
              console.log(`      [${method}] ${url}`);
            }
            console.log('');
          } else if (format === 'csv') {
            log.info(entriesToCsv(filteredResults as any));
          } else if (format === 'json')
            log.info(JSON.stringify(filteredResults, null, 2));
        }
      }

      if (webhooksErr) {
        log.error(messages.webhooks.noList(currentEnv));
        log.error(JSON.stringify(webhooksErr, null, 2));
      }
    }
  };
}

export const cliCommand = (
  commandArgs: string[],
  outputOpts: OutputOptions = {},
  contensisOpts: Partial<MigrateRequest> | { id: string } = {}
) => {
  return new ContensisCli(['', '', ...commandArgs], outputOpts, contensisOpts);
};
export default ContensisCli;
