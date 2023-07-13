import keytar from 'keytar';
import to from 'await-to-js';
import { Logger } from '~/util/logger';

const SERVICE_NAME = 'contensis-cli';

interface Remarks {
  secure: boolean;
}

class CredentialProvider {
  private serviceId: string;
  private keytar!: typeof keytar;
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

  Import = async () => {
    try {
      this.keytar = (await import('keytar')).default;
    } catch (ex) {
      this.keytar = {
        findCredentials: async () => {
          throw ex;
        },
        getPassword: async () => {
          throw ex;
        },
        findPassword: async () => {
          throw ex;
        },
        setPassword: async () => {
          throw ex;
        },
        deletePassword: async () => {
          throw ex;
        },
      };
    }
  };

  Init = async (): Promise<[Error, CredentialProvider]> => {
    await this.Import();

    const [err, stored] = (await to(
      this.keytar.getPassword(this.serviceId, this.userId)
    )) as [Error, string];

    if (err && this.passwordFallback) {
      this.current = {
        account: this.userId,
        password: this.passwordFallback,
      };
    }
    if (!err) {
      this.remarks = { secure: true };
      if (stored) this.current = { account: this.userId, password: stored };

      if (!this.current && this.passwordFallback) {
        await this.Save(this.passwordFallback);
        return await this.Init();
      }
    }
    return [err, this];
  };

  Save = async (password: string) => {
    const [err] = await to(
      this.keytar.setPassword(this.serviceId, this.userId, password)
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
        this.keytar.deletePassword(this.serviceId, this.userId)
      );

      if (err)
        Logger.warning(
          `${this.serviceId} - could not remove invalid credentials for ${this.userId}`
        );
      else
        Logger.warning(
          `${this.serviceId} - invalid credentials removed for ${this.userId}`
        );
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
