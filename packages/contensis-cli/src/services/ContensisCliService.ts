import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import inquirer from 'inquirer';
import to from 'await-to-js';
import chalk from 'chalk';
import { Component, ContentType, Project } from 'contensis-core-api';
import { isPassword, isSharedSecret, isUuid, url } from '~/util';
import SessionCacheProvider from '../providers/SessionCacheProvider';
import ContensisAuthService from './ContensisAuthService';
import CredentialProvider from '~/providers/CredentialProvider';
import { logError, Logger } from '~/util/logger';
import { LogMessages } from '~/localisation/en-GB';
import {
  ContensisMigrationService,
  MigrateRequest,
  PushBlockParams,
  SourceCms,
  logEntriesTable,
  ContentTypesResult,
  Model,
  MigrateModelsResult,
} from 'migratortron';
import { Entry } from 'contensis-management-api/lib/models';

import { csvFormatter } from '~/util/csv.formatter';
import { xmlFormatter } from '~/util/xml.formatter';
import { jsonFormatter } from '~/util/json.formatter';
import {
  printBlockVersion,
  printMigrateResult,
  printModelMigrationAnalysis,
  printModelMigrationResult,
} from '~/util/console.printer';
import { readJsonFile } from '~/providers/file-provider';

type OutputFormat = 'json' | 'csv' | 'xml';

type OutputOptions = {
  format?: OutputFormat;
  output?: string;
};

interface IConnectOptions extends IAuthOptions {
  alias?: string;
  projectId?: string;
}

interface IAuthOptions {
  user?: string;
  password?: string;
  clientId?: string;
  sharedSecret?: string;
}

interface IImportOptions {
  sourceAlias?: string;
  sourceProjectId?: string;
}

let insecurePasswordWarningShown = false;

class ContensisCli {
  static quit = (error?: Error) => {
    process.removeAllListeners('exit');
    const exitCode = error ? 1 : 0;

    // console.info(`\nExiting contensis-cli with exit code: ${exitCode}\n`);
    process.exit(exitCode);
  };

  private command: CliCommand;
  private format?: OutputFormat;
  private output?: string;
  private session: SessionCacheProvider;

  contensis?: ContensisMigrationService;
  contensisOpts: Partial<MigrateRequest>;
  currentProject: string;

  sourceAlias?: string;
  targetEnv?: string;
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
  log = Logger;
  messages = LogMessages;

  verb: string;
  noun: string;
  thirdArg: string;

  get cache() {
    return this.session.Get();
  }

  get currentEnv() {
    return this.cache.currentEnvironment || '';
  }

  set currentEnv(currentEnvironment: string) {
    this.session.Update({ currentEnvironment });
  }

  get env() {
    const currentEnvironment = this.currentEnv;
    const environments = this.cache.environments || {};

    if (!currentEnvironment) return {} as EnvironmentCache;
    else if (!!environments[currentEnvironment])
      return environments[currentEnvironment];
    else {
      return {
        history: [],
        lastUserId: '',
        projects: [],
        versionStatus: 'latest',
      } as EnvironmentCache;
    }
  }

  get contentTypes() {
    return this.contensis?.models.contentTypes();
  }

  get components() {
    return this.contensis?.models.components();
  }
  get models(): Model[] | undefined {
    return this.contensis?.models.contentModels();
  }

  constructor(
    args: string[],
    outputOpts?: OutputOptions & IConnectOptions & IImportOptions,
    contensisOpts: Partial<MigrateRequest> = {}
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

    this.contensisOpts = contensisOpts;
    this.format = outputOpts?.format;
    this.output =
      outputOpts?.output && path.join(process.cwd(), outputOpts.output);

    const currentEnvironment = outputOpts?.alias || this.currentEnv;
    const environments = this.cache.environments || {};
    this.currentEnv = currentEnvironment;

    const env = this.env;

    if (outputOpts?.projectId) env.currentProject = outputOpts.projectId;
    if (outputOpts?.user) env.lastUserId = outputOpts.user;
    // setting this in env means passwordFallback is written to environments.json
    if (outputOpts?.password) env.passwordFallback = outputOpts.password;
    if (outputOpts?.clientId) env.lastUserId = outputOpts.clientId;
    if (outputOpts?.sharedSecret)
      env.passwordFallback = outputOpts.sharedSecret;

    this.currentProject = env?.currentProject || 'null';
    this.sourceAlias = outputOpts?.sourceAlias || currentEnvironment;

    if (currentEnvironment) {
      this.urls = url(currentEnvironment, env?.currentProject || 'website');
    }

    this.command = {
      commandText,
      createdDate: new Date().toISOString(),
      createdUserId: env?.lastUserId,
    };

    if (currentEnvironment) {
      env.history = [this.command];
      if (commandText) {
        environments[currentEnvironment] = env;
        this.session.Update({
          currentEnvironment,
          environments,
          history: [commandText],
        });
      }
    }
  }

