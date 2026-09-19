$version: "2.0"

namespace assistant.api

enum MessageRole {
    /// A customer message pasted by the agent.
    CUSTOMER = "customer"
    /// An instruction from the agent to the assistant (e.g. "make it shorter").
    INSTRUCTION = "instruction"
    ASSISTANT = "assistant"
}

enum MessageKind {
    CUSTOMER = "customer"
    INSTRUCTION = "instruction"
}

enum MessageStatus {
    OK = "ok"
    FAILED = "failed"
}

enum Coverage {
    COVERED = "covered"
    PARTIAL = "partial"
    NOT_COVERED = "not_covered"
}

structure Escalation {
    @required
    recommended: Boolean
    to: String
    reason: String
}

structure Citation {
    @required
    chunkId: Id
    title: String
}

list CitationList {
    member: Citation
}

/// Structured guidance produced by the assistant for the agent.
structure AssistantGuidance {
    @required
    coverage: Coverage
    /// Customer-facing draft; placeholders like [Name] are left for the agent.
    @required
    recommendedReply: String
    /// Internal steps for the agent, in order.
    @required
    handlingSteps: StringList
    /// Questions the customer must answer before the case can be resolved
    /// (preferences, missing details). Optional for older messages.
    clarifications: StringList
    /// Decisions the guidelines leave to the agent's judgement (never questions for the customer).
    @required
    agentDecisions: StringList
    @required
    escalation: Escalation
    @required
    citations: CitationList
    notes: String
}

structure RetrievedChunk {
    @required
    chunkId: Id
    title: String
    @required
    score: Double
}

list RetrievedChunkList {
    member: RetrievedChunk
}

structure UsedCorrection {
    @required
    correctionId: Id
    @required
    score: Double
}

list UsedCorrectionList {
    member: UsedCorrection
}

/// Feedback the current or another user left on an assistant message.
structure FeedbackSummary {
    @required
    id: Id
    @required
    rating: FeedbackRating
    whatWasWrong: String
    correctedAnswer: String
    @required
    user: User
    @required
    createdAt: DateTime
}

list FeedbackSummaryList {
    member: FeedbackSummary
}

structure Message {
    @required
    id: Id
    @required
    conversationId: Id
    @required
    role: MessageRole
    /// Raw text for customer/instruction messages; the recommended reply for
    /// assistant messages (full structure in `guidance`).
    @required
    content: String
    @required
    status: MessageStatus
    error: String
    guidance: AssistantGuidance
    retrieval: RetrievedChunkList
    correctionsUsed: UsedCorrectionList
    guidelineVersionId: Id
    model: String
    promptTokens: Integer
    completionTokens: Integer
    latencyMs: Integer
    feedback: FeedbackSummaryList
    @required
    createdBy: User
    @required
    createdAt: DateTime
}

list MessageList {
    member: Message
}

structure ConversationSummary {
    @required
    id: Id
    @required
    companyId: Id
    @required
    companyName: ShortText
    @required
    title: String
    @required
    messageCount: Integer
    lastCoverage: Coverage
    @required
    createdBy: User
    @required
    createdAt: DateTime
    @required
    lastMessageAt: DateTime
}

list ConversationSummaryList {
    member: ConversationSummary
}

structure Conversation {
    @required
    summary: ConversationSummary
    @required
    messages: MessageList
}

@http(method: "POST", uri: "/api/conversations", code: 201)
operation CreateConversation {
    input := {
        @required
        companyId: Id
    }
    output := {
        @required
        conversation: Conversation
    }
    errors: [NotFoundError, GuidelinesNotReadyError]
}

/// Lists the calling agent's own conversations, newest activity first. Conversations are private
/// to the agent who started them.
@readonly
@paginated
@http(method: "GET", uri: "/api/conversations")
operation ListConversations {
    input := {
        @httpQuery("companyId")
        companyId: Id
        @httpQuery("coverage")
        coverage: Coverage
        @httpQuery("cursor")
        cursor: Cursor
        @httpQuery("limit")
        limit: PageSize
    }
    output := {
        @required
        items: ConversationSummaryList
        nextCursor: Cursor
    }
}

/// Returns the conversation with its newest messages (chronological order). Long threads are
/// paged: pass `before` (the `olderCursor` of a previous page) to load the messages preceding it.
@readonly
@http(method: "GET", uri: "/api/conversations/{conversationId}")
operation GetConversation {
    input := {
        @required
        @httpLabel
        conversationId: Id
        /// Load messages older than this cursor (from a previous page's `olderCursor`).
        @httpQuery("before")
        before: Cursor
        /// Messages per page (default 50).
        @httpQuery("limit")
        limit: PageSize
    }
    output := {
        @required
        conversation: Conversation
        /// Present when older messages exist; pass it as `before` to load them.
        olderCursor: Cursor
    }
    errors: [NotFoundError]
}

/// Append a customer message or an agent instruction and get the assistant's
/// guidance. Both the user message and the assistant message are persisted,
/// even when the AI provider fails (assistant message has status `failed`).
@http(method: "POST", uri: "/api/conversations/{conversationId}/messages", code: 201)
operation SendMessage {
    input := {
        @required
        @httpLabel
        conversationId: Id
        @required
        kind: MessageKind
        @required
        @length(min: 1, max: 20000)
        content: String
    }
    output := {
        @required
        userMessage: Message
        @required
        assistantMessage: Message
    }
    errors: [NotFoundError, GuidelinesNotReadyError, AiProviderError]
}
