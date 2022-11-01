import { flatten } from 'flat';
import { Parser } from 'json2csv';
import cleaner from 'deep-cleaner';

const flattenObject = (obj: any) => flatten(cleaner(obj, ['workflow']));

export const csvFormatter = <T>(entries: T | T[]) => {
  // Flatten the passed in object
  const flatEntries = [];
  if (Array.isArray(entries))
    for (const entry of entries) {
      flatEntries.push(flattenObject(entry));
    }
  else flatEntries.push(flattenObject(entries));

  // Parse the flattened object to csv
  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(flatEntries);

  return csv;
};
