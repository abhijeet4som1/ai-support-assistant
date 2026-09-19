import {
  type ListCorrections,
  type SubmitFeedback,
  type UpdateCorrection,
} from '@app/api-server-sdk';

import { authed, must, type HandlerContext } from './context.js';
import { type FeedbackService } from '../feedback/service.js';

export function feedbackHandlers(feedback: FeedbackService) {
  const SubmitFeedbackOp: SubmitFeedback<HandlerContext> = authed(async (input, ctx) => ({
    correction: await feedback.submit({
      messageId: must(input.messageId, 'messageId'),
      rating: must(input.rating, 'rating'),
      whatWasWrong: input.whatWasWrong,
      correctedAnswer: input.correctedAnswer,
      userId: ctx.user.id,
    }),
  }));

  const ListCorrectionsOp: ListCorrections<HandlerContext> = authed(async (input) => ({
    items: await feedback.listCorrections(
      must(input.companyId, 'companyId'),
      Boolean(input.includeInactive),
    ),
  }));

  const UpdateCorrectionOp: UpdateCorrection<HandlerContext> = authed(async (input) => ({
    correction: await feedback.updateCorrection(
      must(input.correctionId, 'correctionId'),
      must(input.active, 'active'),
    ),
  }));

  return {
    SubmitFeedback: SubmitFeedbackOp,
    ListCorrections: ListCorrectionsOp,
    UpdateCorrection: UpdateCorrectionOp,
  };
}
