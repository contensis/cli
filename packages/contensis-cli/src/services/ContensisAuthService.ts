import { NodejsClient } from 'contensis-management-api/lib/client';
import { ClientGrants, ClientGrantType } from 'contensis-core-api';

class ContensisAuthService {
  private client: NodejsClient;

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
    let credentials: {
      clientType: ClientGrantType;
      clientDetails: ClientGrants;
    };
    if (clientId && clientSecret) {
      credentials = {
        clientType: 'client_credentials',
        clientDetails: {
          clientId,
          clientSecret,
        },
      };
    } else if (username && password) {
      credentials = {
        clientType: 'contensis_classic',
        clientDetails: {
          username,
          password,
        },
      };
    } else if (refreshToken) {
      credentials = {
        clientType: 'contensis_classic_refresh_token',
        clientDetails: {
          refreshToken,
        },
      };
    } else {
      credentials = { clientType: 'none', clientDetails: { refreshToken: '' } };
    }

    this.client = NodejsClient.create({
      ...credentials,
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
