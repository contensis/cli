export const promiseDelay = (delay: number, value: any) => {
  let timeout: NodeJS.Timeout | null = null;
  let resolve: ((value: any) => void) | null = null;

  const wait = () =>
    new Promise(r => {
      resolve = r;
      timeout = setTimeout(r, delay, value);
    });

  return {
    wait,
    // cancelling is not a failure: the waiter re-checks its own state, so
    // resolve early rather than reject the awaiting loop out of existence
    cancel() {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
        resolve?.(value);
        resolve = null;
      }
    },
  };
};
