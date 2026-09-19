$version: "2.0"

namespace assistant.api

enum FeedbackRating {
    UP = "up"
    DOWN = "down"
}

/// A stored piece of feedback, used as a few-shot correction for future answers.
structure Correction {
    @required
    id: Id
    @required
    companyId: Id
    @required
    conversationId: Id
    @required
    messageId: Id
    @required
    rating: FeedbackRating
    /// The customer message that led to the flagged answer.
    @required
    queryText: String
    whatWasWrong: String
    correctedAnswer: String
    @required
    guidelineVersionId: Id
    /// Inactive corrections are not retrieved (e.g. tied to replaced guidelines).
    @required
    active: Boolean
    @required
    user: User
    @required
    createdAt: DateTime
}

list CorrectionList {
    member: Correction
}

/// Rate an assistant message. A thumbs-down requires the corrected answer.
@idempotent
@http(method: "PUT", uri: "/api/messages/{messageId}/feedback")
operation SubmitFeedback {
    input := {
        @required
        @httpLabel
        messageId: Id
        @required
        rating: FeedbackRating
        @length(max: 5000)
        whatWasWrong: String
        @length(max: 20000)
        correctedAnswer: String
    }
    output := {
        @required
        correction: Correction
    }
    errors: [NotFoundError, ConflictError]
}

@readonly
@http(method: "GET", uri: "/api/companies/{companyId}/corrections")
operation ListCorrections {
    input := {
        @required
        @httpLabel
        companyId: Id
        @httpQuery("includeInactive")
        includeInactive: Boolean
    }
    output := {
        @required
        items: CorrectionList
    }
    errors: [NotFoundError]
}

/// Activate or deactivate a correction.
@idempotent
@http(method: "PATCH", uri: "/api/corrections/{correctionId}")
operation UpdateCorrection {
    input := {
        @required
        @httpLabel
        correctionId: Id
        @required
        active: Boolean
    }
    output := {
        @required
        correction: Correction
    }
    errors: [NotFoundError]
}
