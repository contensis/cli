import to from 'await-to-js';
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import path from 'path';
import clone from 'rfdc';

import { Component, ContentType, Project } from 'contensis-core-api';
import {
  ICreateTag,
  ICreateTagGroup,
  Role,
  Tag,
  TagGroup,
} from 'contensis-management-api';
import {
  ContensisMigrationService,
  MigrateRequest,
  PushBlockParams,
  SourceCms,
  ContentTypesResult,
  Model,
  BlockActionType,
  logEntitiesTable,
} from 'migratortron';

import ContensisAuthService from './ContensisAuthService';

import { LogMessages } from '~/localisation/en-GB';
import {
  CliUrls,
  OutputFormat,
  OutputOptionsConstructorArg,
} from '~/models/CliService';

import { readFileAsJSON } from '~/providers/file-provider';
import SessionCacheProvider from '../providers/SessionCacheProvider';
import CredentialProvider from '~/providers/CredentialProvider';

import { splitTagsAndGroups, url } from '~/util';
import { sanitiseIds } from '~/util/api-ids';
import {
  isPassword,
  isSharedSecret,
  isUuid,
  tryParse,
  tryStringify,
} from '~/util/assert';
import {
  printBlockVersion,
  printEntriesMigrateResult,
  printModelMigrationAnalysis,
  printModelMigrationResult,
  printNodeTreeOutput,
  printNodesMigrateResult,
} from '~/util/console.printer';
import { csvFormatter } from '~/util/csv.formatter';
import { htmlFormatter } from '~/util/html.formatter';
import { jsonFormatter, limitFields } from '~/util/json.formatter';
import { xmlFormatter } from '~/util/xml.formatter';
import { isDebug } from '~/util/debug';
import { diffLogStrings } from '~/util/diff';
import { findByIdOrName } from '~/util/find';
import { logError, Logger } from '~/util/logger';
import { promiseDelay } from '~/util/timers';
import { GetTagsArgs } from 'migratortron/dist/services/TagsMigrationService';
import { GetTagGroupsArgs } from 'migratortron/dist/services/TagGroupsMigrationService';

type ImportDataType =
  | 'entries'
  | 'contentTypes'
  | 'components'
  | 'models'
  | 'nodes'
  | 'tagGroups'
  | 'tags'
  | 'user-input';

let insecurePasswordWarningShown = false;

class ContensisCli {
  static quit = (error?: Error) => {
    process.removeAllListeners('exit');
    const exitCode = error ? 1 : 0;

    // console.info(`\nExiting contensis-cli with exit code: ${exitCode}\n`);
    process.exit(exitCode);
  };

  private format?: OutputFormat;
  private output?: string;
  private session: SessionCacheProvider;

  auth?: ContensisAuthService;
  command: CliCommand;
  contensis?: ContensisMigrationService;
  contensisOpts: Partial<MigrateRequest>;
  currentProject: string;
  debug = isDebug();

  sourceAlias?: string;
  targetEnv?: string;
  urls: CliUrls;
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
    else if (environments[currentEnvironment])
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

  constructor(
    args: string[],
    outputOpts?: OutputOptionsConstructorArg,
    contensisOpts: Partial<MigrateRequest> = {}
  ) {
    // console.log('args: ', JSON.stringify(args, null, 2));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [exe, script, verb = '', noun = '', ...restArgs] = args;
    this.verb = verb?.toLowerCase();
    this.noun = noun?.toLowerCase();
    this.thirdArg = restArgs?.[0];

    const commandText = `${this.verb} ${this.noun} ${
      restArgs ? restArgs.join(' ') : ''
    }`.trim();

    this.session = new SessionCacheProvider();

    this.contensisOpts = contensisOpts;

    // Explicitly sanitise supplied fields to api-friendly ids
    if (Array.isArray(this.contensisOpts.query?.fields)) {
      this.contensisOpts.query.fields = sanitiseIds(
        this.contensisOpts.query.fields
      );
    }

    this.format = outputOpts?.format;
    this.output = outputOpts?.output
      ? path.isAbsolute(outputOpts.output)
        ? outputOpts.output
        : path.join(process.cwd(), outputOpts.output)
      : undefined;

    const currentEnvironment = outputOpts?.alias || this.currentEnv;
    const environments = this.cache.environments || {};
    this.currentEnv = currentEnvironment;

    // Set env from command options
    const env = this.env;
    if (outputOpts?.projectId) env.currentProject = outputOpts.projectId;
    if (outputOpts?.user) env.lastUserId = outputOpts.user;
    // setting this in env means passwordFallback is written to environments.json
    if (outputOpts?.password) env.passwordFallback = outputOpts.password;
    if (outputOpts?.clientId) env.lastUserId = outputOpts.clientId;
    if (outputOpts?.sharedSecret)
      if (outputOpts.sharedSecret.startsWith('-'))
        throw new Error(
          `Shared secret option provided a value of ${outputOpts.sharedSecret}`
        );
      else env.passwordFallback = outputOpts.sharedSecret;

    this.currentProject = env?.currentProject || 'null';
    this.sourceAlias = outputOpts?.sourceAlias || currentEnvironment;

    if (currentEnvironment) {
      this.urls = url(currentEnvironment, env?.currentProject || 'website');
    }

    this.command = {
      commandText,
      options: outputOpts as any,
      createdDate: new Date().toISOString(),
      invokedBy: env?.lastUserId,
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

  PrintEnvironments = async () => {
    const { log, messages } = this;
    const { currentEnvironment, environments = {} } = this.cache;
    const envKeys = Object.keys(environments).sort();
    log.success(messages.envs.found(envKeys.length));
    await this.HandleFormattingAndOutput(envKeys, () => {
      // print the envKeys to console
      for (const env of envKeys) {
        console.log(`  - ${currentEnvironment === env ? '* ' : ''}${env}`);
      }
    });
    if (envKeys.length === 0 || !currentEnvironment) {
      log.help(messages.envs.tip());
    }
  };

  RemoveEnvironment = async (env: string) => {
    const { log, messages, session } = this;
    const { currentEnvironment, environments = {} } = this.cache;
    const envKeys = Object.keys(environments);
    log.success(messages.envs.found(envKeys.length));
    if (environments[env]) {
      // remove env from cache
      session.RemoveEnv(env);
      // remove credentials
      const lastUserId = environments[env].lastUserId;
      if (lastUserId) {
        const [err, credentials] = await new CredentialProvider({
          userId: environments[env].lastUserId,
          alias: env,
        }).Init();
        if (!err && credentials) await credentials.Delete();
      }
      log.success(messages.envs.removed(env));
      // support the output and format options - exporting the history for the
      // removed alias
      await this.HandleFormattingAndOutput(environments[env], () => log.line());
    } else {
      log.warning(messages.envs.notFound(env));
    }

    const nextCurrentEnv =
      currentEnvironment === env ? undefined : currentEnvironment;
    if (envKeys.length === 0 || !nextCurrentEnv) log.help(messages.envs.tip());

    return nextCurrentEnv;
  };

  Connect = async (environment: string) => {
    const { log, messages, session } = this;

    if (environment) {
      this.currentEnv = environment;
      this.urls = url(environment, 'website');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    importData,
    mixedData,
  }: {
    commit?: boolean;
    fromFile?: string;
    importDataType?: ImportDataType;
    importData?: any[];
    mixedData?: {
      [K in ImportDataType]?: any[];
    };
  }) => {
    const source: 'contensis' | 'file' =
      fromFile || importData || mixedData ? 'file' : 'contensis';

    const fileData =
      importData || (fromFile ? (await readFileAsJSON(fromFile)) || [] : []);

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
              concurrency: 2,
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
              ...(mixedData || {}),
            },
            !commit
          );
        } else if (source === 'contensis') {
          this.contensis = new ContensisMigrationService(
            {
              concurrency: 2,
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
        log.error(
          `Unable to find credentials for user ${userId} at ${currentEnv}`,
          credentialError as any
        );
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
      password = '',
      promptPassword = true,
      sharedSecret = '',
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

    if (!inputPassword)
      inputPassword =
        isSharedSecret(this.env.passwordFallback) ||
        isPassword(this.env.passwordFallback) ||
        '';

    const { messages } = this;

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
            this.auth = new ContensisAuthService({
              username: userId,
              password: inputPassword || cachedPassword,
              projectId: env?.currentProject || 'website',
              rootUrl: this.urls?.cms || '',
              clientId: userId,
              clientSecret: sharedSecret || cachedSecret,
            });

            const [authError, bearerToken] = await to(this.auth.BearerToken());

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
              if (inputPassword) await credentials.Save(inputPassword);
              if (sharedSecret) await credentials.Save(sharedSecret);

              if (!silent) {
                Logger.success(messages.login.success(currentEnv, userId));
                await this.PrintProjects();
              }
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
        await this.HandleFormattingAndOutput(contensis.contensisVersion, () =>
          log.raw(log.highlightText(contensis.contensisVersion))
        );
      }

      if (projectsErr) {
        log.error(messages.projects.noList());
        log.error(projectsErr.message);
      }
    }
  };

