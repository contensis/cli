export const deconstructApiError = (error: MappedError) => {
  let inner = '';
  if (error.data?.[0]) {
    inner = `${error.data?.[0].Field}: ${error.data?.[0].Message}`;
  }
  return `${error.message} ${inner}`;
};
