import { DoRetry, FetchInit, fetchWithDefaults } from 'enterprise-fetch';
import { Logger } from './logger';

const retryPolicy = {
  retries: 2,
  minTimeout: 400,
  factor: 2,
};

const applyTimeout = (s: number) =>
  process.env.NODE_ENV === 'test' ? 2 * 1000 : s * 1000;

export const doRetry = ({ silent = false } = {}) => {
  const fn: DoRetry = async (
    attempt: number,
    res: Response | AppError,
    { url, options } = { url: '', options: {} }
  ) => {
    // Get the retry policy from options or fetchDefaults
    const { retry = retryPolicy } = options || ({} as any);
    let shouldRetry = false;

    // Retry request on any network error, or 4xx or 5xx status codes
    if (
      !res.status ||
      (res.status >= 400 && ![400, 404, 409, 422, 500].includes(res.status))
    )
      if (
        !('message' in res) ||
        ('message' in res &&
          !(res.message as string).includes('Nock: No match'))
      )
        shouldRetry = true;

    if (attempt <= retry.retries) {
      // If a res has a status it is a HTTP error
      // With no status it could be a fetch error or app error
      const errorMessage = !res.status
        ? `${('name' in res && res.name) || ('type' in res && res.type)}: ${
            'message' in res && res.message
          }`
        : `${res.status}: ${res.statusText}`;

      if (!silent)
        Logger.warning(
          `[fetch] ${
            shouldRetry
              ? `attempt ${attempt}/${retry.retries}`
              : 'non-retriable'
          } ${errorMessage} ${url || ''}`
        );
    } else {
      shouldRetry = false;
    }
    return await Promise.resolve(shouldRetry);
  };
  return fn;
};

const fetchDefaults = {
  // The timeout to apply to requests that do not supply a timeout option
  timeout: applyTimeout(60),
  // Retry policy for all fetch requests
  retry: retryPolicy,
  // Do retry function to examine failures and apply custom retry logic
  // return true to retry the fetch call
  doRetry: doRetry(),
} as FetchInit;

export const enhancedFetch = fetchWithDefaults(fetchDefaults);
// export const assetFetch = fetchWithDefaults({
//   ...fetchDefaults,
//   timeout: applyTimeout(1200),
// });
