type SessionCache = {
  currentEnvironment?: string;
  currentTimestamp: string;
  environments: {
    [alias: string]: EnvironmentCache;
  };
  history: string[];
  version: string;
};

type EnvironmentCache = {
  lastUserId: string;
  passwordFallback?: string;
  authToken?: string;
  currentProject?: string;
  projects: { id: string; primaryLanguage: string }[];
  history: CliCommand[];
  versionStatus: 'latest' | 'published';
};

type CliCommand = {
  createdDate: string;
  invokedBy: string;
  commandText: string;
  options: { [key: string]: string | boolean };
  result?: any;
};
