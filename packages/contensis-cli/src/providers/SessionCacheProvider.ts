import fs from 'fs';
import path from 'path';
import clone from 'lodash/cloneDeep';
import mergeWith from 'lodash/mergeWith';
import unionBy from 'lodash/unionBy';
import { appRootDir, checkDir } from './file-provider';
import { isJson, tryParse } from '~/util/assert';
import { Logger } from '~/util/logger';
import { LIB_VERSION } from '~/version';

class SessionCacheProvider {
  private localFilePath: string;
  private cache = {} as SessionCache;

  constructor() {
    this.localFilePath = path.join(appRootDir, 'environments.json');
    checkDir(this.localFilePath); // ensure the .contensis home folder exists
    this.cache = {
      currentTimestamp: new Date().toISOString(),
      environments: {},
      history: [],
      version: LIB_VERSION,
    };
    this.ReadCacheFromDisk();
  }

  private ReadCacheFromDisk = () => {
    try {
      if (fs.existsSync(this.localFilePath)) {
        const raw = fs.readFileSync(this.localFilePath, 'utf-8');
        if (isJson(raw)) this.cache = tryParse(raw);
      } else {
        this.WriteCacheToDisk();
      }
    } catch (ex: any) {
      // Problem reading or parsing cache file
      Logger.error(ex);
    }
  };

  private WriteCacheToDisk = () => {
    try {
      fs.writeFileSync(this.localFilePath, JSON.stringify(this.cache, null, 2));
    } catch (ex: any) {
      // Problem writing session cache to file
      Logger.error(ex);
    }
  };

  Get = () => clone(this.cache);

  Update = (updateContent: Partial<SessionCache>) => {
    try {
      this.cache = mergeWith(this.cache, updateContent, (val, src, key) => {
        if (
          key === 'history' &&
          ((src?.[0] &&
            typeof src[0] === 'object' &&
            'createdDate' in src[0]) ||
            (val?.[0] && typeof val[0] === 'object' && 'createdDate' in val[0]))
        ) {
          return unionBy(val, src, 'createdDate');
        }
        if (key === 'projects') return Array.isArray(val) ? val : src;

        if (Array.isArray(val)) return val.concat(src);
      });

      this.cache.currentTimestamp = new Date().toISOString();
      this.cache.version = LIB_VERSION;

      this.WriteCacheToDisk();
    } catch (ex: any) {
      // Problem merging cache data for update
      Logger.error(`Problem updating environments.json`);
      Logger.error(ex);
    }
    return this.Get();
  };

  UpdateEnv = (
    updateContent: Partial<EnvironmentCache>,
    env = this.cache.currentEnvironment,
    setCurrentEnv = true
  ) => {
    try {
      const environment = this.cache.environments[env || ''];

      this.cache.environments[env || ''] = {
        ...environment,
        ...updateContent,
      };
      this.Update({
        currentEnvironment: setCurrentEnv ? env : this.cache.currentEnvironment,
        environments: this.cache.environments,
      });
    } catch (ex: any) {
      // Problem merging cache data for update
      Logger.error(
        `Problem updating environment "${env}" in environments.json`
      );
      Logger.error(ex);
    }
    return this.Get();
  };

  RemoveEnv = (env: string) => {
    try {
      const environment = this.cache.environments[env || ''];
      if (environment) delete this.cache.environments[env || ''];

      this.Update({
        currentEnvironment:
          this.cache.currentEnvironment === env
            ? ''
            : this.cache.currentEnvironment,
        environments: this.cache.environments,
      });
    } catch (ex: any) {
      // Problem merging cache data for update
      Logger.error(
        `Problem removing environment "${env}" in environments.json`
      );
      Logger.error(ex);
    }
    return this.Get();
  };
}

export default SessionCacheProvider;
