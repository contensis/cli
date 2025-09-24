import { ContentType, Component } from 'contensis-core-api';
import { ICreateTag, ICreateTagGroup } from 'contensis-management-api';
import mergeWith from 'lodash/mergeWith';
import { Logger } from './logger';
import { LogMessages as enGB } from '../localisation/en-GB.js';
import { isObject } from 'lodash';

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
  const defaultMessages = enGB;
  // const { LogMessages: defaultMessages } = await import(
  //   `../localisation/en-GB.js`
  // );
  const localisedMessages = defaultMessages;

  if (language === 'en-GB') {
    // Using a variable import e.g. `import(`../localisation/${language}.js`);`
    // does not play well with packaged executables
    // So we have to hard code the import for each language individually
  }
  return {
    messages: mergeWith(
      localisedMessages,
      defaultMessages,
      (v, s) => v || s
    ) as typeof defaultMessages,
    Log: Logger,
  };
};

export const splitTagsAndGroups = (
  tagsAndGroups: unknown[] = [],
  tags: ICreateTag[] = [],
  groups: ICreateTagGroup[] = []
) => {
  for (const item of tagsAndGroups) {
    if (isObject(item) && 'id' in item) {
      if ('name' in item) groups.push(item as ICreateTagGroup);
      else tags.push(item as ICreateTag);
    }
  }
};

export const splitTagGroupsInModels = (
  mixedData: unknown[] = [],
  models: (ContentType | Component)[] = [],
  groups: ICreateTagGroup[] = []
) => {
  for (const item of mixedData) {
    if (isObject(item) && 'id' in item) {
      if (!('dataFormat' in item)) groups.push(item as ICreateTagGroup);
      else models.push(item as ContentType | Component);
    }
  }
};
