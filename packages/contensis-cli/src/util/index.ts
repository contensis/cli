import mergeWith from 'lodash/mergeWith';
import { Logger } from './logger';

export const tryParse = (str: string) => {
  try {
    return typeof str === 'object' ? str : JSON.parse(str);
  } catch (e) {
    return false;
  }
};

export const isJson = (str: string) =>
  typeof str === 'object' || !!tryParse(str);

export const tryStringify = (obj: any) => {
  try {
    return typeof obj === 'object' ? JSON.stringify(obj) : obj;
  } catch (e) {
    return obj;
  }
};

export const isUuid = (str: string) => {
  // Regular expression to check if string is a valid UUID
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  return regexExp.test(str);
};

export const url = (alias: string, project: string) => {
  const projectAndAlias =
    project && project.toLowerCase() !== 'website'
      ? `${project.toLowerCase()}-${alias}`
      : alias;
  return {
    api: `https://api-${alias}.cloud.contensis.com`,
    cms: `https://cms-${alias}.cloud.contensis.com`,
    liveWeb: `https://live-${projectAndAlias}.cloud.contensis.com`,
    previewWeb: `https://preview-${projectAndAlias}.cloud.contensis.com`,
    iisWeb: `https://iis-live-${projectAndAlias}.cloud.contensis.com`,
    iisPreviewWeb: `https://iis-preview-${projectAndAlias}.cloud.contensis.com`,
  };
};

export const Logging = async (language = 'en-GB') => {
  const { LogMessages: defaultMessages } = await import(
    `../localisation/en-GB.js`
  );
  const { LogMessages: localisedMessages } = await import(
    `../localisation/${language}.js`
  );
  return {
    messages: mergeWith(
      localisedMessages,
      defaultMessages,
      (v, s) => v || s
    ) as typeof defaultMessages,
    Log: Logger,
  };
};
