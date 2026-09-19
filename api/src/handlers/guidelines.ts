import {
  type ActivateGuidelineVersion,
  type GetActiveGuidelines,
  type GetGuidelineVersion,
  type ListGuidelineVersions,
  type RetryGuidelineVersion,
  type UploadGuidelines,
} from '@app/api-server-sdk';

import { authed, must, type HandlerContext } from './context.js';
import { type GuidelinesService } from '../guidelines/service.js';

export function guidelineHandlers(guidelines: GuidelinesService) {
  const UploadGuidelinesOp: UploadGuidelines<HandlerContext> = authed(async (input, ctx) => {
    const { version } = await guidelines.upload({
      companyId: must(input.companyId, 'companyId'),
      filename: must(input.filename, 'filename'),
      fileContentType: input.fileContentType,
      expectedVersionId: input.expectedVersionId,
      body: must(input.body, 'body'),
      userId: ctx.user.id,
    });
    return { version };
  });

  const GetActiveGuidelinesOp: GetActiveGuidelines<HandlerContext> = authed((input) =>
    guidelines.getActive(must(input.companyId, 'companyId')),
  );

  const ListGuidelineVersionsOp: ListGuidelineVersions<HandlerContext> = authed(async (input) => ({
    items: await guidelines.listVersions(must(input.companyId, 'companyId')),
  }));

  const GetGuidelineVersionOp: GetGuidelineVersion<HandlerContext> = authed(async (input) => ({
    version: await guidelines.getVersion(must(input.versionId, 'versionId')),
  }));

  const RetryGuidelineVersionOp: RetryGuidelineVersion<HandlerContext> = authed(async (input) => ({
    version: await guidelines.retry(must(input.versionId, 'versionId')),
  }));

  const ActivateGuidelineVersionOp: ActivateGuidelineVersion<HandlerContext> = authed(
    async (input) => ({
      version: await guidelines.activate(must(input.versionId, 'versionId')),
    }),
  );

  return {
    UploadGuidelines: UploadGuidelinesOp,
    GetActiveGuidelines: GetActiveGuidelinesOp,
    ListGuidelineVersions: ListGuidelineVersionsOp,
    GetGuidelineVersion: GetGuidelineVersionOp,
    RetryGuidelineVersion: RetryGuidelineVersionOp,
    ActivateGuidelineVersion: ActivateGuidelineVersionOp,
  };
}
