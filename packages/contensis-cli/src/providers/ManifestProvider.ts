import { tryParse } from '~/util/assert';
import { appPath, readFile, writeFile } from './file-provider';

export type CliModule = {
  github: string;
  version: string;
  install?: string;
  cmd?: string;
};

type CliManifest = {
  [moduleName: string]: CliModule;
};

const MANIFEST_PATH = appPath('cli-manifest.json');

class ManifestProvider {
  private manifest: CliManifest;

  constructor() {
    const manifest = tryParse(readFile(MANIFEST_PATH));
    this.manifest = manifest || {};
  }

  get() {
    return this.manifest;
  }

  getModule(name: string) {
    return this.manifest?.[name];
  }
  writeModule(name: string, moduleInfo: CliModule) {
    if (this.manifest) this.manifest[name] = moduleInfo;
    else
      this.manifest = {
        [name]: moduleInfo,
      };

    writeFile(MANIFEST_PATH, JSON.stringify(this.manifest, null, 2));
  }
}

export default ManifestProvider;
