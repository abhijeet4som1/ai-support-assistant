// smithy-typescript generated code
/**
 * @public
 * @enum
 */
export const GuidelineStatus = {
  CHUNKING: "chunking",
  EMBEDDING: "embedding",
  FAILED: "failed",
  PARSING: "parsing",
  QUEUED: "queued",
  READY: "ready",
  /**
   * Replaced by a newer upload before it finished.
   */
  SUPERSEDED: "superseded",
} as const;
/**
 * @public
 */
export type GuidelineStatus = (typeof GuidelineStatus)[keyof typeof GuidelineStatus];

/**
 * @public
 * @enum
 */
export const Coverage = {
  COVERED: "covered",
  NOT_COVERED: "not_covered",
  PARTIAL: "partial",
} as const;
/**
 * @public
 */
export type Coverage = (typeof Coverage)[keyof typeof Coverage];

/**
 * @public
 * @enum
 */
export const FeedbackRating = {
  DOWN: "down",
  UP: "up",
} as const;
/**
 * @public
 */
export type FeedbackRating = (typeof FeedbackRating)[keyof typeof FeedbackRating];

/**
 * @public
 * @enum
 */
export const MessageRole = {
  ASSISTANT: "assistant",
  /**
   * A customer message pasted by the agent.
   */
  CUSTOMER: "customer",
  /**
   * An instruction from the agent to the assistant (e.g. "make it shorter").
   */
  INSTRUCTION: "instruction",
} as const;
/**
 * @public
 */
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

/**
 * @public
 * @enum
 */
export const MessageStatus = {
  FAILED: "failed",
  OK: "ok",
} as const;
/**
 * @public
 */
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

/**
 * @public
 * @enum
 */
export const MessageKind = {
  CUSTOMER: "customer",
  INSTRUCTION: "instruction",
} as const;
/**
 * @public
 */
export type MessageKind = (typeof MessageKind)[keyof typeof MessageKind];
