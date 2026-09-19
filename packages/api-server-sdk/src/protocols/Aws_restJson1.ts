// smithy-typescript generated code
import {
  loadRestJsonErrorCode,
  parseJsonBody as parseBody,
  parseJsonErrorBody as parseErrorBody,
} from "@aws-sdk/core/protocols";
import {
  _json,
  isSerializableHeaderValue,
  map,
  serializeDateTime as __serializeDateTime,
  serializeFloat as __serializeFloat,
  take,
} from "@smithy/core/client";
import { collectBody, HttpRequest as __HttpRequest, HttpResponse as __HttpResponse } from "@smithy/core/protocols";
import {
  calculateBodyLength,
  expectBoolean as __expectBoolean,
  expectNonNull as __expectNonNull,
  expectObject as __expectObject,
  expectString as __expectString,
  parseBoolean as __parseBoolean,
  strictParseInt32 as __strictParseInt32,
} from "@smithy/core/serde";
import {
  acceptMatches as __acceptMatches,
  NotAcceptableException as __NotAcceptableException,
  SerializationException as __SerializationException,
  ServerSerdeContext,
  ServiceException as __BaseException,
  SmithyFrameworkException as __SmithyFrameworkException,
  UnsupportedMediaTypeException as __UnsupportedMediaTypeException,
} from "@smithy/server-common";
import type {
  Endpoint as __Endpoint,
  ResponseMetadata as __ResponseMetadata,
  SerdeContext as __SerdeContext,
} from "@smithy/types";

import {
  AiProviderError,
  ConflictError,
  GuidelinesConflictError,
  GuidelinesNotReadyError,
  InternalServerError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitedError,
  UnauthorizedError,
  UnsupportedMediaTypeError,
  ValidationException,
} from "../models/errors";
import {
  AssistantGuidance,
  Citation,
  Company,
  Conversation,
  ConversationSummary,
  Correction,
  Escalation,
  FeedbackSummary,
  GuidelineChunk,
  GuidelineVersionSummary,
  Message,
  RetrievedChunk,
  TokenSet,
  UsedCorrection,
  User,
  ValidationExceptionField,
} from "../models/models_0";
import {
  ActivateGuidelineVersionServerInput,
  ActivateGuidelineVersionServerOutput,
} from "../server/operations/ActivateGuidelineVersion";
import { CreateCompanyServerInput, CreateCompanyServerOutput } from "../server/operations/CreateCompany";
import { CreateConversationServerInput, CreateConversationServerOutput } from "../server/operations/CreateConversation";
import {
  GetActiveGuidelinesServerInput,
  GetActiveGuidelinesServerOutput,
} from "../server/operations/GetActiveGuidelines";
import { GetCompanyServerInput, GetCompanyServerOutput } from "../server/operations/GetCompany";
import { GetConversationServerInput, GetConversationServerOutput } from "../server/operations/GetConversation";
import { GetCurrentUserServerInput, GetCurrentUserServerOutput } from "../server/operations/GetCurrentUser";
import {
  GetGuidelineVersionServerInput,
  GetGuidelineVersionServerOutput,
} from "../server/operations/GetGuidelineVersion";
import { HealthServerInput, HealthServerOutput } from "../server/operations/Health";
import { ListCompaniesServerInput, ListCompaniesServerOutput } from "../server/operations/ListCompanies";
import { ListConversationsServerInput, ListConversationsServerOutput } from "../server/operations/ListConversations";
import { ListCorrectionsServerInput, ListCorrectionsServerOutput } from "../server/operations/ListCorrections";
import {
  ListGuidelineVersionsServerInput,
  ListGuidelineVersionsServerOutput,
} from "../server/operations/ListGuidelineVersions";
import { LoginServerInput, LoginServerOutput } from "../server/operations/Login";
import { LogoutServerInput, LogoutServerOutput } from "../server/operations/Logout";
import { RefreshTokenServerInput, RefreshTokenServerOutput } from "../server/operations/RefreshToken";
import {
  RetryGuidelineVersionServerInput,
  RetryGuidelineVersionServerOutput,
} from "../server/operations/RetryGuidelineVersion";
import { SendMessageServerInput, SendMessageServerOutput } from "../server/operations/SendMessage";
import { SubmitFeedbackServerInput, SubmitFeedbackServerOutput } from "../server/operations/SubmitFeedback";
import { UpdateCompanyServerInput, UpdateCompanyServerOutput } from "../server/operations/UpdateCompany";
import { UpdateCorrectionServerInput, UpdateCorrectionServerOutput } from "../server/operations/UpdateCorrection";
import { UploadGuidelinesServerInput, UploadGuidelinesServerOutput } from "../server/operations/UploadGuidelines";

export const deserializeActivateGuidelineVersionRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<ActivateGuidelineVersionServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/guideline-versions/(?<versionId>[^/]+)/activate");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.versionId = decodeURIComponent(parsedPath.groups.versionId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeCreateCompanyRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<CreateCompanyServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'description': __expectString,
    'name': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeCreateConversationRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<CreateConversationServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'companyId': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeGetActiveGuidelinesRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetActiveGuidelinesServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/companies/(?<companyId>[^/]+)/guidelines");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.companyId = decodeURIComponent(parsedPath.groups.companyId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeGetCompanyRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetCompanyServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/companies/(?<companyId>[^/]+)");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.companyId = decodeURIComponent(parsedPath.groups.companyId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeGetConversationRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetConversationServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const query = output.query
  if (query != null) {
    if (query["before"] !== undefined) {
      let queryValue: string;
      if (Array.isArray(query["before"])) {
        if (query["before"].length === 1) {
          queryValue = query["before"][0];
        }
        else {
          throw new __SerializationException();
        }
      }
      else {
        queryValue = query["before"] as string;
      }
      contents.before = queryValue;
    }
    if (query["limit"] !== undefined) {
      let queryValue: string;
      if (Array.isArray(query["limit"])) {
        if (query["limit"].length === 1) {
          queryValue = query["limit"][0];
        }
        else {
          throw new __SerializationException();
        }
      }
      else {
        queryValue = query["limit"] as string;
      }
      contents.limit = __strictParseInt32(queryValue);
    }
  }
  const pathRegex = new RegExp("/api/conversations/(?<conversationId>[^/]+)");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.conversationId = decodeURIComponent(parsedPath.groups.conversationId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeGetCurrentUserRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetCurrentUserServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined) {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  await collectBody(output.body, context);
  return contents;
};

export const deserializeGetGuidelineVersionRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<GetGuidelineVersionServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/guideline-versions/(?<versionId>[^/]+)");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.versionId = decodeURIComponent(parsedPath.groups.versionId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeHealthRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<HealthServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined) {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  await collectBody(output.body, context);
  return contents;
};

export const deserializeListCompaniesRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<ListCompaniesServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined) {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  await collectBody(output.body, context);
  return contents;
};

