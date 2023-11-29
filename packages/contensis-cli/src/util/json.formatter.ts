import { flatten, unflatten } from 'flat';
import cleaner from 'deep-cleaner';

// Format a JSON object for a nice output
export const jsonFormatter = <T>(obj: T, fields?: string[]) =>
  JSON.stringify(limitFields(obj, fields), null, 2);

// Flatten a JSON object such as an entry so there are no
// nested object and the keys are presented like "sys.version.versionNo": "1.0"
export const flattenObject = (obj: any) => flatten(cleaner(obj, ['workflow']));

// Will limit and sort an object's keys by an array of supplied fields
export const limitFields = (obj: any, fields?: string[]): any => {
  if (!fields) return obj;
  if (obj && Array.isArray(obj)) {
    const arr = [];
    for (const child of obj) arr.push(limitFields(child, fields));
    return arr;
  }

  if (obj && typeof obj === 'object') {
    const flattenedObj = flatten(obj) as any;
    const sortedObj = {} as any;
    for (const field of fields) {
      sortedObj[field] = flattenedObj[field];
    }

    return unflatten(sortedObj);
  }

  return obj;
};
