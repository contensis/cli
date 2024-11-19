export type CliUrls =
  | {
      api: string;
      cms: string;
      liveWeb: string;
      previewWeb: string;
      iisWeb: string;
      iisPreviewWeb: string;
    }
  | undefined;

export type OutputFormat = 'json' | 'csv' | 'html' | 'xml';

export type OutputOptions = {
  format?: OutputFormat;
  output?: string;
};

export interface IConnectOptions extends IAuthOptions {
  alias?: string;
  projectId?: string;
}

export interface IAuthOptions {
  user?: string;
  password?: string;
  clientId?: string;
  sharedSecret?: string;
}

export interface IImportOptions {
  sourceAlias?: string;
  sourceProjectId?: string;
}

export type OutputOptionsConstructorArg = OutputOptions &
  IConnectOptions &
  IImportOptions;

export interface ContensisCliConstructor {
  new (
    args: string[],
    outputOpts?: OutputOptionsConstructorArg,
    contensisOpts?: Partial<MigrateRequest>
  ): ContensisCli;
}