export const deserializeListConversationsRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<ListConversationsServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const query = output.query
  if (query != null) {
    if (query["companyId"] !== undefined) {
      let queryValue: string;
      if (Array.isArray(query["companyId"])) {
        if (query["companyId"].length === 1) {
          queryValue = query["companyId"][0];
        }
        else {
          throw new __SerializationException();
        }
      }
      else {
        queryValue = query["companyId"] as string;
      }
      contents.companyId = queryValue;
    }
    if (query["coverage"] !== undefined) {
      let queryValue: string;
      if (Array.isArray(query["coverage"])) {
        if (query["coverage"].length === 1) {
          queryValue = query["coverage"][0];
        }
        else {
          throw new __SerializationException();
        }
      }
      else {
        queryValue = query["coverage"] as string;
      }
      contents.coverage = queryValue;
    }
    if (query["cursor"] !== undefined) {
      let queryValue: string;
      if (Array.isArray(query["cursor"])) {
        if (query["cursor"].length === 1) {
          queryValue = query["cursor"][0];
        }
        else {
          throw new __SerializationException();
        }
      }
      else {
        queryValue = query["cursor"] as string;
      }
      contents.cursor = queryValue;
    }
    if (query["limit"] !== undefined) {
      let queryValue: string;
      if (Array.isArray(query["limit"])) {
        if (query["limit"].length === 1) {
          queryValue = query["limit"][0];
        }
        else {
          throw new __SerializationException();
        }
      }
      else {
        queryValue = query["limit"] as string;
      }
      contents.limit = __strictParseInt32(queryValue);
    }
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeListCorrectionsRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<ListCorrectionsServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const query = output.query
  if (query != null) {
    if (query["includeInactive"] !== undefined) {
      let queryValue: string;
      if (Array.isArray(query["includeInactive"])) {
        if (query["includeInactive"].length === 1) {
          queryValue = query["includeInactive"][0];
        }
        else {
          throw new __SerializationException();
        }
      }
      else {
        queryValue = query["includeInactive"] as string;
      }
      contents.includeInactive = __parseBoolean(queryValue);
    }
  }
  const pathRegex = new RegExp("/api/companies/(?<companyId>[^/]+)/corrections");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.companyId = decodeURIComponent(parsedPath.groups.companyId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeListGuidelineVersionsRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<ListGuidelineVersionsServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/companies/(?<companyId>[^/]+)/guidelines/versions");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.companyId = decodeURIComponent(parsedPath.groups.companyId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeLoginRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<LoginServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'password': __expectString,
    'username': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeLogoutRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<LogoutServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'refreshToken': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeRefreshTokenRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<RefreshTokenServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'refreshToken': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeRetryGuidelineVersionRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<RetryGuidelineVersionServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/guideline-versions/(?<versionId>[^/]+)/retry");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.versionId = decodeURIComponent(parsedPath.groups.versionId);
  }
  await collectBody(output.body, context);
  return contents;
};

export const deserializeSendMessageRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<SendMessageServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/conversations/(?<conversationId>[^/]+)/messages");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.conversationId = decodeURIComponent(parsedPath.groups.conversationId);
  }
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'content': __expectString,
    'kind': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeSubmitFeedbackRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<SubmitFeedbackServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/messages/(?<messageId>[^/]+)/feedback");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.messageId = decodeURIComponent(parsedPath.groups.messageId);
  }
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'correctedAnswer': __expectString,
    'rating': __expectString,
    'whatWasWrong': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeUpdateCompanyRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<UpdateCompanyServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/companies/(?<companyId>[^/]+)");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.companyId = decodeURIComponent(parsedPath.groups.companyId);
  }
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'description': __expectString,
    'name': __expectString,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeUpdateCorrectionRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<UpdateCorrectionServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/json") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
  });
  const pathRegex = new RegExp("/api/corrections/(?<correctionId>[^/]+)");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.correctionId = decodeURIComponent(parsedPath.groups.correctionId);
  }
  const data: Record<string, any> = __expectNonNull((__expectObject(await parseBody(output.body, context))), "body");
  const doc = take(data, {
    'active': __expectBoolean,
  });
  Object.assign(contents, doc);
  return contents;
};

export const deserializeUploadGuidelinesRequest = async (
  output: __HttpRequest,
  context: __SerdeContext
): Promise<UploadGuidelinesServerInput> => {
  const contentTypeHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'content-type');
  if (contentTypeHeaderKey != null) {
    const contentType = output.headers[contentTypeHeaderKey];
    if (contentType !== undefined && contentType !== "application/octet-stream") {
      throw new __UnsupportedMediaTypeException();
    };
  };
  const acceptHeaderKey: string | undefined = Object.keys(output.headers).find(key => key.toLowerCase() === 'accept');
  if (acceptHeaderKey != null) {
    const accept = output.headers[acceptHeaderKey];
    if (!__acceptMatches(accept, "application/json")) {
      throw new __NotAcceptableException();
    };
  };
  const contents: any = map({
    [_f]: [, output.headers[_xf]],
    [_fCT]: [, output.headers[_xfct]],
    [_eVI]: [, output.headers[_xev]],
  });
  const pathRegex = new RegExp("/api/companies/(?<companyId>[^/]+)/guidelines");
  const parsedPath = output.path.match(pathRegex);
  if (parsedPath?.groups !== undefined) {
    contents.companyId = decodeURIComponent(parsedPath.groups.companyId);
  }
  const data: any = await collectBody(output.body, context);
  contents.body = data;
  return contents;
};

