import os from 'os';

export const isWindows = () => os.platform() === 'win32';

export const winSlash = (str: string) =>
  isWindows() ? str.replaceAll('/', '\\') : str;

export const linuxSlash = (str: string) =>
  !isWindows() ? str.replaceAll('\\', '/') : str;

export const normaliseLineEndings = (
  str: string,
  lineEnd = isWindows() ? '\r\n' : '\n'
) => str.replace(/\r?\n/g, lineEnd);
