import fs from 'fs';
import path from 'path';
import clone from 'lodash/cloneDeep';
import mergeWith from 'lodash/mergeWith';
import unionBy from 'lodash/unionBy';
import { isJson, tryParse, tryStringify } from '~/util';
import { Logger } from '~/util/logger';

class SessionCacheProvider {
  private localFilePath: string;
  private cache = {} as SessionCache;

  constructor() {
    this.localFilePath = path.join(__dirname, '../../environments.json');
    this.cache = {
      currentTimestamp: new Date().toISOString(),
      environments: {},
      history: [],
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
    } catch (ex) {
      // Problem reading or parsing cache file
    }
  };

  private WriteCacheToDisk = () => {
    try {
      fs.writeFileSync(this.localFilePath, JSON.stringify(this.cache, null, 2));
    } catch (ex) {
      // Problem writing session cache to file
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
        if (key === 'projects')
          return Array.isArray(val) ? [...new Set([...val, ...src])] : src;

        if (Array.isArray(val)) return val.concat(src);
      });
      this.cache.currentTimestamp = new Date().toISOString();
      this.WriteCacheToDisk();
    } catch (ex: any) {
      // Problem merging cache data for update
      Logger.error(`Problem updating environments.json`);
      Logger.error(ex);
    }
    return this.Get();
  };
}

export default SessionCacheProvider;
