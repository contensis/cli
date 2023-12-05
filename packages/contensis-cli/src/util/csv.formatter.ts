import { parse, stringify } from 'csv/sync';
import { flattenObject } from './json.formatter';

export const csvFormatter = <T>(entries: T | T[]) => {
  // Flatten the passed in object
  const flatEntries = [];
  if (Array.isArray(entries))
    for (const entry of entries) {
      flatEntries.push(flattenObject(entry));
    }
  else flatEntries.push(flattenObject(entries));

  // Parse the flattened object to csv
  const csv = stringify(flatEntries, { header: true });

  return csv;
};

export const csvToJson = <T>(data: string): T[] => {
  return parse(data, {
    columns: true,
    skip_empty_lines: true,
  });
};

export const detectCsv = (
  chunk: string,
  opts?: { delimiters?: string[]; newlines?: string[] }
) => {
  opts = opts || {};
  if (Buffer.isBuffer(chunk)) chunk = chunk + '';
  const delimiters = opts.delimiters || [',', ';', '\t', '|'];
  const newlines = opts.newlines || ['\n', '\r'];

  const lines = chunk.split(/[\n\r]+/g);

  const delimiter = determineMost(lines[0], delimiters);
  const newline = determineMost(chunk, newlines);

  if (!delimiter) return null;

  return {
    delimiter: delimiter,
    newline: newline,
  };
};

const determineMost = (chunk: string, items: string[]) => {
  const itemCount = {} as any;
  let ignoreString = false;
  let maxValue = 0;
  let maxChar;
  let currValue;
  items.forEach(item => {
    itemCount[item] = 0;
  });
  for (var i = 0; i < chunk.length; i++) {
    if (chunk[i] === '"') ignoreString = !ignoreString;
    else if (!ignoreString && chunk[i] in itemCount) {
      currValue = ++itemCount[chunk[i]];
      if (currValue > maxValue) {
        maxValue = currValue;
        maxChar = chunk[i];
      }
    }
  }
  return maxChar;
};
