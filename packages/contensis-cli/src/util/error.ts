export const deconstructApiError = (error: MappedError) => {
  let inner = '';
  if (error.data?.[0]) {
    inner = `${error.data?.[0].Field}: ${error.data?.[0].Message}`;
  }
  return `${error.message} ${inner}`;
};

/**
 * `JSON.stringify(new Error('message'))` is `{}` because name, message and
 * stack are not enumerable - so map them out before printing. Errors from
 * `HttpFetch` arrive this way: as `Error` objects, not API JSON.
 */
export const deconstructIfError = <T = unknown>(obj: T) =>
  obj instanceof Error
    ? {
        ...obj,
        name: obj.name,
        message: obj.message,
      }
    : obj;
