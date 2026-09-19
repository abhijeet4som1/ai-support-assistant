// smithy-typescript generated code
import type { ExceptionOptionType as __ExceptionOptionType } from "@smithy/core/client";
import { ServiceException as __BaseException } from "@smithy/server-common";

import { GuidelineStatus } from "./enums";
import { type User, ValidationExceptionField } from "./models_0";

/**
 * Generic conflict (e.g. duplicate company name).
 * @public
 */
export class ConflictError extends __BaseException {
  readonly name = "ConflictError" as const;
  readonly $fault = "client" as const;
  constructor(opts: __ExceptionOptionType<ConflictError, __BaseException>) {
    super({
      name: "ConflictError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * @public
 */
export class InternalServerError extends __BaseException {
  readonly name = "InternalServerError" as const;
  readonly $fault = "server" as const;
  requestId?: string | undefined;
  constructor(opts: __ExceptionOptionType<InternalServerError, __BaseException>) {
    super({
      name: "InternalServerError",
      $fault: "server",
      ...opts,
    });
    Object.setPrototypeOf(this, InternalServerError.prototype);
    this.requestId = opts.requestId;
  }
}

/**
 * @public
 */
export class NotFoundError extends __BaseException {
  readonly name = "NotFoundError" as const;
  readonly $fault = "client" as const;
  resource?: string | undefined;
  id?: string | undefined;
  constructor(opts: __ExceptionOptionType<NotFoundError, __BaseException>) {
    super({
      name: "NotFoundError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, NotFoundError.prototype);
    this.resource = opts.resource;
    this.id = opts.id;
  }
}

/**
 * @public
 */
export class RateLimitedError extends __BaseException {
  readonly name = "RateLimitedError" as const;
  readonly $fault = "client" as const;
  retryAfterSeconds?: number | undefined;
  constructor(opts: __ExceptionOptionType<RateLimitedError, __BaseException>) {
    super({
      name: "RateLimitedError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, RateLimitedError.prototype);
    this.retryAfterSeconds = opts.retryAfterSeconds;
  }
}

/**
 * @public
 */
export class UnauthorizedError extends __BaseException {
  readonly name = "UnauthorizedError" as const;
  readonly $fault = "client" as const;
  constructor(opts: __ExceptionOptionType<UnauthorizedError, __BaseException>) {
    super({
      name: "UnauthorizedError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * A standard error for input validation failures.
 * This should be thrown by services when a member of the input structure
 * falls outside of the modeled or documented constraints.
 * @public
 */
export class ValidationException extends __BaseException {
  readonly name = "ValidationException" as const;
  readonly $fault = "client" as const;
  /**
   * A list of specific failures encountered while validating the input.
   * A member can appear in this list more than once if it failed to satisfy multiple constraints.
   * @public
   */
  fieldList?: ValidationExceptionField[] | undefined;

  constructor(opts: __ExceptionOptionType<ValidationException, __BaseException>) {
    super({
      name: "ValidationException",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, ValidationException.prototype);
    this.fieldList = opts.fieldList;
  }
}

/**
 * The AI provider failed or timed out. Safe to retry.
 * @public
 */
export class AiProviderError extends __BaseException {
  readonly name = "AiProviderError" as const;
  readonly $fault = "server" as const;
  provider?: string | undefined;
  constructor(opts: __ExceptionOptionType<AiProviderError, __BaseException>) {
    super({
      name: "AiProviderError",
      $fault: "server",
      ...opts,
    });
    Object.setPrototypeOf(this, AiProviderError.prototype);
    this.provider = opts.provider;
  }
}

/**
 * @public
 */
export class GuidelinesNotReadyError extends __BaseException {
  readonly name = "GuidelinesNotReadyError" as const;
  readonly $fault = "client" as const;
  companyId: string | undefined;
  /**
   * Lifecycle of an uploaded guideline file.
   * @public
   */
  latestStatus?: GuidelineStatus | undefined;

  constructor(opts: __ExceptionOptionType<GuidelinesNotReadyError, __BaseException>) {
    super({
      name: "GuidelinesNotReadyError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, GuidelinesNotReadyError.prototype);
    this.companyId = opts.companyId;
    this.latestStatus = opts.latestStatus;
  }
}

/**
 * Another user uploaded guidelines after the client loaded the page.
 * @public
 */
export class GuidelinesConflictError extends __BaseException {
  readonly name = "GuidelinesConflictError" as const;
  readonly $fault = "client" as const;
  latestVersionId: string | undefined;
  uploadedBy: User | undefined;
  /**
   * ISO-8601 date-time (restJson1 would otherwise default to epoch seconds).
   * @public
   */
  uploadedAt: Date | undefined;

  constructor(opts: __ExceptionOptionType<GuidelinesConflictError, __BaseException>) {
    super({
      name: "GuidelinesConflictError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, GuidelinesConflictError.prototype);
    this.latestVersionId = opts.latestVersionId;
    this.uploadedBy = opts.uploadedBy;
    this.uploadedAt = opts.uploadedAt;
  }
}

/**
 * @public
 */
export class PayloadTooLargeError extends __BaseException {
  readonly name = "PayloadTooLargeError" as const;
  readonly $fault = "client" as const;
  maxBytes: number | undefined;
  constructor(opts: __ExceptionOptionType<PayloadTooLargeError, __BaseException>) {
    super({
      name: "PayloadTooLargeError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, PayloadTooLargeError.prototype);
    this.maxBytes = opts.maxBytes;
  }
}

/**
 * @public
 */
export class UnsupportedMediaTypeError extends __BaseException {
  readonly name = "UnsupportedMediaTypeError" as const;
  readonly $fault = "client" as const;
  supported: string[] | undefined;
  constructor(opts: __ExceptionOptionType<UnsupportedMediaTypeError, __BaseException>) {
    super({
      name: "UnsupportedMediaTypeError",
      $fault: "client",
      ...opts,
    });
    Object.setPrototypeOf(this, UnsupportedMediaTypeError.prototype);
    this.supported = opts.supported;
  }
}