  PrintEnvironments = () => {
    const { log, messages } = this;
    const { currentEnvironment, environments = {} } = this.cache;
    const envKeys = Object.keys(environments);
    log.success(messages.envs.found(envKeys.length));
    this.HandleFormattingAndOutput(envKeys, () => {
      // print the envKeys to console
      for (const env of envKeys) {
        console.log(`  - ${currentEnvironment === env ? '* ' : ''}${env}`);
      }
    });
    if (envKeys.length === 0 || !currentEnvironment) {
      log.help(messages.envs.tip());
    }
  };

  Connect = async (environment: string) => {
    const { log, messages, session } = this;

    if (environment) {
      this.currentEnv = environment;
      this.urls = url(environment, 'website');

      const [fetchErr, response] = await to(fetch(this.urls.cms));
      if (response && response?.status < 400) {
        log.success(messages.connect.connected(environment));
        session.UpdateEnv(this.env, environment);

        if (this.env?.lastUserId) {
          // await this.ConnectContensis();
          await this.PrintProjects();
        } else {
          log.warning(messages.projects.noList());
          log.help(messages.connect.tip());
        }
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

  ConnectContensis = async ({ commit = false } = {}) => {
    if (!this.contensis) {
      const { contensisOpts, currentEnv, env, log, messages } = this;
      const userId = env?.lastUserId;
      const isGuidId = userId && isUuid(userId);

      if (currentEnv && userId) {
        const credentials = await this.GetCredentials(
          userId,
          env.passwordFallback
        );

        const cachedPassword = credentials?.current?.password;

        if (cachedPassword) {
          this.contensis = new ContensisMigrationService(
            {
              ...contensisOpts,
              source: {
                url: this.urls?.cms || '',
                username: !isGuidId ? userId : undefined,
                password: !isGuidId ? cachedPassword : undefined,
                clientId: isGuidId ? userId : undefined,
                sharedSecret: isGuidId ? cachedPassword : undefined,
                project: env?.currentProject || '',
                assetHostname: this.urls?.previewWeb,
              },
              concurrency:
                typeof contensisOpts.concurrency !== 'undefined'
                  ? contensisOpts.concurrency
                  : 3,
              outputProgress: true,
            },
            !commit
          );
        }
      } else {
        if (!currentEnv) log.help(messages.connect.help());
        if (!userId) log.help(messages.connect.tip());
      }
    }
    return this.contensis;
  };

  ConnectContensisImport = async ({
    commit = false,
    fromFile,
    importDataType,
  }: {
    commit?: boolean;
    fromFile?: string;
    importDataType?:
      | 'entries'
      | 'contentTypes'
      | 'components'
      | 'models'
      | 'user-input';
  }) => {
    const source: 'contensis' | 'file' = fromFile ? 'file' : 'contensis';

    const fileData = fromFile
      ? readJsonFile<(Entry | ContentType | Component)[]>(fromFile) || []
      : [];

    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);

    const { contensisOpts, currentEnv, env, log, messages, sourceAlias } = this;
    const environments = this.cache.environments || {};
    const sourceEnvironment = environments[sourceAlias || ''] || {};
    const sourceCms =
      ('source' in contensisOpts && contensisOpts.source) ||
      ({} as Partial<SourceCms>);
    const sourceUserId =
      sourceCms.clientId || sourceCms.username || sourceEnvironment.lastUserId;
    const sourceProjectId =
      sourceCms.project || sourceEnvironment.currentProject || 'website';
    const isSourceGuidId = sourceUserId && isUuid(sourceUserId);
    const sourceUrls = url(sourceAlias || '', sourceProjectId);

    const sourcePassword =
      sourceCms.sharedSecret ||
      sourceCms.password ||
      sourceEnvironment.passwordFallback;

    const targetUserId = env?.lastUserId;
    const isTargetGuidId = targetUserId && isUuid(targetUserId);

    if (sourceUserId && currentEnv && targetUserId) {
      const sourceCredentials = await this.GetCredentials(
        sourceUserId,
        sourcePassword,
        sourceAlias,
        false
      );

      const cachedSourcePassword = sourceCredentials?.current?.password;

      const targetCredentials = await this.GetCredentials(
        targetUserId,
        env.passwordFallback
      );

      const cachedTargetPassword = targetCredentials?.current?.password;

      if (cachedSourcePassword && cachedTargetPassword) {
        if (source === 'file' || importDataType === 'user-input') {
          this.contensis = new ContensisMigrationService(
            {
              concurrency: 3,
              outputProgress: true,
              ...contensisOpts,
              target: {
                url: this.urls?.cms || '',
                username: !isTargetGuidId ? targetUserId : undefined,
                password: !isTargetGuidId ? cachedTargetPassword : undefined,
                clientId: isTargetGuidId ? targetUserId : undefined,
                sharedSecret: isTargetGuidId ? cachedTargetPassword : undefined,
                targetProjects: [env.currentProject || ''],
                assetHostname: this.urls?.previewWeb,
              },
              ...(importDataType ? { [importDataType]: fileData } : {}),
            },
            !commit
          );
        } else if (source === 'contensis') {
          this.contensis = new ContensisMigrationService(
            {
              concurrency: 3,
              outputProgress: true,
              ...contensisOpts,
              source: {
                url: sourceUrls.cms || '',
                username: !isSourceGuidId ? sourceUserId : undefined,
                password: !isSourceGuidId ? cachedSourcePassword : undefined,
                clientId: isSourceGuidId ? sourceUserId : undefined,
                sharedSecret: isSourceGuidId ? cachedSourcePassword : undefined,
                project: sourceProjectId,
                assetHostname: sourceUrls.previewWeb,
              },
              target: {
                url: this.urls?.cms || '',
                username: !isTargetGuidId ? targetUserId : undefined,
                password: !isTargetGuidId ? cachedTargetPassword : undefined,
                clientId: isTargetGuidId ? targetUserId : undefined,
                sharedSecret: isTargetGuidId ? cachedTargetPassword : undefined,
                targetProjects: [env.currentProject || ''],
                assetHostname: this.urls?.previewWeb,
              },
            },
            !commit
          );
        }
      }
    } else {
      if (!currentEnv) log.help(messages.connect.help());
      if (!targetUserId) log.help(messages.connect.tip());
    }
    return this.contensis;
  };

  GetCredentials = async (
    userId: string,
    password?: string,
    currentEnv = this.currentEnv,
    saveCurrentEnv = true
  ): Promise<CredentialProvider | undefined> => {
    const { log, messages } = this;
    if (userId) {
      const [credentialError, credentials] = await new CredentialProvider(
        { userId, alias: currentEnv },
        password
      ).Init();

      if (credentialError && !credentials.current) {
        // Log problem with Credential Provider
        log.error(credentialError as any);
        return;
      }

      if (credentials.remarks.secure !== true) {
        if (!insecurePasswordWarningShown) {
          log.warning(messages.login.insecurePassword());
          insecurePasswordWarningShown = true;
        }
      } else {
        const env = this.cache.environments[currentEnv];
        env.passwordFallback = undefined;
        this.session.UpdateEnv(env, currentEnv, saveCurrentEnv);
      }
      return credentials;
    }
  };

  Login = async (
    userId: string,
    {
      password = isPassword(this.env.passwordFallback),
      promptPassword = true,
      sharedSecret = isSharedSecret(this.env.passwordFallback),
      silent = false,
      attempt = 1,
    }: {
      password?: string;
      promptPassword?: boolean;
      sharedSecret?: string;
      silent?: boolean;
      attempt?: number;
    } = {}
  ): Promise<string | undefined> => {
    let inputPassword = password || sharedSecret;
    const { log, messages } = this;

    if (userId) {
      const { currentEnv, env } = this;

      if (currentEnv) {
        const credentials = await this.GetCredentials(userId, inputPassword);

        if (credentials) {
          const cachedPassword = isPassword(credentials.current?.password);
          const cachedSecret = isSharedSecret(credentials.current?.password);

          if (!cachedPassword && !cachedSecret && promptPassword) {
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

          if (inputPassword || cachedPassword || cachedSecret) {
            const authService = new ContensisAuthService({
              username: userId,
              password: inputPassword || cachedPassword,
              projectId: env?.currentProject || 'website',
              rootUrl: this.urls?.cms || '',
              clientId: userId,
              clientSecret: sharedSecret || cachedSecret,
            });

            const [authError, bearerToken] = await to(
              authService.BearerToken()
            );

            // Login successful
            if (bearerToken) {
              // Set env vars
              env.authToken = bearerToken;
              env.lastUserId = userId;
              env.passwordFallback =
                credentials.remarks.secure !== true
                  ? credentials.current?.password
                  : undefined;
              // Persist env before finding projects or doing anything else
              this.session.UpdateEnv(env);

              if (!silent) {
                Logger.success(messages.login.success(currentEnv, userId));
                await this.PrintProjects();
              }
              if (inputPassword) await credentials.Save(inputPassword);
              if (sharedSecret) await credentials.Save(sharedSecret);
            } else if (authError) {
              Logger.error(authError.toString());
              // Clear env vars
              env.authToken = '';
              env.lastUserId = '';
              env.passwordFallback = undefined;
              // Persist env to remove cleared values
              this.session.UpdateEnv(env);

              // If the auth error was raised using a cached password
              if (
                (cachedPassword || cachedSecret) &&
                credentials.remarks.secure
              ) {
                // Remove any bad stored credential and trigger login prompt again
                await credentials.Delete();
                return await this.Login(userId, { password, sharedSecret });
              } else {
                throw new Error(messages.login.failed(currentEnv, userId));
              }
            }

            return env.authToken;
          } else {
            Logger.error(messages.login.passwordPrompt());
            if (attempt < 2)
              return await this.Login(userId, { attempt: attempt + 1 });
          }
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

  PrintContensisVersion = async () => {
    const { log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve projects list for env
      const [projectsErr, projects] = await to(
        contensis.projects.GetSourceProjects()
      );

      if (Array.isArray(projects)) {
        // Print contensis version to console
        this.HandleFormattingAndOutput(contensis.contensisVersion, () =>
          log.raw(log.highlightText(contensis.contensisVersion))
        );
      }

      if (projectsErr) {
        log.error(messages.projects.noList());
        log.error(projectsErr.message);
      }
    }
  };

  PrintProjects = async () => {
    const { currentProject, log, messages, session } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve projects list for env
      const [projectsErr, projects] = await to(
        contensis.projects.GetSourceProjects()
      );

      if (Array.isArray(projects)) {
        // save these projects in cache
        const nextCurrentProject =
          currentProject && currentProject !== 'null'
            ? currentProject
            : projects.some(p => p.id === 'website')
            ? 'website'
            : undefined;

        session.UpdateEnv({
          projects: projects.map(p => p.id),
          currentProject: nextCurrentProject,
        });

        log.success(messages.projects.list());
        log.raw('');

        this.HandleFormattingAndOutput(projects, () => {
          // print the projects to console
          for (const project of projects.sort((a, b) =>
            a.id.localeCompare(b.id)
          )) {
            let color;
            try {
              color = chalk.keyword((project as any).color);
            } catch (ex) {
              color = chalk.white;
            }
            console.log(
              `${
                nextCurrentProject === project.id
                  ? `>> ${log.boldText(color(project.id))}`
                  : `    ${color(project.id)}`
              } ${log.infoText(
                `[${project.supportedLanguages
                  .map(l =>
                    l === project.primaryLanguage ? `*${log.boldText(l)}` : l
                  )
                  .join(' ')}]`
              )}`
            );
          }
        });

        if (!this.SetProject(nextCurrentProject))
          log.warning(messages.projects.tip());
      }

      if (projectsErr) {
        log.error(messages.projects.noList());
        log.error(projectsErr.message);
      }
    }
  };

  PrintProject = async (projectId = this.currentProject) => {
    const { log, messages, session } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve projects list for env
      const [projectsErr, projects] = await to(
        contensis.projects.GetSourceProjects()
      );

      const foundProject = projects?.find(
        p => p.id.toLowerCase() === projectId.toLowerCase()
      );

      if (foundProject) {
        log.raw('');
        this.HandleFormattingAndOutput(foundProject, log.object);
      }

      if (projectsErr) {
        log.error(messages.projects.noList());
        log.error(projectsErr.message);
      }
    }
  };

  SetProject = (projectId = 'website') => {
    const { env, log, messages, session } = this;
    let nextProjectId: string | undefined;
    if (env?.projects.length > 0 && env?.lastUserId) {
      nextProjectId = env.projects.find(
        p => p.toLowerCase() === projectId.toLowerCase()
      );
      if (nextProjectId) {
        env.currentProject = nextProjectId;
        session.UpdateEnv(env);
        log.success(messages.projects.set(projectId));
        log.raw('');
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

  SetVersion = (versionStatus: 'latest' | 'published') => {
    const { env, log, messages, session } = this;
    if (!['latest', 'published'].includes(versionStatus)) {
      log.error(messages.version.invalid(versionStatus));
      return false;
    }
    if (!env) {
      log.help(messages.version.noEnv());
      return false;
    }
    if (env?.projects.length > 0 && env?.lastUserId) {
      session.UpdateEnv({ versionStatus });
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
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve content types list for env
      const [contensisErr, models] = await to(
        contensis.models.HydrateContensisRepositories()
      );

      if (contensisErr) {
        log.error(contensisErr.message);
        return contensisErr;
      }
    }
  };

  PrintApiKeys = async () => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve keys list for env
      const [keysErr, apiKeys] = await contensis.apiKeys.GetKeys();

      if (Array.isArray(apiKeys)) {
        log.success(messages.keys.list(currentEnv));
        this.HandleFormattingAndOutput(apiKeys, () => {
          // print the keys to console
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
        });
      }

      if (keysErr) {
        log.error(messages.keys.noList(currentEnv));
        log.error(jsonFormatter(keysErr));
      }
    }
  };

  CreateApiKey = async (name: string, description?: string) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      const [err, key] = await contensis.apiKeys.CreateKey(name, description);

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
    const contensis = await this.ConnectContensis({ commit: true });

    if (contensis) {
      const [err, key] = await contensis.apiKeys.RemoveKey(id);

      if (!err) {
        log.success(messages.keys.removed(currentEnv, id));
        console.log('');
      } else {
        log.error(messages.keys.failedRemove(currentEnv, id), err);
      }
    }
  };

  CreateProject = async (project: Project) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      const [err, created] = await contensis.projects.CreateProject(project);

      if (created) {
        log.success(messages.projects.created(currentEnv, project.id));

        this.HandleFormattingAndOutput(created, () => {
          // set the CLI project to the newly created project
          this.SetProject(project.id);
          // print all the projects to console
          this.PrintProjects();
        });
        return project.id;
      }

      if (err) {
        log.error(messages.projects.failedCreate(currentEnv, project.id), err);
      }
    }
  };

  UpdateProject = async (project: Partial<Project>) => {
    const { currentEnv, currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      const [err, updated] = await contensis.projects.UpdateProject({
        id: currentProject,
        ...project,
      });

      if (updated) {
        log.success(messages.projects.updated(currentEnv, currentProject));

        this.HandleFormattingAndOutput(updated, log.object);
        return updated.id;
      }

      if (err) {
        log.error(
          messages.projects.failedUpdate(currentEnv, currentProject),
          err
        );
      }
    }
  };

  GetContentTypes = async () => {
    const { currentProject, log, messages } = this;
    let err;
    if (!this.contensis) err = await this.HydrateContensis();

    if (err) log.error(messages.models.noList(currentProject));
    if (!this.contensis) log.warning(messages.models.noList(currentProject));

    return this.contensis;
  };

  PrintContentModels = async (modelIds: string[] = []) => {
    const { currentProject, log, messages } = this;
    const contensis = await this.GetContentTypes();
    if (contensis) {
      // Retrieve models list for env
      const { models, contentTypes = [], components = [] } = this;

      // Models to output to console
      const returnModels = modelIds?.length
        ? models?.filter((m: Model) =>
            modelIds.some(id => id.toLowerCase() === m.id.toLowerCase())
          )
        : undefined;

      // Generate a list of contentTypeIds and componentIds from all models
      // and dependencies
      const contentTypeIds = Array.from(
        new Set([
          ...(returnModels || models || []).map(m => m.id),
          ...(returnModels || models || [])
            .map(m => m.dependencies?.contentTypes?.map(c => c[0]) || [])
            .flat(),
        ])
      );
      const componentIds = Array.from(
        new Set(
          (returnModels || models || [])
            .map(m => m.dependencies?.components?.map(c => c[0]) || [])
            .flat()
        )
      );

      // Create an array of all the content types and component definitions
      // we will use this when outputting to a file
      const contentModelBackup = [
        ...contentTypes.filter(c => contentTypeIds.includes(c.id)),
        ...components.filter(c => componentIds.includes(c.id)),
      ];

      if (Array.isArray(returnModels)) {
        log.success(messages.models.list(currentProject));
        this.HandleFormattingAndOutput(contentModelBackup, () => {
          // print the content models to console
          for (const model of returnModels) {
            log.raw('');
            log.object(model);
          }
          log.raw('');
        });
      } else {
        log.success(
          messages.models.get(currentProject, models?.length.toString() || '0')
        );
        log.raw('');
        if (models?.length) {
          this.HandleFormattingAndOutput(contentModelBackup, () => {
            // print the content models s#qto console
            for (const model of models) {
              const components = model.components?.length || 0;
              const contentTypes = model.contentTypes?.length || 0;
              const dependencies =
                (model.dependencies?.components?.length || 0) +
                (model.dependencies?.contentTypes?.length || 0);
              const dependencyOf =
                (model.dependencyOf?.components?.length || 0) +
                (model.dependencyOf?.contentTypes?.length || 0);

              const hasAny =
                components + contentTypes + dependencies + dependencyOf;
              log.raw(
                `  - ${log.highlightText(log.boldText(model.id))} ${
                  hasAny
                    ? log.infoText(
                        `{ ${components ? `components: ${components}, ` : ''}${
                          contentTypes ? `contentTypes: ${contentTypes}, ` : ''
                        }${
                          dependencies ? `references: ${dependencies}, ` : ''
                        }${
                          dependencyOf ? `required by: ${dependencyOf}` : ''
                        } }`
                      )
                    : ''
                }`
              );
            }
            log.raw('');
          });
        }
      }
    }
  };

  ImportContentModels = async ({
    commit,
    fromFile,
  }: {
    commit: boolean;
    fromFile: string;
  }) => {
    const { currentProject, log, messages } = this;

    const fileData = fromFile
      ? readJsonFile<(ContentType | Component)[]>(fromFile) || []
      : [];
    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);

    const contensis = await this.ConnectContensisImport({
      commit,
      fromFile,
      importDataType: 'models',
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        console.log(log.successText(` -- IMPORT PREVIEW -- `));
      } else {
        console.log(log.warningText(` *** COMMITTING IMPORT *** `));
      }

      const [migrateErr, result] = await contensis.MigrateContentModels();

      if (migrateErr) logError(migrateErr);
      else
        this.HandleFormattingAndOutput(result, () => {
          // print the results to console
          if (!commit) {
            log.raw(log.boldText(`\nContent types:`));
            if (!result.contentTypes) log.info(`- None returned\n`);
            else printModelMigrationAnalysis(this, result.contentTypes);

            log.raw(log.boldText(`\nComponents:`));
            if (!result.components) log.info(`- None returned\n`);
            else printModelMigrationAnalysis(this, result.components);
          } else {
            const migrateResult = result as MigrateModelsResult;
            log.raw(log.boldText(`\nContent types:`));
            printModelMigrationResult(
              this,
              migrateResult[currentProject].contentTypes
            );

            log.raw(log.boldText(`\nComponents:`));
            printModelMigrationResult(
              this,
              migrateResult[currentProject].components
            );
          }
        });
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
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
        this.HandleFormattingAndOutput(contentTypes, () => {
          // print the content types to console
          for (const contentType of contentTypes) {
            const fieldsLength = contentType.fields?.length || 0;
            console.log(
              `  - ${contentType.id} [${fieldsLength} field${
                fieldsLength !== 1 ? 's' : ''
              }]`
            );
          }
        });
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
          // print the content type to console
          this.HandleFormattingAndOutput(contentType, log.object);
        } else {
          log.error(
            messages.contenttypes.failedGet(currentProject, contentTypeId)
          );
        }
      }
    }
  };

