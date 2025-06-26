import to from 'await-to-js';
import { FetchInit } from 'enterprise-fetch';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

import { isJson, tryParse } from '~/util/assert';
import { enhancedFetch } from '~/util/fetch';
class HttpProvider {
  constructor() {}

  async get<T = any>(url: string, init: FetchInit = {}) {
    return this.fetch<T>(url, { method: 'GET', ...init });
  }

  async fetch<T = any>(
    uri: string,
    init: FetchInit = {}
  ): Promise<[Error | null, T | undefined, Response | undefined]> {
    const [error, response] = await to(enhancedFetch(uri, init));

    if (response && !error) {
      const [bodyError, text] = await to(response.text());
      if (bodyError) return [bodyError, undefined, response];
      if (isJson(text)) {
        const err =
          !response.status || !response.ok ? tryParse(text) : undefined;
        const payload =
          response.status && response.ok ? tryParse(text) : undefined;
        return [err, payload, response];
      }
      return [
        response.ok ? null : new Error(text),
        response.ok ? (text as unknown as T) : undefined,
        response,
      ];
    }
    return [error, undefined, response];
  }

  async downloadFile(url: string, destination: string) {
    const res = await fetch(url);
    if (res.ok && res.body !== null) {
      const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
      await finished(Readable.fromWeb(res.body as any).pipe(fileStream));
    }
  }
}

export default HttpProvider;
