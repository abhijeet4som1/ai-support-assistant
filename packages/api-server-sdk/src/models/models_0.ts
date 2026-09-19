// smithy-typescript generated code
import {
  CompositeCollectionValidator as __CompositeCollectionValidator,
  CompositeStructureValidator as __CompositeStructureValidator,
  CompositeValidator as __CompositeValidator,
  EnumValidator as __EnumValidator,
  LengthValidator as __LengthValidator,
  MultiConstraintValidator as __MultiConstraintValidator,
  NoOpValidator as __NoOpValidator,
  RangeValidator as __RangeValidator,
  RequiredValidator as __RequiredValidator,
  ValidationFailure as __ValidationFailure,
} from "@smithy/server-common";

import { Coverage, FeedbackRating, GuidelineStatus, MessageKind, MessageRole, MessageStatus } from "./enums";

/**
 * @public
 */
export interface ActivateGuidelineVersionInput {
  versionId: string | undefined;
}

export namespace ActivateGuidelineVersionInput {
  const memberValidators : {
    versionId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ActivateGuidelineVersionInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "versionId": {
            memberValidators["versionId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("versionId").validate(obj.versionId, `${path}/versionId`),
    ];
  }
}

/**
 * @public
 */
export interface User {
  id: string | undefined;
  username: string | undefined;
  displayName: string | undefined;
}

export namespace User {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    username?: __MultiConstraintValidator<string>,
    displayName?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: User, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "username": {
            memberValidators["username"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 200),
            ]);
            break;
          }
          case "displayName": {
            memberValidators["displayName"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 200),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("username").validate(obj.username, `${path}/username`),
      ...getMemberValidator("displayName").validate(obj.displayName, `${path}/displayName`),
    ];
  }
}

/**
 * @public
 */
export interface GuidelineVersionSummary {
  id: string | undefined;
  companyId: string | undefined;
  filename: string | undefined;
  contentType: string | undefined;
  sizeBytes: number | undefined;
  /**
   * Lifecycle of an uploaded guideline file.
   * @public
   */
  status: GuidelineStatus | undefined;

  chunksTotal: number | undefined;
  chunksEmbedded: number | undefined;
  error?: string | undefined;
  isActive: boolean | undefined;
  uploadedBy: User | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  createdAt: Date | undefined;

  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  updatedAt: Date | undefined;

  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  readyAt?: Date | undefined;

  supersededBy?: string | undefined;
}