  RemoveContentTypes = async (contentTypeIds: string[], commit = false) => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: 'user-input',
    });
    if (contensis) {
      const [err, result] = await contensis.DeleteContentTypes(contentTypeIds);

      if (err) {
        log.error(
          messages.contenttypes.failedRemove(
            currentProject,
            contentTypeIds.join('", "')
          ),
          err
        );
      } else {
        log.success(
          messages.contenttypes.removed(
            currentProject,
            contentTypeIds.join('", "'),
            !contensis.isPreview
          )
        );
        // print the results to console
        this.HandleFormattingAndOutput(result, () =>
          log.object(jsonFormatter(result))
        );
      }
    }
  };

  ImportContentTypes = async (
    {
      commit,
      fromFile,
    }: {
      commit: boolean;
      fromFile: string;
    },
    contentTypeIds: string[] = []
  ) => {
    const { currentProject, log, messages } = this;

    let fileData = fromFile ? readJsonFile<ContentType[]>(fromFile) || [] : [];
    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);

    if (!Array.isArray(fileData)) fileData = [fileData];

    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: fromFile ? 'user-input' : undefined,
    });

    if (contensis) {
      // Pass each content type to the target repo
      for (const contentType of fileData) {
        // Fix invalid data
        contentType.projectId = currentProject;
        delete contentType.uuid;

        const [err, created, createStatus] = await contensis.models.targetRepos[
          currentProject
        ].repo.UpsertContentType(false, contentType);

        if (err) log.error(err.message, err);
        if (createStatus) {
          log.success(
            messages.contenttypes.created(
              currentProject,
              contentType.id,
              createStatus
            )
          );
          // print the content type to console
          this.HandleFormattingAndOutput(contentType, () => {});
        }
      }
    }
  };

  DiffModels = async (
    {
      fromFile,
    }: {
      fromFile: string;
    },
    modelIds: string[] = []
  ) => {
    const { log } = this;

    let fileData = fromFile ? readJsonFile<ContentType[]>(fromFile) || [] : [];
    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);

    if (!Array.isArray(fileData)) fileData = [fileData];

    const contensis = await this.ConnectContensisImport({
      fromFile,
      importDataType: 'models',
    });

    if (contensis) {
      const [err, result] = (await to(
        contensis.models.Diff(fileData.length ? fileData : modelIds)
      )) as [Error | null, ContentTypesResult | undefined];

      if (err) log.error(err.message, err);
      if (result)
        // print the content type to console
        this.HandleFormattingAndOutput(result, () => {
          log.success(
            `Queried models ${log.infoText(
              `"${result.query.modelIds?.join(', ')}"`
            )}\n`
          );

          log.raw(log.boldText(`Content types:`));
          if (!result.contentTypes) log.info(`- None returned\n`);
          else printModelMigrationAnalysis(this, result.contentTypes);

          log.raw(log.boldText(`Components:`));
          if (!result.components) log.info(`- None returned\n`);
          else printModelMigrationAnalysis(this, result.components);
        });
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

        this.HandleFormattingAndOutput(components, () => {
          // print the components to console
          for (const component of components) {
            const fieldsLength = component.fields?.length || 0;
            console.log(
              `  - ${component.id} [${fieldsLength} field${
                fieldsLength !== 1 ? 's' : ''
              }]`
            );
          }
        });
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
          // print the component to console
          this.HandleFormattingAndOutput(component, log.object);
        } else {
          log.error(messages.components.failedGet(currentProject, componentId));
        }
      }
    }
  };

  RemoveComponents = async (componentIds: string[], commit = false) => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: 'user-input',
    });
    if (contensis) {
      const [err, result] = await contensis.DeleteContentTypes(
        undefined,
        componentIds
      );

      if (err) {
        log.error(
          messages.components.failedRemove(
            currentProject,
            componentIds.join('", "')
          ),
          err
        );
      } else {
        log.success(
          messages.components.removed(
            currentProject,
            componentIds.join('", "'),
            !contensis.isPreview
          )
        );
        // print the results to console
        this.HandleFormattingAndOutput(result, () =>
          log.info(jsonFormatter(result))
        );
      }
    }
  };

  ImportComponents = async (
    {
      commit,
      fromFile,
    }: {
      commit: boolean;
      fromFile: string;
    },
    componentIds: string[] = []
  ) => {
    const { currentProject, log, messages } = this;

    let fileData = fromFile ? readJsonFile<Component[]>(fromFile) || [] : [];
    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);

    if (!Array.isArray(fileData)) fileData = [fileData];

    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: fromFile ? 'user-input' : undefined,
    });

    if (contensis) {
      // Pass each component to the target repo
      for (const component of fileData) {
        // Fix invalid data
        component.projectId = currentProject;
        delete component.uuid;

        const [err, created, createStatus] = await contensis.models.targetRepos[
          currentProject
        ].repo.UpsertComponent(false, component);

        if (err) log.error(err.message, err);
        if (createStatus) {
          log.success(
            messages.components.created(
              currentProject,
              component.id,
              createStatus
            )
          );
          // print the component to console
          this.HandleFormattingAndOutput(component, () => {});
        }
      }
    }
  };

  RemoveEntries = async (commit = false) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: 'user-input',
    });

    if (contensis) {
      if (contensis.isPreview) {
        console.log(log.successText(` -- PREVIEW -- `));
      } else {
        console.log(log.warningText(` *** COMMITTING DELETE *** `));
      }
      const [err, result] = await contensis.DeleteEntries();
      if (result)
        this.HandleFormattingAndOutput(result, () => {
          // print the migrateResult to console
          printMigrateResult(this, result, { action: 'delete' });
        });
      if (
        !err &&
        ((!commit &&
          Object.values(result.entriesToMigrate)?.[0].totalCount > 0) ||
          (commit && result.migrateResult?.deleted))
      ) {
        log.success(messages.entries.removed(currentEnv, commit));
        if (!commit) log.help(messages.entries.commitTip());
      } else {
        log.error(messages.entries.failedRemove(currentEnv), err);
        if (!Object.values(result.entriesToMigrate)?.[0].totalCount)
          log.help(messages.entries.notFound(currentEnv));
      }
    }
  };

  GetEntries = async ({
    withDependents = false,
  }: {
    withDependents?: boolean;
  }) => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      log.line();
      const entries = await contensis.GetEntries({ withDependents });
      this.HandleFormattingAndOutput(entries, () =>
        // print the entries to console
        logEntriesTable(
          entries,
          currentProject,
          contensis.payload.query?.fields
        )
      );
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  ImportEntries = async ({
    commit,
    fromFile,
  }: {
    commit: boolean;
    fromFile: string;
  }) => {
    const { currentProject, log, messages } = this;

    const contensis = await this.ConnectContensisImport({
      commit,
      fromFile,
      importDataType: 'entries',
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        console.log(log.successText(` -- IMPORT PREVIEW -- `));
      } else {
        console.log(log.warningText(` *** COMMITTING IMPORT *** `));
      }

      const [migrateErr, migrateResult] = await contensis.MigrateEntries();

      if (migrateErr) logError(migrateErr);
      else
        this.HandleFormattingAndOutput(migrateResult, () => {
          // print the migrateResult to console
          printMigrateResult(this, migrateResult);
        });
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  PrintWebhookSubscriptions = async (
    subscriptionIds?: string[],
    name?: string
  ) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve webhooks list for env
      const [webhooksErr, webhooks] =
        await contensis.subscriptions.webhooks.GetSubscriptions();

      const filteredResults =
        typeof name === 'string'
          ? webhooks.filter(w =>
              w.name?.toLowerCase().includes(name.toLowerCase())
            )
          : Array.isArray(subscriptionIds)
          ? webhooks.filter(w => subscriptionIds?.some(id => id === w.id))
          : webhooks;

      if (Array.isArray(filteredResults)) {
        this.HandleFormattingAndOutput(filteredResults, () => {
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
        });
      }

      if (webhooksErr) {
        log.error(messages.webhooks.noList(currentEnv));
        log.error(jsonFormatter(webhooksErr));
      }
    }
  };

  PrintBlocks = async () => {
    const { currentEnv, env, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve blocks list for env
      const [err, blocks] = await contensis.blocks.GetBlocks();

      if (Array.isArray(blocks)) {
        this.HandleFormattingAndOutput(blocks, () => {
          // print the blocks to console
          log.success(messages.blocks.list(currentEnv, env.currentProject));
          for (const {
            id,
            description,
            branches,
            liveVersion,
            madeLive,
            versionsSinceLive,
          } of blocks) {
            console.log(
              `  - ${id}${description ? ` (${description})` : ''}${
                madeLive
                  ? ` [${madeLive.toString().substring(0, 10)} v${liveVersion}]`
                  : ''
              }${
                versionsSinceLive
                  ? log.warningText(` +${versionsSinceLive}`)
                  : ''
              }`
            );
            for (const branch of branches)
              console.log(
                log.infoText(`      [${branch.id}]: ${branch.status}`)
              );
          }
        });
      }

      if (err) {
        log.error(messages.blocks.noList(currentEnv));
        log.error(jsonFormatter(err));
      }
    }
  };

  PrintBlockVersions = async (
    blockId: string,
    branch: string,
    version: string
  ) => {
    const { currentEnv, env, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve block version
      const [err, blocks] = await contensis.blocks.GetBlockVersions(
        blockId,
        branch,
        version
      );

      if (blocks) {
        this.HandleFormattingAndOutput(blocks, () => {
          // print the version detail to console
          log.success(
            messages.blocks.get(blockId, currentEnv, env.currentProject)
          );
          for (const block of blocks)
            printBlockVersion(
              this,
              block,
              !version
                ? {
                    showImage: false,
                    showSource: true,
                    showStaticPaths: false,
                    showStatus: false,
                  }
                : undefined
            );
        });
      }

      if (err) {
        log.error(messages.blocks.noList(currentEnv, env.currentProject));
        log.error(jsonFormatter(err));
      }
    }
  };

  PushBlock = async (block: PushBlockParams) => {
    const { currentEnv, env, log, messages } = this;

    // Output request to console
    log.info(
      messages.blocks.tryPush(
        block.id,
        block.source.branch,
        currentEnv,
        env.currentProject
      )
    );
    console.log(jsonFormatter(block));

    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Push new block version
      const [err, blockVersion] = await contensis.blocks.PushBlockVersion(
        block
      );
      if (!err) {
        log.success(
          messages.blocks.pushed(
            block.id,
            block.source.branch,
            currentEnv,
            env.currentProject
          )
        );
      }
      if (blockVersion) {
        this.HandleFormattingAndOutput(blockVersion, () => {
          // print the version detail to console
          printBlockVersion(this, blockVersion);
        });
      }
      if (err)
        throw new Error(
          messages.blocks.failedPush(block.id, currentEnv, env.currentProject)
        );
    }
  };

  ReleaseBlock = async (blockId: string, version: string) => {
    const { currentEnv, env, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve block version
      const [err, blockVersion] = await contensis.blocks.BlockAction(
        blockId,
        'release',
        version
      );

      if (blockVersion) {
        this.HandleFormattingAndOutput(blockVersion, () => {
          // print the version detail to console
          log.success(
            messages.blocks.released(blockId, currentEnv, env.currentProject)
          );
          printBlockVersion(this, blockVersion);
        });
      }

      if (err) {
        log.error(
          messages.blocks.failedRelease(blockId, currentEnv, env.currentProject)
        );
        log.error(jsonFormatter(err));
      }
    }
  };

  PrintBlockLogs = async (
    blockId: string,
    branch: string,
    version: string,
    dataCenter: 'hq' | 'manchester' | 'london'
  ) => {
    const { currentEnv, env, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve block logs
      log.success(
        messages.blocks.getLogs(blockId, branch, currentEnv, env.currentProject)
      );

      const [err, blockLogs] = await contensis.blocks.GetBlockLogs({
        blockId,
        branchId: branch,
        version,
        dataCenter,
      });

      if (blockLogs) {
        this.HandleFormattingAndOutput(blockLogs, () => {
          // print the logs to console
          console.log(
            `  - ${blockId} ${branch} ${
              Number(version) ? `v${version}` : version
            } [${dataCenter}]`
          );
          log.line();
          console.log(log.infoText(blockLogs));
          log.line();
        });
      }

      if (err) {
        log.error(
          messages.blocks.failedGetLogs(blockId, currentEnv, env.currentProject)
        );
        log.error(jsonFormatter(err));
      }
    }
  };

  HandleFormattingAndOutput = <T>(obj: T, logFn: (obj: T) => void) => {
    const { format, log, messages, output } = this;
    if (!format) {
      // print the object to console
      logFn(obj);
    } else if (format === 'csv') {
      log.raw('');
      log.raw(log.infoText(csvFormatter(obj)));
    } else if (format === 'xml') {
      log.raw('');
      log.raw(log.infoText(xmlFormatter(obj)));
    } else if (format === 'json') {
      log.raw('');
      log.raw(log.infoText(jsonFormatter(obj)));
    }
    log.raw('');

    if (output) {
      let writeString = '';
      if (format === 'csv') {
        writeString = csvFormatter(obj as any);
      } else if (format === 'xml') {
        writeString = xmlFormatter(obj as any);
      } else writeString = jsonFormatter(obj);
      // write output to file
      if (writeString) {
        fs.writeFileSync(output, writeString);
        log.success(messages.app.fileOutput(format, output));
      } else {
        log.info(messages.app.noFileOutput());
      }
    }
  };
}

export const cliCommand = (
  commandArgs: string[],
  outputOpts: OutputOptions & IConnectOptions = {},
  contensisOpts: Partial<MigrateRequest> = {}
) => {
  return new ContensisCli(['', '', ...commandArgs], outputOpts, contensisOpts);
};
export default ContensisCli;