  PrintBearerToken = async () => {
    const { log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve token for env
      const [error, token] = await to(
        contensis.content.source.repo.BearerToken()
      );
      if (token) {
        // Print bearer token to console
        await this.HandleFormattingAndOutput(token, () =>
          log.raw(log.highlightText(token))
        );
      }

      if (error) {
        log.error(messages.projects.noList());
        log.error(error.message);
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
          projects: projects.map(p => ({
            id: p.id,
            primaryLanguage: p.primaryLanguage,
          })),
          currentProject: nextCurrentProject,
        });

        log.success(messages.projects.list());
        log.raw('');

        await this.HandleFormattingAndOutput(projects, () => {
          // print the projects to console
          for (const project of projects.sort((a, b) =>
            a.id.localeCompare(b.id)
          )) {
            let color;
            try {
              color = chalk.keyword((project as any).color);
            } catch (ex) {
              Logger.debug(`${ex}`);
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
    const { log, messages } = this;
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
        await this.HandleFormattingAndOutput(foundProject, log.object);
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
        p => p.id.toLowerCase() === projectId.toLowerCase()
      )?.id;
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

  PrintApiKeys = async () => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve keys list for env
      const [keysErr, apiKeys] = await contensis.apiKeys.GetKeys();

      if (Array.isArray(apiKeys)) {
        log.success(messages.keys.list(currentEnv));
        await this.HandleFormattingAndOutput(apiKeys, () => {
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

  CreateApiKey = async (name: string, description = '') => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      const [err, key] = await contensis.apiKeys.CreateKey(name, description);

      if (key) {
        log.success(messages.keys.created(currentEnv, name));

        // print the key details to console
        console.log(
          `  - ${chalk.bold(key.name)} [${key.dateModified
            .toString()
            .substring(0, 10)} ${key.modifiedBy}]`
        );
        if (key.description)
          console.log(`    ${log.infoText(key.description)}`);
        console.log(`    ${chalk.bold.grey`id`}: ${key.id}`);
        console.log(
          `    ${chalk.bold.grey`sharedSecret`}: ${key.sharedSecret}`
        );
        console.log('');
        log.help(messages.keys.tip());
      }

      if (err) {
        log.error(messages.keys.failedCreate(currentEnv, name), err);
      }
    }
  };

  RemoveApiKey = async (id: string) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis({ commit: true });

    if (contensis) {
      const [err] = await contensis.apiKeys.RemoveKey(id);

      if (!err) {
        log.success(messages.keys.removed(currentEnv, id));
        console.log('');
      } else {
        log.error(messages.keys.failedRemove(currentEnv, id), err);
      }
    }
  };

  PrintRoles = async () => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve roles list for env
      const [rolesErr, roles] = await to(contensis.roles.GetRoles());

      if (Array.isArray(roles)) {
        log.success(messages.roles.list(currentEnv));

        if (!roles.length) log.help(messages.roles.noneExist());

        await this.HandleFormattingAndOutput(roles, () => {
          // print the roles to console
          for (const {
            id,
            name,
            description,
            enabled,
            assignments,
            permissions,
          } of roles) {
            const color = enabled ? (s: string) => s : log.infoText;

            console.log(color(`  - ${chalk.bold(name)} ${log.infoText(id)}`));
            if (description) console.log(log.infoText(`    ${description}`));
            if (enabled === false)
              console.log(`      ${chalk.bold.grey('enabled')}: false`);
            if (assignments.groups?.length)
              console.log(
                `      ${chalk.bold.grey('groups')}: ${assignments.groups.join(
                  ', '
                )}`
              );
            if (assignments.users?.length)
              console.log(
                `      ${chalk.bold.grey('users')}: ${assignments.users.join(
                  ', '
                )}`
              );
            if (assignments.apiKeys?.length)
              console.log(
                `      ${chalk.bold.grey('keys')}: ${assignments.apiKeys.join(
                  ', '
                )}`
              );

            if (permissions.entries?.length) {
              console.log(`      ${chalk.bold.grey('entries')}:`);
              for (const p of permissions.entries)
                console.log(
                  `        ${p.id}: ${log.infoText(
                    p.actions.length > 2
                      ? p.actions.length
                      : p.actions.join(', ')
                  )}`
                );
            }
            if (permissions.contentTypes?.length)
              console.log(
                `      ${chalk.bold.grey(
                  'contentTypes'
                )}: ${permissions.contentTypes
                  .map(
                    p =>
                      `${p.id} [${p.actions?.join(',')}] ${
                        (p as any).languages?.join(' ') || ''
                      }`
                  )
                  .join(', ')}`
              );
          }
        });
      }

      if (rolesErr) {
        log.error(messages.roles.noList(currentEnv));
        log.error(jsonFormatter(rolesErr));
      }
    }
  };

  PrintRole = async (roleNameOrId: string) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve roles list for env
      const [rolesErr, roles] = await to(contensis.roles.GetRoles());

      if (Array.isArray(roles)) {
        log.success(messages.roles.list(currentEnv));

        const role = findByIdOrName(roles, roleNameOrId);

        if (role) await this.HandleFormattingAndOutput(role, log.object);
        else log.error(messages.roles.failedGet(currentEnv, roleNameOrId));
      }

      if (rolesErr) {
        log.error(messages.roles.noList(currentEnv));
        log.error(jsonFormatter(rolesErr));
      }
    }
  };

  CreateRole = async (role: Partial<Role>) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      const [err, created] = await contensis.roles.CreateRole(role as Role);

      if (created) {
        log.success(
          messages.roles.created(currentEnv, role.id || role.name || '')
        );

        await this.HandleFormattingAndOutput(created, log.object);

        log.help(messages.roles.tip());
        return role.id;
      }

