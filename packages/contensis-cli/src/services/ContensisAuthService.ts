import { NodejsClient } from 'contensis-management-api/lib/client';
import { ClientGrants, ClientGrantType } from 'contensis-core-api';

class ContensisAuthService {
  private client: NodejsClient;
  private credentials: {
    clientType: ClientGrantType;
    clientDetails: ClientGrants;
  };

  get clientType() {
    return this.credentials.clientType;
  }
  get clientDetails() {
    return this.credentials.clientDetails;
  }

  constructor({
    clientId = '',
    clientSecret = '',
    username,
    password,
    refreshToken,
    projectId,
    rootUrl,
  }: {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    refreshToken?: string;
    projectId: string;
    rootUrl: string;
  }) {
    if (clientId && clientSecret)
      this.credentials = {
        clientType: 'client_credentials',
        clientDetails: {
          clientId,
          clientSecret,
        },
      };
    else if (username && password)
      this.credentials = {
        clientType: 'contensis_classic',
        clientDetails: {
          username,
          password,
        },
      };
    else if (refreshToken)
      this.credentials = {
        clientType: 'contensis_classic_refresh_token',
        clientDetails: {
          refreshToken,
        },
      };
    else
      this.credentials = {
        clientType: 'none',
        clientDetails: { refreshToken: '' },
      };

    this.client = NodejsClient.create({
      ...this.credentials,
      projectId,
      rootUrl,
    });
  }

  ClassicToken = async (): Promise<string | null | undefined> => {
    // make sure our token isn't expried.
    await this.client.ensureBearerToken();
    return (this.client as any).contensisClassicToken;
  };
  BearerToken = async () =>
    this.client.bearerToken || (await this.client.ensureBearerToken());
  RefreshToken = async () =>
    !this.client.isRefreshTokenExpired() ? this.client.refreshToken : null;

  /* PROJECTS */
  ProjectId = () => this.client.clientConfig.projectId;
  RootUrl = () => this.client.clientConfig.rootUrl;
}

export default ContensisAuthService;
