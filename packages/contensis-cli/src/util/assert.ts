export const isSharedSecret = (str = '') =>
  str.length > 80 && str.split('-').length === 3 ? str : undefined;

export const isPassword = (str = '') =>
  !isSharedSecret(str) ? str : undefined;

export const tryParse = (str: any) => {
  try {
    return typeof str === 'object' ? str : JSON.parse(str);
  } catch (e) {
    return false;
  }
};

export const isJson = (str?: string) =>
  typeof str === 'object' || !!tryParse(str);

export const tryStringify = (obj: any) => {
  try {
    return typeof obj === 'object' ? JSON.stringify(obj) : obj;
  } catch (e) {
    return obj;
  }
};

export const isSysError = (error: any): error is Error =>
  error?.message !== undefined && error.stack;

export const isUuid = (str: string) => {
  // Regular expression to check if string is a valid UUID
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  return regexExp.test(str);
};
