import keytar from 'keytar';
import to from 'await-to-js';
import { Logger } from '~/logger';

const SERVICE_NAME = 'contensis-cli';

class CredentialProvider {
  private serviceId: string;
  private userId: string = '';

  current: {
    account: string;
    password: string;
  } | null = null;

  constructor(userId: string, alias?: string) {
    this.serviceId =
      typeof alias !== 'undefined' ? `${SERVICE_NAME}_${alias}` : SERVICE_NAME;
    this.userId = userId;
  }

  Init = async (): Promise<[Error, CredentialProvider]> => {
    const [err, stored] = (await to(
      keytar.findCredentials(this.serviceId)
    )) as [
      Error,
      {
        account: string;
        password: string;
      }[]
    ];
    if (!err)
      this.current =
        stored?.find(
          u => u?.account?.toLowerCase() === this.userId.toLowerCase()
        ) || null;
    return [err, this];
  };

  Save = async (password: string) => {
    const [err] = await to(
      keytar.setPassword(this.serviceId, this.userId, password)
    );

    Logger.info(`Saved credentials for ${this.serviceId}\n`);
    return err || true;
  };

  Delete = async () => {
    const [err] = await to(keytar.deletePassword(this.serviceId, this.userId));

    Logger.warning(`Removed invalid credentials for ${this.serviceId}\n`);
    return err || true;
  };

  GetPassword = async () => {
    const [err, password] = await to(
      keytar.getPassword(this.serviceId, this.userId)
    );

    return err || password;
  };
}

export default CredentialProvider;
