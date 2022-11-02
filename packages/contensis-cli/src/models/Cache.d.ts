type SessionCache = {
  currentEnvironment?: string;
  currentTimestamp: string;
  environments: {
    [alias: string]: EnvironmentCache;
  };
  history: string[];
};

type EnvironmentCache = {
  lastUserId: string;
  passwordFallback?: string;
  authToken?: string;
  currentProject?: string;
  projects: string[];
  history: CliCommand[];
  versionStatus: 'latest' | 'published';
};

type CliCommand = {
  createdDate: string;
  createdUserId: string;
  commandText: string;
  result?: any;
};
