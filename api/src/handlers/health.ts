import { type Health } from '@app/api-server-sdk';

import { type HandlerContext } from './context.js';

export const health: Health<HandlerContext> = () =>
  Promise.resolve({ status: 'ok', service: 'api', time: new Date() });
