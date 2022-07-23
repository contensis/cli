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
    if (username && password) {
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
      credentials = {
        clientType: 'client_credentials',
        clientDetails: {
          clientId,
          clientSecret,
        },
      };
    }

    this.client = NodejsClient.create({
      ...credentials,
      projectId,
      rootUrl,
    });
  }

  BearerToken = async () =>
    this.client.bearerToken || (await this.client.ensureBearerToken());
  RefreshToken = async () =>
    !this.client.isRefreshTokenExpired() ? this.client.refreshToken : null;

  /* PROJECTS */
  ProjectId = () => this.client.clientConfig.projectId;
  RootUrl = () => this.client.clientConfig.rootUrl;
}

export default ContensisAuthService;