export const serializeActivateGuidelineVersionResponse = async (
  input: ActivateGuidelineVersionServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'version': _ => se_GuidelineVersionSummary(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeCreateCompanyResponse = async (
  input: CreateCompanyServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 201
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'company': _ => se_Company(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeCreateConversationResponse = async (
  input: CreateConversationServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 201
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'conversation': _ => se_Conversation(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeGetActiveGuidelinesResponse = async (
  input: GetActiveGuidelinesServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'chunks': _ => se_GuidelineChunkList(_, context),
    'text': [],
    'version': _ => se_GuidelineVersionSummary(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeGetCompanyResponse = async (
  input: GetCompanyServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'company': _ => se_Company(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeGetConversationResponse = async (
  input: GetConversationServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'conversation': _ => se_Conversation(_, context),
    'olderCursor': [],
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeGetCurrentUserResponse = async (
  input: GetCurrentUserServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'user': _ => se_User(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeGetGuidelineVersionResponse = async (
  input: GetGuidelineVersionServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'version': _ => se_GuidelineVersionSummary(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeHealthResponse = async (
  input: HealthServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'service': [],
    'status': [],
    'time': _ => __serializeDateTime(_),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeListCompaniesResponse = async (
  input: ListCompaniesServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'items': _ => se_CompanyList(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeListConversationsResponse = async (
  input: ListConversationsServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'items': _ => se_ConversationSummaryList(_, context),
    'nextCursor': [],
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeListCorrectionsResponse = async (
  input: ListCorrectionsServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'items': _ => se_CorrectionList(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeListGuidelineVersionsResponse = async (
  input: ListGuidelineVersionsServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'items': _ => se_GuidelineVersionList(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeLoginResponse = async (
  input: LoginServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'tokens': _ => se_TokenSet(_, context),
    'user': _ => se_User(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeLogoutResponse = async (
  input: LogoutServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'revoked': [],
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeRefreshTokenResponse = async (
  input: RefreshTokenServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'tokens': _ => se_TokenSet(_, context),
    'user': _ => se_User(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeRetryGuidelineVersionResponse = async (
  input: RetryGuidelineVersionServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'version': _ => se_GuidelineVersionSummary(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeSendMessageResponse = async (
  input: SendMessageServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 201
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'assistantMessage': _ => se_Message(_, context),
    'userMessage': _ => se_Message(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeSubmitFeedbackResponse = async (
  input: SubmitFeedbackServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'correction': _ => se_Correction(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeUpdateCompanyResponse = async (
  input: UpdateCompanyServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'company': _ => se_Company(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeUpdateCorrectionResponse = async (
  input: UpdateCorrectionServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 200
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'correction': _ => se_Correction(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeUploadGuidelinesResponse = async (
  input: UploadGuidelinesServerOutput,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  let statusCode: number = 202
  let headers: any = map({}, isSerializableHeaderValue, {
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'version': _ => se_GuidelineVersionSummary(_, context),
  }));
  if (body && Object.keys(headers).map((str) => str.toLowerCase()).indexOf('content-length') === -1) {
    const length = calculateBodyLength(body);
    if (length !== undefined) {
      headers = { ...headers, 'content-length': String(length) };
    }
  }
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeFrameworkException = async (
  input: __SmithyFrameworkException,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  switch (input.name) {
    case "InternalFailure": {
      const statusCode: number = 500
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "InternalFailure",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "NotAcceptableException": {
      const statusCode: number = 406
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "NotAcceptableException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "SerializationException": {
      const statusCode: number = 400
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "SerializationException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "UnauthenticatedException": {
      const statusCode: number = 401
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "UnauthenticatedException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "UnknownOperationException": {
      const statusCode: number = 404
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "UnknownOperationException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
    case "UnsupportedMediaTypeException": {
      const statusCode: number = 415
      let headers: any = map({}, isSerializableHeaderValue, {
        'x-amzn-errortype': "UnsupportedMediaTypeException",
        'content-type': 'application/json',
      });
      let body: any;
      body = "{}";
      return new __HttpResponse({
        headers,
        body,
        statusCode,
      });
    }
  }
}

export const serializeAiProviderErrorError = async (
  input: AiProviderError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 502
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "AiProviderError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
    'provider': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeConflictErrorError = async (
  input: ConflictError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 409
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "ConflictError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeGuidelinesConflictErrorError = async (
  input: GuidelinesConflictError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 409
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "GuidelinesConflictError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'latestVersionId': [],
    'message': [],
    'uploadedAt': _ => __serializeDateTime(_),
    'uploadedBy': _ => se_User(_, context),
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeGuidelinesNotReadyErrorError = async (
  input: GuidelinesNotReadyError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 409
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "GuidelinesNotReadyError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'companyId': [],
    'latestStatus': [],
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeInternalServerErrorError = async (
  input: InternalServerError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 500
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "InternalServerError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
    'requestId': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeNotFoundErrorError = async (
  input: NotFoundError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 404
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "NotFoundError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'id': [],
    'message': [],
    'resource': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializePayloadTooLargeErrorError = async (
  input: PayloadTooLargeError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 413
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "PayloadTooLargeError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'maxBytes': [],
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeRateLimitedErrorError = async (
  input: RateLimitedError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 429
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "RateLimitedError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
    'retryAfterSeconds': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeUnauthorizedErrorError = async (
  input: UnauthorizedError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 401
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "UnauthorizedError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeUnsupportedMediaTypeErrorError = async (
  input: UnsupportedMediaTypeError,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 415
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "UnsupportedMediaTypeError",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'message': [],
    'supported': _ => se_StringList(_, context),
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

export const serializeValidationExceptionError = async (
  input: ValidationException,
  ctx: ServerSerdeContext
): Promise<__HttpResponse> => {
  const context: __SerdeContext = {
    ...ctx,
    endpoint: () => Promise.resolve({
      protocol: '',
      hostname: '',
      path: '',
    }),
  };
  const statusCode: number = 400
  let headers: any = map({}, isSerializableHeaderValue, {
    'x-amzn-errortype': "ValidationException",
    'content-type': 'application/json',
  });
  let body: any;
  body = JSON.stringify(take(input, {
    'fieldList': _ => se_ValidationExceptionFieldList(_, context),
    'message': [],
  }));
  return new __HttpResponse({
    headers,
    body,
    statusCode,
  });
};

/**
 * serializeAws_restJson1AssistantGuidance
 */
const se_AssistantGuidance = (
  input: AssistantGuidance,
  context: __SerdeContext
): any => {
  return take(input, {
    'agentDecisions': _ => se_StringList(_, context),
    'citations': _ => se_CitationList(_, context),
    'clarifications': _ => se_StringList(_, context),
    'coverage': [],
    'escalation': _ => se_Escalation(_, context),
    'handlingSteps': _ => se_StringList(_, context),
    'notes': [],
    'recommendedReply': [],
  });
}

/**
 * serializeAws_restJson1Citation
 */
const se_Citation = (
  input: Citation,
  context: __SerdeContext
): any => {
  return take(input, {
    'chunkId': [],
    'title': [],
  });
}

/**
 * serializeAws_restJson1CitationList
 */
const se_CitationList = (
  input: Citation[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_Citation(entry, context);
  });
}

/**
 * serializeAws_restJson1Company
 */
const se_Company = (
  input: Company,
  context: __SerdeContext
): any => {
  return take(input, {
    'activeGuidelines': _ => se_GuidelineVersionSummary(_, context),
    'conversationCount': [],
    'createdAt': __serializeDateTime,
    'description': [],
    'id': [],
    'latestGuidelines': _ => se_GuidelineVersionSummary(_, context),
    'name': [],
    'updatedAt': __serializeDateTime,
  });
}

/**
 * serializeAws_restJson1CompanyList
 */
const se_CompanyList = (
  input: Company[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_Company(entry, context);
  });
}

/**
 * serializeAws_restJson1Conversation
 */
const se_Conversation = (
  input: Conversation,
  context: __SerdeContext
): any => {
  return take(input, {
    'messages': _ => se_MessageList(_, context),
    'summary': _ => se_ConversationSummary(_, context),
  });
}

/**
 * serializeAws_restJson1ConversationSummary
 */
const se_ConversationSummary = (
  input: ConversationSummary,
  context: __SerdeContext
): any => {
  return take(input, {
    'companyId': [],
    'companyName': [],
    'createdAt': __serializeDateTime,
    'createdBy': _ => se_User(_, context),
    'id': [],
    'lastCoverage': [],
    'lastMessageAt': __serializeDateTime,
    'messageCount': [],
    'title': [],
  });
}

/**
 * serializeAws_restJson1ConversationSummaryList
 */
const se_ConversationSummaryList = (
  input: ConversationSummary[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_ConversationSummary(entry, context);
  });
}

/**
 * serializeAws_restJson1Correction
 */
const se_Correction = (
  input: Correction,
  context: __SerdeContext
): any => {
  return take(input, {
    'active': [],
    'companyId': [],
    'conversationId': [],
    'correctedAnswer': [],
    'createdAt': __serializeDateTime,
    'guidelineVersionId': [],
    'id': [],
    'messageId': [],
    'queryText': [],
    'rating': [],
    'user': _ => se_User(_, context),
    'whatWasWrong': [],
  });
}

/**
 * serializeAws_restJson1CorrectionList
 */
const se_CorrectionList = (
  input: Correction[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_Correction(entry, context);
  });
}

/**
 * serializeAws_restJson1Escalation
 */
const se_Escalation = (
  input: Escalation,
  context: __SerdeContext
): any => {
  return take(input, {
    'reason': [],
    'recommended': [],
    'to': [],
  });
}

/**
 * serializeAws_restJson1FeedbackSummary
 */
const se_FeedbackSummary = (
  input: FeedbackSummary,
  context: __SerdeContext
): any => {
  return take(input, {
    'correctedAnswer': [],
    'createdAt': __serializeDateTime,
    'id': [],
    'rating': [],
    'user': _ => se_User(_, context),
    'whatWasWrong': [],
  });
}

/**
 * serializeAws_restJson1FeedbackSummaryList
 */
const se_FeedbackSummaryList = (
  input: FeedbackSummary[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_FeedbackSummary(entry, context);
  });
}

/**
 * serializeAws_restJson1GuidelineChunk
 */
const se_GuidelineChunk = (
  input: GuidelineChunk,
  context: __SerdeContext
): any => {
  return take(input, {
    'content': [],
    'id': [],
    'ordinal': [],
    'title': [],
    'tokenCount': [],
  });
}

/**
 * serializeAws_restJson1GuidelineChunkList
 */
const se_GuidelineChunkList = (
  input: GuidelineChunk[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_GuidelineChunk(entry, context);
  });
}

/**
 * serializeAws_restJson1GuidelineVersionList
 */
const se_GuidelineVersionList = (
  input: GuidelineVersionSummary[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_GuidelineVersionSummary(entry, context);
  });
}

/**
 * serializeAws_restJson1GuidelineVersionSummary
 */
const se_GuidelineVersionSummary = (
  input: GuidelineVersionSummary,
  context: __SerdeContext
): any => {
  return take(input, {
    'chunksEmbedded': [],
    'chunksTotal': [],
    'companyId': [],
    'contentType': [],
    'createdAt': __serializeDateTime,
    'error': [],
    'filename': [],
    'id': [],
    'isActive': [],
    'readyAt': __serializeDateTime,
    'sizeBytes': [],
    'status': [],
    'supersededBy': [],
    'updatedAt': __serializeDateTime,
    'uploadedBy': _ => se_User(_, context),
  });
}

/**
 * serializeAws_restJson1Message
 */
const se_Message = (
  input: Message,
  context: __SerdeContext
): any => {
  return take(input, {
    'completionTokens': [],
    'content': [],
    'conversationId': [],
    'correctionsUsed': _ => se_UsedCorrectionList(_, context),
    'createdAt': __serializeDateTime,
    'createdBy': _ => se_User(_, context),
    'error': [],
    'feedback': _ => se_FeedbackSummaryList(_, context),
    'guidance': _ => se_AssistantGuidance(_, context),
    'guidelineVersionId': [],
    'id': [],
    'latencyMs': [],
    'model': [],
    'promptTokens': [],
    'retrieval': _ => se_RetrievedChunkList(_, context),
    'role': [],
    'status': [],
  });
}

/**
 * serializeAws_restJson1MessageList
 */
const se_MessageList = (
  input: Message[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_Message(entry, context);
  });
}

/**
 * serializeAws_restJson1RetrievedChunk
 */
const se_RetrievedChunk = (
  input: RetrievedChunk,
  context: __SerdeContext
): any => {
  return take(input, {
    'chunkId': [],
    'score': __serializeFloat,
    'title': [],
  });
}

/**
 * serializeAws_restJson1RetrievedChunkList
 */
const se_RetrievedChunkList = (
  input: RetrievedChunk[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_RetrievedChunk(entry, context);
  });
}

/**
 * serializeAws_restJson1StringList
 */
const se_StringList = (
  input: string[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null);
}

/**
 * serializeAws_restJson1TokenSet
 */
const se_TokenSet = (
  input: TokenSet,
  context: __SerdeContext
): any => {
  return take(input, {
    'accessExpiresAt': __serializeDateTime,
    'accessToken': [],
    'refreshExpiresAt': __serializeDateTime,
    'refreshToken': [],
  });
}

/**
 * serializeAws_restJson1UsedCorrection
 */
const se_UsedCorrection = (
  input: UsedCorrection,
  context: __SerdeContext
): any => {
  return take(input, {
    'correctionId': [],
    'score': __serializeFloat,
  });
}

/**
 * serializeAws_restJson1UsedCorrectionList
 */
const se_UsedCorrectionList = (
  input: UsedCorrection[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_UsedCorrection(entry, context);
  });
}

/**
 * serializeAws_restJson1User
 */
const se_User = (
  input: User,
  context: __SerdeContext
): any => {
  return take(input, {
    'displayName': [],
    'id': [],
    'username': [],
  });
}

/**
 * serializeAws_restJson1ValidationExceptionField
 */
const se_ValidationExceptionField = (
  input: ValidationExceptionField,
  context: __SerdeContext
): any => {
  return take(input, {
    'message': [],
    'path': [],
  });
}

/**
 * serializeAws_restJson1ValidationExceptionFieldList
 */
const se_ValidationExceptionFieldList = (
  input: ValidationExceptionField[],
  context: __SerdeContext
): any => {
  return input.filter((e: any) => e != null).map(entry => {
    return se_ValidationExceptionField(entry, context);
  });
}

const deserializeMetadata = (output: __HttpResponse): __ResponseMetadata => ({
  httpStatusCode: output.statusCode,
  requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
  extendedRequestId: output.headers["x-amz-id-2"],
  cfId: output.headers["x-amz-cf-id"],
});

// Encode Uint8Array data into string with utf-8.
const collectBodyString = (streamBody: any, context: __SerdeContext): Promise<string> => collectBody(streamBody, context).then(body => context.utf8Encoder(body))

const _eVI = "expectedVersionId";
const _f = "filename";
const _fCT = "fileContentType";
const _xev = "x-expected-version";
const _xf = "x-filename";
const _xfct = "x-file-content-type";
