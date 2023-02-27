export const promiseDelay = (delay: number, value: any) => {
  let timeout: NodeJS.Timeout | null;
  let _reject: PromiseRejectionEvent['reason'];

  const wait = () =>
    new Promise((resolve, reject) => {
      _reject = reject;
      timeout = setTimeout(resolve, delay, value);
    });

  const promise = wait();
  return {
    promise,
    cancel() {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
        _reject();
        _reject = null;
      }
    },
    wait,
  };
};
