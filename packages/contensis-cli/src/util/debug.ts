export const isDebug = () => ['true', '1'].includes(process.env.debug || '');