export namespace GuidelineVersionSummary {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    companyId?: __MultiConstraintValidator<string>,
    filename?: __MultiConstraintValidator<string>,
    contentType?: __MultiConstraintValidator<string>,
    sizeBytes?: __MultiConstraintValidator<number>,
    status?: __MultiConstraintValidator<string>,
    chunksTotal?: __MultiConstraintValidator<number>,
    chunksEmbedded?: __MultiConstraintValidator<number>,
    error?: __MultiConstraintValidator<string>,
    isActive?: __MultiConstraintValidator<boolean>,
    uploadedBy?: __MultiConstraintValidator<User>,
    createdAt?: __MultiConstraintValidator<Date>,
    updatedAt?: __MultiConstraintValidator<Date>,
    readyAt?: __MultiConstraintValidator<Date>,
    supersededBy?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GuidelineVersionSummary, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "filename": {
            memberValidators["filename"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 200),
            ]);
            break;
          }
          case "contentType": {
            memberValidators["contentType"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "sizeBytes": {
            memberValidators["sizeBytes"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "status": {
            memberValidators["status"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "queued",
                "parsing",
                "chunking",
                "embedding",
                "ready",
                "failed",
                "superseded",
                ], [
                "queued",
                "parsing",
                "chunking",
                "embedding",
                "ready",
                "failed",
                "superseded",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "chunksTotal": {
            memberValidators["chunksTotal"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "chunksEmbedded": {
            memberValidators["chunksEmbedded"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "error": {
            memberValidators["error"] = new __NoOpValidator();
            break;
          }
          case "isActive": {
            memberValidators["isActive"] = new __CompositeValidator<boolean>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "uploadedBy": {
            memberValidators["uploadedBy"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
          case "createdAt": {
            memberValidators["createdAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "updatedAt": {
            memberValidators["updatedAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "readyAt": {
            memberValidators["readyAt"] = new __NoOpValidator();
            break;
          }
          case "supersededBy": {
            memberValidators["supersededBy"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
      ...getMemberValidator("filename").validate(obj.filename, `${path}/filename`),
      ...getMemberValidator("contentType").validate(obj.contentType, `${path}/contentType`),
      ...getMemberValidator("sizeBytes").validate(obj.sizeBytes, `${path}/sizeBytes`),
      ...getMemberValidator("status").validate(obj.status, `${path}/status`),
      ...getMemberValidator("chunksTotal").validate(obj.chunksTotal, `${path}/chunksTotal`),
      ...getMemberValidator("chunksEmbedded").validate(obj.chunksEmbedded, `${path}/chunksEmbedded`),
      ...getMemberValidator("error").validate(obj.error, `${path}/error`),
      ...getMemberValidator("isActive").validate(obj.isActive, `${path}/isActive`),
      ...getMemberValidator("uploadedBy").validate(obj.uploadedBy, `${path}/uploadedBy`),
      ...getMemberValidator("createdAt").validate(obj.createdAt, `${path}/createdAt`),
      ...getMemberValidator("updatedAt").validate(obj.updatedAt, `${path}/updatedAt`),
      ...getMemberValidator("readyAt").validate(obj.readyAt, `${path}/readyAt`),
      ...getMemberValidator("supersededBy").validate(obj.supersededBy, `${path}/supersededBy`),
    ];
  }
}

/**
 * @public
 */
export interface ActivateGuidelineVersionOutput {
  version: GuidelineVersionSummary | undefined;
}

export namespace ActivateGuidelineVersionOutput {
  const memberValidators : {
    version?: __MultiConstraintValidator<GuidelineVersionSummary>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ActivateGuidelineVersionOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "version": {
            memberValidators["version"] = new __CompositeStructureValidator<GuidelineVersionSummary>(
              new __CompositeValidator<GuidelineVersionSummary>([
                new __RequiredValidator(),
              ]),
              GuidelineVersionSummary.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("version").validate(obj.version, `${path}/version`),
    ];
  }
}

/**
 * Describes one specific validation failure for an input member.
 * @public
 */
export interface ValidationExceptionField {
  /**
   * A JSONPointer expression to the structure member whose value failed to satisfy the modeled constraints.
   * @public
   */
  path: string | undefined;

  /**
   * A detailed description of the validation failure.
   * @public
   */
  message: string | undefined;
}

export namespace ValidationExceptionField {
  const memberValidators : {
    path?: __MultiConstraintValidator<string>,
    message?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ValidationExceptionField, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "path": {
            memberValidators["path"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "message": {
            memberValidators["message"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("path").validate(obj.path, `${path}/path`),
      ...getMemberValidator("message").validate(obj.message, `${path}/message`),
    ];
  }
}

/**
 * @public
 */
export interface Citation {
  chunkId: string | undefined;
  title?: string | undefined;
}

export namespace Citation {
  const memberValidators : {
    chunkId?: __MultiConstraintValidator<string>,
    title?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: Citation, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "chunkId": {
            memberValidators["chunkId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "title": {
            memberValidators["title"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("chunkId").validate(obj.chunkId, `${path}/chunkId`),
      ...getMemberValidator("title").validate(obj.title, `${path}/title`),
    ];
  }
}

/**
 * @public
 */
export interface Escalation {
  recommended: boolean | undefined;
  to?: string | undefined;
  reason?: string | undefined;
}

export namespace Escalation {
  const memberValidators : {
    recommended?: __MultiConstraintValidator<boolean>,
    to?: __MultiConstraintValidator<string>,
    reason?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: Escalation, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "recommended": {
            memberValidators["recommended"] = new __CompositeValidator<boolean>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "to": {
            memberValidators["to"] = new __NoOpValidator();
            break;
          }
          case "reason": {
            memberValidators["reason"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("recommended").validate(obj.recommended, `${path}/recommended`),
      ...getMemberValidator("to").validate(obj.to, `${path}/to`),
      ...getMemberValidator("reason").validate(obj.reason, `${path}/reason`),
    ];
  }
}

/**
 * Structured guidance produced by the assistant for the agent.
 * @public
 */
export interface AssistantGuidance {
  coverage: Coverage | undefined;
  /**
   * Customer-facing draft; placeholders like [Name] are left for the agent.
   * @public
   */
  recommendedReply: string | undefined;

  /**
   * Internal steps for the agent, in order.
   * @public
   */
  handlingSteps: string[] | undefined;

  /**
   * Questions the customer must answer before the case can be resolved
   * (preferences, missing details). Optional for older messages.
   * @public
   */
  clarifications?: string[] | undefined;

  /**
   * Decisions the guidelines leave to the agent's judgement (never questions for the customer).
   * @public
   */
  agentDecisions: string[] | undefined;

  escalation: Escalation | undefined;
  citations: Citation[] | undefined;
  notes?: string | undefined;
}

export namespace AssistantGuidance {
  const memberValidators : {
    coverage?: __MultiConstraintValidator<string>,
    recommendedReply?: __MultiConstraintValidator<string>,
    handlingSteps?: __MultiConstraintValidator<Iterable<string>>,
    clarifications?: __MultiConstraintValidator<Iterable<string>>,
    agentDecisions?: __MultiConstraintValidator<Iterable<string>>,
    escalation?: __MultiConstraintValidator<Escalation>,
    citations?: __MultiConstraintValidator<Iterable<Citation>>,
    notes?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: AssistantGuidance, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "coverage": {
            memberValidators["coverage"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "covered",
                "partial",
                "not_covered",
                ], [
                "covered",
                "partial",
                "not_covered",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "recommendedReply": {
            memberValidators["recommendedReply"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "handlingSteps": {
            memberValidators["handlingSteps"] = new __CompositeCollectionValidator<string>(
              new __CompositeValidator<string[]>([
                new __RequiredValidator(),
              ]),
              new __NoOpValidator()
            );
            break;
          }
          case "clarifications": {
            memberValidators["clarifications"] = new __CompositeCollectionValidator<string>(
              new __NoOpValidator(),
              new __NoOpValidator()
            );
            break;
          }
          case "agentDecisions": {
            memberValidators["agentDecisions"] = new __CompositeCollectionValidator<string>(
              new __CompositeValidator<string[]>([
                new __RequiredValidator(),
              ]),
              new __NoOpValidator()
            );
            break;
          }
          case "escalation": {
            memberValidators["escalation"] = new __CompositeStructureValidator<Escalation>(
              new __CompositeValidator<Escalation>([
                new __RequiredValidator(),
              ]),
              Escalation.validate
            );
            break;
          }
          case "citations": {
            memberValidators["citations"] = new __CompositeCollectionValidator<Citation>(
              new __CompositeValidator<Citation[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<Citation>(
                new __NoOpValidator(),
                Citation.validate
              )
            );
            break;
          }
          case "notes": {
            memberValidators["notes"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("coverage").validate(obj.coverage, `${path}/coverage`),
      ...getMemberValidator("recommendedReply").validate(obj.recommendedReply, `${path}/recommendedReply`),
      ...getMemberValidator("handlingSteps").validate(obj.handlingSteps, `${path}/handlingSteps`),
      ...getMemberValidator("clarifications").validate(obj.clarifications, `${path}/clarifications`),
      ...getMemberValidator("agentDecisions").validate(obj.agentDecisions, `${path}/agentDecisions`),
      ...getMemberValidator("escalation").validate(obj.escalation, `${path}/escalation`),
      ...getMemberValidator("citations").validate(obj.citations, `${path}/citations`),
      ...getMemberValidator("notes").validate(obj.notes, `${path}/notes`),
    ];
  }
}

/**
 * @public
 */
export interface Company {
  id: string | undefined;
  name: string | undefined;
  description?: string | undefined;
  /**
   * Summary of the currently active (ready) guideline version, if any.
   * @public
   */
  activeGuidelines?: GuidelineVersionSummary | undefined;

  /**
   * Latest version regardless of status (may be processing / failed).
   * @public
   */
  latestGuidelines?: GuidelineVersionSummary | undefined;

  conversationCount: number | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  createdAt: Date | undefined;

  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  updatedAt: Date | undefined;
}

export namespace Company {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    name?: __MultiConstraintValidator<string>,
    description?: __MultiConstraintValidator<string>,
    activeGuidelines?: __MultiConstraintValidator<GuidelineVersionSummary>,
    latestGuidelines?: __MultiConstraintValidator<GuidelineVersionSummary>,
    conversationCount?: __MultiConstraintValidator<number>,
    createdAt?: __MultiConstraintValidator<Date>,
    updatedAt?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: Company, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "name": {
            memberValidators["name"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 200),
            ]);
            break;
          }
          case "description": {
            memberValidators["description"] = new __NoOpValidator();
            break;
          }
          case "activeGuidelines": {
            memberValidators["activeGuidelines"] = new __CompositeStructureValidator<GuidelineVersionSummary>(
              new __NoOpValidator(),
              GuidelineVersionSummary.validate
            );
            break;
          }
          case "latestGuidelines": {
            memberValidators["latestGuidelines"] = new __CompositeStructureValidator<GuidelineVersionSummary>(
              new __NoOpValidator(),
              GuidelineVersionSummary.validate
            );
            break;
          }
          case "conversationCount": {
            memberValidators["conversationCount"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "createdAt": {
            memberValidators["createdAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "updatedAt": {
            memberValidators["updatedAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("name").validate(obj.name, `${path}/name`),
      ...getMemberValidator("description").validate(obj.description, `${path}/description`),
      ...getMemberValidator("activeGuidelines").validate(obj.activeGuidelines, `${path}/activeGuidelines`),
      ...getMemberValidator("latestGuidelines").validate(obj.latestGuidelines, `${path}/latestGuidelines`),
      ...getMemberValidator("conversationCount").validate(obj.conversationCount, `${path}/conversationCount`),
      ...getMemberValidator("createdAt").validate(obj.createdAt, `${path}/createdAt`),
      ...getMemberValidator("updatedAt").validate(obj.updatedAt, `${path}/updatedAt`),
    ];
  }
}

/**
 * @public
 */
export interface UsedCorrection {
  correctionId: string | undefined;
  score: number | undefined;
}

export namespace UsedCorrection {
  const memberValidators : {
    correctionId?: __MultiConstraintValidator<string>,
    score?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: UsedCorrection, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "correctionId": {
            memberValidators["correctionId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "score": {
            memberValidators["score"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("correctionId").validate(obj.correctionId, `${path}/correctionId`),
      ...getMemberValidator("score").validate(obj.score, `${path}/score`),
    ];
  }
}

/**
 * Feedback the current or another user left on an assistant message.
 * @public
 */
export interface FeedbackSummary {
  id: string | undefined;
  rating: FeedbackRating | undefined;
  whatWasWrong?: string | undefined;
  correctedAnswer?: string | undefined;
  user: User | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  createdAt: Date | undefined;
}

export namespace FeedbackSummary {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    rating?: __MultiConstraintValidator<string>,
    whatWasWrong?: __MultiConstraintValidator<string>,
    correctedAnswer?: __MultiConstraintValidator<string>,
    user?: __MultiConstraintValidator<User>,
    createdAt?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: FeedbackSummary, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "rating": {
            memberValidators["rating"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "up",
                "down",
                ], [
                "up",
                "down",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "whatWasWrong": {
            memberValidators["whatWasWrong"] = new __NoOpValidator();
            break;
          }
          case "correctedAnswer": {
            memberValidators["correctedAnswer"] = new __NoOpValidator();
            break;
          }
          case "user": {
            memberValidators["user"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
          case "createdAt": {
            memberValidators["createdAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("rating").validate(obj.rating, `${path}/rating`),
      ...getMemberValidator("whatWasWrong").validate(obj.whatWasWrong, `${path}/whatWasWrong`),
      ...getMemberValidator("correctedAnswer").validate(obj.correctedAnswer, `${path}/correctedAnswer`),
      ...getMemberValidator("user").validate(obj.user, `${path}/user`),
      ...getMemberValidator("createdAt").validate(obj.createdAt, `${path}/createdAt`),
    ];
  }
}

/**
 * @public
 */
export interface RetrievedChunk {
  chunkId: string | undefined;
  title?: string | undefined;
  score: number | undefined;
}

export namespace RetrievedChunk {
  const memberValidators : {
    chunkId?: __MultiConstraintValidator<string>,
    title?: __MultiConstraintValidator<string>,
    score?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: RetrievedChunk, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "chunkId": {
            memberValidators["chunkId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "title": {
            memberValidators["title"] = new __NoOpValidator();
            break;
          }
          case "score": {
            memberValidators["score"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("chunkId").validate(obj.chunkId, `${path}/chunkId`),
      ...getMemberValidator("title").validate(obj.title, `${path}/title`),
      ...getMemberValidator("score").validate(obj.score, `${path}/score`),
    ];
  }
}

/**
 * @public
 */
export interface Message {
  id: string | undefined;
  conversationId: string | undefined;
  role: MessageRole | undefined;
  /**
   * Raw text for customer/instruction messages; the recommended reply for
   * assistant messages (full structure in `guidance`).
   * @public
   */
  content: string | undefined;

  status: MessageStatus | undefined;
  error?: string | undefined;
  /**
   * Structured guidance produced by the assistant for the agent.
   * @public
   */
  guidance?: AssistantGuidance | undefined;

  retrieval?: RetrievedChunk[] | undefined;
  correctionsUsed?: UsedCorrection[] | undefined;
  guidelineVersionId?: string | undefined;
  model?: string | undefined;
  promptTokens?: number | undefined;
  completionTokens?: number | undefined;
  latencyMs?: number | undefined;
  feedback?: FeedbackSummary[] | undefined;
  createdBy: User | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  createdAt: Date | undefined;
}

export namespace Message {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    conversationId?: __MultiConstraintValidator<string>,
    role?: __MultiConstraintValidator<string>,
    content?: __MultiConstraintValidator<string>,
    status?: __MultiConstraintValidator<string>,
    error?: __MultiConstraintValidator<string>,
    guidance?: __MultiConstraintValidator<AssistantGuidance>,
    retrieval?: __MultiConstraintValidator<Iterable<RetrievedChunk>>,
    correctionsUsed?: __MultiConstraintValidator<Iterable<UsedCorrection>>,
    guidelineVersionId?: __MultiConstraintValidator<string>,
    model?: __MultiConstraintValidator<string>,
    promptTokens?: __MultiConstraintValidator<number>,
    completionTokens?: __MultiConstraintValidator<number>,
    latencyMs?: __MultiConstraintValidator<number>,
    feedback?: __MultiConstraintValidator<Iterable<FeedbackSummary>>,
    createdBy?: __MultiConstraintValidator<User>,
    createdAt?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: Message, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "conversationId": {
            memberValidators["conversationId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "role": {
            memberValidators["role"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "customer",
                "instruction",
                "assistant",
                ], [
                "customer",
                "instruction",
                "assistant",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "content": {
            memberValidators["content"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "status": {
            memberValidators["status"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "ok",
                "failed",
                ], [
                "ok",
                "failed",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "error": {
            memberValidators["error"] = new __NoOpValidator();
            break;
          }
          case "guidance": {
            memberValidators["guidance"] = new __CompositeStructureValidator<AssistantGuidance>(
              new __NoOpValidator(),
              AssistantGuidance.validate
            );
            break;
          }
          case "retrieval": {
            memberValidators["retrieval"] = new __CompositeCollectionValidator<RetrievedChunk>(
              new __NoOpValidator(),
              new __CompositeStructureValidator<RetrievedChunk>(
                new __NoOpValidator(),
                RetrievedChunk.validate
              )
            );
            break;
          }
          case "correctionsUsed": {
            memberValidators["correctionsUsed"] = new __CompositeCollectionValidator<UsedCorrection>(
              new __NoOpValidator(),
              new __CompositeStructureValidator<UsedCorrection>(
                new __NoOpValidator(),
                UsedCorrection.validate
              )
            );
            break;
          }
          case "guidelineVersionId": {
            memberValidators["guidelineVersionId"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "model": {
            memberValidators["model"] = new __NoOpValidator();
            break;
          }
          case "promptTokens": {
            memberValidators["promptTokens"] = new __NoOpValidator();
            break;
          }
          case "completionTokens": {
            memberValidators["completionTokens"] = new __NoOpValidator();
            break;
          }
          case "latencyMs": {
            memberValidators["latencyMs"] = new __NoOpValidator();
            break;
          }
          case "feedback": {
            memberValidators["feedback"] = new __CompositeCollectionValidator<FeedbackSummary>(
              new __NoOpValidator(),
              new __CompositeStructureValidator<FeedbackSummary>(
                new __NoOpValidator(),
                FeedbackSummary.validate
              )
            );
            break;
          }
          case "createdBy": {
            memberValidators["createdBy"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
          case "createdAt": {
            memberValidators["createdAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("conversationId").validate(obj.conversationId, `${path}/conversationId`),
      ...getMemberValidator("role").validate(obj.role, `${path}/role`),
      ...getMemberValidator("content").validate(obj.content, `${path}/content`),
      ...getMemberValidator("status").validate(obj.status, `${path}/status`),
      ...getMemberValidator("error").validate(obj.error, `${path}/error`),
      ...getMemberValidator("guidance").validate(obj.guidance, `${path}/guidance`),
      ...getMemberValidator("retrieval").validate(obj.retrieval, `${path}/retrieval`),
      ...getMemberValidator("correctionsUsed").validate(obj.correctionsUsed, `${path}/correctionsUsed`),
      ...getMemberValidator("guidelineVersionId").validate(obj.guidelineVersionId, `${path}/guidelineVersionId`),
      ...getMemberValidator("model").validate(obj.model, `${path}/model`),
      ...getMemberValidator("promptTokens").validate(obj.promptTokens, `${path}/promptTokens`),
      ...getMemberValidator("completionTokens").validate(obj.completionTokens, `${path}/completionTokens`),
      ...getMemberValidator("latencyMs").validate(obj.latencyMs, `${path}/latencyMs`),
      ...getMemberValidator("feedback").validate(obj.feedback, `${path}/feedback`),
      ...getMemberValidator("createdBy").validate(obj.createdBy, `${path}/createdBy`),
      ...getMemberValidator("createdAt").validate(obj.createdAt, `${path}/createdAt`),
    ];
  }
}

/**
 * @public
 */
export interface ConversationSummary {
  id: string | undefined;
  companyId: string | undefined;
  companyName: string | undefined;
  title: string | undefined;
  messageCount: number | undefined;
  lastCoverage?: Coverage | undefined;
  createdBy: User | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  createdAt: Date | undefined;

  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  lastMessageAt: Date | undefined;
}

export namespace ConversationSummary {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    companyId?: __MultiConstraintValidator<string>,
    companyName?: __MultiConstraintValidator<string>,
    title?: __MultiConstraintValidator<string>,
    messageCount?: __MultiConstraintValidator<number>,
    lastCoverage?: __MultiConstraintValidator<string>,
    createdBy?: __MultiConstraintValidator<User>,
    createdAt?: __MultiConstraintValidator<Date>,
    lastMessageAt?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ConversationSummary, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "companyName": {
            memberValidators["companyName"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 200),
            ]);
            break;
          }
          case "title": {
            memberValidators["title"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "messageCount": {
            memberValidators["messageCount"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "lastCoverage": {
            memberValidators["lastCoverage"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "covered",
                "partial",
                "not_covered",
                ], [
                "covered",
                "partial",
                "not_covered",
              ]),
            ]);
            break;
          }
          case "createdBy": {
            memberValidators["createdBy"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
          case "createdAt": {
            memberValidators["createdAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "lastMessageAt": {
            memberValidators["lastMessageAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
      ...getMemberValidator("companyName").validate(obj.companyName, `${path}/companyName`),
      ...getMemberValidator("title").validate(obj.title, `${path}/title`),
      ...getMemberValidator("messageCount").validate(obj.messageCount, `${path}/messageCount`),
      ...getMemberValidator("lastCoverage").validate(obj.lastCoverage, `${path}/lastCoverage`),
      ...getMemberValidator("createdBy").validate(obj.createdBy, `${path}/createdBy`),
      ...getMemberValidator("createdAt").validate(obj.createdAt, `${path}/createdAt`),
      ...getMemberValidator("lastMessageAt").validate(obj.lastMessageAt, `${path}/lastMessageAt`),
    ];
  }
}

/**
 * @public
 */
export interface Conversation {
  summary: ConversationSummary | undefined;
  messages: Message[] | undefined;
}

export namespace Conversation {
  const memberValidators : {
    summary?: __MultiConstraintValidator<ConversationSummary>,
    messages?: __MultiConstraintValidator<Iterable<Message>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: Conversation, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "summary": {
            memberValidators["summary"] = new __CompositeStructureValidator<ConversationSummary>(
              new __CompositeValidator<ConversationSummary>([
                new __RequiredValidator(),
              ]),
              ConversationSummary.validate
            );
            break;
          }
          case "messages": {
            memberValidators["messages"] = new __CompositeCollectionValidator<Message>(
              new __CompositeValidator<Message[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<Message>(
                new __NoOpValidator(),
                Message.validate
              )
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("summary").validate(obj.summary, `${path}/summary`),
      ...getMemberValidator("messages").validate(obj.messages, `${path}/messages`),
    ];
  }
}

/**
 * A stored piece of feedback, used as a few-shot correction for future answers.
 * @public
 */
export interface Correction {
  id: string | undefined;
  companyId: string | undefined;
  conversationId: string | undefined;
  messageId: string | undefined;
  rating: FeedbackRating | undefined;
  /**
   * The customer message that led to the flagged answer.
   * @public
   */
  queryText: string | undefined;

  whatWasWrong?: string | undefined;
  correctedAnswer?: string | undefined;
  guidelineVersionId: string | undefined;
  /**
   * Inactive corrections are not retrieved (e.g. tied to replaced guidelines).
   * @public
   */
  active: boolean | undefined;

  user: User | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  createdAt: Date | undefined;
}

export namespace Correction {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    companyId?: __MultiConstraintValidator<string>,
    conversationId?: __MultiConstraintValidator<string>,
    messageId?: __MultiConstraintValidator<string>,
    rating?: __MultiConstraintValidator<string>,
    queryText?: __MultiConstraintValidator<string>,
    whatWasWrong?: __MultiConstraintValidator<string>,
    correctedAnswer?: __MultiConstraintValidator<string>,
    guidelineVersionId?: __MultiConstraintValidator<string>,
    active?: __MultiConstraintValidator<boolean>,
    user?: __MultiConstraintValidator<User>,
    createdAt?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: Correction, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "conversationId": {
            memberValidators["conversationId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "messageId": {
            memberValidators["messageId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "rating": {
            memberValidators["rating"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "up",
                "down",
                ], [
                "up",
                "down",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "queryText": {
            memberValidators["queryText"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "whatWasWrong": {
            memberValidators["whatWasWrong"] = new __NoOpValidator();
            break;
          }
          case "correctedAnswer": {
            memberValidators["correctedAnswer"] = new __NoOpValidator();
            break;
          }
          case "guidelineVersionId": {
            memberValidators["guidelineVersionId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "active": {
            memberValidators["active"] = new __CompositeValidator<boolean>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "user": {
            memberValidators["user"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
          case "createdAt": {
            memberValidators["createdAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
      ...getMemberValidator("conversationId").validate(obj.conversationId, `${path}/conversationId`),
      ...getMemberValidator("messageId").validate(obj.messageId, `${path}/messageId`),
      ...getMemberValidator("rating").validate(obj.rating, `${path}/rating`),
      ...getMemberValidator("queryText").validate(obj.queryText, `${path}/queryText`),
      ...getMemberValidator("whatWasWrong").validate(obj.whatWasWrong, `${path}/whatWasWrong`),
      ...getMemberValidator("correctedAnswer").validate(obj.correctedAnswer, `${path}/correctedAnswer`),
      ...getMemberValidator("guidelineVersionId").validate(obj.guidelineVersionId, `${path}/guidelineVersionId`),
      ...getMemberValidator("active").validate(obj.active, `${path}/active`),
      ...getMemberValidator("user").validate(obj.user, `${path}/user`),
      ...getMemberValidator("createdAt").validate(obj.createdAt, `${path}/createdAt`),
    ];
  }
}

/**
 * @public
 */
export interface CreateCompanyInput {
  name: string | undefined;
  description?: string | undefined;
}

export namespace CreateCompanyInput {
  const memberValidators : {
    name?: __MultiConstraintValidator<string>,
    description?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: CreateCompanyInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "name": {
            memberValidators["name"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 200),
            ]);
            break;
          }
          case "description": {
            memberValidators["description"] = new __CompositeValidator<string>([
              new __LengthValidator(undefined, 1000),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("name").validate(obj.name, `${path}/name`),
      ...getMemberValidator("description").validate(obj.description, `${path}/description`),
    ];
  }
}

/**
 * @public
 */
export interface CreateCompanyOutput {
  company: Company | undefined;
}

export namespace CreateCompanyOutput {
  const memberValidators : {
    company?: __MultiConstraintValidator<Company>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: CreateCompanyOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "company": {
            memberValidators["company"] = new __CompositeStructureValidator<Company>(
              new __CompositeValidator<Company>([
                new __RequiredValidator(),
              ]),
              Company.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("company").validate(obj.company, `${path}/company`),
    ];
  }
}

/**
 * @public
 */
export interface CreateConversationInput {
  companyId: string | undefined;
}

export namespace CreateConversationInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: CreateConversationInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
    ];
  }
}

/**
 * @public
 */
export interface CreateConversationOutput {
  conversation: Conversation | undefined;
}

export namespace CreateConversationOutput {
  const memberValidators : {
    conversation?: __MultiConstraintValidator<Conversation>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: CreateConversationOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "conversation": {
            memberValidators["conversation"] = new __CompositeStructureValidator<Conversation>(
              new __CompositeValidator<Conversation>([
                new __RequiredValidator(),
              ]),
              Conversation.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("conversation").validate(obj.conversation, `${path}/conversation`),
    ];
  }
}

/**
 * @public
 */
export interface GetActiveGuidelinesInput {
  companyId: string | undefined;
}

export namespace GetActiveGuidelinesInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetActiveGuidelinesInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
    ];
  }
}

/**
 * @public
 */
export interface GuidelineChunk {
  id: string | undefined;
  ordinal: number | undefined;
  title?: string | undefined;
  content: string | undefined;
  tokenCount: number | undefined;
}

export namespace GuidelineChunk {
  const memberValidators : {
    id?: __MultiConstraintValidator<string>,
    ordinal?: __MultiConstraintValidator<number>,
    title?: __MultiConstraintValidator<string>,
    content?: __MultiConstraintValidator<string>,
    tokenCount?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GuidelineChunk, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "id": {
            memberValidators["id"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "ordinal": {
            memberValidators["ordinal"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "title": {
            memberValidators["title"] = new __NoOpValidator();
            break;
          }
          case "content": {
            memberValidators["content"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "tokenCount": {
            memberValidators["tokenCount"] = new __CompositeValidator<number>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("id").validate(obj.id, `${path}/id`),
      ...getMemberValidator("ordinal").validate(obj.ordinal, `${path}/ordinal`),
      ...getMemberValidator("title").validate(obj.title, `${path}/title`),
      ...getMemberValidator("content").validate(obj.content, `${path}/content`),
      ...getMemberValidator("tokenCount").validate(obj.tokenCount, `${path}/tokenCount`),
    ];
  }
}

/**
 * @public
 */
export interface GetActiveGuidelinesOutput {
  version: GuidelineVersionSummary | undefined;
  text: string | undefined;
  chunks: GuidelineChunk[] | undefined;
}

export namespace GetActiveGuidelinesOutput {
  const memberValidators : {
    version?: __MultiConstraintValidator<GuidelineVersionSummary>,
    text?: __MultiConstraintValidator<string>,
    chunks?: __MultiConstraintValidator<Iterable<GuidelineChunk>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetActiveGuidelinesOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "version": {
            memberValidators["version"] = new __CompositeStructureValidator<GuidelineVersionSummary>(
              new __CompositeValidator<GuidelineVersionSummary>([
                new __RequiredValidator(),
              ]),
              GuidelineVersionSummary.validate
            );
            break;
          }
          case "text": {
            memberValidators["text"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "chunks": {
            memberValidators["chunks"] = new __CompositeCollectionValidator<GuidelineChunk>(
              new __CompositeValidator<GuidelineChunk[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<GuidelineChunk>(
                new __NoOpValidator(),
                GuidelineChunk.validate
              )
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("version").validate(obj.version, `${path}/version`),
      ...getMemberValidator("text").validate(obj.text, `${path}/text`),
      ...getMemberValidator("chunks").validate(obj.chunks, `${path}/chunks`),
    ];
  }
}

/**
 * @public
 */
export interface GetCompanyInput {
  companyId: string | undefined;
}

export namespace GetCompanyInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetCompanyInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
    ];
  }
}

/**
 * @public
 */
export interface GetCompanyOutput {
  company: Company | undefined;
}

export namespace GetCompanyOutput {
  const memberValidators : {
    company?: __MultiConstraintValidator<Company>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetCompanyOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "company": {
            memberValidators["company"] = new __CompositeStructureValidator<Company>(
              new __CompositeValidator<Company>([
                new __RequiredValidator(),
              ]),
              Company.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("company").validate(obj.company, `${path}/company`),
    ];
  }
}

/**
 * @public
 */
export interface GetConversationInput {
  conversationId: string | undefined;
  /**
   * Load messages older than this cursor (from a previous page's `olderCursor`).
   * @public
   */
  before?: string | undefined;

  /**
   * Messages per page (default 50).
   * @public
   */
  limit?: number | undefined;
}

export namespace GetConversationInput {
  const memberValidators : {
    conversationId?: __MultiConstraintValidator<string>,
    before?: __MultiConstraintValidator<string>,
    limit?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetConversationInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "conversationId": {
            memberValidators["conversationId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "before": {
            memberValidators["before"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 512),
            ]);
            break;
          }
          case "limit": {
            memberValidators["limit"] = new __CompositeValidator<number>([
              new __RangeValidator(1, 100),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("conversationId").validate(obj.conversationId, `${path}/conversationId`),
      ...getMemberValidator("before").validate(obj.before, `${path}/before`),
      ...getMemberValidator("limit").validate(obj.limit, `${path}/limit`),
    ];
  }
}

/**
 * @public
 */
export interface GetConversationOutput {
  conversation: Conversation | undefined;
  /**
   * Present when older messages exist; pass it as `before` to load them.
   * @public
   */
  olderCursor?: string | undefined;
}

export namespace GetConversationOutput {
  const memberValidators : {
    conversation?: __MultiConstraintValidator<Conversation>,
    olderCursor?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetConversationOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "conversation": {
            memberValidators["conversation"] = new __CompositeStructureValidator<Conversation>(
              new __CompositeValidator<Conversation>([
                new __RequiredValidator(),
              ]),
              Conversation.validate
            );
            break;
          }
          case "olderCursor": {
            memberValidators["olderCursor"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 512),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("conversation").validate(obj.conversation, `${path}/conversation`),
      ...getMemberValidator("olderCursor").validate(obj.olderCursor, `${path}/olderCursor`),
    ];
  }
}

/**
 * @public
 */
export interface GetCurrentUserOutput {
  user: User | undefined;
}

export namespace GetCurrentUserOutput {
  const memberValidators : {
    user?: __MultiConstraintValidator<User>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetCurrentUserOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "user": {
            memberValidators["user"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("user").validate(obj.user, `${path}/user`),
    ];
  }
}

/**
 * @public
 */
export interface GetGuidelineVersionInput {
  versionId: string | undefined;
}

export namespace GetGuidelineVersionInput {
  const memberValidators : {
    versionId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetGuidelineVersionInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "versionId": {
            memberValidators["versionId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("versionId").validate(obj.versionId, `${path}/versionId`),
    ];
  }
}

/**
 * @public
 */
export interface GetGuidelineVersionOutput {
  version: GuidelineVersionSummary | undefined;
}

export namespace GetGuidelineVersionOutput {
  const memberValidators : {
    version?: __MultiConstraintValidator<GuidelineVersionSummary>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: GetGuidelineVersionOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "version": {
            memberValidators["version"] = new __CompositeStructureValidator<GuidelineVersionSummary>(
              new __CompositeValidator<GuidelineVersionSummary>([
                new __RequiredValidator(),
              ]),
              GuidelineVersionSummary.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("version").validate(obj.version, `${path}/version`),
    ];
  }
}

/**
 * @public
 */
export interface HealthOutput {
  status: string | undefined;
  service: string | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  time: Date | undefined;
}

export namespace HealthOutput {
  const memberValidators : {
    status?: __MultiConstraintValidator<string>,
    service?: __MultiConstraintValidator<string>,
    time?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: HealthOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "status": {
            memberValidators["status"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "service": {
            memberValidators["service"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "time": {
            memberValidators["time"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("status").validate(obj.status, `${path}/status`),
      ...getMemberValidator("service").validate(obj.service, `${path}/service`),
      ...getMemberValidator("time").validate(obj.time, `${path}/time`),
    ];
  }
}

/**
 * @public
 */
export interface ListCompaniesOutput {
  items: Company[] | undefined;
}

export namespace ListCompaniesOutput {
  const memberValidators : {
    items?: __MultiConstraintValidator<Iterable<Company>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ListCompaniesOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "items": {
            memberValidators["items"] = new __CompositeCollectionValidator<Company>(
              new __CompositeValidator<Company[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<Company>(
                new __NoOpValidator(),
                Company.validate
              )
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("items").validate(obj.items, `${path}/items`),
    ];
  }
}

/**
 * @public
 */
export interface ListConversationsInput {
  companyId?: string | undefined;
  coverage?: Coverage | undefined;
  /**
   * Cursor for paginated list operations (opaque to clients).
   * @public
   */
  cursor?: string | undefined;

  limit?: number | undefined;
}

export namespace ListConversationsInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
    coverage?: __MultiConstraintValidator<string>,
    cursor?: __MultiConstraintValidator<string>,
    limit?: __MultiConstraintValidator<number>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ListConversationsInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "coverage": {
            memberValidators["coverage"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "covered",
                "partial",
                "not_covered",
                ], [
                "covered",
                "partial",
                "not_covered",
              ]),
            ]);
            break;
          }
          case "cursor": {
            memberValidators["cursor"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 512),
            ]);
            break;
          }
          case "limit": {
            memberValidators["limit"] = new __CompositeValidator<number>([
              new __RangeValidator(1, 100),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
      ...getMemberValidator("coverage").validate(obj.coverage, `${path}/coverage`),
      ...getMemberValidator("cursor").validate(obj.cursor, `${path}/cursor`),
      ...getMemberValidator("limit").validate(obj.limit, `${path}/limit`),
    ];
  }
}

/**
 * @public
 */
export interface ListConversationsOutput {
  items: ConversationSummary[] | undefined;
  /**
   * Cursor for paginated list operations (opaque to clients).
   * @public
   */
  nextCursor?: string | undefined;
}

export namespace ListConversationsOutput {
  const memberValidators : {
    items?: __MultiConstraintValidator<Iterable<ConversationSummary>>,
    nextCursor?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ListConversationsOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "items": {
            memberValidators["items"] = new __CompositeCollectionValidator<ConversationSummary>(
              new __CompositeValidator<ConversationSummary[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<ConversationSummary>(
                new __NoOpValidator(),
                ConversationSummary.validate
              )
            );
            break;
          }
          case "nextCursor": {
            memberValidators["nextCursor"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 512),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("items").validate(obj.items, `${path}/items`),
      ...getMemberValidator("nextCursor").validate(obj.nextCursor, `${path}/nextCursor`),
    ];
  }
}

/**
 * @public
 */
export interface ListCorrectionsInput {
  companyId: string | undefined;
  includeInactive?: boolean | undefined;
}

export namespace ListCorrectionsInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
    includeInactive?: __MultiConstraintValidator<boolean>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ListCorrectionsInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "includeInactive": {
            memberValidators["includeInactive"] = new __NoOpValidator();
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
      ...getMemberValidator("includeInactive").validate(obj.includeInactive, `${path}/includeInactive`),
    ];
  }
}

/**
 * @public
 */
export interface ListCorrectionsOutput {
  items: Correction[] | undefined;
}

export namespace ListCorrectionsOutput {
  const memberValidators : {
    items?: __MultiConstraintValidator<Iterable<Correction>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ListCorrectionsOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "items": {
            memberValidators["items"] = new __CompositeCollectionValidator<Correction>(
              new __CompositeValidator<Correction[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<Correction>(
                new __NoOpValidator(),
                Correction.validate
              )
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("items").validate(obj.items, `${path}/items`),
    ];
  }
}

/**
 * @public
 */
export interface ListGuidelineVersionsInput {
  companyId: string | undefined;
}

export namespace ListGuidelineVersionsInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ListGuidelineVersionsInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
    ];
  }
}

/**
 * @public
 */
export interface ListGuidelineVersionsOutput {
  items: GuidelineVersionSummary[] | undefined;
}

export namespace ListGuidelineVersionsOutput {
  const memberValidators : {
    items?: __MultiConstraintValidator<Iterable<GuidelineVersionSummary>>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: ListGuidelineVersionsOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "items": {
            memberValidators["items"] = new __CompositeCollectionValidator<GuidelineVersionSummary>(
              new __CompositeValidator<GuidelineVersionSummary[]>([
                new __RequiredValidator(),
              ]),
              new __CompositeStructureValidator<GuidelineVersionSummary>(
                new __NoOpValidator(),
                GuidelineVersionSummary.validate
              )
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("items").validate(obj.items, `${path}/items`),
    ];
  }
}

/**
 * @public
 */
export interface LoginInput {
  username: string | undefined;
  password: string | undefined;
}

export namespace LoginInput {
  const memberValidators : {
    username?: __MultiConstraintValidator<string>,
    password?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: LoginInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "username": {
            memberValidators["username"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 100),
            ]);
            break;
          }
          case "password": {
            memberValidators["password"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 200),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("username").validate(obj.username, `${path}/username`),
      ...getMemberValidator("password").validate(obj.password, `${path}/password`),
    ];
  }
}

/**
 * Short-lived access token (JWT, sent as Bearer) plus a long-lived, single-use refresh token.
 * Reusing a rotated refresh token revokes the whole session family.
 * @public
 */
export interface TokenSet {
  accessToken: string | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  accessExpiresAt: Date | undefined;

  refreshToken: string | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  refreshExpiresAt: Date | undefined;
}

export namespace TokenSet {
  const memberValidators : {
    accessToken?: __MultiConstraintValidator<string>,
    accessExpiresAt?: __MultiConstraintValidator<Date>,
    refreshToken?: __MultiConstraintValidator<string>,
    refreshExpiresAt?: __MultiConstraintValidator<Date>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: TokenSet, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "accessToken": {
            memberValidators["accessToken"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "accessExpiresAt": {
            memberValidators["accessExpiresAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "refreshToken": {
            memberValidators["refreshToken"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
            ]);
            break;
          }
          case "refreshExpiresAt": {
            memberValidators["refreshExpiresAt"] = new __CompositeValidator<Date>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("accessToken").validate(obj.accessToken, `${path}/accessToken`),
      ...getMemberValidator("accessExpiresAt").validate(obj.accessExpiresAt, `${path}/accessExpiresAt`),
      ...getMemberValidator("refreshToken").validate(obj.refreshToken, `${path}/refreshToken`),
      ...getMemberValidator("refreshExpiresAt").validate(obj.refreshExpiresAt, `${path}/refreshExpiresAt`),
    ];
  }
}

/**
 * @public
 */
export interface LoginOutput {
  /**
   * Short-lived access token (JWT, sent as Bearer) plus a long-lived, single-use refresh token.
   * Reusing a rotated refresh token revokes the whole session family.
   * @public
   */
  tokens: TokenSet | undefined;

  user: User | undefined;
}

export namespace LoginOutput {
  const memberValidators : {
    tokens?: __MultiConstraintValidator<TokenSet>,
    user?: __MultiConstraintValidator<User>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: LoginOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "tokens": {
            memberValidators["tokens"] = new __CompositeStructureValidator<TokenSet>(
              new __CompositeValidator<TokenSet>([
                new __RequiredValidator(),
              ]),
              TokenSet.validate
            );
            break;
          }
          case "user": {
            memberValidators["user"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("tokens").validate(obj.tokens, `${path}/tokens`),
      ...getMemberValidator("user").validate(obj.user, `${path}/user`),
    ];
  }
}

/**
 * @public
 */
export interface LogoutInput {
  refreshToken: string | undefined;
}

export namespace LogoutInput {
  const memberValidators : {
    refreshToken?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: LogoutInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "refreshToken": {
            memberValidators["refreshToken"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 512),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("refreshToken").validate(obj.refreshToken, `${path}/refreshToken`),
    ];
  }
}

/**
 * @public
 */
export interface LogoutOutput {
  revoked: boolean | undefined;
}

export namespace LogoutOutput {
  const memberValidators : {
    revoked?: __MultiConstraintValidator<boolean>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: LogoutOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "revoked": {
            memberValidators["revoked"] = new __CompositeValidator<boolean>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("revoked").validate(obj.revoked, `${path}/revoked`),
    ];
  }
}

/**
 * @public
 */
export interface RefreshTokenInput {
  refreshToken: string | undefined;
}

export namespace RefreshTokenInput {
  const memberValidators : {
    refreshToken?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: RefreshTokenInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "refreshToken": {
            memberValidators["refreshToken"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 512),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("refreshToken").validate(obj.refreshToken, `${path}/refreshToken`),
    ];
  }
}

/**
 * @public
 */
export interface RefreshTokenOutput {
  /**
   * Short-lived access token (JWT, sent as Bearer) plus a long-lived, single-use refresh token.
   * Reusing a rotated refresh token revokes the whole session family.
   * @public
   */
  tokens: TokenSet | undefined;

  user: User | undefined;
}

export namespace RefreshTokenOutput {
  const memberValidators : {
    tokens?: __MultiConstraintValidator<TokenSet>,
    user?: __MultiConstraintValidator<User>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: RefreshTokenOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "tokens": {
            memberValidators["tokens"] = new __CompositeStructureValidator<TokenSet>(
              new __CompositeValidator<TokenSet>([
                new __RequiredValidator(),
              ]),
              TokenSet.validate
            );
            break;
          }
          case "user": {
            memberValidators["user"] = new __CompositeStructureValidator<User>(
              new __CompositeValidator<User>([
                new __RequiredValidator(),
              ]),
              User.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("tokens").validate(obj.tokens, `${path}/tokens`),
      ...getMemberValidator("user").validate(obj.user, `${path}/user`),
    ];
  }
}

/**
 * @public
 */
export interface RetryGuidelineVersionInput {
  versionId: string | undefined;
}

export namespace RetryGuidelineVersionInput {
  const memberValidators : {
    versionId?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: RetryGuidelineVersionInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "versionId": {
            memberValidators["versionId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("versionId").validate(obj.versionId, `${path}/versionId`),
    ];
  }
}

/**
 * @public
 */
export interface RetryGuidelineVersionOutput {
  version: GuidelineVersionSummary | undefined;
}

export namespace RetryGuidelineVersionOutput {
  const memberValidators : {
    version?: __MultiConstraintValidator<GuidelineVersionSummary>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: RetryGuidelineVersionOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "version": {
            memberValidators["version"] = new __CompositeStructureValidator<GuidelineVersionSummary>(
              new __CompositeValidator<GuidelineVersionSummary>([
                new __RequiredValidator(),
              ]),
              GuidelineVersionSummary.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("version").validate(obj.version, `${path}/version`),
    ];
  }
}

/**
 * @public
 */
export interface SendMessageInput {
  conversationId: string | undefined;
  kind: MessageKind | undefined;
  content: string | undefined;
}

export namespace SendMessageInput {
  const memberValidators : {
    conversationId?: __MultiConstraintValidator<string>,
    kind?: __MultiConstraintValidator<string>,
    content?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: SendMessageInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "conversationId": {
            memberValidators["conversationId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "kind": {
            memberValidators["kind"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "customer",
                "instruction",
                ], [
                "customer",
                "instruction",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "content": {
            memberValidators["content"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 20000),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("conversationId").validate(obj.conversationId, `${path}/conversationId`),
      ...getMemberValidator("kind").validate(obj.kind, `${path}/kind`),
      ...getMemberValidator("content").validate(obj.content, `${path}/content`),
    ];
  }
}

/**
 * @public
 */
export interface SendMessageOutput {
  userMessage: Message | undefined;
  assistantMessage: Message | undefined;
}

export namespace SendMessageOutput {
  const memberValidators : {
    userMessage?: __MultiConstraintValidator<Message>,
    assistantMessage?: __MultiConstraintValidator<Message>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: SendMessageOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "userMessage": {
            memberValidators["userMessage"] = new __CompositeStructureValidator<Message>(
              new __CompositeValidator<Message>([
                new __RequiredValidator(),
              ]),
              Message.validate
            );
            break;
          }
          case "assistantMessage": {
            memberValidators["assistantMessage"] = new __CompositeStructureValidator<Message>(
              new __CompositeValidator<Message>([
                new __RequiredValidator(),
              ]),
              Message.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("userMessage").validate(obj.userMessage, `${path}/userMessage`),
      ...getMemberValidator("assistantMessage").validate(obj.assistantMessage, `${path}/assistantMessage`),
    ];
  }
}

/**
 * @public
 */
export interface SubmitFeedbackInput {
  messageId: string | undefined;
  rating: FeedbackRating | undefined;
  whatWasWrong?: string | undefined;
  correctedAnswer?: string | undefined;
}

export namespace SubmitFeedbackInput {
  const memberValidators : {
    messageId?: __MultiConstraintValidator<string>,
    rating?: __MultiConstraintValidator<string>,
    whatWasWrong?: __MultiConstraintValidator<string>,
    correctedAnswer?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: SubmitFeedbackInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "messageId": {
            memberValidators["messageId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "rating": {
            memberValidators["rating"] = new __CompositeValidator<string>([
              new __EnumValidator([
                "up",
                "down",
                ], [
                "up",
                "down",
              ]),
              new __RequiredValidator(),
            ]);
            break;
          }
          case "whatWasWrong": {
            memberValidators["whatWasWrong"] = new __CompositeValidator<string>([
              new __LengthValidator(undefined, 5000),
            ]);
            break;
          }
          case "correctedAnswer": {
            memberValidators["correctedAnswer"] = new __CompositeValidator<string>([
              new __LengthValidator(undefined, 20000),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("messageId").validate(obj.messageId, `${path}/messageId`),
      ...getMemberValidator("rating").validate(obj.rating, `${path}/rating`),
      ...getMemberValidator("whatWasWrong").validate(obj.whatWasWrong, `${path}/whatWasWrong`),
      ...getMemberValidator("correctedAnswer").validate(obj.correctedAnswer, `${path}/correctedAnswer`),
    ];
  }
}

/**
 * @public
 */
export interface SubmitFeedbackOutput {
  /**
   * A stored piece of feedback, used as a few-shot correction for future answers.
   * @public
   */
  correction: Correction | undefined;
}

export namespace SubmitFeedbackOutput {
  const memberValidators : {
    correction?: __MultiConstraintValidator<Correction>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: SubmitFeedbackOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "correction": {
            memberValidators["correction"] = new __CompositeStructureValidator<Correction>(
              new __CompositeValidator<Correction>([
                new __RequiredValidator(),
              ]),
              Correction.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("correction").validate(obj.correction, `${path}/correction`),
    ];
  }
}

/**
 * @public
 */
export interface UpdateCompanyInput {
  companyId: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
}

export namespace UpdateCompanyInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
    name?: __MultiConstraintValidator<string>,
    description?: __MultiConstraintValidator<string>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: UpdateCompanyInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "name": {
            memberValidators["name"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 200),
            ]);
            break;
          }
          case "description": {
            memberValidators["description"] = new __CompositeValidator<string>([
              new __LengthValidator(undefined, 1000),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
      ...getMemberValidator("name").validate(obj.name, `${path}/name`),
      ...getMemberValidator("description").validate(obj.description, `${path}/description`),
    ];
  }
}

/**
 * @public
 */
export interface UpdateCompanyOutput {
  company: Company | undefined;
}

export namespace UpdateCompanyOutput {
  const memberValidators : {
    company?: __MultiConstraintValidator<Company>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: UpdateCompanyOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "company": {
            memberValidators["company"] = new __CompositeStructureValidator<Company>(
              new __CompositeValidator<Company>([
                new __RequiredValidator(),
              ]),
              Company.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("company").validate(obj.company, `${path}/company`),
    ];
  }
}

/**
 * @public
 */
export interface UpdateCorrectionInput {
  correctionId: string | undefined;
  active: boolean | undefined;
}

export namespace UpdateCorrectionInput {
  const memberValidators : {
    correctionId?: __MultiConstraintValidator<string>,
    active?: __MultiConstraintValidator<boolean>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: UpdateCorrectionInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "correctionId": {
            memberValidators["correctionId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "active": {
            memberValidators["active"] = new __CompositeValidator<boolean>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("correctionId").validate(obj.correctionId, `${path}/correctionId`),
      ...getMemberValidator("active").validate(obj.active, `${path}/active`),
    ];
  }
}

/**
 * @public
 */
export interface UpdateCorrectionOutput {
  /**
   * A stored piece of feedback, used as a few-shot correction for future answers.
   * @public
   */
  correction: Correction | undefined;
}

export namespace UpdateCorrectionOutput {
  const memberValidators : {
    correction?: __MultiConstraintValidator<Correction>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: UpdateCorrectionOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "correction": {
            memberValidators["correction"] = new __CompositeStructureValidator<Correction>(
              new __CompositeValidator<Correction>([
                new __RequiredValidator(),
              ]),
              Correction.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("correction").validate(obj.correction, `${path}/correction`),
    ];
  }
}

/**
 * @public
 */
export interface UploadGuidelinesInput {
  companyId: string | undefined;
  /**
   * Original file name (extension is used to pick the parser).
   * @public
   */
  filename: string | undefined;

  /**
   * Original MIME type as reported by the browser, if known.
   * @public
   */
  fileContentType?: string | undefined;

  /**
   * Id of the latest guideline version the client displayed. If a newer
   * version exists the upload is rejected with GuidelinesConflictError.
   * @public
   */
  expectedVersionId?: string | undefined;

  /**
   * Raw uploaded guideline file bytes.
   * @public
   */
  body: Uint8Array | undefined;
}

export namespace UploadGuidelinesInput {
  const memberValidators : {
    companyId?: __MultiConstraintValidator<string>,
    filename?: __MultiConstraintValidator<string>,
    fileContentType?: __MultiConstraintValidator<string>,
    expectedVersionId?: __MultiConstraintValidator<string>,
    body?: __MultiConstraintValidator<Uint8Array>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: UploadGuidelinesInput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "companyId": {
            memberValidators["companyId"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "filename": {
            memberValidators["filename"] = new __CompositeValidator<string>([
              new __RequiredValidator(),
              new __LengthValidator(1, 255),
            ]);
            break;
          }
          case "fileContentType": {
            memberValidators["fileContentType"] = new __NoOpValidator();
            break;
          }
          case "expectedVersionId": {
            memberValidators["expectedVersionId"] = new __CompositeValidator<string>([
              new __LengthValidator(1, 64),
            ]);
            break;
          }
          case "body": {
            memberValidators["body"] = new __CompositeValidator<Uint8Array>([
              new __RequiredValidator(),
            ]);
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("companyId").validate(obj.companyId, `${path}/companyId`),
      ...getMemberValidator("filename").validate(obj.filename, `${path}/filename`),
      ...getMemberValidator("fileContentType").validate(obj.fileContentType, `${path}/fileContentType`),
      ...getMemberValidator("expectedVersionId").validate(obj.expectedVersionId, `${path}/expectedVersionId`),
      ...getMemberValidator("body").validate(obj.body, `${path}/body`),
    ];
  }
}

/**
 * @public
 */
export interface UploadGuidelinesOutput {
  version: GuidelineVersionSummary | undefined;
}

export namespace UploadGuidelinesOutput {
  const memberValidators : {
    version?: __MultiConstraintValidator<GuidelineVersionSummary>,
  } = {};
  /**
   * @internal
   */
  export const validate = (obj: UploadGuidelinesOutput, path: string = ""): __ValidationFailure[] => {
    function getMemberValidator<T extends keyof typeof memberValidators>(member: T): NonNullable<typeof memberValidators[T]> {
      if (memberValidators[member] === undefined) {
        switch (member) {
          case "version": {
            memberValidators["version"] = new __CompositeStructureValidator<GuidelineVersionSummary>(
              new __CompositeValidator<GuidelineVersionSummary>([
                new __RequiredValidator(),
              ]),
              GuidelineVersionSummary.validate
            );
            break;
          }
        }
      }
      return memberValidators[member]!!;
    }
    return [
      ...getMemberValidator("version").validate(obj.version, `${path}/version`),
    ];
  }
}
