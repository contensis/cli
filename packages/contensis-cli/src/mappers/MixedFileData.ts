import { Component, ContentType, Project } from 'contensis-core-api';
import {
  Entry,
  ICreateNode,
  ICreateTag,
  ICreateTagGroup,
  Tag,
  TagGroup,
} from 'contensis-management-api';
import { MigrateRequest } from 'migratortron';
import { readFileAsJSON } from '~/providers/file-provider';

export class MixedFileData
  implements
    Pick<MigrateRequest, 'models' | 'entries' | 'nodes' | 'tagGroups' | 'tags'>
{
  models: (ContentType | Component)[] = [];
  entries: Entry[] = [];
  nodes: ICreateNode[] = [];
  tagGroups: (TagGroup | ICreateTagGroup)[] = [];
  tags: (Tag | ICreateTag)[] = [];

  constructor(fileData?: any[]) {
    if (Array.isArray(fileData)) this.init(fileData);
  }
  init = (fileData: any[]) => {
    for (const item of fileData) {
      if (
        this.#isContentType(item) ||
        this.#isComponent(item) ||
        this.#isForm(item)
      )
        this.models.push(item);
      if (this.#isEntry(item) || this.#isAsset(item)) this.entries.push(item);
      if (this.#isNode(item)) this.nodes.push(item);
      if (this.#isTagGroup(item)) this.tagGroups.push(item);
      if (this.#isTag(item)) this.tags.push(item);
    }
  };
  async readFile(filePath: string): Promise<any> {
    const fileData = await readFileAsJSON(filePath);
    if (typeof fileData === 'string')
      throw new Error(`Import file format must be of type JSON`);
    if (Array.isArray(fileData)) this.init(fileData);
    return this;
  }

  #isProject = (item: any): item is Project =>
    'id' in item && 'name' in item && 'primaryLanguage' in item;

  #isContentType = (item: any): item is ContentType =>
    'dataFormat' in item && item.dataFormat === 'entry';

  #isComponent = (item: any): item is Component =>
    'dataFormat' in item && item.dataFormat === 'component';

  #isForm = (item: any): item is ContentType =>
    'dataFormat' in item && item.dataFormat === 'form';

  #isAsset = (item: any): item is Entry =>
    'sys' in item &&
    'contentTypeId' in item.sys &&
    'dataFormat' in item.sys &&
    item.sys.dataFormat === 'asset';

  #isEntry = (item: any): item is Entry =>
    'sys' in item &&
    'contentTypeId' in item.sys &&
    'dataFormat' in item.sys &&
    item.sys.dataFormat === 'entry';

  #isNode = (item: any): item is ICreateNode =>
    ('slug' in item || 'path' in item) && 'displayName' in item;

  #isTag = (item: any): item is ICreateTag =>
    'id' in item && 'groupId' in item && 'label' in item;

  #isTagGroup = (item: any): item is ICreateTagGroup =>
    'id' in item && 'name' in item && 'tagCount' in item;
}