      if (err) {
        log.error(
          messages.roles.failedCreate(currentEnv, role.id || role.name || ''),
          err
        );
      }
    }
  };

  UpdateRole = async (roleNameOrId: string, role: Partial<Role>) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve roles list for env
      const [rolesErr, roles] = await to(contensis.roles.GetRoles());

      if (Array.isArray(roles)) {
        log.success(messages.roles.list(currentEnv));

        const existingRole = findByIdOrName(roles, roleNameOrId, true);
        if (existingRole) {
          log.info(messages.roles.setPayload());
          log.object(role);
          log.raw(``);
          const [updateErr, updated] = await contensis.roles.UpdateRole(
            existingRole.id,
            role
          );
          if (updateErr)
            log.error(messages.roles.failedSet(currentEnv, roleNameOrId));
          else {
            log.success(messages.roles.set());

            await this.HandleFormattingAndOutput(updated, log.object);
          }
        } else {
          // Role does not exist
          log.error(messages.roles.failedGet(currentEnv, roleNameOrId));
        }
      }

      if (rolesErr) {
        log.error(messages.roles.noList(currentEnv));
        log.error(jsonFormatter(rolesErr));
      }
    }
  };

  RemoveRole = async (roleNameOrId: string) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview());
      } else {
        log.warning(messages.migrate.commit());
      }

      // Retrieve roles list for env
      const [rolesErr, roles] = await to(contensis.roles.GetRoles());

      if (Array.isArray(roles)) {
        log.success(messages.roles.list(currentEnv));

        const existingRole = findByIdOrName(roles, roleNameOrId, true);

        if (existingRole) {
          const [deleteErr] = await contensis.roles.RemoveRole(existingRole.id);

          if (deleteErr)
            log.error(messages.roles.failedRemove(currentEnv, roleNameOrId));
          else log.success(messages.roles.removed(currentEnv, roleNameOrId));
        } else {
          // Role does not exist
          log.error(messages.roles.failedGet(currentEnv, roleNameOrId));
        }
      }

      if (rolesErr) {
        log.error(messages.roles.noList(currentEnv));
        log.error(jsonFormatter(rolesErr));
      }
    }
  };

  PrintTagGroup = async (groupId: string) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve taggroups list for env
      const [groupsErr, groups] = await contensis.tags.GetTagGroups({
        id: groupId,
      });

      if (Array.isArray(groups)) {
        log.success(messages.taggroups.list(currentEnv, groups.length));

        if (groups.length)
          await this.HandleFormattingAndOutput(groups[0], () => {
            log.raw('');
            log.object(groups[0]);
          });
        else log.error(messages.taggroups.failedGet(currentEnv, groupId));
      }

      if (groupsErr)
        log.error(messages.taggroups.noList(currentEnv), groupsErr);
    }
  };

  PrintTagGroups = async (query: string) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve tag groups list for env
      const [groupsErr, groups] = await contensis.tags.GetTagGroups({
        q: query,
      });

      if (Array.isArray(groups)) {
        log.success(messages.taggroups.list(currentEnv, groups.length));

        if (!groups.length) log.help(messages.taggroups.noneExist());

        await this.HandleFormattingAndOutput(groups, () => {
          // print the tag groups to console

          for (const { version, ...group } of groups) {
            log.raw('');
            log.object(group);
          }
        });
      }

      if (groupsErr)
        log.error(messages.taggroups.noList(currentEnv), groupsErr);
    }
  };

  ImportTagGroups = async ({
    commit,
    fromFile,
    getBy,
    data,
    tags,
    save,
  }: {
    commit: boolean;
    fromFile?: string;
    getBy?: GetTagGroupsArgs;
    data?: ICreateTagGroup[];
    tags?: ICreateTag[];
    save?: boolean;
  }) => {
    const { currentEnv, currentProject, log, messages } = this;

    const contensis = await this.ConnectContensisImport({
      commit,
      fromFile,
      importDataType: tags ? 'user-input' : 'tagGroups',
      mixedData: {
        tagGroups: data,
        tags: tags,
      },
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview());
      } else {
        log.warning(messages.migrate.commit());
      }

      // contensis.payload.tagGroups = data;
      const method = tags?.length
        ? contensis.tags.MigrateTags
        : contensis.tags.MigrateTagGroups;
      const [err, result] = await to(method(getBy));

      if (err) logError(err);
      else {
        const { tags } = contensis.content.targets[currentProject];
        await this.HandleFormattingAndOutput(
          save
            ? [
                ...tags.migrateGroups.map(g => g.toJSON()),
                ...tags.migrateTags.map(t => t.toJSON()),
              ]
            : result,
          () => {}
        );
      }

      const tagsToMigrate =
        (result as any)?.tagsToMigrate?.[currentProject]?.totalCount || 0;
      const groupsToMigrate = (result?.groupsToMigrate?.[currentProject]
        ?.totalCount || 0) as number;

      const tagsCommitted =
        ((result as any)?.tagsResult?.created || 0) +
        ((result as any)?.tagsResult?.updated || 0);

      const groupsCommitted =
        (result?.groupsResult?.created || 0) +
        (result?.groupsResult?.updated || 0);
      if (
        !err &&
        !result.errors?.length &&
        ((!commit && tagsToMigrate + groupsToMigrate) ||
          (commit && tagsCommitted + groupsCommitted))
      ) {
        log.success(
          messages.taggroups.imported(
            currentEnv,
            commit,
            commit ? groupsCommitted : groupsToMigrate,
            commit ? tagsCommitted : tagsToMigrate
          )
        );
        if (!commit) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      } else {
        log.error(
          messages.taggroups.failedCreate(currentEnv, data?.[0].name),
          err
        );
      }
      if (tagsCommitted)
        log.success(messages.tags.imported(currentEnv, commit, tagsCommitted));
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  RemoveTagGroup = async (groupId: string, commit = false) => {
    const { currentEnv, currentProject, log, messages } = this;
    const contensis = await this.ConnectContensisImport({
      commit,
    });
    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview('DELETE'));
      } else {
        log.warning(messages.migrate.commit('DELETE'));
      }
      const result = await contensis.tags.DeleteTagGroups({ id: groupId });

      // print the results to console
      await this.HandleFormattingAndOutput(result, () => {
        log.raw('');
        log.object(result.existing[currentProject].groups?.[0]);
      });
      if (result.errors?.length) {
        log.error(
          messages.taggroups.failedRemove(currentEnv, groupId),
          result.errors[0]
        );
      } else {
        log.success(
          messages.taggroups.removed(currentEnv, groupId, !contensis.isPreview)
        );
        if (!commit) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      }
    }
  };

  PrintTag = async (getBy?: GetTagsArgs, withDependents = false) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve tags list for env
      const [tagsErr, result] = await contensis.tags.GetTags(getBy, {
        withDependents,
      });

      if (Array.isArray(result)) {
        let tags: ICreateTag[] = [];
        const groups: ICreateTagGroup[] = [];
        if (withDependents) splitTagsAndGroups(result, tags, groups);
        else tags = result;

        log.success(messages.tags.list(currentEnv, tags.length));

        if (tags)
          await this.HandleFormattingAndOutput(result, () => {
            // print the tags to console
            for (const tag of tags) {
              log.raw('');
              log.object(tag);
            }
            if (groups.length) {
              log.raw('');
              log.success(messages.taggroups.list(currentEnv, groups.length));

              for (const group of groups) {
                log.raw('');
                log.object(group);
              }
            }
          });
        else log.error(messages.tags.failedGet(currentEnv));
      }

      if (tagsErr) log.error(messages.tags.noList(currentEnv), tagsErr);
    }
  };

  PrintTags = async (getBy?: GetTagsArgs, withDependents = false) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve tags list for env
      const [tagsErr, result] = await contensis.tags.GetTags(getBy, {
        withDependents,
      });

      if (Array.isArray(result)) {
        let tags: Tag[] = [];
        const groups: TagGroup[] = [];
        if (withDependents) splitTagsAndGroups(result, tags, groups);
        else tags = result;
        log.success(messages.tags.list(currentEnv, tags.length));

        if (!tags.length) log.help(messages.tags.noneExist());

        await this.HandleFormattingAndOutput(result, () => {
          // print the tags to console
          for (const { version, ...tag } of tags) {
            log.raw('');
            log.object(tag);
          }
          if (groups.length) {
            log.raw('');
            log.success(messages.taggroups.list(currentEnv, groups.length));

            for (const { version, ...group } of groups) {
              log.raw('');
              log.object(group);
            }
          }
        });
      }

      if (tagsErr) log.error(messages.tags.noList(currentEnv), tagsErr);
    }
  };

  ImportTags = async ({
    commit,
    fromFile,
    getBy,
    data,
    save,
  }: {
    commit: boolean;
    fromFile?: string;
    getBy?: GetTagsArgs;
    data?: ICreateTag[];
    save?: boolean;
  }) => {
    const { currentEnv, currentProject, log, messages } = this;

    const mixedData: {
      tags: ICreateTag[];
      tagGroups: ICreateTagGroup[];
    } = { tags: [], tagGroups: [] };

    if (data) {
      mixedData.tags = data;
      mixedData.tagGroups = [...new Set(data.map(t => t.groupId))].map(
        id =>
          ({
            id,
          }) as ICreateTagGroup
      );
    }
    if (fromFile) {
      // File may contain mix of tags and tag groups, separate those here
      const fileData = fromFile ? (await readFileAsJSON(fromFile)) || [] : [];
      splitTagsAndGroups(fileData, mixedData.tags, mixedData.tagGroups);
    }

    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: 'tags',
      mixedData,
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview());
      } else {
        log.warning(messages.migrate.commit());
      }

      contensis.payload.tags = data;
      const [err, result] = await to(contensis.tags.MigrateTags(getBy));

      if (err) logError(err);
      else {
        const { tags } = contensis.content.targets[currentProject];
        await this.HandleFormattingAndOutput(
          save
            ? [
                ...tags.migrateGroups.map(g => g.toJSON()),
                ...tags.migrateTags.map(t => t.toJSON()),
              ]
            : result,
          () => {}
        );
      }
      if (
        !err &&
        !result.errors?.length &&
        ((!commit && result.tagsToMigrate[currentProject].totalCount) ||
          (commit &&
            (result.tagsResult?.created || result.tagsResult?.updated)))
      ) {
        log.success(
          messages.tags.imported(
            currentEnv,
            commit,
            commit
              ? (result.tagsResult?.created || 0) +
                  (result.tagsResult?.updated || 0)
              : (result.tagsToMigrate[currentProject].totalCount as number)
          )
        );
        if (!commit) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      } else {
        log.error(
          messages.tags.failedCreate(
            currentEnv,
            data?.length === 1 ? data?.[0].label['en-GB'] : undefined
          ),
          err
        );
      }
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  RemoveTags = async (getBy: GetTagsArgs, commit = false) => {
    const { currentEnv, currentProject, log, messages } = this;

    this.contensisOpts.concurrency = 1;
    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: 'user-input', // 'user-input' import type does not require a source cms
    });
    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview('DELETE'));
      } else {
        log.warning(messages.migrate.commit('DELETE'));
      }
      const result = await contensis.tags.DeleteTags(getBy);
      const deleted =
        (commit
          ? result.tagsResult?.deleted
          : (result.tagsToMigrate[currentProject].delete as number)) || 0;

      // print the results to console
      await this.HandleFormattingAndOutput(result, () => {
        const tags = result.existing[currentProject].tags;
        for (const { version, ...tag } of tags || []) {
          const { status, error } =
            result.tagsToMigrate.tagIds[tag.groupId][tag.id][currentProject];
          log.raw('');
          log.object({
            ...tag,
            status,
            error,
          });
        }
      });
      if (result.errors?.length) {
        log.error(
          messages.tags.failedRemove(currentEnv, result.errors.length),
          result.errors
        );
      } else {
        log.success(
          messages.tags.removed(currentEnv, deleted, !contensis.isPreview)
        );
        if (!commit && deleted) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      }
    }
  };

  PrintWorkflows = async () => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve workflows list for env
      const [workflowsErr, workflows] =
        await contensis.content.source.workflows.GetWorkflows();

      if (Array.isArray(workflows)) {
        log.success(messages.workflows.list(currentEnv));

        if (!workflows.length) log.help(messages.workflows.noneExist());

        const stringFromLanguageObject = (o: { [lang: string]: string }) =>
          Object.values(o || {})?.[0];

        await this.HandleFormattingAndOutput(workflows, () => {
          // print the workflows to console
          // log.object(workflows);
          for (const {
            id,
            name,
            description,
            states,
            eventGroups,
            isSystem,
          } of workflows as any) {
            const color = isSystem ? (s: string) => s : log.infoText;

            console.log(
              color(
                `  - ${chalk.bold(
                  stringFromLanguageObject(name)
                )} ${log.infoText(id)}`
              )
            );
            if (description)
              console.log(
                log.infoText(`    ${stringFromLanguageObject(description)}`)
              );
            if (isSystem === false)
              console.log(`      ${chalk.bold.grey('isSystem')}: false`);
            if (states?.length)
              console.log(
                `      ${chalk.bold.grey('states')}: ${states
                  .map((state: any) => state.id)
                  .join(', ')}`
              );
            if (eventGroups?.length)
              console.log(
                `      ${chalk.bold.grey('eventGroups')}: ${eventGroups
                  .map((evtGrp: any) => evtGrp.id)
                  .join(', ')}`
              );
          }
        });
      }

      if (workflowsErr) {
        log.error(messages.workflows.noList(currentEnv));
        log.error(jsonFormatter(workflowsErr));
      }
    }
  };

  PrintWorkflow = async (workflowNameOrId: string) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      // Retrieve workflows list for env
      const [workflowsErr, workflows] =
        await contensis.content.source.workflows.GetWorkflows();

      if (Array.isArray(workflows)) {
        log.success(messages.workflows.list(currentEnv));

        const workflow = findByIdOrName(workflows, workflowNameOrId);

        if (workflow)
          await this.HandleFormattingAndOutput(workflow, log.object);
        else
          log.error(messages.workflows.failedGet(currentEnv, workflowNameOrId));
      }

      if (workflowsErr) {
        log.error(messages.workflows.noList(currentEnv));
        log.error(jsonFormatter(workflowsErr));
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

        await this.HandleFormattingAndOutput(created, () => {
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

        await this.HandleFormattingAndOutput(updated, log.object);
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

  PrintContentModels = async (
    modelIds: string[] = [],
    opts: { export?: boolean; requiredBy?: boolean }
  ) => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve models list for env
      const models = await contensis.models.contentModels();
      const contentTypes = await contensis.models.contentTypes();
      const components = await contensis.models.components();

      // Models to output to console
      const returnModels = modelIds?.length
        ? models?.filter((m: Model) =>
            modelIds.some(id => id.toLowerCase() === m.id.toLowerCase())
          )
        : undefined;
      const exportResources: (ContentType | Component)[] = [];

      if (opts.export) {
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
        exportResources.push(
          ...contentTypes.filter(c =>
            contentTypeIds
              .map(i => i.toLowerCase())
              .includes(c.id.toLowerCase())
          ),
          ...components.filter(c =>
            componentIds.map(i => i.toLowerCase()).includes(c.id.toLowerCase())
          )
        );
      }

      if (Array.isArray(returnModels)) {
        log.success(messages.models.list(currentProject));
        await this.HandleFormattingAndOutput(
          opts.export ? exportResources : returnModels,
          () => {
            // print the content models to console
            for (const model of returnModels) {
              // create a clone of each model to safely modify
              const draft = clone()(model);
              if (!opts.requiredBy) {
                // truncate parts of the output
                delete draft.dependencyOf;
                if (draft.dependencies?.contentTypes)
                  draft.dependencies.contentTypes.forEach(id => id.pop());
                if (draft.dependencies?.components)
                  draft.dependencies.components.forEach(id => id.pop());
              }

              log.raw('');
              log.object(draft);
            }
            log.raw('');
          }
        );
      } else {
        log.success(
          messages.models.get(currentProject, models?.length.toString() || '0')
        );
        log.raw('');
        if (models?.length) {
          await this.HandleFormattingAndOutput(
            opts.export ? exportResources : models,
            () => {
              // print the content models to console
              for (const model of models) {
                const components = model.components?.length || 0;
                const contentTypes = model.contentTypes?.length || 0;
                const defaults =
                  (model.defaults?.length || 0) + (model.nodes?.length || 0);
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
                          `{ ${
                            components ? `components: ${components}, ` : ''
                          }${
                            contentTypes
                              ? `contentTypes: ${contentTypes}, `
                              : ''
                          }${defaults ? `defaults: ${defaults}, ` : ''}${
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
            }
          );
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
      ? (await readFileAsJSON<(ContentType | Component)[]>(fromFile)) || []
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
        log.success(messages.migrate.preview());
      } else {
        log.warning(messages.migrate.commit());
      }

      const [migrateErr, result] = await contensis.MigrateContentModels();

      if (migrateErr) logError(migrateErr);
      else
        await this.HandleFormattingAndOutput(result, () => {
          // print the results to console
          if (!result.committed) {
            log.raw(log.boldText(`\nContent types:`));
            if (!result.contentTypes) log.info(`- None returned\n`);
            else printModelMigrationAnalysis(this, result.contentTypes);

            log.raw(log.boldText(`\nComponents:`));
            if (!result.components) log.info(`- None returned\n`);
            else printModelMigrationAnalysis(this, result.components);

            if (result.defaults && Object.keys(result.defaults).length) {
              log.raw(log.boldText(`\nDefaults:`));
              printModelMigrationAnalysis(this, result.defaults);
            }
            if (result.nodes && Object.keys(result.nodes).length) {
              log.raw(log.boldText(`\nNodes:`));
              printModelMigrationAnalysis(this, result.nodes);
            }
            if (result.errors) {
              log.raw(log.boldText(`\nErrors:`));
              log.object(result.errors);
            }
          } else {
            const { modelsResult = {} } = result;
            log.raw(log.boldText(`\nContent types:`));
            printModelMigrationResult(
              this,
              modelsResult[currentProject].contentTypes
            );
            // Only output for components if any status has any results
            if (
              Object.values(modelsResult[currentProject].components).some(
                r => r.length > 0
              )
            ) {
              log.raw(log.boldText(`\nComponents:`));
              printModelMigrationResult(
                this,
                modelsResult[currentProject].components
              );
            }
            if (
              Object.values(modelsResult[currentProject].defaults || {}).some(
                r => r.length > 0
              )
            ) {
              log.raw(log.boldText(`\nDefaults:`));
              printModelMigrationResult(
                this,
                modelsResult[currentProject].defaults
              );
            }
            if (
              Object.values(modelsResult[currentProject].nodes || {}).some(
                r => r.length > 0
              )
            ) {
              log.raw(log.boldText(`\nNodes:`));
              printModelMigrationResult(
                this,
                modelsResult[currentProject].nodes
              );
            }
          }
        });
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  PrintContentTypes = async () => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve content types list for env
      const contentTypes = await contensis.models.contentTypes();

      if (Array.isArray(contentTypes)) {
        log.success(messages.contenttypes.list(currentProject));
        await this.HandleFormattingAndOutput(contentTypes, () => {
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
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve content types list for env
      const contentTypes = await contensis.models.contentTypes();

      if (Array.isArray(contentTypes)) {
        const contentType = contentTypes.find(
          c => c.id.toLowerCase() === contentTypeId.toLowerCase()
        );
        if (contentType) {
          log.success(
            messages.contenttypes.get(currentProject, contentType.id)
          );
          // print the content type to console
          await this.HandleFormattingAndOutput(contentType, log.object);
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
      importDataType: 'user-input', // 'user-input' import type does not require a source cms
    });
    if (contensis) {
      const [err, result] = await contensis.DeleteContentTypes(contentTypeIds);

      if (err) {
        log.error(
          messages.contenttypes.failedRemove(
            currentProject,
            contentTypeIds.join(', ')
          ),
          err
        );
      } else {
        log.success(
          messages.contenttypes.removed(
            currentProject,
            contentTypeIds.join(', '),
            !contensis.isPreview
          )
        );
        // print the results to console
        await this.HandleFormattingAndOutput(result, log.object);
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

    let fileData = fromFile
      ? (await readFileAsJSON<ContentType[]>(fromFile)) || []
      : [];
    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);

    if (!Array.isArray(fileData)) fileData = [fileData];

    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: fromFile ? 'user-input' : undefined,
    });

    if (contensis) {
      if (fromFile)
        // Pass each content type to the target repo
        for (const contentType of fileData) {
          // Fix invalid data
          contentType.projectId = currentProject;
          delete contentType.uuid;

          const [err, , createStatus] = await contensis.models.targets[
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
            await this.HandleFormattingAndOutput(contentType, () => {});
          }
        }
      else {
        const result = await contensis.simpleMigration.Migrate(
          contentTypeIds,
          []
        );
        await this.HandleFormattingAndOutput(result, log.object);
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

    let fileData = fromFile
      ? (await readFileAsJSON<ContentType[]>(fromFile)) || []
      : [];
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
        await this.HandleFormattingAndOutput(result, () => {
          log.success(
            `Queried models ${log.infoText(
              `"${result.query.modelIds?.join(', ')}"`
            )}\n`
          );
          if (result.committed === false) {
            log.raw(log.boldText(`Content types:`));
            if (!result.contentTypes) log.info(`- None returned\n`);
            else printModelMigrationAnalysis(this, result.contentTypes);

            log.raw(log.boldText(`\nComponents:`));
            if (!result.components) log.info(`- None returned\n`);
            else printModelMigrationAnalysis(this, result.components);
          }
        });
    }
  };

  PrintComponents = async () => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve components list for env
      const components = await contensis.models.components();

      if (Array.isArray(components)) {
        log.success(messages.components.list(currentProject));

        await this.HandleFormattingAndOutput(components, () => {
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
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve content types list for env
      const components = await contensis.models.components();

      if (Array.isArray(components)) {
        const component = components.find(
          c => c.id.toLowerCase() === componentId.toLowerCase()
        );
        if (component) {
          log.success(messages.components.get(currentProject, component.id));
          // print the component to console
          await this.HandleFormattingAndOutput(component, log.object);
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
      importDataType: 'user-input', // 'user-input' import type does not require a source cms
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
            componentIds.join(', ')
          ),
          err
        );
      } else {
        log.success(
          messages.components.removed(
            currentProject,
            componentIds.join(', '),
            !contensis.isPreview
          )
        );
        // print the results to console
        await this.HandleFormattingAndOutput(result, log.object);
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

    let fileData = fromFile
      ? (await readFileAsJSON<Component[]>(fromFile)) || []
      : [];
    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);

    if (!Array.isArray(fileData)) fileData = [fileData];

    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: fromFile ? 'user-input' : undefined,
    });

    if (contensis) {
      // Pass each component to the target repo
      if (fromFile)
        for (const component of fileData) {
          // Fix invalid data
          component.projectId = currentProject;
          delete component.uuid;

          const [err, , createStatus] = await contensis.models.targets[
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
            await this.HandleFormattingAndOutput(component, () => {});
          }
        }
      else {
        const result = await contensis.simpleMigration.Migrate(
          [],
          componentIds
        );
        await this.HandleFormattingAndOutput(result, log.object);
      }
    }
  };

  RemoveEntries = async (commit = false) => {
    const { currentEnv, currentProject, log, messages } = this;

    this.contensisOpts.concurrency = 1;
    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: 'user-input', // 'user-input' import type does not require a source cms
    });

    if (contensis) {
      if (contensis.isPreview) {
        console.log(log.successText(` -- PREVIEW -- `));
      } else {
        console.log(log.warningText(` *** COMMITTING DELETE *** `));
      }
      const [err, result] = await contensis.DeleteEntries();
      if (result)
        await this.HandleFormattingAndOutput(result, () => {
          // print the migrateResult to console
          printEntriesMigrateResult(this, result, {
            action: 'delete',
            showAll: true,
          });
        });
      if (
        !err &&
        ((!commit && result.entriesToMigrate[currentProject].totalCount) ||
          (commit && result.migrateResult?.deleted))
      ) {
        log.success(messages.entries.removed(currentEnv, commit));
        if (!commit) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      } else {
        log.error(messages.entries.failedRemove(currentEnv), err);
        if (!result?.entriesToMigrate?.[currentProject]?.totalCount)
          log.help(messages.entries.notFound(currentEnv));
      }
    }
  };

  GetEntries = async ({
    withDependents = false,
  }: {
    withDependents?: boolean;
  } = {}) => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      log.line();
      const entries = await contensis.GetEntries({ withDependents });
      // TODO: iterate entries and add some extra details to help
      // with importing later
      // Add a full sys.uri to asset entries
      // Add sys.metadata.exportCms
      // Add sys.metadata.exportProjectId
      const nodes = contensis.content.source.nodes.raw;
      const combinedOutput = [...entries, ...nodes];

      await this.HandleFormattingAndOutput(combinedOutput, () => {
        // print the entries to console
        logEntitiesTable({
          entries,
          projectId: currentProject,
          fields: contensis.payload.query?.fields,
        });
        if (nodes.length)
          logEntitiesTable({
            nodes,
            projectId: currentProject,
            fields: contensis.payload.query?.fields,
          });
      });
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  ImportEntries = async ({
    commit,
    fromFile,
    logOutput,
    saveEntries,
    data,
  }: {
    commit: boolean;
    fromFile?: string;
    logOutput: string;
    saveEntries: boolean;
    data?: any[];
  }) => {
    const { currentEnv, currentProject, log, messages } = this;

    const contensis = await this.ConnectContensisImport({
      commit,
      fromFile,
      importDataType: 'entries',
      importData: data,
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview());
      } else {
        log.warning(messages.migrate.commit());
      }

      const [err, result] = await contensis.MigrateEntries();

      if (err) logError(err);
      else {
        const { entries, nodes } = contensis.content.targets[currentProject];

        const output = saveEntries
          ? // include entries and dependent nodes when saving entries
            [
              entries.migrate?.map(me => me.toJSON()) || [],
              nodes.migrateNodes.map(mn => mn.node),
            ].flat()
          : result;
        await this.HandleFormattingAndOutput(output, () => {
          // print the migrateResult to console
          printEntriesMigrateResult(this, result, {
            showAll: logOutput === 'all',
            showDiff: logOutput === 'all' || logOutput === 'changes',
            showChanged: logOutput === 'changes',
          });
          if (
            ['all', 'changes'].includes(logOutput) &&
            nodes.migrateNodes.length
          )
            printNodeTreeOutput(
              this,
              {
                ...nodes.rootAncestor,
                status: 'no change',
                children: nodes.migrateNodes as any,
              },
              logOutput
            );
        });
      }
      if (
        !err &&
        !result.errors?.length &&
        ((!commit && result.entriesToMigrate[currentProject].totalCount) ||
          (commit &&
            (result.migrateResult?.created || result.migrateResult?.updated)))
      ) {
        log.success(
          messages.entries.imported(
            currentEnv,
            commit,
            commit
              ? (result.migrateResult?.created || 0) +
                  (result.migrateResult?.updated || 0)
              : result.entriesToMigrate[currentProject].totalCount,
            commit
              ? (result.nodesResult?.created || 0) +
                  (result.nodesResult?.updated || 0)
              : (result.nodesToMigrate?.[currentProject]
                  .totalCount as number) || 0
          )
        );
        if (!commit) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      } else {
        log.error(messages.entries.failedImport(currentEnv), err);
        if (!result?.entriesToMigrate?.[currentProject]?.totalCount)
          log.help(messages.entries.notFound(currentEnv));
      }
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  CopyEntryField = async ({
    commit,
    fromFile,
    logOutput,
    saveEntries,
  }: {
    commit: boolean;
    fromFile: string;
    logOutput: string;
    saveEntries: boolean;
  }) => {
    const { currentEnv, currentProject, log, messages } = this;

    const contensis = await this.ConnectContensisImport({
      commit,
      fromFile,
      importDataType: 'entries',
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview());
      } else {
        log.warning(messages.migrate.commit());
      }

      const [err, result] = await to(
        contensis.content.copy.MigrateFieldContent()
      );

      if (err) logError(err);
      if (result) {
        const output = saveEntries
          ? contensis.content.copy.targets[currentProject].entries.migrate?.map(
              me => me.toJSON()
            )
          : result;
        await this.HandleFormattingAndOutput(output, () => {
          // print the migrateResult to console
          printEntriesMigrateResult(this, result, {
            showAll: logOutput === 'all',
            showDiff: logOutput === 'all' || logOutput === 'changes',
            showChanged: logOutput === 'changes',
          });
        });
      }

      if (
        result &&
        !err &&
        !result.errors?.length &&
        ((!commit && result.entriesToMigrate[currentProject].totalCount) ||
          (commit &&
            (result.migrateResult?.created || result.migrateResult?.updated)))
      ) {
        log.success(
          messages.entries.imported(
            currentEnv,
            commit,
            commit
              ? (result.migrateResult?.created || 0) +
                  (result.migrateResult?.updated || 0)
              : result.entriesToMigrate[currentProject].totalCount
          )
        );
        if (!commit) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      } else {
        log.error(messages.entries.failedImport(currentEnv), err);
        if (!result?.entriesToMigrate?.[currentProject]?.totalCount)
          log.help(messages.entries.notFound(currentEnv));
      }
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  UpdateEntryField = async ({
    commit,
    fromFile,
    logOutput,
    saveEntries,
  }: {
    commit: boolean;
    fromFile: string;
    logOutput: string;
    saveEntries: boolean;
  }) => {
    const { currentEnv, currentProject, log, messages } = this;

    const contensis = await this.ConnectContensisImport({
      commit,
      fromFile,
      importDataType: 'entries',
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.entries.update.preview());
      } else {
        log.warning(messages.entries.update.commit());
      }

      const [err, result] = await to(
        contensis.content.update.UpdateFieldContent()
      );

      if (err) logError(err);
      if (result) {
        const output = saveEntries
          ? contensis.content.update.targets[
              currentProject
            ].entries.migrate?.map(me => me.toJSON())
          : result;
        await this.HandleFormattingAndOutput(output, () => {
          // print the migrateResult to console
          printEntriesMigrateResult(this, result, {
            action: 'update',
            showAll: logOutput === 'all',
            showDiff: logOutput === 'all' || logOutput === 'changes',
            showChanged: logOutput === 'changes',
          });
        });
      }

      if (
        result &&
        !err &&
        !result.errors?.length &&
        ((!commit && result.entriesToMigrate[currentProject].totalCount) ||
          (commit &&
            (result.migrateResult?.created || result.migrateResult?.updated)))
      ) {
        log.success(
          messages.entries.update.success(
            currentEnv,
            commit,
            commit
              ? (result.migrateResult?.created || 0) +
                  (result.migrateResult?.updated || 0)
              : result.entriesToMigrate[currentProject].totalCount
          )
        );
        if (!commit) {
          log.raw(``);
          log.help(messages.migrate.commitTip());
        }
      } else {
        log.error(messages.entries.update.failed(currentEnv), err);
        if (!result?.entriesToMigrate?.[currentProject]?.totalCount)
          log.help(messages.entries.notFound(currentEnv));
      }
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };
  GetNodes = async (rootPath: string, depth = 0) => {
    const { currentProject, log, messages } = this;
    const contensis = await this.ConnectContensis();

    if (contensis) {
      log.line();
      const [err, nodes] = await to(contensis.nodes.GetNodes(rootPath, depth));
      if (err) {
        log.error(messages.nodes.failedGet(currentProject), err);
        return;
      }
      const root = contensis.nodes.source.nodes.tree;

      log.success(messages.nodes.get(currentProject, rootPath, depth));

      await this.HandleFormattingAndOutput(nodes, () => {
        // print the nodes to console
        log.object({ ...root, children: undefined, language: undefined });
        printNodeTreeOutput(this, root);
      });
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  ImportNodes = async ({
    commit,
    fromFile,
    logOutput,
    logLimit,
  }: {
    commit: boolean;
    fromFile: string;
    logOutput: string;
    logLimit: number;
  }) => {
    const { currentEnv, currentProject, log, messages } = this;

    const contensis = await this.ConnectContensisImport({
      commit,
      fromFile,
      importDataType: 'nodes',
    });

    if (contensis) {
      log.line();
      if (contensis.isPreview) {
        log.success(messages.migrate.preview());
      } else {
        log.warning(messages.migrate.commit());
      }

      const [err, result] = await contensis.MigrateNodes();

      if (err) log.raw(``);
      else
        await this.HandleFormattingAndOutput(result, () => {
          // print the migrateResult to console
          const migrateTree =
            contensis.nodes.targets[currentProject].nodes.migrateNodesTreeView;
          printNodeTreeOutput(this, migrateTree, logOutput, logLimit);
          printNodesMigrateResult(this, result, {
            showAll: logOutput === 'all',
            showChanged: logOutput === 'changes',
          });
        });

      const nodesMigrateCount =
        result?.nodesToMigrate?.[currentProject].totalCount;
      const nodesCreated = result?.nodesResult?.['created'] || 0;
      const nodesUpdated = result?.nodesResult?.['updated'] || 0;
      const nodesErrored = result?.nodesResult?.['errors'] || 0;
      const noChanges =
        result?.nodesToMigrate?.[currentProject]['no change'] &&
        nodesMigrateCount === 0;

      if (
        !err &&
        (!result.errors?.length || this.contensisOpts.ignoreErrors) &&
        ((!commit && nodesMigrateCount) ||
          (commit && (nodesCreated || nodesUpdated || result.errors?.length)))
      ) {
        let totalCount: number;
        if (commit) {
          const created = typeof nodesCreated === 'number' ? nodesCreated : 0;
          const updated = typeof nodesUpdated === 'number' ? nodesUpdated : 0;

          totalCount = created + updated;
        } else {
          totalCount =
            typeof nodesMigrateCount === 'number' ? nodesMigrateCount : 0;
        }

        log.success(messages.nodes.imported(currentEnv, commit, totalCount));
        log.raw(``);
        if (!commit) {
          log.help(messages.nodes.commitTip());
        }
      } else {
        if (noChanges && !err && !nodesErrored) {
          log.help(messages.nodes.noChange(currentEnv));
        } else {
          log.error(messages.nodes.failedImport(currentEnv), err);
          if (!nodesMigrateCount) log.help(messages.nodes.notFound(currentEnv));
        }
      }
    } else {
      log.warning(messages.models.noList(currentProject));
      log.help(messages.connect.tip());
    }
  };

  RemoveNodes = async (commit = false) => {
    const { currentEnv, currentProject, log, messages } = this;
    const contensis = await this.ConnectContensisImport({
      commit,
      importDataType: 'user-input', // 'user-input' import type does not require a source cms
    });

    if (contensis) {
      if (contensis.isPreview) {
        console.log(log.successText(` -- PREVIEW -- `));
      } else {
        console.log(log.warningText(` *** COMMITTING DELETE *** `));
      }
      const [err, result] = await contensis.DeleteNodes();
      if (result) {
        await this.HandleFormattingAndOutput(result, () => {
          // print the migrateResult to console
          printNodeTreeOutput(
            this,
            contensis.nodes.targets[currentProject].nodes.migrateNodesTreeView
          );
          // printNodesMigrateResult(this, result, {
          //   action: 'delete',
          //   showAll: true,
          // });
        });
      }
      if (
        !err &&
        ((!commit && result.nodesToMigrate[currentProject].totalCount) ||
          (commit && result.nodesResult?.deleted))
      ) {
        log.success(
          messages.nodes.removed(currentEnv, commit, contensis.nodes.rootPath)
        );
        log.raw(``);
        if (!commit) {
          log.help(messages.nodes.commitTip());
        }
      } else {
        log.error(messages.nodes.failedRemove(currentEnv), err);
        if (!result?.nodesToMigrate?.[currentProject]?.totalCount)
          log.help(messages.nodes.notFound(currentEnv));
      }
    }
  };

  PrintWebhookSubscriptions = async (subscriptionIdsOrNames?: string[]) => {
    const { currentEnv, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve webhooks list for env
      const [webhooksErr, webhooks] =
        await contensis.subscriptions.webhooks.GetSubscriptions();

      const filteredResults = subscriptionIdsOrNames?.length
        ? webhooks?.filter(
            w =>
              subscriptionIdsOrNames?.some(idname =>
                w.name?.toLowerCase().includes(idname.toLowerCase())
              ) ||
              subscriptionIdsOrNames?.some(
                id => id.toLowerCase() === w.id.toLowerCase()
              )
          )
        : webhooks;

      if (Array.isArray(filteredResults)) {
        log.success(messages.webhooks.list(currentEnv));
        if (!webhooks?.length) log.warning(messages.webhooks.noneExist());
        else {
          await this.HandleFormattingAndOutput(filteredResults, () => {
            // print the keys to console
            for (const {
              id,
              description,
              method,
              name,
              version,
              url,
              enabled,
              topics,
              templates,
              headers,
            } of filteredResults) {
              console.log(
                log.infoText(
                  `  ${chalk.bold.white`- ${name}`} ${id} [${(
                    version.modified || version.created
                  )
                    .toString()
                    .substring(0, 10)} ${
                    version.modifiedBy || version.createdBy
                  }]`
                )
              );
              if (description) console.log(log.infoText`    ${description}`);
              console.log(`    ${log.infoText`[${method}]`} ${url}`);
              if (headers && Object.keys(headers).length) {
                console.log(`    ${log.infoText`headers`}:`);

                for (const [key, { value, secret }] of Object.entries(headers))
                  console.log(
                    `      ${chalk.bold.gray(key)}: ${secret ? '🤐' : value}`
                  );
              }
              if (topics?.length)
                if (topics?.length === 1)
                  console.log(
                    `    ${log.infoText`topics`}: ${topics
                      .map(t => JSON.stringify(t))
                      .join(' ')
                      .replaceAll('"', '')
                      .replaceAll(',', ' ')
                      .replaceAll('{', '')
                      .replaceAll('}', '')}`
                  );
                else {
                  console.log(`    ${log.infoText`topics`}:`);
                  log.objectRecurse(topics, 1, '    ');
                }
              if (templates && Object.keys(templates).length)
                console.log(
                  `    ${log.infoText`templates`}: ${Object.keys(
                    templates
                  ).join(' ')}`
                );
              if (enabled === false)
                console.log(`    ${log.infoText`enabled`}: ${enabled}`);
            }
          });
        }
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

      if (Array.isArray(blocks) && blocks.length) {
        await this.HandleFormattingAndOutput(blocks, () => {
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

        return blocks;
      }

      if (err) {
        log.error(messages.blocks.noList(currentEnv, env.currentProject));
        // log.error(jsonFormatter(err));
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

      if (err || blocks?.length === 0) {
        log.warning(
          messages.blocks.noGet(
            blockId,
            branch,
            version,
            currentEnv,
            env.currentProject
          )
        );
        log.help(messages.blocks.noGetTip());
        // if (err) log.error(jsonFormatter(err));
      } else if (blocks) {
        await this.HandleFormattingAndOutput(blocks, () => {
          // print the version detail to console
          log.success(
            messages.blocks.get(
              blockId,
              branch,
              version,
              currentEnv,
              env.currentProject
            )
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

        return blocks;
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
      const [err, blockVersion] =
        await contensis.blocks.PushBlockVersion(block);
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
        await this.HandleFormattingAndOutput(blockVersion, () => {
          // print the version detail to console
          printBlockVersion(this, blockVersion);
        });
      }
      if (err)
        throw new Error(
          messages.blocks.failedPush(block.id, currentEnv, env.currentProject)
        );
    } else {
      throw new Error(
        messages.blocks.failedPush(block.id, currentEnv, env.currentProject)
      );
    }
  };

  GetLatestBlockVersion = async (
    blockId: string,
    branch = 'default'
  ): Promise<[AppError | null, string | undefined]> => {
    const { contensis, log, messages } = this;

    // Look for block versions pushed to "default" branch
    const [getErr, blockVersions] =
      (await contensis?.blocks.GetBlockVersions(blockId, branch)) || [];

    if (getErr) {
      return [getErr, undefined];
    }

    // Parse versionNo from response
    let blockVersionNo = 'latest';
    // The first blockVersion should be the latest one
    try {
      blockVersionNo = `${blockVersions?.[0]?.version.versionNo}`;

      if (!Number.isNaN(blockVersionNo) && Number(blockVersionNo) > 0)
        // Is a valid versionNo
        return [null, blockVersionNo];
      else throw new Error(`'${blockVersionNo}' is not a valid version number`);
    } catch (parseVersionEx: any) {
      // Catch parsing errors in case of an unexpected response
      log.info(
        `Request for blockId: ${blockId}, branch: ${branch}, version: latest`
      );
      log.info(
        `Get block versions response was: ${tryStringify(blockVersions)}`
      );
      log.error(messages.blocks.failedParsingVersion());
      return [parseVersionEx, undefined];
    }
  };

  ExecuteBlockAction = async (
    action: BlockActionType,
    blockId: string,
    version = 'latest'
  ) => {
    const { currentEnv, env, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      let actionOnBlockVersion = version;

      // If action is release and version is latest, find the latest version number
      if (action === 'release' && version === 'latest') {
        const [getErr, blockVersion] =
          await this.GetLatestBlockVersion(blockId);

        if (getErr) {
          // Log error getting latest block version no
          // and throw the error message so the process can exit with a failure
          throw new Error(
            `${messages.blocks.noList(
              currentEnv,
              env.currentProject
            )} (${getErr})`
          );
        } else if (blockVersion) {
          actionOnBlockVersion = blockVersion;
        }
      }

      // Execute block action
      const [err, blockVersion] = await contensis.blocks.BlockAction(
        blockId,
        action,
        actionOnBlockVersion
      );

      if (blockVersion) {
        await this.HandleFormattingAndOutput(blockVersion, () => {
          // print the version detail to console
          log.success(
            messages.blocks.actionComplete(
              action,
              blockId,
              currentEnv,
              env.currentProject
            )
          );
          printBlockVersion(this, blockVersion);
        });
      }

      if (err) {
        log.error(jsonFormatter(err));
        throw new Error(
          messages.blocks.actionFailed(
            action,
            blockId,
            currentEnv,
            env.currentProject
          )
        );
      }
    }
  };

  PrintBlockLogs = async (
    blockId: string,
    branch: string,
    version: string,
    dataCenter: 'hq' | 'manchester' | 'london' | undefined,
    follow = false
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

      if (err) {
        log.error(
          messages.blocks.failedGetLogs(blockId, currentEnv, env.currentProject)
        );
        log.error(jsonFormatter(err));
      } else if (blockLogs) {
        const removeTrailingNewline = (logs: string) =>
          logs.endsWith('\n') ? logs.slice(0, logs.length - 1) : logs;
        const renderLogs = removeTrailingNewline(blockLogs);

        await this.HandleFormattingAndOutput(renderLogs, () => {
          // print the logs to console
          console.log(
            `  - ${blockId} ${branch} ${
              Number(version) ? `v${version}` : version
            } ${dataCenter ? `[${dataCenter}]` : ''}`
          );
          log.line();
          console.log(log.infoText(renderLogs));
        });

        // Code for the `--follow` options
        let following = follow;
        let alreadyShown = blockLogs;
        let needsNewLine = false;
        let counter = 0;

        // remove existing listeners and add them back afterwards
        const listeners = process.listeners('SIGINT');

        process.removeAllListeners('SIGINT');
        // add listener to update following to false and break out
        process.on('SIGINT', () => {
          Logger.warning(
            messages.blocks.stopFollow(blockId, currentEnv, env.currentProject)
          );
          stopFollowing();
        });

        const delay = promiseDelay(5 * 1000, null);
        const stopFollowing = () => {
          following = false;
          delay.cancel();

          // Add back the listeners we removed previously
          process.removeAllListeners('SIGINT');
          for (const listener of listeners)
            process.addListener('SIGINT', listener);
        };

        while (following) {
          if (counter++ > 300) {
            Logger.warning(
              messages.blocks.timeoutFollow(
                blockId,
                currentEnv,
                env.currentProject
              )
            );
            stopFollowing();
          }

          // wait n. seconds then poll for logs again
          await delay.wait();

          const [lastErr, lastLogs] = following
            ? await contensis.blocks.GetBlockLogs({
                blockId,
                branchId: branch,
                version,
                dataCenter,
              })
            : [null, null];

          if (lastLogs) {
            // Find the difference and output it next
            const difference = diffLogStrings(lastLogs, alreadyShown);
            if (difference) {
              if (needsNewLine) {
                console.log('');
              }
              // Take the trailing newline off of the logged output to
              // avoid blank lines inbetween logs fetched sequentially
              const render = removeTrailingNewline(difference);
              console.log(log.infoText(render));

              // Add what we've just rendered to already shown "cache"
              alreadyShown += `${render}\n`;
              needsNewLine = false;
            } else {
              // If no difference output a dot
              process.stdout.write('.');
              needsNewLine = true;
            }
          } else if (lastErr) {
            // If error output an x
            process.stdout.write('x');
            needsNewLine = true;
          }
        }
      }
    }
  };

  PrintProxies = async (proxyId?: string) => {
    const { currentEnv, env, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve proxies list for env
      const [err, proxies] = await (contensis.proxies.GetProxies as any)(
        proxyId
      ); // TODO: resolve any cast;

      if (Array.isArray(proxies)) {
        await this.HandleFormattingAndOutput(proxies, () => {
          // print the proxies to console
          log.success(messages.proxies.list(currentEnv, env.currentProject));
          for (const { id, name, description, endpoints, version } of proxies) {
            console.log(
              `  - ${name} [${
                version.versionNo
              }] ${id} ${log.infoText`${description}`}`
            );
            for (const [language, endpoint] of Object.entries(
              endpoints as { [k: string]: any }
            )) // TODO: resolve any cast
              console.log(
                `      - ${log.infoText`language: ${language}
        server: ${endpoint.server}
        headers.host: ${endpoint.headers.host}
        ssl: ${endpoint.ssl}`}`
              );
          }
        });
      }

      if (err) {
        log.error(messages.proxies.noList(currentEnv, env.currentProject));
        log.error(jsonFormatter(err));
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  PrintRenderers = async (rendererId?: string) => {
    const { currentEnv, env, log, messages } = this;
    const contensis = await this.ConnectContensis();
    if (contensis) {
      // Retrieve renderers list for env
      const [err, renderers] = await contensis.renderers.GetRenderers();

      if (Array.isArray(renderers)) {
        await this.HandleFormattingAndOutput(renderers, () => {
          // print the renderers to console
          log.success(messages.renderers.list(currentEnv, env.currentProject));
          for (const {
            id,
            description,
            assignedContentTypes,
            rules,
            version,
          } of renderers) {
            console.log(
              `  - ${id} [${version.versionNo}] ${log.infoText`${description}`}`
            );
            if (assignedContentTypes?.length)
              console.log(
                log.infoText`      assignedContentTypes: ${assignedContentTypes.join(
                  ', '
                )}`
              );
            for (const rule of rules)
              if (rule.return)
                console.log(
                  log.infoText`      ${
                    rule.return.endpointId ? 'endpointId' : 'blockId'
                  }: ${rule.return.endpointId || rule.return.blockId}`
                );
          }
        });
        return renderers;
      }

      if (err) {
        log.error(messages.renderers.noList(currentEnv, env.currentProject));
        log.error(jsonFormatter(err));
      }
    }
  };

  HandleFormattingAndOutput = async <T>(obj: T, logFn: (obj: T) => void) => {
    const { format, log, messages, output } = this;
    const fields = this.contensis?.payload.query?.fields;

    if (!format) {
      // print the object to console
      logFn(obj);
    } else if (format === 'csv') {
      log.raw('');
      log.raw(log.infoText(await csvFormatter(limitFields(obj, fields))));
    } else if (format === 'html') {
      log.raw('');
      log.raw(log.infoText(htmlFormatter(limitFields(obj, fields))));
    } else if (format === 'xml') {
      log.raw('');
      log.raw(log.infoText(xmlFormatter(limitFields(obj, fields))));
    } else if (format === 'json') {
      log.raw('');
      log.raw(log.infoText(jsonFormatter(obj, fields)));
    }
    log.raw('');

    if (output) {
      let writeString = '';
      const isText = !tryParse(obj) && typeof obj === 'string';
      if (format === 'csv') {
        writeString = await csvFormatter(limitFields(obj, fields));
      } else if (format === 'html') {
        writeString = htmlFormatter(limitFields(obj, fields));
      } else if (format === 'xml') {
        writeString = xmlFormatter(limitFields(obj, fields));
      } else
        writeString = isText ? (obj as string) : jsonFormatter(obj, fields);
      // write output to file
      if (writeString) {
        fs.writeFileSync(output, writeString);
        log.success(messages.app.fileOutput(isText ? 'text' : format, output));
      } else {
        log.info(messages.app.noFileOutput());
      }
    }
  };
}

export const cliCommand = (
  commandArgs: string[],
  outputOpts?: OutputOptionsConstructorArg,
  contensisOpts: Partial<MigrateRequest> = {}
) => {
  return new ContensisCli(['', '', ...commandArgs], outputOpts, contensisOpts);
};
export default ContensisCli;
