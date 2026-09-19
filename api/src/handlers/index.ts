import { InternalServerError, type SupportAssistantService } from '@app/api-server-sdk';
import { ServiceException } from '@smithy/server-common';

import { authHandlers } from './auth.js';
import { companyHandlers } from './companies.js';
import { type HandlerContext, type Operation } from './context.js';
import { conversationHandlers } from './conversations.js';
import { feedbackHandlers } from './feedback.js';
import { guidelineHandlers } from './guidelines.js';
import { health } from './health.js';
import { type AuthService } from '../auth/service.js';
import { type CompaniesService } from '../companies/service.js';
import { type ConversationsService } from '../conversations/service.js';
import { type FeedbackService } from '../feedback/service.js';
import { type GuidelinesService } from '../guidelines/service.js';
import { typedEntries } from '../lib/object.js';

export interface ServiceDeps {
  auth: AuthService;
  companies: CompaniesService;
  guidelines: GuidelinesService;
  conversations: ConversationsService;
  feedback: FeedbackService;
}

/** Operations callable without a bearer token. Everything else is wrapped with authed(). */
export const PUBLIC_OPERATIONS = new Set<keyof SupportAssistantService<HandlerContext>>([
  'Health',
  'Login',
  'RefreshToken',
  'Logout',
]);

/**
 * The SDK turns any non-modelled error into an opaque InternalFailure (by design, to avoid
 * leaking details). Log those here so they are diagnosable, keyed by request id.
 */
function withErrorLogging(
  service: SupportAssistantService<HandlerContext>,
): SupportAssistantService<HandlerContext> {
  // `never` input: a union of concrete operation types is assignable to it without assertions.
  type AnyOperation = Operation<never, unknown, HandlerContext>;
  const wrap =
    (name: string, op: AnyOperation): AnyOperation =>
    async (input, ctx) => {
      try {
        return await op(input, ctx);
      } catch (err) {
        if (!(err instanceof ServiceException)) {
          ctx.log.error({ err, operation: name }, 'unhandled error in operation');
          throw new InternalServerError({
            message: 'Internal server error',
            requestId: ctx.requestId,
          });
        }
        throw err;
      }
    };
  // Object.fromEntries cannot carry the per-key types back; this is the one assertion in the
  // api that re-attaches the generated service interface (same keys, each op wrapped 1:1).
  const wrapped = Object.fromEntries(
    typedEntries(service).map(([name, op]) => [name, wrap(name, op)]),
  );
  return wrapped as unknown as SupportAssistantService<HandlerContext>;
}

/** Builds the Smithy service implementation from the domain services. */
export function buildService(deps: ServiceDeps): SupportAssistantService<HandlerContext> {
  return withErrorLogging(buildOperations(deps));
}

function buildOperations(deps: ServiceDeps): SupportAssistantService<HandlerContext> {
  return {
    Health: health,
    ...authHandlers(deps.auth),
    ...companyHandlers(deps.companies),
    ...guidelineHandlers(deps.guidelines),
    ...conversationHandlers(deps.conversations),
    ...feedbackHandlers(deps.feedback),
  };
}
