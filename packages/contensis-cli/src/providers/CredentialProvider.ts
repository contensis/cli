import keytar from 'keytar';
import to from 'await-to-js';
import { Logger } from '~/util/logger';

const SERVICE_NAME = 'contensis-cli';

interface Remarks {
  secure: boolean;
}

class CredentialProvider {
  private serviceId: string;
  private userId: string = '';
  private passwordFallback?: string;

  current: {
    account: string;
    password: string;
  } | null = null;
  remarks: Remarks = { secure: false };

  constructor(
    { userId, alias }: { userId: string; alias?: string },
    passwordFallback?: string
  ) {
    this.serviceId =
      typeof alias !== 'undefined' ? `${SERVICE_NAME}_${alias}` : SERVICE_NAME;
    this.userId = userId;
    this.passwordFallback = passwordFallback;
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
    if (err && this.passwordFallback) {
      this.current = {
        account: this.userId,
        password: this.passwordFallback,
      };
    }
    if (!err) {
      this.remarks = { secure: true };
      this.current =
        stored?.find(
          u => u?.account?.toLowerCase() === this.userId.toLowerCase()
        ) || null;

      if (!this.current && this.passwordFallback) {
        await this.Save(this.passwordFallback);
        return await this.Init();
      }
    }
    return [err, this];
  };

  Save = async (password: string) => {
    const [err] = await to(
      keytar.setPassword(this.serviceId, this.userId, password)
    );

    // if (!err) Logger.info(`${this.serviceId} - credentials saved`);
    return err && !this.passwordFallback ? err : true;
  };

  Delete = async () => {
    if (this.passwordFallback) {
      this.passwordFallback = undefined;
      return true;
    } else {
      const [err] = await to(
        keytar.deletePassword(this.serviceId, this.userId)
      );

      Logger.warning(`${this.serviceId} - invalid credentials removed`);
      return err || true;
    }
  };

  // GetPassword = async () => {
  //   const [err, password] = await to(
  //     keytar.getPassword(this.serviceId, this.userId)
  //   );

  //   return err || password;
  // };
}

export default CredentialProvider;
