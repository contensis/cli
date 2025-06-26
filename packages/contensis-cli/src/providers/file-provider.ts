import fs from 'fs';
import { homedir } from 'os';
import path from 'path';
import { tryParse } from '~/util/assert';
import { csvToJson, detectCsv } from '~/util/csv.formatter';
import { unflattenObject } from '~/util/json.formatter';
import { Logger } from '~/util/logger';
import { xmlToJson } from '~/util/xml.formatter';

const userHomeDir = homedir();

export const appRootDir =
  process.env.CONTAINER_CONTEXT === 'true'
    ? process.cwd()
    : path.join(userHomeDir, '.contensis/');

export const readFile = (filePath: string) => {
  const directoryPath = appPath(filePath);
  if (fs.existsSync(directoryPath)) {
    const file = fs.readFileSync(directoryPath, 'utf8');
    return file;
  } else {
    return undefined;
  }
};

export const readFiles = (directory: string, createDirectory = true) => {
  const directoryPath = appPath(directory);
  if (fs.existsSync(directoryPath)) {
    const files = fs.readdirSync(directoryPath);
    return files;
  } else if (createDirectory) {
    fs.mkdirSync(directoryPath, { recursive: true });
    return [];
  } else {
    throw new Error(`ENOENT: Directory does not exist ${directoryPath}`);
    // return undefined;
  }
};

export const writeFile = (filePath: string, content: string) => {
  const directoryPath = appPath(filePath);
  fs.writeFileSync(directoryPath, content, { encoding: 'utf-8' });
};

export const removeFile = (filePath: string) => {
  const directoryPath = appPath(filePath);
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath);
  }
};

export const removeDirectory = (filePath: string) => {
  const directoryPath = appPath(filePath);
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { force: true, recursive: true });
  }
};

export const moveFile = (file: string, fromPath: string, toPath: string) => {
  const from = path.join(appRootDir, `${fromPath}${file}`);
  const to = path.join(appRootDir, `${toPath}${file}`);
  if (fs.existsSync(from)) {
    checkDir(toPath);
    // if (!fs.existsSync(toPath)) fs.mkdirSync(toPath, { recursive: true });

    fs.rename(from, to, err => {
      if (err)
        console.error(
          `Could not rename file "${file}" from: ${fromPath} to: ${toPath}`,
          err
        );
      console.info(`Renamed file "${file}" from: ${fromPath} to: ${toPath}`);
    });
  } else {
    console.error(
      `Could not rename file "${file}" from: ${fromPath} to: ${toPath}\nFile does not exist!`
    );
  }
};

export const checkDir = (filePath: string) => {
  const directoryPath = path.dirname(appPath(filePath));
  if (!fs.existsSync(directoryPath))
    fs.mkdirSync(directoryPath, { recursive: true });
};

export const appPath = (filePath: string) =>
  path.isAbsolute(filePath) ? filePath : path.join(appRootDir, filePath);

export const cwdPath = (filePath: string) =>
  path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

export const joinPath = path.join;

export const addExecutePermission = (filePath: string) =>
  // Fails in windows with `TypeError [ERR_INVALID_ARG_TYPE]: The "mode" argument must be of type number. Received undefined`
  fs.chmodSync(filePath, fs.constants.S_IRWXU);

type DetectedFileType =
  | { type: 'json'; contents: any }
  | { type: 'xml' | 'csv'; contents: string };

const detectFileType = (fromFile: string): DetectedFileType | undefined => {
  const fileData = readFile(fromFile);
  if (!fileData) throw new Error(`Unable to read file at ${fromFile}`);
  try {
    // if XML
    if (fileData.startsWith('<')) return { contents: fileData, type: 'xml' };

    // if JSON
    const jsonData = tryParse(fileData);
    if (jsonData) return { contents: jsonData, type: 'json' };

    // if CSV
    const csv = detectCsv(fileData);
    if (csv) return { contents: fileData, type: 'csv' };
  } catch (ex) {
    Logger.error(`Problem detecting file type ${fromFile}`, ex);
  }
};

export const readFileAsJSON = async <T = any>(
  fromFile: string
): Promise<T | undefined> => {
  const detectedFile = detectFileType(cwdPath(fromFile));
  if (!detectedFile) return undefined;
  try {
    switch (detectedFile.type) {
      case 'csv': {
        const flatJson = await csvToJson(detectedFile.contents);
        const unflattenedJson = flatJson.map(record => unflattenObject(record));
        return unflattenedJson as T;
      }
      case 'xml':
        return (await xmlToJson(detectedFile.contents)) as T;

      case 'json':
      default:
        return detectedFile.contents;
    }
  } catch (ex) {
    Logger.error(`Problem converting file from ${detectedFile.type}`, ex);
  }
};
